import { useEffect, useState } from "react";
import SimpleDonutChart from "./components/SimpleDonutChart";
import { CategoryTable } from "./components/CategoryTable";
import { TopStats } from "./components/TopStats";
import BuyStock from "./components/BuyStock";
import SellStock from "./components/SellStock";
import EditStock from "./components/EditStock";
import { HoldingsTableExpandable } from "./components/HoldingsTableExpandable";
import { HoldingsHistoryTable } from "./components/HoldingsHistoryTable";
import { PortfolioGraph } from "./components/PortfolioGraph";
import { MarketMovers } from "./components/MarketMovers";
import { getPortfolioSummaryUI, getHoldingsUI, getHoldingsByAssetTypeUI, getHoldingsHistoryUI, getPortfolioGraph, sellHolding, deleteHolding, getDiversificationAnalysis } from "./api-client";
import { Modal } from "./components/Modal";

export default function App() {
  const [selected, setSelected] = useState(null);
  const [showBuyStock, setShowBuyStock] = useState(false);
  const [buyStockTicker, setBuyStockTicker] = useState("");
  const [buyCategory, setBuyCategory] = useState("Stocks");
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });

  const [stats, setStats] = useState([]);
  const [statsError, setStatsError] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [holdingsHistory, setHoldingsHistory] = useState([]);
  const [holdingsAssetType, setHoldingsAssetType] = useState("STOCK");
  const [holdingsTableRows, setHoldingsTableRows] = useState([]);
  const [graphData, setGraphData] = useState(null);
  const [sellInfo, setSellInfo] = useState(null);
  const [editInfo, setEditInfo] = useState(null);
  const [showDiversification, setShowDiversification] = useState(false);
  const [divMode, setDivMode] = useState("holdings");
  const [divParams, setDivParams] = useState({
    period: "1y",
    interval: "1d",
    budget: "2",
    riskFactor: "0.5",
    penalty: "3",
    showMatrices: false,
  });
  const [customTickers, setCustomTickers] = useState([]);
  const [customTickerInput, setCustomTickerInput] = useState("");
  const [tickerList, setTickerList] = useState([]);
  const [tickerSuggestions, setTickerSuggestions] = useState([]);
  const [divResult, setDivResult] = useState(null);
  const [divLoading, setDivLoading] = useState(false);
  const [divError, setDivError] = useState(null);
  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const refreshHoldings = async () => {
    const rows = await getHoldingsUI();
    setHoldings(rows);
    const historyRows = await getHoldingsHistoryUI();
    setHoldingsHistory(historyRows);
    const tableRows = await getHoldingsByAssetTypeUI(1, holdingsAssetType);
    setHoldingsTableRows(tableRows);
  };

  useEffect(() => {
    let alive = true;
    async function loadStats() {
      try {
        const uiStats = await getPortfolioSummaryUI();
        if (alive) { setStats(uiStats); setStatsError(null); }
      } catch { if (alive) setStatsError("Failed to load portfolio summary"); }
    }
    loadStats();
    const id = setInterval(loadStats, 30000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  useEffect(() => {
    let alive = true;
    async function loadGraph() {
      try {
        const data = await getPortfolioGraph();
        if (alive) setGraphData(data);
      } catch (e) { console.error(e); }
    }
    loadGraph();
    const id = setInterval(loadGraph, 30000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  useEffect(() => {
    let alive = true;
    async function loadHoldings() {
      try {
        const rows = await getHoldingsUI();
        if (alive) setHoldings(rows);
      } catch (e) { console.error(e); }
    }
    async function loadHistory() {
      if (selected !== "Stocks") return;
      try {
        const rows = await getHoldingsHistoryUI();
        if (alive) setHoldingsHistory(rows);
      } catch (e) { console.error(e); }
    }
    loadHoldings();
    loadHistory();
    const id = setInterval(() => { loadHoldings(); loadHistory(); }, 30000);
    return () => { alive = false; clearInterval(id); };
  }, [selected]);

  // Fetch holdings by asset type for the table when dropdown or category changes
  useEffect(() => {
    if (!selected || selected === null) return;
    let alive = true;
    async function loadTableHoldings() {
      try {
        const rows = await getHoldingsByAssetTypeUI(1, holdingsAssetType);
        if (alive) setHoldingsTableRows(rows);
      } catch (e) {
        console.error(e);
        if (alive) setHoldingsTableRows([]);
      }
    }
    loadTableHoldings();
    return () => { alive = false; };
  }, [selected, holdingsAssetType]);

  useEffect(() => {
    fetch("/tickers.csv")
      .then((r) => r.text())
      .then((text) => {
        const lines = text.trim().split("\n").slice(1);
        const parsed = lines.map((l) => {
          const [ticker, company] = l.split(",");
          return { ticker: ticker?.trim(), company: company?.trim() };
        }).filter((x) => x.ticker);
        setTickerList(parsed);
      })
      .catch(console.error);
  }, []);

  // Derive category table and donut from holdings (single source: GET holdings by type)
  const categoryDataFromHoldings = (() => {
    const cols = ["Value", "Invested", "Allocation"];
    const totalInvested = (holdings || []).reduce((s, h) => s + (h.currentValue ?? h.totalInvested ?? 0), 0);
    const byCat = { stocks: 0, crypto: 0, commodities: 0 };
    (holdings || []).forEach((h) => {
      const v = h.currentValue ?? h.totalInvested ?? 0;
      if (h.assetType === "STOCK") byCat.stocks += v;
      else if (h.assetType === "CRYPTO") byCat.crypto += v;
      else if (h.assetType === "COMMODITY") byCat.commodities += v;
    });
    const fmt = (n) => `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
    const pct = (n) => (totalInvested > 0 ? `${((n / totalInvested) * 100).toFixed(1)}%` : "0%");
    return {
      cols,
      stocks: {
        Value: fmt(byCat.stocks),
        Invested: fmt(byCat.stocks),
        Allocation: pct(byCat.stocks),
      },
      crypto: {
        Value: fmt(byCat.crypto),
        Invested: fmt(byCat.crypto),
        Allocation: pct(byCat.crypto),
      },
      commodities: {
        Value: fmt(byCat.commodities),
        Invested: fmt(byCat.commodities),
        Allocation: pct(byCat.commodities),
      },
    };
  })();

  const calculateDonutData = () => {
    if (!holdings || holdings.length === 0) {
      return selected ? {} : { Stocks: 0, Crypto: 0, Commodities: 0 };
    }
    if (selected === "Stocks") {
      const stockHoldings = holdings.filter((h) => h.assetType === "STOCK");
      const totalValue = stockHoldings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
      if (totalValue === 0) return {};
      const tickerAllocation = {};
      stockHoldings.forEach((h) => {
        const percentage = ((h.currentValue || 0) / totalValue) * 100;
        if (percentage > 0.1) tickerAllocation[h.ticker] = Math.round(percentage * 10) / 10;
      });
      return tickerAllocation;
    }
    const totalValue = holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
    if (totalValue === 0) return { Stocks: 0, Crypto: 0, Commodities: 0 };
    const allocation = { Stocks: 0, Crypto: 0, Commodities: 0 };
    holdings.forEach((h) => {
      const percentage = ((h.currentValue || 0) / totalValue) * 100;
      if (h.assetType === "STOCK") allocation.Stocks += percentage;
      else if (h.assetType === "CRYPTO") allocation.Crypto += percentage;
      else if (h.assetType === "COMMODITY") allocation.Commodities += percentage;
    });
    Object.keys(allocation).forEach((key) => { allocation[key] = Math.round(allocation[key] * 10) / 10; });
    return allocation;
  };

  const donutData = calculateDonutData();
  const stockTickers = Array.from(
    new Set((holdings || []).filter((h) => h.assetType === "STOCK").map((h) => h.ticker).filter(Boolean))
  );
  const bgPrimary = isDark ? "bg-[#1f2230]" : "bg-gray-50";
  const bgSecondary = isDark ? "bg-[#2b2e3b]" : "bg-white";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";
  const borderColor = isDark ? "border-gray-700" : "border-gray-200";

  const handleRunDiversification = async () => {
    setDivError(null);
    setDivResult(null);

    const normalizedParams = {
      period: divParams.period?.trim() || "1y",
      interval: divParams.interval?.trim() || "1d",
      budget: Number(divParams.budget || 2),
      riskFactor: Number(divParams.riskFactor || 0.5),
      penalty: Number(divParams.penalty || 3),
      showMatrices: Boolean(divParams.showMatrices),
    };

    let tickers = [];
    if (divMode === "holdings") {
      tickers = stockTickers;
    } else if (customTickers.length > 0) {
      tickers = customTickers;
    } else if (customTickerInput.trim()) {
      tickers = customTickerInput
        .split(",")
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean);
    }

    if (!tickers || tickers.length === 0) {
      setDivError("Please provide at least one ticker.");
      return;
    }
    if (divMode === "custom" && tickers.length > 5) {
      setDivError("Please select up to 5 tickers for custom analysis.");
      return;
    }

    try {
      setDivLoading(true);
      const data = await getDiversificationAnalysis({ tickers, ...normalizedParams });
      setDivResult(data);
    } catch (e) {
      console.error(e);
      setDivError(e.message || "Diversification analysis failed.");
    } finally {
      setDivLoading(false);
    }
  };

  const searchTickers = (q) => {
    if (!q) return [];
    const s = q.toLowerCase();
    return tickerList
      .filter(
        (x) =>
          x.ticker.toLowerCase().includes(s) ||
          x.company.toLowerCase().includes(s)
      )
      .slice(0, 6);
  };

  const addCustomTicker = (t) => {
    const ticker = t?.trim().toUpperCase();
    if (!ticker) return;
    if (customTickers.includes(ticker)) return;
    if (customTickers.length >= 5) return;
    setCustomTickers([...customTickers, ticker]);
    setCustomTickerInput("");
    setTickerSuggestions([]);
  };

  return (
    <div className={`${bgPrimary} min-h-screen transition-colors`}>
      <header className={`${bgSecondary} border-b ${borderColor} px-6 py-4 transition-colors`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/assets/orbit-white-bg-modified.png" alt="OrbitManage Logo" className="h-10 w-auto" />
            <div>
              <h1 className={`${textPrimary} text-xl font-semibold`}>OrbitManage</h1>
              <p className={textSecondary + " text-sm"}>Capital in Motion</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowDiversification(true);
                setDivMode("holdings");
                setDivResult(null);
                setDivError(null);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm"
            >
              Diversification Analysis
            </button>
            <button onClick={toggleTheme} className={`${isDark ? "bg-gray-700" : "bg-gray-200"} ${textPrimary} px-4 py-2 rounded-lg hover:opacity-80 transition-colors flex items-center gap-2`}>
              {isDark ? "☀️ Light" : "🌙 Dark"}
            </button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6 transition-colors">
        {statsError && <div className="text-red-400">{statsError}</div>}
        {stats.length > 0 && <TopStats stats={stats} isDark={isDark} />}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className={`${bgSecondary} rounded-xl p-4 shadow-sm transition-colors`}>
            <h3 className={`${textPrimary} mb-2`}>{selected ? `${selected} Allocation` : "Portfolio Allocation"}</h3>
            <SimpleDonutChart dataMap={donutData} />
          </div>

          <div className="md:col-span-2 space-y-6">
            {selected === null && (
              <>
                <CategoryTable
                  data={categoryDataFromHoldings}
                  selected={selected}
                  onSelect={(label) => {
                    setSelected(label);
                    setHoldingsAssetType(label === "Stocks" ? "STOCK" : label === "Crypto" ? "CRYPTOCURRENCY" : "COMMODITY");
                  }}
                  onBuy={(cat) => { setBuyCategory(cat || "Stocks"); setBuyStockTicker(""); setShowBuyStock(true); }}
                  isDark={isDark}
                />
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className={textPrimary}>All Holdings</h3>
                    <button onClick={() => { setBuyCategory("Stocks"); setBuyStockTicker(""); setShowBuyStock(true); }} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded text-sm">+ Buy</button>
                  </div>
                  <HoldingsTableExpandable
                    rows={holdings}
                    isDark={isDark}
                    onSell={(holdingId, maxQty) => setSellInfo({ holdingId, maxQty })}
                    onEdit={(holdingId, currentQty, currentBuyPrice) => setEditInfo({ holdingId, currentQty, currentBuyPrice })}
                    onDelete={async (holdingId) => {
                      if (!confirm(`Delete holding #${holdingId}? This action cannot be undone.`)) return;
                      try {
                        await deleteHolding(holdingId);
                        await refreshHoldings();
                        alert("Holding deleted successfully");
                      } catch (e) {
                        console.error("Delete failed", e);
                        alert("Delete failed: " + (e.message || "Unknown error"));
                      }
                    }}
                    onBuyMore={(ticker) => { setBuyCategory("Stocks"); setBuyStockTicker(ticker); setShowBuyStock(true); }}
                    onSellAll={async (holdingsToSell) => {
                      if (!confirm(`Sell all ${holdingsToSell.length} holding(s) for this ticker?`)) return;
                      try {
                        for (const h of holdingsToSell) await sellHolding({ holdingId: h.holdingId, quantity: h.qty, executedAt: new Date().toISOString() });
                        await refreshHoldings();
                        alert("All holdings sold successfully");
                      } catch (e) {
                        console.error("Sell all failed", e);
                        alert("Sell all failed: " + (e.message || "Unknown error"));
                      }
                    }}
                  />
                </div>
              </>
            )}

            {(selected === "Stocks" || selected === "Crypto" || selected === "Commodities") && (
              <div className="space-y-6">
                <div>
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                    <h3 className={textPrimary}>Current Holdings</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className={`${textSecondary} text-sm flex items-center gap-2`}>
                        Asset type
                        <select
                          value={holdingsAssetType}
                          onChange={(e) => setHoldingsAssetType(e.target.value)}
                          className={`rounded px-2 py-1.5 text-sm border ${isDark ? "bg-[#1f2230] border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                        >
                          <option value="STOCK">Stocks</option>
                          <option value="CRYPTOCURRENCY">Crypto</option>
                          <option value="COMMODITY">Commodities</option>
                        </select>
                      </label>
                      <button onClick={() => { setBuyCategory(selected); setBuyStockTicker(""); setShowBuyStock(true); }} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded text-sm">+ Buy</button>
                      <button onClick={() => setSelected(null)} className="text-blue-400">← Back</button>
                    </div>
                  </div>
                  <HoldingsTableExpandable
                    rows={holdingsTableRows}
                    isDark={isDark}
                    onSell={(holdingId, maxQty) => setSellInfo({ holdingId, maxQty })}
                    onEdit={(holdingId, currentQty, currentBuyPrice) => setEditInfo({ holdingId, currentQty, currentBuyPrice })}
                    onDelete={async (holdingId) => {
                      if (!confirm(`Delete holding #${holdingId}? This action cannot be undone.`)) return;
                      try {
                        await deleteHolding(holdingId);
                        await refreshHoldings();
                        alert("Holding deleted successfully");
                      } catch (e) {
                        console.error("Delete failed", e);
                        alert("Delete failed: " + (e.message || "Unknown error"));
                      }
                    }}
                    onBuyMore={(ticker) => { setBuyCategory(selected); setBuyStockTicker(ticker); setShowBuyStock(true); }}
                    onSellAll={async (holdingsToSell) => {
                      if (!confirm(`Sell all ${holdingsToSell.length} holding(s) for this ticker?`)) return;
                      try {
                        for (const h of holdingsToSell) await sellHolding({ holdingId: h.holdingId, quantity: h.qty, executedAt: new Date().toISOString() });
                        await refreshHoldings();
                        alert("All holdings sold successfully");
                      } catch (e) {
                        console.error("Sell all failed", e);
                        alert("Sell all failed: " + (e.message || "Unknown error"));
                      }
                    }}
                  />
                </div>
                {selected === "Stocks" && <HoldingsHistoryTable rows={holdingsHistory} isDark={isDark} />}
              </div>
            )}
          </div>
        </div>

        <div className="px-6"><MarketMovers isDark={isDark} /></div>
        <div className="px-6 pb-6"><PortfolioGraph data={graphData} isDark={isDark} /></div>

        {showBuyStock && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="relative">
              <button type="button" onClick={() => { setShowBuyStock(false); setBuyStockTicker(""); }} className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-lg leading-none" aria-label="Close">×</button>
              <BuyStock
                assetCategory={buyCategory}
                initialTicker={buyStockTicker}
                onSubmit={async () => {
                  setShowBuyStock(false);
                  setBuyStockTicker("");
                  await refreshHoldings();
                }}
              />
            </div>
          </div>
        )}

        {sellInfo && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <SellStock holdingId={sellInfo.holdingId} maxQty={sellInfo.maxQty} onClose={() => setSellInfo(null)} onSuccess={refreshHoldings} />
          </div>
        )}

        {editInfo && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <EditStock holdingId={editInfo.holdingId} currentQty={editInfo.currentQty} currentBuyPrice={editInfo.currentBuyPrice} onClose={() => setEditInfo(null)} onSuccess={refreshHoldings} />
          </div>
        )}

        {showDiversification && (
          <Modal onClose={() => setShowDiversification(false)}>
            <div className={`${bgSecondary} ${textPrimary} rounded-xl shadow-xl p-6 w-[92vw] max-w-3xl`}> 
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Diversification Analysis</h3>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setDivMode("holdings")}
                  className={`px-3 py-1.5 rounded text-sm ${divMode === "holdings" ? "bg-blue-600 text-white" : "bg-gray-600/30"}`}
                >
                  Mode 1: Current Holdings
                </button>
                <button
                  onClick={() => setDivMode("custom")}
                  className={`px-3 py-1.5 rounded text-sm ${divMode === "custom" ? "bg-blue-600 text-white" : "bg-gray-600/30"}`}
                >
                  Mode 2: Pick up to 5 Stocks
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`rounded-lg border ${borderColor} p-3`}>
                  <h4 className="font-medium mb-2">Tickers</h4>
                  {divMode === "holdings" && (
                    <div className={`${textSecondary} text-sm`}>
                      {stockTickers.length > 0 ? (
                        <span>Using {stockTickers.length} stock holding(s): {stockTickers.join(", ")}</span>
                      ) : (
                        <span>No stock holdings found.</span>
                      )}
                    </div>
                  )}

                  {divMode === "custom" && (
                    <div className="space-y-2">
                      <label className={`${textSecondary} text-sm`}>Enter tickers (search by symbol or company)</label>
                      <div className="relative">
                        <input
                          value={customTickerInput}
                          onChange={(e) => {
                            const v = e.target.value;
                            setCustomTickerInput(v);
                            setTickerSuggestions(searchTickers(v));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addCustomTicker(customTickerInput);
                            }
                          }}
                          className={`w-full rounded px-2 py-1.5 text-sm border ${isDark ? "bg-[#1f2230] border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                          placeholder="AAPL or Apple"
                        />
                        {tickerSuggestions.length > 0 && (
                          <div className={`absolute z-10 mt-1 w-full rounded border ${borderColor} ${isDark ? "bg-[#1f2230]" : "bg-white"}`}>
                            {tickerSuggestions.map((s) => (
                              <div
                                key={s.ticker}
                                onClick={() => addCustomTicker(s.ticker)}
                                className={`px-3 py-2 text-sm cursor-pointer ${isDark ? "text-white hover:bg-[#3a3e52]" : "text-gray-900 hover:bg-gray-100"}`}
                              >
                                <b>{s.ticker}</b> — {s.company}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {customTickers.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {customTickers.map((t) => (
                            <span key={t} className={`px-2 py-1 rounded text-xs ${isDark ? "bg-[#1f2230]" : "bg-gray-100"}`}>
                              {t}
                              <button
                                type="button"
                                onClick={() => setCustomTickers(customTickers.filter((x) => x !== t))}
                                className="ml-2 text-red-400"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className={`${textSecondary} text-xs`}>Max 5 tickers.</div>
                    </div>
                  )}
                </div>

                <div className={`rounded-lg border ${borderColor} p-3`}>
                  <h4 className="font-medium mb-2">Parameters</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <label className="flex flex-col gap-1">
                      Period
                      <input
                        value={divParams.period}
                        onChange={(e) => setDivParams({ ...divParams, period: e.target.value })}
                        className={`rounded px-2 py-1.5 border ${isDark ? "bg-[#1f2230] border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                        placeholder="1y"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      Interval
                      <input
                        value={divParams.interval}
                        onChange={(e) => setDivParams({ ...divParams, interval: e.target.value })}
                        className={`rounded px-2 py-1.5 border ${isDark ? "bg-[#1f2230] border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                        placeholder="1d"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      Budget
                      <input
                        type="number"
                        value={divParams.budget}
                        onChange={(e) => setDivParams({ ...divParams, budget: e.target.value })}
                        className={`rounded px-2 py-1.5 border ${isDark ? "bg-[#1f2230] border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      Risk Factor
                      <input
                        type="number"
                        step="0.01"
                        value={divParams.riskFactor}
                        onChange={(e) => setDivParams({ ...divParams, riskFactor: e.target.value })}
                        className={`rounded px-2 py-1.5 border ${isDark ? "bg-[#1f2230] border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      Penalty
                      <input
                        type="number"
                        step="0.01"
                        value={divParams.penalty}
                        onChange={(e) => setDivParams({ ...divParams, penalty: e.target.value })}
                        className={`rounded px-2 py-1.5 border ${isDark ? "bg-[#1f2230] border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                      />
                    </label>
                    <label className="flex items-center gap-2 mt-6">
                      <input
                        type="checkbox"
                        checked={divParams.showMatrices}
                        onChange={(e) => setDivParams({ ...divParams, showMatrices: e.target.checked })}
                      />
                      Show matrices
                    </label>
                  </div>
                </div>
              </div>

              {divError && <div className="text-red-400 mt-3">{divError}</div>}

              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={handleRunDiversification}
                  disabled={divLoading}
                  className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm disabled:opacity-60"
                >
                  {divLoading ? "Running..." : "Run Analysis"}
                </button>
                <button
                  onClick={() => { setDivResult(null); setDivError(null); }}
                  className="px-3 py-2 rounded text-sm bg-gray-600/30"
                >
                  Clear
                </button>
              </div>

              {divResult && (
                <div className={`mt-4 rounded-lg border ${borderColor} p-3 text-sm space-y-4`}>
                  <div className="flex flex-wrap gap-3">
                    <div>Analyzed tickers: <span className="font-semibold">{divResult?.tickers?.join(", ")}</span></div>
                    <div>Budget: <span className="font-semibold">{divResult?.qubo?.budget}</span></div>
                    <div>Risk: <span className="font-semibold">{divResult?.qubo?.riskFactor}</span></div>
                    <div>Penalty: <span className="font-semibold">{divResult?.qubo?.penalty}</span></div>
                  </div>

                  <div className={`rounded-md border ${borderColor} p-3`}>
                    <div className="font-semibold mb-2">QAOA Result</div>
                    <div className="flex flex-wrap gap-4">
                      <div>Selected: <span className="font-semibold">{divResult?.qaoa?.selected?.join(", ") || "—"}</span></div>
                      <div>Bitstring: <span className="font-semibold">{divResult?.qaoa?.bitstring || "—"}</span></div>
                      <div>Objective: <span className="font-semibold">{typeof divResult?.qaoa?.objective === "number" ? divResult.qaoa.objective.toFixed(6) : "—"}</span></div>
                    </div>
                  </div>

                  <div className={`rounded-md border ${borderColor} p-3`}>
                    <div className="font-semibold mb-2">Ticker Statistics</div>
                    <div className="overflow-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className={`${textSecondary} text-left border-b ${borderColor}`}>
                            <th className="py-2 pr-3">Ticker</th>
                            <th className="py-2 pr-3">Mean Return</th>
                            <th className="py-2 pr-3">Volatility</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(divResult?.stats || []).map((s) => (
                            <tr key={s.ticker} className={`border-b ${borderColor}`}>
                              <td className="py-2 pr-3 font-medium">{s.ticker}</td>
                              <td className="py-2 pr-3">{typeof s.meanReturn === "number" ? `${(s.meanReturn * 100).toFixed(2)}%` : "—"}</td>
                              <td className="py-2 pr-3">{typeof s.volatility === "number" ? `${(s.volatility * 100).toFixed(2)}%` : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
