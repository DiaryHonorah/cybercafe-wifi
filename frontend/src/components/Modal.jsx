import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({
  ouvert,
  onClose,
  titre,
  sousTitre,
  icon: Icon,
  couleur = "accent",
  taille = "md",
  children,
}) {
  // Fermer avec Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && ouvert) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [ouvert, onClose]);

  // Bloquer le scroll
  useEffect(() => {
    if (ouvert) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [ouvert]);

  if (!ouvert) return null;

  const tailles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-6xl",
  };

  const couleurs = {
    accent: "bg-accent/10 text-accent",
    cyan: "bg-cyan/10 text-cyan",
    success: "bg-success/10 text-success",
    warn: "bg-warn/10 text-warn",
    danger: "bg-danger/10 text-danger",
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Overlay avec animation */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal avec animation */}
      <div
        className={`relative bg-panel rounded-2xl w-full ${tailles[taille]} border border-white/5 shadow-2xl animate-scale-in max-h-[90vh] flex flex-col`}
      >
        {/* En-tête */}
        <div className="flex items-start justify-between p-6 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className={`p-3 rounded-xl flex-shrink-0 ${couleurs[couleur]}`}>
                <Icon size={22} />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-lg font-semibold truncate">{titre}</h3>
              {sousTitre && (
                <p className="text-xs text-gray-400 mt-0.5">{sousTitre}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition flex-shrink-0"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}