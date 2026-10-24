import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Calendar,
  Eye,
  ArrowRight,
  Loader2,
  AlertCircle,
  BookOpen,
  Newspaper,
  Filter,
} from "lucide-react";
import { usePublicLang } from "../../context/PublicLangContext";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function Blog() {
  const { langue } = usePublicLang();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [categorieActive, setCategorieActive] = useState("toutes");
  const [recherche, setRecherche] = useState("");
  const [articleUne, setArticleUne] = useState(null);

  const textes = {
    fr: {
      badge: "Blog & Actualités",
      titre: "Découvrez nos actualités",
      sousTitre:
        "Conseils, promotions et nouveautés de votre cybercafé à Ambalavao",
      toutes: "Toutes",
      recherchePlaceholder: "Rechercher un article...",
      aLaUne: "À la une",
      lireArticle: "Lire l'article",
      vues: "vues",
      aucunArticle: "Aucun article pour le moment",
      aucunResultat: "Aucun article trouvé",
      chargement: "Chargement des articles...",
      erreur: "Impossible de charger les articles",
      articlePar: "Par",
    },
    mg: {
      badge: "Blog & Vaovao",
      titre: "Fantaro ny vaovao",
      sousTitre:
        "Torohevitra, tolotra ary vaovao ao amin'ny cybercafé-nao ao Ambalavao",
      toutes: "Daholo",
      recherchePlaceholder: "Karohy ny lahatsoratra...",
      aLaUne: "Ambony indrindra",
      lireArticle: "Vakio",
      vues: "fijery",
      aucunArticle: "Tsy misy lahatsoratra",
      aucunResultat: "Tsy misy valiny",
      chargement: "Mampiditra...",
      erreur: "Tsy afaka mampiditra",
      articlePar: "Nosoratan'i",
    },
  };

  const t = textes[langue] || textes.fr;

  // Chargement initial
  useEffect(() => {
    chargerArticles();
  }, [categorieActive]);

  // Recherche avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (recherche.length === 0 || recherche.length >= 2) {
        chargerArticles();
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [recherche]);

  const chargerArticles = async () => {
    setChargement(true);
    setErreur(null);

    try {
      const params = new URLSearchParams();
      if (categorieActive !== "toutes") {
        params.append("categorie", categorieActive);
      }
      if (recherche.trim()) {
        params.append("recherche", recherche.trim());
      }

      const res = await fetch(
        `${API_URL}/blog/articles?${params.toString()}`
      );
      const data = await res.json();

      if (data.success) {
        // Séparer l'article à la une
        const une = data.articles.find((a) => parseInt(a.a_la_une) === 1);
        const autres = data.articles.filter((a) => a.id !== une?.id);

        // Si pas d'article à la une et qu'il y a des articles, prendre le premier
        if (!une && data.articles.length > 0) {
          setArticleUne(data.articles[0]);
          setArticles(data.articles.slice(1));
        } else {
          setArticleUne(une || null);
          setArticles(autres);
        }

        setCategories(data.categories || []);
      } else {
        setErreur(data.message || t.erreur);
      }
    } catch (err) {
      console.error("Erreur blog:", err);
      setErreur(t.erreur);
    } finally {
      setChargement(false);
    }
  };

  const getTitre = (article) => {
    return langue === "mg" && article.titre_mg
      ? article.titre_mg
      : article.titre;
  };

  const getExtrait = (article) => {
    const extrait =
      langue === "mg" && article.extrait_mg
        ? article.extrait_mg
        : article.extrait;
    return extrait || "";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString(langue === "mg" ? "fr-FR" : "fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="public-page">
      {/* ===== HERO ===== */}
      <section className="gradient-hero py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-[#06B6D4]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#1E40AF]/30 rounded-full blur-3xl" />
        </div>

        <div className="public-container relative text-center">
          <span className="section-badge anim-fade-up">{t.badge}</span>
          <h1 className="section-title anim-fade-up delay-100">{t.titre}</h1>
          <p className="section-subtitle anim-fade-up delay-200">
            {t.sousTitre}
          </p>

          {/* Barre de recherche */}
          <div className="max-w-xl mx-auto mt-8 anim-fade-up delay-300">
            <div className="relative">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder={t.recherchePlaceholder}
                className="w-full bg-white/10 backdrop-blur border border-white/20 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-400 focus:border-[#06B6D4] focus:bg-white/15 focus:outline-none transition"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== FILTRES CATÉGORIES ===== */}
      <section className="py-6 bg-[#0A1628] border-b border-[#1E40AF]/20 sticky top-16 z-30 backdrop-blur-lg bg-[#0A1628]/90">
        <div className="public-container">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Filter size={16} className="text-gray-400 flex-shrink-0" />
            <button
              onClick={() => setCategorieActive("toutes")}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                categorieActive === "toutes"
                  ? "bg-gradient-to-r from-[#06B6D4] to-[#1E40AF] text-white shadow-lg shadow-cyan-500/20"
                  : "bg-white/5 text-gray-300 hover:bg-white/10"
              }`}
            >
              {t.toutes}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategorieActive(cat.slug)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  categorieActive === cat.slug
                    ? "bg-gradient-to-r from-[#06B6D4] to-[#1E40AF] text-white shadow-lg shadow-cyan-500/20"
                    : "bg-white/5 text-gray-300 hover:bg-white/10"
                }`}
              >
                {langue === "mg" && cat.nom_mg ? cat.nom_mg : cat.nom}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONTENU ===== */}
      <section className="py-16 bg-[#0A1628]">
        <div className="public-container">
          {/* ERREUR */}
          {erreur && (
            <div className="mb-8 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle size={20} />
              <p>{erreur}</p>
            </div>
          )}

          {/* CHARGEMENT */}
          {chargement && articles.length === 0 && !articleUne ? (
            <div className="text-center py-20">
              <Loader2
                size={40}
                className="animate-spin text-[#67E8F9] mx-auto"
              />
              <p className="text-gray-400 mt-4">{t.chargement}</p>
            </div>
          ) : !articleUne && articles.length === 0 ? (
            <div className="text-center py-20 bg-[#112240] rounded-2xl border border-[#1E40AF]/20">
              <Newspaper size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {recherche ? t.aucunResultat : t.aucunArticle}
              </h3>
            </div>
          ) : (
            <>
              {/* ARTICLE À LA UNE */}
              {articleUne && (
                <div className="mb-12 anim-fade-up">
                  <Link
                    to={`/blog/${articleUne.slug}`}
                    className="group block bg-[#112240] rounded-3xl overflow-hidden border border-[#1E40AF]/20 hover:border-[#06B6D4]/50 transition"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                      {/* Image / Placeholder */}
                      <div className="relative h-64 lg:h-auto bg-gradient-to-br from-[#1E40AF] via-[#0891B2] to-[#06B6D4] flex items-center justify-center overflow-hidden">
                        {articleUne.image_couverture ? (
                          <img
                            src={articleUne.image_couverture}
                            alt={getTitre(articleUne)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <>
                            <BookOpen
                              size={80}
                              className="text-white/30 group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                          </>
                        )}
                        {/* Badge à la une */}
                        <div className="absolute top-4 left-4 bg-[#F97316] text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                          ⭐ {t.aLaUne}
                        </div>
                      </div>

                      {/* Contenu */}
                      <div className="p-8 lg:p-12 flex flex-col justify-center">
                        {/* Catégorie */}
                        {articleUne.categorie_nom && (
                          <div className="mb-4">
                            <span
                              className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white"
                              style={{
                                backgroundColor:
                                  articleUne.categorie_couleur || "#06B6D4",
                              }}
                            >
                              {langue === "mg" &&
                              articleUne.categorie_slug === "actualites"
                                ? "Vaovao"
                                : articleUne.categorie_nom}
                            </span>
                          </div>
                        )}

                        {/* Titre */}
                        <h2 className="text-2xl lg:text-3xl font-bold mb-4 group-hover:text-[#67E8F9] transition line-clamp-3">
                          {getTitre(articleUne)}
                        </h2>

                        {/* Extrait */}
                        {getExtrait(articleUne) && (
                          <p className="text-gray-400 mb-6 line-clamp-3">
                            {getExtrait(articleUne)}
                          </p>
                        )}

                        {/* Meta */}
                        <div className="flex items-center justify-between pt-4 border-t border-[#1E40AF]/20">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={14} />
                              <span>
                                {formatDate(articleUne.publie_le)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Eye size={14} />
                              <span>
                                {articleUne.vues} {t.vues}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-[#67E8F9] font-medium group-hover:gap-3 transition-all">
                            <span className="text-sm">{t.lireArticle}</span>
                            <ArrowRight size={18} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {/* GRILLE DES AUTRES ARTICLES */}
              {articles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {articles.map((article, i) => (
                    <Link
                      key={article.id}
                      to={`/blog/${article.slug}`}
                      className="group bg-[#112240] rounded-2xl overflow-hidden border border-[#1E40AF]/20 hover:border-[#06B6D4]/50 transition anim-fade-up"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      {/* Image */}
                      <div className="h-48 bg-gradient-to-br from-[#1E40AF] to-[#06B6D4] flex items-center justify-center relative overflow-hidden">
                        {article.image_couverture ? (
                          <img
                            src={article.image_couverture}
                            alt={getTitre(article)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <Newspaper
                            size={60}
                            className="text-white/30 group-hover:scale-110 transition-transform duration-500"
                          />
                        )}

                        {/* Catégorie sur l'image */}
                        {article.categorie_nom && (
                          <div className="absolute top-3 left-3">
                            <span
                              className="inline-block px-2.5 py-1 rounded-full text-xs font-medium text-white"
                              style={{
                                backgroundColor:
                                  article.categorie_couleur || "#06B6D4",
                              }}
                            >
                              {article.categorie_nom}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Contenu */}
                      <div className="p-5">
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-[#67E8F9] transition">
                          {getTitre(article)}
                        </h3>

                        {getExtrait(article) && (
                          <p className="text-sm text-gray-400 mb-4 line-clamp-3">
                            {getExtrait(article)}
                          </p>
                        )}

                        {/* Meta */}
                        <div className="flex items-center justify-between pt-3 border-t border-[#1E40AF]/20 text-xs text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} />
                            <span>{formatDate(article.publie_le)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Eye size={12} />
                            <span>{article.vues}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}