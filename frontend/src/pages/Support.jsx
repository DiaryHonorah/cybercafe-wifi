import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LifeBuoy, Search, Filter, Loader2, RefreshCw, AlertCircle,
  CheckCircle2, XCircle, Clock, Eye, Check, X, Send, Trash2,
  MessageSquare, ArrowLeft, Star, User, Users, TrendingUp,
  MessageCircle, ChevronRight,
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
  const [chargementDetail, setChargementDetail] = useState(false);
  const [actionEnCours, setActionEnCours] = useState(false);
  const [modalSupprimer, setModalSupprimer] = useState(null);

  const getToken = () =>
    localStorage.getItem("admin_token") || localStorage.getItem("token") || localStorage.getItem("auth_token");

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

      const res = await fetchAvecToken(`${API_URL}/support/admin/tickets?${params.toString()}`);
      if (res.status === 401) { navigate("/login"); return; }
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
      if (recherche.length === 0 || recherche.length >= 2) chargerTickets();
    }, 500);
    return () => clearTimeout(timer);
  }, [recherche]);

  const ouvrirDetail = async (ticketId) => {
    setChargementDetail(true);
    try {
      const res = await fetchAvecToken(`${API_URL}/support/admin/tickets/${ticketId}`);
      const data = await res.json();
      if (data.success) {
        setTicketDetail(data.ticket);
        // Recharger la liste pour MAJ non_lus
        chargerTickets();
      }
    } catch (err) {
      setErreur("Erreur chargement ticket");
    } finally {
      setChargementDetail(false);
    }
  };

  const envoyerMessage = async () => {
    if (!nouveauMessage.trim() || !ticketDetail) return;
    setActionEnCours(true);
    try {
      const res = await fetchAvecToken(
        `${API_URL}/support/admin/tickets/${ticketDetail.id}/messages`,
        { method: "POST", body: JSON.stringify({ message: nouveauMessage }) }
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
        { method: "POST", body: JSON.stringify({ statut }) }
      );
      const data = await res.json();
      if (data.success) {
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

  const changerPriorite = async (priorite) => {
    if (!ticketDetail) return;
    setActionEnCours(true);
    try {
      const res = await fetchAvecToken(
        `${API_URL}/support/admin/tickets/${ticketDetail.id}/priorite`,
        { method: "POST", body: JSON.stringify({ priorite }) }
      );
      const data = await res.json();
      if (data.success) {
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

  const supprimer = async () => {
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
        if (ticketDetail && ticketDetail.id === modalSupprimer.id) setTicketDetail(null);
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
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const getStatutBadge = (statut) => {
    const badges = {
      ouvert: { label: "Ouvert", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30", icon: Clock },
      en_cours: { label: "En cours", color: "bg-orange-500/10 text-orange-400 border-orange-500/30", icon: Clock },
      resolu: { label: "Résolu", color: "bg-green-500/10 text-green-400 border-green-500/30", icon: CheckCircle2 },
      ferme: { label: "Fermé", color: "bg-gray-500/10 text-gray-400 border-gray-500/30", icon: XCircle },
    };
    return badges[statut] || badges.ouvert;
  };

  const getPrioriteBadge = (priorite) => {
    const badges = {
      basse: { label: "Basse", color: "bg-gray-500/10 text-gray-400 border-gray-500/30" },
      normale: { label: "Normale", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
      haute: { label: "Haute", color: "bg-orange-500/10 text-orange-400 border-orange-500/30" },
      urgente: { label: "Urgente", color: "bg-red-500/10 text-red-400 border-red-500/30" },
    };
    return badges[priorite] || badges.normale;
  };

  const getCategorieIcon = (cat) => {
    const icons = {
      wifi: "📡", impression: "🖨️", reservation: "📅",
      facturation: "💳", vip: "💎", autre: "❓",
    };
    return icons[cat] || "❓";
  };

  const getCategorieLabel = (cat) => {
    const labels = {
      wifi: "Wi-Fi", impression: "Impression", reservation: "Réservation",
      facturation: "Facturation", vip: "VIP", autre: "Autre",
    };
    return labels[cat] || cat;
  };

  // ===== VUE DÉTAIL =====
  if (ticketDetail) {
    const statutBadge = getStatutBadge(ticketDetail.statut);
    const prioriteBadge = getPrioriteBadge(ticketDetail.priorite);

    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <button
          onClick={() => setTicketDetail(null)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition mb-4"
        >
          <ArrowLeft size={16} />
          Retour à la liste
        </button>

        {chargementDetail ? (
          <div className="text-center py-20">
            <Loader2 size={40} className="animate-spin text-cyan-500 mx-auto" />
          </div>
        ) : (
          <>
            {/* En-tête */}
            <div className="bg-[#112240] rounded-xl p-5 border border-white/5 mb-4">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-mono text-sm text-cyan-400 font-bold">
                      {ticketDetail.reference}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statutBadge.color}`}>
                      {statutBadge.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${prioriteBadge.color}`}>
                      {prioriteBadge.label}
                    </span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold">{ticketDetail.sujet}</h1>
                  <p className="text-sm text-gray-400 mt-1">
                    {getCategorieIcon(ticketDetail.categorie)} {getCategorieLabel(ticketDetail.categorie)} · {formatDate(ticketDetail.created_at)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Par <strong>{ticketDetail.client_nom}</strong> ({ticketDetail.client_email})
                  </p>
                </div>
                <button
                  onClick={() => setModalSupprimer(ticketDetail)}
                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Actions rapides */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-white/10">
                <span className="text-xs text-gray-500 self-center mr-2">Statut :</span>
                {["ouvert", "en_cours", "resolu", "ferme"].map((s) => {
                  const b = getStatutBadge(s);
                  return (
                    <button
                      key={s}
                      onClick={() => changerStatut(s)}
                      disabled={actionEnCours || ticketDetail.statut === s}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-40 ${
                        ticketDetail.statut === s
                          ? `${b.color} border`
                          : "bg-white/5 hover:bg-white/10 text-gray-400"
                      }`}
                    >
                      {b.label}
                    </button>
                  );
                })}
                <span className="text-xs text-gray-500 self-center ml-3 mr-2">Priorité :</span>
                {["basse", "normale", "haute", "urgente"].map((p) => {
                  const b = getPrioriteBadge(p);
                  return (
                    <button
                      key={p}
                      onClick={() => changerPriorite(p)}
                      disabled={actionEnCours || ticketDetail.priorite === p}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-40 ${
                        ticketDetail.priorite === p
                          ? `${b.color} border`
                          : "bg-white/5 hover:bg-white/10 text-gray-400"
                      }`}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-3 mb-4">
              {ticketDetail.messages?.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.auteur_type === "admin" ? "flex-row-reverse" : ""}`}
                >
                  <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xs ${
                    msg.auteur_type === "admin"
                      ? "bg-gradient-to-br from-[#F59E0B] to-[#DC2626]"
                      : msg.auteur_type === "client"
                      ? "bg-gradient-to-br from-[#06B6D4] to-[#1E40AF]"
                      : "bg-gray-600"
                  }`}>
                    {msg.auteur_type === "systeme" ? "⚙️" : (msg.auteur_nom || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div className={`max-w-[80%] ${msg.auteur_type === "admin" ? "text-right" : ""}`}>
                    <div className={`rounded-2xl px-4 py-3 ${
                      msg.auteur_type === "admin"
                        ? "bg-gradient-to-br from-[#F59E0B] to-[#DC2626] text-white"
                        : msg.auteur_type === "client"
                        ? "bg-cyan-500/10 border border-cyan-500/30 text-white"
                        : "bg-white/5 text-gray-400 italic text-sm"
                    }`}>
                      <p className="text-xs opacity-70 mb-1">
                        {msg.auteur_type === "admin" ? "Vous (Admin)" : msg.auteur_type === "client" ? msg.auteur_nom : "Système"} · {formatDate(msg.created_at)}
                      </p>
                      <p className="text-sm whitespace-pre-line text-left">{msg.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Formulaire de réponse */}
            {ticketDetail.statut !== "ferme" && (
              <div className="bg-[#112240] rounded-xl p-4 border border-white/5">
                <textarea
                  value={nouveauMessage}
                  onChange={(e) => setNouveauMessage(e.target.value)}
                  rows={3}
                  placeholder="Votre réponse..."
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:border-orange-500 focus:outline-none resize-none"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={envoyerMessage}
                    disabled={actionEnCours || !nouveauMessage.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#F59E0B] to-[#DC2626] hover:opacity-90 text-white text-sm font-medium transition disabled:opacity-50"
                  >
                    {actionEnCours ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Envoyer
                  </button>
                </div>
              </div>
            )}

            {ticketDetail.note_satisfaction && (
              <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <Star size={20} className="text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold text-yellow-400">
                    Satisfaction client : {ticketDetail.note_satisfaction}/5
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal supprimer */}
        {modalSupprimer && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setModalSupprimer(null)}>
            <div className="bg-[#112240] rounded-2xl max-w-md w-full border border-red-500/30"
              onClick={(e) => e.stopPropagation()}>
              <div className="p-5 border-b border-white/10 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <Trash2 size={20} className="text-red-400" />
                </div>
                <h2 className="text-lg font-bold">Supprimer le ticket</h2>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-300">
                  Cette action est irréversible. Tous les messages seront supprimés.
                </p>
              </div>
              <div className="p-5 border-t border-white/10 flex gap-3">
                <button onClick={() => setModalSupprimer(null)} disabled={actionEnCours}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition font-medium disabled:opacity-50">
                  Annuler
                </button>
                <button onClick={supprimer} disabled={actionEnCours}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition disabled:opacity-50">
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===== VUE LISTE =====
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#06B6D4] to-[#1E40AF]">
              <LifeBuoy size={24} className="text-white" />
            </div>
            Support client
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Gérez les demandes d'aide de vos clients
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-[#112240] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <LifeBuoy size={14} /> Total
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-cyan-500/20">
            <div className="flex items-center gap-2 text-xs text-cyan-400 mb-1">
              <Clock size={14} /> Ouverts
            </div>
            <p className="text-2xl font-bold text-cyan-400">{stats.ouverts}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-orange-500/20">
            <div className="flex items-center gap-2 text-xs text-orange-400 mb-1">
              <Clock size={14} /> En cours
            </div>
            <p className="text-2xl font-bold text-orange-400">{stats.en_cours}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-green-500/20">
            <div className="flex items-center gap-2 text-xs text-green-400 mb-1">
              <CheckCircle2 size={14} /> Résolus
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.resolus}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-red-500/20">
            <div className="flex items-center gap-2 text-xs text-red-400 mb-1">
              <MessageCircle size={14} /> Non lus
            </div>
            <p className="text-2xl font-bold text-red-400">{stats.messages_non_lus}</p>
          </div>
        </div>
      )}

      {/* FILTRES */}
      <div className="bg-[#112240] rounded-xl p-4 mb-6 border border-white/5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher par référence, sujet, nom, email..."
              className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <select
            value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value)}
            className="bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:border-cyan-500 focus:outline-none"
          >
            <option value="tous">Tous les statuts</option>
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

      {erreur && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} />
          <p>{erreur}</p>
        </div>
      )}

      {/* LISTE */}
      {chargement && tickets.length === 0 ? (
        <div className="text-center py-20">
          <Loader2 size={40} className="animate-spin text-cyan-500 mx-auto" />
          <p className="text-gray-400 mt-4">Chargement...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-20 bg-[#112240] rounded-2xl border border-white/5">
          <LifeBuoy size={48} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun ticket</h3>
          <p className="text-sm text-gray-400">
            {filtreStatut === "tous" && !recherche
              ? "Aucun ticket pour le moment"
              : "Aucun ticket pour ces filtres"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const statutBadge = getStatutBadge(ticket.statut);
            const prioriteBadge = getPrioriteBadge(ticket.priorite);
            const StatutIcon = statutBadge.icon;
            return (
              <div
                key={ticket.id}
                onClick={() => ouvrirDetail(ticket.id)}
                className={`bg-[#112240] rounded-xl p-4 border cursor-pointer transition ${
                  ticket.non_lus > 0
                    ? "border-cyan-500/50 hover:border-cyan-500"
                    : "border-white/5 hover:border-cyan-500/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    ticket.priorite === "urgente"
                      ? "bg-red-500/20 text-red-400"
                      : ticket.priorite === "haute"
                      ? "bg-orange-500/20 text-orange-400"
                      : "bg-cyan-500/10 text-cyan-400"
                  }`}>
                    <span className="text-xl">{getCategorieIcon(ticket.categorie)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-xs text-cyan-400 font-bold">
                            {ticket.reference}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statutBadge.color}`}>
                            <StatutIcon size={10} />
                            {statutBadge.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${prioriteBadge.color}`}>
                            {prioriteBadge.label}
                          </span>
                          {ticket.non_lus > 0 && (
                            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                              {ticket.non_lus} non lu{ticket.non_lus > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-sm">{ticket.sujet}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          <User size={10} className="inline" /> {ticket.client_nom} · {getCategorieLabel(ticket.categorie)} · {ticket.nb_messages} message{ticket.nb_messages > 1 ? "s" : ""} · {formatDate(ticket.dernier_message_le)}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-gray-500 flex-shrink-0 mt-1" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}