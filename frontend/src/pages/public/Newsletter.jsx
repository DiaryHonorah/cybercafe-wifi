import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Mail,
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
  Sparkles,
  Gift,
  TrendingUp,
  Bell,
  ArrowRight,
} from "lucide-react";
import { usePublicLang } from "../../context/PublicLangContext";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function Newsletter() {
  const { langue } = usePublicLang();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [nom, setNom] = useState("");
  const [chargement, setChargement] = useState(false);
  const [etat, setEtat] = useState("form"); // form | succes | confirme | desinscrit | erreur
  const [message, setMessage] = useState("");
  const [nbAbonnes, setNbAbonnes] = useState(0);

  const textes = {
    fr: {
      badge: "Newsletter",
      titre: "Restez informé",
      sousTitre:
        "Recevez nos promotions, conseils et actualités directement dans votre boîte mail",
      emailLabel: "Votre email *",
      emailPlaceholder: "exemple@email.com",
      nomLabel: "Votre nom (optionnel)",
      nomPlaceholder: "Rakoto Jean",
      boutonInscrire: "S'inscrire gratuitement",
      boutonInscription: "Inscription...",
      // Avantages
      avantagesTitre: "Pourquoi s'inscrire ?",
      avantage1: "Promotions exclusives",
      avantage1Desc: "Recevez nos offres avant tout le monde",
      avantage2: "Conseils pratiques",
      avantage2Desc: "Astuces pour mieux utiliser Internet",
      avantage3: "Actualités",
      avantage3Desc: "Nouveautés et événements du cybercafé",
      // Succès
      succesTitre: "Vérifiez votre email !",
      succesDesc:
        "Un email de confirmation vous a été envoyé. Cliquez sur le lien pour valider votre inscription.",
      // Confirmé
      confirmeTitre: "Inscription confirmée !",
      confirmeDesc:
        "Merci ! Vous recevrez désormais nos newsletters.",
      // Désinscrit
      desinscritTitre: "Désinscription effectuée",
      desinscritDesc:
        "Vous ne recevrez plus nos newsletters. Vous pouvez vous réinscrire à tout moment.",
      // Erreur
      erreurTitre: "Erreur",
      // Stats
      abonnesLabel: "personnes déjà inscrites",
      // Note
      note:
        "En vous inscrivant, vous acceptez de recevoir nos emails. Vous pouvez vous désinscrire à tout moment.",
      retourAccueil: "Retour à l'accueil",
    },
    mg: {
      badge: "Gazetiboky",
      titre: "Mijanona ho fantatra",
      sousTitre:
        "Mahazoa ny tolotray, torohevitra ary vaovao ao amin'ny mailakao",
      emailLabel: "Ny mailakao *",
      emailPlaceholder: "ohatra@email.com",
      nomLabel: "Ny anaranao (tsy voatery)",
      nomPlaceholder: "Rakoto Jean",
      boutonInscrire: "Hisoratra maimaim-poana",
      boutonInscription: "Fisoratana...",
      avantagesTitre: "Nahoana no hisoratra?",
      avantage1: "Tolotra manokana",
      avantage1Desc: "Mahazoa ny tolotray alohan'ny rehetra",
      avantage2: "Torohevitra",
      avantage2Desc: "Fomba hampiasana ny Internet tsara",
      avantage3: "Vaovao",
      avantage3Desc: "Vaovao sy hetsika ao amin'ny cybercafé",
      succesTitre: "Jereo ny mailakao!",
      succesDesc:
        "Nalefa taminao ny mailaka fanamafisana. Tsindrio ny rohy hanamafisana ny fisoratanao.",
      confirmeTitre: "Voamarina ny fisoratana!",
      confirmeDesc:
        "Misaotra! Handray ny gazetiboky izao ianao.",
      desinscritTitre: "Voafafa ny fisoratana",
      desinscritDesc:
        "Tsy handray gazetiboky intsony ianao. Afaka misoratra indray ianao raha tianao.",
      erreurTitre: "Hadisoana",
      abonnesLabel: "olona efa nisoratra",
      note:
        "Raha misoratra ianao dia manaiky handray mailaka. Afaka miala ianao amin'ny fotoana rehetra.",
      retourAccueil: "Hiverina any amin'ny fandraisana",
    },
  };

  const t = textes[langue] || textes.fr;

  // Détecter le retour depuis l'email de confirmation
  useEffect(() => {
    if (searchParams.get("confirme") === "1") {
      setEtat("confirme");
    } else if (searchParams.get("desinscrit") === "1") {
      setEtat("desinscrit");
    }
  }, [searchParams]);

  // Charger le nombre d'abonnés
  useEffect(() => {
    fetch(`${API_URL}/newsletter/stats-publiques`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setNbAbonnes(d.stats.total_abonnes || 0);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/newsletter/inscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          nom: nom.trim() || null,
          source: "page-newsletter",
        }),
      });

      const data = await res.json();

      if (data.success) {
        setEtat("succes");
      } else {
        setMessage(data.message || "Une erreur est survenue");
        setEtat("erreur");
      }
    } catch (err) {
      setMessage("Impossible de contacter le serveur");
      setEtat("erreur");
    } finally {
      setChargement(false);
    }
  };

  // ===== ÉCRAN SUCCÈS =====
  if (etat === "succes") {
    return (
      <div className="public-page">
        <section className="gradient-hero py-20 min-h-[60vh] flex items-center">
          <div className="public-container relative text-center">
            <div className="inline-flex p-4 rounded-full bg-[#22C55E]/20 border-2 border-[#22C55E] mb-6 anim-float">
              <CheckCircle2 size={48} className="text-[#22C55E]" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              {t.succesTitre}
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
              {t.succesDesc}
            </p>
            <Link to="/" className="btn-public-cyan inline-flex">
              <ArrowRight size={18} />
              {t.retourAccueil}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  // ===== ÉCRAN CONFIRMÉ =====
  if (etat === "confirme") {
    return (
      <div className="public-page">
        <section className="gradient-hero py-20 min-h-[60vh] flex items-center">
          <div className="public-container relative text-center">
            <div className="inline-flex p-4 rounded-full bg-[#22C55E]/20 border-2 border-[#22C55E] mb-6 anim-float">
              <Sparkles size={48} className="text-[#22C55E]" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              {t.confirmeTitre}
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
              {t.confirmeDesc}
            </p>
            <Link to="/" className="btn-public-cyan inline-flex">
              <ArrowRight size={18} />
              {t.retourAccueil}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  // ===== ÉCRAN DÉSINSCRIT =====
  if (etat === "desinscrit") {
    return (
      <div className="public-page">
        <section className="gradient-hero py-20 min-h-[60vh] flex items-center">
          <div className="public-container relative text-center">
            <div className="inline-flex p-4 rounded-full bg-orange-500/20 border-2 border-orange-500 mb-6 anim-float">
              <XCircle size={48} className="text-orange-400" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              {t.desinscritTitre}
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
              {t.desinscritDesc}
            </p>
            <Link to="/" className="btn-public-cyan inline-flex">
              <ArrowRight size={18} />
              {t.retourAccueil}
            </Link>
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

          {/* Compteur abonnés */}
          {nbAbonnes > 0 && (
            <div className="mt-6 inline-flex items-center gap-2 bg-white/5 backdrop-blur border border-[#06B6D4]/30 px-4 py-2 rounded-full anim-fade-up delay-300">
              <TrendingUp size={16} className="text-[#67E8F9]" />
              <span className="text-sm font-medium text-white">
                {nbAbonnes} {t.abonnesLabel}
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="py-20 bg-[#0A1628]">
        <div className="public-container max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulaire */}
            <div className="public-card p-6 md:p-8 anim-fade-up">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#06B6D4]">
                  <Mail size={22} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{t.titre}</h2>
                  <p className="text-xs text-gray-400">{t.sousTitre}</p>
                </div>
              </div>

              {etat === "erreur" && message && (
                <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 flex items-center gap-2">
                  <XCircle size={18} />
                  <p>{message}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {t.emailLabel}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder={t.emailPlaceholder}
                    className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {t.nomLabel}
                  </label>
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder={t.nomPlaceholder}
                    className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-3 px-4 text-white focus:border-[#06B6D4] focus:outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={chargement}
                  className="btn-public-cyan w-full justify-center disabled:opacity-60"
                >
                  {chargement ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {t.boutonInscription}
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      {t.boutonInscrire}
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">{t.note}</p>
              </form>
            </div>

            {/* Avantages */}
            <div className="space-y-4 anim-fade-up delay-100">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={20} className="text-[#67E8F9]" />
                <h2 className="text-xl font-bold">{t.avantagesTitre}</h2>
              </div>

              <div className="public-card p-5 flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-[#F97316]/20 flex-shrink-0">
                  <Gift size={20} className="text-[#F97316]" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{t.avantage1}</h3>
                  <p className="text-sm text-gray-400">{t.avantage1Desc}</p>
                </div>
              </div>

              <div className="public-card p-5 flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-[#22C55E]/20 flex-shrink-0">
                  <Bell size={20} className="text-[#22C55E]" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{t.avantage2}</h3>
                  <p className="text-sm text-gray-400">{t.avantage2Desc}</p>
                </div>
              </div>

              <div className="public-card p-5 flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-[#06B6D4]/20 flex-shrink-0">
                  <TrendingUp size={20} className="text-[#67E8F9]" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{t.avantage3}</h3>
                  <p className="text-sm text-gray-400">{t.avantage3Desc}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}