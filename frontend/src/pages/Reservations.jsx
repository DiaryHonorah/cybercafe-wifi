import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Users,
  User,
  Mail,
  Phone,
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Trash2,
  Flag,
  Loader2,
  RefreshCw,
  Eye,
  X,
  TrendingUp,
  AlertCircle,
  CheckCheck,
  Ban,
} from "lucide-react";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function Reservations() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [recherche, setRecherche] = useState("");
  const [detailModal, setDetailModal] = useState(null);
  const [modalAction, setModalAction] = useState(null);
  const [raisonAnnulation, setRaisonAnnulation] = useState("");

  // ===== RÉCUPÉRER LE TOKEN =====
  const getToken = () => {
    // Essaie plusieurs clés possibles selon ton système
    return (
      localStorage.getItem("admin_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("auth_token") ||
      sessionStorage.getItem("admin_token") ||
      sessionStorage.getItem("token") ||
      ""
    );
  };

  // ===== FETCH AVEC TOKEN =====
  const fetchAvecToken = async (url, options = {}) => {
    const token = getToken();

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return fetch(url, {
      ...options,
      headers,
      credentials: "omit", // ← On n'utilise plus les cookies !
    });
  };

  // ===== CHARGEMENT =====
  const chargerReservations = async () => {
    setChargement(true);
    setErreur(null);

    const token = getToken();
    if (!token) {
      setErreur("Aucun token trouvé. Redirection vers la connexion...");
      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    try {
      // Stats
      const statsRes = await fetchAvecToken(
        `${API_URL}/reservations/stats`
      );

      if (statsRes.status === 401) {
        setErreur("Token invalide ou expiré. Redirection...");
        setTimeout(() => navigate("/login"), 1500);
        return;
      }

      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.stats);

      // Liste
      const params = new URLSearchParams();
      if (filtreStatut !== "tous") params.append("statut", filtreStatut);
      if (recherche.trim()) params.append("recherche", recherche.trim());

      const listeRes = await fetchAvecToken(
        `${API_URL}/reservations?${params.toString()}`
      );

      if (listeRes.status === 401) {
        setErreur("Session expirée. Redirection...");
        setTimeout(() => navigate("/login"), 1500);
        return;
      }

      const listeData = await listeRes.json();

      if (listeData.success) {
        setReservations(listeData.reservations || []);
      } else {
        setErreur(
          listeData.message || "Erreur lors du chargement des réservations"
        );
      }
    } catch (err) {
      console.error("Erreur complète:", err);
      setErreur(
        `Impossible de contacter le serveur. Vérifiez que XAMPP (Apache) est démarré.`
      );
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerReservations();
  }, [filtreStatut]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (recherche.length === 0 || recherche.length >= 2) {
        chargerReservations();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [recherche]);

  // ===== ACTIONS =====
  const confirmer = async (id) => {
    if (!confirm("Confirmer cette réservation ?")) return;

    try {
      const res = await fetchAvecToken(`${API_URL}/reservations/confirmer`, {
        method: "POST",
        body: JSON.stringify({ id }),
      });
      const data = await res.json();

      if (data.success) {
        chargerReservations();
        setModalAction(null);
      } else {
        alert(data.message || "Erreur");
      }
    } catch (err) {
      alert("Erreur serveur : " + err.message);
    }
  };

  const annuler = async (id) => {
    if (!raisonAnnulation.trim()) {
      alert("Veuillez indiquer une raison d'annulation");
      return;
    }

    try {
      const res = await fetchAvecToken(`${API_URL}/reservations/annuler`, {
        method: "POST",
        body: JSON.stringify({ id, raison: raisonAnnulation }),
      });
      const data = await res.json();

      if (data.success) {
        chargerReservations();
        setModalAction(null);
        setRaisonAnnulation("");
      } else {
        alert(data.message || "Erreur");
      }
    } catch (err) {
      alert("Erreur serveur : " + err.message);
    }
  };

  const terminer = async (id) => {
    if (!confirm("Marquer cette réservation comme terminée ?")) return;

    try {
      const res = await fetchAvecToken(`${API_URL}/reservations/terminer`, {
        method: "POST",
        body: JSON.stringify({ id }),
      });
      const data = await res.json();

      if (data.success) {
        chargerReservations();
        setModalAction(null);
      } else {
        alert(data.message || "Erreur");
      }
    } catch (err) {
      alert("Erreur serveur : " + err.message);
    }
  };

  const supprimer = async (id) => {
    if (!confirm("Supprimer définitivement cette réservation ?")) return;

    try {
      const res = await fetchAvecToken(`${API_URL}/reservations/supprimer`, {
        method: "POST",
        body: JSON.stringify({ id }),
      });
      const data = await res.json();

      if (data.success) {
        chargerReservations();
        setDetailModal(null);
        setModalAction(null);
      } else {
        alert(data.message || "Erreur");
      }
    } catch (err) {
      alert("Erreur serveur : " + err.message);
    }
  };

  // ===== HELPERS =====
  const getStatutBadge = (statut) => {
    const badges = {
      en_attente: {
        label: "En attente",
        color: "bg-orange-500/10 text-orange-400 border-orange-500/30",
        icon: Clock,
      },
      confirmee: {
        label: "Confirmée",
        color: "bg-green-500/10 text-green-400 border-green-500/30",
        icon: CheckCircle2,
      },
      annulee: {
        label: "Annulée",
        color: "bg-red-500/10 text-red-400 border-red-500/30",
        icon: XCircle,
      },
      terminee: {
        label: "Terminée",
        color: "bg-gray-500/10 text-gray-400 border-gray-500/30",
        icon: CheckCheck,
      },
    };
    return badges[statut] || badges.en_attente;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateLongue = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // ===== RENDER =====
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
              <Calendar size={24} className="text-white" />
            </div>
            Gestion des réservations
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Gérez les réservations de postes en ligne
          </p>
        </div>

        <button
          onClick={chargerReservations}
          disabled={chargement}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition disabled:opacity-50"
        >
          <RefreshCw size={16} className={chargement ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {/* STATS */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-[#112240] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <TrendingUp size={14} /> Total
            </div>
            <p className="text-2xl font-bold">{stats.total || 0}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-orange-500/20">
            <div className="flex items-center gap-2 text-xs text-orange-400 mb-1">
              <Clock size={14} /> En attente
            </div>
            <p className="text-2xl font-bold text-orange-400">
              {stats.en_attente || 0}
            </p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-green-500/20">
            <div className="flex items-center gap-2 text-xs text-green-400 mb-1">
              <CheckCircle2 size={14} /> Confirmées
            </div>
            <p className="text-2xl font-bold text-green-400">
              {stats.confirmee || 0}
            </p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-red-500/20">
            <div className="flex items-center gap-2 text-xs text-red-400 mb-1">
              <XCircle size={14} /> Annulées
            </div>
            <p className="text-2xl font-bold text-red-400">
              {stats.annulee || 0}
            </p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-cyan-500/20">
            <div className="flex items-center gap-2 text-xs text-cyan-400 mb-1">
              <Calendar size={14} /> Aujourd'hui
            </div>
            <p className="text-2xl font-bold text-cyan-400">
              {stats.aujourd_hui || 0}
            </p>
          </div>
        </div>
      )}

      {/* FILTRES */}
      <div className="bg-[#112240] rounded-xl p-4 mb-6 border border-white/5">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher par nom, email, téléphone ou code..."
              className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-orange-500 focus:outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
              className="bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none transition"
            >
              <option value="tous">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="confirmee">Confirmées</option>
              <option value="annulee">Annulées</option>
              <option value="terminee">Terminées</option>
            </select>
          </div>
        </div>
      </div>

      {/* ERREUR */}
      {erreur && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} />
          <p>{erreur}</p>
        </div>
      )}

      {/* CHARGEMENT */}
      {chargement && reservations.length === 0 ? (
        <div className="text-center py-20">
          <Loader2 size={40} className="animate-spin text-orange-500 mx-auto" />
          <p className="text-gray-400 mt-4">Chargement des réservations...</p>
        </div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-20 bg-[#112240] rounded-2xl border border-white/5">
          <Calendar size={48} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune réservation</h3>
          <p className="text-sm text-gray-400">
            {recherche || filtreStatut !== "tous"
              ? "Aucun résultat pour vos filtres"
              : "Les nouvelles réservations apparaîtront ici"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((res) => {
            const badge = getStatutBadge(res.statut);
            const BadgeIcon = badge.icon;

            return (
              <div
                key={res.id}
                className="bg-[#112240] rounded-xl p-4 border border-white/5 hover:border-orange-500/30 transition group"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="font-mono font-bold text-orange-400 text-lg">
                        {res.code_reservation}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${badge.color}`}
                      >
                        <BadgeIcon size={12} />
                        {badge.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <User size={14} className="text-gray-500 flex-shrink-0" />
                        <span className="truncate">{res.nom}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar
                          size={14}
                          className="text-gray-500 flex-shrink-0"
                        />
                        <span>{formatDate(res.date_reservation)}</span>
                        <Clock
                          size={14}
                          className="text-gray-500 flex-shrink-0 ml-2"
                        />
                        <span>{res.heure_reservation?.substring(0, 5)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Users
                          size={14}
                          className="text-gray-500 flex-shrink-0"
                        />
                        <span>
                          {res.nombre_postes} poste
                          {res.nombre_postes > 1 ? "s" : ""}
                        </span>
                        <span className="text-gray-500">·</span>
                        <span>{res.duree}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setDetailModal(res)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition"
                      title="Voir détails"
                    >
                      <Eye size={18} />
                    </button>

                    {res.statut === "en_attente" && (
                      <>
                        <button
                          onClick={() => confirmer(res.id)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-sm font-medium transition"
                          title="Confirmer"
                        >
                          <CheckCircle2 size={16} />
                          <span className="hidden md:inline">Confirmer</span>
                        </button>
                        <button
                          onClick={() => {
                            setModalAction({ type: "annuler", res });
                            setRaisonAnnulation("");
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition"
                          title="Annuler"
                        >
                          <Ban size={16} />
                          <span className="hidden md:inline">Annuler</span>
                        </button>
                      </>
                    )}

                    {res.statut === "confirmee" && (
                      <button
                        onClick={() => terminer(res.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 text-gray-300 text-sm font-medium transition"
                        title="Marquer comme terminée"
                      >
                        <Flag size={16} />
                        <span className="hidden md:inline">Terminer</span>
                      </button>
                    )}

                    <button
                      onClick={() => supprimer(res.id)}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DÉTAIL */}
      {detailModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setDetailModal(null)}
        >
          <div
            className="bg-[#112240] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#112240] border-b border-white/10 p-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{detailModal.nom}</h2>
                <p className="text-sm font-mono text-orange-400 mt-1">
                  {detailModal.code_reservation}
                </p>
              </div>
              <button
                onClick={() => setDetailModal(null)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex justify-center">
                {(() => {
                  const b = getStatutBadge(detailModal.statut);
                  const Icon = b.icon;
                  return (
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-medium border flex items-center gap-2 ${b.color}`}
                    >
                      <Icon size={16} />
                      {b.label}
                    </span>
                  );
                })()}
              </div>

              <div className="bg-[#0A1628] rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Contact
                </h3>
                <div className="flex items-center gap-3 text-sm">
                  <Mail size={16} className="text-orange-400 flex-shrink-0" />
                  <a
                    href={`mailto:${detailModal.email}`}
                    className="hover:text-orange-400 transition"
                  >
                    {detailModal.email}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone size={16} className="text-orange-400 flex-shrink-0" />
                  <a
                    href={`tel:${detailModal.telephone}`}
                    className="hover:text-orange-400 transition"
                  >
                    {detailModal.telephone}
                  </a>
                </div>
              </div>

              <div className="bg-[#0A1628] rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Réservation
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Date</p>
                    <p className="font-medium">
                      {formatDateLongue(detailModal.date_reservation)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Heure</p>
                    <p className="font-medium">
                      {detailModal.heure_reservation?.substring(0, 5)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Durée</p>
                    <p className="font-medium">{detailModal.duree}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Postes</p>
                    <p className="font-medium">{detailModal.nombre_postes}</p>
                  </div>
                </div>
              </div>

              {detailModal.message && (
                <div className="bg-[#0A1628] rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <MessageSquare size={14} /> Message
                  </h3>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">
                    {detailModal.message}
                  </p>
                </div>
              )}

              {detailModal.raison_annulation && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-2">
                    Raison d'annulation
                  </h3>
                  <p className="text-sm text-gray-300">
                    {detailModal.raison_annulation}
                  </p>
                </div>
              )}

              <div className="bg-[#0A1628] rounded-xl p-4 text-xs text-gray-500 space-y-1">
                <p>
                  Créée le :{" "}
                  {new Date(detailModal.created_at).toLocaleString("fr-FR")}
                </p>
                {detailModal.ip_client && <p>IP : {detailModal.ip_client}</p>}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {detailModal.statut === "en_attente" && (
                  <>
                    <button
                      onClick={() => {
                        confirmer(detailModal.id);
                        setDetailModal(null);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition"
                    >
                      <CheckCircle2 size={16} />
                      Confirmer
                    </button>
                    <button
                      onClick={() => {
                        setModalAction({ type: "annuler", res: detailModal });
                        setRaisonAnnulation("");
                        setDetailModal(null);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition"
                    >
                      <Ban size={16} />
                      Annuler
                    </button>
                  </>
                )}
                {detailModal.statut === "confirmee" && (
                  <button
                    onClick={() => {
                      terminer(detailModal.id);
                      setDetailModal(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-medium transition"
                  >
                    <Flag size={16} />
                    Marquer comme terminée
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ANNULATION */}
      {modalAction?.type === "annuler" && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalAction(null)}
        >
          <div
            className="bg-[#112240] rounded-2xl max-w-md w-full border border-red-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <Ban size={20} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Annuler la réservation</h2>
                <p className="text-xs text-gray-400 font-mono">
                  {modalAction.res.code_reservation}
                </p>
              </div>
            </div>

            <div className="p-5">
              <label className="block text-sm text-gray-400 mb-2">
                Raison de l'annulation *
              </label>
              <textarea
                value={raisonAnnulation}
                onChange={(e) => setRaisonAnnulation(e.target.value)}
                rows={4}
                placeholder="Ex: Plus de postes disponibles, demande du client..."
                className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-3 px-4 text-white focus:border-red-500 focus:outline-none transition resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                Cette raison sera envoyée par email au client.
              </p>
            </div>

            <div className="p-5 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setModalAction(null)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => annuler(modalAction.res.id)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition"
              >
                Confirmer l'annulation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}