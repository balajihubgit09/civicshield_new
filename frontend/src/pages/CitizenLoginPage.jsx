import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const initialForm = {
  fullName: "",
  citizenId: "",
  district: ""
};

export default function CitizenLoginPage({ session, onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => session || { ...initialForm });

  useEffect(() => {
    if (session) {
      setForm(session);
    }
  }, [session]);

  function handleSubmit(event) {
    event.preventDefault();

    onLogin({
      fullName: form.fullName.trim(),
      citizenId: form.citizenId.trim().toUpperCase(),
      district: form.district.trim()
    });
    navigate("/citizen/workspace");
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="glass-card rounded-lg border border-white/14 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">Citizen Login</p>
        <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Open your protected claim workspace</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
          Start a citizen session to continue into a dedicated claim page with validation feedback, system status, and clear next steps.
        </p>

        <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-200">Full Name</span>
            <input
              required
              className="glass-input"
              placeholder="Enter your full name"
              value={form.fullName}
              onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-200">Citizen ID</span>
            <input
              required
              className="glass-input"
              placeholder="Example: CIT1002"
              value={form.citizenId}
              onChange={(event) => setForm((current) => ({ ...current, citizenId: event.target.value }))}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-200">District</span>
            <input
              required
              className="glass-input"
              placeholder="Enter district"
              value={form.district}
              onChange={(event) => setForm((current) => ({ ...current, district: event.target.value }))}
            />
          </label>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
            >
              Continue to Claim Workspace
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
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-200">Session Benefits</p>
        <div className="mt-6 grid gap-4">
          {[
            "Direct entry into a dedicated claim submission page.",
            "Saved citizen session across refresh for the current browser session.",
            "Fast route access from the left-side menu after sign-in."
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
