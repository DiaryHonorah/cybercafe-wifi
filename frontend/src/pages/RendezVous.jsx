import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  CalendarDays, // ✅ AJOUTÉ ICI
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Eye,
  Check,
  X,
  Trash2,
  Settings,
  Wrench,
  Plus,
  Save,
  Edit,
  Tag,
  Timer,
} from "lucide-react";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function RendezVous() {
  const navigate = useNavigate();
  const [ongletActif, setOngletActif] = useState("rdv");
  const [rdv, setRdv] = useState([]);
  const [stats, setStats] = useState(null);
  const [services, setServices] = useState([]);
  const [config, setConfig] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(null);
  const [filtreStatut, setFiltreStatut] = useState("en_attente");
  const [recherche, setRecherche] = useState("");
  const [dateFiltre, setDateFiltre] = useState("");
  const [modalDetail, setModalDetail] = useState(null);
  const [modalStatut, setModalStatut] = useState(null);
  const [modalSupprimer, setModalSupprimer] = useState(null);
  const [modalService, setModalService] = useState(null);
  const [nouveauStatut, setNouveauStatut] = useState("");
  const [raisonAnnulation, setRaisonAnnulation] = useState("");
  const [notesTech, setNotesTech] = useState("");
  const [actionEnCours, setActionEnCours] = useState(false);

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

  const chargerRdv = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const params = new URLSearchParams();
      if (filtreStatut !== "tous") params.append("statut", filtreStatut);
      if (recherche.trim()) params.append("recherche", recherche.trim());
      if (dateFiltre) params.append("date", dateFiltre);

      const res = await fetchAvecToken(
        `${API_URL}/rdv/admin/liste?${params.toString()}`
      );
      if (res.status === 401) {
        navigate("/login");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setRdv(data.rdv || []);
        setStats(data.stats);
      } else {
        setErreur(data.message);
      }
    } catch (err) {
      setErreur("Impossible de contacter le serveur");
    } finally {
      setChargement(false);
    }
  };

  const chargerServices = async () => {
    setChargement(true);
    try {
      const res = await fetchAvecToken(`${API_URL}/rdv/admin/services`);
      const data = await res.json();
      if (data.success) setServices(data.services || []);
    } catch (err) {
      setErreur("Impossible de charger les services");
    } finally {
      setChargement(false);
    }
  };

  const chargerConfig = async () => {
    setChargement(true);
    try {
      const res = await fetchAvecToken(`${API_URL}/rdv/admin/config`);
      const data = await res.json();
      if (data.success) setConfig(data.config);
    } catch (err) {
      setErreur("Impossible de charger la configuration");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    if (ongletActif === "rdv") chargerRdv();
    else if (ongletActif === "services") chargerServices();
    else if (ongletActif === "config") chargerConfig();
  }, [ongletActif, filtreStatut]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (ongletActif === "rdv" && (recherche.length === 0 || recherche.length >= 2)) {
        chargerRdv();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [recherche]);

  const changerStatut = async () => {
    if (!modalStatut || !nouveauStatut) return;
    setActionEnCours(true);
    try {
      const res = await fetchAvecToken(`${API_URL}/rdv/admin/statut`, {
        method: "POST",
        body: JSON.stringify({
          id: modalStatut.id,
          statut: nouveauStatut,
          raison: nouveauStatut === "annule" ? raisonAnnulation : null,
          notes: notesTech || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        afficherMessage("succes", "Statut mis à jour");
        setModalStatut(null);
        setRaisonAnnulation("");
        setNotesTech("");
        chargerRdv();
      } else {
        afficherMessage("erreur", data.message);
      }
    } catch (err) {
      afficherMessage("erreur", "Erreur serveur");
    } finally {
      setActionEnCours(false);
    }
  };

  const supprimerRdv = async () => {
    if (!modalSupprimer) return;
    setActionEnCours(true);
    try {
      const res = await fetchAvecToken(`${API_URL}/rdv/admin/supprimer`, {
        method: "POST",
        body: JSON.stringify({ id: modalSupprimer.id }),
      });
      const data = await res.json();
      if (data.success) {
        afficherMessage("succes", "RDV supprimé");
        setModalSupprimer(null);
        chargerRdv();
      } else {
        afficherMessage("erreur", data.message);
      }
    } catch (err) {
      afficherMessage("erreur", "Erreur serveur");
    } finally {
      setActionEnCours(false);
    }
  };

  const sauvegarderService = async () => {
    if (!modalService) return;
    setActionEnCours(true);
    try {
      const url = modalService.id
        ? `${API_URL}/rdv/admin/services/modifier`
        : `${API_URL}/rdv/admin/services/creer`;

      const res = await fetchAvecToken(url, {
        method: "POST",
        body: JSON.stringify(modalService),
      });
      const data = await res.json();
      if (data.success) {
        afficherMessage("succes", "Service sauvegardé");
        setModalService(null);
        chargerServices();
      } else {
        afficherMessage("erreur", data.message);
      }
    } catch (err) {
      afficherMessage("erreur", "Erreur serveur");
    } finally {
      setActionEnCours(false);
    }
  };

  const supprimerService = async (id) => {
    if (!confirm("Supprimer ce service ?")) return;
    try {
      const res = await fetchAvecToken(
        `${API_URL}/rdv/admin/services/supprimer`,
        {
          method: "POST",
          body: JSON.stringify({ id }),
        }
      );
      const data = await res.json();
      if (data.success) {
        afficherMessage("succes", "Service supprimé");
        chargerServices();
      }
    } catch (err) {
      afficherMessage("erreur", "Erreur serveur");
    }
  };

  const sauvegarderConfig = async () => {
    setActionEnCours(true);
    try {
      const res = await fetchAvecToken(`${API_URL}/rdv/admin/config`, {
        method: "POST",
        body: JSON.stringify(config),
      });
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
      setActionEnCours(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr + "T00:00:00").toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateHeure = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrix = (n) =>
    Number(n || 0).toLocaleString("fr-FR");

  const getStatutBadge = (statut) => {
    const badges = {
      en_attente: { label: "En attente", color: "bg-orange-500/10 text-orange-400 border-orange-500/30", icon: Clock },
      confirme: { label: "Confirmé", color: "bg-blue-500/10 text-blue-400 border-blue-500/30", icon: CheckCircle2 },
      termine: { label: "Terminé", color: "bg-green-500/10 text-green-400 border-green-500/30", icon: Check },
      annule: { label: "Annulé", color: "bg-red-500/10 text-red-400 border-red-500/30", icon: XCircle },
      no_show: { label: "Absent", color: "bg-gray-500/10 text-gray-400 border-gray-500/30", icon: X },
    };
    return badges[statut] || badges.en_attente;
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#06B6D4] to-[#1E40AF]">
              <Calendar size={24} className="text-white" />
            </div>
            Rendez-vous
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Gérez les rendez-vous avec les techniciens
          </p>
        </div>

        <button
          onClick={() => {
            if (ongletActif === "rdv") chargerRdv();
            else if (ongletActif === "services") chargerServices();
            else chargerConfig();
          }}
          disabled={chargement}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition disabled:opacity-50"
        >
          <RefreshCw size={16} className={chargement ? "animate-spin" : ""} />
          Actualiser
        </button>
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
      {stats && ongletActif === "rdv" && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <div className="bg-[#112240] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <Calendar size={14} /> Total
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-orange-500/20">
            <div className="flex items-center gap-2 text-xs text-orange-400 mb-1">
              <Clock size={14} /> En attente
            </div>
            <p className="text-2xl font-bold text-orange-400">{stats.en_attente}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-blue-500/20">
            <div className="flex items-center gap-2 text-xs text-blue-400 mb-1">
              <CheckCircle2 size={14} /> Confirmés
            </div>
            <p className="text-2xl font-bold text-blue-400">{stats.confirmes}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-green-500/20">
            <div className="flex items-center gap-2 text-xs text-green-400 mb-1">
              <Check size={14} /> Terminés
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.termines}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-cyan-500/20">
            <div className="flex items-center gap-2 text-xs text-cyan-400 mb-1">
              <CalendarDays size={14} /> Aujourd'hui
            </div>
            <p className="text-2xl font-bold text-cyan-400">{stats.aujourdhui}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-yellow-500/20">
            <div className="flex items-center gap-2 text-xs text-yellow-400 mb-1">
              💰 Revenus
            </div>
            <p className="text-lg font-bold text-yellow-400">
              {formatPrix(stats.revenus)} Ar
            </p>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-2 flex-wrap">
        <button
          onClick={() => setOngletActif("rdv")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition ${
            ongletActif === "rdv"
              ? "bg-[#06B6D4] text-white shadow-lg shadow-cyan-500/30"
              : "text-gray-400 hover:bg-white/5"
          }`}
        >
          <Calendar size={16} />
          Rendez-vous
        </button>
        <button
          onClick={() => setOngletActif("services")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition ${
            ongletActif === "services"
              ? "bg-[#06B6D4] text-white shadow-lg shadow-cyan-500/30"
              : "text-gray-400 hover:bg-white/5"
          }`}
        >
          <Wrench size={16} />
          Services
        </button>
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
      </div>

      {/* ===== ONGLET RDV ===== */}
      {ongletActif === "rdv" && (
        <>
          {/* Filtres */}
          <div className="bg-[#112240] rounded-xl p-4 mb-6 border border-white/5">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  placeholder="Rechercher par référence, nom, téléphone..."
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
                />
              </div>
              <select
                value={filtreStatut}
                onChange={(e) => setFiltreStatut(e.target.value)}
                className="bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
              >
                <option value="tous">Tous statuts</option>
                <option value="en_attente">En attente</option>
                <option value="confirme">Confirmés</option>
                <option value="termine">Terminés</option>
                <option value="annule">Annulés</option>
                <option value="no_show">Absents</option>
              </select>
              <input
                type="date"
                value={dateFiltre}
                onChange={(e) => setDateFiltre(e.target.value)}
                className="bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
              />
            </div>
          </div>

          {/* Liste */}
          {chargement ? (
            <div className="text-center py-20">
              <Loader2 size={40} className="animate-spin text-[#06B6D4] mx-auto" />
              <p className="text-gray-400 mt-4">Chargement...</p>
            </div>
          ) : rdv.length === 0 ? (
            <div className="text-center py-20 bg-[#112240] rounded-2xl border border-white/5">
              <Calendar size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun rendez-vous</h3>
              <p className="text-sm text-gray-400">
                {filtreStatut === "en_attente"
                  ? "Aucun rendez-vous en attente"
                  : "Aucun rendez-vous avec ces filtres"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {rdv.map((r) => {
                const badge = getStatutBadge(r.statut);
                const BadgeIcon = badge.icon;
                return (
                  <div
                    key={r.id}
                    className="bg-[#112240] rounded-xl p-4 border border-white/5 hover:border-[#06B6D4]/30 transition"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-[#67E8F9] font-bold text-sm">
                            {r.reference}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${badge.color}`}
                          >
                            <BadgeIcon size={10} />
                            {badge.label}
                          </span>
                        </div>
                        <p className="font-semibold flex items-center gap-2">
                          <span className="text-xl">{r.service_icone}</span>
                          {r.service_nom}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mt-2">
                          <div>
                            <p className="text-xs text-gray-500">
                              <User size={10} className="inline mr-1" />
                              Client
                            </p>
                            <p>{r.nom_client}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">
                              <Phone size={10} className="inline mr-1" />
                              Téléphone
                            </p>
                            <p>{r.telephone_client}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">
                              <Calendar size={10} className="inline mr-1" />
                              Date
                            </p>
                            <p>{formatDate(r.date_rdv)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">
                              <Clock size={10} className="inline mr-1" />
                              Heure
                            </p>
                            <p>
                              {r.heure_debut?.substring(0, 5)} →{" "}
                              {r.heure_fin?.substring(0, 5)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => setModalDetail(r)}
                          className="p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition"
                          title="Voir"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setModalStatut(r);
                            setNouveauStatut(r.statut);
                            setRaisonAnnulation("");
                            setNotesTech(r.notes_technicien || "");
                          }}
                          className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition"
                          title="Changer statut"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setModalSupprimer(r)}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ===== ONGLET SERVICES ===== */}
      {ongletActif === "services" && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() =>
                setModalService({
                  id: null,
                  nom: "",
                  nom_mg: "",
                  description: "",
                  description_mg: "",
                  icone: "🔧",
                  duree_minutes: 60,
                  tarif: 0,
                  actif: 1,
                  ordre: 0,
                })
              }
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#06B6D4] hover:bg-[#0891B2] text-white font-medium transition"
            >
              <Plus size={16} />
              Nouveau service
            </button>
          </div>

          {chargement ? (
            <div className="text-center py-20">
              <Loader2 size={40} className="animate-spin text-[#06B6D4] mx-auto" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {services.map((s) => (
                <div
                  key={s.id}
                  className="bg-[#112240] rounded-xl p-4 border border-white/5"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-3xl">{s.icone}</div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setModalService(s)}
                        className="p-1.5 rounded bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20 text-[#67E8F9] transition"
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        onClick={() => supprimerService(s.id)}
                        className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-sm mb-1">{s.nom}</h3>
                  <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                    {s.description}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      <Timer size={10} className="inline mr-1" />
                      {s.duree_minutes} min
                    </span>
                    <span className="font-bold text-[#67E8F9]">
                      {parseFloat(s.tarif) > 0
                        ? `${formatPrix(s.tarif)} Ar`
                        : "Gratuit"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== ONGLET CONFIG ===== */}
      {ongletActif === "config" && config && (
        <div className="bg-[#112240] rounded-xl p-6 border border-white/5 max-w-2xl">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Settings size={20} className="text-[#67E8F9]" />
            Configuration
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#0A1628] rounded-lg">
              <div>
                <p className="text-sm font-medium">Activer les rendez-vous</p>
                <p className="text-xs text-gray-400">
                  Autoriser les clients à prendre RDV
                </p>
              </div>
              <input
                type="checkbox"
                checked={config.actif == 1}
                onChange={(e) =>
                  setConfig({ ...config, actif: e.target.checked ? 1 : 0 })
                }
                className="w-5 h-5"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Heure d'ouverture
                </label>
                <input
                  type="time"
                  value={config.heure_ouverture?.substring(0, 5) || "09:00"}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      heure_ouverture: e.target.value + ":00",
                    })
                  }
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Heure de fermeture
                </label>
                <input
                  type="time"
                  value={config.heure_fermeture?.substring(0, 5) || "18:00"}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      heure_fermeture: e.target.value + ":00",
                    })
                  }
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Pause déjeuner (début)
                </label>
                <input
                  type="time"
                  value={config.pause_debut?.substring(0, 5) || "12:00"}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      pause_debut: e.target.value + ":00",
                    })
                  }
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Pause déjeuner (fin)
                </label>
                <input
                  type="time"
                  value={config.pause_fin?.substring(0, 5) || "13:00"}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      pause_fin: e.target.value + ":00",
                    })
                  }
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Durée des créneaux (min)
              </label>
              <select
                value={config.duree_creneau}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    duree_creneau: parseInt(e.target.value),
                  })
                }
                className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
              >
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Jours ouverts
              </label>
              <div className="flex gap-2 flex-wrap">
                {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(
                  (jour, i) => {
                    const num = i + 1;
                    const jours = config.jours_ouverts.split(",");
                    const actif = jours.includes(String(num));
                    return (
                      <button
                        key={num}
                        onClick={() => {
                          let newJours;
                          if (actif) {
                            newJours = jours.filter((j) => j !== String(num));
                          } else {
                            newJours = [...jours, String(num)];
                          }
                          setConfig({
                            ...config,
                            jours_ouverts: newJours.sort().join(","),
                          });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                          actif
                            ? "bg-[#06B6D4] text-white"
                            : "bg-white/5 text-gray-400"
                        }`}
                      >
                        {jour}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Délai minimum (heures)
                </label>
                <input
                  type="number"
                  value={config.delai_min_heures}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      delai_min_heures: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Max jours dans le futur
                </label>
                <input
                  type="number"
                  value={config.max_jours_avenir}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      max_jours_avenir: parseInt(e.target.value) || 30,
                    })
                  }
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Message d'accueil
              </label>
              <textarea
                value={config.message_accueil || ""}
                onChange={(e) =>
                  setConfig({ ...config, message_accueil: e.target.value })
                }
                rows={2}
                className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-[#06B6D4] focus:outline-none resize-none"
              />
            </div>

            <button
              onClick={sauvegarderConfig}
              disabled={actionEnCours}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#06B6D4] hover:bg-[#0891B2] text-white font-medium transition disabled:opacity-50"
            >
              {actionEnCours ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* MODAL DÉTAIL */}
      {modalDetail && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalDetail(null)}
        >
          <div
            className="bg-[#112240] rounded-2xl max-w-md w-full border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{modalDetail.reference}</h2>
                <p className="text-xs text-gray-400">
                  {modalDetail.service_icone} {modalDetail.service_nom}
                </p>
              </div>
              <button
                onClick={() => setModalDetail(null)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Client</span>
                <span className="font-medium">{modalDetail.nom_client}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Téléphone</span>
                <span className="font-medium">{modalDetail.telephone_client}</span>
              </div>
              {modalDetail.email_client && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Email</span>
                  <span className="font-medium">{modalDetail.email_client}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Date</span>
                <span className="font-medium">{formatDate(modalDetail.date_rdv)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Heure</span>
                <span className="font-medium">
                  {modalDetail.heure_debut?.substring(0, 5)} →{" "}
                  {modalDetail.heure_fin?.substring(0, 5)}
                </span>
              </div>
              {modalDetail.description && (
                <div>
                  <p className="text-gray-400 mb-1">Description</p>
                  <p className="text-gray-300 bg-[#0A1628] rounded p-2">
                    {modalDetail.description}
                  </p>
                </div>
              )}
              {modalDetail.notes_technicien && (
                <div>
                  <p className="text-gray-400 mb-1">Notes technicien</p>
                  <p className="text-gray-300 bg-[#0A1628] rounded p-2">
                    {modalDetail.notes_technicien}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL STATUT */}
      {modalStatut && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !actionEnCours && setModalStatut(null)}
        >
          <div
            className="bg-[#112240] rounded-2xl max-w-md w-full border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Edit size={20} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Changer le statut</h2>
                <p className="text-xs text-gray-400">{modalStatut.reference}</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Nouveau statut
                </label>
                <select
                  value={nouveauStatut}
                  onChange={(e) => setNouveauStatut(e.target.value)}
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
                >
                  <option value="en_attente">En attente</option>
                  <option value="confirme">Confirmé</option>
                  <option value="termine">Terminé</option>
                  <option value="annule">Annulé</option>
                  <option value="no_show">Absent (no-show)</option>
                </select>
              </div>

              {nouveauStatut === "annule" && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Raison d'annulation
                  </label>
                  <textarea
                    value={raisonAnnulation}
                    onChange={(e) => setRaisonAnnulation(e.target.value)}
                    rows={2}
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-red-500 focus:outline-none resize-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Notes technicien (optionnel)
                </label>
                <textarea
                  value={notesTech}
                  onChange={(e) => setNotesTech(e.target.value)}
                  rows={2}
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-[#06B6D4] focus:outline-none resize-none"
                />
              </div>
            </div>
            <div className="p-5 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setModalStatut(null)}
                disabled={actionEnCours}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={changerStatut}
                disabled={actionEnCours}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[#06B6D4] hover:bg-[#0891B2] text-white font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionEnCours ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUPPRIMER */}
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
              <h2 className="text-lg font-bold">Supprimer le RDV</h2>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-300">
                Supprimer définitivement le rendez-vous{" "}
                <strong>{modalSupprimer.reference}</strong> ?
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
                onClick={supprimerRdv}
                disabled={actionEnCours}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition disabled:opacity-50"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SERVICE */}
      {modalService && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => !actionEnCours && setModalService(null)}
        >
          <div
            className="bg-[#112240] rounded-2xl max-w-md w-full border border-white/10 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#06B6D4]/20">
                <Wrench size={20} className="text-[#67E8F9]" />
              </div>
              <h2 className="text-lg font-bold">
                {modalService.id ? "Modifier le service" : "Nouveau service"}
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Icône
                  </label>
                  <input
                    type="text"
                    value={modalService.icone}
                    onChange={(e) =>
                      setModalService({ ...modalService, icone: e.target.value })
                    }
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2 px-3 text-white text-sm text-center text-xl focus:border-[#06B6D4] focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={modalService.nom}
                    onChange={(e) =>
                      setModalService({ ...modalService, nom: e.target.value })
                    }
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Description
                </label>
                <textarea
                  value={modalService.description || ""}
                  onChange={(e) =>
                    setModalService({
                      ...modalService,
                      description: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-[#06B6D4] focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Durée (min)
                  </label>
                  <input
                    type="number"
                    value={modalService.duree_minutes}
                    onChange={(e) =>
                      setModalService({
                        ...modalService,
                        duree_minutes: parseInt(e.target.value) || 30,
                      })
                    }
                    min="15"
                    step="15"
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Tarif (Ar)
                  </label>
                  <input
                    type="number"
                    value={modalService.tarif}
                    onChange={(e) =>
                      setModalService({
                        ...modalService,
                        tarif: parseFloat(e.target.value) || 0,
                      })
                    }
                    min="0"
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 bg-[#0A1628] rounded-lg p-3">
                <input
                  type="checkbox"
                  checked={modalService.actif == 1}
                  onChange={(e) =>
                    setModalService({
                      ...modalService,
                      actif: e.target.checked ? 1 : 0,
                    })
                  }
                  className="w-5 h-5"
                />
                <label className="text-sm">Service actif</label>
              </div>
            </div>
            <div className="p-5 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setModalService(null)}
                disabled={actionEnCours}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={sauvegarderService}
                disabled={actionEnCours}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[#06B6D4] hover:bg-[#0891B2] text-white font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionEnCours ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}