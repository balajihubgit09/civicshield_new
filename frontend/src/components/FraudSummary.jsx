export default function FraudSummary({ fraudSummary, recentRequests }) {
  return (
    <div className="rounded-lg border border-white/70 bg-white/55 p-4 shadow-panel">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-900">Fraud Signal Summary</p>
          <p className="mt-1 text-sm text-slate-600">Duplicate and replay detections from recent request traffic.</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-right">
          <p className="text-xs uppercase tracking-wide text-red-600">Flagged</p>
          <p className="text-xl font-semibold text-red-700">{fraudSummary.flaggedRequests}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white/70 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Replay Attacks</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{fraudSummary.replayDetections}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white/70 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Duplicate Requests</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{fraudSummary.duplicateDetections}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white/70 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Recent Decisions</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{recentRequests.length}</p>
        </div>
      </div>
    </div>
  );
}
