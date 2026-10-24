import { useState } from "react";
import {
  Award,
  Gift,
  Search,
  User,
  Phone,
  Mail,
  Loader2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Trophy,
  Star,
  Zap,
  Printer,
  Clock,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Crown,
} from "lucide-react";
import { usePublicLang } from "../../context/PublicLangContext";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function Fidelite() {
  const { langue } = usePublicLang();
  const [etape, setEtape] = useState("accueil"); // accueil | inscription | carte | recompenses
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [carte, setCarte] = useState(null);
  const [carteCreee, setCarteCreee] = useState(null);
  const [copie, setCopie] = useState(false);
  const [recompenses, setRecompenses] = useState([]);
  const [historique, setHistorique] = useState([]);

  const [formInscription, setFormInscription] = useState({
    client_nom: "",
    client_telephone: "",
    client_email: "",
  });

  const [codeRecherche, setCodeRecherche] = useState("");

  const textes = {
    fr: {
      badge: "Programme de fidélité",
      titre: "Carte de fidélité",
      sousTitre:
        "Gagnez des points à chaque achat et débloquez des récompenses exclusives",
      // Accueil
      avantagesTitre: "Pourquoi rejoindre ?",
      avantage1Titre: "1 Ar = 1 point",
      avantage1Desc: "Chaque ariary dépensé vous rapporte des points",
      avantage2Titre: "Récompenses gratuites",
      avantage2Desc: "1h gratuite à 1000 points, journée à 5000 points",
      avantage3Titre: "4 niveaux",
      avantage3Desc: "Bronze, Argent, Or, Platine avec avantages croissants",
      boutonInscription: "Créer ma carte gratuitement",
      boutonConsulter: "Consulter ma carte",
      // Inscription
      inscriptionTitre: "Créer ma carte de fidélité",
      inscriptionSousTitre:
        "Gratuit et immédiat. Recevez votre code carte par SMS.",
      nom: "Nom complet",
      placeholderNom: "Rakoto Jean",
      telephone: "Numéro de téléphone",
      placeholderTelephone: "+261 34 XX XXX XX",
      email: "Email (optionnel)",
      placeholderEmail: "exemple@email.com",
      boutonCreer: "Créer ma carte",
      boutonCreation: "Création...",
      // Carte créée
      succesTitre: "Carte créée avec succès !",
      succesSousTitre: "Conservez précieusement votre code de carte",
      votreCode: "Votre code de carte",
      copier: "Copier",
      copie: "Copié !",
      infoCode:
        "Présentez ce code à chaque achat pour cumuler vos points. Conservez-le précieusement.",
      voirMaCarte: "Voir ma carte",
      // Consultation
      consultTitre: "Consulter ma carte",
      consultSousTitre: "Entrez votre code de carte pour voir vos points",
      placeholderCode: "FID-XXXXXX",
      boutonRechercher: "Rechercher",
      boutonRecherche: "Recherche...",
      codeIntrouvable: "Aucune carte trouvée avec ce code",
      // Carte détail
      pointsDisponibles: "Points disponibles",
      pointsTotal: "Points cumulés",
      pointsUtilises: "Points utilisés",
      niveauActuel: "Niveau actuel",
      progresVers: "Progression vers",
      pointsManquants: "points restants",
      recompensesTitre: "Récompenses disponibles",
      recompensesDebloquees: "Débloquée",
      recompensesVerrouillee: "Verrouillée",
      recompensesManque: "Encore {points} points",
      historiqueTitre: "Historique récent",
      aucunHistorique: "Aucun mouvement pour le moment",
      // Recompenses
      recompensesPageTitre: "Toutes les récompenses",
      recompensesPageSousTitre:
        "Découvrez tout ce que vous pouvez obtenir avec vos points",
      pointsRequis: "points requis",
      // Général
      retourAccueil: "← Retour",
      points: "points",
      ar: "Ar",
    },
    mg: {
      badge: "Fandaharana tsy fivadihana",
      titre: "Karatra tsy fivadihana",
      sousTitre:
        "Mahazoa isa amin'ny fividianana rehetra ary misokatra valisoa manokana",
      avantagesTitre: "Nahoana no hiditra?",
      avantage1Titre: "1 Ar = 1 isa",
      avantage1Desc: "Ny ariary rehetra lany dia mahazo isa ianao",
      avantage2Titre: "Valisoa maimaim-poana",
      avantage2Desc: "Adiny 1 maimaim-poana amin'ny isa 1000",
      avantage3Titre: "Ambaratonga 4",
      avantage3Desc: "Bronze, Argent, Or, Platine",
      boutonInscription: "Mamorona karatra maimaim-poana",
      boutonConsulter: "Hijery ny karatro",
      inscriptionTitre: "Mamorona karatra tsy fivadihana",
      inscriptionSousTitre: "Maimaim-poana ary avy hatrany.",
      nom: "Anarana feno",
      placeholderNom: "Rakoto Jean",
      telephone: "Nomerao finday",
      placeholderTelephone: "+261 34 XX XXX XX",
      email: "Mailaka (tsy voatery)",
      placeholderEmail: "ohatra@email.com",
      boutonCreer: "Mamorona ny karatro",
      boutonCreation: "Manamboatra...",
      succesTitre: "Voaforona soa aman-tsara ny karatra!",
      succesSousTitre: "Tehirizo tsara ny kaodin'ny karatrao",
      votreCode: "Ny kaodin'ny karatrao",
      copier: "Adikao",
      copie: "Voadika!",
      infoCode:
        "Asehoy ity kaody ity isaky ny mividy ianao. Tehirizo tsara izy.",
      voirMaCarte: "Hijery ny karatro",
      consultTitre: "Hijery ny karatro",
      consultSousTitre: "Ampidiro ny kaodin'ny karatrao",
      placeholderCode: "FID-XXXXXX",
      boutonRechercher: "Karohy",
      boutonRecherche: "Mikaroka...",
      codeIntrouvable: "Tsy misy karatra hita",
      pointsDisponibles: "Isa misy",
      pointsTotal: "Isa totaly",
      pointsUtilises: "Isa nampiasaina",
      niveauActuel: "Ambaratonga ankehitriny",
      progresVers: "Fandrosoana mankany",
      pointsManquants: "isa sisa",
      recompensesTitre: "Valisoa misy",
      recompensesDebloquees: "Voadio",
      recompensesVerrouillee: "Mihidy",
      recompensesManque: "Mila isa {points} hafa",
      historiqueTitre: "Tantara vao haingana",
      aucunHistorique: "Tsy misy fihetsika",
      recompensesPageTitre: "Ny valisoa rehetra",
      recompensesPageSousTitre:
        "Fantaro izay rehetra azonao amin'ny isanao",
      pointsRequis: "isa ilaina",
      retourAccueil: "← Miverina",
      points: "isa",
      ar: "Ar",
    },
  };

  const t = textes[langue] || textes.fr;

  // ===== INSCRIPTION =====
  const handleInscription = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);

    try {
      const reponse = await fetch(`${API_URL}/fidelite/inscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formInscription),
      });

      const data = await reponse.json();

      if (reponse.ok && data.success) {
        setCarteCreee(data.carte);
        setEtape("success");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setErreur(
          data.message ||
            (langue === "mg"
              ? "Nisy olana tamin'ny famoronana"
              : "Une erreur est survenue")
        );
      }
    } catch (err) {
      setErreur(
        langue === "mg"
          ? "Tsy afaka mifandray amin'ny serveur"
          : "Impossible de contacter le serveur"
      );
    } finally {
      setChargement(false);
    }
  };

  // ===== CONSULTATION =====
  const handleRechercher = async (e) => {
    e.preventDefault();
    if (!codeRecherche.trim()) return;

    setChargement(true);
    setErreur(null);
    setCarte(null);

    try {
      const reponse = await fetch(
        `${API_URL}/fidelite/carte?code=${encodeURIComponent(
          codeRecherche.trim()
        )}`
      );
      const data = await reponse.json();

      if (reponse.ok && data.success) {
        setCarte(data.carte);
        setRecompenses(data.recompenses || []);
        setHistorique(data.historique || []);
        setEtape("carte");
      } else {
        setErreur(t.codeIntrouvable);
      }
    } catch (err) {
      setErreur(
        langue === "mg"
          ? "Tsy afaka mifandray amin'ny serveur"
          : "Impossible de contacter le serveur"
      );
    } finally {
      setChargement(false);
    }
  };

  const copierCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const getNiveauBadge = (niveau) => {
    const badges = {
      bronze: {
        label: langue === "mg" ? "Bronze" : "Bronze",
        color: "from-[#CD7F32] to-[#A0522D]",
        icone: "🥉",
      },
      argent: {
        label: "Argent",
        color: "from-[#C0C0C0] to-[#A9A9A9]",
        icone: "🥈",
      },
      or: {
        label: "Or",
        color: "from-[#FFD700] to-[#FFA500]",
        icone: "🥇",
      },
      platine: {
        label: "Platine",
        color: "from-[#E5E4E2] to-[#B0C4DE]",
        icone: "💎",
      },
    };
    return badges[niveau] || badges.bronze;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ===== ÉCRAN SUCCÈS =====
  if (etape === "success" && carteCreee) {
    const niveau = getNiveauBadge(carteCreee.niveau);

    return (
      <div className="public-page">
        <section className="gradient-hero py-20 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-72 h-72 bg-[#22C55E]/20 rounded-full blur-3xl" />
          </div>
          <div className="public-container relative text-center">
            <div className="inline-flex p-4 rounded-full bg-[#22C55E]/20 border-2 border-[#22C55E] mb-6 anim-float">
              <Award size={48} className="text-[#22C55E]" />
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
            {/* Code de carte */}
            <div className="public-card text-center anim-fade-up">
              <p className="text-sm text-gray-400 mb-3 uppercase tracking-wider">
                {t.votreCode}
              </p>
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-3xl md:text-4xl font-bold gradient-text tracking-wider">
                  {carteCreee.code_carte}
                </span>
                <button
                  onClick={() => copierCode(carteCreee.code_carte)}
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

            {/* Info */}
            <div className="mt-6 bg-[#F97316]/10 border border-[#F97316]/30 rounded-2xl p-5 anim-fade-up delay-100">
              <div className="flex items-start gap-3">
                <Sparkles size={20} className="text-[#F97316] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300">{t.infoCode}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center anim-fade-up delay-200">
              <button
                onClick={() => {
                  setCodeRecherche(carteCreee.code_carte);
                  setEtape("consultation");
                }}
                className="btn-public-cyan justify-center"
              >
                <Award size={18} />
                {t.voirMaCarte}
              </button>
              <button
                onClick={() => {
                  setEtape("accueil");
                  setCarteCreee(null);
                  setFormInscription({
                    client_nom: "",
                    client_telephone: "",
                    client_email: "",
                  });
                }}
                className="btn-public-outline justify-center"
              >
                {t.retourAccueil}
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ===== ÉCRAN CARTE (détail) =====
  if (etape === "carte" && carte) {
    const niveau = getNiveauBadge(carte.niveau);

    return (
      <div className="public-page">
        <section className="gradient-hero py-12 relative overflow-hidden">
          <div className="public-container relative">
            <button
              onClick={() => setEtape("accueil")}
              className="text-sm text-gray-300 hover:text-[#67E8F9] mb-4 inline-flex items-center gap-2"
            >
              {t.retourAccueil}
            </button>

            {/* Carte visuelle */}
            <div className="max-w-md mx-auto bg-gradient-to-br from-[#1E40AF] via-[#0891B2] to-[#06B6D4] rounded-3xl p-6 shadow-2xl shadow-cyan-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-white/70 text-xs uppercase tracking-wider mb-1">
                      {t.votreCode}
                    </p>
                    <p className="text-white font-mono text-lg font-bold">
                      {carte.code_carte}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl">{niveau.icone}</div>
                    <p className="text-white/70 text-xs">{niveau.label}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-white/70 text-xs mb-1">{carte.client_nom}</p>
                  <p className="text-white/60 text-xs">{carte.client_telephone}</p>
                </div>

                <div className="bg-white/10 backdrop-blur rounded-xl p-3">
                  <p className="text-white/70 text-xs mb-1">
                    {t.pointsDisponibles}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-white text-3xl font-bold">
                      {carte.points_disponibles.toLocaleString()}
                    </p>
                    <p className="text-white/70 text-sm">{t.points}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 bg-[#0A1628]">
          <div className="public-container max-w-2xl">
            {/* Progression vers prochain niveau */}
            {carte.prochain_niveau && (
              <div className="public-card mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-400">
                    {t.progresVers}{" "}
                    <span className="text-[#67E8F9] font-semibold">
                      {getNiveauBadge(carte.prochain_niveau).label}
                    </span>
                  </p>
                  <span className="text-xs text-gray-400">
                    {carte.points_manquants} {t.pointsManquants}
                  </span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#06B6D4] to-[#1E40AF] rounded-full transition-all duration-1000"
                    style={{ width: `${carte.progression}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-right">
                  {carte.points_total.toLocaleString()} / {carte.prochain_seuil.toLocaleString()}
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="public-card text-center">
                <p className="text-xs text-gray-400 mb-1 uppercase">
                  {t.pointsTotal}
                </p>
                <p className="text-2xl font-bold text-[#67E8F9]">
                  {carte.points_total.toLocaleString()}
                </p>
              </div>
              <div className="public-card text-center">
                <p className="text-xs text-gray-400 mb-1 uppercase">
                  {t.pointsUtilises}
                </p>
                <p className="text-2xl font-bold text-[#F97316]">
                  {carte.points_utilises.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Récompenses */}
            <div className="public-card mb-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Gift size={20} className="text-[#67E8F9]" />
                {t.recompensesTitre}
              </h2>
              <div className="space-y-2">
                {recompenses.map((r) => (
                  <div
                    key={r.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      r.debloquee
                        ? "bg-[#22C55E]/10 border-[#22C55E]/30"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          r.debloquee
                            ? "bg-[#22C55E]/20"
                            : "bg-gray-500/20"
                        }`}
                      >
                        {r.debloquee ? (
                          <CheckCircle2
                            size={18}
                            className="text-[#22C55E]"
                          />
                        ) : (
                          <Star size={18} className="text-gray-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{r.nom}</p>
                        <p className="text-xs text-gray-400">
                          {parseInt(r.points_requis).toLocaleString()}{" "}
                          {t.pointsRequis}
                        </p>
                      </div>
                    </div>
                    {r.debloquee ? (
                      <span className="text-xs font-medium text-[#22C55E]">
                        ✓ {t.recompensesDebloquees}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">
                        {t.recompensesManque.replace(
                          "{points}",
                          r.points_manquants
                        )}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Historique */}
            {historique.length > 0 && (
              <div className="public-card">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-[#67E8F9]" />
                  {t.historiqueTitre}
                </h2>
                <div className="space-y-2">
                  {historique.slice(0, 10).map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
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
                            ? "text-[#22C55E]"
                            : "text-[#F97316]"
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

            {historique.length === 0 && (
              <div className="public-card text-center py-6">
                <p className="text-sm text-gray-400">{t.aucunHistorique}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  // ===== ÉCRAN CONSULTATION =====
  if (etape === "consultation") {
    return (
      <div className="public-page">
        <section className="gradient-hero py-20 relative overflow-hidden">
          <div className="public-container relative text-center">
            <div className="inline-flex p-4 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/30 mb-6 anim-float">
              <Search size={40} className="text-[#67E8F9]" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 anim-fade-up">
              {t.consultTitre}
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto anim-fade-up delay-100">
              {t.consultSousTitre}
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
                {t.votreCode}
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

            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setEtape("accueil");
                  setErreur(null);
                  setCodeRecherche("");
                }}
                className="text-sm text-[#67E8F9] hover:underline"
              >
                {t.retourAccueil}
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ===== ÉCRAN INSCRIPTION =====
  if (etape === "inscription") {
    return (
      <div className="public-page">
        <section className="gradient-hero py-20 relative overflow-hidden">
          <div className="public-container relative text-center">
            <div className="inline-flex p-4 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/30 mb-6 anim-float">
              <Award size={40} className="text-[#67E8F9]" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 anim-fade-up">
              {t.inscriptionTitre}
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto anim-fade-up delay-100">
              {t.inscriptionSousTitre}
            </p>
          </div>
        </section>

        <section className="py-20 bg-[#0A1628]">
          <div className="public-container max-w-2xl">
            {erreur && (
              <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-4 flex items-center gap-3 anim-fade-up">
                <XCircle size={20} />
                <p>{erreur}</p>
              </div>
            )}

            <form
              onSubmit={handleInscription}
              className="public-card anim-fade-up"
            >
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    <User size={14} className="inline mr-1" />
                    {t.nom} *
                  </label>
                  <input
                    type="text"
                    value={formInscription.client_nom}
                    onChange={(e) =>
                      setFormInscription({
                        ...formInscription,
                        client_nom: e.target.value,
                      })
                    }
                    required
                    minLength={2}
                    placeholder={t.placeholderNom}
                    className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    <Phone size={14} className="inline mr-1" />
                    {t.telephone} *
                  </label>
                  <input
                    type="tel"
                    value={formInscription.client_telephone}
                    onChange={(e) =>
                      setFormInscription({
                        ...formInscription,
                        client_telephone: e.target.value,
                      })
                    }
                    required
                    minLength={8}
                    placeholder={t.placeholderTelephone}
                    className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    <Mail size={14} className="inline mr-1" />
                    {t.email}
                  </label>
                  <input
                    type="email"
                    value={formInscription.client_email}
                    onChange={(e) =>
                      setFormInscription({
                        ...formInscription,
                        client_email: e.target.value,
                      })
                    }
                    placeholder={t.placeholderEmail}
                    className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={chargement}
                className="btn-public-cyan w-full justify-center disabled:opacity-60"
              >
                {chargement ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {t.boutonCreation}
                  </>
                ) : (
                  <>
                    <Award size={18} />
                    {t.boutonCreer}
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setEtape("accueil");
                  setErreur(null);
                }}
                className="text-sm text-[#67E8F9] hover:underline"
              >
                {t.retourAccueil}
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ===== ÉCRAN ACCUEIL =====
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

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 anim-fade-up delay-300">
            <button
              onClick={() => setEtape("inscription")}
              className="btn-public-cyan justify-center"
            >
              <Award size={18} />
              {t.boutonInscription}
            </button>
            <button
              onClick={() => setEtape("consultation")}
              className="btn-public-outline justify-center"
            >
              <Search size={18} />
              {t.boutonConsulter}
            </button>
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-20 bg-[#0A1628]">
        <div className="public-container">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">
              {t.avantagesTitre}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="public-card text-center">
              <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-[#06B6D4] to-[#0891B2] mb-4">
                <Zap size={28} className="text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">{t.avantage1Titre}</h3>
              <p className="text-sm text-gray-400">{t.avantage1Desc}</p>
            </div>

            <div className="public-card text-center">
              <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] mb-4">
                <Gift size={28} className="text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">{t.avantage2Titre}</h3>
              <p className="text-sm text-gray-400">{t.avantage2Desc}</p>
            </div>

            <div className="public-card text-center">
              <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-[#FFD700] to-[#FFA500] mb-4">
                <Trophy size={28} className="text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">{t.avantage3Titre}</h3>
              <p className="text-sm text-gray-400">{t.avantage3Desc}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}