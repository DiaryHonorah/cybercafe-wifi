import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  LogOut,
  Edit,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Award,
  Star,
  Gift,
  Clock,
  TrendingUp,
  Bell,
  Eye,
  Check,
  CalendarDays,
  CreditCard,
  Home,
  History,
  Lock,
  Users,
  Share2,
  Copy,
  Trophy,
  Sparkles,
  Wallet,
  Medal,
  Target,
  Crown,
  Diamond,
  Zap,
  RefreshCw,
  Printer,
  Wifi,
  Ban,
} from "lucide-react";
import { useClientAuth } from "../../context/ClientAuthContext";
import { usePublicLang } from "../../context/PublicLangContext";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { client, deconnexion, isAuthenticated, loading } = useClientAuth();
  const { t } = usePublicLang();
  const [ongletActif, setOngletActif] = useState("profil");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(null);

  const [profil, setProfil] = useState({
    nom: "",
    telephone: "",
    date_naissance: "",
    adresse: "",
  });
  const [modeEdition, setModeEdition] = useState(false);

  const [motDePasse, setMotDePasse] = useState({
    ancien: "",
    nouveau: "",
    confirmer: "",
  });

  const [reservations, setReservations] = useState([]);
  const [carteFidelite, setCarteFidelite] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [nonLues, setNonLues] = useState(0);
  const [parrainage, setParrainage] = useState(null);
  const [badges, setBadges] = useState(null);
  const [vip, setVip] = useState(null);
  const [copie, setCopie] = useState(false);
  const [modalVip, setModalVip] = useState(false);

  // Redirection si non connecté
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/connexion");
    }
  }, [loading, isAuthenticated, navigate]);

  // Charger le profil
  useEffect(() => {
    if (client) {
      setProfil({
        nom: client.nom || "",
        telephone: client.telephone || "",
        date_naissance: client.date_naissance || "",
        adresse: client.adresse || "",
      });
    }
  }, [client]);

  const getToken = () => localStorage.getItem("client_token");

  const fetchAvecToken = async (url, options = {}) => {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {}),
    };
    headers["Authorization"] = `Bearer ${getToken()}`;
    return fetch(url, { ...options, headers, credentials: "omit" });
  };

  // Charger les données selon l'onglet
  useEffect(() => {
    if (!isAuthenticated) return;

    if (ongletActif === "reservations") {
      chargerReservations();
    } else if (ongletActif === "fidelite") {
      chargerFidelite();
    } else if (ongletActif === "notifications") {
      chargerNotifications();
    } else if (ongletActif === "parrainage") {
      chargerParrainage();
    } else if (ongletActif === "badges") {
      chargerBadges();
    } else if (ongletActif === "vip") {
      chargerVip();
    }
  }, [ongletActif, isAuthenticated]);

  const chargerReservations = async () => {
    setChargement(true);
    try {
      const res = await fetchAvecToken(`${API_URL}/client/mes-reservations`);
      const data = await res.json();
      if (data.success) setReservations(data.reservations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setChargement(false);
    }
  };

  const chargerFidelite = async () => {
    setChargement(true);
    try {
      const res = await fetchAvecToken(`${API_URL}/client/ma-carte-fidelite`);
      const data = await res.json();
      if (data.success) setCarteFidelite(data.carte);
    } catch (err) {
      console.error(err);
    } finally {
      setChargement(false);
    }
  };

  const chargerNotifications = async () => {
    setChargement(true);
    try {
      const res = await fetchAvecToken(`${API_URL}/client/mes-notifications`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setNonLues(data.non_lues || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChargement(false);
    }
  };

  const chargerParrainage = async () => {
    setChargement(true);
    try {
      const res = await fetchAvecToken(`${API_URL}/client/parrainage/mes-stats`);
      const data = await res.json();
      if (data.success) setParrainage(data);
    } catch (err) {
      console.error(err);
    } finally {
      setChargement(false);
    }
  };

  const chargerBadges = async () => {
    setChargement(true);
    try {
      const res = await fetchAvecToken(`${API_URL}/client/badges`);
      const data = await res.json();
      if (data.success) {
        setBadges(data);
        if (data.nouveaux_debloques && data.nouveaux_debloques.length > 0) {
          window.location.reload();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChargement(false);
    }
  };

  const chargerVip = async () => {
    setChargement(true);
    try {
      const res = await fetchAvecToken(`${API_URL}/client/vip/mon-abonnement`);
      const data = await res.json();
      if (data.success) setVip(data);
    } catch (err) {
      console.error(err);
    } finally {
      setChargement(false);
    }
  };

  const souscrireVip = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await fetchAvecToken(`${API_URL}/client/vip/souscrire`, {
        method: "POST",
        body: JSON.stringify({ auto_renouvellement: false }),
      });
      const data = await res.json();

      if (data.success) {
        setSucces(data.message);
        setModalVip(false);
        chargerVip();
        setTimeout(() => setSucces(null), 5000);
      } else {
        setErreur(data.message);
      }
    } catch (err) {
      setErreur("Erreur serveur");
    } finally {
      setChargement(false);
    }
  };

  const renouvelerVip = async () => {
    if (!confirm("Renouveler votre abonnement VIP pour 30 jours de plus ?")) return;

    setChargement(true);
    try {
      const res = await fetchAvecToken(`${API_URL}/client/vip/renouveler`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        setSucces(data.message);
        chargerVip();
        setTimeout(() => setSucces(null), 5000);
      } else {
        setErreur(data.message);
      }
    } catch (err) {
      setErreur("Erreur serveur");
    } finally {
      setChargement(false);
    }
  };

  const sauvegarderProfil = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await fetchAvecToken(`${API_URL}/client/modifier-profil`, {
        method: "POST",
        body: JSON.stringify(profil),
      });
      const data = await res.json();

      if (data.success) {
        setSucces(t("clientDash.profilMisAJour"));
        setModeEdition(false);
        localStorage.setItem("client_data", JSON.stringify(data.client));
        setTimeout(() => {
          setSucces(null);
          window.location.reload();
        }, 1000);
      } else {
        setErreur(data.message);
      }
    } catch (err) {
      setErreur("Erreur serveur");
    } finally {
      setChargement(false);
    }
  };

  const changerMotDePasse = async () => {
    setErreur(null);

    if (motDePasse.nouveau !== motDePasse.confirmer) {
      setErreur("Les mots de passe ne correspondent pas");
      return;
    }

    if (motDePasse.nouveau.length < 8) {
      setErreur("Le mot de passe doit faire 8 caractères min");
      return;
    }

    setChargement(true);
    try {
      const res = await fetchAvecToken(
        `${API_URL}/client/changer-mot-de-passe`,
        {
          method: "POST",
          body: JSON.stringify({
            ancien_mot_de_passe: motDePasse.ancien,
            nouveau_mot_de_passe: motDePasse.nouveau,
          }),
        }
      );
      const data = await res.json();

      if (data.success) {
        setSucces("Mot de passe modifié");
        setMotDePasse({ ancien: "", nouveau: "", confirmer: "" });
        setTimeout(() => setSucces(null), 3000);
      } else {
        setErreur(data.message);
      }
    } catch (err) {
      setErreur("Erreur serveur");
    } finally {
      setChargement(false);
    }
  };

  const marquerNotificationLue = async (id) => {
    try {
      await fetchAvecToken(`${API_URL}/client/notifications/lire`, {
        method: "POST",
        body: JSON.stringify({ id }),
      });
      chargerNotifications();
    } catch (err) {}
  };

  const handleLogout = async () => {
    await deconnexion();
    navigate("/");
  };

  const copierLienParrainage = async () => {
    if (!parrainage?.stats?.code_parrainage) return;

    const lien = `http://localhost:5173/inscription?code=${parrainage.stats.code_parrainage}`;
    try {
      await navigator.clipboard.writeText(lien);
      setCopie(true);
      setTimeout(() => setCopie(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateHeure = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getNiveauInfo = (niveau) => {
    const niveaux = {
      bronze: { label: "Bronze", icon: "🥉", color: "from-[#CD7F32] to-[#A0522D]" },
      argent: { label: "Argent", icon: "🥈", color: "from-[#C0C0C0] to-[#A9A9A9]" },
      or: { label: "Or", icon: "🥇", color: "from-[#FFD700] to-[#FFA500]" },
      platine: { label: "Platine", icon: "💎", color: "from-[#E5E4E2] to-[#B0C4DE]" },
    };
    return niveaux[niveau] || niveaux.bronze;
  };

  const getCategorieBadge = (cat) => {
    const cats = {
      debut: { label: t("clientDash.badgeDebut"), color: "from-[#06B6D4] to-[#0891B2]" },
      fidelite: { label: t("clientDash.badgeFidelite"), color: "from-[#F59E0B] to-[#DC2626]" },
      social: { label: t("clientDash.badgeSocial"), color: "from-[#22C55E] to-[#16A34A]" },
      special: { label: t("clientDash.badgeSpecial"), color: "from-[#7C3AED] to-[#6D28D9]" },
    };
    return cats[cat] || cats.debut;
  };

  if (loading) {
    return (
      <div className="public-page min-h-screen flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-[#67E8F9]" />
      </div>
    );
  }

  if (!client) return null;

  const initiales = (client.nom || "C")
    .split(" ")
    .map((m) => m[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="public-page">
      {/* HERO */}
      <section className="gradient-hero py-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-72 h-72 bg-[#06B6D4]/20 rounded-full blur-3xl" />
        </div>

        <div className="public-container relative">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#1E40AF] flex items-center justify-center text-white font-bold text-3xl shadow-2xl">
                {initiales}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  {t("clientDash.bonjour")}, {client.nom}
                </h1>
                <p className="text-gray-400 text-sm mt-1">{client.email}</p>
                {client.solde_bonus > 0 && (
                  <p className="text-sm text-green-400 font-medium mt-1">
                    💰 {t("clientDash.soldeBonus")} : {parseFloat(client.solde_bonus).toLocaleString("fr-FR")} Ar
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-gray-300 hover:text-red-400 transition"
            >
              <LogOut size={16} />
              {t("clientDash.deconnexion")}
            </button>
          </div>
        </div>
      </section>

      {/* MESSAGES */}
      <div className="public-container mt-6">
        {succes && (
          <div className="mb-4 bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 size={20} />
            <p>{succes}</p>
          </div>
        )}
        {erreur && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-4 flex items-center gap-3">
            <AlertCircle size={20} />
            <p>{erreur}</p>
          </div>
        )}
      </div>

      {/* TABS */}
      <section className="py-8">
        <div className="public-container">
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
            {[
              { id: "profil", label: t("clientDash.ongletProfil"), icon: User },
              { id: "reservations", label: t("clientDash.ongletReservations"), icon: CalendarDays },
              { id: "fidelite", label: t("clientDash.ongletFidelite"), icon: Award },
              { id: "parrainage", label: t("clientDash.ongletParrainage"), icon: Users },
              { id: "badges", label: t("clientDash.ongletBadges"), icon: Trophy },
              { id: "vip", label: t("clientDash.ongletVip"), icon: Crown },
              { id: "notifications", label: t("clientDash.ongletNotifications"), icon: Bell, badge: nonLues },
              { id: "securite", label: t("clientDash.ongletSecurite"), icon: Lock },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setOngletActif(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                  ongletActif === tab.id
                    ? "bg-gradient-to-r from-[#06B6D4] to-[#1E40AF] text-white shadow-lg shadow-cyan-500/30"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
                {tab.badge > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ===== ONGLET PROFIL ===== */}
          {ongletActif === "profil" && (
            <div className="public-card p-6 md:p-8 anim-fade-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <User size={20} className="text-[#67E8F9]" />
                  {t("clientDash.mesInfos")}
                </h2>
                {!modeEdition && (
                  <button
                    onClick={() => setModeEdition(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20 text-[#67E8F9] text-sm font-medium transition"
                  >
                    <Edit size={14} />
                    {t("clientDash.modifier")}
                  </button>
                )}
              </div>

              {modeEdition ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      {t("clientDash.nom")}
                    </label>
                    <input
                      type="text"
                      value={profil.nom}
                      onChange={(e) =>
                        setProfil({ ...profil, nom: e.target.value })
                      }
                      className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      {t("clientDash.telephone")}
                    </label>
                    <input
                      type="tel"
                      value={profil.telephone}
                      onChange={(e) =>
                        setProfil({ ...profil, telephone: e.target.value })
                      }
                      className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        {t("clientDash.dateNaissance")}
                      </label>
                      <input
                        type="date"
                        value={profil.date_naissance}
                        onChange={(e) =>
                          setProfil({
                            ...profil,
                            date_naissance: e.target.value,
                          })
                        }
                        className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        {t("clientDash.adresse")}
                      </label>
                      <input
                        type="text"
                        value={profil.adresse}
                        onChange={(e) =>
                          setProfil({ ...profil, adresse: e.target.value })
                        }
                        className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={sauvegarderProfil}
                      disabled={chargement}
                      className="btn-public-cyan disabled:opacity-50"
                    >
                      {chargement ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Save size={16} />
                      )}
                      {t("clientDash.enregistrer")}
                    </button>
                    <button
                      onClick={() => setModeEdition(false)}
                      className="btn-public-outline"
                    >
                      <X size={16} />
                      {t("clientDash.annuler")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">
                      {t("clientDash.nom")}
                    </p>
                    <p className="font-medium">{client.nom}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">
                      {t("clientDash.email")}
                    </p>
                    <p className="font-medium">{client.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">
                      {t("clientDash.telephone")}
                    </p>
                    <p className="font-medium">{client.telephone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">
                      {t("clientDash.dateInscription")}
                    </p>
                    <p className="font-medium">
                      {formatDate(client.date_inscription)}
                    </p>
                  </div>
                  {client.date_naissance && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">
                        {t("clientDash.dateNaissance")}
                      </p>
                      <p className="font-medium">
                        {formatDate(client.date_naissance)}
                      </p>
                    </div>
                  )}
                  {client.adresse && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">
                        {t("clientDash.adresse")}
                      </p>
                      <p className="font-medium">{client.adresse}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ===== ONGLET RÉSERVATIONS ===== */}
          {ongletActif === "reservations" && (
            <div className="anim-fade-up">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CalendarDays size={20} className="text-[#67E8F9]" />
                {t("clientDash.mesReservations")}
              </h2>

              {chargement ? (
                <div className="text-center py-12">
                  <Loader2 size={32} className="animate-spin text-[#67E8F9] mx-auto" />
                </div>
              ) : reservations.length === 0 ? (
                <div className="public-card p-12 text-center">
                  <CalendarDays size={48} className="text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">{t("clientDash.aucuneReservation")}</p>
                  <Link to="/reservation" className="btn-public-cyan inline-flex mt-4">
                    {t("clientDash.reserverMaintenant")}
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {reservations.map((res) => (
                    <div
                      key={res.id}
                      className="public-card p-4 flex flex-col md:flex-row md:items-center gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-mono text-[#67E8F9] font-bold">
                            {res.code_reservation}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              res.statut === "confirmee"
                                ? "bg-green-500/10 text-green-400"
                                : res.statut === "annulee"
                                ? "bg-red-500/10 text-red-400"
                                : res.statut === "terminee"
                                ? "bg-gray-500/10 text-gray-400"
                                : "bg-orange-500/10 text-orange-400"
                            }`}
                          >
                            {res.statut}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-gray-500">Date</p>
                            <p>{formatDate(res.date_reservation)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Heure</p>
                            <p>{res.heure_reservation?.substring(0, 5)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Durée</p>
                            <p>{res.duree}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Postes</p>
                            <p>{res.nombre_postes}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== ONGLET FIDÉLITÉ ===== */}
          {ongletActif === "fidelite" && (
            <div className="anim-fade-up">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Award size={20} className="text-[#67E8F9]" />
                {t("clientDash.maCarteFidelite")}
              </h2>

              {chargement ? (
                <div className="text-center py-12">
                  <Loader2 size={32} className="animate-spin text-[#67E8F9] mx-auto" />
                </div>
              ) : !carteFidelite ? (
                <div className="public-card p-12 text-center">
                  <Award size={48} className="text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">{t("clientDash.aucuneCarte")}</p>
                  <Link to="/fidelite" className="btn-public-cyan inline-flex">
                    {t("clientDash.creerCarte")}
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const niveau = getNiveauInfo(carteFidelite.niveau);
                    return (
                      <div className={`bg-gradient-to-br ${niveau.color} rounded-3xl p-6 text-white shadow-2xl`}>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-white/70 text-xs uppercase">
                              {t("clientDash.codeCarte")}
                            </p>
                            <p className="font-mono text-lg font-bold">
                              {carteFidelite.code_carte}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl">{niveau.icon}</div>
                            <p className="text-white/70 text-xs">{niveau.label}</p>
                          </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                          <p className="text-white/70 text-xs mb-1">
                            {t("clientDash.pointsDisponibles")}
                          </p>
                          <p className="text-4xl font-bold">
                            {carteFidelite.points_disponibles}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="public-card p-4 text-center">
                      <p className="text-xs text-gray-400 mb-1">
                        {t("clientDash.pointsTotal")}
                      </p>
                      <p className="text-2xl font-bold text-[#67E8F9]">
                        {carteFidelite.points_total}
                      </p>
                    </div>
                    <div className="public-card p-4 text-center">
                      <p className="text-xs text-gray-400 mb-1">
                        {t("clientDash.pointsUtilises")}
                      </p>
                      <p className="text-2xl font-bold text-orange-400">
                        {carteFidelite.points_utilises}
                      </p>
                    </div>
                  </div>

                  {carteFidelite.historique && carteFidelite.historique.length > 0 && (
                    <div className="public-card p-4">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <History size={16} className="text-[#67E8F9]" />
                        {t("clientDash.historique")}
                      </h3>
                      <div className="space-y-2">
                        {carteFidelite.historique.map((h) => (
                          <div
                            key={h.id}
                            className="flex items-center justify-between py-2 border-b border-[#1E40AF]/20 last:border-0"
                          >
                            <div>
                              <p className="text-sm">{h.raison || h.type}</p>
                              <p className="text-xs text-gray-500">
                                {formatDate(h.created_at)}
                              </p>
                            </div>
                            <span
                              className={`font-bold text-sm ${
                                parseInt(h.points) > 0
                                  ? "text-green-400"
                                  : "text-orange-400"
                              }`}
                            >
                              {parseInt(h.points) > 0 ? "+" : ""}
                              {h.points}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ===== ONGLET PARRAINAGE ===== */}
          {ongletActif === "parrainage" && (
            <div className="anim-fade-up">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users size={20} className="text-[#67E8F9]" />
                {t("clientDash.monParrainage")}
              </h2>

              {chargement ? (
                <div className="text-center py-12">
                  <Loader2 size={32} className="animate-spin text-[#67E8F9] mx-auto" />
                </div>
              ) : !parrainage ? null : (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-[#7C3AED] via-[#06B6D4] to-[#1E40AF] rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                    
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-4">
                        <Sparkles size={28} />
                        <div>
                          <h3 className="text-xl md:text-2xl font-bold">
                            {t("clientDash.invitezAmis")}
                          </h3>
                          <p className="text-white/80 text-sm">
                            {t("clientDash.gagnezParrainage")}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white/20 backdrop-blur rounded-xl p-4 mb-4">
                        <p className="text-white/70 text-xs uppercase mb-1">
                          {t("clientDash.votreCode")}
                        </p>
                        <p className="text-2xl md:text-3xl font-mono font-bold">
                          {parrainage.stats.code_parrainage}
                        </p>
                      </div>

                      <button
                        onClick={copierLienParrainage}
                        className="w-full flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl py-3 px-4 font-semibold transition"
                      >
                        {copie ? (
                          <>
                            <CheckCircle2 size={18} />
                            {t("clientDash.lienCopie")}
                          </>
                        ) : (
                          <>
                            <Copy size={18} />
                            {t("clientDash.copierLien")}
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="public-card p-4 text-center">
                      <p className="text-xs text-gray-400 mb-1">
                        {t("clientDash.totalParrainages")}
                      </p>
                      <p className="text-2xl font-bold">
                        {parrainage.stats.total || 0}
                      </p>
                    </div>
                    <div className="public-card p-4 text-center">
                      <p className="text-xs text-gray-400 mb-1">
                        {t("clientDash.valides")}
                      </p>
                      <p className="text-2xl font-bold text-green-400">
                        {parrainage.stats.valides || 0}
                      </p>
                    </div>
                    <div className="public-card p-4 text-center">
                      <p className="text-xs text-gray-400 mb-1">
                        {t("clientDash.enAttente")}
                      </p>
                      <p className="text-2xl font-bold text-orange-400">
                        {parrainage.stats.en_attente || 0}
                      </p>
                    </div>
                    <div className="public-card p-4 text-center">
                      <p className="text-xs text-gray-400 mb-1">
                        {t("clientDash.totalGagne")}
                      </p>
                      <p className="text-lg font-bold text-[#67E8F9]">
                        {parseFloat(parrainage.stats.total_gagne || 0).toLocaleString("fr-FR")} Ar
                      </p>
                    </div>
                  </div>

                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Wallet size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-400 mb-1">
                          {t("clientDash.soldeBonus")} : {parseFloat(parrainage.stats.solde_bonus || 0).toLocaleString("fr-FR")} Ar
                        </p>
                        <p className="text-sm text-gray-300">
                          {t("clientDash.soldeUtilisable")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {parrainage.parrainages && parrainage.parrainages.length > 0 && (
                    <div className="public-card p-5">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Users size={16} className="text-[#67E8F9]" />
                        {t("clientDash.mesFilleuls")} ({parrainage.parrainages.length})
                      </h3>
                      <div className="space-y-2">
                        {parrainage.parrainages.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between py-2 border-b border-[#1E40AF]/20 last:border-0"
                          >
                            <div>
                              <p className="text-sm font-medium">{p.filleul_nom}</p>
                              <p className="text-xs text-gray-500">
                                {formatDate(p.created_at)}
                              </p>
                            </div>
                            <div className="text-right">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  p.statut === "valide"
                                    ? "bg-green-500/10 text-green-400"
                                    : p.statut === "annule"
                                    ? "bg-red-500/10 text-red-400"
                                    : "bg-orange-500/10 text-orange-400"
                                }`}
                              >
                                {p.statut}
                              </span>
                              {p.statut === "valide" && (
                                <p className="text-xs text-green-400 mt-1">
                                  +{parseFloat(p.recompense_parrain).toLocaleString("fr-FR")} Ar
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ===== ONGLET BADGES ===== */}
          {ongletActif === "badges" && (
            <div className="anim-fade-up">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Trophy size={20} className="text-[#67E8F9]" />
                {t("clientDash.mesBadges")}
              </h2>

              {chargement ? (
                <div className="text-center py-12">
                  <Loader2 size={32} className="animate-spin text-[#67E8F9] mx-auto" />
                </div>
              ) : !badges || !badges.catalogue || badges.catalogue.length === 0 ? (
                <div className="public-card p-12 text-center">
                  <Trophy size={48} className="text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">
                    {t("clientDash.aucunBadgeEncore") || "Aucun badge disponible"}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="public-card p-4 text-center">
                      <div className="inline-flex p-2 rounded-lg bg-yellow-500/20 mb-2">
                        <Trophy size={20} className="text-yellow-400" />
                      </div>
                      <p className="text-xs text-gray-400 mb-1">Obtenus</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {badges.badges_obtenus?.length || 0}
                      </p>
                    </div>
                    <div className="public-card p-4 text-center">
                      <div className="inline-flex p-2 rounded-lg bg-cyan-500/20 mb-2">
                        <Medal size={20} className="text-cyan-400" />
                      </div>
                      <p className="text-xs text-gray-400 mb-1">Total</p>
                      <p className="text-2xl font-bold text-cyan-400">
                        {badges.catalogue.length}
                      </p>
                    </div>
                    <div className="public-card p-4 text-center">
                      <div className="inline-flex p-2 rounded-lg bg-green-500/20 mb-2">
                        <Target size={20} className="text-green-400" />
                      </div>
                      <p className="text-xs text-gray-400 mb-1">Progression</p>
                      <p className="text-2xl font-bold text-green-400">
                        {Math.round(
                          ((badges.badges_obtenus?.length || 0) /
                            badges.catalogue.length) *
                            100
                        )}
                        %
                      </p>
                    </div>
                    <div className="public-card p-4 text-center">
                      <div className="inline-flex p-2 rounded-lg bg-purple-500/20 mb-2">
                        <Gift size={20} className="text-purple-400" />
                      </div>
                      <p className="text-xs text-gray-400 mb-1">Bonus</p>
                      <p className="text-lg font-bold text-purple-400">
                        {(badges.badges_obtenus?.reduce(
                          (sum, b) => sum + parseFloat(b.recompense_bonus || 0),
                          0
                        ) || 0).toLocaleString("fr-FR")} Ar
                      </p>
                    </div>
                  </div>

                  {["debut", "fidelite", "social", "special"].map((cat) => {
                    const badgesCat = badges.catalogue.filter(
                      (b) => b.categorie === cat
                    );
                    if (badgesCat.length === 0) return null;

                    const catInfo = getCategorieBadge(cat);

                    return (
                      <div key={cat}>
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <span className={`w-1 h-6 rounded-full bg-gradient-to-b ${catInfo.color}`} />
                          {catInfo.label}
                          <span className="text-xs text-gray-500">
                            ({badgesCat.filter((b) => b.obtenu).length} /{" "}
                            {badgesCat.length})
                          </span>
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {badgesCat.map((badge) => (
                            <div
                              key={badge.id}
                              className={`public-card p-4 text-center relative ${
                                badge.obtenu
                                  ? "border-2 border-yellow-500/30 shadow-lg shadow-yellow-500/10"
                                  : "opacity-70"
                              }`}
                            >
                              {badge.obtenu && (
                                <div className="absolute top-2 right-2">
                                  <Star
                                    size={14}
                                    className="text-yellow-400"
                                    fill="currentColor"
                                  />
                                </div>
                              )}

                              <div
                                className={`inline-flex p-3 rounded-2xl mb-3 ${
                                  badge.obtenu
                                    ? `bg-gradient-to-br ${catInfo.color}`
                                    : "bg-white/5"
                                }`}
                              >
                                <span className="text-4xl">{badge.icone}</span>
                              </div>

                              <h4 className="font-semibold text-sm mb-1">
                                {badge.nom}
                              </h4>
                              <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                                {badge.description}
                              </p>

                              {parseFloat(badge.recompense_bonus) > 0 && (
                                <p
                                  className={`text-xs font-bold ${
                                    badge.obtenu ? "text-green-400" : "text-yellow-500"
                                  }`}
                                >
                                  🎁 +{parseFloat(badge.recompense_bonus).toLocaleString("fr-FR")} Ar
                                </p>
                              )}

                              {!badge.obtenu && (
                                <>
                                  <div className="w-full bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-[#06B6D4] to-[#1E40AF]"
                                      style={{ width: `${badge.progression || 0}%` }}
                                    />
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {badge.valeur_actuelle || 0} /{" "}
                                    {badge.condition_valeur}
                                  </p>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===== ONGLET VIP ===== */}
          {ongletActif === "vip" && (
            <div className="anim-fade-up">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Crown size={20} className="text-[#F59E0B]" />
                {t("clientDash.monVip")}
              </h2>

              {chargement ? (
                <div className="text-center py-12">
                  <Loader2 size={32} className="animate-spin text-[#67E8F9] mx-auto" />
                </div>
              ) : !vip ? null : vip.abonnement ? (
                /* VIP ACTIF */
                <div className="space-y-4">
                  {/* Carte VIP */}
                  <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-br from-[#F59E0B] via-[#DC2626] to-[#7C3AED] text-white shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/20 rounded-full blur-3xl" />

                    <div className="relative">
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Crown size={28} className="text-yellow-300" />
                            <span className="text-2xl font-black">VIP</span>
                          </div>
                          <p className="text-white/80 text-sm">
                            {t("clientDash.vipMembreDepuis")} {formatDate(vip.abonnement.date_debut)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white/70 text-xs uppercase mb-1">
                            {t("clientDash.vipJoursRestants")}
                          </p>
                          <p className="text-4xl font-bold">
                            {vip.abonnement.jours_restants}
                          </p>
                          <p className="text-white/70 text-xs">jours</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="bg-white/20 backdrop-blur rounded-xl p-3">
                          <Wifi size={20} className="mb-1" />
                          <p className="text-xs text-white/80 mb-1">
                            {t("clientDash.vipWifi")}
                          </p>
                          <p className="font-bold">∞ Illimité</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur rounded-xl p-3">
                          <Printer size={20} className="mb-1" />
                          <p className="text-xs text-white/80 mb-1">
                            {t("clientDash.vipImpressions")}
                          </p>
                          <p className="font-bold">
                            {vip.abonnement.impressions_restantes} /{" "}
                            {vip.abonnement.impressions_limite}
                          </p>
                        </div>
                        <div className="bg-white/20 backdrop-blur rounded-xl p-3 col-span-2 md:col-span-1">
                          <Zap size={20} className="mb-1" />
                          <p className="text-xs text-white/80 mb-1">
                            {t("clientDash.vipReduction")}
                          </p>
                          <p className="font-bold">
                            {vip.config.reduction_services}% sur services
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={renouvelerVip}
                      disabled={chargement}
                      className="public-card p-4 hover:border-orange-500/50 transition text-left disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/20">
                          <RefreshCw size={20} className="text-orange-400" />
                        </div>
                        <div>
                          <p className="font-semibold">
                            {t("clientDash.vipRenouveler")}
                          </p>
                          <p className="text-xs text-gray-400">
                            +30 jours pour{" "}
                            {parseFloat(vip.config.prix_mensuel).toLocaleString("fr-FR")} Ar
                          </p>
                        </div>
                      </div>
                    </button>

                    <div className="public-card p-4 text-left">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                          <Calendar size={20} className="text-purple-400" />
                        </div>
                        <div>
                          <p className="font-semibold">
                            {t("clientDash.vipExpiration")}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(vip.abonnement.date_fin)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statistiques d'utilisation */}
                  <div className="public-card p-5">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp size={16} className="text-[#67E8F9]" />
                      {t("clientDash.vipUtilisation")}
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1 text-sm">
                          <span className="text-gray-400">
                            {t("clientDash.vipImpressionsUtilisees")}
                          </span>
                          <span className="font-bold">
                            {vip.abonnement.impressions_utilisees} /{" "}
                            {vip.abonnement.impressions_limite}
                          </span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#F59E0B] to-[#DC2626] rounded-full transition-all"
                            style={{
                              width: `${
                                (vip.abonnement.impressions_utilisees /
                                  vip.abonnement.impressions_limite) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1 text-sm">
                          <span className="text-gray-400">
                            {t("clientDash.vipWifiUtilise")}
                          </span>
                          <span className="font-bold">
                            {parseFloat(vip.abonnement.wifi_utilise_heures).toFixed(1)} h
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Historique */}
                  {vip.historique && vip.historique.length > 1 && (
                    <div className="public-card p-5">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <History size={16} className="text-[#67E8F9]" />
                        {t("clientDash.vipHistorique")}
                      </h3>
                      <div className="space-y-2">
                        {vip.historique.map((h) => (
                          <div
                            key={h.id}
                            className="flex items-center justify-between py-2 border-b border-[#1E40AF]/20 last:border-0"
                          >
                            <div>
                              <p className="text-sm font-medium">
                                {formatDate(h.date_debut)} → {formatDate(h.date_fin)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {h.statut}
                              </p>
                            </div>
                            <span className="text-sm font-bold text-[#67E8F9]">
                              {parseFloat(h.montant_paye).toLocaleString("fr-FR")} Ar
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* PAS DE VIP - PROPOSITION */
                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-3xl p-8 md:p-12 bg-gradient-to-br from-[#F59E0B] via-[#DC2626] to-[#7C3AED] text-white shadow-2xl text-center">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-black/20 rounded-full blur-3xl" />

                    <div className="relative">
                      <div className="inline-flex p-4 rounded-full bg-white/20 backdrop-blur mb-4">
                        <Crown size={48} className="text-yellow-300" />
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold mb-2">
                        {t("clientDash.vipDevenir")}
                      </h3>
                      <p className="text-white/90 mb-6">
                        {t("clientDash.vipDesc")}
                      </p>

                      <div className="inline-flex items-baseline gap-2 mb-6">
                        <span className="text-5xl font-black">
                          {parseFloat(vip.config.prix_mensuel).toLocaleString("fr-FR")}
                        </span>
                        <span className="text-lg">Ar / mois</span>
                      </div>

                      <div className="max-w-md mx-auto text-left space-y-2 mb-8">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={20} className="text-yellow-300 flex-shrink-0" />
                          <span>{t("clientDash.vipAvantage1")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={20} className="text-yellow-300 flex-shrink-0" />
                          <span>{vip.config.impressions_limite} impressions gratuites/mois</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={20} className="text-yellow-300 flex-shrink-0" />
                          <span>-{vip.config.reduction_services}% sur tous les services</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={20} className="text-yellow-300 flex-shrink-0" />
                          <span>{t("clientDash.vipAvantage4")}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setModalVip(true)}
                        className="bg-white text-[#7C3AED] font-bold px-8 py-4 rounded-xl hover:bg-gray-100 transition text-lg shadow-lg inline-flex items-center gap-2"
                      >
                        <Diamond size={22} />
                        {t("clientDash.vipSouscrire")}
                      </button>

                      <p className="text-sm text-white/70 mt-4">
                        {t("clientDash.vipSoldeActuel")} :{" "}
                        {parseFloat(vip.solde_bonus || 0).toLocaleString("fr-FR")} Ar
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== ONGLET NOTIFICATIONS ===== */}
          {ongletActif === "notifications" && (
            <div className="anim-fade-up">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Bell size={20} className="text-[#67E8F9]" />
                {t("clientDash.mesNotifications")}
              </h2>

              {chargement ? (
                <div className="text-center py-12">
                  <Loader2 size={32} className="animate-spin text-[#67E8F9] mx-auto" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="public-card p-12 text-center">
                  <Bell size={48} className="text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">
                    {t("clientDash.aucuneNotification")}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`public-card p-4 ${
                        !notif.lu ? "border-l-4 border-l-[#06B6D4]" : ""
                      }`}
                      onClick={() => !notif.lu && marquerNotificationLue(notif.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">{notif.titre}</p>
                            {!notif.lu && (
                              <span className="w-2 h-2 bg-[#06B6D4] rounded-full" />
                            )}
                          </div>
                          <p className="text-sm text-gray-400">
                            {notif.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatDateHeure(notif.created_at)}
                          </p>
                        </div>
                        {!notif.lu && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              marquerNotificationLue(notif.id);
                            }}
                            className="p-1.5 rounded bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20 text-[#67E8F9] transition"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== ONGLET SÉCURITÉ ===== */}
          {ongletActif === "securite" && (
            <div className="public-card p-6 md:p-8 anim-fade-up">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Lock size={20} className="text-[#67E8F9]" />
                {t("clientDash.securite")}
              </h2>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {t("clientDash.ancienMdp")}
                  </label>
                  <input
                    type="password"
                    value={motDePasse.ancien}
                    onChange={(e) =>
                      setMotDePasse({ ...motDePasse, ancien: e.target.value })
                    }
                    className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {t("clientDash.nouveauMdp")}
                  </label>
                  <input
                    type="password"
                    value={motDePasse.nouveau}
                    onChange={(e) =>
                      setMotDePasse({ ...motDePasse, nouveau: e.target.value })
                    }
                    className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {t("clientDash.confirmerMdp")}
                  </label>
                  <input
                    type="password"
                    value={motDePasse.confirmer}
                    onChange={(e) =>
                      setMotDePasse({ ...motDePasse, confirmer: e.target.value })
                    }
                    className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none"
                  />
                </div>
                <button
                  onClick={changerMotDePasse}
                  disabled={chargement}
                  className="btn-public-cyan disabled:opacity-50"
                >
                  {chargement ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Lock size={16} />
                  )}
                  {t("clientDash.changerMdp")}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ===== MODAL SOUSCRIPTION VIP ===== */}
      {modalVip && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalVip(false)}
        >
          <div
            className="bg-[#112240] rounded-2xl max-w-md w-full border border-orange-500/30 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-white/10 flex items-center gap-3 bg-gradient-to-r from-[#F59E0B]/10 to-[#DC2626]/10">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Crown size={20} className="text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Devenir VIP</h2>
                <p className="text-xs text-gray-400">
                  Abonnement 30 jours
                </p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-[#0A1628] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Prix</span>
                  <span className="font-bold text-lg">
                    {parseFloat(vip?.config?.prix_mensuel || 0).toLocaleString("fr-FR")} Ar
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Votre solde</span>
                  <span className="font-bold text-green-400">
                    {parseFloat(vip?.solde_bonus || 0).toLocaleString("fr-FR")} Ar
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#1E40AF]/20">
                  <span className="text-sm text-gray-400">Après souscription</span>
                  <span className={`font-bold ${
                    parseFloat(vip?.solde_bonus || 0) >= parseFloat(vip?.config?.prix_mensuel || 0)
                      ? "text-cyan-400"
                      : "text-red-400"
                  }`}>
                    {(parseFloat(vip?.solde_bonus || 0) - parseFloat(vip?.config?.prix_mensuel || 0)).toLocaleString("fr-FR")} Ar
                  </span>
                </div>
              </div>

              {parseFloat(vip?.solde_bonus || 0) < parseFloat(vip?.config?.prix_mensuel || 0) && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <p>
                    Solde insuffisant. Il vous manque{" "}
                    {(parseFloat(vip?.config?.prix_mensuel || 0) - parseFloat(vip?.solde_bonus || 0)).toLocaleString("fr-FR")} Ar.
                    Gagnez du bonus avec le parrainage et les badges !
                  </p>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setModalVip(false)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition font-medium"
              >
                Annuler
              </button>
              <button
                onClick={souscrireVip}
                disabled={
                  chargement ||
                  parseFloat(vip?.solde_bonus || 0) < parseFloat(vip?.config?.prix_mensuel || 0)
                }
                className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#F59E0B] to-[#DC2626] hover:opacity-90 text-white font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {chargement ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Diamond size={16} />
                )}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}