import { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Database,
  Server,
  HardDrive,
  Wifi,
  FileCheck,
} from "lucide-react";
import api from "../api";
import PageLoader from "../components/PageLoader";

export default function Diagnostic() {
  const [data, setData] = useState(null);
  const [chargement, setChargement] = useState(true);

  const charger = async () => {
    setChargement(true);
    try {
      const r = await api.get("/api/health");
      setData(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
    const interval = setInterval(charger, 60000);
    return () => clearInterval(interval);
  }, []);

  if (chargement && !data) {
    return <PageLoader message="Diagnostic en cours..." />;
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto bg-panel rounded-2xl p-12 text-center border border-danger/30">
        <XCircle size={48} className="text-danger mx-auto mb-4" />
        <p className="text-gray-400">Impossible de contacter l'API</p>
      </div>
    );
  }

  const statutIcone = (statut) => {
    if (statut === "ok") return <CheckCircle2 size={20} className="text-success" />;
    if (statut === "warn") return <AlertTriangle size={20} className="text-warn" />;
    return <XCircle size={20} className="text-danger" />;
  };

  const statutCouleur = (statut) => {
    if (statut === "ok") return "border-success/30 bg-success/5";
    if (statut === "warn") return "border-warn/30 bg-warn/5";
    return "border-danger/30 bg-danger/5";
  };

  const { resume, tests } = data;

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity size={24} className="text-accent" />
            Diagnostic système
          </h1>
          <p className="text-gray-400 text-sm">
            État de santé de votre application Cyber Famille
          </p>
        </div>
        <button
          onClick={charger}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-sm px-4 py-2.5 rounded-lg transition"
        >
          <RefreshCw size={16} className={chargement ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {/* Statut global */}
      <div
        className={`rounded-2xl p-6 border-2 mb-6 animate-slide-up stagger-1 ${
          resume.statut_global === "parfait"
            ? "border-success/50 bg-success/10"
            : resume.statut_global === "bon"
            ? "border-warn/50 bg-warn/10"
            : "border-danger/50 bg-danger/10"
        }`}
      >
        <div className="flex items-center gap-4">
          {resume.statut_global === "parfait" ? (
            <CheckCircle2 size={48} className="text-success" />
          ) : resume.statut_global === "bon" ? (
            <AlertTriangle size={48} className="text-warn" />
          ) : (
            <XCircle size={48} className="text-danger" />
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1">
              {resume.statut_global === "parfait"
                ? "Système parfaitement opérationnel"
                : resume.statut_global === "bon"
                ? "Système fonctionnel avec avertissements"
                : "Problèmes détectés"}
            </h2>
            <p className="text-sm text-gray-400">
              {resume.ok} OK · {resume.warn} avertissement(s) · {resume.error} erreur(s)
            </p>
          </div>
        </div>
      </div>

      {/* Infos générales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-panel rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-cyan/10 text-cyan p-3 rounded-xl">
              <Server size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">Version PHP</p>
              <p className="text-lg font-bold">{data.php_version}</p>
            </div>
          </div>
        </div>
        <div className="bg-panel rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-accent/10 text-accent p-3 rounded-xl">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">Version API</p>
              <p className="text-lg font-bold">{data.version_api}</p>
            </div>
          </div>
        </div>
        <div className="bg-panel rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-success/10 text-success p-3 rounded-xl">
              <Database size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">Timestamp</p>
              <p className="text-sm font-bold">{data.timestamp}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tests détaillés */}
      <div className="space-y-3">
        {Object.entries(tests).map(([cle, test]) => (
          <div
            key={cle}
            className={`bg-panel rounded-xl p-4 border ${statutCouleur(test.statut)} flex items-center gap-4 animate-slide-up`}
          >
            <div className="flex-shrink-0">{statutIcone(test.statut)}</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{test.nom}</p>
              <p className="text-xs text-gray-400 mt-0.5">{test.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}