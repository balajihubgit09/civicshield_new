export default function StatCard({ label, value, hint, tone = "default" }) {
  const toneClass =
    tone === "danger"
      ? "border-red-200 bg-red-50/80"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50/80"
        : "border-white/70 bg-white/55";

  return (
    <div className={`rounded-lg border p-4 shadow-panel transition hover:-translate-y-0.5 ${toneClass}`}>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-600">{hint}</p> : null}
    </div>
  );
}
