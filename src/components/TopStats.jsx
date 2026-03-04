export function TopStats({ stats, isDark = true }) {
    const bgCard = isDark ? "bg-[#2b2e3b]" : "bg-white";
    const textPrimary = isDark ? "text-white" : "text-gray-900";
    const textSecondary = isDark ? "text-gray-400" : "text-gray-600";
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`${bgCard} rounded-xl p-4 shadow-sm transition-colors`}>
            <p className={`${textSecondary} text-sm`}>{s.title}</p>
            <p className={`${textPrimary} text-xl font-semibold`}>{s.value}</p>
            <p className={`text-sm mt-1 ${s.positive ? "text-green-400" : "text-red-400"}`}>
              {s.sub}
            </p>
          </div>
        ))}
      </div>
    );
  }
  