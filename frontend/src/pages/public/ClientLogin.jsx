import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  LogIn,
  UserPlus,
  CheckCircle2,
} from "lucide-react";
import { useClientAuth } from "../../context/ClientAuthContext";
import { usePublicLang } from "../../context/PublicLangContext";

export default function ClientLogin() {
  const navigate = useNavigate();
  const { connexion } = useClientAuth();
  const { t } = usePublicLang();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);

    try {
      await connexion(email, motDePasse);
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
            <LogIn size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {t("clientLogin.titre")}
          </h1>
          <p className="text-gray-400">
            {t("clientLogin.sousTitre")}
          </p>
        </div>

        {/* Card */}
        <div className="public-card p-8 anim-fade-up">
          {succes && (
            <div className="mb-6 bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg p-4 flex items-center gap-3">
              <CheckCircle2 size={20} />
              <p>{t("clientLogin.succes")}</p>
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
                <Mail size={14} className="inline mr-1" />
                {t("clientLogin.email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="exemple@email.com"
                className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                <Lock size={14} className="inline mr-1" />
                {t("clientLogin.motDePasse")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  required
                  placeholder="••••••••"
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

            <button
              type="submit"
              disabled={chargement || succes}
              className="btn-public-cyan w-full justify-center disabled:opacity-60"
            >
              {chargement ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t("clientLogin.connexion")}
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  {t("clientLogin.seConnecter")}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#1E40AF]/20 text-center">
            <p className="text-sm text-gray-400 mb-2">
              {t("clientLogin.pasCompte")}
            </p>
            <Link
              to="/inscription"
              className="inline-flex items-center gap-2 text-[#67E8F9] hover:text-[#06B6D4] font-medium transition"
            >
              <UserPlus size={16} />
              {t("clientLogin.creerCompte")}
            </Link>
          </div>
        </div>

        {/* Retour */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-[#67E8F9] transition"
          >
            ← {t("clientLogin.retourAccueil")}
          </Link>
        </div>
      </div>
    </div>
  );
}