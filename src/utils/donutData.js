export function calculateDonutData(holdings, selected) {
  if (!holdings || holdings.length === 0) {
    return selected ? {} : { Stocks: 0, Crypto: 0, Commodities: 0 };
  }
  if (selected === "Stocks") {
    const stockHoldings = holdings.filter((h) => h.assetType === "STOCK");
    const totalValue = stockHoldings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
    if (totalValue === 0) return {};
    const tickerAllocation = {};
    stockHoldings.forEach((h) => {
      const pct = ((h.currentValue || 0) / totalValue) * 100;
      if (pct > 0.1) tickerAllocation[h.ticker] = Math.round(pct * 10) / 10;
    });
    return tickerAllocation;
  }
  const totalValue = holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
  if (totalValue === 0) return { Stocks: 0, Crypto: 0, Commodities: 0 };
  const allocation = { Stocks: 0, Crypto: 0, Commodities: 0 };
  holdings.forEach((h) => {
    const pct = ((h.currentValue || 0) / totalValue) * 100;
    if (h.assetType === "STOCK") allocation.Stocks += pct;
    else if (h.assetType === "CRYPTO") allocation.Crypto += pct;
    else if (h.assetType === "COMMODITY") allocation.Commodities += pct;
  });
  Object.keys(allocation).forEach((k) => (allocation[k] = Math.round(allocation[k] * 10) / 10));
  return allocation;
}
