import { Link } from "react-router-dom";
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

export default function AdminDashboard({ credentials, onLogout }) {
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
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!authenticated) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      loadDashboard({ silent: true });
    }, 5000);

    return () => window.clearInterval(timer);
  }, [authenticated, credentials?.username, credentials?.password]);

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
    <div className="grid gap-5">
      <section className="glass-card rounded-lg border border-white/14 p-6 sm:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">Administrative Control</p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Secure operations dashboard</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              Auto-refreshes every 5 seconds with live system state, fraud pressure, registry visibility, and ledger health.
            </p>
          </div>

          <div className="grid gap-3 sm:min-w-[320px]">
            <div className="rounded-lg border border-white/10 bg-white/6 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Authenticated Admin</p>
              <p className="mt-2 text-sm font-semibold text-white">{credentials?.username}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => loadDashboard()}
                className="rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
              >
                Refresh Dashboard
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-lg border border-white/12 bg-white/8 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/12"
              >
                Sign Out
              </button>
              <Link
                to="/admin/login"
                className="rounded-lg border border-white/12 bg-white/8 px-4 py-3 text-center text-sm font-medium text-slate-100 transition hover:bg-white/12"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-5 rounded-lg border border-rose-400/25 bg-rose-500/12 p-4 text-sm text-rose-100">{error}</div>
        ) : null}

        {freezeAlert ? (
          <div className="mt-5 rounded-lg border border-rose-400/25 bg-rose-500/12 p-4 animate-pulseGlow">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-100">Freeze Alert</p>
                <p className="mt-2 text-sm text-rose-100">The system is not accepting new claims.</p>
              </div>
              <StatusBadge status={dashboard.status} />
            </div>
            <p className="mt-2 text-sm text-rose-100">Reason: {freezeAlert}</p>
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

          <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-6">
              <BudgetBar current={dashboard.budgetRemaining} initial={dashboard.initialBudget} />
              <FraudSummary fraudSummary={dashboard.fraudSummary} recentRequests={dashboard.recentRequests} />
            </div>

            <div className="glass-card rounded-lg border border-white/14 p-5">
              <p className="text-sm font-medium text-white">Admin actions</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Pause immediately, resume only from PAUSED, download tamper report only while frozen.</p>

              <div className="mt-5 grid gap-3">
                <button
                  disabled={busy || dashboard.status !== "ACTIVE"}
                  onClick={() => handleAction("pause")}
                  className="rounded-lg border border-amber-300/25 bg-amber-400/12 px-4 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/18 disabled:opacity-50"
                >
                  Emergency Pause
                </button>
                <button
                  disabled={busy || dashboard.status !== "PAUSED"}
                  onClick={() => handleAction("resume")}
                  className="rounded-lg border border-emerald-300/25 bg-emerald-400/12 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/18 disabled:opacity-50"
                >
                  Resume
                </button>
                <button
                  disabled={busy || dashboard.status !== "FROZEN"}
                  onClick={() => handleAction("report")}
                  className="rounded-lg border border-cyan-300/25 bg-cyan-400/12 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/18 disabled:opacity-50"
                >
                  Download Tamper Report
                </button>
              </div>

              <div className="mt-5 rounded-lg border border-white/10 bg-white/6 p-4 text-sm leading-6 text-slate-300">
                Admin credentials are kept in memory only for the current browser session.
              </div>
            </div>
          </section>

          <section className="glass-card rounded-lg border border-white/14 p-4">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Last 10 ledger transactions</p>
                <p className="mt-1 text-sm text-slate-300">Immutable approvals with chained hashes.</p>
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
