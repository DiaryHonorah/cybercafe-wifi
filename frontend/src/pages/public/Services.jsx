import { Link } from "react-router-dom";
import {
  Wifi,
  Printer,
  Copy,
  Scan,
  FileText,
  CreditCard,
  Smartphone,
  Palette,
  Camera,
  Mail,
  Music,
  BookOpen,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { usePublicLang } from "../../context/PublicLangContext";

export default function Services() {
  const { t } = usePublicLang();

  const services = [
    {
      icon: Wifi,
      titre: "Wi-Fi Starlink Haut Débit",
      description:
        "Profitez d'une connexion Internet ultra rapide grâce à la technologie satellite Starlink. Idéal pour naviguer, regarder des vidéos, télétravailler.",
      caracteristiques: [
        "Débit jusqu'à 200 Mbps",
        "Latence très faible",
        "Connexion stable même par mauvais temps",
        "Couverture dans tout le cybercafé",
      ],
      couleur: "cyan",
    },
    {
      icon: Printer,
      titre: "Impression",
      description:
        "Service d'impression haute qualité, noir et blanc ou couleur. Tous formats disponibles.",
      caracteristiques: [
        "Format A4, A3",
        "Noir/blanc et couleur",
        "Impression recto-verso",
        "Tarifs abordables",
      ],
      couleur: "blue",
    },
    {
      icon: Copy,
      titre: "Photocopie",
      description:
        "Photocopies rapides et économiques de vos documents importants.",
      caracteristiques: [
        "Photocopie noir/blanc",
        "Photocopie couleur",
        "Agrandissement / réduction",
        "Service rapide",
      ],
      couleur: "purple",
    },
    {
      icon: Scan,
      titre: "Numérisation (Scan)",
      description:
        "Scannez vos documents en haute qualité et recevez-les par email ou sur clé USB.",
      caracteristiques: [
        "Scan haute résolution",
        "Format PDF ou image",
        "Envoi par email",
        "Transfert sur USB",
      ],
      couleur: "green",
    },
    {
      icon: FileText,
      titre: "Rédaction de documents",
      description:
        "Besoin d'aide pour rédiger un CV, une lettre de motivation ou un document ?",
      caracteristiques: [
        "CV professionnel",
        "Lettre de motivation",
        "Documents administratifs",
        "Mise en page soignée",
      ],
      couleur: "orange",
    },
    {
      icon: Palette,
      titre: "Retouche photo",
      description: "Retouche, montage et impression de vos photos souvenirs.",
      caracteristiques: [
        "Retouche basique",
        "Montage photo",
        "Impression photo",
        "Formats variés",
      ],
      couleur: "pink",
    },
    {
      icon: CreditCard,
      titre: "Paiement en ligne",
      description:
        "Aide pour effectuer vos paiements en ligne en toute sécurité.",
      caracteristiques: [
        "Assistance personnalisée",
        "Paiement sécurisé",
        "Consultation de solde",
        "Opérations diverses",
      ],
      couleur: "blue",
    },
    {
      icon: Mail,
      titre: "Création email & réseaux",
      description:
        "Création et gestion de vos comptes email et réseaux sociaux.",
      caracteristiques: [
        "Création de compte Gmail",
        "Configuration Facebook",
        "Assistance personnalisée",
        "Sécurisation du compte",
      ],
      couleur: "cyan",
    },
    {
      icon: Music,
      titre: "Téléchargement",
      description:
        "Téléchargement de musiques, vidéos, logiciels et applications.",
      caracteristiques: [
        "Musiques MP3",
        "Vidéos haute qualité",
        "Applications Android",
        "Logiciels PC",
      ],
      couleur: "purple",
    },
    {
      icon: BookOpen,
      titre: "Aide scolaire",
      description:
        "Aide pour vos recherches scolaires et impression de vos devoirs.",
      caracteristiques: [
        "Recherches en ligne",
        "Impression de devoirs",
        "Rédaction de rapports",
        "Soutien scolaire",
      ],
      couleur: "green",
    },
    {
      icon: Smartphone,
      titre: "Configuration mobile",
      description: "Configuration de votre smartphone Android ou iPhone.",
      caracteristiques: [
        "Installation d'applications",
        "Configuration réseau",
        "Sauvegarde données",
        "Nettoyage du téléphone",
      ],
      couleur: "orange",
    },
    {
      icon: Camera,
      titre: "Service photo",
      description: "Prise de photos, impression et cadre photo personnalisé.",
      caracteristiques: [
        "Photos d'identité",
        "Impression premium",
        "Cadres personnalisés",
        "Retouche incluse",
      ],
      couleur: "pink",
    },
  ];

  const couleurMap = {
    cyan: "from-[#06B6D4] to-[#0891B2]",
    blue: "from-[#1E40AF] to-[#1D4ED8]",
    purple: "from-[#7C3AED] to-[#6D28D9]",
    green: "from-[#22C55E] to-[#16A34A]",
    orange: "from-[#F97316] to-[#EA580C]",
    pink: "from-[#EC4899] to-[#DB2777]",
  };

  return (
    <div className="public-page">
      <section className="gradient-hero py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-[#06B6D4]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#1E40AF]/30 rounded-full blur-3xl" />
        </div>

        <div className="public-container relative text-center">
          <span className="section-badge anim-fade-up">
            {t("servicesPage.badge")}
          </span>
          <h1 className="section-title anim-fade-up delay-100">
            {t("servicesPage.titre")}
          </h1>
          <p className="section-subtitle anim-fade-up delay-200">
            {t("servicesPage.sousTitre")}
          </p>
        </div>
      </section>

      <section className="py-20 bg-[#0A1628]">
        <div className="public-container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <div
                key={i}
                className="public-card anim-fade-up group"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div
                  className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${
                    couleurMap[service.couleur]
                  } mb-4 group-hover:scale-110 transition-transform`}
                >
                  <service.icon size={24} className="text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{service.titre}</h3>
                <p className="text-sm text-gray-400 mb-4">
                  {service.description}
                </p>
                <ul className="space-y-2">
                  {service.caracteristiques.map((car, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2 text-xs text-gray-300"
                    >
                      <CheckCircle2
                        size={14}
                        className="text-[#06B6D4] flex-shrink-0 mt-0.5"
                      />
                      <span>{car}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#112240]">
        <div className="public-container text-center">
          <h2 className="section-title">{t("servicesPage.ctaTitre")}</h2>
          <p className="section-subtitle mb-8">
            {t("servicesPage.ctaSousTitre")}
          </p>
          <Link to="/contact" className="btn-public-cyan">
            {t("servicesPage.ctaBouton")}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}