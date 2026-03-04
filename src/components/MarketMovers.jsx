import { useEffect, useState } from "react";
import { getTopGainers, getTopLosers, getMostActive } from "../api-client";
import { TopStats } from "./TopStats";

const fmtMoney = (n) => `$${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
const fmtPct = (n) => `${Number(n).toFixed(2)}%`;

export function MarketMovers({ isDark = true }) {
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [active, setActive] = useState([]);
  const [loading, setLoading] = useState(true);

  const toArray = (x) => (Array.isArray(x) ? x : (x?.data || x?.result || []) || []);

  useEffect(() => {
    async function loadData() {
      try {
        const [g, l, a] = await Promise.all([
          getTopGainers(),
          getTopLosers(),
          getMostActive(),
        ]);
        setGainers(toArray(g).slice(0, 4));
        setLosers(toArray(l).slice(0, 4));
        setActive(toArray(a).slice(0, 4));
      } catch (e) {
        console.error("Failed to load market movers", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    const id = setInterval(loadData, 60000);
    return () => clearInterval(id);
  }, []);

  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";

  if (loading) {
    return (
      <div className={`${textPrimary} text-center py-8`}>Loading market data...</div>
    );
  }

  const toStat = (s, positive) => {
    if (!s || typeof s !== "object") return null;
    const symbol = s.symbol || s.ticker || "—";
    const price = s.regularMarketPrice ?? s.price ?? 0;
    const pct = s.regularMarketChangePercent ?? s.changePercent ?? 0;
    const change = s.regularMarketChange ?? s.change ?? 0;
    return {
      title: symbol,
      value: fmtMoney(price),
      sub: `${pct >= 0 ? "+" : ""}${fmtPct(pct)} (${fmtMoney(change)})`,
      positive: positive !== undefined ? positive : pct >= 0,
    };
  };

  const gainersStats = gainers.map((s) => toStat(s, true)).filter(Boolean);
  const losersStats = losers.map((s) => toStat(s, false)).filter(Boolean);
  const activeStats = active.map((s) => toStat(s)).filter(Boolean);

  const hasAnyData = gainersStats.length > 0 || losersStats.length > 0 || activeStats.length > 0;

  if (!hasAnyData) {
    return (
      <div className="space-y-6">
        <h2 className={`${textPrimary} text-2xl font-semibold`}>Market Movers</h2>
        <p className={`${textSecondary} text-sm`}>Unable to load market data. Ensure the backend is running on port 8080.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className={`${textPrimary} text-2xl font-semibold`}>Market Movers</h2>

      <div className="space-y-6">
        <div>
          <h3 className={`${textPrimary} text-lg font-semibold mb-3`}>Top Gainers</h3>
          <TopStats stats={gainersStats} isDark={isDark} />
        </div>

        <div>
          <h3 className={`${textPrimary} text-lg font-semibold mb-3`}>Top Losers</h3>
          <TopStats stats={losersStats} isDark={isDark} />
        </div>

        <div>
          <h3 className={`${textPrimary} text-lg font-semibold mb-3`}>Most Active</h3>
          <TopStats stats={activeStats} isDark={isDark} />
        </div>
      </div>
    </div>
  );
}
