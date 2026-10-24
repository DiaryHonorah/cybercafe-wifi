import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorState({
  titre = "Une erreur est survenue",
  message,
  onRetry,
  retryLabel = "Réessayer",
}) {
  return (
    <div className="bg-panel rounded-2xl border border-danger/30 p-8 animate-fade-in">
      <div className="max-w-md mx-auto text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-danger/10 rounded-2xl mb-4">
          <AlertTriangle size={28} className="text-danger" />
        </div>
        <h3 className="text-base font-semibold text-white mb-1">{titre}</h3>
        {message && (
          <p className="text-sm text-gray-400 mb-5">{message}</p>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 bg-danger/10 hover:bg-danger/20 text-danger text-sm font-medium px-4 py-2.5 rounded-lg transition"
          >
            <RefreshCw size={16} />
            {retryLabel}
          </button>
        )}
      </div>
    </div>
  );
}