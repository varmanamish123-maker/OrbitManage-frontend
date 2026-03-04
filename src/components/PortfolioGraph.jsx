import { Line } from "react-chartjs-2";
import "chart.js/auto";

export function PortfolioGraph({ data, isDark = true }) {
  const bgCard = isDark ? "bg-[#2b2e3b]" : "bg-white";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";
  const gridColor = isDark ? "rgba(156, 163, 175, 0.1)" : "rgba(156, 163, 175, 0.2)";
  const tickColor = isDark ? "#9ca3af" : "#6b7280";

  if (!data || !data.series || data.series.length === 0) {
    return (
      <div className={`${bgCard} rounded-xl p-4 shadow-sm transition-colors`}>
        <h3 className={`${textPrimary} mb-3`}>Portfolio Performance</h3>
        <p className={`${textSecondary} text-sm`}>No data available.</p>
      </div>
    );
  }

  const dates = data.series.map((s) => {
    const date = new Date(s.date);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  const chartData = {
    labels: dates,
    datasets: [
      {
        label: "Cumulative P/L",
        data: data.series.map((s) => s.cumulativePnL || 0),
        borderColor: "#22c55e",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Net P/L",
        data: data.series.map((s) => s.netPnL || 0),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: isDark ? "#e5e7eb" : "#374151",
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        ticks: {
          color: tickColor,
        },
        grid: {
          color: gridColor,
        },
      },
      y: {
        ticks: {
          color: tickColor,
          callback: function (value) {
            return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
          },
        },
        grid: {
          color: gridColor,
        },
      },
    },
  };

  return (
    <div className={`${bgCard} rounded-xl p-4 w-full shadow-sm transition-colors`}>
      <h3 className={`${textPrimary} mb-3`}>Portfolio Performance</h3>
      <div className="h-64 w-full" style={{ width: '100%' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
