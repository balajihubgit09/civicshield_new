export default function StatCard({ label, value, hint, tone = "default" }) {
  const toneClass =
    tone === "danger"
      ? "border-rose-400/22 bg-rose-500/10"
      : tone === "success"
        ? "border-emerald-400/22 bg-emerald-500/10"
        : "border-white/12 bg-white/6";

  return (
    <div className={`rounded-lg border p-4 shadow-panel transition hover:-translate-y-0.5 ${toneClass}`}>
      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
      {hint ? <p className="mt-2 text-sm leading-6 text-slate-300">{hint}</p> : null}
    </div>
  );
}
