import { useState } from "react";

export function HoldingsHistoryTable({ rows, isDark = true }) {
  const [isOpen, setIsOpen] = useState(false);

  const bgCard = isDark ? "bg-[#2b2e3b]" : "bg-white";
  const bgHover = isDark ? "bg-[#3a3e52]" : "bg-gray-100";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";
  const textTertiary = isDark ? "text-gray-300" : "text-gray-700";

  if (!rows || rows.length === 0) {
    return (
      <div className={`${bgCard} rounded-xl p-4 shadow-sm transition-colors`}>
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <h3 className={textPrimary}>Holding History</h3>
          <span className={textSecondary}>{isOpen ? "▾" : "▸"}</span>
        </div>
        {isOpen && <p className={`${textSecondary} text-sm mt-3`}>No history available.</p>}
      </div>
    );
  }

  return (
    <div className={`${bgCard} rounded-xl p-4 overflow-x-auto shadow-sm transition-colors`}>
      <div
        className="flex items-center justify-between cursor-pointer mb-3"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className={textPrimary}>Holding History</h3>
        <span className={textSecondary}>{isOpen ? "▾" : "▸"}</span>
      </div>

      {isOpen && (
        <table className="w-full text-sm">
          <thead className={textSecondary}>
            <tr>
              <th className="text-left">Ticker</th>
              <th className="text-left">Qty</th>
              <th className="text-left">Buy Price</th>
              <th className="text-left">Sell Price</th>
              <th className="text-left">Buy Date</th>
              <th className="text-left">Sell Date</th>
              <th className="text-left">P/L</th>
              <th className="text-left">P/L %</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((h, i) => (
              <tr key={`${h.holdingId}-${i}`} className={isDark ? "hover:bg-[#3a3e52]" : "hover:bg-gray-100"}>
                <td className={`py-2 ${textPrimary}`}>{h.ticker}</td>
                <td className={`py-2 ${textPrimary}`}>{h.quantity}</td>
                <td className={`py-2 ${textPrimary}`}>{h.buyPrice}</td>
                <td className={`py-2 ${textPrimary}`}>{h.sellPrice}</td>
                <td className={`py-2 ${textTertiary} text-xs`}>{h.buyTimestamp}</td>
                <td className={`py-2 ${textTertiary} text-xs`}>{h.sellTimestamp}</td>
                <td className={`py-2 ${h.positive ? "text-green-400" : "text-red-400"}`}>
                  {h.profitOrLoss}
                </td>
                <td className={`py-2 ${h.positive ? "text-green-400" : "text-red-400"}`}>
                  {h.profitOrLossPercent}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
