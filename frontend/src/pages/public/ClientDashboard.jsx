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
  const [copie, setCopie] = useState(false);

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
        // Recharger le profil (pour le solde bonus mis à jour)
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
                  <Link
                    to="/reservation"
                    className="btn-public-cyan inline-flex mt-4"
                  >
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

                  <div className="public-card p-5">
                    <h3 className="font-semibold mb-3">{t("clientDash.commentCaMarche")}</h3>
                    <ol className="space-y-2 text-sm text-gray-400">
                      <li className="flex gap-3">
                        <span className="bg-[#06B6D4] text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold text-xs">1</span>
                        <span>{t("clientDash.etape1")}</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="bg-[#06B6D4] text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold text-xs">2</span>
                        <span>{t("clientDash.etape2")}</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="bg-[#06B6D4] text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                        <span>{t("clientDash.etape3")}</span>
                      </li>
                    </ol>
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
              ) : !badges ? null : (
                <div className="space-y-6">
                  {/* Statistiques badges */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="public-card p-4 text-center">
                      <div className="inline-flex p-2 rounded-lg bg-yellow-500/20 mb-2">
                        <Trophy size={20} className="text-yellow-400" />
                      </div>
                      <p className="text-xs text-gray-400 mb-1">
                        {t("clientDash.badgesObtenus")}
                      </p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {badges.badges_obtenus?.length || 0}
                      </p>
                    </div>
                    <div className="public-card p-4 text-center">
                      <div className="inline-flex p-2 rounded-lg bg-cyan-500/20 mb-2">
                        <Medal size={20} className="text-cyan-400" />
                      </div>
                      <p className="text-xs text-gray-400 mb-1">
                        {t("clientDash.badgesTotal")}
                      </p>
                      <p className="text-2xl font-bold text-cyan-400">
                        {badges.catalogue?.length || 0}
                      </p>
                    </div>
                    <div className="public-card p-4 text-center">
                      <div className="inline-flex p-2 rounded-lg bg-green-500/20 mb-2">
                        <Target size={20} className="text-green-400" />
                      </div>
                      <p className="text-xs text-gray-400 mb-1">
                        {t("clientDash.badgesProgression")}
                      </p>
                      <p className="text-2xl font-bold text-green-400">
                        {badges.catalogue?.length > 0
                          ? Math.round(
                              ((badges.badges_obtenus?.length || 0) /
                                badges.catalogue.length) *
                                100
                            )
                          : 0}
                        %
                      </p>
                    </div>
                    <div className="public-card p-4 text-center">
                      <div className="inline-flex p-2 rounded-lg bg-purple-500/20 mb-2">
                        <Gift size={20} className="text-purple-400" />
                      </div>
                      <p className="text-xs text-gray-400 mb-1">
                        {t("clientDash.bonusDebloques")}
                      </p>
                      <p className="text-2xl font-bold text-purple-400">
                        {(badges.badges_obtenus?.reduce(
                          (sum, b) => sum + parseFloat(b.recompense_bonus || 0),
                          0
                        ) || 0).toLocaleString("fr-FR")} Ar
                      </p>
                    </div>
                  </div>

                  {/* Barre de progression globale */}
                  <div className="public-card p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">
                        {t("clientDash.progressionGlobale")}
                      </span>
                      <span className="text-sm font-bold text-[#67E8F9]">
                        {badges.badges_obtenus?.length || 0} / {badges.catalogue?.length || 0}
                      </span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#06B6D4] to-[#1E40AF] rounded-full transition-all duration-1000"
                        style={{
                          width: `${
                            badges.catalogue?.length > 0
                              ? ((badges.badges_obtenus?.length || 0) /
                                  badges.catalogue.length) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Catégories */}
                  {["debut", "fidelite", "social", "special"].map((cat) => {
                    const badgesCat = badges.catalogue?.filter(
                      (b) => b.categorie === cat
                    );
                    if (!badgesCat || badgesCat.length === 0) return null;

                    const catInfo = getCategorieBadge(cat);

                    return (
                      <div key={cat}>
                        <div className="flex items-center gap-2 mb-3">
                          <div
                            className={`w-1 h-6 rounded-full bg-gradient-to-b ${catInfo.color}`}
                          />
                          <h3 className="font-semibold text-lg">
                            {catInfo.label}
                          </h3>
                          <span className="text-xs text-gray-500">
                            ({badgesCat.filter((b) => b.obtenu).length} /{" "}
                            {badgesCat.length})
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {badgesCat.map((badge) => (
                            <div
                              key={badge.id}
                              className={`public-card p-4 text-center relative overflow-hidden transition-all ${
                                badge.obtenu
                                  ? "border-2 border-yellow-500/30 shadow-lg shadow-yellow-500/10"
                                  : "opacity-70 hover:opacity-100"
                              }`}
                            >
                              {/* Badge obtenu - étoile */}
                              {badge.obtenu && (
                                <div className="absolute top-2 right-2">
                                  <Star
                                    size={14}
                                    className="text-yellow-400"
                                    fill="currentColor"
                                  />
                                </div>
                              )}

                              {/* Icône */}
                              <div
                                className={`inline-flex p-3 rounded-2xl mb-3 ${
                                  badge.obtenu
                                    ? `bg-gradient-to-br ${catInfo.color} shadow-lg`
                                    : "bg-white/5"
                                }`}
                              >
                                <span className="text-4xl">{badge.icone}</span>
                              </div>

                              {/* Nom */}
                              <h4
                                className={`font-semibold text-sm mb-1 ${
                                  badge.obtenu ? "text-white" : "text-gray-400"
                                }`}
                              >
                                {badge.nom}
                              </h4>

                              {/* Description */}
                              <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                                {badge.description}
                              </p>

                              {/* Bonus */}
                              {parseFloat(badge.recompense_bonus) > 0 && (
                                <div
                                  className={`text-xs font-bold mb-2 ${
                                    badge.obtenu
                                      ? "text-green-400"
                                      : "text-yellow-500"
                                  }`}
                                >
                                  🎁 +{parseFloat(badge.recompense_bonus).toLocaleString("fr-FR")} Ar
                                </div>
                              )}

                              {/* Progression */}
                              {!badge.obtenu && (
                                <>
                                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden mb-1">
                                    <div
                                      className="h-full bg-gradient-to-r from-[#06B6D4] to-[#1E40AF] rounded-full transition-all duration-500"
                                      style={{ width: `${badge.progression || 0}%` }}
                                    />
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    {badge.valeur_actuelle || 0} /{" "}
                                    {badge.condition_valeur}
                                  </p>
                                </>
                              )}

                              {/* Date débloqué */}
                              {badge.obtenu && badge.debloque_le && (
                                <p className="text-xs text-gray-500 mt-2">
                                  {formatDate(badge.debloque_le)}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Message si aucun badge */}
                  {badges.badges_obtenus?.length === 0 && (
                    <div className="public-card p-12 text-center">
                      <Trophy
                        size={64}
                        className="text-gray-600 mx-auto mb-4"
                      />
                      <h3 className="text-lg font-semibold mb-2">
                        {t("clientDash.aucunBadgeEncore")}
                      </h3>
                      <p className="text-sm text-gray-400 mb-4">
                        {t("clientDash.debloquezBadgeDesc")}
                      </p>
                      <Link to="/reservation" className="btn-public-cyan inline-flex">
                        {t("clientDash.commencer")}
                      </Link>
                    </div>
                  )}
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
                            title="Marquer comme lu"
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
    </div>
  );
}