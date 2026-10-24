import { Link } from "react-router-dom";
import {
  Star,
  CheckCircle2,
  ArrowRight,
  Info,
} from "lucide-react";
import { usePublicLang } from "../../context/PublicLangContext";

export default function Tarifs() {
  const { t } = usePublicLang();

  const forfaits = [
    {
      duree: "1 heure",
      prix: 500,
      description: "Idéal pour les petits besoins",
      populaire: false,
      avantages: [
        "Connexion Wi-Fi Starlink",
        "Débit jusqu'à 200 Mbps",
        "Accès illimité pendant 1h",
        "Impression possible (supplément)",
      ],
    },
    {
      duree: "2 heures",
      prix: 1000,
      description: "Le meilleur rapport qualité/prix",
      populaire: true,
      avantages: [
        "Connexion Wi-Fi Starlink",
        "Débit jusqu'à 200 Mbps",
        "Accès illimité pendant 2h",
        "5 impressions gratuites",
      ],
    },
    {
      duree: "4 heures",
      prix: 2000,
      description: "Parfait pour travailler",
      populaire: false,
      avantages: [
        "Connexion Wi-Fi Starlink",
        "Débit jusqu'à 200 Mbps",
        "Accès illimité pendant 4h",
        "10 impressions gratuites",
      ],
    },
    {
      duree: "Journée",
      prix: 5000,
      description: "Pour une journée entière",
      populaire: false,
      avantages: [
        "Connexion Wi-Fi Starlink",
        "Débit jusqu'à 200 Mbps",
        "Accès illimité (8h-22h)",
        "20 impressions gratuites",
      ],
    },
  ];

  const autresTarifs = [
    { service: "Impression A4 N/B", prix: "200 Ar/page" },
    { service: "Impression A4 couleur", prix: "500 Ar/page" },
    { service: "Photocopie A4 N/B", prix: "100 Ar/page" },
    { service: "Photocopie A4 couleur", prix: "400 Ar/page" },
    { service: "Scan (PDF)", prix: "300 Ar/document" },
    { service: "Photo d'identité", prix: "1 000 Ar (4 photos)" },
    { service: "Rédaction CV", prix: "2 000 Ar" },
    { service: "Retouche photo", prix: "1 500 Ar" },
  ];

  return (
    <div className="public-page">
      <section className="gradient-hero py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-[#06B6D4]/20 rounded-full blur-3xl" />
        </div>

        <div className="public-container relative text-center">
          <span className="section-badge anim-fade-up">
            {t("tarifsPage.badge")}
          </span>
          <h1 className="section-title anim-fade-up delay-100">
            {t("tarifsPage.titre")}
          </h1>
          <p className="section-subtitle anim-fade-up delay-200">
            {t("tarifsPage.sousTitre")}
          </p>
        </div>
      </section>

      <section className="py-20 bg-[#0A1628]">
        <div className="public-container">
          <h2 className="text-2xl font-bold text-center mb-12">
            {t("tarifsPage.titreForfaits")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {forfaits.map((forfait, i) => (
              <div
                key={i}
                className={`public-card relative anim-fade-up ${
                  forfait.populaire
                    ? "border-[#06B6D4] border-2 shadow-lg shadow-cyan-500/20 scale-105"
                    : ""
                }`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {forfait.populaire && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-[#0A1628] text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                    <Star size={12} fill="currentColor" />
                    {t("tarifsPage.populaire")}
                  </div>
                )}

                <div className="text-center mb-6">
                  <p className="text-sm text-gray-400 mb-2">
                    {forfait.description}
                  </p>
                  <h3 className="text-2xl font-bold mb-3">{forfait.duree}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold gradient-text">
                      {forfait.prix.toLocaleString("fr-FR")}
                    </span>
                    <span className="text-sm text-gray-400">Ar</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {forfait.avantages.map((av, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2 text-sm text-gray-300"
                    >
                      <CheckCircle2
                        size={16}
                        className="text-[#06B6D4] flex-shrink-0 mt-0.5"
                      />
                      <span>{av}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/portail"
                  className={`w-full justify-center ${
                    forfait.populaire
                      ? "btn-public-cyan"
                      : "btn-public-outline"
                  }`}
                >
                  {t("tarifsPage.choisir")}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#112240]">
        <div className="public-container">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">
              {t("tarifsPage.titreAutres")}
            </h2>
            <p className="text-gray-400">{t("tarifsPage.sousTitreAutres")}</p>
          </div>

          <div className="max-w-3xl mx-auto bg-[#0A1628] rounded-2xl border border-[#1E40AF]/20 overflow-hidden">
            <div className="grid grid-cols-2 divide-y divide-[#1E40AF]/20">
              {autresTarifs.map((tarif, i) => (
                <div key={i} className="contents">
                  <div className="p-4 flex items-center gap-3 border-r border-[#1E40AF]/20">
                    <Info size={16} className="text-[#06B6D4] flex-shrink-0" />
                    <span className="text-sm">{tarif.service}</span>
                  </div>
                  <div className="p-4 flex items-center justify-end">
                    <span className="font-semibold text-[#67E8F9]">
                      {tarif.prix}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#0A1628]">
        <div className="public-container">
          <div className="max-w-3xl mx-auto bg-gradient-to-br from-[#1E40AF] to-[#06B6D4] rounded-3xl p-10 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {t("tarifsPage.ctaTitre")}
            </h2>
            <p className="text-white/80 mb-6">
              {t("tarifsPage.ctaDescription")}
            </p>
            <Link
              to="/contact"
              className="bg-white text-[#1E40AF] font-semibold px-8 py-3 rounded-xl hover:bg-gray-100 transition inline-flex items-center gap-2"
            >
              {t("tarifsPage.ctaBouton")}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}