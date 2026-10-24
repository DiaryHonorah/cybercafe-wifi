import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  HelpCircle,
  Wifi,
  CreditCard,
  Clock,
  Printer,
  Smartphone,
  MapPin,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { usePublicLang } from "../../context/PublicLangContext";

export default function FAQ() {
  const { t } = usePublicLang();
  const [ouvert, setOuvert] = useState(0);

  const questions = [
    {
      icone: Wifi,
      question: "Comment se connecter au Wi-Fi ?",
      reponse:
        "C'est très simple ! Achetez un ticket à l'accueil (à partir de 500 Ar), puis connectez-vous au réseau CYBER_FAMILLE et entrez le code + mot de passe indiqués sur votre ticket. Vous serez automatiquement connecté.",
    },
    {
      icone: CreditCard,
      question: "Combien coûte une heure de connexion ?",
      reponse:
        "Nos tarifs commencent à 500 Ar pour 1 heure, 1 000 Ar pour 2 heures, 2 000 Ar pour 4 heures et 5 000 Ar pour la journée complète (8h-22h).",
    },
    {
      icone: Clock,
      question: "Le Wi-Fi fonctionne-t-il la nuit ?",
      reponse:
        "Nous sommes ouverts tous les jours de 8h à 22h, y compris le week-end. Le cybercafé ferme la nuit mais vous pouvez acheter des tickets journée pour profiter de la connexion toute la journée.",
    },
    {
      icone: Printer,
      question: "Puis-je imprimer mes documents ?",
      reponse:
        "Absolument ! Nous proposons l'impression noir/blanc (200 Ar/page) et couleur (500 Ar/page) au format A4 et A3. Vous pouvez aussi photocopier et scanner vos documents.",
    },
    {
      icone: Smartphone,
      question: "Acceptez-vous les paiements mobiles ?",
      reponse:
        "Oui, nous acceptons les paiements en espèces (Ariary) et bientôt les paiements mobiles (MVola, Orange Money). Restez connectés pour plus d'informations !",
    },
    {
      icone: Wifi,
      question: "Y a-t-il une limite de téléchargement ?",
      reponse:
        "Non, il n'y a aucune limite de téléchargement ! Profitez d'Internet sans restriction pendant toute la durée de votre forfait, grâce à la connexion Starlink haut débit.",
    },
    {
      icone: Clock,
      question: "Puis-je réserver un poste à l'avance ?",
      reponse:
        "Bien sûr ! Appelez-nous au +261 34 22 489 66 pour réserver votre poste. Nous vous garderons une place jusqu'à 30 minutes après l'heure prévue.",
    },
    {
      icone: MapPin,
      question: "Où êtes-vous situés exactement ?",
      reponse:
        "Nous sommes situés à Ambalavao 303, dans la région Haute Matsiatra (Fianarantsoa). Facilement accessible depuis le centre-ville. Contactez-nous pour plus d'itinéraires.",
    },
    {
      icone: HelpCircle,
      question: "Que faire si je perds mon ticket ?",
      reponse:
        "Malheureusement, les tickets perdus ne peuvent pas être remplacés car ils sont uniques. Cependant, si vous avez encore du temps restant sur votre session en cours, elle continuera de fonctionner jusqu'à expiration.",
    },
    {
      icone: Printer,
      question: "Puis-je imprimer en couleur ?",
      reponse:
        "Oui ! Nous proposons l'impression couleur haute qualité (500 Ar/page A4). Idéal pour vos photos, présentations et documents professionnels.",
    },
    {
      icone: Smartphone,
      question: "Puis-je utiliser mon propre ordinateur ?",
      reponse:
        "Absolument ! Vous pouvez venir avec votre ordinateur portable, tablette ou smartphone. Le Wi-Fi fonctionne avec tous les appareils compatibles Wi-Fi.",
    },
    {
      icone: HelpCircle,
      question: "Proposez-vous des réductions pour groupes ?",
      reponse:
        "Oui, nous avons des tarifs préférentiels pour les groupes (écoles, entreprises, associations). Contactez-nous au +261 34 22 489 66 pour discuter d'une offre personnalisée.",
    },
  ];

  return (
    <div className="public-page">
      <section className="gradient-hero py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-72 h-72 bg-[#06B6D4]/20 rounded-full blur-3xl" />
        </div>

        <div className="public-container relative text-center">
          <span className="section-badge anim-fade-up">
            {t("faqPage.badge")}
          </span>
          <h1 className="section-title anim-fade-up delay-100">
            {t("faqPage.titre")}
          </h1>
          <p className="section-subtitle anim-fade-up delay-200">
            {t("faqPage.sousTitre")}
          </p>
        </div>
      </section>

      <section className="py-20 bg-[#0A1628]">
        <div className="public-container max-w-4xl">
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div
                key={i}
                className={`bg-[#112240] rounded-2xl border transition-all anim-fade-up ${
                  ouvert === i
                    ? "border-[#06B6D4]/50 shadow-lg shadow-cyan-500/10"
                    : "border-[#1E40AF]/20 hover:border-[#06B6D4]/30"
                }`}
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                <button
                  onClick={() => setOuvert(ouvert === i ? -1 : i)}
                  className="w-full flex items-center gap-4 p-5 text-left"
                >
                  <div
                    className={`p-2.5 rounded-xl flex-shrink-0 transition ${
                      ouvert === i
                        ? "bg-gradient-to-br from-[#1E40AF] to-[#06B6D4]"
                        : "bg-[#06B6D4]/10"
                    }`}
                  >
                    <q.icone
                      size={18}
                      className={
                        ouvert === i ? "text-white" : "text-[#67E8F9]"
                      }
                    />
                  </div>
                  <span className="flex-1 font-medium text-sm md:text-base">
                    {q.question}
                  </span>
                  <ChevronDown
                    size={20}
                    className={`flex-shrink-0 text-[#67E8F9] transition-transform ${
                      ouvert === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {ouvert === i && (
                  <div className="px-5 pb-5 pl-16">
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {q.reponse}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#112240]">
        <div className="public-container">
          <div className="max-w-3xl mx-auto bg-gradient-to-br from-[#1E40AF] to-[#06B6D4] rounded-3xl p-10 text-center">
            <MessageSquare size={40} className="text-white/80 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">
              {t("faqPage.ctaTitre")}
            </h2>
            <p className="text-white/80 mb-6">
              {t("faqPage.ctaDescription")}
            </p>
            <Link
              to="/contact"
              className="bg-white text-[#1E40AF] font-semibold px-8 py-3 rounded-xl hover:bg-gray-100 transition inline-flex items-center gap-2"
            >
              {t("faqPage.ctaBouton")}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}