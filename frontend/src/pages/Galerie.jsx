import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Power,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Image,
  ImageOff,
  Upload,
  X,
  Save,
  Eye,
  Grid3x3,
  List,
  Store,
  Monitor,
  Wrench,
  ExternalLink,
} from "lucide-react";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function Galerie() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [stats, setStats] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [filtreCategorie, setFiltreCategorie] = useState("toutes");
  const [vue, setVue] = useState("grille"); // "grille" | "liste"
  const [modalUpload, setModalUpload] = useState(false);
  const [modalEdition, setModalEdition] = useState(null);
  const [modalSupprimer, setModalSupprimer] = useState(null);
  const [uploadEnCours, setUploadEnCours] = useState(false);
  const [fichier, setFichier] = useState(null);
  const [apercu, setApercu] = useState(null);
  const [form, setForm] = useState({
    titre: "",
    titre_mg: "",
    description: "",
    description_mg: "",
    categorie: "espace",
    ordre: 0,
    actif: true,
  });
  const fileInputRef = useRef(null);

  const getToken = () =>
    localStorage.getItem("admin_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token");

  const fetchAvecToken = async (url, options = {}) => {
    const token = getToken();
    const headers = {
      Accept: "application/json",
      ...(options.headers || {}),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // Ne pas ajouter Content-Type si c'est un FormData
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    return fetch(url, { ...options, headers, credentials: "omit" });
  };

  // ===== CHARGEMENT =====
  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);

    try {
      const params = new URLSearchParams();
      if (filtreCategorie !== "toutes") params.append("categorie", filtreCategorie);

      const res = await fetchAvecToken(
        `${API_URL}/galerie/admin/photos?${params.toString()}`
      );
      if (res.status === 401) {
        navigate("/login");
        return;
      }
      const data = await res.json();

      if (data.success) {
        setPhotos(data.photos || []);
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
    chargerDonnees();
  }, [filtreCategorie]);

  // ===== UPLOAD =====
  const handleFichierChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (f.size > 5 * 1024 * 1024) {
      alert("Fichier trop volumineux (max 5 MB)");
      return;
    }

    setFichier(f);
    const reader = new FileReader();
    reader.onload = (ev) => setApercu(ev.target.result);
    reader.readAsDataURL(f);
  };

  const uploaderPhoto = async () => {
    if (!fichier) {
      alert("Sélectionnez une photo");
      return;
    }
    if (!form.titre.trim()) {
      alert("Le titre est requis");
      return;
    }

    setUploadEnCours(true);

    try {
      const formData = new FormData();
      formData.append("photo", fichier);
      formData.append("titre", form.titre);
      formData.append("titre_mg", form.titre_mg || "");
      formData.append("description", form.description || "");
      formData.append("description_mg", form.description_mg || "");
      formData.append("categorie", form.categorie);
      formData.append("ordre", form.ordre);
      formData.append("actif", form.actif ? "true" : "false");

      const res = await fetchAvecToken(`${API_URL}/galerie/admin/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        fermerModalUpload();
        chargerDonnees();
      } else {
        alert(data.message || "Erreur upload");
      }
    } catch (err) {
      alert("Erreur serveur");
    } finally {
      setUploadEnCours(false);
    }
  };

  // ===== MODIFIER =====
  const ouvrirEdition = (photo) => {
    setModalEdition({
      id: photo.id,
      titre: photo.titre,
      titre_mg: photo.titre_mg || "",
      description: photo.description || "",
      description_mg: photo.description_mg || "",
      categorie: photo.categorie,
      ordre: photo.ordre,
      actif: photo.actif == 1,
      image_url: photo.image_url,
    });
  };

  const sauvegarderEdition = async () => {
    if (!modalEdition) return;
    setUploadEnCours(true);

    try {
      const res = await fetchAvecToken(`${API_URL}/galerie/admin/modifier`, {
        method: "POST",
        body: JSON.stringify(modalEdition),
      });

      const data = await res.json();

      if (data.success) {
        setModalEdition(null);
        chargerDonnees();
      } else {
        alert(data.message || "Erreur");
      }
    } catch (err) {
      alert("Erreur serveur");
    } finally {
      setUploadEnCours(false);
    }
  };

  // ===== SUPPRIMER =====
  const supprimer = async () => {
    if (!modalSupprimer) return;

    try {
      const res = await fetchAvecToken(`${API_URL}/galerie/admin/supprimer`, {
        method: "POST",
        body: JSON.stringify({ id: modalSupprimer.id }),
      });
      const data = await res.json();

      if (data.success) {
        setModalSupprimer(null);
        chargerDonnees();
      }
    } catch (err) {
      alert("Erreur");
    }
  };

  // ===== TOGGLE =====
  const toggleActif = async (photo) => {
    try {
      const res = await fetchAvecToken(`${API_URL}/galerie/admin/toggle`, {
        method: "POST",
        body: JSON.stringify({ id: photo.id }),
      });
      const data = await res.json();
      if (data.success) chargerDonnees();
    } catch (err) {
      alert("Erreur");
    }
  };

  // ===== HELPERS =====
  const fermerModalUpload = () => {
    setModalUpload(false);
    setFichier(null);
    setApercu(null);
    setForm({
      titre: "",
      titre_mg: "",
      description: "",
      description_mg: "",
      categorie: "espace",
      ordre: 0,
      actif: true,
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getCategorieInfo = (cat) => {
    const cats = {
      espace: {
        label: "Espace",
        color: "bg-blue-500/10 text-blue-400 border-blue-500/30",
        icon: Store,
      },
      equipement: {
        label: "Équipement",
        color: "bg-purple-500/10 text-purple-400 border-purple-500/30",
        icon: Monitor,
      },
      services: {
        label: "Services",
        color: "bg-orange-500/10 text-orange-400 border-orange-500/30",
        icon: Wrench,
      },
    };
    return cats[cat] || cats.espace;
  };

  // ===== RENDER =====
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
              <Camera size={24} className="text-white" />
            </div>
            Galerie photos
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Gérez les photos de votre cybercafé
          </p>
        </div>

        <div className="flex gap-2">
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setVue("grille")}
              className={`p-2 rounded ${
                vue === "grille" ? "bg-orange-500 text-white" : "text-gray-400"
              }`}
              title="Grille"
            >
              <Grid3x3 size={16} />
            </button>
            <button
              onClick={() => setVue("liste")}
              className={`p-2 rounded ${
                vue === "liste" ? "bg-orange-500 text-white" : "text-gray-400"
              }`}
              title="Liste"
            >
              <List size={16} />
            </button>
          </div>

          <button
            onClick={chargerDonnees}
            disabled={chargement}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition disabled:opacity-50"
          >
            <RefreshCw size={16} className={chargement ? "animate-spin" : ""} />
            Actualiser
          </button>

          <button
            onClick={() => setModalUpload(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition"
          >
            <Plus size={16} />
            Nouvelle photo
          </button>
        </div>
      </div>

      {/* STATS */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-[#112240] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <Image size={14} /> Total
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-green-500/20">
            <div className="flex items-center gap-2 text-xs text-green-400 mb-1">
              <CheckCircle2 size={14} /> Actives
            </div>
            <p className="text-2xl font-bold text-green-400">
              {stats.actives}
            </p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-blue-500/20">
            <div className="flex items-center gap-2 text-xs text-blue-400 mb-1">
              <Store size={14} /> Espace
            </div>
            <p className="text-2xl font-bold text-blue-400">
              {stats.espace}
            </p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-purple-500/20">
            <div className="flex items-center gap-2 text-xs text-purple-400 mb-1">
              <Monitor size={14} /> Équipement
            </div>
            <p className="text-2xl font-bold text-purple-400">
              {stats.equipement}
            </p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-orange-500/20">
            <div className="flex items-center gap-2 text-xs text-orange-400 mb-1">
              <Wrench size={14} /> Services
            </div>
            <p className="text-2xl font-bold text-orange-400">
              {stats.services}
            </p>
          </div>
        </div>
      )}

      {/* FILTRES */}
      <div className="bg-[#112240] rounded-xl p-4 mb-6 border border-white/5">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={16} className="text-gray-400" />
          {[
            { id: "toutes", label: "Toutes", icon: Image },
            { id: "espace", label: "Espace", icon: Store },
            { id: "equipement", label: "Équipement", icon: Monitor },
            { id: "services", label: "Services", icon: Wrench },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFiltreCategorie(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                filtreCategorie === cat.id
                  ? "bg-orange-500 text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              <cat.icon size={14} />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ERREUR */}
      {erreur && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} />
          <p>{erreur}</p>
        </div>
      )}

      {/* CHARGEMENT / LISTE */}
      {chargement && photos.length === 0 ? (
        <div className="text-center py-20">
          <Loader2 size={40} className="animate-spin text-orange-500 mx-auto" />
          <p className="text-gray-400 mt-4">Chargement...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-20 bg-[#112240] rounded-2xl border border-white/5">
          <ImageOff size={48} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune photo</h3>
          <p className="text-sm text-gray-400 mb-4">
            Uploadez vos premières photos pour la galerie
          </p>
          <button
            onClick={() => setModalUpload(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition"
          >
            <Upload size={16} />
            Uploader une photo
          </button>
        </div>
      ) : vue === "grille" ? (
        /* ===== VUE GRILLE ===== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {photos.map((photo) => {
            const catInfo = getCategorieInfo(photo.categorie);
            const CatIcon = catInfo.icon;

            return (
              <div
                key={photo.id}
                className={`bg-[#112240] rounded-xl overflow-hidden border transition ${
                  photo.actif
                    ? "border-white/5 hover:border-orange-500/30"
                    : "border-red-500/30 opacity-60"
                }`}
              >
                {/* Image */}
                <div className="h-48 bg-[#0A1628] relative overflow-hidden">
                  <img
                    src={photo.image_url}
                    alt={photo.titre}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Badge catégorie */}
                  <div className="absolute top-2 left-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border backdrop-blur ${catInfo.color}`}
                    >
                      <CatIcon size={10} />
                      {catInfo.label}
                    </span>
                  </div>
                  {/* Statut */}
                  {!photo.actif && (
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 backdrop-blur">
                        Désactivée
                      </span>
                    </div>
                  )}
                </div>

                {/* Contenu */}
                <div className="p-3">
                  <h3 className="font-semibold text-sm line-clamp-1 mb-1">
                    {photo.titre}
                  </h3>
                  {photo.description && (
                    <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                      {photo.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 pt-2 border-t border-white/5">
                    <a
                      href={photo.image_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition"
                      title="Voir"
                    >
                      <Eye size={12} />
                    </a>
                    <button
                      onClick={() => ouvrirEdition(photo)}
                      className="p-1.5 rounded bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 transition"
                      title="Modifier"
                    >
                      <Edit size={12} />
                    </button>
                    <button
                      onClick={() => toggleActif(photo)}
                      className={`p-1.5 rounded transition ${
                        photo.actif
                          ? "bg-green-500/10 hover:bg-green-500/20 text-green-400"
                          : "bg-gray-500/10 hover:bg-gray-500/20 text-gray-400"
                      }`}
                      title={photo.actif ? "Désactiver" : "Activer"}
                    >
                      <Power size={12} />
                    </button>
                    <button
                      onClick={() => setModalSupprimer(photo)}
                      className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition ml-auto"
                      title="Supprimer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ===== VUE LISTE ===== */
        <div className="bg-[#112240] rounded-xl border border-white/5 overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0A1628] border-b border-white/10">
              <tr className="text-xs text-gray-400 uppercase">
                <th className="text-left p-3">Photo</th>
                <th className="text-left p-3">Titre</th>
                <th className="text-left p-3 hidden md:table-cell">Catégorie</th>
                <th className="text-center p-3">Statut</th>
                <th className="text-center p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {photos.map((photo) => {
                const catInfo = getCategorieInfo(photo.categorie);
                const CatIcon = catInfo.icon;

                return (
                  <tr
                    key={photo.id}
                    className="border-b border-white/5 hover:bg-white/[0.02]"
                  >
                    <td className="p-3">
                      <img
                        src={photo.image_url}
                        alt={photo.titre}
                        className="w-16 h-16 rounded-lg object-cover"
                        loading="lazy"
                      />
                    </td>
                    <td className="p-3">
                      <p className="text-sm font-medium line-clamp-1">
                        {photo.titre}
                      </p>
                      {photo.description && (
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {photo.description}
                        </p>
                      )}
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${catInfo.color}`}
                      >
                        <CatIcon size={10} />
                        {catInfo.label}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                          photo.actif
                            ? "bg-green-500/10 text-green-400 border-green-500/30"
                            : "bg-gray-500/10 text-gray-400 border-gray-500/30"
                        }`}
                      >
                        {photo.actif ? (
                          <>
                            <CheckCircle2 size={10} /> Active
                          </>
                        ) : (
                          <>
                            <XCircle size={10} /> Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <a
                          href={photo.image_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition"
                          title="Voir"
                        >
                          <ExternalLink size={14} />
                        </a>
                        <button
                          onClick={() => ouvrirEdition(photo)}
                          className="p-1.5 rounded bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 transition"
                          title="Modifier"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => toggleActif(photo)}
                          className={`p-1.5 rounded transition ${
                            photo.actif
                              ? "bg-green-500/10 hover:bg-green-500/20 text-green-400"
                              : "bg-gray-500/10 hover:bg-gray-500/20 text-gray-400"
                          }`}
                          title={photo.actif ? "Désactiver" : "Activer"}
                        >
                          <Power size={14} />
                        </button>
                        <button
                          onClick={() => setModalSupprimer(photo)}
                          className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== MODAL UPLOAD ===== */}
      {modalUpload && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => !uploadEnCours && fermerModalUpload()}
        >
          <div
            className="bg-[#112240] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#112240] border-b border-white/10 p-5 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <Upload size={20} className="text-orange-400" />
                </div>
                <h2 className="text-lg font-bold">Nouvelle photo</h2>
              </div>
              <button
                onClick={fermerModalUpload}
                disabled={uploadEnCours}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Upload fichier */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Fichier image *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFichierChange}
                  className="hidden"
                />
                {apercu ? (
                  <div className="relative">
                    <img
                      src={apercu}
                      alt="Aperçu"
                      className="w-full h-64 object-contain bg-[#0A1628] rounded-lg"
                    />
                    <button
                      onClick={() => {
                        setFichier(null);
                        setApercu(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="absolute top-2 right-2 p-2 rounded-lg bg-red-500/90 hover:bg-red-600 text-white transition"
                    >
                      <X size={16} />
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 px-3 py-2 rounded-lg bg-black/70 hover:bg-black/90 text-white text-xs transition"
                    >
                      Changer
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-48 border-2 border-dashed border-white/20 rounded-lg hover:border-orange-500/50 transition flex flex-col items-center justify-center gap-2 text-gray-400"
                  >
                    <Upload size={32} />
                    <p className="text-sm font-medium">
                      Cliquez pour sélectionner une image
                    </p>
                    <p className="text-xs">JPG, PNG ou WEBP · Max 5 MB</p>
                  </button>
                )}
              </div>

              {/* Titre */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Titre (FR) *
                  </label>
                  <input
                    type="text"
                    value={form.titre}
                    onChange={(e) =>
                      setForm({ ...form, titre: e.target.value })
                    }
                    placeholder="Ex: Espace d'accueil"
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Titre (MG)
                  </label>
                  <input
                    type="text"
                    value={form.titre_mg}
                    onChange={(e) =>
                      setForm({ ...form, titre_mg: e.target.value })
                    }
                    placeholder="Lohateny amin'ny teny malagasy"
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Description (FR)
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    rows={2}
                    placeholder="Description courte"
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Description (MG)
                  </label>
                  <textarea
                    value={form.description_mg}
                    onChange={(e) =>
                      setForm({ ...form, description_mg: e.target.value })
                    }
                    rows={2}
                    placeholder="Famintinana fohy"
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Catégorie + Ordre */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Catégorie *
                  </label>
                  <select
                    value={form.categorie}
                    onChange={(e) =>
                      setForm({ ...form, categorie: e.target.value })
                    }
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="espace">Espace</option>
                    <option value="equipement">Équipement</option>
                    <option value="services">Services</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    value={form.ordre}
                    onChange={(e) =>
                      setForm({ ...form, ordre: parseInt(e.target.value) || 0 })
                    }
                    min="0"
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Actif */}
              <div className="flex items-center gap-3 bg-[#0A1628] rounded-lg p-4">
                <input
                  type="checkbox"
                  id="actif-upload"
                  checked={form.actif}
                  onChange={(e) =>
                    setForm({ ...form, actif: e.target.checked })
                  }
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="actif-upload" className="text-sm cursor-pointer">
                  Publier immédiatement (visible sur le site)
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-[#112240] border-t border-white/10 p-5 flex gap-3 justify-end">
              <button
                onClick={fermerModalUpload}
                disabled={uploadEnCours}
                className="px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={uploaderPhoto}
                disabled={uploadEnCours || !fichier || !form.titre.trim()}
                className="px-6 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition disabled:opacity-50 flex items-center gap-2"
              >
                {uploadEnCours ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Upload...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Uploader
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL ÉDITION ===== */}
      {modalEdition && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => !uploadEnCours && setModalEdition(null)}
        >
          <div
            className="bg-[#112240] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#112240] border-b border-white/10 p-5 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <Edit size={20} className="text-orange-400" />
                </div>
                <h2 className="text-lg font-bold">Modifier la photo</h2>
              </div>
              <button
                onClick={() => setModalEdition(null)}
                disabled={uploadEnCours}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Aperçu */}
              <div>
                <img
                  src={modalEdition.image_url}
                  alt={modalEdition.titre}
                  className="w-full h-64 object-contain bg-[#0A1628] rounded-lg"
                />
              </div>

              {/* Titre */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Titre (FR) *
                  </label>
                  <input
                    type="text"
                    value={modalEdition.titre}
                    onChange={(e) =>
                      setModalEdition({
                        ...modalEdition,
                        titre: e.target.value,
                      })
                    }
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Titre (MG)
                  </label>
                  <input
                    type="text"
                    value={modalEdition.titre_mg}
                    onChange={(e) =>
                      setModalEdition({
                        ...modalEdition,
                        titre_mg: e.target.value,
                      })
                    }
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Description (FR)
                  </label>
                  <textarea
                    value={modalEdition.description}
                    onChange={(e) =>
                      setModalEdition({
                        ...modalEdition,
                        description: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Description (MG)
                  </label>
                  <textarea
                    value={modalEdition.description_mg}
                    onChange={(e) =>
                      setModalEdition({
                        ...modalEdition,
                        description_mg: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Catégorie + Ordre */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Catégorie
                  </label>
                  <select
                    value={modalEdition.categorie}
                    onChange={(e) =>
                      setModalEdition({
                        ...modalEdition,
                        categorie: e.target.value,
                      })
                    }
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="espace">Espace</option>
                    <option value="equipement">Équipement</option>
                    <option value="services">Services</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Ordre
                  </label>
                  <input
                    type="number"
                    value={modalEdition.ordre}
                    onChange={(e) =>
                      setModalEdition({
                        ...modalEdition,
                        ordre: parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Actif */}
              <div className="flex items-center gap-3 bg-[#0A1628] rounded-lg p-4">
                <input
                  type="checkbox"
                  id="actif-edit"
                  checked={modalEdition.actif}
                  onChange={(e) =>
                    setModalEdition({
                      ...modalEdition,
                      actif: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="actif-edit" className="text-sm cursor-pointer">
                  Photo active (visible sur le site)
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-[#112240] border-t border-white/10 p-5 flex gap-3 justify-end">
              <button
                onClick={() => setModalEdition(null)}
                disabled={uploadEnCours}
                className="px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={sauvegarderEdition}
                disabled={uploadEnCours}
                className="px-6 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition disabled:opacity-50 flex items-center gap-2"
              >
                {uploadEnCours ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
                <h2 className="text-lg font-bold">Supprimer la photo</h2>
                <p className="text-xs text-gray-400 truncate max-w-xs">
                  {modalSupprimer.titre}
                </p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-300">
                Cette action est <strong>irréversible</strong>. Le fichier sera
                supprimé du disque.
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