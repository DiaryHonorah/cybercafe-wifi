import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  Settings,
  Save,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Archive,
  History,
  TrendingUp,
  Star,
  Gift,
  X,
  Award,
  Users,
} from "lucide-react";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function Leaderboard() {
  const navigate = useNavigate();
  const [ongletActif, setOngletActif] = useState("classement");
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [classement, setClassement] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [moisActif, setMoisActif] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(null);
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);
  const [modalArchiver, setModalArchiver] = useState(false);
  const [moisArchiver, setMoisArchiver] = useState("");

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

  const afficherMessage = (type, texte) => {
    if (type === "succes") setSucces(texte);
    else setErreur(texte);
    setTimeout(() => {
      setSucces(null);
      setErreur(null);
    }, 4000);
  };

  const chargerConfig = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await fetchAvecToken(`${API_URL}/leaderboard/admin/config`);
      if (res.status === 401) {
        navigate("/login");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setStats(data.stats);
      }
    } catch (err) {
      setErreur("Impossible de contacter le serveur");
    } finally {
      setChargement(false);
    }
  };

  const chargerClassement = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await fetchAvecToken(
        `${API_URL}/leaderboard/admin/classement?mois=${moisActif}&limite=100`
      );
      const data = await res.json();
      if (data.success) {
        setClassement(data.classement || []);
      }
    } catch (err) {
      setErreur("Impossible de charger le classement");
    } finally {
      setChargement(false);
    }
  };

  const chargerHistorique = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await fetchAvecToken(
        `${API_URL}/leaderboard/admin/historique`
      );
      const data = await res.json();
      if (data.success) {
        setHistorique(data.historique || []);
      }
    } catch (err) {
      setErreur("Impossible de charger l'historique");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerConfig();
  }, []);

  useEffect(() => {
    if (ongletActif === "classement") chargerClassement();
    else if (ongletActif === "historique") chargerHistorique();
  }, [ongletActif, moisActif]);

  const sauvegarderConfig = async () => {
    setSauvegardeEnCours(true);
    setErreur(null);
    try {
      const res = await fetchAvecToken(
        `${API_URL}/leaderboard/admin/config`,
        {
          method: "POST",
          body: JSON.stringify(config),
        }
      );
      const data = await res.json();
      if (data.success) {
        afficherMessage("succes", "Configuration sauvegardée");
        chargerConfig();
      } else {
        afficherMessage("erreur", data.message);
      }
    } catch (err) {
      afficherMessage("erreur", "Erreur serveur");
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const archiverMois = async () => {
    if (!moisArchiver) {
      afficherMessage("erreur", "Choisissez un mois");
      return;
    }
    setSauvegardeEnCours(true);
    try {
      const res = await fetchAvecToken(
        `${API_URL}/leaderboard/admin/archiver`,
        {
          method: "POST",
          body: JSON.stringify({ mois: moisArchiver }),
        }
      );
      const data = await res.json();
      if (data.success) {
        afficherMessage("succes", data.message);
        setModalArchiver(false);
        chargerConfig();
        if (ongletActif === "historique") chargerHistorique();
      } else {
        afficherMessage("erreur", data.message);
      }
    } catch (err) {
      afficherMessage("erreur", "Erreur serveur");
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const formatPrix = (n) => Number(n || 0).toLocaleString("fr-FR");

  const getMoisLabel = (moisStr) => {
    if (!moisStr) return "-";
    const [annee, mois] = moisStr.split("-");
    const moisNoms = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
    ];
    return `${moisNoms[parseInt(mois) - 1]} ${annee}`;
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

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600">
              <Trophy size={24} className="text-white" />
            </div>
            Classement
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Gérez le classement mensuel et les récompenses
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setMoisArchiver(
                new Date(new Date().setMonth(new Date().getMonth() - 1))
                  .toISOString()
                  .slice(0, 7)
              );
              setModalArchiver(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 font-medium transition"
          >
            <Archive size={16} />
            Archiver un mois
          </button>
          <button
            onClick={() => {
              chargerConfig();
              if (ongletActif === "classement") chargerClassement();
              else if (ongletActif === "historique") chargerHistorique();
            }}
            disabled={chargement}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition disabled:opacity-50"
          >
            <RefreshCw size={16} className={chargement ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>
      </div>

      {/* MESSAGES */}
      {succes && (
        <div className="mb-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 size={20} />
          <p>{succes}</p>
        </div>
      )}
      {erreur && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle size={20} />
          <p>{erreur}</p>
        </div>
      )}

      {/* STATS */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <div className="bg-[#112240] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <Award size={14} /> Total gagnants
            </div>
            <p className="text-2xl font-bold">{stats.total_gagnants}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-cyan-500/20">
            <div className="flex items-center gap-2 text-xs text-cyan-400 mb-1">
              <Calendar size={14} /> Mois archivés
            </div>
            <p className="text-2xl font-bold text-cyan-400">
              {stats.nb_mois_archives}
            </p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-yellow-500/20">
            <div className="flex items-center gap-2 text-xs text-yellow-400 mb-1">
              <Gift size={14} /> Récompenses versées
            </div>
            <p className="text-lg font-bold text-yellow-400">
              {formatPrix(stats.total_recompenses)} Ar
            </p>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-2 flex-wrap">
        <button
          onClick={() => setOngletActif("classement")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition ${
            ongletActif === "classement"
              ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/30"
              : "text-gray-400 hover:bg-white/5"
          }`}
        >
          <Trophy size={16} />
          Classement en cours
        </button>
        <button
          onClick={() => setOngletActif("config")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition ${
            ongletActif === "config"
              ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/30"
              : "text-gray-400 hover:bg-white/5"
          }`}
        >
          <Settings size={16} />
          Configuration
        </button>
        <button
          onClick={() => setOngletActif("historique")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition ${
            ongletActif === "historique"
              ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/30"
              : "text-gray-400 hover:bg-white/5"
          }`}
        >
          <History size={16} />
          Historique
        </button>
      </div>

      {/* ===== ONGLET CLASSEMENT ===== */}
      {ongletActif === "classement" && (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <label className="text-sm text-gray-400">Mois :</label>
            <input
              type="month"
              value={moisActif}
              onChange={(e) => setMoisActif(e.target.value)}
              className="bg-[#0A1628] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-yellow-500 focus:outline-none"
            />
            <span className="text-sm text-gray-500">
              {getMoisLabel(moisActif)}
            </span>
          </div>

          {chargement ? (
            <div className="text-center py-20">
              <Loader2 size={40} className="animate-spin text-yellow-500 mx-auto" />
              <p className="text-gray-400 mt-4">Chargement...</p>
            </div>
          ) : classement.length === 0 ? (
            <div className="text-center py-20 bg-[#112240] rounded-2xl border border-white/5">
              <Trophy size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Aucun participant ce mois
              </h3>
              <p className="text-sm text-gray-400">
                Le classement apparaîtra dès que des clients auront de l'activité.
              </p>
            </div>
          ) : (
            <div className="bg-[#112240] rounded-xl border border-white/5 overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#0A1628] border-b border-white/10">
                  <tr className="text-xs text-gray-400 uppercase">
                    <th className="text-left p-3 w-16">Rang</th>
                    <th className="text-left p-3">Client</th>
                    <th className="text-right p-3 hidden md:table-cell">Résa</th>
                    <th className="text-right p-3 hidden md:table-cell">
                      Parrainages
                    </th>
                    <th className="text-right p-3 hidden lg:table-cell">
                      Points fid.
                    </th>
                    <th className="text-right p-3 hidden lg:table-cell">
                      Bonus
                    </th>
                    <th className="text-right p-3">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {classement.map((c) => (
                    <tr
                      key={c.client_id}
                      className={`border-b border-white/5 hover:bg-white/[0.02] ${
                        c.position <= 3 ? "bg-yellow-500/5" : ""
                      }`}
                    >
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                            c.position === 1
                              ? "bg-yellow-400 text-gray-900"
                              : c.position === 2
                              ? "bg-gray-400 text-gray-900"
                              : c.position === 3
                              ? "bg-orange-400 text-gray-900"
                              : "bg-cyan-500/20 text-[#67E8F9]"
                          }`}
                        >
                          {c.position === 1
                            ? "🥇"
                            : c.position === 2
                            ? "🥈"
                            : c.position === 3
                            ? "🥉"
                            : c.position}
                        </span>
                      </td>
                      <td className="p-3">
                        <p className="font-medium">{c.nom_affiche}</p>
                      </td>
                      <td className="p-3 text-right hidden md:table-cell">
                        {c.reservations}
                      </td>
                      <td className="p-3 text-right hidden md:table-cell text-purple-400">
                        {c.parrainages}
                      </td>
                      <td className="p-3 text-right hidden lg:table-cell text-cyan-400">
                        {c.points_fidelite}
                      </td>
                      <td className="p-3 text-right hidden lg:table-cell text-green-400">
                        {formatPrix(c.bonus_gagnes)} Ar
                      </td>
                      <td className="p-3 text-right font-bold text-yellow-400">
                        {c.score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===== ONGLET CONFIG ===== */}
      {ongletActif === "config" && config && (
        <div className="bg-[#112240] rounded-xl p-6 border border-white/5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Settings size={20} className="text-yellow-400" />
            Configuration du classement
          </h2>

          <div className="space-y-4 max-w-2xl">
            {/* Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center justify-between p-3 bg-[#0A1628] rounded-lg">
                <div>
                  <p className="text-sm font-medium">Actif</p>
                  <p className="text-xs text-gray-400">Activer le classement</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.actif == 1}
                  onChange={(e) =>
                    setConfig({ ...config, actif: e.target.checked ? 1 : 0 })
                  }
                  className="w-5 h-5 rounded"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-[#0A1628] rounded-lg">
                <div>
                  <p className="text-sm font-medium">Public</p>
                  <p className="text-xs text-gray-400">Visible publiquement</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.afficher_public == 1}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      afficher_public: e.target.checked ? 1 : 0,
                    })
                  }
                  className="w-5 h-5 rounded"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-[#0A1628] rounded-lg">
                <div>
                  <p className="text-sm font-medium">Auto versement</p>
                  <p className="text-xs text-gray-400">Récompenses auto</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.verser_recompenses_auto == 1}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      verser_recompenses_auto: e.target.checked ? 1 : 0,
                    })
                  }
                  className="w-5 h-5 rounded"
                />
              </div>
            </div>

            {/* Titre + Description */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Titre du classement
              </label>
              <input
                type="text"
                value={config.titre || ""}
                onChange={(e) =>
                  setConfig({ ...config, titre: e.target.value })
                }
                className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:border-yellow-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Description
              </label>
              <textarea
                value={config.description || ""}
                onChange={(e) =>
                  setConfig({ ...config, description: e.target.value })
                }
                rows={2}
                className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:border-yellow-500 focus:outline-none resize-none"
              />
            </div>

            {/* Poids */}
            <div>
              <h3 className="font-semibold text-sm mb-2 text-yellow-400">
                ⚖️ Poids des facteurs
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Réservations
                  </label>
                  <input
                    type="number"
                    value={config.poids_reservations || 10}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        poids_reservations: parseInt(e.target.value) || 10,
                      })
                    }
                    min="1"
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-yellow-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Parrainages
                  </label>
                  <input
                    type="number"
                    value={config.poids_parrainages || 50}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        poids_parrainages: parseInt(e.target.value) || 50,
                      })
                    }
                    min="1"
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-yellow-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Points fidélité
                  </label>
                  <input
                    type="number"
                    value={config.poids_points_fidelite || 1}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        poids_points_fidelite: parseInt(e.target.value) || 1,
                      })
                    }
                    min="1"
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-yellow-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Bonus (par 100 Ar)
                  </label>
                  <input
                    type="number"
                    value={config.poids_bonus_gagnes || 1}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        poids_bonus_gagnes: parseInt(e.target.value) || 1,
                      })
                    }
                    min="1"
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-yellow-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Récompenses */}
            <div>
              <h3 className="font-semibold text-sm mb-2 text-yellow-400">
                🎁 Récompenses du mois
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    🥇 1ère place (Ar)
                  </label>
                  <input
                    type="number"
                    value={config.recompense_1er || 5000}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        recompense_1er: parseFloat(e.target.value) || 0,
                      })
                    }
                    min="0"
                    className="w-full bg-[#0A1628] border border-yellow-500/30 rounded-lg py-2 px-3 text-white text-sm focus:border-yellow-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    🥈 2ème place (Ar)
                  </label>
                  <input
                    type="number"
                    value={config.recompense_2eme || 3000}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        recompense_2eme: parseFloat(e.target.value) || 0,
                      })
                    }
                    min="0"
                    className="w-full bg-[#0A1628] border border-gray-500/30 rounded-lg py-2 px-3 text-white text-sm focus:border-yellow-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    🥉 3ème place (Ar)
                  </label>
                  <input
                    type="number"
                    value={config.recompense_3eme || 1000}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        recompense_3eme: parseFloat(e.target.value) || 0,
                      })
                    }
                    min="0"
                    className="w-full bg-[#0A1628] border border-orange-500/30 rounded-lg py-2 px-3 text-white text-sm focus:border-yellow-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Bouton sauvegarder */}
            <div className="pt-4">
              <button
                onClick={sauvegarderConfig}
                disabled={sauvegardeEnCours}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-medium transition disabled:opacity-50"
              >
                {sauvegardeEnCours ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ONGLET HISTORIQUE ===== */}
      {ongletActif === "historique" && (
        <div>
          {chargement ? (
            <div className="text-center py-20">
              <Loader2 size={40} className="animate-spin text-yellow-500 mx-auto" />
              <p className="text-gray-400 mt-4">Chargement...</p>
            </div>
          ) : historique.length === 0 ? (
            <div className="text-center py-20 bg-[#112240] rounded-2xl border border-white/5">
              <History size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Aucun historique
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Archivez un mois pour voir les gagnants apparaître ici.
              </p>
              <button
                onClick={() => {
                  setMoisArchiver(
                    new Date(new Date().setMonth(new Date().getMonth() - 1))
                      .toISOString()
                      .slice(0, 7)
                  );
                  setModalArchiver(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-medium transition"
              >
                <Archive size={16} />
                Archiver le mois dernier
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(
                historique.reduce((acc, h) => {
                  if (!acc[h.mois_annee]) acc[h.mois_annee] = [];
                  acc[h.mois_annee].push(h);
                  return acc;
                }, {})
              )
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([mois, gagnants]) => (
                  <div
                    key={mois}
                    className="bg-[#112240] rounded-xl p-5 border border-white/5"
                  >
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      <Calendar size={16} className="text-yellow-400" />
                      {getMoisLabel(mois)}
                    </h3>
                    <div className="space-y-2">
                      {gagnants
                        .sort((a, b) => a.position - b.position)
                        .map((g) => (
                          <div
                            key={g.id}
                            className="flex items-center justify-between py-2 px-3 bg-[#0A1628] rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">
                                {g.position === 1
                                  ? "🥇"
                                  : g.position === 2
                                  ? "🥈"
                                  : "🥉"}
                              </span>
                              <div>
                                <p className="font-medium">{g.client_nom}</p>
                                <p className="text-xs text-gray-500">
                                  Score : {g.score} points
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-yellow-400">
                                +{formatPrix(g.recompense_versee)} Ar
                              </p>
                              {g.recompense_verse_le && (
                                <p className="text-xs text-gray-500">
                                  {formatDate(g.recompense_verse_le)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL ARCHIVER */}
      {modalArchiver && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !sauvegardeEnCours && setModalArchiver(false)}
        >
          <div
            className="bg-[#112240] rounded-2xl max-w-md w-full border border-yellow-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Archive size={20} className="text-yellow-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Archiver un mois</h2>
                <p className="text-xs text-gray-400">
                  Les 3 premiers recevront leurs récompenses
                </p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Mois à archiver
                </label>
                <input
                  type="month"
                  value={moisArchiver}
                  onChange={(e) => setMoisArchiver(e.target.value)}
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-3 px-4 text-white focus:border-yellow-500 focus:outline-none"
                />
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-400">
                <p className="font-semibold mb-1">⚠️ Attention</p>
                <p className="text-xs text-gray-300">
                  Cette action va :
                </p>
                <ul className="text-xs text-gray-300 mt-1 ml-4 list-disc">
                  <li>Enregistrer le top 10 dans l'historique</li>
                  <li>
                    Verser les récompenses au top 3 (si auto activé)
                  </li>
                  <li>Envoyer les notifications aux gagnants</li>
                </ul>
              </div>
            </div>
            <div className="p-5 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setModalArchiver(false)}
                disabled={sauvegardeEnCours}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={archiverMois}
                disabled={sauvegardeEnCours || !moisArchiver}
                className="flex-1 px-4 py-2.5 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sauvegardeEnCours ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Archive size={16} />
                )}
                Archiver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}