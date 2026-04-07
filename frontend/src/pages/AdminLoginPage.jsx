import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchAdminDashboard } from "../lib/api.js";

export default function AdminLoginPage({ session, onLogin }) {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState(
    session || {
      username: "admin",
      password: ""
    }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session) {
      setCredentials(session);
    }
  }, [session]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await fetchAdminDashboard(credentials);
      onLogin(credentials);
      navigate("/admin/dashboard");
    } catch (loginError) {
      setError(loginError.payload?.error === "Unauthorized" ? "Admin authentication failed." : loginError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="split-grid">
      <section className="glass-card section-panel">
        <p className="eyebrow">Admin Login</p>
        <h2 className="section-title">Authenticate into the command center</h2>
        <p className="section-copy">
          Verify credentials here, then move into a dedicated dashboard for system state, budget supervision, fraud pressure, and tamper response.
        </p>

        <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-200">Username</span>
            <input
              required
              className="glass-input"
              value={credentials.username}
              onChange={(event) =>
                setCredentials((current) => ({ ...current, username: event.target.value }))
              }
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-200">Password</span>
            <input
              required
              type="password"
              className="glass-input"
              value={credentials.password}
              onChange={(event) =>
                setCredentials((current) => ({ ...current, password: event.target.value }))
              }
            />
          </label>

          {error ? (
            <div className="danger-panel rounded-lg px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button type="submit" disabled={loading} className="button-primary">
              {loading ? "Authenticating..." : "Enter Admin Dashboard"}
            </button>
            <Link to="/" className="button-secondary">
              Return to Overview
            </Link>
          </div>
        </form>
      </section>

      <section className="glass-card info-panel">
        <p className="eyebrow">Admin Scope</p>
        <h3 className="section-title">Live control with guarded actions.</h3>
        <div className="benefit-list" style={{ marginTop: "1rem" }}>
          {[
            "Review ledger health, approval rates, and recent transactions.",
            "Pause or resume claim processing with direct system controls.",
            "Download a tamper report only when the system is frozen."
          ].map((item) => (
            <div key={item} className="benefit-card muted-copy">{item}</div>
          ))}
        </div>
      </section>
    </div>
  );
}
