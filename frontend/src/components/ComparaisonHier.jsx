import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, ArrowRight, Calendar } from "lucide-react";
import api from "../api";

export default function ComparaisonHier() {
  const [data, setData] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const charger = () => {
      api
        .get("/api/stats-temps-reel/comparaison")
        .then((r) => setData(r.data))
        .catch(() => {})
        .finally(() => setChargement(false));
    };
    charger();
    const interval = setInterval(charger, 15000);
    return () => clearInterval(interval);
  }, []);

  if (chargement) {
    return (
      <div className="bg-panel rounded-2xl p-5 border border-white/5 animate-pulse">
        <div className="h-4 w-32 bg-white/5 rounded mb-3" />
        <div className="h-8 w-24 bg-white/5 rounded" />
      </div>
    );
  }

  if (!data) return null;

  const evolVentes = data.evolution_ventes || 0;
  const evolTickets = data.evolution_tickets || 0;

  return (
    <div className="bg-panel rounded-2xl p-5 border border-white/5 hover-lift">
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={18} className="text-cyan" />
        <h3 className="font-semibold text-sm">Aujourd'hui vs Hier</h3>
      </div>

      {/* Ventes */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-night rounded-xl p-3">
          <p className="text-xs text-gray-400 mb-1">Aujourd'hui</p>
          <p className="text-lg font-bold text-accent">
            {data.aujourdhui.total.toLocaleString("fr-FR")} Ar
          </p>
          <p className="text-xs text-gray-500">
            {data.aujourdhui.nb_tickets} ticket(s)
          </p>
        </div>
        <div className="bg-night rounded-xl p-3">
          <p className="text-xs text-gray-400 mb-1">Hier</p>
          <p className="text-lg font-bold text-gray-300">
            {data.hier.total.toLocaleString("fr-FR")} Ar
          </p>
          <p className="text-xs text-gray-500">
            {data.hier.nb_tickets} ticket(s)
          </p>
        </div>
      </div>

      {/* Évolution */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Évolution ventes</span>
          <div
            className={`flex items-center gap-1 font-semibold ${
              evolVentes > 0
                ? "text-success"
                : evolVentes < 0
                ? "text-danger"
                : "text-gray-400"
            }`}
          >
            {evolVentes > 0 ? (
              <TrendingUp size={14} />
            ) : evolVentes < 0 ? (
              <TrendingDown size={14} />
            ) : null}
            {evolVentes > 0 ? "+" : ""}
            {evolVentes}%
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Évolution tickets</span>
          <div
            className={`flex items-center gap-1 font-semibold ${
              evolTickets > 0
                ? "text-success"
                : evolTickets < 0
                ? "text-danger"
                : "text-gray-400"
            }`}
          >
            {evolTickets > 0 ? (
              <TrendingUp size={14} />
            ) : evolTickets < 0 ? (
              <TrendingDown size={14} />
            ) : null}
            {evolTickets > 0 ? "+" : ""}
            {evolTickets}%
          </div>
        </div>
      </div>
    </div>
  );
}