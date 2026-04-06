import xlsx from "xlsx";
import { config } from "../config.js";
import { buildCitizenHash } from "../utils/hash.js";
import { stateService } from "./stateService.js";

function normalizeBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  return normalized === "true" || normalized === "yes" || normalized === "1";
}

function normalizeDate(value) {
  if (value == null || value === "") {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  const raw = String(value).trim();

  if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) {
    const [day, month, year] = raw.split("-");
    return new Date(`${year}-${month}-${day}T00:00:00.000Z`).toISOString();
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

class DatasetService {
  constructor() {
    this.records = [];
  }

  load() {
    const workbook = xlsx.readFile(config.datasetPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });

    this.records = rows.map((row) => ({
      citizenHash: buildCitizenHash(String(row.Citizen_ID).trim(), config.salt),
      scheme: String(row.Scheme_Eligibility ?? row.Scheme ?? "").trim(),
      entitledAmount: Number(row.Scheme_Amount ?? row.Entitled_Amount ?? 0),
      accountStatus: String(row.Account_Status ?? "").trim(),
      aadhaarLinked: normalizeBoolean(row.Aadhaar_Linked),
      claimCount: Number(row.Claim_Count ?? 0),
      lastClaimDate: normalizeDate(row.Last_Claim_Date),
      regionCode: String(row.Region_Code ?? "").trim(),
      incomeTier: String(row.Income_Tier ?? "").trim(),
      fullName: String(row.Full_Name ?? row.Citizen_Name ?? "Citizen").trim()
    }));
  }

  findByCitizenHash(citizenHash) {
    return this.records.find((record) => record.citizenHash === citizenHash) || null;
  }

  getEffectiveBeneficiary(citizenHash, ledgerEntries) {
    const beneficiary = this.findByCitizenHash(citizenHash);

    if (!beneficiary) {
      return null;
    }

    const approvals = ledgerEntries.filter((entry) => entry.CitizenHash === citizenHash);
    const state = stateService.get();
    const claimOverride = state.claimOverrides[citizenHash] || null;
    const latestLedgerTimestamp = approvals.reduce((latest, entry) => {
      const current = new Date(entry.Timestamp).getTime();
      return Number.isNaN(current) ? latest : Math.max(latest, current);
    }, 0);

    const baseTimestamp = beneficiary.lastClaimDate ? new Date(beneficiary.lastClaimDate).getTime() : 0;
    const overrideTimestamp = claimOverride?.lastClaimDate ? new Date(claimOverride.lastClaimDate).getTime() : 0;
    const effectiveTimestamp = Math.max(baseTimestamp, latestLedgerTimestamp, overrideTimestamp);
    const effectiveLastClaim =
      effectiveTimestamp > 0 ? new Date(effectiveTimestamp).toISOString() : null;

    return {
      ...beneficiary,
      claimCount: Math.max(beneficiary.claimCount + approvals.length, claimOverride?.claimCount ?? 0),
      lastClaimDate: effectiveLastClaim
    };
  }
}

export const datasetService = new DatasetService();
