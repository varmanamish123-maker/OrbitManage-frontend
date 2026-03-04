import { useState } from "react";
import { NewsPopup } from "./NewsPopup";

export function HoldingsTableExpandable({ rows, onSell, onSellAll, onBuyMore, onEdit, onDelete, isDark = true }) {
  const [open, setOpen] = useState({});
  const [newsTicker, setNewsTicker] = useState(null);

  const bgCard = isDark ? "bg-[#2b2e3b]" : "bg-white";
  const bgHover = isDark ? "bg-[#3a3e52]" : "bg-gray-100";
  const bgRow = isDark ? "bg-[#232634]" : "bg-gray-50";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";
  const textTertiary = isDark ? "text-gray-300" : "text-gray-700";

  return (
    <div className={`${bgCard} rounded-xl p-4 overflow-x-auto shadow-sm transition-colors relative`}>
      <h3 className={`${textPrimary} mb-3`}>Holdings</h3>

      <table className="w-full text-sm">
        <thead className={textSecondary}>
          <tr>
            <th className="text-left">Ticker</th>
            <th className="text-left">Qty</th>
            <th className="text-left">Avg Buy</th>
            <th className="text-left">Total P/L</th>
            <th className="text-left">P/L %</th>
            <th className="text-left">Today P/L</th>
            <th className="text-left">Today %</th>
            <th className="text-left">Action</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => (
            <>
              <tr
                key={r.key}
                onClick={() => setOpen((o) => ({ ...o, [r.key]: !o[r.key] }))}
                className={`${isDark ? "hover:bg-[#3a3e52]" : "hover:bg-gray-100"} cursor-pointer`}
              >
                <td className={`py-2 ${textPrimary} font-medium`}>
                  <div className="flex items-center gap-2">
                    <span>{open[r.key] ? "▾" : "▸"} {r.ticker}</span>
                    <button
                      data-ticker={r.ticker}
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        setNewsTicker(r.ticker);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="relative text-blue-400 hover:text-blue-300 text-sm"
                      title="View News"
                    >
                      📰
                    </button>
                  </div>
                </td>
                <td className={textPrimary}>{r.totalQty}</td>
                <td className={textPrimary}>{r.avgBuy}</td>
                <td className={r.positive ? "text-green-400" : "text-red-400"}>
                  {r.totalPnlFormatted || r.totalPnl}
                </td>
                <td className={r.positive ? "text-green-400" : "text-red-400"}>
                  {r.totalPnlPercentFormatted || r.totalPnlPercent}
                </td>
                <td className={r.todayPositive ? "text-green-400" : "text-red-400"}>
                  {r.totalTodayPnlFormatted || r.totalTodayPnl}
                </td>
                <td className={r.todayPositive ? "text-green-400" : "text-red-400"}>
                  {r.totalTodayPnlPercentFormatted || r.totalTodayPnlPercent}
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1">
                    {onBuyMore && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onBuyMore(r.ticker);
                        }}
                        className="bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded text-xs"
                      >
                        Buy More
                      </button>
                    )}
                    {onSellAll && r.buys?.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSellAll(r.buys.map(b => ({ holdingId: b.holdingId, qty: b.qty })));
                        }}
                        className="bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded text-xs"
                      >
                        Sell All
                      </button>
                    )}
                  </div>
                </td>
              </tr>

              {open[r.key] &&
                r.buys.map((b) => (
                  <tr key={b.holdingId} className={bgRow}>
                    <td className={`pl-6 py-2 ${textTertiary}`}>
                      Buy #{b.holdingId}
                    </td>
                    <td className={textTertiary}>{b.qty}</td>
                    <td className={textTertiary}>{b.buyPrice}</td>
                    <td
                      className={b.positive ? "text-green-400" : "text-red-400"}
                    >
                      {b.pnl}
                    </td>
                    <td className={b.positive ? "text-green-400" : "text-red-400"}>
                      {b.pnlPercent}
                    </td>
                    <td className={b.todayPositive ? "text-green-400" : "text-red-400"}>
                      {b.todayPnl}
                    </td>
                    <td className={b.todayPositive ? "text-green-400" : "text-red-400"}>
                      {b.todayPnlPercent}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {onEdit && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(b.holdingId, b.qty, b.rawBuyPrice);
                              }}
                              className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs"
                            >
                              Edit
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(b.holdingId);
                              }}
                              className="bg-orange-600 hover:bg-orange-500 text-white px-2 py-1 rounded text-xs"
                            >
                              Delete
                            </button>
                          )}
                          {onSell && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSell(b.holdingId, b.qty);
                              }}
                              className="bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded text-xs"
                            >
                              Sell
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
            </>
          ))}
        </tbody>
      </table>

      {newsTicker && (
        <NewsPopup
          ticker={newsTicker}
          isDark={isDark}
          onClose={() => setNewsTicker(null)}
        />
      )}
    </div>
  );
}
