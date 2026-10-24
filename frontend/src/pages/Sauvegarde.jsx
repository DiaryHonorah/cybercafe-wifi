import { useEffect, useState } from "react";
import {
  Database,
  Download,
  Trash2,
  Plus,
  Loader2,
  Clock,
  HardDrive,
  RefreshCw,
} from "lucide-react";
import api from "../api";
import { toast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Sauvegarde() {
  const [sauvegardes, setSauvegardes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [creation, setCreation] = useState(false);
  const [confirm, setConfirm] = useState({ ouvert: false, fichier: null });

  const charger = () => {
    setChargement(true);
    api
      .get("/api/backup/liste")
      .then((r) => setSauvegardes(r.data || []))
      .catch(() => setSauvegardes([]))
      .finally(() => setChargement(false));
  };

  useEffect(() => {
    charger();
  }, []);

  const creerSauvegarde = async (type = "manuelle") => {
    setCreation(true);
    try {
      const r = await api.post("/api/backup/creer", { type });
      if (r.data.success) {
        toast(
          `Sauvegarde créée : ${r.data.fichier}`,
          "success"
        );
        charger();
      } else {
        toast(r.data.erreur || "Erreur", "error");
      }
    } catch (e) {
      toast(
        e.response?.data?.erreur || "Erreur lors de la sauvegarde",
        "error"
      );
    } finally {
      setCreation(false);
    }
  };

  const telecharger = (fichier) => {
    window.open(
      `http://localhost/cybercafe-wifi/backend/api/backup/telecharger?fichier=${encodeURIComponent(fichier)}`,
      "_blank"
    );
  };

  const supprimer = async () => {
    if (!confirm.fichier) return;
    try {
      const r = await api.post("/api/backup/supprimer", {
        fichier: confirm.fichier,
      });
      if (r.data.success) {
        toast("Sauvegarde supprimée", "success");
        charger();
      } else {
        toast(r.data.erreur || "Erreur", "error");
      }
    } catch {
      toast("Erreur", "error");
    } finally {
      setConfirm({ ouvert: false, fichier: null });
    }
  };

  const formatTaille = (octets) => {
    if (octets < 1024) return `${octets} o`;
    if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} Ko`;
    return `${(octets / (1024 * 1024)).toFixed(2)} Mo`;
  };

  const totalOctets = sauvegardes.reduce((t, s) => t + (s.taille || 0), 0);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Sauvegardes</h1>
          <p className="text-gray-400 text-sm">
            Gestion des sauvegardes de la base de données
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={charger}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-sm px-4 py-2.5 rounded-lg transition"
          >
            <RefreshCw size={16} className={chargement ? "animate-spin" : ""} />
            Actualiser
          </button>
          <button
            onClick={() => creerSauvegarde("manuelle")}
            disabled={creation}
            className="flex items-center gap-2 bg-accent hover:bg-accentDark disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
          >
            {creation ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            {creation ? "Création..." : "Nouvelle sauvegarde"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-panel rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-accent/10 text-accent p-3 rounded-xl">
              <Database size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">
                Nombre de sauvegardes
              </p>
              <p className="text-xl font-bold">{sauvegardes.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-panel rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-cyan/10 text-cyan p-3 rounded-xl">
              <HardDrive size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">Espace utilisé</p>
              <p className="text-xl font-bold">{formatTaille(totalOctets)}</p>
            </div>
          </div>
        </div>
        <div className="bg-panel rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-success/10 text-success p-3 rounded-xl">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">
                Dernière sauvegarde
              </p>
              <p className="text-sm font-bold">
                {sauvegardes[0]
                  ? new Date(sauvegardes[0].date).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info nettoyage automatique */}
      <div className="bg-cyan/5 border border-cyan/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <Database size={18} className="text-cyan mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-cyan mb-1">
            Nettoyage automatique
          </p>
          <p className="text-xs text-gray-400">
            Le système conserve automatiquement les <b>20 dernières
            sauvegardes</b>. Les plus anciennes sont supprimées pour ne pas
            saturer le disque.
          </p>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-panel rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h3 className="font-semibold">Historique des sauvegardes</h3>
        </div>

        {chargement ? (
          <div className="p-12 text-center text-gray-500">Chargement...</div>
        ) : sauvegardes.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Database size={48} className="text-gray-600 mx-auto mb-4" />
            <p>Aucune sauvegarde pour le moment</p>
            <p className="text-xs mt-2">
              Cliquez sur <b>Nouvelle sauvegarde</b> pour en créer une.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                <tr>
                  <th className="text-left p-4">Fichier</th>
                  <th className="text-left p-4">Type</th>
                  <th className="text-left p-4">Taille</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sauvegardes.map((s, i) => (
                  <tr
                    key={i}
                    className="border-t border-white/5 hover:bg-white/5 transition"
                  >
                    <td className="p-4 font-mono text-xs text-accent">
                      {s.fichier}
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full ${
                          s.type === "automatique"
                            ? "bg-cyan/20 text-cyan"
                            : "bg-accent/20 text-accent"
                        }`}
                      >
                        {s.type}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">
                      {formatTaille(s.taille)}
                    </td>
                    <td className="p-4 text-gray-400 text-xs">
                      {new Date(s.date).toLocaleString("fr-FR")}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => telecharger(s.fichier)}
                        className="text-cyan hover:bg-cyan/10 p-2 rounded-lg transition mr-1"
                        title="Télécharger"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() =>
                          setConfirm({ ouvert: true, fichier: s.fichier })
                        }
                        className="text-danger hover:bg-danger/10 p-2 rounded-lg transition"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation */}
      <ConfirmDialog
        ouvert={confirm.ouvert}
        titre="Supprimer cette sauvegarde ?"
        message={`Cette action est irréversible. Le fichier "${confirm.fichier}" sera définitivement supprimé.`}
        onConfirm={supprimer}
        onCancel={() => setConfirm({ ouvert: false, fichier: null })}
      />
    </div>
  );
}