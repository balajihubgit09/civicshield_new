import { useEffect, useMemo, useState } from "react";
import { fetchHealth, submitClaim } from "../lib/api.js";
import StatusBadge from "../components/StatusBadge.jsx";

const initialForm = {
  citizenId: "",
  scheme: "",
  amount: ""
};

export default function UserPage() {
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
      setForm(initialForm);
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
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="glass-panel rounded-lg border border-white/70 p-6 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">Citizen Claim Intake</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Submit a welfare disbursement request</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Requests are hashed immediately, screened for fraud, and committed only after the full validation pipeline succeeds.
            </p>
          </div>
          {system ? <StatusBadge status={system.status} /> : null}
        </div>

        {freezeVisible ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 animate-pulseGlow">
            <p className="text-sm font-semibold uppercase tracking-wide text-red-600">System Frozen</p>
            <p className="mt-2 text-sm">
              {system.freezeReason === "ADMIN_PAUSED"
                ? "Administrative pause is active. Claim processing is intentionally blocked."
                : `Claim processing is blocked due to ${system.freezeReason}.`}
            </p>
          </div>
        ) : null}

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Citizen ID</span>
            <input
              className="rounded-lg border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400"
              placeholder="Example: CIT1002"
              value={form.citizenId}
              onChange={(event) => setForm((current) => ({ ...current, citizenId: event.target.value }))}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Scheme</span>
            <input
              className="rounded-lg border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400"
              placeholder="Example: HealthAssist"
              value={form.scheme}
              onChange={(event) => setForm((current) => ({ ...current, scheme: event.target.value }))}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Amount</span>
            <input
              type="number"
              min="1"
              className="rounded-lg border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400"
              placeholder="Example: 5000"
              value={form.amount}
              onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
            />
          </label>

          <div className="rounded-lg border border-slate-200 bg-white/65 p-4 text-sm text-slate-600">
            {helperText}
          </div>

          <button
            type="submit"
            disabled={ctaDisabled}
            className="rounded-lg bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
          >
            {loading ? "Validating..." : "Submit Claim"}
          </button>
        </form>
      </section>

      <section className="glass-panel rounded-lg border border-white/70 p-6 shadow-panel">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Decision Panel</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Validation outcome</h2>
        <p className="mt-2 text-sm text-slate-600">
          Clear rejection reasons and fraud flags make the demo easy to explain during judging.
        </p>

        <div className="mt-6">
          {!result ? (
            <div className="rounded-lg border border-slate-200 bg-white/65 p-5 text-sm text-slate-500">
              Submit a request to see approval or rejection details here.
            </div>
          ) : (
            <div
              className={`rounded-lg border p-5 transition-all ${
                result.tone === "success"
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3
                  className={`text-xl font-semibold ${
                    result.tone === "success" ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  {result.title}
                </h3>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    result.tone === "success"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {result.tone === "success" ? "Approved Path" : "Blocked Path"}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-700">{result.message}</p>

              {result.freezeReason ? (
                <p className="mt-3 text-sm text-red-700">Freeze reason: {result.freezeReason}</p>
              ) : null}

              {result.details?.TransactionID ? (
                <div className="mt-4 grid gap-3 text-sm text-slate-700">
                  <div className="rounded-lg border border-emerald-200 bg-white/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-emerald-600">Transaction ID</p>
                    <p className="mt-1 break-all">{result.details.TransactionID}</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-white/70 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Region</p>
                      <p className="mt-1">{result.details.Region_Code}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white/70 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Ledger Hash</p>
                      <p className="mt-1 break-all text-xs">{result.details.CurrentHash}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {result.details && !result.details.TransactionID ? (
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                  <span
                    className={`rounded-full px-3 py-1 ${
                      result.details.duplicate ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    Duplicate {result.details.duplicate ? "Detected" : "Clear"}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 ${
                      result.details.replay ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    Replay {result.details.replay ? "Detected" : "Clear"}
                  </span>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-lg border border-slate-200 bg-white/65 p-4 text-sm text-slate-600">
          Use any citizen record from your uploaded Excel dataset. Scheme and amount must match the workbook exactly.
        </div>
      </section>
    </div>
  );
}
