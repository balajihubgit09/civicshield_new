import { buildReplaySignature } from "../utils/hash.js";
import { ledgerService } from "./ledgerService.js";
import { systemService } from "./systemService.js";

const TEN_MINUTES_MS = 10 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

class ValidationService {
  runClaimChecks({ citizenHash, scheme, amount, beneficiary }) {
    const now = Date.now();
    const status = systemService.getStatus();
    const replaySignature = buildReplaySignature(citizenHash, scheme, amount);
    const matchingRequests = status.requestLog.filter((entry) => entry.replaySignature === replaySignature);
    const lastReplay = matchingRequests[0];

    if (lastReplay && now - new Date(lastReplay.timestamp).getTime() < TEN_MINUTES_MS) {
      return { approved: false, code: "REPLAY_DETECTED", reason: "Replay attack detected. Identical request seen within 10 minutes.", replaySignature };
    }

    const ledgerEntries = ledgerService.getEntries();
    const activeDuplicate = ledgerEntries.find(
      (entry) =>
        entry.CitizenHash === citizenHash &&
        entry.Scheme === scheme &&
        Number(entry.Amount) === Number(amount) &&
        now - new Date(entry.Timestamp).getTime() < THIRTY_DAYS_MS
    );

    if (activeDuplicate) {
      return { approved: false, code: "DUPLICATE_ACTIVE_REQUEST", reason: "Duplicate active request detected for the same scheme and amount.", replaySignature };
    }

    if (!beneficiary) {
      return { approved: false, code: "NOT_FOUND", reason: "Citizen record not found in the welfare dataset.", replaySignature };
    }

    if (beneficiary.accountStatus !== "Active") {
      return { approved: false, code: "ACCOUNT_INACTIVE", reason: "Account status is not Active.", replaySignature };
    }

    if (!beneficiary.aadhaarLinked) {
      return { approved: false, code: "AADHAAR_NOT_LINKED", reason: "Aadhaar linkage is required for this claim.", replaySignature };
    }

    if (beneficiary.scheme !== scheme) {
      return { approved: false, code: "SCHEME_MISMATCH", reason: "Requested scheme does not match the beneficiary record.", replaySignature };
    }

    if (Number(beneficiary.entitledAmount) !== Number(amount)) {
      return { approved: false, code: "AMOUNT_MISMATCH", reason: "Requested amount does not match the approved scheme amount.", replaySignature };
    }

    if (beneficiary.claimCount > 3) {
      return { approved: false, code: "CLAIM_LIMIT_EXCEEDED", reason: "Claim count exceeded the allowed limit.", replaySignature };
    }

    const lastClaimTime = new Date(beneficiary.lastClaimDate).getTime();
    if (!Number.isNaN(lastClaimTime) && now - lastClaimTime < THIRTY_DAYS_MS) {
      return { approved: false, code: "FREQUENCY_VIOLATION", reason: "Last approved claim is less than 30 days old.", replaySignature };
    }

    const systemStatus = systemService.getStatus();
    if (systemStatus.budgetRemaining < Number(amount)) {
      return { approved: false, code: "INSUFFICIENT_BUDGET", reason: "Budget check failed. Remaining budget is insufficient.", replaySignature };
    }

    return {
      approved: true,
      replaySignature
    };
  }
}

export const validationService = new ValidationService();
