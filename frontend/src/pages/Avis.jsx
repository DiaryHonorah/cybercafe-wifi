import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Star,
  MessageSquare,
  Search,
  Filter,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Check,
  X,
  Send,
  Trash2,
  MessageCircle,
} from "lucide-react";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function Avis() {
  const navigate = useNavigate();
  const [avis, setAvis] = useState([]);
  const [stats, setStats] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [filtreStatut, setFiltreStatut] = useState("en_attente");
  const [filtreNote, setFiltreNote] = useState("toutes");
  const [recherche, setRecherche] = useState("");
  const [modalValider, setModalValider] = useState(null);
  const [modalRejeter, setModalRejeter] = useState(null);
  const [modalRepondre, setModalRepondre] = useState(null);
  const [modalSupprimer, setModalSupprimer] = useState(null);
  const [reponseAdmin, setReponseAdmin] = useState("");
  const [raisonRejet, setRaisonRejet] = useState("");
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

  const chargerAvis = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const params = new URLSearchParams();
      if (filtreStatut !== "tous") params.append("statut", filtreStatut);
      if (filtreNote !== "toutes") params.append("note", filtreNote);
      if (recherche.trim()) params.append("recherche", recherche.trim());

      const res = await fetchAvecToken(
        `${API_URL}/avis/admin/liste?${params.toString()}`
      );
      if (res.status === 401) {
        navigate("/login");
        return;
      }
      const data = await res.json();

      if (data.success) {
        setAvis(data.avis || []);
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

  useEffect(() => {
    chargerAvis();
  }, [filtreStatut, filtreNote]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (recherche.length === 0 || recherche.length >= 2) {
        chargerAvis();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [recherche]);

  const valider = async () => {
    if (!modalValider) return;
    setActionEnCours(true);
    try {
      const res = await fetchAvecToken(`${API_URL}/avis/admin/valider`, {
        method: "POST",
        body: JSON.stringify({
          id: modalValider.id,
          reponse: reponseAdmin.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModalValider(null);
        setReponseAdmin("");
        chargerAvis();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Erreur serveur");
    } finally {
      setActionEnCours(false);
    }
  };

  const rejeter = async () => {
    if (!modalRejeter) return;
    setActionEnCours(true);
    try {
      const res = await fetchAvecToken(`${API_URL}/avis/admin/rejeter`, {
        method: "POST",
        body: JSON.stringify({
          id: modalRejeter.id,
          raison: raisonRejet.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModalRejeter(null);
        setRaisonRejet("");
        chargerAvis();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Erreur serveur");
    } finally {
      setActionEnCours(false);
    }
  };

  const repondre = async () => {
    if (!modalRepondre || !reponseAdmin.trim()) return;
    setActionEnCours(true);
    try {
      const res = await fetchAvecToken(`${API_URL}/avis/admin/repondre`, {
        method: "POST",
        body: JSON.stringify({
          id: modalRepondre.id,
          reponse: reponseAdmin.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModalRepondre(null);
        setReponseAdmin("");
        chargerAvis();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Erreur serveur");
    } finally {
      setActionEnCours(false);
    }
  };

  const supprimer = async () => {
    if (!modalSupprimer) return;
    setActionEnCours(true);
    try {
      const res = await fetchAvecToken(`${API_URL}/avis/admin/supprimer`, {
        method: "POST",
        body: JSON.stringify({ id: modalSupprimer.id }),
      });
      const data = await res.json();
      if (data.success) {
        setModalSupprimer(null);
        chargerAvis();
      }
    } catch (err) {
      alert("Erreur serveur");
    } finally {
      setActionEnCours(false);
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

  const renderEtoiles = (note, size = 14) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={
            i <= note ? "text-yellow-400 fill-yellow-400" : "text-gray-600"
          }
        />
      ))}
    </div>
  );

  const getStatutBadge = (statut) => {
    const badges = {
      en_attente: {
        label: "En attente",
        color: "bg-orange-500/10 text-orange-400 border-orange-500/30",
        icon: Clock,
      },
      valide: {
        label: "Validé",
        color: "bg-green-500/10 text-green-400 border-green-500/30",
        icon: CheckCircle2,
      },
      rejete: {
        label: "Rejeté",
        color: "bg-red-500/10 text-red-400 border-red-500/30",
        icon: XCircle,
      },
    };
    return badges[statut] || badges.en_attente;
  };

  const getServiceLabel = (service) => {
    const labels = {
      reservation: "Réservation",
      wifi: "Wi-Fi",
      impression: "Impression",
      accueil: "Accueil",
      autre: "Autre",
    };
    return labels[service] || service;
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600">
              <Star size={24} className="text-white" />
            </div>
            Avis clients
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Gérez les avis de vos clients
          </p>
        </div>

        <button
          onClick={chargerAvis}
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
              <MessageSquare size={14} /> Total
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-orange-500/20">
            <div className="flex items-center gap-2 text-xs text-orange-400 mb-1">
              <Clock size={14} /> En attente
            </div>
            <p className="text-2xl font-bold text-orange-400">
              {stats.en_attente}
            </p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-green-500/20">
            <div className="flex items-center gap-2 text-xs text-green-400 mb-1">
              <CheckCircle2 size={14} /> Validés
            </div>
            <p className="text-2xl font-bold text-green-400">
              {stats.valides}
            </p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-red-500/20">
            <div className="flex items-center gap-2 text-xs text-red-400 mb-1">
              <XCircle size={14} /> Rejetés
            </div>
            <p className="text-2xl font-bold text-red-400">{stats.rejetes}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-yellow-500/20">
            <div className="flex items-center gap-2 text-xs text-yellow-400 mb-1">
              <Star size={14} /> Moyenne
            </div>
            <p className="text-2xl font-bold text-yellow-400">
              {stats.moyenne}
            </p>
          </div>
        </div>
      )}

      {/* FILTRES */}
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
              placeholder="Rechercher dans les avis..."
              className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:border-yellow-500 focus:outline-none"
            />
          </div>
          <select
            value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value)}
            className="bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:border-yellow-500 focus:outline-none"
          >
            <option value="en_attente">En attente</option>
            <option value="valide">Validés</option>
            <option value="rejete">Rejetés</option>
            <option value="tous">Tous</option>
          </select>
          <select
            value={filtreNote}
            onChange={(e) => setFiltreNote(e.target.value)}
            className="bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:border-yellow-500 focus:outline-none"
          >
            <option value="toutes">Toutes notes</option>
            <option value="5">5 étoiles</option>
            <option value="4">4 étoiles</option>
            <option value="3">3 étoiles</option>
            <option value="2">2 étoiles</option>
            <option value="1">1 étoile</option>
          </select>
        </div>
      </div>

      {erreur && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} />
          <p>{erreur}</p>
        </div>
      )}

      {/* LISTE */}
      {chargement && avis.length === 0 ? (
        <div className="text-center py-20">
          <Loader2 size={40} className="animate-spin text-yellow-500 mx-auto" />
          <p className="text-gray-400 mt-4">Chargement...</p>
        </div>
      ) : avis.length === 0 ? (
        <div className="text-center py-20 bg-[#112240] rounded-2xl border border-white/5">
          <Star size={48} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun avis</h3>
          <p className="text-sm text-gray-400">
            {filtreStatut === "en_attente"
              ? "Aucun avis en attente de modération"
              : "Aucun avis pour ces filtres"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {avis.map((a) => {
            const badge = getStatutBadge(a.statut);
            const BadgeIcon = badge.icon;
            return (
              <div
                key={a.id}
                className="bg-[#112240] rounded-xl p-4 border border-white/5 hover:border-yellow-500/30 transition"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <p className="font-semibold">{a.nom_affiche}</p>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${badge.color}`}
                      >
                        <BadgeIcon size={10} />
                        {badge.label}
                      </span>
                      {a.verifie == 1 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-400 border border-green-500/30">
                          <CheckCircle2 size={10} />
                          Vérifié
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      {renderEtoiles(a.note, 14)}
                      <span className="text-xs text-gray-500">
                        {formatDate(a.created_at)} · {getServiceLabel(a.service_note)}
                      </span>
                    </div>

                    {a.titre && (
                      <h4 className="font-semibold text-sm mb-1">{a.titre}</h4>
                    )}
                    <p className="text-sm text-gray-300 mb-2">{a.commentaire}</p>

                    {a.reponse_admin && (
                      <div className="bg-cyan-500/5 border-l-2 border-cyan-500 rounded-r-lg p-2 mt-2">
                        <p className="text-xs text-cyan-400 font-semibold mb-0.5">
                          Votre réponse :
                        </p>
                        <p className="text-xs text-gray-400">
                          {a.reponse_admin}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {a.statut === "en_attente" && (
                      <>
                        <button
                          onClick={() => {
                            setModalValider(a);
                            setReponseAdmin("");
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-medium transition"
                          title="Valider"
                        >
                          <Check size={12} />
                          Valider
                        </button>
                        <button
                          onClick={() => {
                            setModalRejeter(a);
                            setRaisonRejet("");
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition"
                          title="Rejeter"
                        >
                          <X size={12} />
                          Rejeter
                        </button>
                      </>
                    )}
                    {a.statut === "valide" && (
                      <button
                        onClick={() => {
                          setModalRepondre(a);
                          setReponseAdmin(a.reponse_admin || "");
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-medium transition"
                        title="Répondre"
                      >
                        <MessageCircle size={12} />
                        {a.reponse_admin ? "Modifier" : "Répondre"}
                      </button>
                    )}
                    <button
                      onClick={() => setModalSupprimer(a)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-medium transition"
                      title="Supprimer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL VALIDER */}
      {modalValider && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !actionEnCours && setModalValider(null)}
        >
          <div
            className="bg-[#112240] rounded-2xl max-w-md w-full border border-green-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle2 size={20} className="text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Valider l'avis</h2>
                <p className="text-xs text-gray-400">{modalValider.nom_affiche}</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-[#0A1628] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  {renderEtoiles(modalValider.note, 14)}
                </div>
                <p className="text-sm text-gray-300">{modalValider.commentaire}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Réponse (optionnel)
                </label>
                <textarea
                  value={reponseAdmin}
                  onChange={(e) => setReponseAdmin(e.target.value)}
                  rows={3}
                  placeholder="Ex: Merci pour votre retour !"
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-green-500 focus:outline-none resize-none"
                />
              </div>
            </div>
            <div className="p-5 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setModalValider(null)}
                disabled={actionEnCours}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={valider}
                disabled={actionEnCours}
                className="flex-1 px-4 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionEnCours ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                Valider & Publier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REJETER */}
      {modalRejeter && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !actionEnCours && setModalRejeter(null)}
        >
          <div
            className="bg-[#112240] rounded-2xl max-w-md w-full border border-red-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <XCircle size={20} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Rejeter l'avis</h2>
                <p className="text-xs text-gray-400">{modalRejeter.nom_affiche}</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Raison (visible par le client)
                </label>
                <textarea
                  value={raisonRejet}
                  onChange={(e) => setRaisonRejet(e.target.value)}
                  rows={3}
                  placeholder="Ex: Contenu inapproprié, spam..."
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-red-500 focus:outline-none resize-none"
                />
              </div>
            </div>
            <div className="p-5 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setModalRejeter(null)}
                disabled={actionEnCours}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={rejeter}
                disabled={actionEnCours}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionEnCours ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <X size={16} />
                )}
                Rejeter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RÉPONDRE */}
      {modalRepondre && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !actionEnCours && setModalRepondre(null)}
        >
          <div
            className="bg-[#112240] rounded-2xl max-w-md w-full border border-cyan-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <MessageCircle size={20} className="text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Répondre à l'avis</h2>
                <p className="text-xs text-gray-400">{modalRepondre.nom_affiche}</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-[#0A1628] rounded-lg p-3">
                <p className="text-sm text-gray-300">{modalRepondre.commentaire}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Votre réponse
                </label>
                <textarea
                  value={reponseAdmin}
                  onChange={(e) => setReponseAdmin(e.target.value)}
                  rows={3}
                  placeholder="Merci pour votre retour..."
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-cyan-500 focus:outline-none resize-none"
                />
              </div>
            </div>
            <div className="p-5 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setModalRepondre(null)}
                disabled={actionEnCours}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={repondre}
                disabled={actionEnCours || !reponseAdmin.trim()}
                className="flex-1 px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionEnCours ? (
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
              <h2 className="text-lg font-bold">Supprimer l'avis</h2>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-300">
                Cette action est irréversible.
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
                onClick={supprimer}
                disabled={actionEnCours}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition disabled:opacity-50"
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