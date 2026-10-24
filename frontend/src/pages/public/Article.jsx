import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Eye,
  User,
  Loader2,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Share2,
  MessageCircle,
  Link2,
  Check,
} from "lucide-react";
import { usePublicLang } from "../../context/PublicLangContext";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function Article() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { langue } = usePublicLang();
  const [article, setArticle] = useState(null);
  const [similaires, setSimilaires] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [copie, setCopie] = useState(false);

  const textes = {
    fr: {
      retour: "Retour au blog",
      articleNonTrouve: "Article non trouvé",
      articleNonTrouveDesc:
        "Cet article n'existe pas ou a été supprimé.",
      chargement: "Chargement de l'article...",
      erreur: "Impossible de charger l'article",
      par: "Par",
      vues: "vues",
      similaires: "Articles similaires",
      partager: "Partager",
      copie: "Lien copié !",
      voirTous: "Voir tous les articles",
    },
    mg: {
      retour: "Hiverina amin'ny blog",
      articleNonTrouve: "Tsy hita ny lahatsoratra",
      articleNonTrouveDesc: "Tsy misy na voafafa ity lahatsoratra ity.",
      chargement: "Mampiditra...",
      erreur: "Tsy afaka mampiditra",
      par: "Nosoratan'i",
      vues: "fijery",
      similaires: "Lahatsoratra mitovy",
      partager: "Zarao",
      copie: "Voadika ny rohy!",
      voirTous: "Hijery daholo",
    },
  };

  const t = textes[langue] || textes.fr;

  useEffect(() => {
    chargerArticle();
  }, [slug]);

  const chargerArticle = async () => {
    setChargement(true);
    setErreur(null);

    try {
      const res = await fetch(
        `${API_URL}/blog/article?slug=${encodeURIComponent(slug)}`
      );
      const data = await res.json();

      if (data.success) {
        setArticle(data.article);
        setSimilaires(data.similaires || []);
      } else {
        setErreur(data.message || t.articleNonTrouve);
      }
    } catch (err) {
      console.error("Erreur article:", err);
      setErreur(t.erreur);
    } finally {
      setChargement(false);
    }
  };

  const getTitre = (a) => {
    return langue === "mg" && a.titre_mg ? a.titre_mg : a.titre;
  };

  const getContenu = (a) => {
    return langue === "mg" && a.contenu_mg ? a.contenu_mg : a.contenu;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const copierLien = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const partagerFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        window.location.href
      )}`,
      "_blank",
      "width=600,height=400"
    );
  };

  // ===== CHARGEMENT =====
  if (chargement) {
    return (
      <div className="public-page min-h-screen bg-[#0A1628] flex items-center justify-center">
        <div className="text-center">
          <Loader2
            size={48}
            className="animate-spin text-[#67E8F9] mx-auto mb-4"
          />
          <p className="text-gray-400">{t.chargement}</p>
        </div>
      </div>
    );
  }

  // ===== ERREUR / NON TROUVÉ =====
  if (erreur || !article) {
    return (
      <div className="public-page min-h-screen bg-[#0A1628] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="inline-flex p-4 rounded-full bg-red-500/10 border border-red-500/30 mb-6">
            <AlertCircle size={48} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-3">{t.articleNonTrouve}</h1>
          <p className="text-gray-400 mb-8">{t.articleNonTrouveDesc}</p>
          <Link to="/blog" className="btn-public-cyan inline-flex">
            <ArrowLeft size={18} />
            {t.retour}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="public-page">
      {/* ===== HERO ARTICLE ===== */}
      <section className="gradient-hero py-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-[#06B6D4]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#1E40AF]/30 rounded-full blur-3xl" />
        </div>

        <div className="public-container relative">
          {/* Bouton retour */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-[#67E8F9] mb-6 transition"
          >
            <ArrowLeft size={16} />
            {t.retour}
          </Link>

          <div className="max-w-4xl mx-auto text-center">
            {/* Catégorie */}
            {article.categorie_nom && (
              <div className="mb-4 anim-fade-up">
                <span
                  className="inline-block px-4 py-1.5 rounded-full text-sm font-medium text-white"
                  style={{
                    backgroundColor: article.categorie_couleur || "#06B6D4",
                  }}
                >
                  {langue === "mg" && article.categorie_nom === "Actualités"
                    ? "Vaovao"
                    : article.categorie_nom}
                </span>
              </div>
            )}

            {/* Titre */}
            <h1 className="text-3xl md:text-5xl font-bold mb-6 anim-fade-up delay-100">
              {getTitre(article)}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400 anim-fade-up delay-200">
              <div className="flex items-center gap-1.5">
                <Calendar size={16} className="text-[#06B6D4]" />
                <span>{formatDate(article.publie_le)}</span>
              </div>
              {article.auteur_nom && (
                <div className="flex items-center gap-1.5">
                  <User size={16} className="text-[#06B6D4]" />
                  <span>
                    {t.par} {article.auteur_nom}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Eye size={16} className="text-[#06B6D4]" />
                <span>
                  {article.vues} {t.vues}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== IMAGE DE COUVERTURE ===== */}
      {article.image_couverture && (
        <section className="relative -mt-8 pb-8">
          <div className="public-container">
            <div className="max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-cyan-500/20 border border-[#1E40AF]/20">
              <img
                src={article.image_couverture}
                alt={getTitre(article)}
                className="w-full h-auto max-h-[500px] object-cover"
              />
            </div>
          </div>
        </section>
      )}

      {/* ===== CONTENU PRINCIPAL ===== */}
      <section className="py-12 bg-[#0A1628]">
        <div className="public-container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Article (2/3) */}
            <article className="lg:col-span-2">
              <div className="public-card p-6 md:p-10 anim-fade-up">
                {/* Extrait (chapeau) */}
                {(article.extrait || article.extrait_mg) && (
                  <div className="text-lg text-[#67E8F9] font-medium italic mb-6 pb-6 border-b border-[#1E40AF]/20">
                    {langue === "mg" && article.extrait_mg
                      ? article.extrait_mg
                      : article.extrait}
                  </div>
                )}

                {/* Contenu HTML */}
                <div
                  className="prose-article text-gray-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: getContenu(article) }}
                />

                {/* Partage */}
                <div className="mt-10 pt-6 border-t border-[#1E40AF]/20">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <p className="text-sm text-gray-400 font-medium">
                      {t.partager}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={partagerFacebook}
                        className="p-2.5 rounded-lg bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] transition"
                        title="Facebook"
                      >
                        <MessageCircle size={18} />
                      </button>
                      <button
                        onClick={copierLien}
                        className="p-2.5 rounded-lg bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20 text-[#67E8F9] transition"
                        title={copie ? t.copie : "Copier le lien"}
                      >
                        {copie ? <Check size={18} /> : <Link2 size={18} />}
                      </button>
                      {copie && (
                        <span className="text-xs text-[#22C55E]">
                          {t.copie}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bouton retour bas de page */}
              <div className="mt-8 text-center">
                <Link to="/blog" className="btn-public-outline inline-flex">
                  <ArrowLeft size={18} />
                  {t.retour}
                </Link>
              </div>
            </article>

            {/* Sidebar (1/3) — Articles similaires */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {similaires.length > 0 && (
                  <div className="public-card p-6 anim-fade-up delay-200">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <BookOpen size={20} className="text-[#67E8F9]" />
                      {t.similaires}
                    </h2>

                    <div className="space-y-4">
                      {similaires.map((s, i) => (
                        <Link
                          key={s.id}
                          to={`/blog/${s.slug}`}
                          className="group block pb-4 border-b border-[#1E40AF]/20 last:border-0 last:pb-0"
                        >
                          <div className="flex gap-3">
                            {/* Miniature */}
                            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-[#1E40AF] to-[#06B6D4] flex-shrink-0 overflow-hidden">
                              {s.image_couverture ? (
                                <img
                                  src={s.image_couverture}
                                  alt={getTitre(s)}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <BookOpen
                                    size={24}
                                    className="text-white/50"
                                  />
                                </div>
                              )}
                            </div>

                            {/* Texte */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm mb-1 line-clamp-2 group-hover:text-[#67E8F9] transition">
                                {getTitre(s)}
                              </h3>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Calendar size={10} />
                                <span>{formatDate(s.publie_le)}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>

                    <Link
                      to="/blog"
                      className="mt-4 pt-4 border-t border-[#1E40AF]/20 flex items-center justify-center gap-2 text-sm text-[#67E8F9] hover:gap-3 transition-all"
                    >
                      {t.voirTous}
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                )}

                {/* CTA Newsletter */}
                <div className="bg-gradient-to-br from-[#1E40AF] to-[#06B6D4] rounded-2xl p-6 text-center anim-fade-up delay-300">
                  <Share2 size={32} className="text-white/80 mx-auto mb-3" />
                  <h3 className="font-bold text-white mb-2">
                    {langue === "mg"
                      ? "Mahazoa ny vaovao"
                      : "Restez informé"}
                  </h3>
                  <p className="text-sm text-white/80 mb-4">
                    {langue === "mg"
                      ? "Misorata amin'ny newsletter"
                      : "Inscrivez-vous à la newsletter"}
                  </p>
                  <Link
                    to="/newsletter"
                    className="inline-flex items-center gap-2 bg-white text-[#1E40AF] font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition text-sm"
                  >
                    {langue === "mg" ? "Hisoratra" : "S'inscrire"}
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}