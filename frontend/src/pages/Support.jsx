import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LifeBuoy, Search, Filter, Loader2, RefreshCw, AlertCircle,
  CheckCircle2, XCircle, Clock, MessageSquare, ChevronRight,
  Send, User, Shield, Trash2, Star, AlertTriangle, Inbox,
  Tag, ArrowLeft, Flag,
} from "lucide-react";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function Support() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [filtrePriorite, setFiltrePriorite] = useState("toutes");
  const [recherche, setRecherche] = useState("");
  const [ticketDetail, setTicketDetail] = useState(null);
  const [nouveauMessage, setNouveauMessage] = useState("");
  const [modalSupprimer, setModalSupprimer] = useState(null);
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

  const chargerTickets = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const params = new URLSearchParams();
      if (filtreStatut !== "tous") params.append("statut", filtreStatut);
      if (filtrePriorite !== "toutes") params.append("priorite", filtrePriorite);
      if (recherche.trim()) params.append("recherche", recherche.trim());

      const res = await fetchAvecToken(
        `${API_URL}/support/admin/tickets?${params.toString()}`
      );
      if (res.status === 401) {
        navigate("/login");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
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
    chargerTickets();
  }, [filtreStatut, filtrePriorite]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (recherche.length === 0 || recherche.length >= 2) {
        chargerTickets();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [recherche]);

  const ouvrirDetail = async (id) => {
    setChargement(true);
    try {
      const res = await fetchAvecToken(`${API_URL}/support/admin/tickets/${id}`);
      const data = await res.json();
      if (data.success) setTicketDetail(data.ticket);
    } catch (err) {
      setErreur("Impossible de charger le ticket");
    } finally {
      setChargement(false);
    }
  };

  const envoyerMessage = async () => {
    if (!ticketDetail || !nouveauMessage.trim()) return;
    setActionEnCours(true);
    try {
      const res = await fetchAvecToken(
        `${API_URL}/support/admin/tickets/${ticketDetail.id}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ message: nouveauMessage }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setNouveauMessage("");
        ouvrirDetail(ticketDetail.id);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Erreur serveur");
    } finally {
      setActionEnCours(false);
    }
  };

  const changerStatut = async (statut) => {
    if (!ticketDetail) return;
    setActionEnCours(true);
    try {
      const res = await fetchAvecToken(
        `${API_URL}/support/admin/tickets/${ticketDetail.id}/statut`,
        {
          method: "POST",
          body: JSON.stringify({ statut }),
        }
      );
      const data = await res.json();
      if (data.success) {
        ouvrirDetail(ticketDetail.id);
        chargerTickets();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Erreur serveur");
    } finally {
      setActionEnCours(false);
    }
  };

  const changerPriorite = async (priorite) => {
    if (!ticketDetail) return;
    setActionEnCours(true);
    try {
      const res = await fetchAvecToken(
        `${API_URL}/support/admin/tickets/${ticketDetail.id}/priorite`,
        {
          method: "POST",
          body: JSON.stringify({ priorite }),
        }
      );
      const data = await res.json();
      if (data.success) {
        ouvrirDetail(ticketDetail.id);
        chargerTickets();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Erreur serveur");
    } finally {
      setActionEnCours(false);
    }
  };

  const supprimerTicket = async () => {
    if (!modalSupprimer) return;
    setActionEnCours(true);
    try {
      const res = await fetchAvecToken(
        `${API_URL}/support/admin/tickets/${modalSupprimer.id}/supprimer`,
        { method: "POST" }
      );
      const data = await res.json();
      if (data.success) {
        setModalSupprimer(null);
        setTicketDetail(null);
        chargerTickets();
      } else {
        alert(data.message);
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

  const getStatutColor = (statut) => {
    const colors = {
      ouvert: "bg-orange-500/10 text-orange-400 border-orange-500/30",
      en_cours: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      resolu: "bg-green-500/10 text-green-400 border-green-500/30",
      ferme: "bg-gray-500/10 text-gray-400 border-gray-500/30",
    };
    return colors[statut] || colors.ouvert;
  };

  const getStatutLabel = (statut) => {
    const labels = { ouvert: "Ouvert", en_cours: "En cours", resolu: "Résolu", ferme: "Fermé" };
    return labels[statut] || statut;
  };

  const getPrioriteColor = (priorite) => {
    const colors = {
      basse: "bg-gray-500/10 text-gray-400 border-gray-500/30",
      normale: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
      haute: "bg-orange-500/10 text-orange-400 border-orange-500/30",
      urgente: "bg-red-500/10 text-red-400 border-red-500/30",
    };
    return colors[priorite] || colors.normale;
  };

  const getPrioriteLabel = (priorite) => {
    const labels = { basse: "Basse", normale: "Normale", haute: "Haute", urgente: "Urgente" };
    return labels[priorite] || priorite;
  };

  const getCategorieLabel = (cat) => {
    const labels = {
      wifi: "Wi-Fi", impression: "Impression", reservation: "Réservation",
      facturation: "Facturation", vip: "VIP", autre: "Autre",
    };
    return labels[cat] || cat;
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
              <LifeBuoy size={24} className="text-white" />
            </div>
            Support client
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Gérez les demandes d'assistance de vos clients
          </p>
        </div>
        <button
          onClick={chargerTickets}
          disabled={chargement}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition disabled:opacity-50"
        >
          <RefreshCw size={16} className={chargement ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {/* STATS */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <div className="bg-[#112240] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <Inbox size={14} /> Total
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-orange-500/20">
            <div className="flex items-center gap-2 text-xs text-orange-400 mb-1">
              <Clock size={14} /> Ouverts
            </div>
            <p className="text-2xl font-bold text-orange-400">{stats.ouverts}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-blue-500/20">
            <div className="flex items-center gap-2 text-xs text-blue-400 mb-1">
              <MessageSquare size={14} /> En cours
            </div>
            <p className="text-2xl font-bold text-blue-400">{stats.en_cours}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-green-500/20">
            <div className="flex items-center gap-2 text-xs text-green-400 mb-1">
              <CheckCircle2 size={14} /> Résolus
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.resolus}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-red-500/20">
            <div className="flex items-center gap-2 text-xs text-red-400 mb-1">
              <AlertTriangle size={14} /> Messages non lus
            </div>
            <p className="text-2xl font-bold text-red-400">{stats.messages_non_lus}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-yellow-500/20">
            <div className="flex items-center gap-2 text-xs text-yellow-400 mb-1">
              <Star size={14} /> Satisfaction
            </div>
            <p className="text-2xl font-bold text-yellow-400">{stats.note_moyenne}</p>
          </div>
        </div>
      )}

      {erreur && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} />
          <p>{erreur}</p>
        </div>
      )}

      {/* MODE DÉTAIL */}
      {ticketDetail ? (
        <div className="bg-[#112240] rounded-xl border border-white/5 overflow-hidden">
          {/* Header détail */}
          <div className="p-4 border-b border-white/10 flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <button
                  onClick={() => { setTicketDetail(null); setNouveauMessage(""); chargerTickets(); }}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition mr-1"
                >
                  <ArrowLeft size={16} />
                </button>
                <span className="font-mono text-cyan-400 font-bold">{ticketDetail.reference}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatutColor(ticketDetail.statut)}`}>
                  {getStatutLabel(ticketDetail.statut)}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPrioriteColor(ticketDetail.priorite)}`}>
                  <Flag size={10} className="inline mr-1" />
                  {getPrioriteLabel(ticketDetail.priorite)}
                </span>
              </div>
              <h2 className="text-xl font-bold">{ticketDetail.sujet}</h2>
              <p className="text-sm text-gray-400 mt-1">
                <User size={12} className="inline mr-1" />
                {ticketDetail.client_nom} · {ticketDetail.client_email} · {ticketDetail.client_telephone}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                <Tag size={10} className="inline mr-1" />
                {getCategorieLabel(ticketDetail.categorie)} · Créé le {formatDate(ticketDetail.created_at)}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {ticketDetail.statut !== "en_cours" && ticketDetail.statut !== "ferme" && (
                <button
                  onClick={() => changerStatut("en_cours")}
                  disabled={actionEnCours}
                  className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-medium transition disabled:opacity-50"
                >
                  Prendre en charge
                </button>
              )}
              {ticketDetail.statut !== "resolu" && ticketDetail.statut !== "ferme" && (
                <button
                  onClick={() => changerStatut("resolu")}
                  disabled={actionEnCours}
                  className="px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-medium transition disabled:opacity-50"
                >
                  <CheckCircle2 size={12} className="inline mr-1" />
                  Résoudre
                </button>
              )}
              {ticketDetail.statut !== "ferme" && (
                <button
                  onClick={() => changerStatut("ferme")}
                  disabled={actionEnCours}
                  className="px-3 py-1.5 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 text-xs font-medium transition disabled:opacity-50"
                >
                  Fermer
                </button>
              )}
              <button
                onClick={() => setModalSupprimer(ticketDetail)}
                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                title="Supprimer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Priorité rapide */}
          <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">Priorité :</span>
            {["basse", "normale", "haute", "urgente"].map((p) => (
              <button
                key={p}
                onClick={() => changerPriorite(p)}
                disabled={actionEnCours || ticketDetail.priorite === p}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  ticketDetail.priorite === p
                    ? getPrioriteColor(p) + " border cursor-default"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                {getPrioriteLabel(p)}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="p-4 max-h-[500px] overflow-y-auto">
            <div className="space-y-4">
              {ticketDetail.messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.auteur_type === "admin" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                    msg.auteur_type === "admin" ? "bg-purple-500 text-white"
                    : msg.auteur_type === "client" ? "bg-cyan-500 text-white"
                    : "bg-gray-500 text-white"
                  }`}>
                    {msg.auteur_type === "admin" ? <Shield size={16} />
                     : msg.auteur_type === "client" ? <User size={16} />
                     : "⚠"}
                  </div>
                  <div className={`flex-1 max-w-[80%] ${msg.auteur_type === "admin" ? "text-right" : ""}`}>
                    <div className={`inline-block p-3 rounded-lg ${
                      msg.auteur_type === "admin"
                        ? "bg-purple-500/10 border border-purple-500/30 text-left"
                        : msg.auteur_type === "client"
                        ? "bg-cyan-500/10 border border-cyan-500/30"
                        : "bg-gray-500/10 border border-gray-500/30"
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {msg.auteur_type === "admin" ? "Vous (Admin)" : msg.auteur_nom} · {formatDate(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formulaire réponse */}
          {ticketDetail.statut !== "ferme" && (
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <textarea
                  value={nouveauMessage}
                  onChange={(e) => setNouveauMessage(e.target.value)}
                  rows={2}
                  placeholder="Écrire une réponse au client..."
                  className="flex-1 bg-[#0A1628] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-cyan-500 focus:outline-none resize-none"
                />
                <button
                  onClick={envoyerMessage}
                  disabled={actionEnCours || !nouveauMessage.trim()}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-white font-medium transition disabled:opacity-50 flex items-center gap-2"
                >
                  {actionEnCours ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Envoyer
                </button>
              </div>
            </div>
          )}

          {/* Note satisfaction */}
          {ticketDetail.note_satisfaction && (
            <div className="p-4 border-t border-white/10 bg-green-500/5">
              <div className="flex items-center gap-2 text-sm">
                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                <span className="text-gray-400">Satisfaction client :</span>
                <span className="font-bold text-yellow-400">{ticketDetail.note_satisfaction}/5</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* FILTRES */}
          <div className="bg-[#112240] rounded-xl p-4 mb-6 border border-white/5">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  placeholder="Rechercher par référence, sujet ou client..."
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <select
                value={filtreStatut}
                onChange={(e) => setFiltreStatut(e.target.value)}
                className="bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:border-cyan-500 focus:outline-none"
              >
                <option value="tous">Tous statuts</option>
                <option value="ouvert">Ouverts</option>
                <option value="en_cours">En cours</option>
                <option value="resolu">Résolus</option>
                <option value="ferme">Fermés</option>
              </select>
              <select
                value={filtrePriorite}
                onChange={(e) => setFiltrePriorite(e.target.value)}
                className="bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:border-cyan-500 focus:outline-none"
              >
                <option value="toutes">Toutes priorités</option>
                <option value="urgente">Urgentes</option>
                <option value="haute">Hautes</option>
                <option value="normale">Normales</option>
                <option value="basse">Basses</option>
              </select>
            </div>
          </div>

          {/* LISTE */}
          {chargement && tickets.length === 0 ? (
            <div className="text-center py-20">
              <Loader2 size={40} className="animate-spin text-cyan-500 mx-auto" />
              <p className="text-gray-400 mt-4">Chargement...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-20 bg-[#112240] rounded-2xl border border-white/5">
              <Inbox size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun ticket</h3>
              <p className="text-sm text-gray-400">
                {filtreStatut === "tous" ? "Aucun ticket de support pour le moment" : "Aucun ticket avec ces filtres"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => ouvrirDetail(t.id)}
                  className="bg-[#112240] rounded-xl p-4 border border-white/5 hover:border-cyan-500/30 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-cyan-400 text-sm font-bold">{t.reference}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatutColor(t.statut)}`}>
                          {getStatutLabel(t.statut)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPrioriteColor(t.priorite)}`}>
                          {getPrioriteLabel(t.priorite)}
                        </span>
                        {t.non_lus > 0 && (
                          <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                            {t.non_lus} non lu(s)
                          </span>
                        )}
                      </div>
                      <p className="font-semibold">{t.sujet}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        <User size={10} className="inline mr-1" />
                        {t.client_nom} · {t.client_email}
                      </p>
                      <p className="text-xs text-gray-500">
                        <Tag size={10} className="inline mr-1" />
                        {getCategorieLabel(t.categorie)} · {t.nb_messages} message(s) · Dernier : {formatDate(t.dernier_message_le)}
                      </p>
                    </div>
                    <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* MODAL SUPPRESSION */}
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
                <h2 className="text-lg font-bold">Supprimer le ticket</h2>
                <p className="text-xs text-gray-400">{modalSupprimer.reference}</p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-300">
                Cette action supprimera définitivement le ticket et tous ses messages. Irréversible.
              </p>
            </div>
            <div className="p-5 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setModalSupprimer(null)}
                disabled={actionEnCours}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={supprimerTicket}
                disabled={actionEnCours}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionEnCours ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}