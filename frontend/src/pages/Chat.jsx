import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Search,
  Send,
  Loader2,
  User,
  Clock,
  CheckCircle2,
  CheckCheck,
  XCircle,
  Trash2,
  AlertCircle,
  RefreshCw,
  Inbox,
  Lock,
  Unlock,
  Bot,
  UserCog,
  Power,
  TrendingUp,
} from "lucide-react";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function Chat() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [stats, setStats] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("toutes");
  const [convActive, setConvActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [nouveauMessage, setNouveauMessage] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [modalSupprimer, setModalSupprimer] = useState(null);
  const [chargementMessages, setChargementMessages] = useState(false);
  const messagesEndRef = useRef(null);
  const derniereIdRef = useRef(0);
  const pollingRef = useRef(null);

  // ===== TOKEN =====
  const getToken = () =>
    localStorage.getItem("admin_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    "";

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

  // ===== CHARGEMENT CONVERSATIONS =====
  const chargerConversations = async (silencieux = false) => {
    if (!silencieux) setChargement(true);
    setErreur(null);

    const token = getToken();
    if (!token) {
      setErreur("Aucun token. Redirection...");
      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    try {
      const params = new URLSearchParams();
      if (filtreStatut === "ouvertes") params.append("statut", "ouverte");
      if (filtreStatut === "fermees") params.append("statut", "fermee");
      if (recherche.trim()) params.append("recherche", recherche.trim());

      const res = await fetchAvecToken(
        `${API_URL}/chat/admin/conversations?${params.toString()}`
      );
      if (res.status === 401) {
        navigate("/login");
        return;
      }
      const data = await res.json();

      if (data.success) {
        setConversations(data.conversations || []);

        if (convActive) {
          const nouvelle = data.conversations.find((c) => c.id === convActive.id);
          if (nouvelle) setConvActive(nouvelle);
        }
      }

      const statsRes = await fetchAvecToken(`${API_URL}/chat/admin/stats`);
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.stats);

    } catch (err) {
      console.error("Erreur:", err);
      if (!silencieux) setErreur("Impossible de contacter le serveur");
    } finally {
      if (!silencieux) setChargement(false);
    }
  };

  // ===== CHARGEMENT MESSAGES =====
  const chargerMessages = async (convId, silencieux = false) => {
    if (!silencieux) setChargementMessages(true);

    try {
      const apres = silencieux ? derniereIdRef.current : 0;
      const res = await fetchAvecToken(
        `${API_URL}/chat/admin/conversation?id=${convId}&apres=${apres}`
      );
      const data = await res.json();

      if (data.success) {
        if (silencieux) {
          if (data.messages && data.messages.length > 0) {
            setMessages((prev) => {
              const idsExistants = new Set(prev.map((m) => m.id));
              const nouveaux = data.messages.filter(
                (m) => !idsExistants.has(m.id)
              );
              return [...prev, ...nouveaux];
            });

            const maxId = Math.max(...data.messages.map((m) => m.id));
            derniereIdRef.current = Math.max(derniereIdRef.current, maxId);
          }
        } else {
          setMessages(data.messages || []);
          if (data.messages && data.messages.length > 0) {
            const maxId = Math.max(...data.messages.map((m) => m.id));
            derniereIdRef.current = maxId;
          }
          if (data.conversation) {
            setConvActive(data.conversation);
          }
        }
      }
    } catch (err) {
      if (!silencieux) {
        console.error("Erreur messages:", err);
      }
    } finally {
      if (!silencieux) setChargementMessages(false);
    }
  };

  // ===== OUVRIR UNE CONVERSATION =====
  const ouvrirConversation = async (conv) => {
    setConvActive(conv);
    setMessages([]);
    derniereIdRef.current = 0;
    await chargerMessages(conv.id, false);
    chargerConversations(true);
  };

  // ===== ENVOYER MESSAGE (ADMIN — désactive le bot) =====
  const envoyerMessage = async (e) => {
    e.preventDefault();
    if (!nouveauMessage.trim() || !convActive || envoiEnCours) return;

    const contenu = nouveauMessage.trim();
    setNouveauMessage("");
    setEnvoiEnCours(true);

    try {
      const res = await fetchAvecToken(`${API_URL}/chat/admin/repondre`, {
        method: "POST",
        body: JSON.stringify({
          conversation_id: convActive.id,
          contenu,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
        derniereIdRef.current = Math.max(derniereIdRef.current, data.message.id);

        // Le bot est automatiquement désactivé → mettre à jour la conversation
        setConvActive((prev) => (prev ? { ...prev, bot_actif: 0 } : prev));
        // Rafraîchir la liste pour voir le bot désactivé
        chargerConversations(true);
      } else {
        alert(data.message || "Erreur");
        setNouveauMessage(contenu);
      }
    } catch (err) {
      alert("Erreur serveur");
      setNouveauMessage(contenu);
    } finally {
      setEnvoiEnCours(false);
    }
  };

  // ===== TOGGLE BOT =====
  const toggleBot = async (conv) => {
    const nouveauStatut = intVal(conv.bot_actif) === 1 ? 0 : 1;
    const action = nouveauStatut === 1 ? "réactiver" : "désactiver";

    if (!confirm(`Voulez-vous ${action} le bot pour cette conversation ?`)) return;

    try {
      const res = await fetchAvecToken(`${API_URL}/chat/admin/toggle-bot`, {
        method: "POST",
        body: JSON.stringify({ id: conv.id }),
      });
      const data = await res.json();

      if (data.success) {
        // Mettre à jour le state local
        setConvActive((prev) =>
          prev && prev.id === conv.id
            ? { ...prev, bot_actif: data.bot_actif }
            : prev
        );
        chargerConversations(true);
      } else {
        alert(data.message || "Erreur");
      }
    } catch (err) {
      alert("Erreur serveur");
    }
  };

  // ===== FERMER / ROUVRIR =====
  const toggleStatut = async (conv) => {
    const action = conv.statut === "ouverte" ? "fermer" : "rouvrir";
    if (!confirm(`Voulez-vous ${action} cette conversation ?`)) return;

    try {
      const res = await fetchAvecToken(`${API_URL}/chat/admin/${action}`, {
        method: "POST",
        body: JSON.stringify({ id: conv.id }),
      });
      const data = await res.json();

      if (data.success) {
        chargerConversations(true);
        if (convActive && convActive.id === conv.id) {
          setConvActive({
            ...convActive,
            statut: action === "fermer" ? "fermee" : "ouverte",
          });
        }
      }
    } catch (err) {
      alert("Erreur");
    }
  };

  // ===== SUPPRIMER =====
  const supprimer = async () => {
    if (!modalSupprimer) return;

    try {
      const res = await fetchAvecToken(`${API_URL}/chat/admin/supprimer`, {
        method: "POST",
        body: JSON.stringify({ id: modalSupprimer.id }),
      });
      const data = await res.json();

      if (data.success) {
        if (convActive && convActive.id === modalSupprimer.id) {
          setConvActive(null);
          setMessages([]);
        }
        setModalSupprimer(null);
        chargerConversations();
      }
    } catch (err) {
      alert("Erreur");
    }
  };

  // ===== EFFECTS =====
  useEffect(() => {
    chargerConversations();
  }, [filtreStatut]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (recherche.length === 0 || recherche.length >= 2) {
        chargerConversations();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [recherche]);

  useEffect(() => {
    const interval = setInterval(() => {
      chargerConversations(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [filtreStatut, recherche]);

  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    if (convActive) {
      pollingRef.current = setInterval(() => {
        chargerMessages(convActive.id, true);
      }, 3000);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [convActive?.id]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ===== HELPERS =====
  const intVal = (v) => parseInt(v) || 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (now - d) / 1000;

    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`;

    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const formatHeure = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ===== RENDER =====
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* HEADER */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
              <MessageCircle size={24} className="text-white" />
            </div>
            Chat en direct
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Bot 🤖 + Réponses manuelles 👨‍💼
          </p>
        </div>

        <button
          onClick={() => chargerConversations()}
          disabled={chargement}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition disabled:opacity-50"
        >
          <RefreshCw size={16} className={chargement ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {/* STATS */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4 flex-shrink-0">
          <div className="bg-[#112240] rounded-lg p-3 border border-white/5">
            <div className="text-xs text-gray-400 mb-1">Conversations</div>
            <div className="text-xl font-bold">{stats.total_conversations}</div>
          </div>
          <div className="bg-[#112240] rounded-lg p-3 border border-green-500/20">
            <div className="text-xs text-green-400 mb-1">Ouvertes</div>
            <div className="text-xl font-bold text-green-400">
              {stats.ouvertes}
            </div>
          </div>
          <div className="bg-[#112240] rounded-lg p-3 border border-gray-500/20">
            <div className="text-xs text-gray-400 mb-1">Fermées</div>
            <div className="text-xl font-bold text-gray-400">
              {stats.fermees}
            </div>
          </div>
          <div className="bg-[#112240] rounded-lg p-3 border border-orange-500/20">
            <div className="text-xs text-orange-400 mb-1">Non lus</div>
            <div className="text-xl font-bold text-orange-400">
              {stats.non_lus}
            </div>
          </div>
          <div className="bg-[#112240] rounded-lg p-3 border border-purple-500/20">
            <div className="text-xs text-purple-400 mb-1 flex items-center gap-1">
              <Bot size={12} /> Bot
            </div>
            <div className="text-xl font-bold text-purple-400">
              {stats.messages_bot || 0}
            </div>
          </div>
          <div className="bg-[#112240] rounded-lg p-3 border border-cyan-500/20">
            <div className="text-xs text-cyan-400 mb-1 flex items-center gap-1">
              <UserCog size={12} /> Admin
            </div>
            <div className="text-xl font-bold text-cyan-400">
              {stats.conversations_avec_admin || 0}
            </div>
          </div>
        </div>
      )}

      {/* ERREUR */}
      {erreur && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 flex items-center gap-2 flex-shrink-0">
          <AlertCircle size={18} />
          <p className="text-sm">{erreur}</p>
        </div>
      )}

      {/* LAYOUT PRINCIPAL */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* ===== LISTE CONVERSATIONS ===== */}
        <div className="lg:col-span-1 bg-[#112240] rounded-xl border border-white/5 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-white/5 space-y-2 flex-shrink-0">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher..."
                className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2 pl-8 pr-3 text-sm text-white focus:border-orange-500 focus:outline-none transition"
              />
            </div>
            <div className="flex gap-1">
              {[
                { val: "toutes", label: "Toutes" },
                { val: "ouvertes", label: "Ouvertes" },
                { val: "fermees", label: "Fermées" },
              ].map((f) => (
                <button
                  key={f.val}
                  onClick={() => setFiltreStatut(f.val)}
                  className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition ${
                    filtreStatut === f.val
                      ? "bg-orange-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {chargement && conversations.length === 0 ? (
              <div className="p-8 text-center">
                <Loader2
                  size={24}
                  className="animate-spin text-orange-500 mx-auto"
                />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center">
                <Inbox size={32} className="text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Aucune conversation</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const estActif = convActive?.id === conv.id;
                const nonLus = parseInt(conv.messages_non_lus_admin) || 0;
                const botActif = intVal(conv.bot_actif) === 1;

                return (
                  <button
                    key={conv.id}
                    onClick={() => ouvrirConversation(conv)}
                    className={`w-full text-left p-3 border-b border-white/5 hover:bg-white/5 transition ${
                      estActif
                        ? "bg-orange-500/10 border-l-2 border-l-orange-500"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#1E40AF] flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                        {(conv.client_nom || "V")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="font-medium text-sm truncate">
                            {conv.client_nom || "Visiteur"}
                          </p>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatDate(
                              conv.dernier_message_date || conv.created_at
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 truncate">
                          {conv.dernier_message || "Pas de message"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {conv.statut === "fermee" && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Lock size={10} /> Fermée
                            </span>
                          )}
                          {botActif ? (
                            <span className="text-xs text-purple-400 flex items-center gap-1">
                              <Bot size={10} /> Bot
                            </span>
                          ) : (
                            <span className="text-xs text-cyan-400 flex items-center gap-1">
                              <UserCog size={10} /> Admin
                            </span>
                          )}
                          {nonLus > 0 && (
                            <span className="text-xs bg-red-500 text-white px-1.5 rounded-full font-bold">
                              {nonLus}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ===== CHAT ACTIF ===== */}
        <div className="lg:col-span-2 bg-[#112240] rounded-xl border border-white/5 flex flex-col overflow-hidden">
          {!convActive ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <MessageCircle size={64} className="text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Sélectionnez une conversation
              </h3>
              <p className="text-sm text-gray-400">
                Cliquez sur une conversation à gauche pour commencer
              </p>
            </div>
          ) : (
            <>
              {/* Header conversation */}
              <div className="p-3 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#1E40AF] flex items-center justify-center flex-shrink-0 text-white font-bold">
                    {(convActive.client_nom || "V")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {convActive.client_nom || "Visiteur"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                      {convActive.client_email && (
                        <span className="truncate">
                          {convActive.client_email}
                        </span>
                      )}
                      {convActive.statut === "ouverte" ? (
                        <span className="text-green-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                          En ligne
                        </span>
                      ) : (
                        <span className="text-gray-500 flex items-center gap-1">
                          <Lock size={10} /> Fermée
                        </span>
                      )}
                      {intVal(convActive.bot_actif) === 1 ? (
                        <span className="text-purple-400 flex items-center gap-1 font-medium">
                          <Bot size={10} /> Bot actif
                        </span>
                      ) : (
                        <span className="text-cyan-400 flex items-center gap-1 font-medium">
                          <UserCog size={10} /> Vous (Admin)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {/* Toggle Bot */}
                  <button
                    onClick={() => toggleBot(convActive)}
                    className={`p-2 rounded-lg transition ${
                      intVal(convActive.bot_actif) === 1
                        ? "bg-purple-500/10 hover:bg-purple-500/20 text-purple-400"
                        : "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400"
                    }`}
                    title={
                      intVal(convActive.bot_actif) === 1
                        ? "Désactiver le bot"
                        : "Réactiver le bot"
                    }
                  >
                    <Power size={16} />
                  </button>
                  {/* Toggle statut */}
                  <button
                    onClick={() => toggleStatut(convActive)}
                    className={`p-2 rounded-lg transition ${
                      convActive.statut === "ouverte"
                        ? "bg-orange-500/10 hover:bg-orange-500/20 text-orange-400"
                        : "bg-green-500/10 hover:bg-green-500/20 text-green-400"
                    }`}
                    title={
                      convActive.statut === "ouverte" ? "Fermer" : "Rouvrir"
                    }
                  >
                    {convActive.statut === "ouverte" ? (
                      <Lock size={16} />
                    ) : (
                      <Unlock size={16} />
                    )}
                  </button>
                  <button
                    onClick={() => setModalSupprimer(convActive)}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0A1628]">
                {chargementMessages && messages.length === 0 ? (
                  <div className="text-center py-8">
                    <Loader2
                      size={24}
                      className="animate-spin text-orange-500 mx-auto"
                    />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-400">
                      Aucun message dans cette conversation
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const estAdmin = msg.expediteur === "admin";
                    const estBot = msg.expediteur === "bot";
                    const estClient = msg.expediteur === "client";

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2 items-start ${
                          estAdmin ? "flex-row-reverse" : ""
                        }`}
                      >
                        {/* Avatar */}
                        {estClient && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#1E40AF] flex items-center justify-center flex-shrink-0">
                            <User size={14} className="text-white" />
                          </div>
                        )}
                        {estBot && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                            <Bot size={14} className="text-white" />
                          </div>
                        )}
                        {estAdmin && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                            <UserCog size={14} className="text-white" />
                          </div>
                        )}

                        <div
                          className={`max-w-[75%] ${
                            estAdmin ? "text-right" : ""
                          }`}
                        >
                          {/* Label expéditeur */}
                          <div
                            className={`text-xs mb-1 flex items-center gap-1 ${
                              estAdmin ? "justify-end" : ""
                            } ${
                              estBot
                                ? "text-purple-400"
                                : estAdmin
                                ? "text-orange-400"
                                : "text-gray-500"
                            }`}
                          >
                            {estBot && <Bot size={10} />}
                            {estAdmin && <UserCog size={10} />}
                            {estBot ? "Bot" : estAdmin ? "Vous" : msg.expediteur}
                          </div>

                          <div
                            className={`px-3 py-2 rounded-2xl inline-block text-left ${
                              estAdmin
                                ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-tr-sm"
                                : estBot
                                ? "bg-purple-500/10 border border-purple-500/30 text-gray-200 rounded-tl-sm"
                                : "bg-[#112240] border border-[#06B6D4]/20 text-gray-200 rounded-tl-sm"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {msg.contenu}
                            </p>
                          </div>
                          <div
                            className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
                              estAdmin ? "justify-end" : ""
                            }`}
                          >
                            <span>{formatHeure(msg.created_at)}</span>
                            {estAdmin && (
                              <CheckCheck
                                size={12}
                                className={
                                  msg.lu ? "text-green-400" : "text-gray-600"
                                }
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={envoyerMessage}
                className="p-3 border-t border-white/5 flex items-center gap-2 flex-shrink-0"
              >
                <input
                  type="text"
                  value={nouveauMessage}
                  onChange={(e) => setNouveauMessage(e.target.value)}
                  placeholder={
                    convActive.statut === "fermee"
                      ? "Conversation fermée (envoyer un message la rouvrira)"
                      : intVal(convActive.bot_actif) === 1
                      ? "⚠️ Le bot répond automatiquement. Écrivez pour prendre le relais..."
                      : "Votre réponse..."
                  }
                  disabled={envoiEnCours}
                  className="flex-1 bg-[#0A1628] border border-white/10 rounded-full py-2.5 px-4 text-sm text-white focus:border-orange-500 focus:outline-none transition"
                  maxLength={1000}
                />
                <button
                  type="submit"
                  disabled={!nouveauMessage.trim() || envoiEnCours}
                  className="p-2.5 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-10 h-10"
                >
                  {envoiEnCours ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

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
                <h2 className="text-lg font-bold">Supprimer la conversation</h2>
                <p className="text-xs text-gray-400">
                  {modalSupprimer.client_nom || "Visiteur"}
                </p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-300">
                Cette action est <strong>irréversible</strong>. Tous les
                messages de cette conversation seront supprimés.
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