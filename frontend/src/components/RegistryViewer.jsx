export default function RegistryViewer({ records }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/14 bg-white/6 shadow-panel">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="text-sm font-medium text-white">Registry Viewer</p>
        <p className="mt-1 text-sm text-slate-300">Hashed registry records loaded from the startup dataset.</p>
      </div>
      <div className="max-h-[360px] overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-950/85 text-slate-300 backdrop-blur-xl">
            <tr>
              <th className="px-4 py-3 font-medium">Citizen Hash</th>
              <th className="px-4 py-3 font-medium">Scheme</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Claims</th>
              <th className="px-4 py-3 font-medium">Region</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-400" colSpan="5">
                  No registry records available.
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.CitizenHash} className="border-t border-white/8 text-slate-200">
                  <td className="px-4 py-3 text-xs text-slate-300">{record.CitizenHash}</td>
                  <td className="px-4 py-3">{record.Scheme}</td>
                  <td className="px-4 py-3">Rs. {Number(record.Amount).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">{record.Claim_Count}</td>
                  <td className="px-4 py-3">{record.Region_Code}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
