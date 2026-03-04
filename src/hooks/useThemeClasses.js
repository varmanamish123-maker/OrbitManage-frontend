export function useThemeClasses(isDark) {
  return {
    bgPrimary: isDark ? "bg-[#1f2230]" : "bg-gray-50",
    bgSecondary: isDark ? "bg-[#2b2e3b]" : "bg-white",
    bgCard: isDark ? "bg-[#2b2e3b]" : "bg-white",
    bgRow: isDark ? "bg-[#232634]" : "bg-gray-50",
    bgHover: isDark ? "bg-[#3a3e52]" : "bg-gray-100",
    textPrimary: isDark ? "text-white" : "text-gray-900",
    textSecondary: isDark ? "text-gray-400" : "text-gray-600",
    textTertiary: isDark ? "text-gray-300" : "text-gray-700",
    borderColor: isDark ? "border-gray-700" : "border-gray-200",
  };
}
