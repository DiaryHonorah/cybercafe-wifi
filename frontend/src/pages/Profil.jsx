import { useState } from "react";
import {
  User,
  Mail,
  Lock,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AvatarUpload from "../components/AvatarUpload";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function Profil() {
  const { admin, rafraichirProfil } = useAuth();
  const [nom, setNom] = useState(admin?.nom || "");
  const [email, setEmail] = useState(admin?.email || "");
  const [ancienMdp, setAncienMdp] = useState("");
  const [nouveauMdp, setNouveauMdp] = useState("");
  const [confirmerMdp, setConfirmerMdp] = useState("");
  const [showAncien, setShowAncien] = useState(false);
  const [showNouveau, setShowNouveau] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [message, setMessage] = useState(null);

  const getToken = () =>
    localStorage.getItem("admin_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token");

  const afficherMessage = (type, texte) => {
    setMessage({ type, texte });
    setTimeout(() => setMessage(null), 5000);
  };

  const sauvegarderInfos = async (e) => {
    e.preventDefault();
    setChargement(true);

    try {
      const res = await fetch(`${API_URL}/profil/modifier`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nom, email }),
      });

      const data = await res.json();

      if (data.success) {
        await rafraichirProfil();
        afficherMessage("succes", "Profil mis à jour avec succès");
      } else {
        afficherMessage("erreur", data.message);
      }
    } catch (err) {
      afficherMessage("erreur", "Erreur serveur");
    } finally {
      setChargement(false);
    }
  };

  const changerMotDePasse = async (e) => {
    e.preventDefault();

    if (nouveauMdp !== confirmerMdp) {
      afficherMessage("erreur", "Les mots de passe ne correspondent pas");
      return;
    }

    if (nouveauMdp.length < 8) {
      afficherMessage("erreur", "Le mot de passe doit faire 8 caractères minimum");
      return;
    }

    setChargement(true);

    try {
      const res = await fetch(`${API_URL}/profil/changer-mot-de-passe`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ancien_mot_de_passe: ancienMdp,
          nouveau_mot_de_passe: nouveauMdp,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setAncienMdp("");
        setNouveauMdp("");
        setConfirmerMdp("");
        afficherMessage("succes", "Mot de passe modifié avec succès");
      } else {
        afficherMessage("erreur", data.message);
      }
    } catch (err) {
      afficherMessage("erreur", "Erreur serveur");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
            <User size={24} className="text-white" />
          </div>
          Mon profil
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Gérez votre photo, vos informations et votre mot de passe
        </p>
      </div>

      {/* Message global */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === "succes"
              ? "bg-green-500/10 border border-green-500/30 text-green-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {message.type === "succes" ? (
            <CheckCircle2 size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <p>{message.texte}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ===== COLONNE AVATAR ===== */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#112240] rounded-2xl p-6 border border-white/5 text-center">
            <h2 className="text-lg font-bold mb-4">Photo de profil</h2>
            <div className="flex justify-center mb-4">
              <AvatarUpload size="xl" showDelete={true} />
            </div>
            <p className="text-xs text-gray-500">
              JPG, PNG ou WEBP · Max 2 MB
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Cliquez sur la photo pour la changer
            </p>
          </div>

          {/* Card infos résumé */}
          <div className="bg-[#112240] rounded-2xl p-6 border border-white/5">
            <h3 className="font-semibold mb-3 text-sm text-gray-400 uppercase">
              Informations
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Rôle</span>
                <span className="text-orange-400 capitalize font-medium">
                  {admin?.role}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">2FA</span>
                <span
                  className={
                    admin?.twofa_actif ? "text-green-400" : "text-orange-400"
                  }
                >
                  {admin?.twofa_actif ? "Activé ✅" : "Non activé"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== COLONNE INFOS ===== */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations personnelles */}
          <div className="bg-[#112240] rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <User size={20} className="text-orange-400" />
              Informations personnelles
            </h2>
            <form onSubmit={sauvegarderInfos} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                  minLength={2}
                  placeholder="Votre nom"
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-3 px-4 text-white focus:border-orange-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="votre@email.com"
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-3 px-4 text-white focus:border-orange-500 focus:outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={chargement}
                className="w-full md:w-auto px-6 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {chargement ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                Enregistrer les modifications
              </button>
            </form>
          </div>

          {/* Changer mot de passe */}
          <div className="bg-[#112240] rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Lock size={20} className="text-orange-400" />
              Changer le mot de passe
            </h2>
            <form onSubmit={changerMotDePasse} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Ancien mot de passe *
                </label>
                <div className="relative">
                  <input
                    type={showAncien ? "text" : "password"}
                    value={ancienMdp}
                    onChange={(e) => setAncienMdp(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-3 px-4 pr-12 text-white focus:border-orange-500 focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAncien(!showAncien)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showAncien ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Nouveau mot de passe *
                  </label>
                  <div className="relative">
                    <input
                      type={showNouveau ? "text" : "password"}
                      value={nouveauMdp}
                      onChange={(e) => setNouveauMdp(e.target.value)}
                      required
                      minLength={8}
                      placeholder="••••••••"
                      className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-3 px-4 pr-12 text-white focus:border-orange-500 focus:outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNouveau(!showNouveau)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showNouveau ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Confirmer *
                  </label>
                  <input
                    type="password"
                    value={confirmerMdp}
                    onChange={(e) => setConfirmerMdp(e.target.value)}
                    required
                    minLength={8}
                    placeholder="••••••••"
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-3 px-4 text-white focus:border-orange-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Le mot de passe doit contenir au moins 8 caractères.
              </p>

              <button
                type="submit"
                disabled={chargement}
                className="w-full md:w-auto px-6 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {chargement ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Lock size={18} />
                )}
                Changer le mot de passe
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}