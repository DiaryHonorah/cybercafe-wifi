import { Ticket, Wifi, Rocket, ArrowRight } from "lucide-react";
import { usePublicLang } from "../context/PublicLangContext";
import Reveal from "./Reveal";

/**
 * Section "Comment ça marche" - 3 étapes simples
 * Bilingue FR/MG
 */
export default function CommentCaMarche() {
  const { t, langue } = usePublicLang();

  const etapes = [
    {
      numero: "01",
      icone: Ticket,
      titre: langue === "mg" ? "Mividiana tapakila" : "Achetez un ticket",
      description:
        langue === "mg"
          ? "Mankanesa any amin'ny fandraisana ary mividiana tapakila Wi-Fi manomboka amin'ny 500 Ar."
          : "Rendez-vous à l'accueil et achetez un ticket Wi-Fi à partir de 500 Ar.",
      couleur: "from-[#06B6D4] to-[#0891B2]",
    },
    {
      numero: "02",
      icone: Wifi,
      titre: langue === "mg" ? "Hiditra amin'ny Wi-Fi" : "Connectez-vous",
      description:
        langue === "mg"
          ? "Safidio ny réseau CYBER_FAMILLE ary ampidiro ny kaody sy ny teny miafina."
          : "Sélectionnez le réseau CYBER_FAMILLE et entrez le code + mot de passe du ticket.",
      couleur: "from-[#1E40AF] to-[#1D4ED8]",
    },
    {
      numero: "03",
      icone: Rocket,
      titre: langue === "mg" ? "Ankafizo ny Internet" : "Profitez d'Internet",
      description:
        langue === "mg"
          ? "Mandeha amin'ny Internet haingana Starlink mandritra ny fotoana voafaritra."
          : "Naviguez sur Internet ultra-rapide grâce à Starlink pendant toute la durée choisie.",
      couleur: "from-[#7C3AED] to-[#6D28D9]",
    },
  ];

  const titre =
    langue === "mg" ? "Ahoana ny fomba fiasa?" : "Comment ça marche ?";
  const sousTitre =
    langue === "mg"
      ? "Dingana 3 tsotra fotsiny"
      : "Seulement 3 étapes simples";

  return (
    <section className="py-20 bg-[#112240] relative overflow-hidden">
      {/* Décor de fond */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-[#06B6D4]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#1E40AF]/20 rounded-full blur-3xl" />
      </div>

      <div className="public-container relative">
        {/* En-tête */}
        <Reveal>
          <div className="text-center mb-16">
            <span className="section-badge">
              {langue === "mg" ? "Fizotra" : "Processus"}
            </span>
            <h2 className="section-title">{titre}</h2>
            <p className="section-subtitle">{sousTitre}</p>
          </div>
        </Reveal>

        {/* Étapes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Ligne de connexion (desktop uniquement) */}
          <div className="hidden md:block absolute top-20 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-[#06B6D4] via-[#1E40AF] to-[#7C3AED] opacity-30" />

          {etapes.map((etape, i) => (
            <Reveal key={i} delay={i * 0.15}>
              <div className="relative text-center group">
                {/* Numéro en arrière-plan */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[120px] font-black text-white/[0.03] select-none leading-none pointer-events-none">
                  {etape.numero}
                </div>

                {/* Icône */}
                <div
                  className={`relative inline-flex p-5 rounded-2xl bg-gradient-to-br ${etape.couleur} shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <etape.icone size={32} className="text-white" />

                  {/* Badge numéro */}
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#0A1628] border-2 border-[#06B6D4] flex items-center justify-center">
                    <span className="text-xs font-bold text-[#67E8F9]">
                      {i + 1}
                    </span>
                  </div>
                </div>

                {/* Titre + description */}
                <h3 className="text-lg font-bold mb-3">{etape.titre}</h3>
                <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
                  {etape.description}
                </p>

                {/* Flèche entre les étapes (desktop) */}
                {i < etapes.length - 1 && (
                  <div className="hidden md:block absolute top-20 -right-4 text-[#06B6D4]/50">
                    <ArrowRight size={24} />
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>

        {/* CTA final */}
        <Reveal delay={0.5}>
          <div className="text-center mt-16">
            <a
              href="/portail"
              className="btn-public-cyan justify-center inline-flex"
            >
              <Wifi size={18} />
              {langue === "mg"
                ? "Hanomboka izao"
                : "Commencer maintenant"}
              <ArrowRight size={18} />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}