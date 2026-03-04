export function HoldingsTable({ title, rows, onBack }) {
    return (
      <div className="bg-[#2b2e3b] rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white">{title}</h3>
          <button
            onClick={onBack}
            className="text-blue-400 hover:underline"
          >
            ← Back
          </button>
        </div>
  
        <table className="w-full text-sm">
          <thead className="text-gray-400">
            <tr>
              <th className="text-left">Name</th>
              <th className="text-left">Value</th>
              <th className="text-left">Gain</th>
            </tr>
          </thead>
  
          <tbody>
            {rows.map((h, i) => (
              <tr key={i} className="hover:bg-[#3a3e52] transition">
                <td className="py-2 text-white">{h.name}</td>
                <td className="py-2 text-white">{h.value}</td>
                <td
                  className={`py-2 ${
                    h.gain.startsWith("-")
                      ? "text-red-400"
                      : "text-green-400"
                  }`}
                >
                  {h.gain}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  