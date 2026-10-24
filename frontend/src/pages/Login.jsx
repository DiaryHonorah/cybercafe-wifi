import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Wifi, Mail, Lock, Loader2, Shield, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import LanguageSelector from "../components/LanguageSelector";
import api from "../api";

export default function Login() {
  const [etape, setEtape] = useState("login");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [code2fa, setCode2fa] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Nettoyage cache
  useEffect(() => {
    if ("caches" in window) {
      caches
        .keys()
        .then((noms) => {
          noms.filter((n) => !n.includes("v4")).forEach((n) => caches.delete(n));
        })
        .catch(() => {});
    }

    const token = localStorage.getItem("token");
    if (token) {
      api
        .get("/api/auth/verifier")
        .then((r) => {
          if (r.data.valide) window.location.href = "/admin";
          else localStorage.removeItem("token");
        })
        .catch(() => localStorage.removeItem("token"));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (chargement) return;

    setErreur("");
    setChargement(true);

    try {
      const payload =
        etape === "login"
          ? { email, mot_de_passe: motDePasse }
          : { email, mot_de_passe: motDePasse, code_2fa: code2fa };

      const r = await api.post("/api/auth/login", payload);

      if (r.data.requires_2fa) {
        setEtape("2fa");
        setChargement(false);
        return;
      }

      if (r.data.success) {
        localStorage.setItem("token", r.data.token);
        // Redirection forcée (sans React Router)
        window.location.href = "/admin";
      } else {
        setErreur(r.data.erreur || "Erreur de connexion");
        setChargement(false);
      }
    } catch (err) {
      setErreur(
        err.response?.data?.erreur ||
          err.response?.data?.message ||
          "Erreur de connexion au serveur"
      );
      setChargement(false);
    }
  };

  const retourLogin = () => {
    setEtape("login");
    setCode2fa("");
    setErreur("");
  };

  return (
    <div className="min-h-screen bg-night flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-2xl mb-4 shadow-lg shadow-accent/30">
            <Wifi size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold">{t("app.nom")}</h1>
          <p className="text-gray-400 mt-1">
            {etape === "login" ? t("login.titre") : "Vérification 2FA"}
          </p>
        </div>

        {/* Formulaire — STYLE FIXE, aucune animation */}
        <div className="relative bg-panel border border-white/5 rounded-2xl p-8 shadow-xl">
          {/* OVERLAY DE CHARGEMENT (au-dessus, sans bouger le contenu) */}
          {chargement && (
            <div className="absolute inset-0 bg-panel/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10">
              <div className="relative inline-flex mb-4">
                <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping" />
                <div className="relative bg-accent/10 p-4 rounded-full">
                  <Loader2 size={32} className="animate-spin text-accent" />
                </div>
              </div>
              <p className="text-sm text-gray-400">
                {etape === "login" ? "Connexion en cours..." : "Vérification..."}
              </p>
            </div>
          )}

          {etape === "login" ? (
            <form onSubmit={handleSubmit}>
              <h2 className="text-xl font-semibold mb-2">
                {t("login.seConnecter")}
              </h2>
              <p className="text-xs text-gray-400 mb-6">
                {t("login.sousTitre")}
              </p>

              {erreur && (
                <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3 mb-4">
                  {erreur}
                </div>
              )}

              <label className="block text-sm text-gray-400 mb-2">
                {t("login.email")}
              </label>
              <div className="relative mb-4">
                <Mail size={18} className="absolute left-3 top-3.5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cyber.mg"
                  required
                  autoComplete="email"
                  className="w-full bg-night border border-white/10 rounded-lg py-3 pl-10 pr-3 text-white focus:border-accent focus:outline-none"
                />
              </div>

              <label className="block text-sm text-gray-400 mb-2">
                {t("login.motDePasse")}
              </label>
              <div className="relative mb-6">
                <Lock size={18} className="absolute left-3 top-3.5 text-gray-500" />
                <input
                  type="password"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-night border border-white/10 rounded-lg py-3 pl-10 pr-3 text-white focus:border-accent focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={chargement}
                className="w-full bg-accent hover:bg-accentDark disabled:opacity-70 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
                style={{ height: "48px" }}
              >
                <span>{t("login.seConnecter")}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-accent/10 text-accent p-3 rounded-xl">
                  <Shield size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Vérification 2FA</h2>
                  <p className="text-xs text-gray-400">Entrez le code à 6 chiffres</p>
                </div>
              </div>

              {erreur && (
                <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3 mb-4">
                  {erreur}
                </div>
              )}

              <label className="block text-sm text-gray-400 mb-2">
                Code d'authentification
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={8}
                value={code2fa}
                onChange={(e) =>
                  setCode2fa(e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase())
                }
                placeholder="123456"
                autoFocus
                autoComplete="one-time-code"
                className="w-full bg-night border border-white/10 rounded-lg p-4 text-white text-center text-2xl font-mono tracking-widest focus:border-accent focus:outline-none mb-4"
              />

              <p className="text-xs text-gray-500 text-center mb-6">
                Ouvrez Google Authenticator ou entrez un code de secours
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={retourLogin}
                  disabled={chargement}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-sm font-medium py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ height: "48px" }}
                >
                  <ArrowLeft size={16} />
                  <span>Retour</span>
                </button>
                <button
                  type="submit"
                  disabled={chargement || code2fa.length < 6}
                  className="flex-1 bg-accent hover:bg-accentDark disabled:opacity-50 text-white font-semibold py-3 rounded-lg flex items-center justify-center"
                  style={{ height: "48px" }}
                >
                  <span>Vérifier</span>
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-xs text-gray-500 mt-6">
            {t("login.copyright")}
          </p>
        </div>

        <div className="text-center mt-6">
          <a
            href="/portail"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-gray-500 hover:text-accent"
          >
            → Accéder au portail client
          </a>
        </div>
      </div>
    </div>
  );
}