import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Database,
  Download,
  Trash2,
  Plus,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Settings,
  Save,
  Clock,
  HardDrive,
  TrendingUp,
  Calendar,
} from "lucide-react";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function Sauvegarde() {
  const navigate = useNavigate();
  const [backups, setBackups] = useState([]);
  const [stats, setStats] = useState(null);
  const [config, setConfig] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [creationEnCours, setCreationEnCours] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [message, setMessage] = useState(null);
  const [modalSupprimer, setModalSupprimer] = useState(null);
  const [modalConfig, setModalConfig] = useState(false);
  const [configForm, setConfigForm] = useState({
    auto_actif: true,
    frequence_heures: 24,
    retention_jours: 30,
    inclure_fichiers: false,
  });

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
    setMessage({ type, texte });
    setTimeout(() => setMessage(null), 5000);
  };

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);

    try {
      const res = await fetchAvecToken(`${API_URL}/backup/liste`);
      if (res.status === 401) {
        navigate("/login");
        return;
      }
      const data = await res.json();

      if (data.success) {
        setBackups(data.backups || []);
        setStats(data.stats);
      } else {
        setErreur(data.message);
      }

      // Charger la config
      const configRes = await fetchAvecToken(`${API_URL}/backup/config`);
      const configData = await configRes.json();
      if (configData.success) {
        setConfig(configData.config);
        setConfigForm({
          auto_actif: configData.config.auto_actif == 1,
          frequence_heures: parseInt(configData.config.frequence_heures),
          retention_jours: parseInt(configData.config.retention_jours),
          inclure_fichiers: configData.config.inclure_fichiers == 1,
        });
      }

    } catch (err) {
      console.error("Erreur:", err);
      setErreur("Impossible de contacter le serveur");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  const creerBackup = async () => {
    setCreationEnCours(true);

    try {
      const res = await fetchAvecToken(`${API_URL}/backup/creer`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        afficherMessage("succes", "Sauvegarde créée : " + data.backup.nom_fichier);
        chargerDonnees();
      } else {
        afficherMessage("erreur", data.message);
      }
    } catch (err) {
      afficherMessage("erreur", "Erreur serveur");
    } finally {
      setCreationEnCours(false);
    }
  };

  const telechargerBackup = async (backup) => {
    try {
      const token = getToken();
      const res = await fetch(
        `${API_URL}/backup/telecharger?id=${backup.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        afficherMessage("erreur", "Erreur téléchargement");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = backup.nom_fichier;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      afficherMessage("erreur", "Erreur téléchargement");
    }
  };

  const supprimerBackup = async () => {
    if (!modalSupprimer) return;

    try {
      const res = await fetchAvecToken(`${API_URL}/backup/supprimer`, {
        method: "POST",
        body: JSON.stringify({ id: modalSupprimer.id }),
      });
      const data = await res.json();

      if (data.success) {
        afficherMessage("succes", "Backup supprimé");
        setModalSupprimer(null);
        chargerDonnees();
      } else {
        afficherMessage("erreur", data.message);
      }
    } catch (err) {
      afficherMessage("erreur", "Erreur serveur");
    }
  };

  const sauvegarderConfig = async () => {
    try {
      const res = await fetchAvecToken(`${API_URL}/backup/config`, {
        method: "POST",
        body: JSON.stringify(configForm),
      });
      const data = await res.json();

      if (data.success) {
        afficherMessage("succes", "Configuration sauvegardée");
        setModalConfig(false);
        chargerDonnees();
      } else {
        afficherMessage("erreur", data.message);
      }
    } catch (err) {
      afficherMessage("erreur", "Erreur serveur");
    }
  };

  // ===== HELPERS =====
  const formatTaille = (octets) => {
    if (!octets) return "0 B";
    if (octets < 1024) return `${octets} B`;
    if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} KB`;
    if (octets < 1024 * 1024 * 1024) return `${(octets / 1024 / 1024).toFixed(1)} MB`;
    return `${(octets / 1024 / 1024 / 1024).toFixed(2)} GB`;
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
    const d = new Date(dateStr);
    const diff = (Date.now() - d) / 1000;
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
              <Database size={24} className="text-white" />
            </div>
            Sauvegardes
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Gérez vos sauvegardes de base de données
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setModalConfig(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
          >
            <Settings size={16} />
            Config
          </button>
          <button
            onClick={chargerDonnees}
            disabled={chargement}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition disabled:opacity-50"
          >
            <RefreshCw size={16} className={chargement ? "animate-spin" : ""} />
            Actualiser
          </button>
          <button
            onClick={creerBackup}
            disabled={creationEnCours}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition disabled:opacity-50"
          >
            {creationEnCours ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            Nouveau backup
          </button>
        </div>
      </div>

      {/* MESSAGE */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === "succes"
              ? "bg-green-500/10 border border-green-500/30 text-green-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {message.type === "succes" ? (
            <CheckCircle2 size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <p>{message.texte}</p>
        </div>
      )}

      {/* ERREUR */}
      {erreur && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} />
          <p>{erreur}</p>
        </div>
      )}

      {/* STATS */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-[#112240] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <Database size={14} /> Total
            </div>
            <p className="text-2xl font-bold">{stats.total || 0}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-green-500/20">
            <div className="flex items-center gap-2 text-xs text-green-400 mb-1">
              <CheckCircle2 size={14} /> Succès
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.succes || 0}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-red-500/20">
            <div className="flex items-center gap-2 text-xs text-red-400 mb-1">
              <XCircle size={14} /> Échecs
            </div>
            <p className="text-2xl font-bold text-red-400">{stats.echecs || 0}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-cyan-500/20">
            <div className="flex items-center gap-2 text-xs text-cyan-400 mb-1">
              <HardDrive size={14} /> Espace total
            </div>
            <p className="text-2xl font-bold text-cyan-400">
              {formatTaille(stats.taille_totale)}
            </p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-purple-500/20">
            <div className="flex items-center gap-2 text-xs text-purple-400 mb-1">
              <Clock size={14} /> Dernier
            </div>
            <p className="text-sm font-bold text-purple-400">
              {stats.dernier_backup
                ? formatDateRelative(stats.dernier_backup)
                : "Jamais"}
            </p>
          </div>
        </div>
      )}

      {/* CONFIG INFO */}
      {config && (
        <div className="bg-[#112240] rounded-xl p-4 mb-6 border border-white/5">
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                config.auto_actif == 1
                  ? "bg-green-500/10 text-green-400 border border-green-500/30"
                  : "bg-orange-500/10 text-orange-400 border border-orange-500/30"
              }`}
            >
              {config.auto_actif == 1 ? "✅ Backup auto ACTIVÉ" : "⚠️ Backup auto DÉSACTIVÉ"}
            </span>
            <span className="text-sm text-gray-400">
              📅 Toutes les <strong>{config.frequence_heures}h</strong>
            </span>
            <span className="text-sm text-gray-400">
              🗑️ Conservation <strong>{config.retention_jours} jours</strong>
            </span>
            {config.inclure_fichiers == 1 && (
              <span className="text-sm text-cyan-400">
                📁 Fichiers inclus
              </span>
            )}
          </div>
        </div>
      )}

      {/* CHARGEMENT / LISTE */}
      {chargement && backups.length === 0 ? (
        <div className="text-center py-20">
          <Loader2 size={40} className="animate-spin text-orange-500 mx-auto" />
          <p className="text-gray-400 mt-4">Chargement...</p>
        </div>
      ) : backups.length === 0 ? (
        <div className="text-center py-20 bg-[#112240] rounded-2xl border border-white/5">
          <Database size={48} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune sauvegarde</h3>
          <p className="text-sm text-gray-400 mb-4">
            Créez votre première sauvegarde pour sécuriser vos données
          </p>
          <button
            onClick={creerBackup}
            disabled={creationEnCours}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition"
          >
            <Plus size={16} />
            Créer un backup
          </button>
        </div>
      ) : (
        <div className="bg-[#112240] rounded-xl border border-white/5 overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0A1628] border-b border-white/10">
              <tr className="text-xs text-gray-400 uppercase">
                <th className="text-left p-3">Fichier</th>
                <th className="text-left p-3 hidden md:table-cell">Type</th>
                <th className="text-left p-3 hidden lg:table-cell">Taille</th>
                <th className="text-left p-3 hidden lg:table-cell">Date</th>
                <th className="text-center p-3">Statut</th>
                <th className="text-center p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((backup) => (
                <tr
                  key={backup.id}
                  className="border-b border-white/5 hover:bg-white/[0.02]"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Database size={14} className="text-orange-400" />
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        {backup.nom_fichier}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        backup.type === "automatique"
                          ? "bg-cyan-500/10 text-cyan-400"
                          : "bg-purple-500/10 text-purple-400"
                      }`}
                    >
                      {backup.type === "automatique" ? "🤖 Auto" : "👤 Manuel"}
                    </span>
                  </td>
                  <td className="p-3 hidden lg:table-cell text-sm text-gray-400">
                    {formatTaille(backup.taille_octets)}
                  </td>
                  <td className="p-3 hidden lg:table-cell text-xs text-gray-500">
                    {formatDate(backup.created_at)}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        backup.statut === "succes"
                          ? "bg-green-500/10 text-green-400 border border-green-500/30"
                          : backup.statut === "echec"
                          ? "bg-red-500/10 text-red-400 border border-red-500/30"
                          : "bg-orange-500/10 text-orange-400 border border-orange-500/30"
                      }`}
                    >
                      {backup.statut === "succes" ? (
                        <CheckCircle2 size={10} />
                      ) : backup.statut === "echec" ? (
                        <XCircle size={10} />
                      ) : (
                        <Clock size={10} />
                      )}
                      {backup.statut}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      {backup.statut === "succes" && (
                        <button
                          onClick={() => telechargerBackup(backup)}
                          className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition"
                          title="Télécharger"
                        >
                          <Download size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => setModalSupprimer(backup)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== MODAL CONFIG ===== */}
      {modalConfig && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalConfig(false)}
        >
          <div
            className="bg-[#112240] rounded-2xl max-w-md w-full border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Settings size={20} className="text-orange-400" />
              </div>
              <h2 className="text-lg font-bold">Configuration</h2>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between p-3 bg-[#0A1628] rounded-lg">
                <div>
                  <p className="text-sm font-medium">Backup automatique</p>
                  <p className="text-xs text-gray-400">Sauvegarder chaque jour</p>
                </div>
                <input
                  type="checkbox"
                  checked={configForm.auto_actif}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, auto_actif: e.target.checked })
                  }
                  className="w-5 h-5 rounded"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Fréquence (heures)
                </label>
                <select
                  value={configForm.frequence_heures}
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      frequence_heures: parseInt(e.target.value),
                    })
                  }
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value={6}>Toutes les 6 heures</option>
                  <option value={12}>Toutes les 12 heures</option>
                  <option value={24}>Tous les jours</option>
                  <option value={48}>Tous les 2 jours</option>
                  <option value={168}>Toutes les semaines</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Conserver les backups (jours)
                </label>
                <select
                  value={configForm.retention_jours}
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      retention_jours: parseInt(e.target.value),
                    })
                  }
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value={7}>7 jours</option>
                  <option value={15}>15 jours</option>
                  <option value={30}>30 jours</option>
                  <option value={60}>60 jours</option>
                  <option value={90}>90 jours</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#0A1628] rounded-lg">
                <div>
                  <p className="text-sm font-medium">Inclure les fichiers</p>
                  <p className="text-xs text-gray-400">
                    Photos uploadées (avantages)
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={configForm.inclure_fichiers}
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      inclure_fichiers: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded"
                />
              </div>
            </div>

            <div className="p-5 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setModalConfig(false)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition font-medium"
              >
                Annuler
              </button>
              <button
                onClick={sauvegarderConfig}
                className="flex-1 px-4 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition flex items-center justify-center gap-2"
              >
                <Save size={16} />
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL SUPPRESSION ===== */}
      {modalSupprimer && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalSupprimer(null)}
        >
          <div
            className="bg-[#112240] rounded-2xl max-w-md w-full border border-red-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <Trash2 size={20} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Supprimer le backup</h2>
                <p className="text-xs text-gray-400 truncate max-w-xs">
                  {modalSupprimer.nom_fichier}
                </p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-300">
                Cette action est irréversible. Le fichier sera supprimé du disque.
              </p>
            </div>
            <div className="p-5 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setModalSupprimer(null)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition font-medium"
              >
                Annuler
              </button>
              <button
                onClick={supprimerBackup}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}