import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { fetchHealth, submitClaim } from "../lib/api.js";
import StatusBadge from "../components/StatusBadge.jsx";

const initialForm = {
  citizenId: "",
  scheme: "",
  amount: ""
};

export default function UserPage({ session, onLogout }) {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [system, setSystem] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadSystem() {
    try {
      const payload = await fetchHealth();
      setSystem(payload.system);
    } catch (error) {
      setSystem(null);
    }
  }

  useEffect(() => {
    loadSystem();
  }, []);

  useEffect(() => {
    if (!session?.citizenId) {
      return;
    }

    setForm((current) => ({
      ...current,
      citizenId: session.citizenId
    }));
  }, [session]);

  const freezeVisible = system && system.status !== "ACTIVE";
  const ctaDisabled = loading || freezeVisible;
  const helperText = useMemo(() => {
    if (!system) {
      return "Backend connection pending.";
    }

    if (freezeVisible) {
      return `System frozen: ${system.freezeReason || system.status}. Claims are blocked until resolved.`;
    }

    return "Eligibility, budget, and frequency checks will run before ledger commit.";
  }, [freezeVisible, system]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const payload = await submitClaim({
        citizenId: form.citizenId.trim(),
        scheme: form.scheme.trim(),
        amount: Number(form.amount)
      });

      setResult({
        tone: "success",
        title: "Approved",
        message: payload.message,
        details: payload.transaction
      });
      setForm({
        ...initialForm,
        citizenId: session?.citizenId || ""
      });
    } catch (error) {
      const freezeReason = error.payload?.details?.freezeReason;
      setResult({
        tone: "danger",
        title: error.payload?.error === "SYSTEM_FROZEN" ? "System Frozen" : "Rejected",
        message: error.payload?.reason || error.payload?.message || "Unable to process claim.",
        details: error.payload?.flags || null,
        freezeReason
      });
    } finally {
      setLoading(false);
      loadSystem();
    }
  }

  return (
    <div className="content-grid">
      <section className="glass-card hero-panel">
        <div className="hero-grid">
          <div>
            <p className="eyebrow">Citizen Workspace</p>
            <h2 className="section-title">Submit a welfare disbursement request</h2>
            <p className="section-copy">
              Welcome back, {session?.fullName}. Claims route through eligibility, budget, fraud, and ledger validation before approval.
            </p>
          </div>
          <div className="hero-stat-grid">
            <div className="glass-card hero-stat-card">
              <span>Citizen ID</span>
              <strong>{session?.citizenId}</strong>
            </div>
            <div className="action-row" style={{ marginTop: 0 }}>
              {system ? <StatusBadge status={system.status} /> : null}
              <button type="button" onClick={onLogout} className="button-secondary">
                End Session
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="split-grid">
        <section className="glass-card section-panel">
          {freezeVisible ? (
            <div className="danger-panel rounded-lg p-4 text-rose-100 animate-pulseGlow">
              <p className="eyebrow" style={{ color: "var(--text-primary)" }}>System Frozen</p>
              <p className="muted-copy" style={{ marginTop: "0.5rem", color: "var(--text-primary)" }}>
                {system.freezeReason === "ADMIN_PAUSED"
                  ? "Administrative pause is active. Claim processing is intentionally blocked."
                  : `Claim processing is blocked due to ${system.freezeReason}.`}
              </p>
            </div>
          ) : null}

          <div className="mb-6 mt-1">
            <p className="eyebrow">Claim Intake</p>
            <h3 className="section-title">Validate and send a new claim</h3>
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-200">Citizen ID</span>
              <input
                className="glass-input"
                placeholder="Example: CIT1002"
                value={form.citizenId}
                onChange={(event) => setForm((current) => ({ ...current, citizenId: event.target.value }))}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-200">Scheme</span>
              <input
                className="glass-input"
                placeholder="Example: HealthAssist"
                value={form.scheme}
                onChange={(event) => setForm((current) => ({ ...current, scheme: event.target.value }))}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-200">Amount</span>
              <input
                type="number"
                min="1"
                className="glass-input"
                placeholder="Example: 5000"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
              />
            </label>

            <div className="notice-card muted-copy">
              {helperText}
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button type="submit" disabled={ctaDisabled} className="button-primary">
                {loading ? "Validating..." : "Submit Claim"}
              </button>
              <Link to="/citizen/login" className="button-secondary">
                Back to Citizen Login
              </Link>
            </div>
          </form>
        </section>

        <section className="glass-card info-panel">
          <p className="eyebrow">Decision Panel</p>
          <h3 className="section-title">Validation outcome</h3>
          <p className="section-copy">
            Review approvals, rejection reasons, fraud flags, and final ledger evidence on this page.
          </p>

          <div className="mt-6">
            {!result ? (
              <div className="notice-card muted-copy">
                Submit a request to see approval or rejection details here.
              </div>
            ) : (
              <div
                className={`result-card rounded-lg p-5 transition-all ${
                  result.tone === "success" ? "result-card-success" : "result-card-danger"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3
                    className={`text-xl font-semibold ${
                      result.tone === "success" ? "text-emerald-200" : "text-rose-100"
                    }`}
                  >
                    {result.title}
                  </h3>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      result.tone === "success"
                        ? "bg-emerald-200/15 text-emerald-100"
                        : "bg-rose-200/15 text-rose-100"
                    }`}
                  >
                    {result.tone === "success" ? "Approved Path" : "Blocked Path"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-200">{result.message}</p>

                {result.freezeReason ? (
                  <p className="mt-3 text-sm text-rose-100">Freeze reason: {result.freezeReason}</p>
                ) : null}

                {result.details?.TransactionID ? (
                  <div className="mt-4 grid gap-3 text-sm text-slate-100">
                    <div className="notice-card">
                      <p className="text-xs uppercase tracking-[0.22em] text-emerald-200">Transaction ID</p>
                      <p className="mt-1 break-all">{result.details.TransactionID}</p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="notice-card">
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Region</p>
                        <p className="mt-1">{result.details.Region_Code}</p>
                      </div>
                      <div className="notice-card">
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Ledger Hash</p>
                        <p className="mt-1 break-all text-xs">{result.details.CurrentHash}</p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {result.details && !result.details.TransactionID ? (
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                    <span
                      className={`rounded-full px-3 py-1 ${
                        result.details.duplicate ? "bg-rose-200/15 text-rose-100" : "bg-white/10 text-slate-300"
                      }`}
                    >
                      Duplicate {result.details.duplicate ? "Detected" : "Clear"}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 ${
                        result.details.replay ? "bg-rose-200/15 text-rose-100" : "bg-white/10 text-slate-300"
                      }`}
                    >
                      Replay {result.details.replay ? "Detected" : "Clear"}
                    </span>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="notice-card muted-copy" style={{ marginTop: "1.5rem" }}>
            Use any citizen record from your uploaded Excel dataset. Scheme and amount must match the workbook exactly.
          </div>
        </section>
      </div>
    </div>
  );
}
