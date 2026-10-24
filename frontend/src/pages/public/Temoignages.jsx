import { Link } from "react-router-dom";
import {
  Star,
  Quote,
  ArrowRight,
  MessageSquare,
  ThumbsUp,
  Award,
} from "lucide-react";
import { usePublicLang } from "../../context/PublicLangContext";

export default function Temoignages() {
  const { t } = usePublicLang();

  const temoignages = [
    {
      nom: "Rakoto Jean",
      role: "Étudiant",
      ville: "Ambalavao",
      note: 5,
      texte:
        "Le Wi-Fi est vraiment très rapide grâce à Starlink. J'ai pu télécharger tous mes cours en un rien de temps. Le personnel est très accueillant.",
      avatar: "R",
      couleur: "from-[#1E40AF] to-[#06B6D4]",
    },
    {
      nom: "Randria Marie",
      role: "Commerçante",
      ville: "Ambalavao",
      note: 5,
      texte:
        "J'utilise Cyber Famille pour imprimer mes factures et documents professionnels. Le service est rapide et les tarifs très abordables. Je recommande vivement !",
      avatar: "M",
      couleur: "from-[#7C3AED] to-[#EC4899]",
    },
    {
      nom: "Soloniaina Paul",
      role: "Enseignant",
      ville: "Fianarantsoa",
      note: 5,
      texte:
        "Je viens de Fianarantsoa spécialement pour ce cybercafé. La connexion est stable et le cadre agréable. Parfait pour mes recherches et impressions.",
      avatar: "P",
      couleur: "from-[#22C55E] to-[#06B6D4]",
    },
  ];

  const stats = [
    { valeur: "100+", labelKey: "temoignagesPage.statClients", icon: ThumbsUp },
    { valeur: "4.9/5", labelKey: "temoignagesPage.statNote", icon: Star },
    { valeur: "7j/7", labelKey: "temoignagesPage.statOuvert", icon: Award },
  ];

  return (
    <div className="public-page">
      <section className="gradient-hero py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-[#06B6D4]/20 rounded-full blur-3xl" />
        </div>

        <div className="public-container relative text-center">
          <span className="section-badge anim-fade-up">
            {t("temoignagesPage.badge")}
          </span>
          <h1 className="section-title anim-fade-up delay-100">
            {t("temoignagesPage.titre")}
          </h1>
          <p className="section-subtitle anim-fade-up delay-200">
            {t("temoignagesPage.sousTitre")}
          </p>
        </div>
      </section>

      <section className="py-12 bg-[#0A1628] border-b border-[#1E40AF]/20">
        <div className="public-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="text-center anim-fade-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="inline-flex p-3 rounded-2xl bg-[#06B6D4]/10 border border-[#06B6D4]/30 mb-3">
                  <stat.icon size={24} className="text-[#67E8F9]" />
                </div>
                <p className="text-3xl font-bold gradient-text mb-1">
                  {stat.valeur}
                </p>
                <p className="text-sm text-gray-400">{t(stat.labelKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#0A1628]">
        <div className="public-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {temoignages.map((item, i) => (
              <div
                key={i}
                className="public-card relative anim-fade-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="absolute -top-3 left-6 p-2 rounded-lg bg-gradient-to-br from-[#1E40AF] to-[#06B6D4]">
                  <Quote size={16} className="text-white" fill="currentColor" />
                </div>

                <div className="flex gap-1 mb-4 mt-2">
                  {[...Array(item.note)].map((_, j) => (
                    <Star
                      key={j}
                      size={16}
                      className="text-[#FACC15]"
                      fill="currentColor"
                    />
                  ))}
                </div>

                <p className="text-gray-300 text-sm mb-6 leading-relaxed italic">
                  "{item.texte}"
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-[#1E40AF]/20">
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${item.couleur} flex items-center justify-center text-white font-bold text-lg`}
                  >
                    {item.avatar}
                  </div>
                  <div>
                    <p className="font-semibold">{item.nom}</p>
                    <p className="text-xs text-gray-400">
                      {item.role} · {item.ville}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#112240]">
        <div className="public-container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex p-4 rounded-2xl bg-[#06B6D4]/10 border border-[#06B6D4]/30 mb-6 anim-float">
              <MessageSquare size={32} className="text-[#67E8F9]" />
            </div>
            <h2 className="text-2xl font-bold mb-4">
              {t("temoignagesPage.ctaTitre")}
            </h2>
            <p className="text-gray-400 mb-8">
              {t("temoignagesPage.ctaDescription")}
            </p>
            <Link to="/contact" className="btn-public-cyan">
              {t("temoignagesPage.ctaBouton")}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}