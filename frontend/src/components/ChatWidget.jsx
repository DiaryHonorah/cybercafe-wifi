import { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  User,
  CheckCheck,
  Bot,
  UserCog,
  RotateCcw,
  History,
} from "lucide-react";
import { usePublicLang } from "../context/PublicLangContext";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

function getClientToken() {
  let token = localStorage.getItem("chat_client_token");
  if (!token) {
    token =
      "client_" +
      Math.random().toString(36).substring(2) +
      Date.now().toString(36);
    localStorage.setItem("chat_client_token", token);
  }
  return token;
}

export default function ChatWidget() {
  const { langue } = usePublicLang();
  const [ouvert, setOuvert] = useState(false);
  const [messages, setMessages] = useState([]);
  const [nouveauMessage, setNouveauMessage] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [initialise, setInitialise] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [nbNonLus, setNbNonLus] = useState(0);
  const [conversation, setConversation] = useState(null);
  const [chargementHistorique, setChargementHistorique] = useState(false);
  const messagesEndRef = useRef(null);
  const derniereIdRef = useRef(0);
  const pollingRef = useRef(null);

  const textes = {
    fr: {
      titre: "Chat avec nous",
      sousTitre: "Bot 🤖 + Équipe 👨‍💼 · Réponse instantanée",
      placeholder: "Écrivez votre message...",
      bienvenue:
        "Salut ! 👋 Bienvenue chez Cyber Famille !\n\nJe suis ton assistant virtuel 🤖. Comment puis-je t'aider ?",
      fermer: "Fermer",
      envoyer: "Envoyer",
      erreurConnexion: "Impossible de contacter le serveur",
      bot: "Bot",
      admin: "Admin",
      vous: "Vous",
      nouvelleConv: "Nouvelle conversation",
      confirmerNouvelleConv:
        "Voulez-vous vraiment démarrer une nouvelle conversation ? Votre historique sera conservé mais vous repartirez sur une conversation vierge.",
      historique: "Votre historique est conservé",
    },
    mg: {
      titre: "Resadresaka aminay",
      sousTitre: "Bot 🤖 + Ekipa 👨‍💼 · Valiny avy hatrany",
      placeholder: "Soraty ny hafatrao...",
      bienvenue:
        "Manao ahoana! 👋 Tongasoa eto amin'ny Cyber Famille!\n\nIzaho no mpanampy virtoaly 🤖. Ahoana no ahafahako manampy anao?",
      fermer: "Hidio",
      envoyer: "Alefaso",
      erreurConnexion: "Tsy afaka mifandray amin'ny serveur",
      bot: "Bot",
      admin: "Admin",
      vous: "Ianao",
      nouvelleConv: "Resadresaka vaovao",
      confirmerNouvelleConv:
        "Tena tianao ve hanomboka resadresaka vaovao? Hotehirizina ny tantaranao fa hanomboka amin'ny vaovao ianao.",
      historique: "Voatahiry ny tantaranao",
    },
  };

  const t = textes[langue] || textes.fr;

  // Initialisation de la conversation
  const initConversation = async () => {
    try {
      const res = await fetch(`${API_URL}/chat/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_token: getClientToken() }),
      });
      const data = await res.json();

      if (data.success) {
        setConversation(data.conversation);
        setMessages(data.messages || []);

        if (data.messages && data.messages.length > 0) {
          const maxId = Math.max(...data.messages.map((m) => m.id));
          derniereIdRef.current = maxId;
        }

        setInitialise(true);
      } else {
        setErreur(data.message);
      }
    } catch (err) {
      console.error("Erreur init chat:", err);
      setErreur(t.erreurConnexion);
    }
  };

  // Charger l'historique complet (quand on ouvre le chat)
  const chargerHistorique = async () => {
    setChargementHistorique(true);
    try {
      const token = getClientToken();
      const res = await fetch(`${API_URL}/chat/messages?token=${token}&apres=0`);
      const data = await res.json();

      if (data.success) {
        setMessages(data.messages || []);
        if (data.messages && data.messages.length > 0) {
          const maxId = Math.max(...data.messages.map((m) => m.id));
          derniereIdRef.current = maxId;
        }
      }
    } catch (err) {
      console.error("Erreur historique:", err);
    } finally {
      setChargementHistorique(false);
    }
  };

  // Charger les nouveaux messages (polling)
  const chargerMessages = async () => {
    try {
      const token = getClientToken();
      const apres = derniereIdRef.current;
      const res = await fetch(
        `${API_URL}/chat/messages?token=${token}&apres=${apres}`
      );
      const data = await res.json();

      if (data.success && data.messages && data.messages.length > 0) {
        setMessages((prev) => {
          const idsExistants = new Set(prev.map((m) => m.id));
          const nouveaux = data.messages.filter(
            (m) => !idsExistants.has(m.id)
          );
          return [...prev, ...nouveaux];
        });

        const maxId = Math.max(...data.messages.map((m) => m.id));
        derniereIdRef.current = Math.max(derniereIdRef.current, maxId);

        // Compter les non-lus (messages admin ou bot)
        if (!ouvert) {
          const messagesRecus = data.messages.filter(
            (m) => m.expediteur === "admin" || m.expediteur === "bot"
          );
          if (messagesRecus.length > 0) {
            setNbNonLus((n) => n + messagesRecus.length);
          }
        }
      }
    } catch (err) {
      // Silencieux
    }
  };

  // Envoyer un message
  const envoyerMessage = async (e) => {
    e.preventDefault();
    if (!nouveauMessage.trim() || envoiEnCours) return;

    const contenu = nouveauMessage.trim();
    setNouveauMessage("");
    setEnvoiEnCours(true);

    try {
      const res = await fetch(`${API_URL}/chat/envoyer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_token: getClientToken(),
          contenu,
        }),
      });
      const data = await res.json();

      if (data.success) {
        // Si le backend renvoie les nouveaux messages (client + bot), on les ajoute
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
        } else if (data.message) {
          setMessages((prev) => [...prev, data.message]);
          derniereIdRef.current = Math.max(
            derniereIdRef.current,
            data.message.id
          );
        }
      } else {
        setErreur(data.message);
        setNouveauMessage(contenu);
      }
    } catch (err) {
      setErreur(t.erreurConnexion);
      setNouveauMessage(contenu);
    } finally {
      setEnvoiEnCours(false);
    }
  };

  // Ouvrir le chat
  const ouvrirChat = async () => {
    setOuvert(true);
    setNbNonLus(0);
    if (!initialise) {
      await initConversation();
    } else {
      // Rafraîchir l'historique
      await chargerHistorique();
    }
  };

  // Nouvelle conversation (optionnel)
  const nouvelleConversation = () => {
    if (!confirm(t.confirmerNouvelleConv)) return;
    localStorage.removeItem("chat_client_token");
    setMessages([]);
    setConversation(null);
    setInitialise(false);
    derniereIdRef.current = 0;
    initConversation();
  };

  // Init au chargement + polling
  useEffect(() => {
    initConversation();

    pollingRef.current = setInterval(() => {
      if (initialise) {
        chargerMessages();
      }
    }, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [initialise]);

  // Scroll auto
  useEffect(() => {
    if (ouvert && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, ouvert]);

  // Format heure
  const formatHeure = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper : infos expéditeur
  const getExpediteurInfo = (expediteur) => {
    if (expediteur === "bot") {
      return {
        label: t.bot,
        icone: Bot,
        bgGradient: "from-purple-500 to-pink-500",
        bulleColor: "bg-purple-500/10 border-purple-500/30 text-gray-200",
      };
    }
    if (expediteur === "admin") {
      return {
        label: t.admin,
        icone: UserCog,
        bgGradient: "from-orange-500 to-orange-600",
        bulleColor: "bg-orange-500/10 border-orange-500/30 text-gray-200",
      };
    }
    return {
      label: t.vous,
      icone: User,
      bgGradient: "from-[#06B6D4] to-[#1E40AF]",
      bulleColor: "bg-gradient-to-br from-[#06B6D4] to-[#1E40AF] text-white",
    };
  };

  // ===== BOUTON FLOTTANT (fermé) =====
  if (!ouvert) {
    return (
      <button
        onClick={ouvrirChat}
        className="fixed bottom-24 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#1E40AF] text-white shadow-2xl shadow-cyan-500/40 hover:scale-110 transition-all duration-300 flex items-center justify-center group"
        aria-label="Ouvrir le chat"
      >
        <MessageCircle size={24} className="group-hover:scale-110 transition" />

        {nbNonLus > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 shadow-lg animate-pulse">
            {nbNonLus > 99 ? "99+" : nbNonLus}
          </span>
        )}

        <span className="absolute inset-0 rounded-full bg-[#06B6D4]/40 animate-ping opacity-30" />
      </button>
    );
  }

  // ===== FENÊTRE DE CHAT (ouverte) =====
  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] sm:w-96 h-[calc(100vh-2rem)] sm:h-[600px] max-h-[650px] bg-[#112240] rounded-2xl shadow-2xl border border-[#06B6D4]/30 flex flex-col overflow-hidden anim-fade-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1E40AF] to-[#06B6D4] p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">{t.titre}</h3>
            <p className="text-xs text-white/80 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              {t.sousTitre}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={nouvelleConversation}
            className="p-2 rounded-lg hover:bg-white/20 text-white/80 transition"
            title={t.nouvelleConv}
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={() => setOuvert(false)}
            className="p-2 rounded-lg hover:bg-white/20 text-white transition"
            aria-label={t.fermer}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0A1628]">
        {/* Chargement historique */}
        {chargementHistorique && messages.length === 0 && (
          <div className="text-center py-8">
            <Loader2 size={24} className="animate-spin text-[#67E8F9] mx-auto" />
            <p className="text-xs text-gray-500 mt-2">
              {langue === "mg" ? "Mampiditra ny tantara..." : "Chargement de l'historique..."}
            </p>
          </div>
        )}

        {/* Message de bienvenue */}
        {messages.length === 0 && !erreur && !chargementHistorique && (
          <div className="flex gap-2 items-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl rounded-tl-sm px-3 py-2 max-w-[80%]">
              <p className="text-sm text-gray-200 whitespace-pre-line">
                {t.bienvenue}
              </p>
            </div>
          </div>
        )}

        {/* Erreur */}
        {erreur && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 text-center">
            {erreur}
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => {
          const estClient = msg.expediteur === "client";
          const info = getExpediteurInfo(msg.expediteur);
          const Icone = info.icone;

          return (
            <div
              key={msg.id}
              className={`flex gap-2 items-start ${
                estClient ? "flex-row-reverse" : ""
              }`}
            >
              {!estClient && (
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${info.bgGradient} flex items-center justify-center flex-shrink-0`}
                >
                  <Icone size={16} className="text-white" />
                </div>
              )}
              <div className={`max-w-[80%] ${estClient ? "text-right" : ""}`}>
                {/* Label expéditeur (pour bot et admin) */}
                {!estClient && (
                  <div className="text-xs text-gray-500 mb-1 ml-1 flex items-center gap-1">
                    <Icone size={10} />
                    {info.label}
                  </div>
                )}
                <div
                  className={`px-3 py-2 rounded-2xl inline-block text-left ${info.bulleColor} ${
                    estClient ? "rounded-tr-sm" : "rounded-tl-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.contenu}
                  </p>
                </div>
                <div
                  className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
                    estClient ? "justify-end" : ""
                  }`}
                >
                  <span>{formatHeure(msg.created_at)}</span>
                  {estClient && (
                    <CheckCheck
                      size={12}
                      className={msg.lu ? "text-cyan-400" : "text-gray-600"}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={envoyerMessage}
        className="p-3 border-t border-[#1E40AF]/20 bg-[#112240] flex items-center gap-2 flex-shrink-0"
      >
        <input
          type="text"
          value={nouveauMessage}
          onChange={(e) => setNouveauMessage(e.target.value)}
          placeholder={t.placeholder}
          disabled={!initialise || envoiEnCours}
          className="flex-1 bg-[#0A1628] border border-[#1E40AF]/30 rounded-full py-2.5 px-4 text-sm text-white focus:border-[#06B6D4] focus:outline-none transition disabled:opacity-50"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!nouveauMessage.trim() || !initialise || envoiEnCours}
          className="p-2.5 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#1E40AF] text-white hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-10 h-10"
          aria-label={t.envoyer}
        >
          {envoiEnCours ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="px-3 py-1.5 bg-[#0A1628] text-center text-xs text-gray-500 border-t border-[#1E40AF]/20 flex-shrink-0 flex items-center justify-center gap-1">
        <History size={10} />
        {t.historique}
      </div>
    </div>
  );
}