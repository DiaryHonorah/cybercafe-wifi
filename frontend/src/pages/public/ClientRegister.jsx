import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  UserPlus,
  LogIn,
  CheckCircle2,
  Calendar,
  MapPin,
} from "lucide-react";
import { useClientAuth } from "../../context/ClientAuthContext";
import { usePublicLang } from "../../context/PublicLangContext";

export default function ClientRegister() {
  const navigate = useNavigate();
  const { inscription } = useClientAuth();
  const { t } = usePublicLang();
  const [form, setForm] = useState({
    nom: "",
    email: "",
    telephone: "",
    mot_de_passe: "",
    confirmer_mot_de_passe: "",
    date_naissance: "",
    adresse: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const handleChange = (champ, valeur) => {
    setForm({ ...form, [champ]: valeur });
    if (erreur) setErreur(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur(null);

    if (form.mot_de_passe !== form.confirmer_mot_de_passe) {
      setErreur(t("clientRegister.erreurMdp"));
      return;
    }

    if (form.mot_de_passe.length < 8) {
      setErreur(t("clientRegister.erreurMdpCourt"));
      return;
    }

    setChargement(true);

    try {
      await inscription({
        nom: form.nom,
        email: form.email,
        telephone: form.telephone,
        mot_de_passe: form.mot_de_passe,
        date_naissance: form.date_naissance,
        adresse: form.adresse,
      });

      setSucces(true);
      setTimeout(() => navigate("/mon-compte"), 1000);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="public-page min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#1E40AF] mb-4 shadow-2xl shadow-cyan-500/30">
            <UserPlus size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {t("clientRegister.titre")}
          </h1>
          <p className="text-gray-400">
            {t("clientRegister.sousTitre")}
          </p>
        </div>

        {/* Card */}
        <div className="public-card p-8 anim-fade-up">
          {succes && (
            <div className="mb-6 bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg p-4 flex items-center gap-3">
              <CheckCircle2 size={20} />
              <p>{t("clientRegister.succes")}</p>
            </div>
          )}

          {erreur && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-4 flex items-center gap-3">
              <AlertCircle size={20} />
              <p>{erreur}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                <User size={14} className="inline mr-1" />
                {t("clientRegister.nom")} *
              </label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => handleChange("nom", e.target.value)}
                required
                minLength={2}
                placeholder="Rakoto Jean"
                className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                <Mail size={14} className="inline mr-1" />
                {t("clientRegister.email")} *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
                placeholder="exemple@email.com"
                className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                <Phone size={14} className="inline mr-1" />
                {t("clientRegister.telephone")} *
              </label>
              <input
                type="tel"
                value={form.telephone}
                onChange={(e) => handleChange("telephone", e.target.value)}
                required
                minLength={8}
                placeholder="+261 34 XX XXX XX"
                className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                <Lock size={14} className="inline mr-1" />
                {t("clientRegister.motDePasse")} *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.mot_de_passe}
                  onChange={(e) => handleChange("mot_de_passe", e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min. 8 caractères"
                  className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 pr-12 text-white focus:border-[#06B6D4] focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                <Lock size={14} className="inline mr-1" />
                {t("clientRegister.confirmerMdp")} *
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={form.confirmer_mot_de_passe}
                onChange={(e) =>
                  handleChange("confirmer_mot_de_passe", e.target.value)
                }
                required
                minLength={8}
                placeholder="••••••••"
                className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  <Calendar size={14} className="inline mr-1" />
                  {t("clientRegister.dateNaissance")}
                </label>
                <input
                  type="date"
                  value={form.date_naissance}
                  onChange={(e) =>
                    handleChange("date_naissance", e.target.value)
                  }
                  className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  <MapPin size={14} className="inline mr-1" />
                  {t("clientRegister.adresse")}
                </label>
                <input
                  type="text"
                  value={form.adresse}
                  onChange={(e) => handleChange("adresse", e.target.value)}
                  placeholder="Ambalavao"
                  className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none transition"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500">
              * {t("clientRegister.champsObligatoires")}
            </p>

            <button
              type="submit"
              disabled={chargement || succes}
              className="btn-public-cyan w-full justify-center disabled:opacity-60"
            >
              {chargement ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t("clientRegister.creation")}
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  {t("clientRegister.creerCompte")}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#1E40AF]/20 text-center">
            <p className="text-sm text-gray-400 mb-2">
              {t("clientRegister.dejaCompte")}
            </p>
            <Link
              to="/connexion"
              className="inline-flex items-center gap-2 text-[#67E8F9] hover:text-[#06B6D4] font-medium transition"
            >
              <LogIn size={16} />
              {t("clientRegister.seConnecter")}
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-[#67E8F9] transition"
          >
            ← {t("clientRegister.retourAccueil")}
          </Link>
        </div>
      </div>
    </div>
  );
}