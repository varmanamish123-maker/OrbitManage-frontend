import { useState } from "react";
import { sellHolding } from "../api-client";

export default function SellStock({ holdingId, maxQty, onClose, onSuccess }) {
  const [qtyMode, setQtyMode] = useState("all");
  const safeMax = Number(maxQty) || 1;
  const [qty, setQty] = useState(safeMax);
  const [priceMode, setPriceMode] = useState("current");
  const [price, setPrice] = useState("");
  const [timeMode, setTimeMode] = useState("current");
  const [time, setTime] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const payload = () => {
    const amount = qtyMode === "all" ? safeMax : Math.min(Math.max(1, Math.floor(Number(qty) || 0)), safeMax);
    const p = {
      holdingId,
      quantity: Math.floor(amount),
      executedAt: timeMode === "current" ? new Date().toISOString() : time,
    };
    if (priceMode === "custom" && price) p.price = Number(price);
    return p;
  };

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      await sellHolding(payload());
      setStatus({ ok: true, msg: "Sold" });
      onSuccess?.();
      setTimeout(onClose, 600);
    } catch (e) {
      setStatus({ ok: false, msg: e.message || "Sell failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="bg-[#2b2e3b] p-4 rounded-xl w-[300px] space-y-2">
      <h3 className="text-white">Sell #{holdingId}</h3>

      <div className="flex gap-2">
        <select value={qtyMode} onChange={e => setQtyMode(e.target.value)} className="bg-[#1f2230] text-white p-2 rounded">
          <option value="all">All</option>
          <option value="custom">Qty</option>
        </select>
        {qtyMode === "custom" && (
          <input type="number" min="1" max={safeMax} value={qty}
            onChange={e => setQty(e.target.value)}
            className="flex-1 bg-[#1f2230] text-white p-2 rounded" />
        )}
      </div>

      <div className="flex gap-2">
        <select value={priceMode} onChange={e => setPriceMode(e.target.value)} className="bg-[#1f2230] text-white p-2 rounded">
          <option value="current">Current price</option>
          <option value="custom">Price</option>
        </select>
        {priceMode === "custom" && (
          <input type="number" value={price}
            onChange={e => setPrice(e.target.value)}
            className="flex-1 bg-[#1f2230] text-white p-2 rounded" />
        )}
      </div>

      <div className="flex gap-2">
        <select value={timeMode} onChange={e => setTimeMode(e.target.value)} className="bg-[#1f2230] text-white p-2 rounded">
          <option value="current">Now</option>
          <option value="custom">Time</option>
        </select>
        {timeMode === "custom" && (
          <input type="datetime-local" value={time}
            onChange={e => setTime(e.target.value)}
            className="flex-1 bg-[#1f2230] text-white p-2 rounded" />
        )}
      </div>

      {status && (
        <div className={`text-sm ${status.ok ? "text-green-400" : "text-red-400"}`}>
          {status.msg}
        </div>
      )}

      <button disabled={loading} className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-2 rounded">
        {loading ? "Selling..." : "SELL"}
      </button>
    </form>
  );
}
