// All REST API calls replaced with dummy static data
const DEFAULT_PORTFOLIO_ID = 1;
const API_BASE = import.meta.env.VITE_API_URL;
const YAHOO_BASE_URL = `${API_BASE}/yahoo`;
// -------- UI MAPPERS (Summary) --------
const fmtMoney = (n) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const fmtPct = (n) => `${Number(n).toFixed(2)}%`;

// Simulate async delay
const delay = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));

const SUMMARY_URL = `${API_BASE}/api/portfolio`;

const DIVERSIFICATION_URL = `${API_BASE}/api/portfolio/diversification`;

const DEFAULT_DIVERSIFICATION_PARAMS = {
  period: "1y",
  interval: "1d",
  budget: 2,
  riskFactor: 0.5,
  penalty: 3,
  showMatrices: false,
};

/**
 * Diversification analysis.
 * POST /api/portfolio/diversification
 * body: { tickers, period, interval, budget, riskFactor, penalty, showMatrices }
 */
export async function getDiversificationAnalysis(payload = {}) {
  const body = {
    tickers: Array.isArray(payload.tickers) ? payload.tickers : [],
    period: payload.period ?? DEFAULT_DIVERSIFICATION_PARAMS.period,
    interval: payload.interval ?? DEFAULT_DIVERSIFICATION_PARAMS.interval,
    budget: payload.budget ?? DEFAULT_DIVERSIFICATION_PARAMS.budget,
    riskFactor: payload.riskFactor ?? DEFAULT_DIVERSIFICATION_PARAMS.riskFactor,
    penalty: payload.penalty ?? DEFAULT_DIVERSIFICATION_PARAMS.penalty,
    showMatrices:
      payload.showMatrices ?? DEFAULT_DIVERSIFICATION_PARAMS.showMatrices,
  };

  const res = await fetch(DIVERSIFICATION_URL, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Diversification failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetches portfolio summary from GET /api/portfolio/{id}/summary and returns UI-ready stats for TopStats
 */
export async function getPortfolioSummaryUI(
  portfolioId = DEFAULT_PORTFOLIO_ID,
) {
  const res = await fetch(`${SUMMARY_URL}/${portfolioId}/summary`, {
    headers: { Accept: "*/*" },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Summary failed: ${res.status}`);
  }
  const d = await res.json();

  const totalPnl = (d.totalUnrealisedPnl ?? 0) + (d.totalRealisedPnl ?? 0);

  return [
    {
      title: "Today P/L",
      value: fmtMoney(d.totalTodayUnrealisedPnl ?? 0),
      sub: `${fmtPct(d.totalTodayUnrealisedPnlPercent ?? 0)} today`,
      positive: (d.totalTodayUnrealisedPnl ?? 0) >= 0,
    },
    {
      title: "Total P/L",
      value: fmtMoney(totalPnl),
      sub: "overall",
      positive: totalPnl >= 0,
    },
    {
      title: "Unrealised",
      value: fmtMoney(d.totalUnrealisedPnl ?? 0),
      sub: `${fmtPct(d.totalUnrealisedPnlPercent ?? 0)} unrealised`,
      positive: (d.totalUnrealisedPnl ?? 0) >= 0,
    },
    {
      title: "Realised",
      value: fmtMoney(d.totalRealisedPnl ?? 0),
      sub: `${fmtPct(d.totalRealisedPnlPercent ?? 0)} realised`,
      positive: (d.totalRealisedPnl ?? 0) >= 0,
    },
  ];
}

const HOLDINGS_URL = `${API_BASE}/api/v1/portfolios`;
const PRICES_URL = `${API_BASE}/api/prices`;

/** Normalize backend assetType to UI: CRYPTOCURRENCY -> CRYPTO */
function toUIAssetType(assetType) {
  if (assetType === "CRYPTOCURRENCY") return "CRYPTO";
  return assetType || "STOCK";
}

/**
 * Fetches holdings for one asset type from GET /api/v1/portfolios/{id}/holdings?assetType=
 * Returns raw API array (not grouped).
 */
async function fetchHoldingsByType(portfolioId, assetType) {
  const res = await fetch(
    `${HOLDINGS_URL}/${portfolioId}/holdings?assetType=${encodeURIComponent(assetType)}`,
    { headers: { Accept: "*/*" } },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Holdings failed: ${res.status}`);
  }
  return res.json();
}

async function fetchPrice(url) {
  const res = await fetch(url, { headers: { Accept: "*/*" } });
  if (!res.ok) throw new Error(`Price failed: ${res.status}`);
  const text = await res.text();
  const num = Number(text);
  if (Number.isNaN(num)) throw new Error(`Invalid price: ${text}`);
  return num;
}

function priceEndpoints(assetType, ticker) {
  if (assetType === "STOCK") {
    return {
      current: `${PRICES_URL}/getStockPrice/${encodeURIComponent(ticker)}`,
      close: `${PRICES_URL}/getStockClosePrice/${encodeURIComponent(ticker)}`,
    };
  }
  if (assetType === "CRYPTOCURRENCY") {
    return {
      current: `${PRICES_URL}/getCryptocurrencyPrice/${encodeURIComponent(ticker)}`,
      close: `${PRICES_URL}/getCryptocurrencyClosePrice/${encodeURIComponent(ticker)}`,
    };
  }
  return {
    current: `${PRICES_URL}/getCommodityPrice/${encodeURIComponent(ticker)}`,
    close: `${PRICES_URL}/getCommodityClosePrice/${encodeURIComponent(ticker)}`,
  };
}

async function fetchPricesForHoldings(raw) {
  const unique = new Map();
  (Array.isArray(raw) ? raw : []).forEach((h) => {
    const ticker = h.asset?.assetName;
    const type = h.asset?.assetType ?? "STOCK";
    if (!ticker) return;
    unique.set(`${type}:${ticker}`, { type, ticker });
  });

  const entries = Array.from(unique.values());
  const results = await Promise.all(
    entries.map(async ({ type, ticker }) => {
      const urls = priceEndpoints(type, ticker);
      try {
        const [current, close] = await Promise.all([
          fetchPrice(urls.current),
          fetchPrice(urls.close),
        ]);
        return { key: `${type}:${ticker}`, current, close };
      } catch {
        return { key: `${type}:${ticker}`, current: null, close: null };
      }
    }),
  );

  return results.reduce((acc, r) => {
    acc[r.key] = { current: r.current, close: r.close };
    return acc;
  }, {});
}

/** Maps raw API holdings array to UI-ready rows (grouped by asset). */
function mapRawHoldingsToUIRows(raw, priceMap = {}) {
  const byAsset = {};

  (Array.isArray(raw) ? raw : []).forEach((h) => {
    const name = h.asset?.assetName ?? "?";
    const type = h.asset?.assetType ?? "STOCK";
    const key = `${type}:${name}`;

    if (!byAsset[key]) {
      byAsset[key] = {
        assetName: name,
        assetType: type,
        holdings: [],
        totalPL: 0,
        totalTodayPL: 0,
        totalPLPercentSum: 0,
        totalTodayPercentSum: 0,
      };
    }

    // 🔹 accumulate backend values
    byAsset[key].totalPL += h.totalPL ?? 0;
    byAsset[key].totalTodayPL += h.todayPL ?? 0;

    byAsset[key].totalPLPercentSum += h.plPercent ?? 0;
    byAsset[key].totalTodayPercentSum += h.todayPercent ?? 0;

    byAsset[key].holdings.push({
      id: h.id,
      quantity: h.quantity,
      avgBuyPrice: h.avgBuyPrice,
      buyTimestamp: h.buyTimestamp,
      totalPL: h.totalPL,
      todayPL: h.todayPL,
      plPercent: h.plPercent,
      todayPercent: h.todayPercent,
    });
  });

  return Object.values(byAsset).map((g) => {
    const buys = g.holdings;

    const totalQty = buys.reduce((s, b) => s + (b.quantity ?? 0), 0);
    const totalCost = buys.reduce(
      (s, b) => s + (b.quantity ?? 0) * (b.avgBuyPrice ?? 0),
      0,
    );

    const avgPrice = totalQty > 0 ? totalCost / totalQty : 0;

    const priceKey = `${g.assetType}:${g.assetName}`;
    const currentPrice = priceMap[priceKey]?.current ?? avgPrice ?? 0;
    const closePrice = priceMap[priceKey]?.close ?? currentPrice ?? 0;

    const currentValue = currentPrice * totalQty;

    // 🔹 Use backend PnL values directly
    const totalPnl = g.totalPL;
    const totalTodayPnl = g.totalTodayPL;

    // ⚠️ Percent aggregation (simple average of backend percents)
    const totalPnlPercent =
      buys.length > 0 ? g.totalPLPercentSum / buys.length : 0;

    const totalTodayPnlPercent =
      buys.length > 0 ? g.totalTodayPercentSum / buys.length : 0;

    const uiType = toUIAssetType(g.assetType);
    const key = `${uiType}:${g.assetName}`;

    return {
      key,
      ticker: g.assetName,
      assetType: uiType,
      totalQty,
      totalAvgBuyPrice: avgPrice,

      // ✅ backend driven
      totalPnl,
      totalPnlPercent,
      totalTodayPnl,
      totalTodayPnlPercent,

      totalInvested: totalCost,
      currentValue,

      avgBuy: fmtMoney(avgPrice),
      totalPnlFormatted: fmtMoney(totalPnl),
      totalPnlPercentFormatted: fmtPct(totalPnlPercent),
      totalTodayPnlFormatted: fmtMoney(totalTodayPnl),
      totalTodayPnlPercentFormatted: fmtPct(totalTodayPnlPercent),

      positive: totalPnl >= 0,
      todayPositive: totalTodayPnl >= 0,

      buys: buys.map((b) => ({
        holdingId: b.id,
        qty: b.quantity,
        buyPrice: fmtMoney(b.avgBuyPrice),
        rawBuyPrice: b.avgBuyPrice,
        buyTimestamp: new Date(b.buyTimestamp).toLocaleString(),

        // ✅ Direct backend usage
        pnl: fmtMoney(b.totalPL ?? 0),
        pnlPercent: fmtPct(b.plPercent ?? 0),
        todayPnl: fmtMoney(b.todayPL ?? 0),
        todayPnlPercent: fmtPct(b.todayPercent ?? 0),

        positive: (b.totalPL ?? 0) >= 0,
        todayPositive: (b.todayPL ?? 0) >= 0,
      })),
    };
  });
}
/**
 * Fetches holdings for one asset type from GET /api/v1/portfolios/{id}/holdings?assetType=
 * and returns UI-ready rows for the table.
 */
export async function getHoldingsByAssetTypeUI(
  portfolioId = DEFAULT_PORTFOLIO_ID,
  assetType,
) {
  const raw = await fetchHoldingsByType(portfolioId, assetType);
  const prices = await fetchPricesForHoldings(raw);
  return mapRawHoldingsToUIRows(raw, prices);
}

/**
 * Fetches all holdings (STOCKS, CRYPTOCURRENCY, COMMODITY) and returns UI-ready rows.
 * Groups by asset so each row is one asset with multiple buys.
 */
export async function getHoldingsUI(portfolioId = DEFAULT_PORTFOLIO_ID) {
  const [stockList, cryptoList, commodityList] = await Promise.all([
    fetchHoldingsByType(portfolioId, "STOCK"),
    fetchHoldingsByType(portfolioId, "CRYPTOCURRENCY"),
    fetchHoldingsByType(portfolioId, "COMMODITY"),
  ]);

  const raw = [
    ...(Array.isArray(stockList) ? stockList : []),
    ...(Array.isArray(cryptoList) ? cryptoList : []),
    ...(Array.isArray(commodityList) ? commodityList : []),
  ];
  const prices = await fetchPricesForHoldings(raw);
  return mapRawHoldingsToUIRows(raw, prices);
}

// Dummy holdings history data
const dummyHoldingsHistoryData = [
  {
    holdingId: 501,
    ticker: "WIPRO",
    quantity: 20,
    buyPrice: 450.0,
    sellPrice: 480.0,
    buyTimestamp: "2023-12-10T10:00:00Z",
    sellTimestamp: "2024-01-20T15:30:00Z",
    profitOrLoss: 600.0,
    profitOrLossInPercentage: 6.67,
  },
  {
    holdingId: 502,
    ticker: "ICICIBANK",
    quantity: 10,
    buyPrice: 950.0,
    sellPrice: 920.0,
    buyTimestamp: "2023-11-15T11:20:00Z",
    sellTimestamp: "2024-01-25T14:15:00Z",
    profitOrLoss: -300.0,
    profitOrLossInPercentage: -3.16,
  },
  {
    holdingId: 503,
    ticker: "BHARTIARTL",
    quantity: 30,
    buyPrice: 780.0,
    sellPrice: 850.0,
    buyTimestamp: "2023-10-20T09:30:00Z",
    sellTimestamp: "2024-02-05T16:00:00Z",
    profitOrLoss: 2100.0,
    profitOrLossInPercentage: 8.97,
  },
];

export async function getHoldingsHistoryUI(portfolioId = DEFAULT_PORTFOLIO_ID) {
  await delay();
  const rows = dummyHoldingsHistoryData;

  return rows.map((h) => ({
    holdingId: h.holdingId,
    ticker: h.ticker,
    quantity: h.quantity,
    buyPrice: fmtMoney(h.buyPrice),
    sellPrice: fmtMoney(h.sellPrice),
    buyTimestamp: new Date(h.buyTimestamp).toLocaleString(),
    sellTimestamp: new Date(h.sellTimestamp).toLocaleString(),
    profitOrLoss: fmtMoney(h.profitOrLoss),
    profitOrLossPercent:
      h.profitOrLossInPercentage !== null
        ? fmtPct(h.profitOrLossInPercentage)
        : "-",
    positive: (h.profitOrLoss || 0) >= 0,
  }));
}

// Dummy graph data
const dummyGraphData = {
  currency: "INR",
  series: [
    { date: "2024-01-01", value: 250000 },
    { date: "2024-01-08", value: 255000 },
    { date: "2024-01-15", value: 260000 },
    { date: "2024-01-22", value: 258000 },
    { date: "2024-01-29", value: 265000 },
    { date: "2024-02-05", value: 270000 },
  ],
};

export async function getPortfolioGraph(portfolioId = DEFAULT_PORTFOLIO_ID) {
  await delay();
  return dummyGraphData;
}

// -------- BUY API (real backend) --------
const BUY_URL = `${API_BASE}/api/v1/portfolios/buy`;

/**
 * Buy asset. Payload: { asset: { assetName, assetType }, portfolioId, quantity, price? }
 * assetType: "STOCK" | "CRYPTOCURRENCY" | "COMMODITY"
 */
export async function buy(payload, portfolioId = DEFAULT_PORTFOLIO_ID) {
  const body = {
    asset: {
      assetName: payload.asset?.assetName ?? payload.assetName,
      assetType: payload.asset?.assetType ?? payload.assetType,
    },
    portfolioId: portfolioId,
    quantity: Number(payload.quantity),
  };
  if (payload.price != null && payload.price !== "") {
    body.price = Number(payload.price);
  }
  const res = await fetch(BUY_URL, {
    method: "POST",
    headers: { Accept: "*/*", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Buy failed: ${res.status}`);
  }
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/** @deprecated Use buy() with new payload shape. Kept for compatibility. */
export async function buyStock(payload, portfolioId = DEFAULT_PORTFOLIO_ID) {
  const assetName =
    payload.asset?.ticker ?? payload.asset?.assetName ?? payload.assetName;
  const assetType = "STOCK";
  return buy(
    {
      asset: { assetName, assetType },
      portfolioId,
      quantity: payload.quantity,
      price: payload.price,
    },
    portfolioId,
  );
}

/**
 * Sell (partial or full) a holding.
 * Payload: { holdingId, quantity, executedAt? (ISO string), price? }
 * API: POST /api/v1/portfolios/sell with { portfolioId, holdingId, quantity, price?, sellTimestamp }
 */
export async function sellHolding(payload, portfolioId = DEFAULT_PORTFOLIO_ID) {
  const body = {
    portfolioId: Number(portfolioId),
    holdingId: Number(payload.holdingId),
    quantity: Number(payload.quantity),
    sellTimestamp: payload.executedAt ?? new Date().toISOString(),
  };
  if (payload.price != null && payload.price !== "") {
    body.price = Number(payload.price);
  }
  const res = await fetch(`${HOLDINGS_URL}/sell`, {
    method: "POST",
    headers: { Accept: "*/*", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Sell failed: ${res.status}`);
  }
  try {
    return await res.json();
  } catch {
    return { success: true };
  }
}

export async function editHolding(
  holdingId,
  newQty,
  newBuyPrice,
  portfolioId = DEFAULT_PORTFOLIO_ID,
) {
  await delay(300);
  // Simulate successful edit
  return { success: true, message: "Holding updated successfully" };
}

export async function deleteHolding(holdingId) {
  const url = `${HOLDINGS_URL}/delete/${holdingId}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Accept: "*/*" },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Delete holding failed: ${res.status}`);
  }
  try {
    return await res.json();
  } catch {
    return { success: true };
  }
}

// Market Movers APIs - Dummy data
const dummyTopGainers = [
  {
    symbol: "RELIANCE",
    regularMarketPrice: 2575.5,
    regularMarketChangePercent: 5.12,
    regularMarketChange: 125.25,
  },
  {
    symbol: "INFY",
    regularMarketPrice: 1700.0,
    regularMarketChangePercent: 4.85,
    regularMarketChange: 78.5,
  },
  {
    symbol: "TCS",
    regularMarketPrice: 3100.0,
    regularMarketChangePercent: 3.92,
    regularMarketChange: 116.8,
  },
  {
    symbol: "HDFCBANK",
    regularMarketPrice: 1725.0,
    regularMarketChangePercent: 3.45,
    regularMarketChange: 57.5,
  },
];

const dummyTopLosers = [
  {
    symbol: "WIPRO",
    regularMarketPrice: 465.0,
    regularMarketChangePercent: -4.12,
    regularMarketChange: -20.0,
  },
  {
    symbol: "ICICIBANK",
    regularMarketPrice: 935.0,
    regularMarketChangePercent: -3.85,
    regularMarketChange: -37.5,
  },
  {
    symbol: "BHARTIARTL",
    regularMarketPrice: 820.0,
    regularMarketChangePercent: -3.25,
    regularMarketChange: -27.5,
  },
  {
    symbol: "LT",
    regularMarketPrice: 3450.0,
    regularMarketChangePercent: -2.95,
    regularMarketChange: -105.0,
  },
];

const dummyMostActive = [
  {
    symbol: "RELIANCE",
    regularMarketPrice: 2575.5,
    regularMarketChangePercent: 5.12,
    regularMarketChange: 125.25,
  },
  {
    symbol: "TCS",
    regularMarketPrice: 3100.0,
    regularMarketChangePercent: 3.92,
    regularMarketChange: 116.8,
  },
  {
    symbol: "INFY",
    regularMarketPrice: 1700.0,
    regularMarketChangePercent: 4.85,
    regularMarketChange: 78.5,
  },
  {
    symbol: "HDFCBANK",
    regularMarketPrice: 1725.0,
    regularMarketChangePercent: 3.45,
    regularMarketChange: 57.5,
  },
];
export async function getTopGainers() {
  const res = await fetch(`${YAHOO_BASE_URL}/top-gainers`);
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return await res.json();
}

export async function getTopLosers() {
  const res = await fetch(`${YAHOO_BASE_URL}/top-losers`);
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return await res.json();
}

export async function getMostActive() {
  const res = await fetch(`${YAHOO_BASE_URL}/most-active`);
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return await res.json();
}

export async function getStockNews(ticker) {
  const res = await fetch(`${YAHOO_BASE_URL}/news/${ticker}`);
  console.log(
    "Fetching news for",
    ticker,
    "from",
    `${YAHOO_BASE_URL}/news/${ticker}`,
  );
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return await res.json();
}
