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
    <div className="split-grid">
      <section className="glass-card section-panel">
        <p className="eyebrow">Citizen Login</p>
        <h2 className="section-title">Open your protected claim workspace</h2>
        <p className="section-copy">
          Start a citizen session and move directly into a dedicated claim page with validation feedback, status visibility, and clear next actions.
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
            <button type="submit" className="button-primary">
              Continue to Claim Workspace
            </button>
            <Link to="/" className="button-secondary">
              Return to Overview
            </Link>
          </div>
        </form>
      </section>

      <section className="glass-card info-panel">
        <p className="eyebrow">Session Benefits</p>
        <h3 className="section-title">Direct entry with saved context.</h3>
        <div className="benefit-list" style={{ marginTop: "1rem" }}>
          {[
            "Direct entry into a dedicated claim submission page.",
            "Saved citizen session across refresh for the current browser session.",
            "Fast route access from the left-side menu after sign-in."
          ].map((item) => (
            <div key={item} className="benefit-card muted-copy">{item}</div>
          ))}
        </div>
      </section>
    </div>
  );
}
