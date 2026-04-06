export default function BudgetBar({ current, initial }) {
  const safeInitial = initial || 1;
  const percentage = Math.max(0, Math.min(100, (current / safeInitial) * 100));
  const color =
    percentage > 50 ? "bg-emerald-500" : percentage > 20 ? "bg-amber-400" : "bg-red-500";

  return (
    <div className="glass-card rounded-lg border border-white/14 p-4 shadow-panel">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-white">Budget Remaining</p>
        <p className="text-sm text-slate-300">{percentage.toFixed(1)}%</p>
      </div>
      <div className="h-3 rounded-full bg-white/10">
        <div
          className={`h-3 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-3 flex justify-between gap-4 text-sm text-slate-300">
        <span>Rs. {current.toLocaleString("en-IN")}</span>
        <span>Initial Rs. {initial.toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
}
