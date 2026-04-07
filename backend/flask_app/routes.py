import time
import uuid
from datetime import datetime, timezone

from flask import Blueprint, Response, current_app, jsonify, request

from .errors import AppError
from .security import admin_auth, rate_limit
from .services.dataset_service import dataset_service
from .services.ledger_service import ledger_service
from .services.system_service import system_service
from .services.validation_service import validation_service
from .utils.hash_utils import build_citizen_hash


public_bp = Blueprint("public", __name__)
admin_bp = Blueprint("admin", __name__)


def _now_iso():
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _validate_claim_input(body):
    citizen_id = str((body or {}).get("citizenId") or "").strip()
    scheme = str((body or {}).get("scheme") or "").strip()

    try:
        amount = float((body or {}).get("amount"))
    except (TypeError, ValueError):
        amount = float("nan")

    if not citizen_id or not scheme or amount != amount or amount <= 0:
        raise AppError(
            "Citizen ID, scheme, and a valid positive amount are required.",
            status_code=400,
            code="INVALID_INPUT",
        )

    return citizen_id, scheme, amount


@public_bp.get("/health")
def health():
    return jsonify({"ok": True, "timestamp": _now_iso(), "system": system_service.get_status()})


@public_bp.post("/claims")
@rate_limit(window_ms=60000, maximum=30, label="claims")
def submit_claim():
    citizen_hash = None
    try:
        system_service.assert_operational()
        citizen_id, scheme, amount = _validate_claim_input(request.get_json(silent=True))
        citizen_hash = build_citizen_hash(citizen_id, current_app.config["SALT"])

        if not system_service.try_enqueue_claim(citizen_hash):
            system_service.log_event(
                {
                    "type": "REQUEST_EVENT",
                    "timestamp": _now_iso(),
                    "citizenHash": citizen_hash,
                    "scheme": scheme,
                    "amount": amount,
                    "decision": "REJECTED",
                    "reason": "Duplicate concurrent claim detected in the active queue.",
                    "code": "DUPLICATE_REJECTED",
                }
            )
            return (
                jsonify(
                    {
                        "status": "REJECTED",
                        "code": "DUPLICATE_REJECTED",
                        "reason": "Duplicate concurrent claim detected in the active queue.",
                        "flags": {"duplicate": True, "replay": False},
                    }
                ),
                409,
            )

        ledger_entries = ledger_service.get_entries()
        beneficiary = dataset_service.get_effective_beneficiary(citizen_hash, ledger_entries)
        decision = validation_service.run_claim_checks(citizen_hash, scheme, amount, beneficiary)

        if not decision["approved"]:
            system_service.log_event(
                {
                    "type": "REQUEST_EVENT",
                    "timestamp": _now_iso(),
                    "citizenHash": citizen_hash,
                    "scheme": scheme,
                    "amount": amount,
                    "decision": "REJECTED",
                    "reason": decision["reason"],
                    "code": decision["code"],
                    "replaySignature": decision.get("replaySignature"),
                }
            )
            return (
                jsonify(
                    {
                        "status": "REJECTED",
                        "code": decision["code"],
                        "reason": decision["reason"],
                        "flags": {
                            "duplicate": decision["code"] in {"DUPLICATE_ACTIVE_REQUEST", "DUPLICATE_REJECTED"},
                            "replay": decision["code"] == "REPLAY_DETECTED",
                        },
                    }
                ),
                400,
            )

        timestamp = _now_iso()
        ledger_entry = ledger_service.append_entry(
            {
                "TransactionID": f"TX-{int(time.time() * 1000)}-{uuid.uuid4().hex[:8]}",
                "Timestamp": timestamp,
                "CitizenHash": citizen_hash,
                "Scheme": scheme,
                "Amount": amount,
                "Region_Code": beneficiary["regionCode"],
                "Income_Tier": beneficiary["incomeTier"],
                "GatesPassed": ["Eligibility Check", "Budget Check", "Frequency Check"],
            }
        )

        ledger_health = ledger_service.validate_chain()
        if not ledger_health["valid"]:
            system_service.freeze("LEDGER_TAMPERED")
            raise AppError(
                "Ledger integrity validation failed after insertion.",
                status_code=500,
                code="SYSTEM_FROZEN",
                details={"freezeReason": "LEDGER_TAMPERED"},
            )

        state = system_service.spend_budget(amount)
        system_service.update_claim_history(citizen_hash, timestamp, beneficiary["claimCount"] + 1)
        system_service.log_event(
            {
                "type": "REQUEST_EVENT",
                "timestamp": timestamp,
                "citizenHash": citizen_hash,
                "scheme": scheme,
                "amount": amount,
                "decision": "APPROVED",
                "reason": "Approved after three-gate validation.",
                "code": "APPROVED",
                "replaySignature": decision.get("replaySignature"),
            }
        )

        return jsonify(
            {
                "status": "APPROVED",
                "message": "Claim approved and committed to the tamper-proof ledger.",
                "transaction": ledger_entry,
                "system": {
                    "status": system_service.get_status()["status"],
                    "budgetRemaining": state["budgetRemaining"],
                },
            }
        )
    finally:
        if citizen_hash:
            system_service.dequeue_claim(citizen_hash)


def _admin_no_store(response):
    response.headers["Cache-Control"] = "no-store"
    return response


@admin_bp.get("/dashboard")
@rate_limit(window_ms=60000, maximum=60, label="admin")
@admin_auth
def admin_dashboard():
    status = system_service.get_status()
    ledger_entries = ledger_service.get_entries()
    requests = [entry for entry in status["requestLog"] if entry.get("type") == "REQUEST_EVENT"]
    freeze_events = [entry for entry in status["requestLog"] if entry.get("type") == "FREEZE_EVENT"]
    approvals = len([entry for entry in requests if entry.get("decision") == "APPROVED"])
    approval_rate = 0 if not requests else round((approvals / len(requests)) * 100, 1)
    flagged_count = len(
        [
            entry
            for entry in requests
            if entry.get("code") in {"REPLAY_DETECTED", "DUPLICATE_ACTIVE_REQUEST", "DUPLICATE_REJECTED"}
        ]
    )

    response = jsonify(
        {
            "status": status["status"],
            "freezeReason": status["freezeReason"],
            "budgetRemaining": status["budgetRemaining"],
            "initialBudget": status["initialBudget"],
            "totalTransactions": len(ledger_entries),
            "totalRequests": len(requests),
            "approvalRate": approval_rate,
            "freezeEvents": freeze_events[:10],
            "fraudSummary": {
                "flaggedRequests": flagged_count,
                "replayDetections": len([entry for entry in requests if entry.get("code") == "REPLAY_DETECTED"]),
                "duplicateDetections": len(
                    [entry for entry in requests if entry.get("code") in {"DUPLICATE_ACTIVE_REQUEST", "DUPLICATE_REJECTED"}]
                ),
            },
            "lastTransactions": list(reversed(ledger_entries[-10:])),
            "recentRequests": requests[:10],
            "ledgerHealthy": status["ledgerHealthy"],
        }
    )
    return _admin_no_store(response)


@admin_bp.post("/pause")
@rate_limit(window_ms=60000, maximum=60, label="admin")
@admin_auth
def admin_pause():
    current = system_service.get_status()
    if current["status"] != "ACTIVE":
        return _admin_no_store(
            jsonify(
                {
                    "error": "PAUSE_NOT_ALLOWED",
                    "message": "Emergency pause is allowed only while the system is active.",
                }
            )
        ), 409

    state = system_service.set_admin_pause(True)
    return _admin_no_store(
        jsonify(
            {
                "status": "PAUSED",
                "freezeReason": "ADMIN_PAUSED",
                "budgetRemaining": state["budgetRemaining"],
            }
        )
    )


@admin_bp.post("/resume")
@rate_limit(window_ms=60000, maximum=60, label="admin")
@admin_auth
def admin_resume():
    current = system_service.get_status()
    if not current["adminPaused"]:
        return _admin_no_store(
            jsonify(
                {
                    "error": "RESUME_NOT_ALLOWED",
                    "message": "Resume is allowed only when the system is paused by an administrator.",
                }
            )
        ), 409

    state = system_service.set_admin_pause(False)
    status = system_service.get_status()
    return _admin_no_store(
        jsonify(
            {
                "status": status["status"],
                "freezeReason": status["freezeReason"],
                "budgetRemaining": state["budgetRemaining"],
            }
        )
    )


@admin_bp.get("/report/download")
@rate_limit(window_ms=60000, maximum=60, label="admin")
@admin_auth
def download_report():
    status = system_service.get_status()
    if status["status"] != "FROZEN":
        return _admin_no_store(
            jsonify(
                {
                    "error": "REPORT_NOT_AVAILABLE",
                    "message": "Tamper report download is available only when the system is frozen.",
                }
            )
        ), 409

    report = system_service.build_tamper_report()
    response = Response(response=current_app.json.dumps(report, indent=2), mimetype="application/json")
    response.headers["Content-Disposition"] = 'attachment; filename="civicshield-tamper-report.json"'
    return _admin_no_store(response)


@admin_bp.get("/registry")
@rate_limit(window_ms=60000, maximum=60, label="admin")
@admin_auth
def admin_registry():
    ledger_entries = ledger_service.get_entries()
    records = []
    for record in dataset_service.records:
        effective = dataset_service.get_effective_beneficiary(record["citizenHash"], ledger_entries)
        records.append(
            {
                "CitizenHash": effective["citizenHash"],
                "Scheme": effective["scheme"],
                "Amount": effective["entitledAmount"],
                "Account_Status": effective["accountStatus"],
                "Aadhaar_Linked": effective["aadhaarLinked"],
                "Claim_Count": effective["claimCount"],
                "Last_Claim_Date": effective["lastClaimDate"],
                "Region_Code": effective["regionCode"],
                "Income_Tier": effective["incomeTier"],
            }
        )

    return _admin_no_store(jsonify({"total": len(records), "records": records}))
