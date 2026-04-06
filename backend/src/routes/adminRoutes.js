import express from "express";
import { adminAuth } from "../middleware/auth.js";
import { datasetService } from "../services/datasetService.js";
import { ledgerService } from "../services/ledgerService.js";
import { systemService } from "../services/systemService.js";

const router = express.Router();

router.use(adminAuth);
router.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

router.get("/dashboard", (req, res) => {
  const status = systemService.getStatus();
  const ledgerEntries = ledgerService.getEntries();
  const requests = status.requestLog.filter((entry) => entry.type === "REQUEST_EVENT");
  const freezeEvents = status.requestLog.filter((entry) => entry.type === "FREEZE_EVENT");
  const approvals = requests.filter((entry) => entry.decision === "APPROVED").length;
  const approvalRate = requests.length === 0 ? 0 : Number(((approvals / requests.length) * 100).toFixed(1));
  const flaggedCount = requests.filter(
    (entry) =>
      entry.code === "REPLAY_DETECTED" ||
      entry.code === "DUPLICATE_ACTIVE_REQUEST" ||
      entry.code === "DUPLICATE_REJECTED"
  ).length;

  res.json({
    status: status.status,
    freezeReason: status.freezeReason,
    budgetRemaining: status.budgetRemaining,
    initialBudget: status.initialBudget,
    totalTransactions: ledgerEntries.length,
    totalRequests: requests.length,
    approvalRate,
    freezeEvents: freezeEvents.slice(0, 10),
    fraudSummary: {
      flaggedRequests: flaggedCount,
      replayDetections: requests.filter((entry) => entry.code === "REPLAY_DETECTED").length,
      duplicateDetections: requests.filter(
        (entry) => entry.code === "DUPLICATE_ACTIVE_REQUEST" || entry.code === "DUPLICATE_REJECTED"
      ).length
    },
    lastTransactions: ledgerEntries.slice(-10).reverse(),
    recentRequests: requests.slice(0, 10),
    ledgerHealthy: status.ledgerHealthy
  });
});

router.post("/pause", (req, res) => {
  const current = systemService.getStatus();
  if (current.status !== "ACTIVE") {
    return res.status(409).json({
      error: "PAUSE_NOT_ALLOWED",
      message: "Emergency pause is allowed only while the system is active."
    });
  }

  const state = systemService.setAdminPause(true);
  res.json({
    status: "PAUSED",
    freezeReason: "ADMIN_PAUSED",
    budgetRemaining: state.budgetRemaining
  });
});

router.post("/resume", (req, res) => {
  const current = systemService.getStatus();
  if (!current.adminPaused) {
    return res.status(409).json({
      error: "RESUME_NOT_ALLOWED",
      message: "Resume is allowed only when the system is paused by an administrator."
    });
  }

  const state = systemService.setAdminPause(false);
  const status = systemService.getStatus();
  res.json({
    status: status.status,
    freezeReason: status.freezeReason,
    budgetRemaining: state.budgetRemaining
  });
});

router.get("/report/download", (req, res) => {
  const status = systemService.getStatus();
  if (status.status !== "FROZEN") {
    return res.status(409).json({
      error: "REPORT_NOT_AVAILABLE",
      message: "Tamper report download is available only when the system is frozen."
    });
  }

  const report = systemService.buildTamperReport();
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", "attachment; filename=\"civicshield-tamper-report.json\"");
  res.send(JSON.stringify(report, null, 2));
});

router.get("/registry", (req, res) => {
  const ledgerEntries = ledgerService.getEntries();
  const records = datasetService.records.map((record) => {
    const effective = datasetService.getEffectiveBeneficiary(record.citizenHash, ledgerEntries);
    return {
      CitizenHash: effective.citizenHash,
      Scheme: effective.scheme,
      Amount: effective.entitledAmount,
      Account_Status: effective.accountStatus,
      Aadhaar_Linked: effective.aadhaarLinked,
      Claim_Count: effective.claimCount,
      Last_Claim_Date: effective.lastClaimDate,
      Region_Code: effective.regionCode,
      Income_Tier: effective.incomeTier
    };
  });

  res.json({
    total: records.length,
    records
  });
});

export default router;
