export default function BudgetBar({ current, initial }) {
  const safeInitial = initial || 1;
  const percentage = Math.max(0, Math.min(100, (current / safeInitial) * 100));
  const color =
    percentage > 50 ? "bg-emerald-500" : percentage > 20 ? "bg-amber-400" : "bg-red-500";

  return (
    <div className="rounded-lg border border-white/70 bg-white/55 p-4 shadow-panel">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-900">Budget Remaining</p>
        <p className="text-sm text-slate-500">{percentage.toFixed(1)}%</p>
      </div>
      <div className="h-3 rounded-full bg-slate-200">
        <div
          className={`h-3 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-3 flex justify-between text-sm text-slate-600">
        <span>Rs. {current.toLocaleString("en-IN")}</span>
        <span>Initial Rs. {initial.toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
}
