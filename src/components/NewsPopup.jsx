import { useEffect, useState, useRef } from "react";
import { getStockNews } from "../api-client";

export function NewsPopup({ ticker, isDark = true, onClose }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const popupRef = useRef(null);

  useEffect(() => {
    if (!ticker) return;
    setIsVisible(true);
    setLoading(true);

    const button = document.querySelector(`[data-ticker="${ticker}"]`);
    if (button) {
      const rect = button.getBoundingClientRect();
      setPosition({
        top: rect.top ,
        left: rect.right + window.scrollX + 8, // 8px gap from icon
      });
    }

    getStockNews(ticker)
      .then((data) => {
        setNews(data.slice(0, 5));
        setLoading(false);
      })
      .catch((e) => {
        console.error("Failed to load news", e);
        setLoading(false);
      });
  }, [ticker]);

  const handleMouseLeave = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  if (!ticker) return null;

  const bgCard = isDark ? "bg-[#2b2e3b]" : "bg-white";
  const bgHover = isDark ? "bg-[#3a3e52]" : "bg-gray-100";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";

  return (
    <div
      ref={popupRef}
      className={`fixed z-[9999] ${bgCard} rounded-xl shadow-2xl border ${isDark ? "border-gray-700" : "border-gray-200"} w-96 max-h-96 overflow-y-auto transition-opacity duration-200 ${isVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      onMouseLeave={handleMouseLeave}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`
      }}
    >
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className={`${textPrimary} font-semibold`}>News: {ticker}</h4>
          <button
            onClick={handleMouseLeave}
            className={`${textSecondary} hover:${textPrimary} text-xl`}
          >
            ×
          </button>
        </div>

        {loading ? (
          <p className={textSecondary}>Loading news...</p>
        ) : news.length === 0 ? (
          <p className={textSecondary}>No news available.</p>
        ) : (
          <div className="space-y-3">
            {news.map((item) => (
              <div
                key={item.uuid}
                className={`${bgHover} rounded-lg p-3 hover:opacity-90 transition-opacity`}
              >
                <p className={`${textPrimary} text-sm font-medium mb-1 line-clamp-2`}>
                  {item.title}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <p className={`${textSecondary} text-xs`}>{item.publisher}</p>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-xs"
                  >
                    View More →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
