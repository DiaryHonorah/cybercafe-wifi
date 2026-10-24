import { useState, useEffect } from "react";
import { Megaphone, X } from "lucide-react";
import { usePublicLang } from "../context/PublicLangContext";

/**
 * Bandeau de promotion affiché en haut du site
 * - Message personnalisable
 * - Fermable par l'utilisateur
 * - Sauvegarde dans localStorage pour ne plus réafficher
 */
export default function PromoBanner({
  message = "📢 Nouveau : Starlink Wi-Fi maintenant disponible !",
  messageMg = "📢 Vaovao : Starlink Wi-Fi misy izao!",
  lien = "/services",
  storageKey = "promo_banner_closed_v1",
}) {
  const [visible, setVisible] = useState(false);
  const { langue } = usePublicLang();

  useEffect(() => {
    const ferme = localStorage.getItem(storageKey);
    if (!ferme) {
      // Petit délai pour éviter le flash au chargement
      setTimeout(() => setVisible(true), 300);
    }
  }, [storageKey]);

  const fermer = () => {
    setVisible(false);
    localStorage.setItem(storageKey, "true");
  };

  if (!visible) return null;

  const texteAffiche = langue === "mg" ? messageMg : message;

  return (
    <div className="relative bg-gradient-to-r from-[#1E40AF] via-[#06B6D4] to-[#1E40AF] text-white overflow-hidden">
      {/* Effet de brillance animé */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />

      <div className="public-container relative">
        <div className="flex items-center justify-between gap-4 py-2.5">
          <div className="flex items-center gap-2 flex-1 justify-center">
            <Megaphone
              size={16}
              className="text-white/90 flex-shrink-0 animate-pulse"
            />
            <a
              href={lien}
              className="text-xs md:text-sm font-medium hover:underline text-center"
            >
              {texteAffiche}
            </a>
          </div>

          <button
            onClick={fermer}
            className="p-1 rounded-lg hover:bg-white/20 transition flex-shrink-0"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}