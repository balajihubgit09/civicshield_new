import { useEffect, useMemo, useState } from "react";
import {
  downloadTamperReport,
  fetchAdminDashboard,
  fetchRegistry,
  pauseSystem,
  resumeSystem
} from "../lib/api.js";
import BudgetBar from "../components/BudgetBar.jsx";
import FraudSummary from "../components/FraudSummary.jsx";
import RegistryViewer from "../components/RegistryViewer.jsx";
import StatCard from "../components/StatCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TransactionTable from "../components/TransactionTable.jsx";

export default function AdminDashboard() {
  const [credentials, setCredentials] = useState({
    username: "admin",
    password: ""
  });
  const [dashboard, setDashboard] = useState(null);
  const [registry, setRegistry] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  async function loadDashboard(options = { silent: false }) {
    if (!options.silent) {
      setError("");
    }

    try {
      const [dashboardPayload, registryPayload] = await Promise.all([
        fetchAdminDashboard(credentials),
        fetchRegistry(credentials)
      ]);
      setDashboard(dashboardPayload);
      setRegistry(registryPayload.records);
      setAuthenticated(true);
    } catch (loadError) {
      setDashboard(null);
      setRegistry([]);
      setAuthenticated(false);
      setError(loadError.payload?.error === "Unauthorized" ? "Admin authentication failed." : loadError.message);
    }
  }

  useEffect(() => {
    if (!authenticated) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      loadDashboard({ silent: true });
    }, 5000);

    return () => window.clearInterval(timer);
  }, [authenticated, credentials.username, credentials.password]);

  const freezeAlert = useMemo(() => {
    if (!dashboard || dashboard.status === "ACTIVE") {
      return null;
    }

    return dashboard.freezeReason || dashboard.status;
  }, [dashboard]);

  async function handleAction(action) {
    setBusy(true);
    setError("");

    try {
      if (action === "pause") {
        await pauseSystem(credentials);
      }

      if (action === "resume") {
        await resumeSystem(credentials);
      }

      if (action === "report") {
        await downloadTamperReport(credentials);
      }

      await loadDashboard();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="glass-panel rounded-lg border border-white/70 p-6 shadow-panel">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">Administrative Control</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Secure operations dashboard</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Auto-refreshes every 5 seconds with live system state, fraud pressure, registry visibility, and ledger health.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-slate-500">Username</span>
              <input
                className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400"
                value={credentials.username}
                onChange={(event) =>
                  setCredentials((current) => ({ ...current, username: event.target.value }))
                }
              />
            </label>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-slate-500">Password</span>
              <input
                type="password"
                className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400"
                value={credentials.password}
                onChange={(event) =>
                  setCredentials((current) => ({ ...current, password: event.target.value }))
                }
              />
            </label>
            <button
              onClick={() => loadDashboard()}
              className="self-end rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-600"
            >
              {authenticated ? "Refresh" : "Authenticate"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}

        {freezeAlert ? (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 animate-pulseGlow">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Freeze Alert</p>
                <p className="mt-2 text-sm text-red-700">The system is not accepting new claims.</p>
              </div>
              <StatusBadge status={dashboard.status} />
            </div>
            <p className="mt-2 text-sm text-red-700">Reason: {freezeAlert}</p>
          </div>
        ) : null}
      </section>

      {dashboard ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="System Status"
              value={dashboard.status}
              hint={dashboard.freezeReason || "Normal operations"}
              tone={dashboard.status === "ACTIVE" ? "success" : "danger"}
            />
            <StatCard label="Total Transactions" value={dashboard.totalTransactions} hint="Committed ledger entries" />
            <StatCard label="Approval Rate" value={`${dashboard.approvalRate}%`} hint={`${dashboard.totalRequests} total requests`} />
            <StatCard label="Ledger Health" value={dashboard.ledgerHealthy ? "Healthy" : "Tampered"} hint="Validated on every read" tone={dashboard.ledgerHealthy ? "success" : "danger"} />
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-6">
              <BudgetBar current={dashboard.budgetRemaining} initial={dashboard.initialBudget} />
              <FraudSummary fraudSummary={dashboard.fraudSummary} recentRequests={dashboard.recentRequests} />
            </div>

            <div className="rounded-lg border border-white/70 bg-white/55 p-4 shadow-panel">
              <p className="text-sm font-medium text-slate-900">Admin actions</p>
              <p className="mt-2 text-sm text-slate-600">Pause immediately, resume only from PAUSED, download tamper report only while frozen.</p>

              <div className="mt-5 grid gap-3">
                <button
                  disabled={busy || dashboard.status !== "ACTIVE"}
                  onClick={() => handleAction("pause")}
                  className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                >
                  Emergency Pause
                </button>
                <button
                  disabled={busy || dashboard.status !== "PAUSED"}
                  onClick={() => handleAction("resume")}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                >
                  Resume
                </button>
                <button
                  disabled={busy || dashboard.status !== "FROZEN"}
                  onClick={() => handleAction("report")}
                  className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-50"
                >
                  Download Tamper Report
                </button>
              </div>

              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50/90 p-4 text-sm text-slate-600">
                Admin credentials are kept in memory only for the current browser session.
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-white/70 bg-white/55 p-4 shadow-panel">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-900">Last 10 ledger transactions</p>
                <p className="mt-1 text-sm text-slate-600">Immutable approvals with chained hashes.</p>
              </div>
              <StatusBadge status={dashboard.status} />
            </div>
            <TransactionTable rows={dashboard.lastTransactions} />
          </section>

          <RegistryViewer records={registry} />
        </>
      ) : null}
    </div>
  );
}
