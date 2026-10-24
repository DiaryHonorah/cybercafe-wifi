import { useState, useRef } from "react";
import { Camera, Loader2, Trash2, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AvatarUpload({ size = "lg", showDelete = true, onUpdated }) {
  const { admin, rafraichirProfil } = useAuth();
  const [uploadEnCours, setUploadEnCours] = useState(false);
  const [erreur, setErreur] = useState(null);
  const inputRef = useRef(null);

  const tailles = {
    sm: "w-10 h-10 text-sm",
    md: "w-16 h-16 text-lg",
    lg: "w-24 h-24 text-2xl",
    xl: "w-32 h-32 text-4xl",
  };

  const tailleClass = tailles[size] || tailles.lg;

  const getToken = () =>
    localStorage.getItem("admin_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token");

  // Récupérer l'URL complète de l'avatar
  const getAvatarUrl = () => {
    if (!admin?.avatar_url) return null;
    return admin.avatar_url;
  };

  const avatarUrl = getAvatarUrl();
  const initiales = (admin?.nom || "A")
    .split(" ")
    .map((m) => m[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Upload
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadEnCours(true);
    setErreur(null);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch(
        "http://localhost/cybercafe-wifi/backend/api/profil/upload-avatar",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
          body: formData,
        }
      );

      const data = await res.json();

      if (data.success) {
        // Rafraîchir le profil
        await rafraichirProfil();
        if (onUpdated) onUpdated(data.avatar);
      } else {
        setErreur(data.message || "Erreur lors de l'upload");
      }
    } catch (err) {
      console.error("Erreur upload:", err);
      setErreur("Impossible de contacter le serveur");
    } finally {
      setUploadEnCours(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  // Supprimer
  const handleSupprimer = async () => {
    if (!confirm("Supprimer votre photo de profil ?")) return;

    setUploadEnCours(true);
    setErreur(null);

    try {
      const res = await fetch(
        "http://localhost/cybercafe-wifi/backend/api/profil/supprimer-avatar",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await res.json();

      if (data.success) {
        await rafraichirProfil();
        if (onUpdated) onUpdated(null);
      } else {
        setErreur(data.message);
      }
    } catch (err) {
      setErreur("Erreur serveur");
    } finally {
      setUploadEnCours(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative group">
        {/* Avatar */}
        <div
          className={`${tailleClass} rounded-full overflow-hidden border-2 border-white/20 bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-lg`}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={admin?.nom}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
          ) : null}
          <span
            className="flex items-center justify-center w-full h-full"
            style={{ display: avatarUrl ? "none" : "flex" }}
          >
            {initiales || <User size={20} />}
          </span>
        </div>

        {/* Overlay upload */}
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploadEnCours}
          className="absolute inset-0 rounded-full bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white disabled:cursor-not-allowed"
          title="Changer la photo"
        >
          {uploadEnCours ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <Camera size={24} />
          )}
        </button>

        {/* Badge upload */}
        {uploadEnCours && (
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-orange-500 border-2 border-[#112240] flex items-center justify-center">
            <Loader2 size={14} className="animate-spin text-white" />
          </div>
        )}
      </div>

      {/* Bouton supprimer */}
      {avatarUrl && showDelete && (
        <button
          onClick={handleSupprimer}
          disabled={uploadEnCours}
          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 disabled:opacity-50"
        >
          <Trash2 size={12} />
          Supprimer
        </button>
      )}

      {/* Erreur */}
      {erreur && (
        <p className="text-xs text-red-400 text-center max-w-[150px]">
          {erreur}
        </p>
      )}

      {/* Input caché */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}