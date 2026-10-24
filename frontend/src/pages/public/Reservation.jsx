import { useState } from "react";
import {
  Calendar,
  Clock,
  Users,
  User,
  Mail,
  Phone,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  Wifi,
  ArrowRight,
  Copy,
  Check,
  Search,
} from "lucide-react";
import { usePublicLang } from "../../context/PublicLangContext";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function Reservation() {
  const { langue } = usePublicLang();
  const [etape, setEtape] = useState("form");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [reservationCreee, setReservationCreee] = useState(null);
  const [copie, setCopie] = useState(false);

  const [form, setForm] = useState({
    nom: "",
    email: "",
    telephone: "",
    date_reservation: "",
    heure_reservation: "08:00",
    duree: "1h",
    nombre_postes: 1,
    message: "",
  });

  const [codeRecherche, setCodeRecherche] = useState("");
  const [reservationTrouvee, setReservationTrouvee] = useState(null);

  const textes = {
    fr: {
      badge: "Réservation en ligne",
      titre: "Réservez votre poste",
      sousTitre:
        "Réservez à l'avance et garantissez votre place dans notre cybercafé",
      nom: "Nom complet",
      placeholderNom: "Rakoto Jean",
      email: "Email",
      placeholderEmail: "exemple@email.com",
      telephone: "Téléphone",
      placeholderTelephone: "+261 34 XX XXX XX",
      date: "Date souhaitée",
      heure: "Heure souhaitée",
      duree: "Durée",
      postes: "Nombre de postes",
      message: "Message (optionnel)",
      placeholderMessage: "Besoins particuliers, questions...",
      boutonReserver: "Réserver maintenant",
      boutonEnvoiEnCours: "Envoi en cours...",
      duree1h: "1 heure",
      duree2h: "2 heures",
      duree4h: "4 heures",
      dureeJournee: "Journée (8h-22h)",
      infoTitre: "Réservation gratuite",
      infoTexte:
        "Aucun paiement en ligne. Vous payez à l'accueil lors de votre arrivée.",
      succesTitre: "Réservation enregistrée !",
      succesSousTitre:
        "Nous avons bien reçu votre demande. Vous recevrez un email de confirmation très bientôt.",
      codeReservation: "Votre code de réservation",
      copier: "Copier",
      copie: "Copié !",
      infoImportante: "Important",
      infoConserver:
        "Conservez ce code précieusement. Présentez-le à l'accueil lors de votre arrivée.",
      detailTitre: "Détails de la réservation",
      nouvelleReservation: "Faire une nouvelle réservation",
      rechercherTitre: "Consulter ma réservation",
      rechercherSousTitre:
        "Entrez votre code de réservation pour voir son statut",
      placeholderCode: "RES-XXXXXX",
      boutonRechercher: "Rechercher",
      boutonRecherche: "Recherche...",
      retourFormulaire: "← Retour au formulaire",
      codeIntrouvable: "Aucune réservation trouvée avec ce code",
    },
    mg: {
      badge: "Fisoratana an-tserasera",
      titre: "Misorata toerana",
      sousTitre:
        "Misorata mialoha ary antoka ny toeranao ao amin'ny cybercafé-nao",
      nom: "Anarana feno",
      placeholderNom: "Rakoto Jean",
      email: "Mailaka",
      placeholderEmail: "ohatra@email.com",
      telephone: "Finday",
      placeholderTelephone: "+261 34 XX XXX XX",
      date: "Daty tianao",
      heure: "Ora tianao",
      duree: "Faharetana",
      postes: "Isan'ny toerana",
      message: "Hafatra (tsy voatery)",
      placeholderMessage: "Zava-manokana, fanontaniana...",
      boutonReserver: "Misorata izao",
      boutonEnvoiEnCours: "Mandefa...",
      duree1h: "Adiny 1",
      duree2h: "Adiny 2",
      duree4h: "Adiny 4",
      dureeJournee: "Andro iray (8h-22h)",
      infoTitre: "Fisoratana maimaim-poana",
      infoTexte:
        "Tsy misy fandoavam-bola amin'ny Internet. Mandoa ianao any amin'ny fandraisana.",
      succesTitre: "Voasoratra ny fisoratana!",
      succesSousTitre:
        "Voarainay ny fangatahanao. Handray mailaka fanamafisana ianao tsy ho ela.",
      codeReservation: "Ny kaodin'ny fisoratanao",
      copier: "Adikao",
      copie: "Voadika!",
      infoImportante: "Zava-dehibe",
      infoConserver:
        "Tehirizo tsara ity kaody ity. Asehoy any amin'ny fandraisana rehefa tonga ianao.",
      detailTitre: "Antsipiriany ny fisoratana",
      nouvelleReservation: "Misorata vaovao",
      rechercherTitre: "Jereo ny fisoratako",
      rechercherSousTitre:
        "Ampidiro ny kaodin'ny fisoratanao hijery ny satany",
      placeholderCode: "RES-XXXXXX",
      boutonRechercher: "Karohy",
      boutonRecherche: "Mikaroka...",
      retourFormulaire: "← Miverina amin'ny formulaire",
      codeIntrouvable: "Tsy misy fisoratana hita amin'ity kaody ity",
    },
  };

  const t = textes[langue] || textes.fr;

  const handleChange = (champ, valeur) => {
    setForm({ ...form, [champ]: valeur });
    if (erreur) setErreur(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);

    try {
      const reponse = await fetch(`${API_URL}/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          nombre_postes: parseInt(form.nombre_postes),
        }),
      });

      const data = await reponse.json();

      if (reponse.ok && data.success) {
        setReservationCreee(data.reservation);
        setEtape("success");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setErreur(data.message || "Une erreur est survenue");
      }
    } catch (err) {
      console.error("Erreur réservation:", err);
      setErreur(
        langue === "mg"
          ? "Tsy afaka mifandray amin'ny serveur"
          : "Impossible de contacter le serveur. Vérifiez votre connexion."
      );
    } finally {
      setChargement(false);
    }
  };

  const handleRechercher = async (e) => {
    e.preventDefault();
    if (!codeRecherche.trim()) return;

    setChargement(true);
    setErreur(null);
    setReservationTrouvee(null);

    try {
      const reponse = await fetch(
        `${API_URL}/reservations/detail?code=${encodeURIComponent(
          codeRecherche.trim()
        )}`
      );
      const data = await reponse.json();

      if (reponse.ok && data.success) {
        setReservationTrouvee(data.reservation);
      } else {
        setErreur(t.codeIntrouvable);
      }
    } catch (err) {
      setErreur(
        langue === "mg"
          ? "Tsy afaka mifandray amin'ny serveur"
          : "Impossible de contacter le serveur."
      );
    } finally {
      setChargement(false);
    }
  };

  const copierCode = async () => {
    if (!reservationCreee) return;
    try {
      await navigator.clipboard.writeText(reservationCreee.code);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch (err) {
      console.error("Erreur copie:", err);
    }
  };

  const nouvelleReservation = () => {
    setEtape("form");
    setReservationCreee(null);
    setForm({
      nom: "",
      email: "",
      telephone: "",
      date_reservation: "",
      heure_reservation: "08:00",
      duree: "1h",
      nombre_postes: 1,
      message: "",
    });
  };

  const getStatutBadge = (statut) => {
    const badges = {
      en_attente: {
        label: langue === "mg" ? "Miandry" : "En attente",
        color: "bg-[#F97316]/10 text-[#F97316] border-[#F97316]/30",
      },
      confirmee: {
        label: langue === "mg" ? "Voamarina" : "Confirmée",
        color: "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30",
      },
      annulee: {
        label: langue === "mg" ? "Voafafa" : "Annulée",
        color: "bg-red-500/10 text-red-400 border-red-500/30",
      },
      terminee: {
        label: langue === "mg" ? "Vita" : "Terminée",
        color: "bg-gray-500/10 text-gray-400 border-gray-500/30",
      },
    };
    return badges[statut] || badges.en_attente;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // ===== ÉCRAN SUCCÈS =====
  if (etape === "success" && reservationCreee) {
    return (
      <div className="public-page">
        <section className="gradient-hero py-20 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-72 h-72 bg-[#22C55E]/20 rounded-full blur-3xl" />
          </div>
          <div className="public-container relative text-center">
            <div className="inline-flex p-4 rounded-full bg-[#22C55E]/20 border-2 border-[#22C55E] mb-6 anim-float">
              <CheckCircle2 size={48} className="text-[#22C55E]" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 anim-fade-up">
              {t.succesTitre}
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto anim-fade-up delay-100">
              {t.succesSousTitre}
            </p>
          </div>
        </section>

        <section className="py-20 bg-[#0A1628]">
          <div className="public-container max-w-2xl">
            <div className="public-card text-center anim-fade-up">
              <p className="text-sm text-gray-400 mb-3 uppercase tracking-wider">
                {t.codeReservation}
              </p>
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-3xl md:text-4xl font-bold gradient-text tracking-wider">
                  {reservationCreee.code}
                </span>
                <button
                  onClick={copierCode}
                  className="p-2 rounded-lg bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20 text-[#67E8F9] transition"
                  title={t.copier}
                >
                  {copie ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>
              {copie && (
                <p className="text-xs text-[#22C55E] anim-fade-up">
                  {t.copie}
                </p>
              )}
            </div>

            <div className="mt-6 bg-[#F97316]/10 border border-[#F97316]/30 rounded-2xl p-5 anim-fade-up delay-100">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#F97316]/20 flex-shrink-0">
                  <MessageSquare size={18} className="text-[#F97316]" />
                </div>
                <div>
                  <p className="font-semibold text-[#F97316] mb-1">
                    {t.infoImportante}
                  </p>
                  <p className="text-sm text-gray-300">{t.infoConserver}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 public-card anim-fade-up delay-200">
              <h2 className="text-lg font-bold mb-4">{t.detailTitre}</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-[#1E40AF]/20">
                  <span className="text-gray-400">{t.nom}</span>
                  <span className="font-medium">{reservationCreee.nom}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1E40AF]/20">
                  <span className="text-gray-400">{t.email}</span>
                  <span className="font-medium truncate max-w-[60%]">
                    {reservationCreee.email}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1E40AF]/20">
                  <span className="text-gray-400">{t.date}</span>
                  <span className="font-medium">
                    {formatDate(reservationCreee.date_reservation)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1E40AF]/20">
                  <span className="text-gray-400">{t.heure}</span>
                  <span className="font-medium">
                    {reservationCreee.heure_reservation?.substring(0, 5)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1E40AF]/20">
                  <span className="text-gray-400">{t.duree}</span>
                  <span className="font-medium">{reservationCreee.duree}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1E40AF]/20">
                  <span className="text-gray-400">{t.postes}</span>
                  <span className="font-medium">
                    {reservationCreee.nombre_postes}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-400">Statut</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      getStatutBadge(reservationCreee.statut).color
                    }`}
                  >
                    {getStatutBadge(reservationCreee.statut).label}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center anim-fade-up delay-300">
              <button
                onClick={nouvelleReservation}
                className="btn-public-outline justify-center"
              >
                <Calendar size={18} />
                {t.nouvelleReservation}
              </button>
              <a href="/portail" className="btn-public-cyan justify-center">
                <Wifi size={18} />
                {langue === "mg" ? "Hiditra Wi-Fi" : "Accéder au portail"}
                <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ===== ÉCRAN RECHERCHE =====
  if (etape === "lookup") {
    return (
      <div className="public-page">
        <section className="gradient-hero py-20 relative overflow-hidden">
          <div className="public-container relative text-center">
            <div className="inline-flex p-4 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/30 mb-6 anim-float">
              <Search size={40} className="text-[#67E8F9]" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 anim-fade-up">
              {t.rechercherTitre}
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto anim-fade-up delay-100">
              {t.rechercherSousTitre}
            </p>
          </div>
        </section>

        <section className="py-20 bg-[#0A1628]">
          <div className="public-container max-w-2xl">
            <form
              onSubmit={handleRechercher}
              className="public-card anim-fade-up"
            >
              <label className="block text-sm text-gray-400 mb-2">
                {t.codeReservation}
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={codeRecherche}
                  onChange={(e) =>
                    setCodeRecherche(e.target.value.toUpperCase())
                  }
                  placeholder={t.placeholderCode}
                  className="flex-1 bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none transition font-mono tracking-wider"
                  required
                />
                <button
                  type="submit"
                  disabled={chargement}
                  className="btn-public-cyan disabled:opacity-60"
                >
                  {chargement ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {t.boutonRecherche}
                    </>
                  ) : (
                    <>
                      <Search size={18} />
                      {t.boutonRechercher}
                    </>
                  )}
                </button>
              </div>
            </form>

            {erreur && (
              <div className="mt-6 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-4 flex items-center gap-3 anim-fade-up">
                <XCircle size={20} />
                <p>{erreur}</p>
              </div>
            )}

            {reservationTrouvee && (
              <div className="mt-6 public-card anim-fade-up">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">
                    {reservationTrouvee.code_reservation}
                  </h2>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      getStatutBadge(reservationTrouvee.statut).color
                    }`}
                  >
                    {getStatutBadge(reservationTrouvee.statut).label}
                  </span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-[#1E40AF]/20">
                    <span className="text-gray-400">{t.nom}</span>
                    <span className="font-medium">{reservationTrouvee.nom}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1E40AF]/20">
                    <span className="text-gray-400">{t.date}</span>
                    <span className="font-medium">
                      {formatDate(reservationTrouvee.date_reservation)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1E40AF]/20">
                    <span className="text-gray-400">{t.heure}</span>
                    <span className="font-medium">
                      {reservationTrouvee.heure_reservation?.substring(0, 5)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1E40AF]/20">
                    <span className="text-gray-400">{t.duree}</span>
                    <span className="font-medium">
                      {reservationTrouvee.duree}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-400">{t.postes}</span>
                    <span className="font-medium">
                      {reservationTrouvee.nombre_postes}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setEtape("form");
                  setReservationTrouvee(null);
                  setErreur(null);
                  setCodeRecherche("");
                }}
                className="text-sm text-[#67E8F9] hover:underline"
              >
                {t.retourFormulaire}
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ===== ÉCRAN FORMULAIRE =====
  return (
    <div className="public-page">
      <section className="gradient-hero py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-[#06B6D4]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#1E40AF]/30 rounded-full blur-3xl" />
        </div>

        <div className="public-container relative text-center">
          <span className="section-badge anim-fade-up">{t.badge}</span>
          <h1 className="section-title anim-fade-up delay-100">{t.titre}</h1>
          <p className="section-subtitle anim-fade-up delay-200">
            {t.sousTitre}
          </p>
        </div>
      </section>

      <section className="py-20 bg-[#0A1628]">
        <div className="public-container max-w-3xl">
          <div className="mb-8 bg-[#06B6D4]/10 border border-[#06B6D4]/30 rounded-2xl p-5 anim-fade-up">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#06B6D4]/20 flex-shrink-0">
                <CheckCircle2 size={18} className="text-[#67E8F9]" />
              </div>
              <div>
                <p className="font-semibold text-[#67E8F9] mb-1">
                  {t.infoTitre}
                </p>
                <p className="text-sm text-gray-300">{t.infoTexte}</p>
              </div>
            </div>
          </div>

          {erreur && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-4 flex items-center gap-3 anim-fade-up">
              <XCircle size={20} />
              <p>{erreur}</p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="public-card anim-fade-up delay-100"
          >
            {/* Ligne 1 : Nom + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  <User size={14} className="inline mr-1" />
                  {t.nom} *
                </label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={(e) => handleChange("nom", e.target.value)}
                  required
                  minLength={2}
                  placeholder={t.placeholderNom}
                  className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  <Mail size={14} className="inline mr-1" />
                  {t.email} *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                  placeholder={t.placeholderEmail}
                  className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none transition"
                />
              </div>
            </div>

            {/* Ligne 2 : Téléphone + Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  <Phone size={14} className="inline mr-1" />
                  {t.telephone} *
                </label>
                <input
                  type="tel"
                  value={form.telephone}
                  onChange={(e) => handleChange("telephone", e.target.value)}
                  required
                  minLength={8}
                  placeholder={t.placeholderTelephone}
                  className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  <Calendar size={14} className="inline mr-1" />
                  {t.date} *
                </label>
                <input
                  type="date"
                  value={form.date_reservation}
                  onChange={(e) =>
                    handleChange("date_reservation", e.target.value)
                  }
                  min={new Date().toISOString().split("T")[0]}
                  required
                  className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none transition"
                />
              </div>
            </div>

            {/* Ligne 3 : Heure + Durée + Nombre postes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  <Clock size={14} className="inline mr-1" />
                  {t.heure} *
                </label>
                <input
                  type="time"
                  value={form.heure_reservation}
                  onChange={(e) =>
                    handleChange("heure_reservation", e.target.value)
                  }
                  min="08:00"
                  max="21:00"
                  required
                  className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  <Clock size={14} className="inline mr-1" />
                  {t.duree} *
                </label>
                <select
                  value={form.duree}
                  onChange={(e) => handleChange("duree", e.target.value)}
                  required
                  className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none transition"
                >
                  <option value="1h">{t.duree1h} — 500 Ar</option>
                  <option value="2h">{t.duree2h} — 1 000 Ar</option>
                  <option value="4h">{t.duree4h} — 2 000 Ar</option>
                  <option value="Journée">
                    {t.dureeJournee} — 5 000 Ar
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  <Users size={14} className="inline mr-1" />
                  {t.postes} *
                </label>
                <select
                  value={form.nombre_postes}
                  onChange={(e) =>
                    handleChange("nombre_postes", e.target.value)
                  }
                  required
                  className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none transition"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                </select>
              </div>
            </div>

            {/* Ligne 4 : Message (pleine largeur) */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">
                <MessageSquare size={14} className="inline mr-1" />
                {t.message}
              </label>
              <textarea
                value={form.message}
                onChange={(e) => handleChange("message", e.target.value)}
                rows={4}
                placeholder={t.placeholderMessage}
                className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none transition resize-none"
              />
            </div>

            {/* Bouton */}
            <button
              type="submit"
              disabled={chargement}
              className="btn-public-cyan w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {chargement ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t.boutonEnvoiEnCours}
                </>
              ) : (
                <>
                  <Send size={18} />
                  {t.boutonReserver}
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center anim-fade-up delay-200">
            <button
              onClick={() => setEtape("lookup")}
              className="text-sm text-[#67E8F9] hover:underline inline-flex items-center gap-2"
            >
              <Search size={16} />
              {t.rechercherTitre}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}