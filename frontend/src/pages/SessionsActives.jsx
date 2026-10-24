import { useEffect, useState } from "react";
import {
  Monitor,
  Smartphone,
  Tablet,
  Trash2,
  RefreshCw,
  Shield,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Loader2,
  Activity,
} from "lucide-react";
import api from "../api";
import { toast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";

export default function SessionsActives() {
  const { admin } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [confirm, setConfirm] = useState(null);

  const charger = async () => {
    setChargement(true);
    try {
      const [r1, r2] = await Promise.all([
        api.get("/api/sessions-actives"),
        api.get("/api/sessions-actives/stats"),
      ]);
      setSessions(r1.data || []);
      setStats(r2.data);
    } catch (e) {
      toast("Erreur de chargement", "error");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
    const interval = setInterval(charger, 30000);
    return () => clearInterval(interval);
  }, []);

  const revoquer = async () => {
    if (!confirm) return;
    try {
      await api.post("/api/sessions-actives/revoquer", {
        session_id: confirm.id,
      });
      toast("Session révoquée", "success");
      charger();
    } catch (e) {
      toast("Erreur", "error");
    } finally {
      setConfirm(null);
    }
  };

  const revoquerAutres = async () => {
    if (!confirm("Révoquer toutes les autres sessions ?")) return;
    const token = localStorage.getItem("token");
    try {
      await api.post("/api/sessions-actives/revoquer-autres", {
        admin_id: admin?.id || 1,
        token,
      });
      toast("Autres sessions révoquées", "success");
      charger();
    } catch (e) {
      toast("Erreur", "error");
    }
  };

  const getIcone = (device) => {
    if (!device) return Monitor;
    if (device.includes("Android") || device.includes("iPhone"))
      return Smartphone;
    if (device.includes("iPad")) return Tablet;
    return Monitor;
  };

  const tempsEcoule = (date) => {
    const diff = Math.floor((new Date() - new Date(date)) / 1000);
    if (diff < 60) return `il y a ${diff}s`;
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
    return `il y a ${Math.floor(diff / 86400)}j`;
  };

  if (chargement && sessions.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center text-gray-500">
        <Loader2 size={32} className="animate-spin mx-auto mb-3 text-accent" />
        Chargement...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield size={24} className="text-accent" />
            Sessions actives
          </h1>
          <p className="text-gray-400 text-sm">
            Gérez les appareils connectés à votre compte
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={revoquerAutres}
            className="flex items-center gap-2 bg-danger/10 hover:bg-danger/20 text-danger text-sm font-medium px-4 py-2.5 rounded-lg transition"
          >
            <LogOut size={16} />
            Déconnecter les autres
          </button>
          <button
            onClick={charger}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-sm px-4 py-2.5 rounded-lg transition"
          >
            <RefreshCw size={16} className={chargement ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-panel rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="bg-accent/10 text-accent p-3 rounded-xl">
                <Monitor size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Total sessions</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-panel rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="bg-success/10 text-success p-3 rounded-xl">
                <Activity size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Actives (30min)</p>
                <p className="text-xl font-bold text-success">{stats.actives}</p>
              </div>
            </div>
          </div>
          <div className="bg-panel rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="bg-cyan/10 text-cyan p-3 rounded-xl">
                <Shield size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Admins uniques</p>
                <p className="text-xl font-bold text-cyan">{stats.admins_uniques}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liste */}
      {sessions.length === 0 ? (
        <EmptyState
          icon={Shield}
          titre="Aucune session active"
          sousTitre="Les sessions apparaîtront ici dès qu'un admin se connecte"
        />
      ) : (
        <div className="space-y-3">
          {sessions.map((s, i) => {
            const Icone = getIcone(s.device);
            const estActive = s.minutes_inactif < 30;
            return (
              <div
                key={s.id}
                className="bg-panel rounded-2xl p-5 border border-white/5 hover:border-accent/30 transition animate-slide-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-4 rounded-xl flex-shrink-0 ${
                      estActive
                        ? "bg-success/10 text-success"
                        : "bg-gray-500/10 text-gray-400"
                    }`}
                  >
                    <Icone size={24} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold truncate">{s.device || "Appareil inconnu"}</p>
                      {estActive ? (
                        <span className="flex items-center gap-1 bg-success/20 text-success text-xs px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                          En ligne
                        </span>
                      ) : (
                        <span className="bg-gray-500/20 text-gray-400 text-xs px-2 py-0.5 rounded-full">
                          Inactif
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      <b className="text-gray-300">{s.admin_nom}</b> ({s.admin_email})
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-2">
                      <span>🌐 IP : <b>{s.ip || "—"}</b></span>
                      <span>🕐 Dernière activité : <b>{tempsEcoule(s.derniere_activite)}</b></span>
                    </div>
                  </div>

                  <button
                    onClick={() => setConfirm(s)}
                    className="bg-danger/10 hover:bg-danger/20 text-danger p-3 rounded-lg transition flex-shrink-0"
                    title="Révoquer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation */}
      <ConfirmDialog
        ouvert={!!confirm}
        titre="Révoquer cette session ?"
        message={`L'appareil "${confirm?.device || "inconnu"}" sera déconnecté immédiatement.`}
        onConfirm={revoquer}
        onCancel={() => setConfirm(null)}
        couleur="danger"
        labelConfirm="Révoquer"
      />
    </div>
  );
}