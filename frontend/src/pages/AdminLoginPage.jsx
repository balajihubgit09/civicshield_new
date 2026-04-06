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
    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <section className="glass-card rounded-lg border border-white/14 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">Admin Login</p>
        <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Authenticate into the command center</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
          Verify credentials here, then move into a dedicated dashboard for system status, budget supervision, and tamper response.
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
            <div className="rounded-lg border border-rose-400/25 bg-rose-500/12 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Authenticating..." : "Enter Admin Dashboard"}
            </button>
            <Link
              to="/"
              className="rounded-lg border border-white/12 bg-white/8 px-5 py-3 text-center text-sm font-medium text-slate-100 transition hover:bg-white/12"
            >
              Return to Overview
            </Link>
          </div>
        </form>
      </section>

      <section className="glass-card rounded-lg border border-white/12 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-amber-200">Admin Scope</p>
        <div className="mt-6 grid gap-4">
          {[
            "Review ledger health, approval rates, and recent transactions.",
            "Pause or resume claim processing with direct system controls.",
            "Download a tamper report only when the system is frozen."
          ].map((item) => (
            <div key={item} className="rounded-lg border border-white/10 bg-white/6 p-4 text-sm leading-6 text-slate-300">
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
