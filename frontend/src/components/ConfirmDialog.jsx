import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDialog({
  ouvert,
  titre = "Confirmer",
  message = "Êtes-vous sûr ?",
  onConfirm,
  onCancel,
  couleur = "danger",
  labelConfirm = "Confirmer",
  labelCancel = "Annuler",
  icone: Icone = AlertTriangle,
}) {
  if (!ouvert) return null;

  const couleurs = {
    danger: {
      bg: "bg-danger/10",
      border: "border-danger/30",
      text: "text-danger",
      bouton: "bg-danger hover:bg-danger/80",
    },
    warn: {
      bg: "bg-warn/10",
      border: "border-warn/30",
      text: "text-warn",
      bouton: "bg-warn hover:bg-warn/80 text-night",
    },
    accent: {
      bg: "bg-accent/10",
      border: "border-accent/30",
      text: "text-accent",
      bouton: "bg-accent hover:bg-accentDark",
    },
    success: {
      bg: "bg-success/10",
      border: "border-success/30",
      text: "text-success",
      bouton: "bg-success hover:bg-success/80",
    },
  };

  const c = couleurs[couleur] || couleurs.danger;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[300] animate-fade-in">
      <div className="bg-panel rounded-2xl p-6 w-full max-w-sm border border-white/5 shadow-2xl animate-scale-in">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl ${c.bg} ${c.text}`}>
            <Icone size={22} />
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white p-1 transition"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <h3 className="text-lg font-semibold mb-2">{titre}</h3>
        <p className="text-sm text-gray-400 mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-white/5 hover:bg-white/10 text-sm font-medium py-2.5 rounded-lg transition"
          >
            {labelCancel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 ${c.bouton} text-white font-semibold py-2.5 rounded-lg transition`}
          >
            {labelConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}