import { useState } from "react";
import { editHolding } from "../api-client";

export default function EditStock({ holdingId, currentQty, currentBuyPrice, onClose, onSuccess }) {
  const [qty, setQty] = useState(currentQty || 1);
  const [buyPrice, setBuyPrice] = useState(currentBuyPrice || "");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      await editHolding(holdingId, Number(qty), Number(buyPrice));
      setStatus({ ok: true, msg: "Updated" });
      onSuccess?.();
      setTimeout(onClose, 600);
    } catch (e) {
      setStatus({ ok: false, msg: e.message || "Edit failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="bg-[#2b2e3b] p-4 rounded-xl w-[300px] space-y-2">
      <h3 className="text-white">Edit #{holdingId}</h3>

      <div>
        <label className="text-gray-400 text-sm">Quantity</label>
        <input
          type="number"
          min="1"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="w-full bg-[#1f2230] text-white p-2 rounded mt-1"
          required
        />
      </div>

      <div>
        <label className="text-gray-400 text-sm">Buy Price</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={buyPrice}
          onChange={(e) => setBuyPrice(e.target.value)}
          className="w-full bg-[#1f2230] text-white p-2 rounded mt-1"
          required
        />
      </div>

      {status && (
        <div className={`text-sm ${status.ok ? "text-green-400" : "text-red-400"}`}>
          {status.msg}
        </div>
      )}

      <button
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2 rounded"
      >
        {loading ? "Updating..." : "UPDATE"}
      </button>
    </form>
  );
}
