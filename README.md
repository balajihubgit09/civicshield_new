# CivicShield

CivicShield is a Track 1 welfare disbursement validation platform built around a strict sequential verification engine. Every claim is hashed, screened through ordered gates, and written to a tamper-evident ledger only after full approval.

## Track Alignment

- Track: `Track 1`
- Theme: `SDG 16 — Peace, Justice & Strong Institutions | SDG 1 — No Poverty`
- Dataset loaded on startup: [CivicShield_Dataset.xlsx](/c:/Users/BALAJI/evlove/civicshield/backend/data/CivicShield_Dataset.xlsx)

## Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Dataset Source: Excel `.xlsx`
- Persistent runtime storage:
  - [ledger.json](/c:/Users/BALAJI/evlove/civicshield/backend/data/ledger.json)
  - [state.json](/c:/Users/BALAJI/evlove/civicshield/backend/data/state.json)

## Project Structure

```text
civicshield/
  frontend/
  backend/
  README.md
```

## Implemented Features

- SHA-256 identity hashing using `CitizenHash = SHA256(Citizen_ID + Salt)`
- No raw `Citizen_ID` values stored in ledger entries or admin-visible records
- Duplicate concurrent claim rejection through an active processing queue
- Replay detection for identical claims within 10 minutes
- Three-gate sequential verification
- Fixed budget enforcement starting at `Rs. 10,00,000`
- 30-day frequency abuse detection
- Immutable JSON ledger with chained hashes
- Full chain validation after every append
- Automatic system freeze on:
  - ledger tampering
  - budget exhaustion
  - admin emergency pause
- Admin dashboard with:
  - auto-refresh every 5 seconds
  - system status
  - budget remaining
  - total transactions
  - approval rate
  - fraud summary
  - last 10 ledger transactions
  - registry viewer
- Tamper report download when frozen
- Basic Auth protection on all admin endpoints

## Important Dataset Behavior

The application loads your provided dataset from [CivicShield_Dataset.xlsx](/c:/Users/BALAJI/evlove/civicshield/backend/data/CivicShield_Dataset.xlsx) at startup and does **not** modify the Excel file.

Because you requested the workbook remain unchanged:
- the Excel file is treated as read-only source data
- newly approved claim history is persisted in [state.json](/c:/Users/BALAJI/evlove/civicshield/backend/data/state.json)
- immutable approvals are persisted in [ledger.json](/c:/Users/BALAJI/evlove/civicshield/backend/data/ledger.json)
- effective `Claim_Count` and `Last_Claim_Date` are computed from dataset + runtime history

## Quick Start

### 1. Install dependencies

From the project root:

```bash
npm install
```

### 2. Run the app

From the project root:

```bash
npm run dev
```

Or run the services separately.

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

### 3. Open the app

- Frontend UI: `http://localhost:5173`
- Backend API health: `http://localhost:4000/api/health`

If PowerShell blocks `npm`, use:

```powershell
npm.cmd install
npm.cmd run dev
```

## Environment

Defaults are defined in [backend/.env.example](/c:/Users/BALAJI/evlove/civicshield/backend/.env.example):

```env
PORT=4000
CITIZEN_HASH_SALT=CIVICSHIELD_2026_HACKATHON_SALT
ADMIN_USERNAME=admin
ADMIN_PASSWORD=civicshield123
INITIAL_BUDGET=1000000
```

Create `backend/.env` if you want to override these values.

## Validation Pipeline

### Component 1 — Identity Hash Validator

- Incoming `Citizen_ID` is converted immediately to `CitizenHash`
- Raw ID is never stored in ledger entries
- Duplicate concurrent claim check:
  - if the same `CitizenHash` is already in the active queue, the request is rejected with `DUPLICATE_REJECTED`
- Replay detection:
  - if the same `CitizenHash` submits the same `Scheme` and `Amount` within 10 minutes of any previous attempt, the request is rejected with `REPLAY_DETECTED`

### Component 2 — Three-Gate Sequential Verification

Gate 1 — Eligibility:
- citizen exists in dataset
- `Account_Status = Active`
- `Aadhaar_Linked = TRUE`
- requested scheme matches exactly
- requested amount matches exactly
- `Claim_Count <= 3`

Gate 2 — Budget Integrity:
- starting budget = `Rs. 10,00,000`
- budget decremented only after full approval
- request rejected if approval would reduce budget below `0`
- system auto-locks when budget reaches `0`

Gate 3 — Frequency Abuse Detection:
- citizen cannot receive approved disbursement within 30 days of `Last_Claim_Date`
- on approval, effective claim history is updated in runtime state

## Ledger Design

Approved claims are appended to [ledger.json](/c:/Users/BALAJI/evlove/civicshield/backend/data/ledger.json).

Each record contains:
- `TransactionID`
- `Timestamp`
- `CitizenHash`
- `Scheme`
- `Amount`
- `Region_Code`
- `Income_Tier`
- `GatesPassed`
- `PreviousHash`
- `CurrentHash`

Hash rule:

```text
CurrentHash = SHA256(Timestamp + CitizenHash + Scheme + Amount + PreviousHash)
```

After every append:
- the full chain is revalidated
- any mismatch freezes the system immediately

## Automatic System Lock

The system freezes automatically when:

1. ledger hash mismatch is detected
2. budget reaches `0`
3. admin triggers emergency pause

When frozen:
- incoming claims are blocked
- freeze reason is exposed in the API and UI
- freeze event is recorded in runtime logs
- resume is allowed only for `ADMIN_PAUSED`

## Admin Dashboard

Admin dashboard capabilities:

- live status badge:
  - `ACTIVE`
  - `PAUSED`
  - `FROZEN`
  - `BUDGET_EXHAUSTED`
- budget remaining
- total processed transactions
- approval rate
- last 10 transactions
- fraud summary
- registry viewer
- pause
- resume only while paused
- tamper report download only while frozen

### Admin Credentials

- Username: `admin`
- Password: `civicshield123`

## Admin API Summary

- `GET /api/admin/dashboard`
- `GET /api/admin/registry`
- `POST /api/admin/pause`
- `POST /api/admin/resume`
- `GET /api/admin/report/download`

All admin endpoints require Basic Auth.

## Demo Flow

1. Start frontend and backend
2. Open `http://localhost:5173`
3. Submit a valid claim from the Excel dataset
4. Submit the same claim again within 10 minutes to show `REPLAY_DETECTED`
5. Open Admin Dashboard
6. Show:
   - live status
   - budget remaining
   - fraud summary
   - last 10 transactions
   - registry viewer
7. Trigger Emergency Pause
8. Show that claims are blocked
9. Resume from paused state
10. Tamper with [ledger.json](/c:/Users/BALAJI/evlove/civicshield/backend/data/ledger.json) and restart or hit the dashboard to demonstrate freeze behavior

## Notes

- The app is backend-enforced; the frontend cannot bypass the gate sequence
- The dataset is loaded from the provided workbook, not hardcoded
- All SHA-256 operations are implemented locally in backend code
- Ledger is human-readable JSON for evaluator tampering tests
