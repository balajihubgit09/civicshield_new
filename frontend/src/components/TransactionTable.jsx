function formatDate(value) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export default function TransactionTable({ rows }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/70 bg-white/60 shadow-panel">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/80 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Transaction</th>
              <th className="px-4 py-3 font-medium">Timestamp</th>
              <th className="px-4 py-3 font-medium">Scheme</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Region</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan="5">
                  No transactions yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.TransactionID} className="border-t border-slate-200 text-slate-700">
                  <td className="px-4 py-3">{row.TransactionID}</td>
                  <td className="px-4 py-3">{formatDate(row.Timestamp)}</td>
                  <td className="px-4 py-3">{row.Scheme}</td>
                  <td className="px-4 py-3">Rs. {Number(row.Amount).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">{row.Region_Code}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
