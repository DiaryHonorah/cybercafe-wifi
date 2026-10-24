import { Inbox } from "lucide-react";

export default function EmptyState({
  icon: Icon = Inbox,
  titre = "Aucune donnée",
  sousTitre,
  action,
  actionLabel,
  actionIcon: ActionIcon,
  compact = false,
}) {
  return (
    <div
      className={`bg-panel rounded-2xl border border-white/5 ${
        compact ? "p-6" : "p-12"
      } animate-fade-in`}
    >
      <div className={`${compact ? "max-w-xs" : "max-w-md"} mx-auto text-center`}>
        <div
          className={`inline-flex items-center justify-center ${
            compact ? "w-12 h-12" : "w-16 h-16"
          } bg-white/5 rounded-2xl mb-4 animate-bounce-subtle`}
        >
          <Icon size={compact ? 24 : 32} className="text-gray-500" />
        </div>
        <h3
          className={`${
            compact ? "text-sm" : "text-base"
          } font-semibold text-white mb-1`}
        >
          {titre}
        </h3>
        {sousTitre && (
          <p className={`${compact ? "text-xs" : "text-sm"} text-gray-400 mb-5`}>
            {sousTitre}
          </p>
        )}
        {action && actionLabel && (
          <button
            onClick={action}
            className="inline-flex items-center gap-2 bg-accent hover:bg-accentDark text-white text-sm font-medium px-4 py-2.5 rounded-lg transition hover:scale-105"
          >
            {ActionIcon && <ActionIcon size={16} />}
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}