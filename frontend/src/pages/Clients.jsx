import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Users,
  RefreshCw,
  Clock,
  Wifi,
  AlertTriangle,
  Activity,
  ExternalLink,
} from "lucide-react";
import api from "../api";
import { useWebSocket } from "../context/WebSocketContext";
import { useLanguage } from "../context/LanguageContext";
import { toast } from "../components/Toast";
import PageLoader from "../components/PageLoader";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Clients() {
  const [sessions, setSessions] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [derniereMaj, setDerniereMaj] = useState(null);
  const [compteurSec, setCompteurSec] = useState(0);
  const [confirmTerminer, setConfirmTerminer] = useState(null);

  const tickRef = useRef(null);
  const intervalRef = useRef(null);
  const location = useLocation();
  const { connecte, souscrire } = useWebSocket();
  const { t } = useLanguage();

  const chargerSessions = async (silencieux = false) => {
    if (!silencieux) setErreur("");
    try {
      const r = await api.get("/api/sessions");
      setSessions(Array.isArray(r.data) ? r.data : []);
      setDerniereMaj(new Date());
      setCompteurSec(0);
    } catch (e) {
      if (!silencieux) {
        setErreur(e.response?.data?.erreur || t("commun.erreur"));
      }
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerSessions();
  }, [location.pathname]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      chargerSessions(true);
    }, 10000);
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    const desouscrire = souscrire((data) => {
      if (
        data.type === "session" ||
        data.type === "vente" ||
        data.type === "expiration"
      ) {
        chargerSessions(true);
      }
    });
    return () => desouscrire();
  }, [souscrire]);

  useEffect(() => {
    tickRef.current = setInterval(() => {
      setSessions((prev) =>
        prev.map((s) => ({
          ...s,
          secondes_restantes: Math.max(0, (s.secondes_restantes || 0) - 1),
        }))
      );
      setCompteurSec((c) => c + 1);
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, []);

  const confirmerTerminer = async () => {
    if (!confirmTerminer) return;
    try {
      await api.post("/api/sessions/terminer", {
        session_id: confirmTerminer.id,
      });
      toast(`Session ${confirmTerminer.code} terminée`, "success");
      setSessions((prev) => prev.filter((s) => s.id !== confirmTerminer.id));
    } catch {
      toast("Erreur lors de la terminaison", "error");
    } finally {
      setConfirmTerminer(null);
    }
  };

  const formatTemps = (s) => {
    if (!s || isNaN(s) || s <= 0) return "00:00:00";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(
      sec
    ).padStart(2, "0")}`;
  };

  const pourcentageRestant = (s) => {
    const total = (s.duree_minutes || 60) * 60;
    return Math.min(100, Math.max(0, (s.secondes_restantes / total) * 100));
  };

  const couleurProgression = (s) => {
    const p = pourcentageRestant(s);
    if (p > 50) return "bg-success";
    if (p > 20) return "bg-warn";
    return "bg-danger";
  };

  const totalSecondes = sessions.reduce(
    (t2, s) => t2 + (s.secondes_restantes || 0),
    0
  );

  if (chargement && sessions.length === 0) {
    return <PageLoader message="Chargement des clients..." />;
  }

  if (erreur && sessions.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <ErrorState
          titre="Impossible de charger les sessions"
          message={erreur}
          onRetry={chargerSessions}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold">{t("clients.titre")}</h1>
          <p className="text-gray-400 text-sm">{t("clients.sousTitre")}</p>
        </div>
        <div className="flex items-center gap-3">
          {derniereMaj && (
            <span className="text-xs text-gray-500 hidden md:block">
              Il y a {compteurSec}s
            </span>
          )}
          <button
            onClick={() => chargerSessions()}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-sm px-4 py-2 rounded-lg transition hover:scale-105"
          >
            <RefreshCw size={16} className={chargement ? "animate-spin" : ""} />
            {t("clients.actualiser")}
          </button>
        </div>
      </div>

      {/* Cartes résumé */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-panel rounded-2xl p-4 border border-white/5 hover-lift animate-slide-up stagger-1">
          <div className="flex items-center gap-3">
            <div className="bg-success/10 text-success p-2.5 rounded-xl flex-shrink-0">
              <Users size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 uppercase">
                {t("clients.sessionsActives")}
              </p>
              <p className="text-lg font-bold">{sessions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-panel rounded-2xl p-4 border border-white/5 hover-lift animate-slide-up stagger-2">
          <div className="flex items-center gap-3">
            <div className="bg-cyan/10 text-cyan p-2.5 rounded-xl flex-shrink-0">
              <Wifi size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 uppercase">
                {t("clients.ticketsUtilises")}
              </p>
              <p className="text-lg font-bold">{sessions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-panel rounded-2xl p-4 border border-white/5 hover-lift animate-slide-up stagger-3">
          <div className="flex items-center gap-3">
            <div className="bg-accent/10 text-accent p-2.5 rounded-xl flex-shrink-0">
              <Clock size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 uppercase">
                {t("clients.tempsCumule")}
              </p>
              <p className="text-lg font-bold font-mono">
                {formatTemps(totalSecondes)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Indicateur */}
      <div className="flex items-center gap-3 text-xs mb-4 flex-wrap animate-slide-up stagger-4">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-success animate-pulse" />
          <span className="text-gray-500">
            {connecte ? t("clients.tempsReel") : t("clients.polling")}
          </span>
        </div>
        <span
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
            connecte
              ? "bg-success/20 text-success"
              : "bg-gray-500/20 text-gray-400"
          }`}
        >
          {connecte ? "🌐 Live" : "⏱ Polling"}
        </span>
      </div>

      {/* Liste */}
      {sessions.length === 0 ? (
        <div className="animate-slide-up stagger-5">
          <EmptyState
            icon={Wifi}
            titre={t("clients.aucunClient")}
            sousTitre={t("clients.aucunClientDesc")}
            action={() => window.open("/portail", "_blank")}
            actionLabel={t("clients.ouvrirPortail")}
            actionIcon={ExternalLink}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((s, i) => (
            <div
              key={s.id}
              className="bg-panel rounded-2xl p-5 border border-white/5 hover:border-accent/30 hover-lift transition-all animate-slide-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="min-w-0">
                  <p className="font-mono text-accent text-lg font-bold truncate">
                    {s.code}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {s.forfait_nom}
                  </p>
                </div>
                <span className="bg-success/20 text-success text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 flex-shrink-0">
                  <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                  Actif
                </span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>{new Date(s.debut).toLocaleTimeString("fr-FR")}</span>
                  <span>{s.duree_minutes} min</span>
                </div>

                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${couleurProgression(
                      s
                    )} transition-all duration-1000 ease-linear`}
                    style={{ width: `${pourcentageRestant(s)}%` }}
                  />
                </div>
              </div>

              <div className="text-center bg-night rounded-xl p-4 border border-white/5 mb-4">
                <p className="text-xs text-gray-500 mb-1">
                  {t("clients.tempsRestant")}
                </p>
                <p className="text-3xl font-bold font-mono text-white">
                  {formatTemps(s.secondes_restantes)}
                </p>
              </div>

              <button
                onClick={() => setConfirmTerminer(s)}
                className="w-full bg-danger/10 hover:bg-danger/20 text-danger text-sm font-medium py-2 rounded-lg transition hover:scale-105"
              >
                {t("clients.terminer")}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation */}
      <ConfirmDialog
        ouvert={!!confirmTerminer}
        titre="Terminer la session ?"
        message={`Le ticket ${confirmTerminer?.code || ""} sera immédiatement révoqué et le client perdra sa connexion.`}
        onConfirm={confirmerTerminer}
        onCancel={() => setConfirmTerminer(null)}
        couleur="danger"
        labelConfirm="Terminer"
      />
    </div>
  );
}