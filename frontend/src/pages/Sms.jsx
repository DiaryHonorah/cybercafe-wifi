import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Settings,
  Send,
  History,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Smartphone,
  Save,
  Eye,
  EyeOff,
  Search,
} from "lucide-react";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function Sms() {
  const navigate = useNavigate();
  const [ongletActif, setOngletActif] = useState("config");
  const [config, setConfig] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [stats, setStats] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(null);
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);
  const [rechercheHist, setRechercheHist] = useState("");
  const [showSecret, setShowSecret] = useState(false);

  // Modal test manuel
  const [modalTest, setModalTest] = useState(false);
  const [formTest, setFormTest] = useState({ telephone: "", message: "" });
  const [testEnCours, setTestEnCours] = useState(false);

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
    try {
      const res = await fetchAvecToken(`${API_URL}/sms/admin/config`);
      if (res.status === 401) {
        navigate("/login");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
      } else {
        setErreur(data.message);
      }
    } catch (err) {
      setErreur("Impossible de contacter le serveur");
    } finally {
      setChargement(false);
    }
  };

  const chargerHistorique = async () => {
    setChargement(true);
    try {
      const res = await fetchAvecToken(`${API_URL}/sms/admin/historique?limite=200`);
      const data = await res.json();
      if (data.success) {
        setHistorique(data.historique || []);
        setStats(data.stats);
      }
    } catch (err) {
      setErreur("Impossible de charger l'historique");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    if (ongletActif === "config") chargerConfig();
    else if (ongletActif === "historique") chargerHistorique();
  }, [ongletActif]);

  const sauvegarderConfig = async () => {
    setSauvegardeEnCours(true);
    try {
      const res = await fetchAvecToken(`${API_URL}/sms/admin/config`, {
        method: "POST",
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        afficherMessage("succes", "Configuration sauvegardée");
      } else {
        afficherMessage("erreur", data.message);
      }
    } catch (err) {
      afficherMessage("erreur", "Erreur serveur");
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const envoyerTest = async () => {
    if (!formTest.telephone) {
      afficherMessage("erreur", "Numéro de téléphone requis");
      return;
    }
    setTestEnCours(true);
    try {
      const res = await fetchAvecToken(`${API_URL}/sms/admin/test`, {
        method: "POST",
        body: JSON.stringify(formTest),
      });
      const data = await res.json();
      if (data.success) {
        afficherMessage("succes", data.message);
        setModalTest(false);
        setFormTest({ telephone: "", message: "" });
        if (ongletActif === "historique") chargerHistorique();
      } else {
        afficherMessage("erreur", data.message);
      }
    } catch (err) {
      afficherMessage("erreur", "Erreur serveur");
    } finally {
      setTestEnCours(false);
    }
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

  const getStatutBadge = (statut) => {
    const badges = {
      succes: { label: "Succès", color: "bg-green-500/10 text-green-400 border-green-500/30", icon: CheckCircle2 },
      echec: { label: "Échec", color: "bg-red-500/10 text-red-400 border-red-500/30", icon: XCircle },
      simule: { label: "Simulé", color: "bg-gray-500/10 text-gray-400 border-gray-500/30", icon: Eye },
    };
    return badges[statut] || badges.simule;
  };

  const getTypeLabel = (type) => {
    const labels = {
      reservation: "Réservation",
      rdv: "Rendez-vous",
      support: "Support",
      autre: "Autre",
    };
    return labels[type] || type;
  };

  const historiqueFiltre = historique.filter((h) => {
    if (!rechercheHist) return true;
    const search = rechercheHist.toLowerCase();
    return (
      h.telephone.toLowerCase().includes(search) ||
      h.message.toLowerCase().includes(search)
    );
  });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#06B6D4] to-[#1E40AF]">
              <MessageSquare size={24} className="text-white" />
            </div>
            SMS Automatiques
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Envoyez des SMS de confirmation à vos clients
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setModalTest(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#06B6D4] hover:bg-[#0891B2] text-white font-medium transition"
          >
            <Send size={16} />
            Tester un SMS
          </button>
          <button
            onClick={() => {
              if (ongletActif === "config") chargerConfig();
              else chargerHistorique();
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

      {/* STATS (onglet historique) */}
      {ongletActif === "historique" && stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-[#112240] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <MessageSquare size={14} /> Total
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-green-500/20">
            <div className="flex items-center gap-2 text-xs text-green-400 mb-1">
              <CheckCircle2 size={14} /> Succès
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.succes}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-red-500/20">
            <div className="flex items-center gap-2 text-xs text-red-400 mb-1">
              <XCircle size={14} /> Échecs
            </div>
            <p className="text-2xl font-bold text-red-400">{stats.echecs}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-gray-500/20">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <Eye size={14} /> Simulés
            </div>
            <p className="text-2xl font-bold text-gray-400">{stats.simules}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-cyan-500/20">
            <div className="flex items-center gap-2 text-xs text-cyan-400 mb-1">
              <Clock size={14} /> Aujourd'hui
            </div>
            <p className="text-2xl font-bold text-cyan-400">{stats.aujourdhui}</p>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-2">
        <button
          onClick={() => setOngletActif("config")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition ${
            ongletActif === "config"
              ? "bg-[#06B6D4] text-white shadow-lg shadow-cyan-500/30"
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
              ? "bg-[#06B6D4] text-white shadow-lg shadow-cyan-500/30"
              : "text-gray-400 hover:bg-white/5"
          }`}
        >
          <History size={16} />
          Historique
        </button>
      </div>

      {/* ===== ONGLET CONFIG ===== */}
      {ongletActif === "config" && config && (
        <div className="bg-[#112240] rounded-xl p-6 border border-white/5 max-w-3xl">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Settings size={20} className="text-[#67E8F9]" />
            Paramètres SMS
          </h2>

          <div className="space-y-6">
            {/* Activation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 bg-[#0A1628] rounded-lg">
                <div>
                  <p className="text-sm font-medium">Système SMS actif</p>
                  <p className="text-xs text-gray-400">Activer l'envoi de SMS</p>
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
                  <p className="text-sm font-medium">Mode Test</p>
                  <p className="text-xs text-gray-400">Simuler les envois (pas de vrai SMS)</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.mode_test == 1}
                  onChange={(e) =>
                    setConfig({ ...config, mode_test: e.target.checked ? 1 : 0 })
                  }
                  className="w-5 h-5 rounded"
                />
              </div>
            </div>

            {/* Fournisseur */}
            <div>
              <h3 className="font-semibold text-sm mb-2 text-[#67E8F9]">
                Fournisseur de SMS
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Fournisseur</label>
                  <select
                    value={config.fournisseur}
                    onChange={(e) =>
                      setConfig({ ...config, fournisseur: e.target.value })
                    }
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
                  >
                    <option value="twilio">Twilio (International)</option>
                    <option value="vonage">Vonage / Nexmo (International)</option>
                    <option value="local">API locale (MVola, Orange...)</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                {config.fournisseur === "local" && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">URL de l'API</label>
                    <input
                      type="text"
                      value={config.api_url || ""}
                      onChange={(e) =>
                        setConfig({ ...config, api_url: e.target.value })
                      }
                      placeholder="https://api.monfournisseur.mg/sms"
                      className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Clé API / SID</label>
                    <input
                      type="text"
                      value={config.api_key || ""}
                      onChange={(e) =>
                        setConfig({ ...config, api_key: e.target.value })
                      }
                      placeholder="Votre clé API"
                      className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Secret API / Token</label>
                    <div className="relative">
                      <input
                        type={showSecret ? "text" : "password"}
                        value={config.api_secret || ""}
                        onChange={(e) =>
                          setConfig({ ...config, api_secret: e.target.value })
                        }
                        placeholder="Votre secret API"
                        className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 pr-10 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Expéditeur (Sender ID)</label>
                  <input
                    type="text"
                    value={config.expediteur || ""}
                    onChange={(e) =>
                      setConfig({ ...config, expediteur: e.target.value })
                    }
                    placeholder="CYBERFAMILLE"
                    maxLength={20}
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Nom qui apparaîtra sur le téléphone du client
                  </p>
                </div>
              </div>
            </div>

            {/* Déclencheurs */}
            <div>
              <h3 className="font-semibold text-sm mb-2 text-[#67E8F9]">
                Événements déclencheurs
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  { key: "sms_reservation_creation", label: "Création de réservation" },
                  { key: "sms_reservation_confirmation", label: "Confirmation de réservation" },
                  { key: "sms_reservation_annulation", label: "Annulation de réservation" },
                  { key: "sms_rdv_creation", label: "Création de rendez-vous" },
                  { key: "sms_rdv_confirmation", label: "Confirmation de rendez-vous" },
                  { key: "sms_rdv_rappel", label: "Rappel de rendez-vous (24h avant)" },
                  { key: "sms_ticket_support_reponse", label: "Réponse à un ticket support" },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-2 p-2 bg-[#0A1628] rounded-lg cursor-pointer hover:bg-[#0A1628]/80"
                  >
                    <input
                      type="checkbox"
                      checked={config[item.key] == 1}
                      onChange={(e) =>
                        setConfig({ ...config, [item.key]: e.target.checked ? 1 : 0 })
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={sauvegarderConfig}
              disabled={sauvegardeEnCours}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#06B6D4] hover:bg-[#0891B2] text-white font-medium transition disabled:opacity-50"
            >
              {sauvegardeEnCours ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Enregistrer la configuration
            </button>
          </div>
        </div>
      )}

      {/* ===== ONGLET HISTORIQUE ===== */}
      {ongletActif === "historique" && (
        <div>
          <div className="bg-[#112240] rounded-xl p-4 mb-6 border border-white/5">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={rechercheHist}
                onChange={(e) => setRechercheHist(e.target.value)}
                placeholder="Rechercher par numéro ou contenu du message..."
                className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
              />
            </div>
          </div>

          {chargement ? (
            <div className="text-center py-20">
              <Loader2 size={40} className="animate-spin text-[#06B6D4] mx-auto" />
              <p className="text-gray-400 mt-4">Chargement...</p>
            </div>
          ) : historiqueFiltre.length === 0 ? (
            <div className="text-center py-20 bg-[#112240] rounded-2xl border border-white/5">
              <MessageSquare size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun SMS</h3>
              <p className="text-sm text-gray-400">
                Aucun message n'a encore été envoyé.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {historiqueFiltre.map((h) => {
                const badge = getStatutBadge(h.statut);
                const BadgeIcon = badge.icon;
                return (
                  <div
                    key={h.id}
                    className="bg-[#112240] rounded-xl p-4 border border-white/5"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-[#67E8F9] text-sm font-bold">
                            <Smartphone size={12} className="inline mr-1" />
                            {h.telephone}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${badge.color}`}
                          >
                            <BadgeIcon size={10} />
                            {badge.label}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                            {getTypeLabel(h.type)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mt-2">{h.message}</p>
                        {h.erreur && (
                          <p className="text-xs text-red-400 mt-1">
                            Erreur : {h.erreur}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 flex-shrink-0">
                        <Clock size={10} className="inline mr-1" />
                        {formatDate(h.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== MODAL TEST SMS ===== */}
      {modalTest && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !testEnCours && setModalTest(false)}
        >
          <div
            className="bg-[#112240] rounded-2xl max-w-md w-full border border-cyan-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Send size={20} className="text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Envoyer un SMS de test</h2>
                <p className="text-xs text-gray-400">
                  Vérifiez votre configuration
                </p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Numéro de téléphone *
                </label>
                <input
                  type="tel"
                  value={formTest.telephone}
                  onChange={(e) =>
                    setFormTest({ ...formTest, telephone: e.target.value })
                  }
                  placeholder="+261 34 12 345 67"
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Message (optionnel)
                </label>
                <textarea
                  value={formTest.message}
                  onChange={(e) =>
                    setFormTest({ ...formTest, message: e.target.value })
                  }
                  placeholder="Test SMS depuis Cyber Famille..."
                  rows={3}
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-[#06B6D4] focus:outline-none resize-none"
                />
              </div>
            </div>
            <div className="p-5 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setModalTest(false)}
                disabled={testEnCours}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={envoyerTest}
                disabled={testEnCours || !formTest.telephone}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[#06B6D4] hover:bg-[#0891B2] text-white font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {testEnCours ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}