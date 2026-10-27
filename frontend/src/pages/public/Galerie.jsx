import { useState, useEffect } from "react";
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
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  ImageOff,
} from "lucide-react";
import { usePublicLang } from "../../context/PublicLangContext";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function Galerie() {
  const { t, langue } = usePublicLang();
  const [photos, setPhotos] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [categorieActive, setCategorieActive] = useState("all");
  const [modalPhoto, setModalPhoto] = useState(null);
  const [modalIndex, setModalIndex] = useState(0);

  const categories = [
    { id: "all", labelKey: "galeriePage.filtreTout", icon: Camera },
    { id: "espace", labelKey: "galeriePage.filtreEspace", icon: Store },
    { id: "equipement", labelKey: "galeriePage.filtreEquipement", icon: Monitor },
    { id: "services", labelKey: "galeriePage.filtreServices", icon: Printer },
  ];

  useEffect(() => {
    chargerPhotos();
  }, []);

  const chargerPhotos = async () => {
    setChargement(true);
    try {
      const res = await fetch(`${API_URL}/galerie/photos`);
      const data = await res.json();
      if (data.success) {
        setPhotos(data.photos || []);
      }
    } catch (err) {
      setErreur("Impossible de charger la galerie");
    } finally {
      setChargement(false);
    }
  };

  const photosFiltrees =
    categorieActive === "all"
      ? photos
      : photos.filter((p) => p.categorie === categorieActive);

  const ouvrirModal = (photo, index) => {
    setModalPhoto(photo);
    setModalIndex(index);
  };

  const fermerModal = () => {
    setModalPhoto(null);
  };

  const photoPrecedente = () => {
    const newIndex = modalIndex > 0 ? modalIndex - 1 : photosFiltrees.length - 1;
    setModalIndex(newIndex);
    setModalPhoto(photosFiltrees[newIndex]);
  };

  const photoSuivante = () => {
    const newIndex = modalIndex < photosFiltrees.length - 1 ? modalIndex + 1 : 0;
    setModalIndex(newIndex);
    setModalPhoto(photosFiltrees[newIndex]);
  };

  // Navigation clavier
  useEffect(() => {
    if (!modalPhoto) return;

    const handleKey = (e) => {
      if (e.key === "Escape") fermerModal();
      if (e.key === "ArrowLeft") photoPrecedente();
      if (e.key === "ArrowRight") photoSuivante();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [modalPhoto, modalIndex]);

  const getTitre = (photo) => {
    if (langue === "mg" && photo.titre_mg) return photo.titre_mg;
    return photo.titre;
  };

  const getDescription = (photo) => {
    if (langue === "mg" && photo.description_mg) return photo.description_mg;
    return photo.description;
  };

  return (
    <div className="public-page">
      {/* ===== HERO ===== */}
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

      {/* ===== FILTRES ===== */}
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
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded text-xs ${
                    categorieActive === cat.id
                      ? "bg-white/20"
                      : "bg-white/10"
                  }`}
                >
                  {cat.id === "all"
                    ? photos.length
                    : photos.filter((p) => p.categorie === cat.id).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONTENU ===== */}
      <section className="py-20 bg-[#0A1628]">
        <div className="public-container">
          {erreur && (
            <div className="mb-8 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle size={20} />
              <p>{erreur}</p>
            </div>
          )}

          {chargement ? (
            <div className="text-center py-20">
              <Loader2
                size={40}
                className="animate-spin text-[#67E8F9] mx-auto"
              />
              <p className="text-gray-400 mt-4">Chargement de la galerie...</p>
            </div>
          ) : photosFiltrees.length === 0 ? (
            <div className="text-center py-20 bg-[#112240] rounded-2xl border border-[#1E40AF]/20">
              <ImageOff size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Aucune photo pour le moment
              </h3>
              <p className="text-sm text-gray-400">
                {t("galeriePage.messageTitre")}
              </p>
              <p className="text-xs text-gray-500 mt-2 max-w-md mx-auto">
                {t("galeriePage.messageDesc")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {photosFiltrees.map((photo, i) => (
                <div
                  key={photo.id}
                  onClick={() => ouvrirModal(photo, i)}
                  className="public-card cursor-pointer group overflow-hidden p-0 anim-fade-up hover:scale-[1.02] transition-transform"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="h-56 bg-[#0A1628] relative overflow-hidden">
                    <img
                      src={photo.image_url}
                      alt={getTitre(photo)}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-4 right-4 p-2 rounded-lg bg-black/40 backdrop-blur opacity-0 group-hover:opacity-100 transition">
                      <ZoomIn size={18} className="text-white" />
                    </div>
                    <div className="absolute top-4 left-4">
                      <span className="px-2 py-1 rounded-full bg-black/40 backdrop-blur text-xs text-white capitalize">
                        {photo.categorie}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-lg mb-1">
                      {getTitre(photo)}
                    </h3>
                    {getDescription(photo) && (
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {getDescription(photo)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== MODAL LIGHTBOX ===== */}
      {modalPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur flex items-center justify-center p-4"
          onClick={fermerModal}
        >
          {/* Bouton fermer */}
          <button
            onClick={fermerModal}
            className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition z-10"
          >
            <X size={24} />
          </button>

          {/* Précédent */}
          {photosFiltrees.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                photoPrecedente();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition z-10"
            >
              <ChevronLeft size={32} />
            </button>
          )}

          {/* Suivant */}
          {photosFiltrees.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                photoSuivante();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition z-10"
            >
              <ChevronRight size={32} />
            </button>
          )}

          {/* Image */}
          <div
            className="max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={modalPhoto.image_url}
              alt={getTitre(modalPhoto)}
              className="w-full h-auto max-h-[75vh] object-contain rounded-lg"
            />
            <div className="mt-4 text-center">
              <h3 className="text-white font-bold text-xl mb-1">
                {getTitre(modalPhoto)}
              </h3>
              {getDescription(modalPhoto) && (
                <p className="text-gray-400 text-sm">
                  {getDescription(modalPhoto)}
                </p>
              )}
              <p className="text-gray-500 text-xs mt-2">
                {modalIndex + 1} / {photosFiltrees.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}