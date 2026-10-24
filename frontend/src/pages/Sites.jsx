import { useEffect, useState } from "react";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  Save,
  MapPin,
  Phone,
  Users,
  TrendingUp,
} from "lucide-react";
import api from "../api";
import { toast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Sites() {
  const [sites, setSites] = useState([]);
  const [comparaison, setComparaison] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [modeEdition, setModeEdition] = useState(false);
  const [form, setForm] = useState({
    id: null,
    nom: "",
    adresse: "",
    telephone: "",
    actif: 1,
  });
  const [sauvegarde, setSauvegarde] = useState(false);
  const [erreur, setErreur] = useState("");
  const [confirm, setConfirm] = useState({ ouvert: false, site: null });

  const charger = () => {
    setChargement(true);
    Promise.all([
      api.get("/api/sites").catch(() => ({ data: [] })),
      api.get("/api/sites/comparaison").catch(() => ({ data: [] })),
    ]).then(([r1, r2]) => {
      setSites(r1.data || []);
      setComparaison(r2.data || []);
      setChargement(false);
    });
  };

  useEffect(() => {
    charger();
  }, []);

  const ouvrirCreation = () => {
    setForm({ id: null, nom: "", adresse: "", telephone: "", actif: 1 });
    setModeEdition(false);
    setErreur("");
    setModalOuvert(true);
  };

  const ouvrirEdition = (s) => {
    setForm({
      id: s.id,
      nom: s.nom,
      adresse: s.adresse || "",
      telephone: s.telephone || "",
      actif: s.actif,
    });
    setModeEdition(true);
    setErreur("");
    setModalOuvert(true);
  };

  const enregistrer = async (e) => {
    e.preventDefault();
    setErreur("");
    setSauvegarde(true);
    try {
      const url = modeEdition ? "/api/sites/modifier" : "/api/sites/creer";
      const r = await api.post(url, form);
      if (r.data.success) {
        toast(modeEdition ? "Site modifié" : "Site créé", "success");
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
    if (!confirm.site) return;
    try {
      const r = await api.post("/api/sites/supprimer", { id: confirm.site.id });
      if (r.data.success) {
        toast("Site supprimé", "success");
        charger();
      } else {
        toast(r.data.erreur || "Erreur", "error");
      }
    } catch (err) {
      toast(err.response?.data?.erreur || "Erreur", "error");
    } finally {
      setConfirm({ ouvert: false, site: null });
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Sites</h1>
          <p className="text-gray-400 text-sm">
            Gérez vos différents cybercafés
          </p>
        </div>
        <button
          onClick={ouvrirCreation}
          className="flex items-center gap-2 bg-accent hover:bg-accentDark text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
        >
          <Plus size={16} />
          Nouveau site
        </button>
      </div>

      {/* Grille sites */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {chargement ? (
          <div className="col-span-full bg-panel rounded-2xl p-12 text-center text-gray-500 border border-white/5">
            Chargement...
          </div>
        ) : sites.length === 0 ? (
          <div className="col-span-full bg-panel rounded-2xl p-12 text-center border border-white/5">
            <Building2 size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Aucun site enregistré</p>
          </div>
        ) : (
          sites.map((s) => (
            <div
              key={s.id}
              className="bg-panel rounded-2xl p-5 border border-white/5 hover:border-accent/30 transition"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-accent/10 text-accent p-3 rounded-xl flex-shrink-0">
                    <Building2 size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{s.nom}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Users size={11} />
                      {s.nb_admins} admin{s.nb_admins > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                    s.actif
                      ? "bg-success/20 text-success"
                      : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {s.actif ? "Actif" : "Inactif"}
                </span>
              </div>

              {s.adresse && (
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <MapPin size={14} className="flex-shrink-0" />
                  <span className="truncate">{s.adresse}</span>
                </div>
              )}

              {s.telephone && (
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                  <Phone size={14} className="flex-shrink-0" />
                  <span>{s.telephone}</span>
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t border-white/5">
                <button
                  onClick={() => ouvrirEdition(s)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-sm py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Edit size={14} />
                  Modifier
                </button>
                <button
                  onClick={() => setConfirm({ ouvert: true, site: s })}
                  className="bg-danger/10 hover:bg-danger/20 text-danger p-2 rounded-lg transition"
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comparaison */}
      {comparaison.length > 0 && (
        <div className="bg-panel rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center gap-2">
            <TrendingUp size={18} className="text-accent" />
            <h3 className="font-semibold">Comparaison des performances</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                <tr>
                  <th className="text-left p-4">Site</th>
                  <th className="text-right p-4">Ventes du jour</th>
                  <th className="text-right p-4">7 derniers jours</th>
                  <th className="text-right p-4">Total</th>
                  <th className="text-right p-4">Nb ventes</th>
                </tr>
              </thead>
              <tbody>
                {comparaison.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-white/5 hover:bg-white/5 transition"
                  >
                    <td className="p-4 font-medium">{c.nom}</td>
                    <td className="p-4 text-right text-accent">
                      {c.ventes_jour} Ar
                    </td>
                    <td className="p-4 text-right text-cyan">
                      {c.ventes_semaine} Ar
                    </td>
                    <td className="p-4 text-right font-bold text-success">
                      {c.ventes_total} Ar
                    </td>
                    <td className="p-4 text-right text-gray-400">
                      {c.nb_ventes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOuvert && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100]">
          <div className="bg-panel rounded-2xl p-6 w-full max-w-md border border-white/5 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">
                {modeEdition ? "Modifier le site" : "Nouveau site"}
              </h3>
              <button
                onClick={() => setModalOuvert(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>

            {erreur && (
              <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3 mb-4">
                {erreur}
              </div>
            )}

            <form onSubmit={enregistrer}>
              <label className="block text-sm text-gray-400 mb-2">
                Nom du site
              </label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                required
                placeholder="Cyber Famille — Principal"
                className="w-full bg-night border border-white/10 rounded-lg p-3 mb-4 text-white focus:border-accent focus:outline-none transition"
              />

              <label className="block text-sm text-gray-400 mb-2">
                Adresse
              </label>
              <input
                type="text"
                value={form.adresse}
                onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                placeholder="Antananarivo"
                className="w-full bg-night border border-white/10 rounded-lg p-3 mb-4 text-white focus:border-accent focus:outline-none transition"
              />

              <label className="block text-sm text-gray-400 mb-2">
                Téléphone
              </label>
              <input
                type="text"
                value={form.telephone}
                onChange={(e) =>
                  setForm({ ...form, telephone: e.target.value })
                }
                placeholder="034 22 489 66"
                className="w-full bg-night border border-white/10 rounded-lg p-3 mb-4 text-white focus:border-accent focus:outline-none transition"
              />

              <label className="flex items-center gap-3 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!form.actif}
                  onChange={(e) =>
                    setForm({ ...form, actif: e.target.checked ? 1 : 0 })
                  }
                  className="w-4 h-4 accent-accent"
                />
                <span className="text-sm">Site actif</span>
              </label>

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
          </div>
        </div>
      )}

      {/* Confirmation suppression */}
      <ConfirmDialog
        ouvert={confirm.ouvert}
        titre="Supprimer ce site ?"
        message={`Êtes-vous sûr de vouloir supprimer "${confirm.site?.nom}" ? Les administrateurs associés ne seront pas supprimés.`}
        onConfirm={supprimer}
        onCancel={() => setConfirm({ ouvert: false, site: null })}
      />
    </div>
  );
}