import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Archive,
  Star,
  ExternalLink,
  X,
  Save,
  TrendingUp,
  FileText,
  Clock,
} from "lucide-react";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function Blog() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [filtreCategorie, setFiltreCategorie] = useState("tous");
  const [recherche, setRecherche] = useState("");
  const [modalEdition, setModalEdition] = useState(null);
  const [modalSupprimer, setModalSupprimer] = useState(null);
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);

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

  // ===== CHARGEMENT =====
  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);

    const token = getToken();
    if (!token) {
      setErreur("Aucun token. Redirection...");
      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    try {
      // Stats
      const statsRes = await fetchAvecToken(`${API_URL}/blog/admin/stats`);
      if (statsRes.status === 401) {
        navigate("/login");
        return;
      }
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.stats);

      // Liste
      const params = new URLSearchParams();
      if (filtreStatut !== "tous") params.append("statut", filtreStatut);
      if (filtreCategorie !== "tous") params.append("categorie_id", filtreCategorie);
      if (recherche.trim()) params.append("recherche", recherche.trim());

      const listeRes = await fetchAvecToken(
        `${API_URL}/blog/admin/articles?${params.toString()}`
      );
      const listeData = await listeRes.json();
      if (listeData.success) {
        setArticles(listeData.articles || []);
        setCategories(listeData.categories || []);
      }
    } catch (err) {
      console.error("Erreur:", err);
      setErreur("Impossible de contacter le serveur");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, [filtreStatut, filtreCategorie]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (recherche.length === 0 || recherche.length >= 2) {
        chargerDonnees();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [recherche]);

  // ===== ACTIONS =====
  const nouvelArticle = () => {
    setModalEdition({
      id: null,
      titre: "",
      titre_mg: "",
      extrait: "",
      extrait_mg: "",
      contenu: "",
      contenu_mg: "",
      image_couverture: "",
      categorie_id: "",
      statut: "brouillon",
      a_la_une: false,
    });
  };

  const editerArticle = (article) => {
    setModalEdition({
      id: article.id,
      titre: article.titre || "",
      titre_mg: article.titre_mg || "",
      extrait: article.extrait || "",
      extrait_mg: article.extrait_mg || "",
      contenu: article.contenu || "",
      contenu_mg: article.contenu_mg || "",
      image_couverture: article.image_couverture || "",
      categorie_id: article.categorie_id || "",
      statut: article.statut || "brouillon",
      a_la_une: !!parseInt(article.a_la_une),
    });
  };

  const sauvegarder = async () => {
    if (!modalEdition.titre || !modalEdition.contenu) {
      alert("Titre et contenu requis");
      return;
    }

    setSauvegardeEnCours(true);

    try {
      const url = modalEdition.id
        ? `${API_URL}/blog/admin/modifier`
        : `${API_URL}/blog/admin/creer`;

      const res = await fetchAvecToken(url, {
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
      setSauvegardeEnCours(false);
    }
  };

  const supprimer = async () => {
    if (!modalSupprimer) return;

    try {
      const res = await fetchAvecToken(`${API_URL}/blog/admin/supprimer`, {
        method: "POST",
        body: JSON.stringify({ id: modalSupprimer.id }),
      });
      const data = await res.json();

      if (data.success) {
        setModalSupprimer(null);
        chargerDonnees();
      } else {
        alert(data.message || "Erreur");
      }
    } catch (err) {
      alert("Erreur serveur");
    }
  };

  // ===== HELPERS =====
  const getStatutBadge = (statut) => {
    const badges = {
      publie: {
        label: "Publié",
        color: "bg-green-500/10 text-green-400 border-green-500/30",
        icon: CheckCircle2,
      },
      brouillon: {
        label: "Brouillon",
        color: "bg-orange-500/10 text-orange-400 border-orange-500/30",
        icon: Clock,
      },
      archive: {
        label: "Archivé",
        color: "bg-gray-500/10 text-gray-400 border-gray-500/30",
        icon: Archive,
      },
    };
    return badges[statut] || badges.brouillon;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // ===== RENDER =====
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
              <BookOpen size={24} className="text-white" />
            </div>
            Blog & Actualités
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Gérez les articles de votre blog
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={chargerDonnees}
            disabled={chargement}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition disabled:opacity-50"
          >
            <RefreshCw size={16} className={chargement ? "animate-spin" : ""} />
            Actualiser
          </button>
          <button
            onClick={nouvelArticle}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition"
          >
            <Plus size={16} />
            Nouvel article
          </button>
        </div>
      </div>

      {/* STATS */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-[#112240] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <FileText size={14} /> Total
            </div>
            <p className="text-2xl font-bold">{stats.total || 0}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-green-500/20">
            <div className="flex items-center gap-2 text-xs text-green-400 mb-1">
              <CheckCircle2 size={14} /> Publiés
            </div>
            <p className="text-2xl font-bold text-green-400">
              {stats.publies || 0}
            </p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-orange-500/20">
            <div className="flex items-center gap-2 text-xs text-orange-400 mb-1">
              <Clock size={14} /> Brouillons
            </div>
            <p className="text-2xl font-bold text-orange-400">
              {stats.brouillons || 0}
            </p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-gray-500/20">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <Archive size={14} /> Archivés
            </div>
            <p className="text-2xl font-bold text-gray-400">
              {stats.archives || 0}
            </p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-cyan-500/20">
            <div className="flex items-center gap-2 text-xs text-cyan-400 mb-1">
              <TrendingUp size={14} /> Vues totales
            </div>
            <p className="text-2xl font-bold text-cyan-400">
              {parseInt(stats.total_vues || 0).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* FILTRES */}
      <div className="bg-[#112240] rounded-xl p-4 mb-6 border border-white/5">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un article..."
              className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-orange-500 focus:outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
              className="bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none transition"
            >
              <option value="tous">Tous les statuts</option>
              <option value="publie">Publiés</option>
              <option value="brouillon">Brouillons</option>
              <option value="archive">Archivés</option>
            </select>
            <select
              value={filtreCategorie}
              onChange={(e) => setFiltreCategorie(e.target.value)}
              className="bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none transition"
            >
              <option value="tous">Toutes catégories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nom}
                </option>
              ))}
            </select>
          </div>
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
      {chargement && articles.length === 0 ? (
        <div className="text-center py-20">
          <Loader2 size={40} className="animate-spin text-orange-500 mx-auto" />
          <p className="text-gray-400 mt-4">Chargement des articles...</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20 bg-[#112240] rounded-2xl border border-white/5">
          <BookOpen size={48} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun article</h3>
          <p className="text-sm text-gray-400 mb-4">
            {recherche || filtreStatut !== "tous" || filtreCategorie !== "tous"
              ? "Aucun résultat pour vos filtres"
              : "Commencez par créer votre premier article"}
          </p>
          <button
            onClick={nouvelArticle}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition"
          >
            <Plus size={16} />
            Créer un article
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => {
            const badge = getStatutBadge(article.statut);
            const BadgeIcon = badge.icon;

            return (
              <div
                key={article.id}
                className="bg-[#112240] rounded-xl p-4 border border-white/5 hover:border-orange-500/30 transition"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Image miniature */}
                  <div className="w-full md:w-32 h-24 rounded-lg bg-gradient-to-br from-[#1E40AF] to-[#06B6D4] flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {article.image_couverture ? (
                      <img
                        src={article.image_couverture}
                        alt={article.titre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen size={32} className="text-white/40" />
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${badge.color}`}
                      >
                        <BadgeIcon size={12} />
                        {badge.label}
                      </span>
                      {parseInt(article.a_la_une) === 1 && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 flex items-center gap-1">
                          <Star size={12} fill="currentColor" />
                          À la une
                        </span>
                      )}
                      {article.categorie_nom && (
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium text-white"
                          style={{
                            backgroundColor: article.categorie_couleur || "#06B6D4",
                          }}
                        >
                          {article.categorie_nom}
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                      {article.titre}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        <span>{formatDate(article.publie_le || article.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Eye size={12} />
                        <span>{article.vues} vues</span>
                      </div>
                      {article.auteur_nom && (
                        <div className="flex items-center gap-1.5">
                          <span>Par {article.auteur_nom}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap md:flex-col md:items-end">
                    {article.statut === "publie" && (
                      <a
                        href={`http://localhost:5173/blog/${article.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition"
                        title="Voir sur le site"
                      >
                        <ExternalLink size={18} />
                      </a>
                    )}
                    <button
                      onClick={() => editerArticle(article)}
                      className="p-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 transition"
                      title="Modifier"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => setModalSupprimer(article)}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== MODAL ÉDITION ===== */}
      {modalEdition && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => !sauvegardeEnCours && setModalEdition(null)}
        >
          <div
            className="bg-[#112240] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#112240] border-b border-white/10 p-5 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <Edit size={20} className="text-orange-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    {modalEdition.id ? "Modifier l'article" : "Nouvel article"}
                  </h2>
                  <p className="text-xs text-gray-400">
                    {modalEdition.id
                      ? `ID #${modalEdition.id}`
                      : "Créer un nouveau contenu"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalEdition(null)}
                disabled={sauvegardeEnCours}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenu */}
            <div className="p-5 space-y-4">
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
                    placeholder="Titre de l'article"
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none transition"
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
                    placeholder="Lohateny amin'ny teny malagasy"
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Extrait */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Extrait (FR)
                  </label>
                  <textarea
                    value={modalEdition.extrait}
                    onChange={(e) =>
                      setModalEdition({
                        ...modalEdition,
                        extrait: e.target.value,
                      })
                    }
                    rows={2}
                    placeholder="Résumé court de l'article"
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none transition resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Extrait (MG)
                  </label>
                  <textarea
                    value={modalEdition.extrait_mg}
                    onChange={(e) =>
                      setModalEdition({
                        ...modalEdition,
                        extrait_mg: e.target.value,
                      })
                    }
                    rows={2}
                    placeholder="Famintinana fohy"
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none transition resize-none"
                  />
                </div>
              </div>

              {/* Contenu */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Contenu (FR) * <span className="text-xs">— HTML autorisé</span>
                </label>
                <textarea
                  value={modalEdition.contenu}
                  onChange={(e) =>
                    setModalEdition({
                      ...modalEdition,
                      contenu: e.target.value,
                    })
                  }
                  rows={8}
                  placeholder="<h2>Titre</h2><p>Contenu...</p>"
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-3 px-4 text-white focus:border-orange-500 focus:outline-none transition font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Contenu (MG)
                </label>
                <textarea
                  value={modalEdition.contenu_mg}
                  onChange={(e) =>
                    setModalEdition({
                      ...modalEdition,
                      contenu_mg: e.target.value,
                    })
                  }
                  rows={5}
                  placeholder="<h2>Lohateny</h2><p>Votoatiny...</p>"
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-3 px-4 text-white focus:border-orange-500 focus:outline-none transition font-mono text-sm"
                />
              </div>

              {/* Image + Catégorie + Statut */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-sm text-gray-400 mb-2">
                    Image de couverture (URL)
                  </label>
                  <input
                    type="url"
                    value={modalEdition.image_couverture}
                    onChange={(e) =>
                      setModalEdition({
                        ...modalEdition,
                        image_couverture: e.target.value,
                      })
                    }
                    placeholder="https://..."
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Catégorie
                  </label>
                  <select
                    value={modalEdition.categorie_id}
                    onChange={(e) =>
                      setModalEdition({
                        ...modalEdition,
                        categorie_id: e.target.value,
                      })
                    }
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none transition"
                  >
                    <option value="">Aucune</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Statut
                  </label>
                  <select
                    value={modalEdition.statut}
                    onChange={(e) =>
                      setModalEdition({
                        ...modalEdition,
                        statut: e.target.value,
                      })
                    }
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none transition"
                  >
                    <option value="brouillon">Brouillon</option>
                    <option value="publie">Publié</option>
                    <option value="archive">Archivé</option>
                  </select>
                </div>
              </div>

              {/* À la une */}
              <div className="flex items-center gap-3 bg-[#0A1628] rounded-lg p-4">
                <input
                  type="checkbox"
                  id="a_la_une"
                  checked={modalEdition.a_la_une}
                  onChange={(e) =>
                    setModalEdition({
                      ...modalEdition,
                      a_la_une: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-500"
                />
                <label
                  htmlFor="a_la_une"
                  className="text-sm cursor-pointer flex items-center gap-2"
                >
                  <Star size={16} className="text-yellow-400" />
                  Mettre à la une (affiché en grand sur la page blog)
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-[#112240] border-t border-white/10 p-5 flex gap-3 justify-end">
              <button
                onClick={() => setModalEdition(null)}
                disabled={sauvegardeEnCours}
                className="px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={sauvegarder}
                disabled={sauvegardeEnCours}
                className="px-6 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition disabled:opacity-50 flex items-center gap-2"
              >
                {sauvegardeEnCours ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {modalEdition.id ? "Enregistrer" : "Créer"}
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
                <h2 className="text-lg font-bold">Supprimer l'article</h2>
                <p className="text-xs text-gray-400 truncate max-w-xs">
                  {modalSupprimer.titre}
                </p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-300">
                Cette action est irréversible. L'article sera définitivement
                supprimé.
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