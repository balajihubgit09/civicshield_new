export default function FraudSummary({ fraudSummary, recentRequests }) {
  return (
    <div className="glass-card rounded-lg border border-white/14 p-4 shadow-panel">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">Fraud Signal Summary</p>
          <p className="mt-1 text-sm leading-6 text-slate-300">Duplicate and replay detections from recent request traffic.</p>
        </div>
        <div className="rounded-lg border border-rose-400/22 bg-rose-500/10 px-3 py-2 text-right">
          <p className="text-xs uppercase tracking-[0.22em] text-rose-100">Flagged</p>
          <p className="text-xl font-semibold text-rose-100">{fraudSummary.flaggedRequests}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-white/6 p-3">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Replay Attacks</p>
          <p className="mt-2 text-2xl font-semibold text-white">{fraudSummary.replayDetections}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/6 p-3">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Duplicate Requests</p>
          <p className="mt-2 text-2xl font-semibold text-white">{fraudSummary.duplicateDetections}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/6 p-3">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Recent Decisions</p>
          <p className="mt-2 text-2xl font-semibold text-white">{recentRequests.length}</p>
        </div>
      </div>
    </div>
  );
}
