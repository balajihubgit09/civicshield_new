import { ledgerService } from "./ledgerService.js";
import { stateService } from "./stateService.js";

class SystemService {
  initialize() {
    const ledgerHealth = ledgerService.validateChain();

    if (!ledgerHealth.valid) {
      this.freeze("LEDGER_TAMPERED");
    }

    const state = stateService.get();
    if (state.budgetRemaining <= 0) {
      this.freeze("BUDGET_EXHAUSTED");
    }

    return this.getStatus();
  }

  logEvent(entry) {
    return stateService.update((state) => {
      state.requestLog.unshift(entry);
      state.requestLog = state.requestLog.slice(0, 500);
      return state;
    });
  }

  freeze(reason) {
    const updated = stateService.update((state) => {
      const previousReason = state.freezeReason;
      state.freezeReason = reason;
      if (reason === "BUDGET_EXHAUSTED") {
        state.budgetRemaining = 0;
      }
      state.lastFreezeEvent =
        previousReason === reason
          ? state.lastFreezeEvent
          : {
              type: "FREEZE_EVENT",
              timestamp: new Date().toISOString(),
              code: "SYSTEM_FROZEN",
              reason
            };
      return state;
    });

    if (updated.lastFreezeEvent) {
      const state = stateService.get();
      const latest = state.requestLog[0];
      if (!latest || latest.type !== "FREEZE_EVENT" || latest.reason !== reason) {
        this.logEvent(updated.lastFreezeEvent);
      }
    }

    return updated;
  }

  clearFreezeIfPausedOnly() {
    return stateService.update((state) => {
      state.adminPaused = false;
      if (state.freezeReason === "ADMIN_PAUSED") {
        state.freezeReason = null;
      }
      return state;
    });
  }

  setAdminPause(paused) {
    if (paused) {
      this.freeze("ADMIN_PAUSED");
      return stateService.update((state) => {
        state.adminPaused = true;
        return state;
      });
    }

    return this.clearFreezeIfPausedOnly();
  }

  spendBudget(amount) {
    const nextState = stateService.update((state) => {
      state.budgetRemaining = Math.max(0, state.budgetRemaining - amount);
      return state;
    });

    if (nextState.budgetRemaining === 0) {
      return this.freeze("BUDGET_EXHAUSTED");
    }

    return nextState;
  }

  tryEnqueueClaim(citizenHash) {
    const state = stateService.update((current) => {
      if (current.activeQueue.includes(citizenHash)) {
        current.queueRejected = true;
        return current;
      }

      current.activeQueue.push(citizenHash);
      current.queueRejected = false;
      return current;
    });

    return state.queueRejected !== true;
  }

  dequeueClaim(citizenHash) {
    return stateService.update((state) => {
      state.activeQueue = state.activeQueue.filter((value) => value !== citizenHash);
      delete state.queueRejected;
      return state;
    });
  }

  updateClaimHistory(citizenHash, lastClaimDate, claimCount) {
    return stateService.update((state) => {
      state.claimOverrides[citizenHash] = {
        lastClaimDate,
        claimCount
      };
      return state;
    });
  }

  getStatus() {
    const state = stateService.get();
    const ledgerHealth = ledgerService.validateChain();

    if (!ledgerHealth.valid && state.freezeReason !== "LEDGER_TAMPERED") {
      this.freeze("LEDGER_TAMPERED");
    }

    const effectiveState = stateService.get();
    let status = "ACTIVE";

    if (effectiveState.adminPaused) {
      status = "PAUSED";
    } else if (effectiveState.freezeReason === "BUDGET_EXHAUSTED") {
      status = "BUDGET_EXHAUSTED";
    } else if (effectiveState.freezeReason) {
      status = "FROZEN";
    }

    return {
      status,
      budgetRemaining: effectiveState.budgetRemaining,
      initialBudget: effectiveState.initialBudget,
      freezeReason: effectiveState.adminPaused ? "ADMIN_PAUSED" : effectiveState.freezeReason,
      adminPaused: effectiveState.adminPaused,
      ledgerHealthy: ledgerHealth.valid,
      requestLog: effectiveState.requestLog,
      activeQueueSize: effectiveState.activeQueue.length
    };
  }

  assertOperational() {
    const status = this.getStatus();

    if (status.status !== "ACTIVE") {
      const error = new Error("System is currently frozen.");
      error.statusCode = 423;
      error.code = "SYSTEM_FROZEN";
      error.details = {
        status: status.status,
        freezeReason: status.freezeReason
      };
      throw error;
    }

    return status;
  }

  buildTamperReport() {
    const ledgerHealth = ledgerService.validateChain();
    const status = this.getStatus();
    const entries = ledgerService.getEntries();
    const lastEntry = entries.length > 0 ? entries[entries.length - 1] : null;

    return {
      generatedAt: new Date().toISOString(),
      status: status.status,
      freezeReason: status.freezeReason,
      ledgerHealthy: ledgerHealth.valid,
      ledgerValidation: ledgerHealth,
      budgetRemaining: status.budgetRemaining,
      lastValidLedgerHash: lastEntry?.CurrentHash || "GENESIS",
      recentRequests: status.requestLog.slice(0, 10)
    };
  }
}

export const systemService = new SystemService();
