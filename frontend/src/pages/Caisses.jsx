import { useEffect, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  Save,
  Store,
  Play,
  Square,
  DollarSign,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import api from "../api";
import { toast } from "../components/Toast";
import { useCaisse } from "../context/CaisseContext";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import PageLoader from "../components/PageLoader";

export default function Caisses() {
  const [caisses, setCaisses] = useState([]);
  const [stats, setStats] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [modeEdition, setModeEdition] = useState(false);
  const [form, setForm] = useState({
    id: null,
    nom: "",
    description: "",
    statut: "active",
  });
  const [sauvegarde, setSauvegarde] = useState(false);
  const [erreur, setErreur] = useState("");
  const [confirmSuppr, setConfirmSuppr] = useState(null);
  const { sessionActive, ouvrirCaisse, fermerCaisse } = useCaisse();

  const charger = async () => {
    setChargement(true);
    try {
      const [r1, r2] = await Promise.all([
        api.get("/api/caisses"),
        api.get("/api/caisses/stats"),
      ]);
      setCaisses(r1.data || []);
      setStats(r2.data || []);
    } catch (e) {
      toast("Erreur de chargement", "error");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const ouvrirModal = (caisse = null) => {
    if (caisse) {
      setForm({
        id: caisse.id,
        nom: caisse.nom,
        description: caisse.description || "",
        statut: caisse.statut,
      });
      setModeEdition(true);
    } else {
      setForm({ id: null, nom: "", description: "", statut: "active" });
      setModeEdition(false);
    }
    setErreur("");
    setModalOuvert(true);
  };

  const enregistrer = async (e) => {
    e.preventDefault();
    setErreur("");
    setSauvegarde(true);
    try {
      const url = modeEdition ? "/api/caisses/modifier" : "/api/caisses/creer";
      const r = await api.post(url, form);
      if (r.data.success) {
        toast(modeEdition ? "Caisse modifiée" : "Caisse créée", "success");
        setModalOuvert(false);
        charger();
      } else {
        setErreur(r.data.erreur || "Erreur");
      }
    } catch (err) {
      setErreur(err.response?.data?.erreur || "Erreur de communication");
    } finally {
      setSauvegarde(false);
    }
  };

  const supprimer = async () => {
    if (!confirmSuppr) return;
    try {
      const r = await api.post("/api/caisses/supprimer", { id: confirmSuppr.id });
      if (r.data.success) {
        toast("Caisse supprimée", "success");
        charger();
      } else {
        toast(r.data.erreur || "Erreur", "error");
      }
    } catch (err) {
      toast(err.response?.data?.erreur || "Erreur", "error");
    } finally {
      setConfirmSuppr(null);
    }
  };

  const handleOuvrir = async (caisse) => {
    try {
      await ouvrirCaisse(caisse.id, 1);
      toast(`Caisse "${caisse.nom}" ouverte`, "success");
      charger();
    } catch (e) {
      toast("Erreur d'ouverture", "error");
    }
  };

  const handleFermer = async () => {
    try {
      await fermerCaisse(1);
      toast("Caisse fermée", "success");
      charger();
    } catch (e) {
      toast("Erreur de fermeture", "error");
    }
  };

  if (chargement) return <PageLoader message="Chargement des caisses..." />;

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold">Caisses</h1>
          <p className="text-gray-400 text-sm">
            Gérez vos points de vente et suivez les performances
          </p>
        </div>
        <div className="flex gap-2">
          {sessionActive && (
            <button
              onClick={handleFermer}
              className="flex items-center gap-2 bg-danger/10 hover:bg-danger/20 text-danger text-sm font-medium px-4 py-2.5 rounded-lg transition"
            >
              <Square size={16} />
              Fermer ma caisse
            </button>
          )}
          <button
            onClick={() => ouvrirModal()}
            className="flex items-center gap-2 bg-accent hover:bg-accentDark text-white text-sm font-medium px-4 py-2.5 rounded-lg transition hover:scale-105"
          >
            <Plus size={16} />
            Nouvelle caisse
          </button>
        </div>
      </div>

      {/* Session active */}
      {sessionActive && (
        <div className="bg-success/10 border border-success/30 rounded-2xl p-4 mb-6 flex items-center gap-3 animate-slide-down">
          <CheckCircle2 size={20} className="text-success" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-success">
              Vous êtes connecté à : {sessionActive.caisse_nom}
            </p>
            <p className="text-xs text-gray-400">
              Ouverte le{" "}
              {new Date(sessionActive.debut).toLocaleString("fr-FR")}
            </p>
          </div>
        </div>
      )}

      {/* Liste des caisses */}
      {caisses.length === 0 ? (
        <EmptyState
          icon={Store}
          titre="Aucune caisse"
          sousTitre="Créez votre première caisse pour commencer"
          action={() => ouvrirModal()}
          actionLabel="Nouvelle caisse"
          actionIcon={Plus}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {caisses.map((c, i) => {
            const estActive = sessionActive?.caisse_id === c.id;
            const estUtilisee = c.utilisee > 0;
            return (
              <div
                key={c.id}
                className={`bg-panel rounded-2xl p-5 border transition-all animate-slide-up ${
                  estActive
                    ? "border-success/50 shadow-lg shadow-success/20"
                    : "border-white/5 hover:border-accent/30"
                }`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-3 rounded-xl flex-shrink-0 ${
                        estActive
                          ? "bg-success/10 text-success"
                          : "bg-accent/10 text-accent"
                      }`}
                    >
                      <Store size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{c.nom}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {c.description || "—"}
                      </p>
                    </div>
                  </div>
                  {estActive && (
                    <span className="bg-success/20 text-success text-xs px-2 py-1 rounded-full font-medium flex-shrink-0">
                      Ma caisse
                    </span>
                  )}
                </div>

                {/* Statistiques de la caisse */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-night rounded-lg p-3">
                    <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                      <DollarSign size={12} />
                      Aujourd'hui
                    </div>
                    <p className="font-bold text-accent">{c.total_jour} Ar</p>
                  </div>
                  <div className="bg-night rounded-lg p-3">
                    <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                      <TrendingUp size={12} />
                      Ventes
                    </div>
                    <p className="font-bold text-success">{c.ventes_jour}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-white/5">
                  {!estUtilisee && !estActive && (
                    <button
                      onClick={() => handleOuvrir(c)}
                      className="flex-1 bg-success/10 hover:bg-success/20 text-success text-sm font-medium py-2 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <Play size={14} />
                      Ouvrir
                    </button>
                  )}
                  {estUtilisee && !estActive && (
                    <div className="flex-1 bg-warn/10 text-warn text-xs py-2 rounded-lg text-center">
                      Utilisée
                    </div>
                  )}
                  <button
                    onClick={() => ouvrirModal(c)}
                    className="bg-white/5 hover:bg-white/10 text-cyan p-2 rounded-lg transition"
                    title="Modifier"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => setConfirmSuppr(c)}
                    className="bg-white/5 hover:bg-danger/10 text-danger p-2 rounded-lg transition"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Statistiques comparatives */}
      {stats.length > 0 && (
        <div className="bg-panel rounded-2xl border border-white/5 overflow-hidden animate-slide-up">
          <div className="p-5 border-b border-white/5 flex items-center gap-2">
            <TrendingUp size={18} className="text-accent" />
            <h3 className="font-semibold">Comparaison des caisses</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                <tr>
                  <th className="text-left p-4">Caisse</th>
                  <th className="text-right p-4">Ventes jour</th>
                  <th className="text-right p-4">7 derniers jours</th>
                  <th className="text-right p-4">Total</th>
                  <th className="text-right p-4">Transactions</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr
                    key={s.id}
                    className="border-t border-white/5 hover:bg-white/5 transition"
                  >
                    <td className="p-4 font-medium">{s.nom}</td>
                    <td className="p-4 text-right text-accent">
                      {s.ventes_jour} Ar
                    </td>
                    <td className="p-4 text-right text-cyan">
                      {s.ventes_semaine} Ar
                    </td>
                    <td className="p-4 text-right font-bold text-success">
                      {s.ventes_total} Ar
                    </td>
                    <td className="p-4 text-right text-gray-400">
                      {s.nb_ventes_jour}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal création/édition */}
      <Modal
        ouvert={modalOuvert}
        onClose={() => setModalOuvert(false)}
        titre={modeEdition ? "Modifier la caisse" : "Nouvelle caisse"}
        icon={Store}
        couleur="accent"
      >
        {erreur && (
          <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3 mb-4">
            {erreur}
          </div>
        )}

        <form onSubmit={enregistrer}>
          <label className="block text-sm text-gray-400 mb-2">
            Nom de la caisse
          </label>
          <input
            type="text"
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            required
            placeholder="Caisse principale"
            className="w-full bg-night border border-white/10 rounded-lg p-3 mb-4 text-white focus:border-accent focus:outline-none"
          />

          <label className="block text-sm text-gray-400 mb-2">
            Description
          </label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Caisse de l'accueil"
            className="w-full bg-night border border-white/10 rounded-lg p-3 mb-4 text-white focus:border-accent focus:outline-none"
          />

          {modeEdition && (
            <>
              <label className="block text-sm text-gray-400 mb-2">Statut</label>
              <select
                value={form.statut}
                onChange={(e) => setForm({ ...form, statut: e.target.value })}
                className="w-full bg-night border border-white/10 rounded-lg p-3 mb-4 text-white focus:border-accent focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setModalOuvert(false)}
              className="flex-1 bg-white/5 hover:bg-white/10 text-sm font-medium py-3 rounded-lg transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={sauvegarde}
              className="flex-1 bg-accent hover:bg-accentDark disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {sauvegarde ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {sauvegarde ? "..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation suppression */}
      <ConfirmDialog
        ouvert={!!confirmSuppr}
        titre="Supprimer cette caisse ?"
        message={`Êtes-vous sûr de vouloir supprimer "${confirmSuppr?.nom}" ? Cette action est irréversible.`}
        onConfirm={supprimer}
        onCancel={() => setConfirmSuppr(null)}
        couleur="danger"
      />
    </div>
  );
}