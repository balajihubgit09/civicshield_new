const styles = {
  ACTIVE: "border-emerald-300/30 bg-emerald-400/12 text-emerald-100",
  FROZEN: "border-rose-300/30 bg-rose-400/12 text-rose-100",
  PAUSED: "border-amber-300/30 bg-amber-400/12 text-amber-100",
  BUDGET_EXHAUSTED: "border-rose-300/30 bg-rose-400/12 text-rose-100"
};

export default function StatusBadge({ status }) {
  const tone = styles[status] || styles.FROZEN;
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>
      {status}
    </span>
  );
}
