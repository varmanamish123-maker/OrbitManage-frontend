import { useEffect, useState } from "react";
import { buy } from "../api-client";

// Allowed assets per category (backend restriction)
const CRYPTO_OPTIONS = [
  { assetName: "ETH-USD", label: "Ethereum (ETH-USD)" },
  { assetName: "BTC-USD", label: "Bitcoin (BTC-USD)" },
];
const COMMODITY_OPTIONS = [{ assetName: "GOLD", label: "Gold (GOLD)" }];

const ASSET_TYPE_MAP = {
  Stocks: "STOCK",
  Crypto: "CRYPTOCURRENCY",
  Commodities: "COMMODITY",
};

export default function BuyStock({
  onSubmit,
  initialTicker = "",
  assetCategory = "Stocks",
}) {
  const [list, setList] = useState([]);
  const [query, setQuery] = useState(initialTicker);
  const [suggestions, setSuggestions] = useState([]);
  const [cryptoAsset, setCryptoAsset] = useState(CRYPTO_OPTIONS[0].assetName);
  const [qty, setQty] = useState(1);
  const [useCurrentPrice, setUseCurrentPrice] = useState(true);
  const [price, setPrice] = useState("");

  const isStocks = assetCategory === "Stocks";
  const isCrypto = assetCategory === "Crypto";
  const isCommodity = assetCategory === "Commodities";

  useEffect(() => {
    if (!isStocks) return;
    fetch("/tickers.csv")
      .then((r) => r.text())
      .then((text) => {
        const lines = text.trim().split("\n").slice(1);
        const parsed = lines.map((l) => {
          const [ticker, company] = l.split(",");
          return { ticker: ticker.trim(), company: company.trim() };
        });
        setList(parsed);
      })
      .catch(console.error);
  }, [isStocks]);

  useEffect(() => {
    if (isStocks && initialTicker) {
      setQuery(initialTicker);
      const s = initialTicker.toLowerCase();
      const filtered = list
        .filter(
          (x) =>
            x.ticker.toLowerCase().includes(s) ||
            x.company.toLowerCase().includes(s)
        )
        .slice(0, 6);
      setSuggestions(filtered);
    }
  }, [initialTicker, list, isStocks]);

  function doSearch(q) {
    if (!q) return [];
    const s = q.toLowerCase();
    return list
      .filter(
        (x) =>
          x.ticker.toLowerCase().includes(s) ||
          x.company.toLowerCase().includes(s)
      )
      .slice(0, 6);
  }

  function onTickerChange(v) {
    setQuery(v);
    setSuggestions(doSearch(v));
  }

  function getAssetName() {
    if (isStocks) return query.trim().toUpperCase();
    if (isCrypto) return cryptoAsset;
    if (isCommodity) return COMMODITY_OPTIONS[0].assetName;
    return "";
  }

  function buildPayload() {
    const assetType = ASSET_TYPE_MAP[assetCategory] || "STOCK";
    const payload = {
      asset: {
        assetName: getAssetName(),
        assetType,
      },
      portfolioId: 1,
      quantity: Number(qty),
    };
    if (!useCurrentPrice && price !== "") {
      payload.price = Number(price);
    }
    return payload;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const assetName = getAssetName();
    if (!assetName) {
      alert("Please select or enter an asset.");
      return;
    }
    const payload = buildPayload();
    try {
      await buy(payload);
      alert("Buy order placed successfully ✅");
      onSubmit?.(payload);
    } catch (err) {
      console.error(err);
      alert("Buy failed ❌\n" + err.message);
    }
  }

  const title =
    assetCategory === "Stocks"
      ? "Buy Stock"
      : assetCategory === "Crypto"
        ? "Buy Crypto"
        : "Buy Commodity";

  return (
    <div className="bg-[#2b2e3b] rounded-xl p-4 w-full max-w-md">
      <h3 className="text-white mb-4">{title}</h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        {isStocks && (
          <div className="relative">
            <label className="text-gray-400 text-sm">Ticker</label>
            <input
              className="w-full mt-1 p-2 rounded bg-[#1f2230] text-white outline-none"
              placeholder="AAPL or Apple"
              value={query}
              onChange={(e) => onTickerChange(e.target.value)}
              required
            />
            {suggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-[#1f2230] border border-white/10 rounded">
                {suggestions.map((s) => (
                  <div
                    key={s.ticker}
                    onClick={() => {
                      setQuery(s.ticker);
                      setSuggestions([]);
                    }}
                    className="px-3 py-2 text-sm text-white hover:bg-[#3a3e52] cursor-pointer"
                  >
                    <b>{s.ticker}</b> — {s.company}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {isCrypto && (
          <div>
            <label className="text-gray-400 text-sm">Crypto</label>
            <select
              className="w-full mt-1 p-2 rounded bg-[#1f2230] text-white outline-none"
              value={cryptoAsset}
              onChange={(e) => setCryptoAsset(e.target.value)}
            >
              {CRYPTO_OPTIONS.map((o) => (
                <option key={o.assetName} value={o.assetName}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {isCommodity && (
          <div>
            <label className="text-gray-400 text-sm">Commodity</label>
            <div className="mt-1 p-2 rounded bg-[#1f2230] text-white">
              {COMMODITY_OPTIONS[0].label}
            </div>
          </div>
        )}

        <div>
          <label className="text-gray-400 text-sm">Quantity</label>
          <input
            type="number"
            min="1"
            className="w-full mt-1 p-2 rounded bg-[#1f2230] text-white outline-none"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-gray-400 text-sm">Price</label>
          <div className="flex gap-3 text-sm text-white">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                checked={useCurrentPrice}
                onChange={() => setUseCurrentPrice(true)}
              />
              Current price
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                checked={!useCurrentPrice}
                onChange={() => setUseCurrentPrice(false)}
              />
              Custom price
            </label>
          </div>
          {!useCurrentPrice && (
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full mt-1 p-2 rounded bg-[#1f2230] text-white outline-none"
              placeholder="Enter price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          )}
        </div>

        <button
          type="submit"
          className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded"
        >
          BUY
        </button>
      </form>
    </div>
  );
}
