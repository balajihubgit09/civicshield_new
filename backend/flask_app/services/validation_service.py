from datetime import datetime, timedelta, timezone

from ..utils.hash_utils import build_replay_signature
from .ledger_service import ledger_service
from .system_service import system_service


TEN_MINUTES = timedelta(minutes=10)
THIRTY_DAYS = timedelta(days=30)


def _parse_timestamp(value):
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return None


class ValidationService:
    def run_claim_checks(self, citizen_hash, scheme, amount, beneficiary):
        now = datetime.now(timezone.utc)
        status = system_service.get_status()
        replay_signature = build_replay_signature(citizen_hash, scheme, amount)
        matching_requests = [entry for entry in status["requestLog"] if entry.get("replaySignature") == replay_signature]
        last_replay = matching_requests[0] if matching_requests else None

        if last_replay:
          last_time = _parse_timestamp(last_replay["timestamp"])
          if last_time and now - last_time < TEN_MINUTES:
              return {
                  "approved": False,
                  "code": "REPLAY_DETECTED",
                  "reason": "Replay attack detected. Identical request seen within 10 minutes.",
                  "replaySignature": replay_signature,
              }

        ledger_entries = ledger_service.get_entries()
        for entry in ledger_entries:
            entry_time = _parse_timestamp(entry["Timestamp"])
            if (
                entry["CitizenHash"] == citizen_hash
                and entry["Scheme"] == scheme
                and float(entry["Amount"]) == float(amount)
                and entry_time
                and now - entry_time < THIRTY_DAYS
            ):
                return {
                    "approved": False,
                    "code": "DUPLICATE_ACTIVE_REQUEST",
                    "reason": "Duplicate active request detected for the same scheme and amount.",
                    "replaySignature": replay_signature,
                }

        if beneficiary is None:
            return {
                "approved": False,
                "code": "NOT_FOUND",
                "reason": "Citizen record not found in the welfare dataset.",
                "replaySignature": replay_signature,
            }

        if beneficiary["accountStatus"] != "Active":
            return {
                "approved": False,
                "code": "ACCOUNT_INACTIVE",
                "reason": "Account status is not Active.",
                "replaySignature": replay_signature,
            }

        if not beneficiary["aadhaarLinked"]:
            return {
                "approved": False,
                "code": "AADHAAR_NOT_LINKED",
                "reason": "Aadhaar linkage is required for this claim.",
                "replaySignature": replay_signature,
            }

        if beneficiary["scheme"] != scheme:
            return {
                "approved": False,
                "code": "SCHEME_MISMATCH",
                "reason": "Requested scheme does not match the beneficiary record.",
                "replaySignature": replay_signature,
            }

        if float(beneficiary["entitledAmount"]) != float(amount):
            return {
                "approved": False,
                "code": "AMOUNT_MISMATCH",
                "reason": "Requested amount does not match the approved scheme amount.",
                "replaySignature": replay_signature,
            }

        if beneficiary["claimCount"] > 3:
            return {
                "approved": False,
                "code": "CLAIM_LIMIT_EXCEEDED",
                "reason": "Claim count exceeded the allowed limit.",
                "replaySignature": replay_signature,
            }

        last_claim_time = _parse_timestamp(beneficiary["lastClaimDate"]) if beneficiary.get("lastClaimDate") else None
        if last_claim_time and now - last_claim_time < THIRTY_DAYS:
            return {
                "approved": False,
                "code": "FREQUENCY_VIOLATION",
                "reason": "Last approved claim is less than 30 days old.",
                "replaySignature": replay_signature,
            }

        system_status = system_service.get_status()
        if system_status["budgetRemaining"] < float(amount):
            return {
                "approved": False,
                "code": "INSUFFICIENT_BUDGET",
                "reason": "Budget check failed. Remaining budget is insufficient.",
                "replaySignature": replay_signature,
            }

        return {"approved": True, "replaySignature": replay_signature}


validation_service = ValidationService()
