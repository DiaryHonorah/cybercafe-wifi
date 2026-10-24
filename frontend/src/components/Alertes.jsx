import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import api from "../api";

export default function Alertes() {
  const [alertes, setAlertes] = useState([]);
  const [fermees, setFermees] = useState([]);

  useEffect(() => {
    const charger = () => {
      api
        .get("/api/stats-temps-reel/alertes")
        .then((r) => setAlertes(r.data || []))
        .catch(() => {});
    };
    charger();
    const interval = setInterval(charger, 20000);
    return () => clearInterval(interval);
  }, []);

  const alertesVisibles = alertes.filter((a) => !fermees.includes(a.titre));

  if (alertesVisibles.length === 0) return null;

  const couleurs = {
    danger: "bg-danger/10 border-danger/30 text-danger",
    warn: "bg-warn/10 border-warn/30 text-warn",
    success: "bg-success/10 border-success/30 text-success",
    info: "bg-cyan/10 border-cyan/30 text-cyan",
  };

  return (
    <div className="space-y-2 mb-6">
      {alertesVisibles.map((a, i) => (
        <div
          key={i}
          className={`${
            couleurs[a.type] || couleurs.info
          } border rounded-xl p-3 flex items-start gap-3 animate-slide-down`}
        >
          <span className="text-lg flex-shrink-0">{a.icone || "🔔"}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{a.titre}</p>
            <p className="text-xs opacity-80 mt-0.5">{a.message}</p>
          </div>
          <button
            onClick={() => setFermees([...fermees, a.titre])}
            className="opacity-60 hover:opacity-100 flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}