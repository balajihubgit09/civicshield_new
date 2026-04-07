from datetime import datetime, timedelta, timezone

from flask import current_app

from ..utils.hash_utils import build_citizen_hash
from ..utils.xlsx_reader import read_first_sheet_rows
from .state_service import state_service


def _normalize_boolean(value):
    if isinstance(value, bool):
        return value

    normalized = str(value or "").strip().lower()
    return normalized in {"true", "yes", "1"}


def _normalize_date(value):
    if value in (None, ""):
        return None

    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")

    raw = str(value).strip()
    if not raw:
        return None

    if raw.replace(".", "", 1).isdigit():
        base = datetime(1899, 12, 30, tzinfo=timezone.utc)
        parsed = base + timedelta(days=float(raw))
        return parsed.isoformat().replace("+00:00", "Z")

    if len(raw) == 10 and raw[2] == "-" and raw[5] == "-":
        day, month, year = raw.split("-")
        return datetime(int(year), int(month), int(day), tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")

    try:
        parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        return None

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


class DatasetService:
    def __init__(self):
        self.records = []

    def load(self):
        config = current_app.config
        rows = read_first_sheet_rows(config["DATASET_PATH"])
        if not rows:
            self.records = []
            return

        headers = [str(value or "").strip() for value in rows[0]]
        records = []
        for row in rows[1:]:
            data = {headers[index]: row[index] if index < len(row) else None for index in range(len(headers))}
            citizen_id = str(data.get("Citizen_ID") or "").strip()
            if not citizen_id:
                continue

            records.append(
                {
                    "citizenHash": build_citizen_hash(citizen_id, config["SALT"]),
                    "scheme": str(data.get("Scheme_Eligibility") or data.get("Scheme") or "").strip(),
                    "entitledAmount": float(data.get("Scheme_Amount") or data.get("Entitled_Amount") or 0),
                    "accountStatus": str(data.get("Account_Status") or "").strip(),
                    "aadhaarLinked": _normalize_boolean(data.get("Aadhaar_Linked")),
                    "claimCount": int(float(data.get("Claim_Count") or 0)),
                    "lastClaimDate": _normalize_date(data.get("Last_Claim_Date")),
                    "regionCode": str(data.get("Region_Code") or "").strip(),
                    "incomeTier": str(data.get("Income_Tier") or "").strip(),
                    "fullName": str(data.get("Full_Name") or data.get("Citizen_Name") or "Citizen").strip(),
                }
            )

        self.records = records

    def find_by_citizen_hash(self, citizen_hash):
        for record in self.records:
            if record["citizenHash"] == citizen_hash:
                return record
        return None

    def get_effective_beneficiary(self, citizen_hash, ledger_entries):
        beneficiary = self.find_by_citizen_hash(citizen_hash)
        if beneficiary is None:
            return None

        approvals = [entry for entry in ledger_entries if entry["CitizenHash"] == citizen_hash]
        state = state_service.get()
        claim_override = state["claimOverrides"].get(citizen_hash)

        latest_ledger_timestamp = 0
        for entry in approvals:
            try:
                current = datetime.fromisoformat(entry["Timestamp"].replace("Z", "+00:00")).timestamp()
            except ValueError:
                current = 0
            latest_ledger_timestamp = max(latest_ledger_timestamp, current)

        def timestamp_from_iso(value):
            if not value:
                return 0
            try:
                return datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp()
            except ValueError:
                return 0

        base_timestamp = timestamp_from_iso(beneficiary["lastClaimDate"])
        override_timestamp = timestamp_from_iso(claim_override.get("lastClaimDate") if claim_override else None)
        effective_timestamp = max(base_timestamp, latest_ledger_timestamp, override_timestamp)
        effective_last_claim = (
            datetime.fromtimestamp(effective_timestamp, tz=timezone.utc).isoformat().replace("+00:00", "Z")
            if effective_timestamp > 0
            else None
        )

        return {
            **beneficiary,
            "claimCount": max(beneficiary["claimCount"] + len(approvals), (claim_override or {}).get("claimCount", 0)),
            "lastClaimDate": effective_last_claim,
        }


dataset_service = DatasetService()
