import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Clock,
  Zap,
  Loader2,
  Star,
  ArrowRight,
  Wifi,
} from "lucide-react";
import Reveal from "./Reveal";
import { usePublicLang } from "../context/PublicLangContext";

const API_RECO = "http://localhost/cybercafe-wifi/backend/api/reco.php";

export default function RecommandationsCarousel({
  titre,
  sousTitre,
  limite = 6,
  contexte = "accueil",
  className = "",
}) {
  const { t } = usePublicLang();
  const [recos, setRecos] = useState([]);
  const [personnalise, setPersonnalise] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const scrollRef = useRef(null);

  const titreFinal = titre || "Recommandé pour vous";
  const sousTitreFinal =
    sousTitre || "Les forfaits les plus adaptés à vos besoins";

  // -------- Récupération des recommandations --------
  useEffect(() => {
    let annule = false;

    const charger = async () => {
      setChargement(true);
      setErreur(null);
      try {
        const headers = { Accept: "application/json" };
        const token =
          localStorage.getItem("client_token") ||
          localStorage.getItem("token_client") ||
          localStorage.getItem("token");
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const url = `${API_RECO}?action=recommandations&limite=${limite}&contexte=${contexte}`;
        const res = await fetch(url, { headers });
        const data = await res.json();

        if (annule) return;

        if (data.success) {
          setRecos(data.recommandations || []);
          setPersonnalise(!!data.personnalise);
        } else {
          setErreur(data.message || "Erreur de chargement");
        }
      } catch (err) {
        if (!annule) setErreur("Impossible de charger les recommandations");
      } finally {
        if (!annule) setChargement(false);
      }
    };

    charger();
    return () => {
      annule = true;
    };
  }, [limite, contexte]);

  // -------- Tracking d'une interaction --------
  const trackInteraction = async (serviceId, type = "vue") => {
    try {
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      const token =
        localStorage.getItem("client_token") ||
        localStorage.getItem("token_client") ||
        localStorage.getItem("token");
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch(`${API_RECO}?action=track`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          service_id: serviceId,
          type,
          source: contexte,
        }),
      });
    } catch (err) {
      /* silencieux */
    }
  };

  // -------- Scroll horizontal --------
  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const montant = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -montant : montant,
      behavior: "smooth",
    });
  };

  // -------- Format prix --------
  const formatPrix = (n) => Number(n || 0).toLocaleString("fr-FR");

  // -------- Chargement --------
  if (chargement) {
    return (
      <section className={`py-20 bg-[#0A1628] ${className}`}>
        <div className="public-container">
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-[#06B6D4]" />
          </div>
        </div>
      </section>
    );
  }

  // -------- Erreur ou vide : ne rien afficher --------
  if (erreur || recos.length === 0) {
    return null;
  }

  return (
    <section className={`py-20 bg-[#0A1628] relative overflow-hidden ${className}`}>
      {/* Décoration */}
      <div className="absolute top-20 right-0 w-72 h-72 bg-[#06B6D4]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-0 w-72 h-72 bg-[#7C3AED]/5 rounded-full blur-3xl" />

      <div className="public-container relative">
        {/* En-tête */}
        <Reveal>
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <span className="section-badge inline-flex items-center gap-2">
                <Sparkles size={14} />
                {personnalise ? "Personnalisé" : "Populaire"}
              </span>
              <h2 className="section-title">{titreFinal}</h2>
              <p className="section-subtitle">{sousTitreFinal}</p>
            </div>

            {/* Boutons scroll desktop */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => scroll("left")}
                className="p-3 rounded-xl bg-white/5 hover:bg-[#06B6D4]/20 text-gray-300 hover:text-[#67E8F9] transition"
                aria-label="Précédent"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => scroll("right")}
                className="p-3 rounded-xl bg-white/5 hover:bg-[#06B6D4]/20 text-gray-300 hover:text-[#67E8F9] transition"
                aria-label="Suivant"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </Reveal>

        {/* Carrousel */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {recos.map((reco, i) => (
            <Reveal key={reco.id} delay={i * 0.05}>
              <div className="flex-shrink-0 w-72 snap-start">
                <Link
                  to="/tarifs"
                  onClick={() => trackInteraction(reco.id, "vue")}
                  className="public-card h-full block group service-card-hover"
                >
                  {/* Icône + badge score */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#06B6D4]/20 to-[#1E40AF]/20 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      {reco.icone || "📶"}
                    </div>
                    {reco.score > 0 && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30">
                        <Star
                          size={10}
                          className="text-yellow-400"
                          fill="currentColor"
                        />
                        <span className="text-xs font-bold text-yellow-400">
                          {reco.score.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Nom */}
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-[#67E8F9] transition line-clamp-1">
                    {reco.nom}
                  </h3>

                  {/* Description */}
                  {reco.description && (
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                      {reco.description}
                    </p>
                  )}

                  {/* Métadonnées */}
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                    {reco.duree_typique > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-[#06B6D4]" />
                        {reco.duree_typique} min
                      </span>
                    )}
                    {reco.categorie && (
                      <span className="flex items-center gap-1">
                        <Zap size={12} className="text-[#06B6D4]" />
                        {reco.categorie}
                      </span>
                    )}
                  </div>

                  {/* Barre décorative */}
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-gradient-to-r from-[#06B6D4] to-[#0891B2] rounded-full w-0 group-hover:w-full transition-all duration-700" />
                  </div>

                  {/* Prix + CTA */}
                  <div className="flex items-end justify-between pt-3 border-t border-white/5">
                    <div>
                      <p className="text-xs text-gray-500">À partir de</p>
                      <p className="text-xl font-bold gradient-text">
                        {reco.tarif > 0
                          ? `${formatPrix(reco.tarif)} Ar`
                          : "Gratuit"}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-[#06B6D4]/10 group-hover:bg-[#06B6D4] transition">
                      <ArrowRight
                        size={16}
                        className="text-[#67E8F9] group-hover:text-white transition"
                      />
                    </div>
                  </div>
                </Link>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Indicateur "personnalisé" */}
        {personnalise && (
          <Reveal delay={0.3}>
            <p className="text-xs text-center text-gray-500 mt-6 flex items-center justify-center gap-1">
              <Sparkles size={12} className="text-[#67E8F9]" />
              Recommandations personnalisées selon votre historique
            </p>
          </Reveal>
        )}

        {/* CTA bas */}
        <Reveal delay={0.4}>
          <div className="text-center mt-10">
            <Link to="/tarifs" className="btn-public-outline group">
              Voir tous les forfaits
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition"
              />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}