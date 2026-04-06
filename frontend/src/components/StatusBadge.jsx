const styles = {
  ACTIVE: "border-emerald-300 bg-emerald-50 text-emerald-700",
  FROZEN: "border-red-300 bg-red-50 text-red-700",
  PAUSED: "border-amber-300 bg-amber-50 text-amber-700",
  BUDGET_EXHAUSTED: "border-red-300 bg-red-50 text-red-700"
};

export default function StatusBadge({ status }) {
  const tone = styles[status] || styles.FROZEN;
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>
      {status}
    </span>
  );
}
