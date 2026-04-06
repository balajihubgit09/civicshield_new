import express from "express";
import { randomUUID } from "crypto";
import { datasetService } from "../services/datasetService.js";
import { ledgerService } from "../services/ledgerService.js";
import { systemService } from "../services/systemService.js";
import { validationService } from "../services/validationService.js";
import { buildCitizenHash } from "../utils/hash.js";
import { config } from "../config.js";

const router = express.Router();

function validateClaimInput(body) {
  const citizenId = String(body.citizenId || "").trim();
  const scheme = String(body.scheme || "").trim();
  const amount = Number(body.amount);

  if (!citizenId || !scheme || !Number.isFinite(amount) || amount <= 0) {
    const error = new Error("Citizen ID, scheme, and a valid positive amount are required.");
    error.statusCode = 400;
    error.code = "INVALID_INPUT";
    throw error;
  }

  return { citizenId, scheme, amount };
}

router.get("/health", (req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    system: systemService.getStatus()
  });
});

router.post("/claims", (req, res, next) => {
  let citizenHash = null;

  try {
    systemService.assertOperational();

    const { citizenId, scheme, amount } = validateClaimInput(req.body);
    citizenHash = buildCitizenHash(citizenId, config.salt);

    if (!systemService.tryEnqueueClaim(citizenHash)) {
      systemService.logEvent({
        type: "REQUEST_EVENT",
        timestamp: new Date().toISOString(),
        citizenHash,
        scheme,
        amount,
        decision: "REJECTED",
        reason: "Duplicate concurrent claim detected in the active queue.",
        code: "DUPLICATE_REJECTED"
      });

      return res.status(409).json({
        status: "REJECTED",
        code: "DUPLICATE_REJECTED",
        reason: "Duplicate concurrent claim detected in the active queue.",
        flags: {
          duplicate: true,
          replay: false
        }
      });
    }

    const ledgerEntries = ledgerService.getEntries();
    const beneficiary = datasetService.getEffectiveBeneficiary(citizenHash, ledgerEntries);
    const decision = validationService.runClaimChecks({ citizenHash, scheme, amount, beneficiary });

    if (!decision.approved) {
      systemService.logEvent({
        type: "REQUEST_EVENT",
        timestamp: new Date().toISOString(),
        citizenHash,
        scheme,
        amount,
        decision: "REJECTED",
        reason: decision.reason,
        code: decision.code,
        replaySignature: decision.replaySignature || null
      });

      return res.status(400).json({
        status: "REJECTED",
        code: decision.code,
        reason: decision.reason,
        flags: {
          duplicate: decision.code === "DUPLICATE_ACTIVE_REQUEST" || decision.code === "DUPLICATE_REJECTED",
          replay: decision.code === "REPLAY_DETECTED"
        }
      });
    }

    const timestamp = new Date().toISOString();
    const ledgerEntry = ledgerService.appendEntry({
      TransactionID: `TX-${Date.now()}-${randomUUID().slice(0, 8)}`,
      Timestamp: timestamp,
      CitizenHash: citizenHash,
      Scheme: scheme,
      Amount: amount,
      Region_Code: beneficiary.regionCode,
      Income_Tier: beneficiary.incomeTier,
      GatesPassed: ["Eligibility Check", "Budget Check", "Frequency Check"]
    });

    const ledgerHealth = ledgerService.validateChain();
    if (!ledgerHealth.valid) {
      systemService.freeze("LEDGER_TAMPERED");
      const error = new Error("Ledger integrity validation failed after insertion.");
      error.statusCode = 500;
      error.code = "SYSTEM_FROZEN";
      error.details = { freezeReason: "LEDGER_TAMPERED" };
      throw error;
    }

    const state = systemService.spendBudget(amount);
    systemService.updateClaimHistory(citizenHash, timestamp, beneficiary.claimCount + 1);
    systemService.logEvent({
      type: "REQUEST_EVENT",
      timestamp,
      citizenHash,
      scheme,
      amount,
      decision: "APPROVED",
      reason: "Approved after three-gate validation.",
      code: "APPROVED",
      replaySignature: decision.replaySignature
    });

    return res.json({
      status: "APPROVED",
      message: "Claim approved and committed to the tamper-proof ledger.",
      transaction: ledgerEntry,
      system: {
        status: systemService.getStatus().status,
        budgetRemaining: state.budgetRemaining
      }
    });
  } catch (error) {
    return next(error);
  } finally {
    if (citizenHash) {
      systemService.dequeueClaim(citizenHash);
    }
  }
});

export default router;
