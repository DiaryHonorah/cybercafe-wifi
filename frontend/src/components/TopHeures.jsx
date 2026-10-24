import { useEffect, useState } from "react";
import { Clock, Award } from "lucide-react";
import api from "../api";

export default function TopHeures() {
  const [heures, setHeures] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const charger = () => {
      api
        .get("/api/stats-temps-reel/top-heures")
        .then((r) => setHeures(r.data || []))
        .catch(() => {})
        .finally(() => setChargement(false));
    };
    charger();
    const interval = setInterval(charger, 30000);
    return () => clearInterval(interval);
  }, []);

  if (chargement) {
    return (
      <div className="bg-panel rounded-2xl p-5 border border-white/5 animate-pulse">
        <div className="h-4 w-40 bg-white/5 rounded mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-white/5 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const maxTotal = Math.max(...heures.map((h) => Number(h.total) || 0), 1);

  return (
    <div className="bg-panel rounded-2xl p-5 border border-white/5 hover-lift">
      <div className="flex items-center gap-2 mb-4">
        <Award size={18} className="text-warn" />
        <h3 className="font-semibold text-sm">Top 5 des heures</h3>
      </div>

      {heures.length === 0 ? (
        <p className="text-center text-gray-500 text-xs py-4">
          Aucune vente aujourd'hui
        </p>
      ) : (
        <ul className="space-y-3">
          {heures.map((h, i) => {
            const largeur = (Number(h.total) / maxTotal) * 100;
            return (
              <li key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300 font-medium flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-warn/10 text-warn flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    {h.heure}h - {parseInt(h.heure) + 1}h
                  </span>
                  <span className="text-accent font-semibold">
                    {h.total.toLocaleString("fr-FR")} Ar
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-warn/60 to-warn rounded-full transition-all duration-500"
                    style={{ width: `${largeur}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {h.nb_ventes} vente{h.nb_ventes > 1 ? "s" : ""}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}