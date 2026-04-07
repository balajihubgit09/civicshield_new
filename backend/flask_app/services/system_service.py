from datetime import datetime, timezone

from .ledger_service import ledger_service
from .state_service import state_service


class SystemService:
    def initialize(self):
        ledger_health = ledger_service.validate_chain()
        if not ledger_health["valid"]:
            self.freeze("LEDGER_TAMPERED")

        state = state_service.get()
        if state["budgetRemaining"] <= 0:
            self.freeze("BUDGET_EXHAUSTED")

        return self.get_status()

    def log_event(self, entry):
        return state_service.update(lambda state: self._append_log(state, entry))

    def _append_log(self, state, entry):
        state["requestLog"].insert(0, entry)
        state["requestLog"] = state["requestLog"][:500]
        return state

    def freeze(self, reason):
        updated = state_service.update(lambda state: self._freeze_state(state, reason))

        if updated.get("lastFreezeEvent"):
            state = state_service.get()
            latest = state["requestLog"][0] if state["requestLog"] else None
            if not latest or latest.get("type") != "FREEZE_EVENT" or latest.get("reason") != reason:
                self.log_event(updated["lastFreezeEvent"])

        return updated

    def _freeze_state(self, state, reason):
        previous_reason = state.get("freezeReason")
        state["freezeReason"] = reason
        if reason == "BUDGET_EXHAUSTED":
            state["budgetRemaining"] = 0
        state["lastFreezeEvent"] = (
            state.get("lastFreezeEvent")
            if previous_reason == reason
            else {
                "type": "FREEZE_EVENT",
                "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                "code": "SYSTEM_FROZEN",
                "reason": reason,
            }
        )
        return state

    def clear_freeze_if_paused_only(self):
        def mutator(state):
            state["adminPaused"] = False
            if state.get("freezeReason") == "ADMIN_PAUSED":
                state["freezeReason"] = None
            return state

        return state_service.update(mutator)

    def set_admin_pause(self, paused):
        if paused:
            self.freeze("ADMIN_PAUSED")
            return state_service.update(lambda state: {**state, "adminPaused": True})

        return self.clear_freeze_if_paused_only()

    def spend_budget(self, amount):
        next_state = state_service.update(
            lambda state: {**state, "budgetRemaining": max(0, state["budgetRemaining"] - amount)}
        )

        if next_state["budgetRemaining"] == 0:
            return self.freeze("BUDGET_EXHAUSTED")

        return next_state

    def try_enqueue_claim(self, citizen_hash):
        def mutator(state):
            if citizen_hash in state["activeQueue"]:
                state["queueRejected"] = True
                return state
            state["activeQueue"].append(citizen_hash)
            state["queueRejected"] = False
            return state

        state = state_service.update(mutator)
        return state.get("queueRejected") is not True

    def dequeue_claim(self, citizen_hash):
        def mutator(state):
            state["activeQueue"] = [value for value in state["activeQueue"] if value != citizen_hash]
            state.pop("queueRejected", None)
            return state

        return state_service.update(mutator)

    def update_claim_history(self, citizen_hash, last_claim_date, claim_count):
        def mutator(state):
            state["claimOverrides"][citizen_hash] = {
                "lastClaimDate": last_claim_date,
                "claimCount": claim_count,
            }
            return state

        return state_service.update(mutator)

    def get_status(self):
        state = state_service.get()
        ledger_health = ledger_service.validate_chain()

        if not ledger_health["valid"] and state.get("freezeReason") != "LEDGER_TAMPERED":
            self.freeze("LEDGER_TAMPERED")

        effective_state = state_service.get()
        status = "ACTIVE"
        if effective_state["adminPaused"]:
            status = "PAUSED"
        elif effective_state.get("freezeReason") == "BUDGET_EXHAUSTED":
            status = "BUDGET_EXHAUSTED"
        elif effective_state.get("freezeReason"):
            status = "FROZEN"

        return {
            "status": status,
            "budgetRemaining": effective_state["budgetRemaining"],
            "initialBudget": effective_state["initialBudget"],
            "freezeReason": "ADMIN_PAUSED" if effective_state["adminPaused"] else effective_state.get("freezeReason"),
            "adminPaused": effective_state["adminPaused"],
            "ledgerHealthy": ledger_health["valid"],
            "requestLog": effective_state["requestLog"],
            "activeQueueSize": len(effective_state["activeQueue"]),
        }

    def assert_operational(self):
        status = self.get_status()
        if status["status"] != "ACTIVE":
            from ..errors import AppError

            raise AppError(
                "System is currently frozen.",
                status_code=423,
                code="SYSTEM_FROZEN",
                details={"status": status["status"], "freezeReason": status["freezeReason"]},
            )
        return status

    def build_tamper_report(self):
        ledger_health = ledger_service.validate_chain()
        status = self.get_status()
        entries = ledger_service.get_entries()
        last_entry = entries[-1] if entries else None
        return {
            "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "status": status["status"],
            "freezeReason": status["freezeReason"],
            "ledgerHealthy": ledger_health["valid"],
            "ledgerValidation": ledger_health,
            "budgetRemaining": status["budgetRemaining"],
            "lastValidLedgerHash": last_entry["CurrentHash"] if last_entry else "GENESIS",
            "recentRequests": status["requestLog"][:10],
        }


system_service = SystemService()
