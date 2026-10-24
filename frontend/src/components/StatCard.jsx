import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({
  label,
  value,
  sub,
  color = "accent",
  icon: Icon,
  tendance,
  onClick,
  hoverable = true,
}) {
  const colors = {
    accent: {
      bg: "bg-accent/10",
      text: "text-accent",
      glow: "shadow-accent/20",
    },
    success: {
      bg: "bg-success/10",
      text: "text-success",
      glow: "shadow-success/20",
    },
    cyan: {
      bg: "bg-cyan/10",
      text: "text-cyan",
      glow: "shadow-cyan/20",
    },
    danger: {
      bg: "bg-danger/10",
      text: "text-danger",
      glow: "shadow-danger/20",
    },
    warn: {
      bg: "bg-warn/10",
      text: "text-warn",
      glow: "shadow-warn/20",
    },
  };

  const c = colors[color] || colors.accent;

  return (
    <div
      onClick={onClick}
      className={`bg-panel rounded-2xl p-5 border border-white/5 group transition-all duration-300 ${
        hoverable ? "hover-lift cursor-pointer" : ""
      } ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex justify-between items-start">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-gray-400">
            {label}
          </p>
          <h2 className="text-2xl font-bold mt-2 group-hover:scale-105 transition-transform origin-left">
            {value}
          </h2>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
          {tendance !== undefined && (
            <div
              className={`flex items-center gap-1 mt-2 text-xs font-medium ${
                tendance >= 0 ? "text-success" : "text-danger"
              }`}
            >
              {tendance >= 0 ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              {tendance >= 0 ? "+" : ""}
              {tendance}%
            </div>
          )}
        </div>
        {Icon && (
          <div
            className={`p-3 rounded-xl ${c.bg} ${c.text} ${c.glow} shadow-lg group-hover:scale-110 transition-transform`}
          >
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}