import { useEffect, useState } from "react";
import {
  UserPlus,
  Trash2,
  Edit,
  Shield,
  User,
  X,
  Loader2,
  Save,
} from "lucide-react";
import api from "../api";

export default function Admins() {
  const [admins, setAdmins] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [modeEdition, setModeEdition] = useState(false);
  const [form, setForm] = useState({
    id: null,
    nom: "",
    email: "",
    mot_de_passe: "",
    role: "caissier",
  });
  const [sauvegarde, setSauvegarde] = useState(false);
  const [erreur, setErreur] = useState("");

  const charger = () => {
    setChargement(true);
    api
      .get("/api/admins")
      .then((r) => setAdmins(r.data))
      .catch(() => setAdmins([]))
      .finally(() => setChargement(false));
  };

  useEffect(() => {
    charger();
  }, []);

  const ouvrirCreation = () => {
    setForm({
      id: null,
      nom: "",
      email: "",
      mot_de_passe: "",
      role: "caissier",
    });
    setModeEdition(false);
    setErreur("");
    setModalOuvert(true);
  };

  const ouvrirEdition = (a) => {
    setForm({
      id: a.id,
      nom: a.nom,
      email: a.email,
      mot_de_passe: "",
      role: a.role,
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
      const url = modeEdition ? "/api/admins/modifier" : "/api/admins/creer";
      const r = await api.post(url, form);
      if (r.data.success) {
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

  const supprimer = async (a) => {
    if (!confirm(`Supprimer l'administrateur "${a.nom}" ?`)) return;
    try {
      const r = await api.post("/api/admins/supprimer", { id: a.id });
      if (r.data.success) charger();
      else alert(r.data.erreur || "Erreur");
    } catch (err) {
      alert(err.response?.data?.erreur || "Erreur");
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Administrateurs</h1>
          <p className="text-gray-400 text-sm">
            Gérez les comptes autorisés à utiliser l'application
          </p>
        </div>
        <button
          onClick={ouvrirCreation}
          className="flex items-center gap-2 bg-accent hover:bg-accentDark text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
        >
          <UserPlus size={16} />
          Nouvel admin
        </button>
      </div>

      <div className="bg-panel rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-white/5 text-gray-400 text-xs uppercase">
              <tr>
                <th className="text-left p-4">Nom</th>
                <th className="text-left p-4">Email</th>
                <th className="text-left p-4">Rôle</th>
                <th className="text-left p-4">Créé le</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {chargement ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    Chargement...
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    Aucun administrateur
                  </td>
                </tr>
              ) : (
                admins.map((a) => (
                  <tr
                    key={a.id}
                    className="border-t border-white/5 hover:bg-white/5 transition"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
                          {a.role === "admin" ? (
                            <Shield size={16} />
                          ) : (
                            <User size={16} />
                          )}
                        </div>
                        <span className="font-medium">{a.nom}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-400">{a.email}</td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          a.role === "admin"
                            ? "bg-accent/20 text-accent"
                            : "bg-cyan/20 text-cyan"
                        }`}
                      >
                        {a.role}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 text-xs">
                      {new Date(a.cree_le).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => ouvrirEdition(a)}
                        className="text-cyan hover:bg-cyan/10 p-2 rounded-lg transition mr-1"
                        title="Modifier"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => supprimer(a)}
                        className="text-danger hover:bg-danger/10 p-2 rounded-lg transition"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== Modal ===== */}
      {modalOuvert && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-panel rounded-2xl p-6 w-full max-w-md border border-white/5 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">
                {modeEdition ? "Modifier l'admin" : "Nouvel administrateur"}
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
                Nom complet
              </label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                required
                className="w-full bg-night border border-white/10 rounded-lg p-3 mb-4 text-white focus:border-accent focus:outline-none transition"
              />

              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full bg-night border border-white/10 rounded-lg p-3 mb-4 text-white focus:border-accent focus:outline-none transition"
              />

              <label className="block text-sm text-gray-400 mb-2">
                Mot de passe{" "}
                {modeEdition && "(laisser vide pour ne pas changer)"}
              </label>
              <input
                type="password"
                value={form.mot_de_passe}
                onChange={(e) =>
                  setForm({ ...form, mot_de_passe: e.target.value })
                }
                required={!modeEdition}
                className="w-full bg-night border border-white/10 rounded-lg p-3 mb-4 text-white focus:border-accent focus:outline-none transition"
              />

              <label className="block text-sm text-gray-400 mb-2">Rôle</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full bg-night border border-white/10 rounded-lg p-3 mb-6 text-white focus:border-accent focus:outline-none transition"
              >
                <option value="caissier">Caissier</option>
                <option value="admin">Administrateur</option>
              </select>

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
    </div>
  );
}