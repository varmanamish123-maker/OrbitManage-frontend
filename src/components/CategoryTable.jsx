export function CategoryTable({ data, onSelect, selected, onBuy, isDark = true }) {
  const categories = [
    { key: "stocks", label: "Stocks", type: "STOCK" },
    { key: "crypto", label: "Crypto", type: "CRYPTO" },
    { key: "commodities", label: "Commodities", type: "COMMODITY" },
  ];

  if (!data) return null;

  const bgCard = isDark ? "bg-[#2b2e3b]" : "bg-white";
  const bgHover = isDark ? "bg-[#3a3e52]" : "bg-gray-100";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";

  return (
    <div className={`${bgCard} rounded-xl p-4 overflow-x-auto shadow-sm transition-colors`}>
      <h3 className={`${textPrimary} mb-3`}>Portfolio</h3>

      <table className="w-full text-sm">
        <thead className={textSecondary}>
          <tr>
            <th className="text-left">Category</th>
            {data.cols.map((col) => (
              <th key={col} className="text-left whitespace-nowrap">{col}</th>
            ))}
            <th className="text-right">Action</th>
          </tr>
        </thead>

        <tbody>
          {categories.map((cat) => {
            const row = data[cat.key] || {};
            return (
              <tr
                key={cat.key}
                onClick={() => onSelect(cat.label)}
                className={`transition cursor-pointer ${
                  selected === cat.label
                    ? bgHover
                    : isDark
                      ? "hover:bg-[#3a3e52]"
                      : "hover:bg-gray-100"
                }`}
              >
                <td className={`py-2 ${textPrimary} font-medium`}>
                  {cat.label}
                </td>

                {data.cols.map((col) => (
                  <td key={col} className={`py-2 ${textPrimary}`}>
                    {row[col] ?? "-"}
                  </td>
                ))}

                <td className="py-2 text-right" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onBuy?.(cat.label);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded"
                  >
                    + Buy
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
