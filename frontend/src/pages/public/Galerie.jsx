import { useState } from "react";
import {
  Camera,
  Wifi,
  Printer,
  Users,
  Monitor,
  Coffee,
  BookOpen,
  Store,
  ZoomIn,
  X,
} from "lucide-react";
import { usePublicLang } from "../../context/PublicLangContext";

export default function Galerie() {
  const { t } = usePublicLang();
  const [modal, setModal] = useState(null);
  const [categorieActive, setCategorieActive] = useState("all");

  const categories = [
    { id: "all", labelKey: "galeriePage.filtreTout", icon: Camera },
    { id: "espace", labelKey: "galeriePage.filtreEspace", icon: Store },
    { id: "equipement", labelKey: "galeriePage.filtreEquipement", icon: Monitor },
    { id: "services", labelKey: "galeriePage.filtreServices", icon: Printer },
  ];

  const photos = [
    {
      id: 1,
      titre: "Espace d'accueil",
      description: "Notre accueil chaleureux vous reçoit 7j/7",
      categorie: "espace",
      icone: Store,
      couleur: "from-[#1E40AF] to-[#06B6D4]",
    },
    {
      id: 2,
      titre: "Zone Wi-Fi Starlink",
      description: "Connexion ultra-rapide grâce à Starlink",
      categorie: "equipement",
      icone: Wifi,
      couleur: "from-[#06B6D4] to-[#0891B2]",
    },
    {
      id: 3,
      titre: "Espace impression",
      description: "Imprimantes professionnelles pour tous vos besoins",
      categorie: "services",
      icone: Printer,
      couleur: "from-[#7C3AED] to-[#6D28D9]",
    },
    {
      id: 4,
      titre: "Zone de travail",
      description: "Postes de travail confortables et climatisés",
      categorie: "espace",
      icone: Monitor,
      couleur: "from-[#22C55E] to-[#16A34A]",
    },
    {
      id: 5,
      titre: "Espace détente",
      description: "Boissons et snacks disponibles sur place",
      categorie: "espace",
      icone: Coffee,
      couleur: "from-[#F97316] to-[#EA580C]",
    },
    {
      id: 6,
      titre: "Coin étude",
      description: "Espace calme pour étudiants et chercheurs",
      categorie: "espace",
      icone: BookOpen,
      couleur: "from-[#EC4899] to-[#DB2777]",
    },
    {
      id: 7,
      titre: "Clients satisfaits",
      description: "Plus de 100 clients nous font confiance",
      categorie: "services",
      icone: Users,
      couleur: "from-[#06B6D4] to-[#1E40AF]",
    },
    {
      id: 8,
      titre: "Équipement réseau",
      description: "Routeur MikroTik pour une connexion stable",
      categorie: "equipement",
      icone: Wifi,
      couleur: "from-[#1E40AF] to-[#7C3AED]",
    },
    {
      id: 9,
      titre: "Photocopie & Scan",
      description: "Service rapide de photocopie et numérisation",
      categorie: "services",
      icone: Printer,
      couleur: "from-[#0891B2] to-[#22C55E]",
    },
  ];

  const photosFiltrees =
    categorieActive === "all"
      ? photos
      : photos.filter((p) => p.categorie === categorieActive);

  return (
    <div className="public-page">
      <section className="gradient-hero py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-72 h-72 bg-[#06B6D4]/20 rounded-full blur-3xl" />
        </div>

        <div className="public-container relative text-center">
          <span className="section-badge anim-fade-up">
            {t("galeriePage.badge")}
          </span>
          <h1 className="section-title anim-fade-up delay-100">
            {t("galeriePage.titre")}
          </h1>
          <p className="section-subtitle anim-fade-up delay-200">
            {t("galeriePage.sousTitre")}
          </p>
        </div>
      </section>

      <section className="py-12 bg-[#0A1628] border-b border-[#1E40AF]/20">
        <div className="public-container">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategorieActive(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition ${
                  categorieActive === cat.id
                    ? "bg-gradient-to-r from-[#1E40AF] to-[#06B6D4] text-white shadow-lg shadow-cyan-500/30"
                    : "bg-white/5 text-gray-300 hover:bg-white/10"
                }`}
              >
                <cat.icon size={16} />
                {t(cat.labelKey)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#0A1628]">
        <div className="public-container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photosFiltrees.map((photo, i) => (
              <div
                key={photo.id}
                onClick={() => setModal(photo)}
                className="public-card cursor-pointer group overflow-hidden p-0 anim-fade-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div
                  className={`h-56 bg-gradient-to-br ${photo.couleur} flex items-center justify-center relative overflow-hidden`}
                >
                  <photo.icone
                    size={80}
                    className="text-white/80 group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 p-2 rounded-lg bg-black/30 backdrop-blur opacity-0 group-hover:opacity-100 transition">
                    <ZoomIn size={18} className="text-white" />
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-lg mb-1">{photo.titre}</h3>
                  <p className="text-sm text-gray-400">{photo.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center bg-[#112240] border border-[#1E40AF]/20 rounded-2xl p-8">
            <Camera size={32} className="text-[#67E8F9] mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">
              {t("galeriePage.messageTitre")}
            </h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              {t("galeriePage.messageDesc")}
            </p>
          </div>
        </div>
      </section>

      {modal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-[#112240] rounded-2xl max-w-2xl w-full overflow-hidden border border-[#1E40AF]/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`h-80 bg-gradient-to-br ${modal.couleur} flex items-center justify-center relative`}
            >
              <modal.icone size={120} className="text-white/80" />
              <button
                onClick={() => setModal(null)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-black/40 backdrop-blur hover:bg-black/60 transition"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
            <div className="p-6">
              <h3 className="font-bold text-xl mb-2">{modal.titre}</h3>
              <p className="text-gray-400">{modal.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}