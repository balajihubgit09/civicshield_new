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
    <div className="grid gap-5">
      <section className="glass-card rounded-lg border border-white/14 p-6 sm:p-8">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">National Welfare Security Grid</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Trusted claim processing with a sharper citizen journey and an operations-grade admin command center.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Every step now moves through dedicated pages, guided menu routes, and a high-contrast glass interface built to feel premium during demos and real use.
            </p>
          </div>

          <div className="grid gap-3 sm:min-w-[300px]">
            <div className="rounded-lg border border-cyan-300/18 bg-cyan-400/10 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/75">Platform Status</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-lg font-semibold text-white">{system ? system.status : "Checking"}</p>
                {system ? <StatusBadge status={system.status} /> : null}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/6 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Citizen Session</p>
                <p className="mt-2 text-sm font-medium text-white">
                  {citizenSession ? citizenSession.fullName : "Awaiting sign-in"}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/6 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Admin Session</p>
                <p className="mt-2 text-sm font-medium text-white">
                  {adminSession ? adminSession.username : "Locked"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-5 sm:grid-cols-2">
          {pathways.map((pathway) => (
            <div key={pathway.title} className="glass-card rounded-lg border border-white/12 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-200">{pathway.title}</p>
              <h3 className="mt-4 text-2xl font-semibold text-white">{pathway.cta.replace("Enter ", "")}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{pathway.description}</p>
              <Link
                to={pathway.to}
                className="mt-6 inline-flex rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
              >
                {pathway.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-lg border border-white/12 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-amber-200">Command Path</p>
          <div className="mt-5 grid gap-4">
            {[
              "Open the role-specific login page from the menu.",
              "Authenticate or start a citizen session.",
              "Land on a dedicated workspace with actions and follow-up routes ready."
            ].map((step, index) => (
              <div key={step} className="flex gap-3 rounded-lg border border-white/10 bg-white/6 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <p className="text-sm leading-6 text-slate-300">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
