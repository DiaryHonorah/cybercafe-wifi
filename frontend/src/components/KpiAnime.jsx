import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function KpiAnime({
  label,
  valeur,
  unite = "Ar",
  evolution = null, // en %
  icon: Icon,
  couleur = "accent",
  sousTitre,
}) {
  const [afficherValeur, setAfficherValeur] = useState(0);

  const couleurs = {
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

  const c = couleurs[couleur] || couleurs.accent;

  // Animation de compteur
  useEffect(() => {
    const valeurNum = Number(valeur) || 0;
    const duree = 800; // ms
    const debut = Date.now();
    const valeurDepart = 0;

    const animer = () => {
      const temps = Date.now() - debut;
      const progression = Math.min(temps / duree, 1);
      // Easing : easeOutCubic
      const easing = 1 - Math.pow(1 - progression, 3);
      setAfficherValeur(Math.round(valeurDepart + (valeurNum - valeurDepart) * easing));
      if (progression < 1) requestAnimationFrame(animer);
    };
    requestAnimationFrame(animer);
  }, [valeur]);

  const getEvolutionIcone = () => {
    if (evolution === null || evolution === 0) return Minus;
    return evolution > 0 ? TrendingUp : TrendingDown;
  };

  const getEvolutionCouleur = () => {
    if (evolution === null || evolution === 0) return "text-gray-400";
    return evolution > 0 ? "text-success" : "text-danger";
  };

  const EvolutionIcone = getEvolutionIcone();

  return (
    <div className="bg-panel rounded-2xl p-5 border border-white/5 hover-lift transition-all group">
      <div className="flex justify-between items-start">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wider text-gray-400">
            {label}
          </p>
          <div className="flex items-baseline gap-1 mt-2">
            <h2 className="text-2xl font-bold group-hover:scale-105 transition-transform origin-left tabular-nums">
              {afficherValeur.toLocaleString("fr-FR")}
            </h2>
            {unite && (
              <span className="text-sm text-gray-400 font-medium">{unite}</span>
            )}
          </div>
          {sousTitre && (
            <p className="text-xs text-gray-500 mt-1">{sousTitre}</p>
          )}

          {evolution !== null && (
            <div
              className={`flex items-center gap-1 mt-2 text-xs font-medium ${getEvolutionCouleur()}`}
            >
              <EvolutionIcone size={12} />
              {evolution > 0 ? "+" : ""}
              {evolution}% vs hier
            </div>
          )}
        </div>

        {Icon && (
          <div
            className={`p-3 rounded-xl ${c.bg} ${c.text} ${c.glow} shadow-lg group-hover:scale-110 transition-transform flex-shrink-0`}
          >
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}