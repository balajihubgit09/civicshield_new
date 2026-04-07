import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchHealth } from "../lib/api.js";
import StatusBadge from "../components/StatusBadge.jsx";

const pathways = [
  {
    title: "Citizen entry",
    description: "Start a citizen session, submit a claim, and track the approval response with full validation detail.",
    cta: "Enter Citizen Login",
    to: "/citizen/login"
  },
  {
    title: "Admin control",
    description: "Authenticate into the command center to monitor budget pressure, fraud signals, and ledger integrity.",
    cta: "Enter Admin Login",
    to: "/admin/login"
  }
];

export default function HomePage({ citizenSession, adminSession }) {
  const [system, setSystem] = useState(null);

  useEffect(() => {
    fetchHealth()
      .then((payload) => setSystem(payload.system))
      .catch(() => setSystem(null));
  }, []);

  return (
    <div className="content-grid">
      <section className="glass-card hero-panel">
        <div className="hero-grid">
          <div>
            <p className="eyebrow">National Welfare Security Grid</p>
            <h2 className="hero-title gradient-title">
              Trusted claim processing with a glass-first citizen flow and a sharper admin control surface.
            </h2>
            <p className="hero-copy">
              Move between citizen intake, approval visibility, and live system oversight with the same polished interface language used across the reference frontend.
            </p>
            <div className="hero-actions">
              <Link to="/citizen/login" className="button-primary">
                Open Citizen Login
              </Link>
              <Link to="/admin/login" className="button-secondary">
                Open Admin Login
              </Link>
            </div>
          </div>

          <div className="hero-stat-grid">
            <article className="glass-card hero-stat-card">
              <span>Platform Status</span>
              <strong>{system ? system.status : "Checking"}</strong>
              {system ? <StatusBadge status={system.status} /> : null}
            </article>
            <article className="glass-card hero-stat-card">
              <span>Citizen Session</span>
              <strong>{citizenSession ? citizenSession.fullName : "Awaiting sign-in"}</strong>
            </article>
            <article className="glass-card hero-stat-card">
              <span>Admin Session</span>
              <strong>{adminSession ? adminSession.username : "Protected"}</strong>
            </article>
            <article className="glass-card hero-stat-card">
              <span>Routes Ready</span>
              <strong>4</strong>
            </article>
          </div>
        </div>
      </section>

      <section className="split-grid">
        <div className="content-grid">
          {pathways.map((pathway) => (
            <article key={pathway.title} className="glass-card section-panel">
              <p className="eyebrow">{pathway.title}</p>
              <h3 className="section-title">{pathway.cta.replace("Enter ", "")}</h3>
              <p className="section-copy">{pathway.description}</p>
              <div className="action-row">
                <Link to={pathway.to} className="button-primary">
                  {pathway.cta}
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="glass-card info-panel">
          <p className="eyebrow">Command Path</p>
          <h3 className="section-title">Open what matters next.</h3>
          <div className="benefit-list" style={{ marginTop: "1rem" }}>
            {[
              "Open the role-specific login page from the menu.",
              "Authenticate or start a citizen session.",
              "Land on a dedicated workspace with actions and follow-up routes ready."
            ].map((step, index) => (
              <div key={step} className="benefit-card" style={{ display: "flex", gap: "0.9rem" }}>
                <div
                  className="data-pill"
                  style={{ minWidth: "2rem", justifyContent: "center", color: "var(--text-primary)" }}
                >
                  {index + 1}
                </div>
                <p className="muted-copy">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
