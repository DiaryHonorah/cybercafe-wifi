import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Server,
  HardDrive,
  Cpu,
  Database,
  Globe,
  Clock,
  TrendingUp,
  TrendingDown,
  Bell,
  BellOff,
  Eye,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function Monitoring() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [erreurs, setErreurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [refreshEnCours, setRefreshEnCours] = useState(false);

  const getToken = () =>
    localStorage.getItem("admin_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token");

  const fetchAvecToken = async (url, options = {}) => {
    const token = getToken();
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {}),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return fetch(url, { ...options, headers, credentials: "omit" });
  };

  const chargerDonnees = async (silencieux = false) => {
    if (!silencieux) setChargement(true);
    else setRefreshEnCours(true);
    setErreur(null);

    try {
      const res = await fetchAvecToken(`${API_URL}/monitoring/dashboard`);
      if (res.status === 401) {
        navigate("/login");
        return;
      }
      const result = await res.json();

      if (result.success) {
        setData(result);

        // Charger les erreurs
        const errRes = await fetchAvecToken(`${API_URL}/monitoring/erreurs?limite=20`);
        const errData = await errRes.json();
        if (errData.success) setErreurs(errData.erreurs || []);
      } else {
        setErreur(result.message);
      }
    } catch (err) {
      setErreur("Impossible de contacter le serveur");
    } finally {
      setChargement(false);
      setRefreshEnCours(false);
    }
  };

  useEffect(() => {
    chargerDonnees();

    // Auto-refresh toutes les 30s
    const interval = setInterval(() => {
      chargerDonnees(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const resoudreAlerte = async (id) => {
    if (!confirm("Marquer cette alerte comme résolue ?")) return;

    try {
      const res = await fetchAvecToken(`${API_URL}/monitoring/alertes/resoudre`, {
        method: "POST",
        body: JSON.stringify({ id }),
      });
      const result = await res.json();
      if (result.success) chargerDonnees();
    } catch (err) {
      alert("Erreur");
    }
  };

  const marquerLue = async (id) => {
    try {
      await fetchAvecToken(`${API_URL}/monitoring/alertes/lire`, {
        method: "POST",
        body: JSON.stringify({ id }),
      });
      chargerDonnees(true);
    } catch (err) {}
  };

  // ===== HELPERS =====
  const getStatutColor = (statut) => {
    if (statut === "ok") return "bg-green-500/10 text-green-400 border-green-500/30";
    if (statut === "warning") return "bg-orange-500/10 text-orange-400 border-orange-500/30";
    return "bg-red-500/10 text-red-400 border-red-500/30";
  };

  const getStatutIcon = (statut) => {
    if (statut === "ok") return CheckCircle2;
    if (statut === "warning") return AlertTriangle;
    return XCircle;
  };

  const getNiveauColor = (niveau) => {
    if (niveau === "info") return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    if (niveau === "warning") return "bg-orange-500/10 text-orange-400 border-orange-500/30";
    return "bg-red-500/10 text-red-400 border-red-500/30";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateRelative = (dateStr) => {
    if (!dateStr) return "-";
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
    return `Il y a ${Math.floor(diff / 86400)}j`;
  };

  // ===== RENDER =====
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
              <Activity size={24} className="text-white" />
            </div>
            Monitoring
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Surveillance en temps réel de votre site
          </p>
        </div>

        <button
          onClick={() => chargerDonnees()}
          disabled={refreshEnCours || chargement}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={refreshEnCours || chargement ? "animate-spin" : ""}
          />
          Actualiser
        </button>
      </div>

      {erreur && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} />
          <p>{erreur}</p>
        </div>
      )}

      {chargement && !data ? (
        <div className="text-center py-20">
          <Loader2 size={40} className="animate-spin text-orange-500 mx-auto" />
          <p className="text-gray-400 mt-4">Analyse en cours...</p>
        </div>
      ) : data ? (
        <>
          {/* STATS GLOBALES */}
          {data.stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-[#112240] rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                  <Clock size={14} /> Uptime 24h
                </div>
                <p
                  className={`text-2xl font-bold ${
                    data.stats.uptime_24h >= 99
                      ? "text-green-400"
                      : data.stats.uptime_24h >= 95
                      ? "text-orange-400"
                      : "text-red-400"
                  }`}
                >
                  {data.stats.uptime_24h}%
                </p>
              </div>
              <div className="bg-[#112240] rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                  <TrendingUp size={14} /> Temps réponse
                </div>
                <p className="text-2xl font-bold text-cyan-400">
                  {data.stats.temps_reponse_moyen}ms
                </p>
              </div>
              <div className="bg-[#112240] rounded-xl p-4 border border-orange-500/20">
                <div className="flex items-center gap-2 text-xs text-orange-400 mb-1">
                  <Bell size={14} /> Alertes actives
                </div>
                <p className="text-2xl font-bold text-orange-400">
                  {data.stats.alertes_actives}
                </p>
              </div>
              <div className="bg-[#112240] rounded-xl p-4 border border-red-500/20">
                <div className="flex items-center gap-2 text-xs text-red-400 mb-1">
                  <AlertCircle size={14} /> Erreurs 24h
                </div>
                <p className="text-2xl font-bold text-red-400">
                  {data.stats.erreurs_24h}
                </p>
              </div>
            </div>
          )}

          {/* CHECKS DE SANTÉ */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3">État du système</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(data.checks || {}).map(([type, check]) => {
                const StatutIcon = getStatutIcon(check.statut);
                const Icones = {
                  bdd: Database,
                  disk: HardDrive,
                  ram: Cpu,
                  site: Globe,
                };
                const Icone = Icones[type] || Server;

                return (
                  <div
                    key={type}
                    className={`bg-[#112240] rounded-xl p-4 border ${getStatutColor(
                      check.statut
                    )}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icone size={20} />
                        <span className="font-semibold capitalize">{type}</span>
                      </div>
                      <StatutIcon size={20} />
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">
                      {check.message}
                    </p>
                    {check.temps_reponse !== undefined &&
                      check.temps_reponse !== null && (
                        <p className="text-xs mt-2 text-gray-500">
                          ⏱️ {check.temps_reponse} ms
                        </p>
                      )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ALERTES ACTIVES */}
          {data.alertes && data.alertes.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <AlertTriangle className="text-orange-400" size={20} />
                Alertes actives ({data.alertes.length})
              </h2>
              <div className="space-y-2">
                {data.alertes.map((alerte) => (
                  <div
                    key={alerte.id}
                    className={`bg-[#112240] rounded-lg p-4 border ${getNiveauColor(
                      alerte.niveau
                    )} ${!alerte.lu ? "ring-2 ring-orange-500/30" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{alerte.titre}</p>
                          {!alerte.lu && (
                            <span className="px-1.5 py-0.5 rounded text-xs bg-red-500 text-white">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-300 mb-2">
                          {alerte.message}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{formatDate(alerte.created_at)}</span>
                          <span className="uppercase">{alerte.type}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!alerte.lu && (
                          <button
                            onClick={() => marquerLue(alerte.id)}
                            className="p-1.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition"
                            title="Marquer comme lu"
                          >
                            <Eye size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => resoudreAlerte(alerte.id)}
                          className="p-1.5 rounded bg-green-500/10 hover:bg-green-500/20 text-green-400 transition"
                          title="Résoudre"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ERREURS RÉCENTES */}
          {erreurs.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <XCircle className="text-red-400" size={20} />
                Erreurs récentes ({erreurs.length})
              </h2>
              <div className="bg-[#112240] rounded-xl border border-white/5 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[#0A1628] border-b border-white/10">
                    <tr className="text-xs text-gray-400 uppercase">
                      <th className="text-left p-2">Niveau</th>
                      <th className="text-left p-2">Message</th>
                      <th className="text-left p-2 hidden md:table-cell">URL</th>
                      <th className="text-left p-2 hidden lg:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {erreurs.map((err) => (
                      <tr
                        key={err.id}
                        className="border-b border-white/5 hover:bg-white/[0.02]"
                      >
                        <td className="p-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              err.niveau === "critical"
                                ? "bg-red-500/20 text-red-400"
                                : err.niveau === "error"
                                ? "bg-orange-500/20 text-orange-400"
                                : "bg-yellow-500/20 text-yellow-400"
                            }`}
                          >
                            {err.niveau}
                          </span>
                        </td>
                        <td className="p-2 text-gray-300">
                          <p className="truncate max-w-xs" title={err.message}>
                            {err.message}
                          </p>
                        </td>
                        <td className="p-2 hidden md:table-cell text-gray-500 text-xs">
                          <p className="truncate max-w-xs" title={err.url}>
                            {err.url || "-"}
                          </p>
                        </td>
                        <td className="p-2 hidden lg:table-cell text-xs text-gray-500">
                          {formatDateRelative(err.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ÉTAT OK */}
          {(!data.alertes || data.alertes.length === 0) &&
            erreurs.length === 0 && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center">
                <CheckCircle2
                  size={64}
                  className="text-green-400 mx-auto mb-4"
                />
                <h3 className="text-xl font-bold text-green-400 mb-2">
                  Tout va bien ! 🎉
                </h3>
                <p className="text-sm text-gray-400">
                  Aucune alerte active, aucune erreur détectée dans les dernières 24h.
                </p>
              </div>
            )}
        </>
      ) : null}
    </div>
  );
}