import { Doughnut } from "react-chartjs-2";
import "chart.js/auto";

const DONUT_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function SimpleDonutChart({ dataMap = {} }) {
  const labels = Object.keys(dataMap || {});
  const values = Object.values(dataMap || {});

  if (labels.length === 0) {
    return (
      <div className="mx-auto h-64 w-64 flex items-center justify-center text-gray-400 text-sm">
        No allocation data
      </div>
    );
  }

  const backgroundColors = labels.map((_, i) => DONUT_COLORS[i % DONUT_COLORS.length]);

  return (
    <div className="mx-auto h-64 w-64">
      <Doughnut
        data={{
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: backgroundColors,
              borderWidth: 2,
              borderColor: "#1f2230",
            },
          ],
        }}
        options={{
          cutout: "70%",
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: "bottom" },
          },
        }}
      />
    </div>
  );
}
