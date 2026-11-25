import { useState, useEffect } from "react";
import {
  Camera,
  X,
  ChevronLeft,
  ChevronRight,
  ThumbsUp, // ✅ Remplace Facebook
  Link,     // ✅ Remplace LinkIcon
  Download,
  Loader2,
  AlertCircle,
  ZoomIn,
  Image as ImageIcon,
  Share2,   // ✅ Remplace Twitter
} from "lucide-react";
import { usePublicLang } from "../../context/PublicLangContext";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function Galerie() {
  const { t } = usePublicLang();
  const [photos, setPhotos] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [filtreCategorie, setFiltreCategorie] = useState("toutes");
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [copie, setCopie] = useState(false);

  useEffect(() => {
    chargerPhotos();
  }, []);

  const chargerPhotos = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await fetch(`${API_URL}/galerie/photos`);
      const data = await res.json();
      if (data.success) {
        setPhotos(data.photos || []);
      } else {
        setErreur(data.message);
      }
    } catch (err) {
      setErreur("Impossible de charger la galerie");
    } finally {
      setChargement(false);
    }
  };

  const photosFiltrees = photos.filter((p) => {
    if (filtreCategorie === "toutes") return true;
    return p.categorie === filtreCategorie;
  });

  const ouvrirLightbox = (index) => {
    setLightboxIndex(index);
    document.body.style.overflow = "hidden";
  };

  const fermerLightbox = () => {
    setLightboxIndex(null);
    document.body.style.overflow = "auto";
  };

  const photoSuivante = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev + 1) % photosFiltrees.length);
  };

  const photoPrecedente = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev - 1 + photosFiltrees.length) % photosFiltrees.length);
  };

  // Gérer les touches du clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") fermerLightbox();
      if (e.key === "ArrowRight") photoSuivante();
      if (e.key === "ArrowLeft") photoPrecedente();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, photosFiltrees.length]);

  const copierLien = async (photo) => {
    const url = `${window.location.origin}${photo.image_url}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopie(true);
      setTimeout(() => setCopie(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const partagerFacebook = (photo) => {
    const url = encodeURIComponent(`${window.location.origin}${photo.image_url}`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
  };

  const partagerTwitter = (photo) => {
    const url = encodeURIComponent(`${window.location.origin}${photo.image_url}`);
    const text = encodeURIComponent(photo.titre || "Découvrez nos photos !");
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, "_blank");
  };

  const photoActuelle = lightboxIndex !== null ? photosFiltrees[lightboxIndex] : null;

  return (
    <div className="public-page">
      {/* HERO */}
      <section className="gradient-hero py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-72 h-72 bg-[#06B6D4]/20 rounded-full blur-3xl" />
        </div>

        <div className="public-container relative text-center">
          <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#1E40AF] mb-4 shadow-2xl">
            <Camera size={40} className="text-white" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            {t("galeriePage.titre")}
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t("galeriePage.sousTitre")}
          </p>
        </div>
      </section>

      {/* CONTENU */}
      <section className="py-16 bg-[#0A1628]">
        <div className="public-container">
          {/* Filtres */}
          <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
            {[
              { id: "toutes", label: t("galeriePage.filtreTout") },
              { id: "espace", label: t("galeriePage.filtreEspace") },
              { id: "equipement", label: t("galeriePage.filtreEquipement") },
              { id: "services", label: t("galeriePage.filtreServices") },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltreCategorie(f.id)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                  filtreCategorie === f.id
                    ? "bg-gradient-to-r from-[#06B6D4] to-[#1E40AF] text-white shadow-lg shadow-cyan-500/30"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {erreur && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle size={20} />
              <p>{erreur}</p>
            </div>
          )}

          {chargement ? (
            <div className="text-center py-20">
              <Loader2 size={40} className="animate-spin text-[#67E8F9] mx-auto" />
              <p className="text-gray-400 mt-4">Chargement des photos...</p>
            </div>
          ) : photosFiltrees.length === 0 ? (
            <div className="text-center py-20 bg-[#112240] rounded-2xl border border-white/5">
              <ImageIcon size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {t("galeriePage.messageTitre")}
              </h3>
              <p className="text-sm text-gray-400">
                {t("galeriePage.messageDesc")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photosFiltrees.map((photo, index) => (
                <div
                  key={photo.id}
                  onClick={() => ouvrirLightbox(index)}
                  className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer bg-[#112240] border border-white/5 hover:border-[#06B6D4]/50 transition-all duration-300"
                >
                  <img
                    src={photo.image_url}
                    alt={photo.titre || "Photo"}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="p-3 rounded-full bg-white/20 backdrop-blur">
                        <ZoomIn size={24} className="text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      {photo.titre && (
                        <h3 className="text-white font-bold text-sm truncate">
                          {photo.titre}
                        </h3>
                      )}
                      {photo.categorie && (
                        <p className="text-gray-300 text-xs capitalize">
                          {photo.categorie}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* LIGHTBOX */}
      {photoActuelle && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center"
          onClick={fermerLightbox}
        >
          {/* Bouton fermer */}
          <button
            onClick={fermerLightbox}
            className="absolute top-4 right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X size={24} />
          </button>

          {/* Navigation précédent */}
          {photosFiltrees.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                photoPrecedente();
              }}
              className="absolute left-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            >
              <ChevronLeft size={32} />
            </button>
          )}

          {/* Image */}
          <div
            className="relative max-w-5xl max-h-[85vh] mx-16"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photoActuelle.image_url}
              alt={photoActuelle.titre || "Photo"}
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
            />
            
            {/* Titre + actions */}
            <div className="mt-4 flex items-center justify-between gap-4 text-white">
              <div className="min-w-0">
                {photoActuelle.titre && (
                  <h3 className="font-bold text-lg truncate">
                    {photoActuelle.titre}
                  </h3>
                )}
                <p className="text-sm text-gray-400">
                  {lightboxIndex + 1} / {photosFiltrees.length}
                </p>
              </div>

              {/* Boutons de partage */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => partagerFacebook(photoActuelle)}
                  className="p-2.5 rounded-lg bg-[#1877F2]/20 hover:bg-[#1877F2]/40 text-[#1877F2] transition"
                  title="Partager sur Facebook"
                >
                  <ThumbsUp size={20} />
                </button>
                <button
                  onClick={() => partagerTwitter(photoActuelle)}
                  className="p-2.5 rounded-lg bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/40 text-[#1DA1F2] transition"
                  title="Partager sur Twitter / X"
                >
                  <Share2 size={20} />
                </button>
                <button
                  onClick={() => copierLien(photoActuelle)}
                  className={`p-2.5 rounded-lg transition ${
                    copie
                      ? "bg-green-500/20 text-green-400"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                  title="Copier le lien"
                >
                  <Link size={20} />
                </button>
                <a
                  href={photoActuelle.image_url}
                  download
                  className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                  title="Télécharger"
                >
                  <Download size={20} />
                </a>
              </div>
            </div>
          </div>

          {/* Navigation suivant */}
          {photosFiltrees.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                photoSuivante();
              }}
              className="absolute right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            >
              <ChevronRight size={32} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}