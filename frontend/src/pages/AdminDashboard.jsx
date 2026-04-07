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
    <div className="content-grid">
      <section className="glass-card hero-panel">
        <div className="hero-grid">
          <div>
            <p className="eyebrow">Administrative Control</p>
            <h2 className="section-title">Secure operations dashboard</h2>
            <p className="section-copy">
              Auto-refreshes every 5 seconds with live system state, fraud pressure, registry visibility, and ledger health.
            </p>
          </div>

          <div className="hero-stat-grid">
            <div className="glass-card hero-stat-card">
              <span>Authenticated Admin</span>
              <strong>{credentials?.username}</strong>
            </div>
            <div className="action-row" style={{ marginTop: 0 }}>
              <button onClick={() => loadDashboard()} className="button-primary">
                Refresh Dashboard
              </button>
              <button type="button" onClick={onLogout} className="button-secondary">
                Sign Out
              </button>
              <Link to="/admin/login" className="button-secondary">
                Back to Login
              </Link>
            </div>
          </div>
        </div>

        {error ? (
          <div className="danger-panel rounded-lg p-4 text-sm text-rose-100" style={{ marginTop: "1.25rem" }}>{error}</div>
        ) : null}

        {freezeAlert ? (
          <div className="danger-panel rounded-lg p-4 animate-pulseGlow" style={{ marginTop: "1.25rem" }}>
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

            <div className="glass-card info-panel">
              <p className="eyebrow">Admin Actions</p>
              <h3 className="section-title">Guarded control path</h3>
              <p className="section-copy">Pause immediately, resume only from PAUSED, and download a tamper report only while frozen.</p>

              <div className="mt-5 grid gap-3">
                <button
                  disabled={busy || dashboard.status !== "ACTIVE"}
                  onClick={() => handleAction("pause")}
                  className="button-warning"
                >
                  Emergency Pause
                </button>
                <button
                  disabled={busy || dashboard.status !== "PAUSED"}
                  onClick={() => handleAction("resume")}
                  className="button-success"
                >
                  Resume
                </button>
                <button
                  disabled={busy || dashboard.status !== "FROZEN"}
                  onClick={() => handleAction("report")}
                  className="button-danger"
                >
                  Download Tamper Report
                </button>
              </div>

              <div className="notice-card muted-copy" style={{ marginTop: "1.25rem" }}>
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
