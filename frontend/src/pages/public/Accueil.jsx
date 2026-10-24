import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Wifi,
  Zap,
  Shield,
  Clock,
  Printer,
  Copy,
  Scan,
  CreditCard,
  MapPin,
  Phone,
  Star,
  ArrowRight,
  Users,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Rocket,
  Heart,
  Award,
  Gift,
  BookOpen,
  MessageCircle,
  Play,
  ChevronRight,
  Quote,
} from "lucide-react";
import { usePublicLang } from "../../context/PublicLangContext";
import Reveal from "../../components/Reveal";
import CommentCaMarche from "../../components/CommentCaMarche";

// ===== Hook compteur animé =====
function useCountUp(end, duration = 2000, demarrer = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!demarrer) return;

    let startTime = null;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, demarrer]);

  return count;
}

// ===== Hook détecter visible =====
function useVisible(threshold = 0.2) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      { threshold }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, visible];
}

export default function Accueil() {
  const { t } = usePublicLang();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [statRef, statVisible] = useVisible(0.3);

  // Parallax souris
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Compteurs animés
  const countClients = useCountUp(100, 2000, statVisible);
  const countHours = useCountUp(14, 1500, statVisible);
  const countPrix = useCountUp(500, 1800, statVisible);

  const services = [
    {
      icon: Wifi,
      titre: "Wi-Fi Starlink",
      description: "Connexion très haut débit via satellite Starlink",
      couleur: "from-[#06B6D4] to-[#0891B2]",
    },
    {
      icon: Printer,
      titre: "Impression",
      description: "Impression noir/blanc et couleur",
      couleur: "from-[#1E40AF] to-[#1D4ED8]",
    },
    {
      icon: Copy,
      titre: "Photocopie",
      description: "Photocopies rapides et économiques",
      couleur: "from-[#7C3AED] to-[#6D28D9]",
    },
    {
      icon: Scan,
      titre: "Numérisation",
      description: "Scanner vos documents en haute qualité",
      couleur: "from-[#22C55E] to-[#16A34A]",
    },
  ];

  const avantages = [
    {
      icon: Zap,
      titre: "Ultra rapide",
      description: "Starlink = latence minimale",
      couleur: "from-[#F97316] to-[#EA580C]",
    },
    {
      icon: Shield,
      titre: "Fiable",
      description: "Connexion stable 24/7",
      couleur: "from-[#06B6D4] to-[#0891B2]",
    },
    {
      icon: Clock,
      titre: "Ouvert 7j/7",
      description: "8h - 22h tous les jours",
      couleur: "from-[#7C3AED] to-[#6D28D9]",
    },
    {
      icon: CreditCard,
      titre: "Abordable",
      description: "À partir de 500 Ar",
      couleur: "from-[#22C55E] to-[#16A34A]",
    },
  ];

  const tarifs = [
    { duree: "1 heure", prix: "500", populaire: false, icone: "⏱️" },
    { duree: "2 heures", prix: "1 000", populaire: true, icone: "🔥" },
    { duree: "4 heures", prix: "2 000", populaire: false, icone: "⏰" },
    { duree: "Journée", prix: "5 000", populaire: false, icone: "📅" },
  ];

  const temoignages = [
    {
      nom: "Rakoto Jean",
      role: "Étudiant",
      texte:
        "Le Wi-Fi est vraiment très rapide grâce à Starlink. J'ai pu télécharger tous mes cours en un rien de temps.",
      note: 5,
      avatar: "RJ",
      couleur: "from-[#1E40AF] to-[#06B6D4]",
    },
    {
      nom: "Randria Marie",
      role: "Commerçante",
      texte:
        "J'utilise Cyber Famille pour imprimer mes factures. Service rapide et tarifs très abordables !",
      note: 5,
      avatar: "RM",
      couleur: "from-[#7C3AED] to-[#EC4899]",
    },
    {
      nom: "Soloniaina Paul",
      role: "Enseignant",
      texte:
        "Je viens spécialement pour ce cybercafé. La connexion est stable et le cadre agréable.",
      note: 5,
      avatar: "SP",
      couleur: "from-[#22C55E] to-[#06B6D4]",
    },
  ];

  const [temoignageActif, setTemoignageActif] = useState(0);

  // Rotation automatique des témoignages
  useEffect(() => {
    const interval = setInterval(() => {
      setTemoignageActif((prev) => (prev + 1) % temoignages.length);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="overflow-hidden">
      {/* ============================================ */}
      {/* ===== HERO SECTION AVEC ANIMATIONS ===== */}
      {/* ============================================ */}
      <section className="relative overflow-hidden gradient-hero py-20 md:py-32 min-h-[85vh] flex items-center">
        {/* Particules animées en arrière-plan */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#06B6D4]/20 rounded-full blur-3xl anim-float" />
          <div
            className="absolute bottom-20 right-10 w-96 h-96 bg-[#1E40AF]/30 rounded-full blur-3xl"
            style={{
              transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
            }}
          />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-[#7C3AED]/20 rounded-full blur-3xl anim-float delay-500" />

          {/* Petites particules */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-[#06B6D4] rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float-particle ${
                  3 + Math.random() * 4
                }s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.3 + Math.random() * 0.4,
              }}
            />
          ))}
        </div>

        <div className="public-container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge Starlink */}
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur border border-[#06B6D4]/30 px-4 py-2 rounded-full mb-6 anim-fade-in-up">
              <span className="w-2 h-2 bg-[#06B6D4] rounded-full animate-pulse" />
              <Sparkles size={14} className="text-[#67E8F9]" />
              <span className="text-sm text-[#67E8F9] font-medium">
                {t("accueil.badge")}
              </span>
            </div>

            {/* Titre animé */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 anim-fade-in-up delay-100">
              {t("accueil.titre1")}
              <br />
              <span className="gradient-text-animated">
                {t("accueil.titre2")}
              </span>
              <br />
              <span className="inline-flex items-center gap-3">
                {t("accueil.titre3")}
                <Rocket
                  size={48}
                  className="text-[#67E8F9] anim-float inline-block"
                />
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto anim-fade-in-up delay-200">
              {t("accueil.description1")}
              <span className="text-[#67E8F9] font-semibold">
                {" "}
                {t("accueil.description2")}{" "}
              </span>
              {t("accueil.description3")}
              <br />
              {t("accueil.description4")}
            </p>

            {/* Boutons CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center anim-fade-in-up delay-300">
              <Link
                to="/portail"
                className="btn-public-cyan justify-center text-lg py-4 px-8 group relative overflow-hidden cta-pulse"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent anim-shimmer" />
                <Wifi size={20} />
                {t("accueil.boutonWifi")}
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
              <Link
                to="/tarifs"
                className="btn-public-outline justify-center text-lg py-4 px-8 group"
              >
                {t("accueil.boutonTarifs")}
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </div>

            {/* Statistiques animées */}
            <div
              ref={statRef}
              className="grid grid-cols-3 gap-4 md:gap-8 mt-16 max-w-2xl mx-auto anim-fade-in-up delay-400"
            >
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Users size={20} className="text-[#67E8F9]" />
                  <p className="text-3xl md:text-4xl font-bold text-[#67E8F9]">
                    {countClients}+
                  </p>
                </div>
                <p className="text-xs md:text-sm text-gray-400">
                  {t("accueil.stat1")}
                </p>
              </div>
              <div className="text-center border-x border-white/10">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Clock size={20} className="text-[#67E8F9]" />
                  <p className="text-3xl md:text-4xl font-bold text-[#67E8F9]">
                    {countHours}h
                  </p>
                </div>
                <p className="text-xs md:text-sm text-gray-400">
                  {t("accueil.stat2")} 7j/7
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <CreditCard size={20} className="text-[#67E8F9]" />
                  <p className="text-3xl md:text-4xl font-bold text-[#67E8F9]">
                    {countPrix} Ar
                  </p>
                </div>
                <p className="text-xs md:text-sm text-gray-400">
                  {t("accueil.stat3")}
                </p>
              </div>
            </div>

            {/* Scroll indicator */}
            <div className="mt-12 anim-bounce-soft">
              <ChevronRight
                size={24}
                className="text-[#67E8F9] mx-auto rotate-90"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* ===== SERVICES ===== */}
      {/* ============================================ */}
      <section className="py-20 bg-[#0A1628] relative overflow-hidden">
        <div className="absolute top-20 right-0 w-72 h-72 bg-[#06B6D4]/5 rounded-full blur-3xl" />

        <div className="public-container relative">
          <Reveal>
            <div className="text-center mb-16">
              <span className="section-badge">
                {t("accueil.badgeServices")}
              </span>
              <h2 className="section-title">{t("accueil.titreServices")}</h2>
              <p className="section-subtitle">
                Des services pensés pour vous simplifier la vie
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="public-card h-full service-card-hover group">
                  <div
                    className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${service.couleur} mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}
                  >
                    <service.icon size={28} className="text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-[#67E8F9] transition">
                    {service.titre}
                  </h3>
                  <p className="text-sm text-gray-400">{service.description}</p>

                  {/* Barre décorative */}
                  <div className="mt-4 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${service.couleur} rounded-full w-0 group-hover:w-full transition-all duration-700`}
                    />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.4}>
            <div className="text-center mt-12">
              <Link to="/services" className="btn-public-outline group">
                Voir tous les services
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition"
                />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================ */}
      {/* ===== COMMENT ÇA MARCHE ===== */}
      {/* ============================================ */}
      <CommentCaMarche />

      {/* ============================================ */}
      {/* ===== AVANTAGES ===== */}
      {/* ============================================ */}
      <section className="py-20 bg-[#0A1628] relative">
        <div className="public-container">
          <Reveal>
            <div className="text-center mb-16">
              <span className="section-badge">
                {t("accueil.badgeAvantages")}
              </span>
              <h2 className="section-title">{t("accueil.titreAvantages")}</h2>
              <p className="section-subtitle">
                {t("accueil.sousTitreAvantages")}
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {avantages.map((item, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="text-center group">
                  <div
                    className={`inline-flex p-5 rounded-3xl bg-gradient-to-br ${item.couleur} mb-5 anim-float shadow-xl group-hover:scale-110 transition-transform`}
                    style={{ animationDelay: `${i * 0.3}s` }}
                  >
                    <item.icon size={32} className="text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-[#67E8F9] transition">
                    {item.titre}
                  </h3>
                  <p className="text-sm text-gray-400">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* ===== TARIFS RAPIDES ===== */}
      {/* ============================================ */}
      <section className="py-20 bg-[#112240] relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#7C3AED]/10 rounded-full blur-3xl" />

        <div className="public-container relative">
          <Reveal>
            <div className="text-center mb-16">
              <span className="section-badge">{t("accueil.badgeTarifs")}</span>
              <h2 className="section-title">{t("accueil.titreTarifs")}</h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tarifs.map((tarif, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div
                  className={`public-card relative h-full card-3d-hover ${
                    tarif.populaire
                      ? "border-[#06B6D4] border-2 shadow-2xl shadow-cyan-500/30 scale-105"
                      : ""
                  }`}
                >
                  {tarif.populaire && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-[#0A1628] text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1 shadow-lg animate-pulse">
                      <Star size={12} fill="currentColor" />
                      {t("tarifsPage.populaire")}
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-4xl mb-3">{tarif.icone}</p>
                    <p className="text-sm text-gray-400 mb-2">{tarif.duree}</p>
                    <p className="text-4xl md:text-5xl font-bold gradient-text mb-1">
                      {tarif.prix}
                    </p>
                    <p className="text-xs text-gray-500 mb-4">Ariary</p>
                    <Link
                      to="/reservation"
                      className={`inline-flex items-center gap-2 text-sm ${
                        tarif.populaire
                          ? "btn-public-cyan"
                          : "btn-public-outline"
                      }`}
                    >
                      Réserver
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.4}>
            <div className="text-center mt-12">
              <Link to="/tarifs" className="btn-public-primary group">
                {t("accueil.boutonVoirTarifs")}
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition"
                />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================ */}
      {/* ===== TÉMOIGNAGES ROTATIFS ===== */}
      {/* ============================================ */}
      <section className="py-20 bg-[#0A1628] relative overflow-hidden">
        <div className="public-container">
          <Reveal>
            <div className="text-center mb-16">
              <span className="section-badge">Témoignages</span>
              <h2 className="section-title">Ils nous font confiance</h2>
              <p className="section-subtitle">
                Découvrez les avis de nos clients satisfaits
              </p>
            </div>
          </Reveal>

          <div className="max-w-3xl mx-auto">
            {/* Témoignage actif */}
            <Reveal>
              <div className="relative">
                <div className="absolute -top-6 -left-6 w-20 h-20 bg-[#06B6D4]/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-[#7C3AED]/10 rounded-full blur-2xl" />

                <div className="public-card p-8 md:p-12 relative">
                  <Quote
                    size={48}
                    className="text-[#06B6D4]/30 absolute top-6 right-6"
                    fill="currentColor"
                  />

                  {/* Étoiles */}
                  <div className="flex gap-1 mb-6">
                    {[...Array(temoignages[temoignageActif].note)].map(
                      (_, i) => (
                        <Star
                          key={i}
                          size={20}
                          className="text-[#FACC15]"
                          fill="currentColor"
                        />
                      )
                    )}
                  </div>

                  <p className="text-lg md:text-xl text-gray-200 italic mb-8 leading-relaxed">
                    "{temoignages[temoignageActif].texte}"
                  </p>

                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-full bg-gradient-to-br ${
                        temoignages[temoignageActif].couleur
                      } flex items-center justify-center text-white font-bold text-lg shadow-lg`}
                    >
                      {temoignages[temoignageActif].avatar}
                    </div>
                    <div>
                      <p className="font-semibold">
                        {temoignages[temoignageActif].nom}
                      </p>
                      <p className="text-sm text-gray-400">
                        {temoignages[temoignageActif].role}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Indicateurs */}
            <div className="flex justify-center gap-2 mt-8">
              {temoignages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTemoignageActif(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    temoignageActif === i
                      ? "w-8 bg-[#06B6D4]"
                      : "w-2 bg-white/20 hover:bg-white/40"
                  }`}
                  aria-label={`Témoignage ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* ===== CTA FINAL ===== */}
      {/* ============================================ */}
      <section className="py-20 bg-[#112240] relative overflow-hidden">
        <div className="public-container">
          <Reveal>
            <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#1E40AF] via-[#0891B2] to-[#06B6D4] rounded-3xl p-10 md:p-16 text-center relative overflow-hidden shadow-2xl">
              {/* Effets décoratifs */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl anim-float" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl anim-float delay-500" />

              <div className="relative">
                <div className="inline-flex p-4 rounded-full bg-white/20 backdrop-blur mb-6 anim-bounce-soft">
                  <Rocket size={40} className="text-white" />
                </div>

                <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
                  {t("accueil.ctaTitre")}
                </h2>
                <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                  {t("accueil.ctaDescription")}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/contact"
                    className="bg-white text-[#1E40AF] font-semibold px-8 py-4 rounded-xl hover:bg-gray-100 transition inline-flex items-center gap-2 justify-center hover:scale-105 shadow-lg group"
                  >
                    <MapPin size={20} />
                    {t("accueil.ctaTrouver")}
                    <ArrowRight
                      size={18}
                      className="group-hover:translate-x-1 transition"
                    />
                  </Link>
                  <a
                    href="tel:+261342248966"
                    className="bg-white/20 backdrop-blur text-white font-semibold px-8 py-4 rounded-xl border-2 border-white/40 hover:bg-white/30 transition inline-flex items-center gap-2 justify-center hover:scale-105 group"
                  >
                    <Phone size={20} />
                    {t("accueil.ctaAppeler")}
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================ */}
      {/* ===== PETITS BADGES FLOTTANTS ===== */}
      {/* ============================================ */}
      <div className="fixed bottom-32 left-6 z-30 hidden lg:block pointer-events-none">
        <div className="space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#06B6D4]/20 backdrop-blur flex items-center justify-center anim-float">
            <Wifi size={20} className="text-[#67E8F9]" />
          </div>
          <div
            className="w-12 h-12 rounded-full bg-[#7C3AED]/20 backdrop-blur flex items-center justify-center anim-float"
            style={{ animationDelay: "1s" }}
          >
            <Zap size={20} className="text-[#A78BFA]" />
          </div>
          <div
            className="w-12 h-12 rounded-full bg-[#22C55E]/20 backdrop-blur flex items-center justify-center anim-float"
            style={{ animationDelay: "2s" }}
          >
            <Award size={20} className="text-[#4ADE80]" />
          </div>
        </div>
      </div>
    </div>
  );
}