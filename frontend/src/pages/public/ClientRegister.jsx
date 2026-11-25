import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Lock,
  Calendar,
  MapPin,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Gift,
  Users,
} from "lucide-react";
import { usePublicLang } from "../../context/PublicLangContext";
import { useClientAuth } from "../../context/ClientAuthContext";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function ClientRegister() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = usePublicLang();
  const { inscription } = useClientAuth();

  const [form, setForm] = useState({
    nom: "",
    email: "",
    telephone: "",
    mot_de_passe: "",
    confirmer_mdp: "",
    date_naissance: "",
    adresse: "",
    code_parrainage: "",
  });

  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [parrainInfo, setParrainInfo] = useState(null);
  const [verifCode, setVerifCode] = useState(false);

  // Récupérer le code parrain depuis l'URL (?code=REF00001)
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      setForm((prev) => ({ ...prev, code_parrainage: code }));
      verifierCodeParrain(code);
    }
  }, [searchParams]);

  const verifierCodeParrain = async (code) => {
    if (!code) {
      setParrainInfo(null);
      return;
    }

    setVerifCode(true);
    try {
      const res = await fetch(`${API_URL}/parrainage/verifier-code?code=${code}`);
      const data = await res.json();
      if (data.success) {
        setParrainInfo(data.parrain);
      } else {
        setParrainInfo(null);
      }
    } catch (err) {
      setParrainInfo(null);
    } finally {
      setVerifCode(false);
    }
  };

  const handleCodeChange = (e) => {
    const code = e.target.value.toUpperCase();
    setForm({ ...form, code_parrainage: code });
    if (code.length >= 5) {
      verifierCodeParrain(code);
    } else {
      setParrainInfo(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur(null);
    setSucces(null);

    // Validations
    if (!form.nom.trim() || !form.email.trim() || !form.telephone.trim() || !form.mot_de_passe) {
      setErreur("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (form.mot_de_passe !== form.confirmer_mdp) {
      setErreur(t("clientRegister.erreurMdp"));
      return;
    }

    if (form.mot_de_passe.length < 8) {
      setErreur(t("clientRegister.erreurMdpCourt"));
      return;
    }

    setChargement(true);
    try {
      // On passe par la méthode d'inscription du context
      const resultat = await inscription({
        nom: form.nom,
        email: form.email,
        telephone: form.telephone,
        mot_de_passe: form.mot_de_passe,
        date_naissance: form.date_naissance || null,
        adresse: form.adresse || null,
        code_parrainage: form.code_parrainage || null,
      });

      if (resultat.success) {
        setSucces(t("clientRegister.succes"));
        setTimeout(() => navigate("/mon-compte"), 1500);
      } else {
        setErreur(resultat.message);
      }
    } catch (err) {
      setErreur("Erreur serveur");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="public-page min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        {/* Bouton retour */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[#67E8F9] mb-6 transition"
        >
          <ArrowLeft size={16} />
          {t("clientRegister.retourAccueil")}
        </Link>

        {/* Carte principale */}
        <div className="public-card p-8">
          {/* En-tête */}
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#1E40AF] mb-4">
              <User size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {t("clientRegister.titre")}
            </h1>
            <p className="text-sm text-gray-400">
              {t("clientRegister.sousTitre")}
            </p>
          </div>

          {/* Messages */}
          {erreur && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 flex items-center gap-2">
              <AlertCircle size={16} />
              <p>{erreur}</p>
            </div>
          )}
          {succes && (
            <div className="mb-4 bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg p-3 flex items-center gap-2">
              <CheckCircle2 size={16} />
              <p>{succes}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nom */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {t("clientRegister.nom")} *
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  placeholder="Rakoto Jean"
                  className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 pl-10 pr-4 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {t("clientRegister.email")} *
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jean@example.com"
                  className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 pl-10 pr-4 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {t("clientRegister.telephone")} *
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="tel"
                  value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  placeholder="+261 34 12 345 67"
                  className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 pl-10 pr-4 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  {t("clientRegister.motDePasse")} *
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="password"
                    value={form.mot_de_passe}
                    onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 pl-10 pr-4 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  {t("clientRegister.confirmerMdp")} *
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="password"
                    value={form.confirmer_mdp}
                    onChange={(e) => setForm({ ...form, confirmer_mdp: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 pl-10 pr-4 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Date naissance + Adresse */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  {t("clientRegister.dateNaissance")}
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="date"
                    value={form.date_naissance}
                    onChange={(e) => setForm({ ...form, date_naissance: e.target.value })}
                    className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 pl-10 pr-4 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  {t("clientRegister.adresse")}
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={form.adresse}
                    onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                    placeholder="Ambalavao"
                    className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 pl-10 pr-4 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Code Parrainage (optionnel) */}
            <div>
              <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                <Gift size={14} className="text-yellow-400" />
                Code de parrainage (optionnel)
              </label>
              <div className="relative">
                <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={form.code_parrainage}
                  onChange={handleCodeChange}
                  placeholder="REF00001"
                  className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 pl-10 pr-4 text-white text-sm focus:border-[#F59E0B] focus:outline-none uppercase"
                  style={{ textTransform: "uppercase" }}
                />
                {verifCode && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 size={16} className="animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              {parrainInfo && (
                <div className="mt-2 bg-green-500/10 border border-green-500/30 rounded-lg p-2 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
                  <p className="text-xs text-green-400">
                    Code valide : {parrainInfo.nom}
                  </p>
                </div>
              )}
              {form.code_parrainage && !parrainInfo && !verifCode && form.code_parrainage.length >= 5 && (
                <div className="mt-2 bg-red-500/10 border border-red-500/30 rounded-lg p-2 flex items-center gap-2">
                  <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-400">Code invalide</p>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Si un ami vous a parrainé, entrez son code pour recevoir un bonus !
              </p>
            </div>

            {/* Bouton */}
            <button
              type="submit"
              disabled={chargement}
              className="w-full btn-public-cyan justify-center py-3 mt-2 disabled:opacity-50"
            >
              {chargement ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t("clientRegister.creation")}
                </>
              ) : (
                <>
                  <User size={16} />
                  {t("clientRegister.creerCompte")}
                </>
              )}
            </button>
          </form>

          {/* Lien connexion */}
          <div className="mt-6 pt-6 border-t border-white/5 text-center text-sm">
            <p className="text-gray-400">
              {t("clientRegister.dejaCompte")}{" "}
              <Link to="/connexion" className="text-[#67E8F9] hover:text-[#06B6D4] font-medium">
                {t("clientRegister.seConnecter")}
              </Link>
            </p>
          </div>
        </div>

        {/* Astuce */}
        <div className="mt-4 bg-gradient-to-r from-[#F59E0B]/10 to-[#DC2626]/10 border border-yellow-500/30 rounded-lg p-3">
          <p className="text-xs text-gray-300 text-center">
            🎁 <strong>Gagnez 500 Ar</strong> par ami inscrit grâce à votre code de parrainage !
          </p>
        </div>
      </div>
    </div>
  );
}