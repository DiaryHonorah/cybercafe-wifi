import { useState, useEffect } from "react";
import {
  Star,
  Quote,
  Loader2,
  AlertCircle,
  Plus,
  CheckCircle2,
  ThumbsUp,
  Filter,
  MessageSquare,
  X,
} from "lucide-react";
import { usePublicLang } from "../../context/PublicLangContext";
import AvisForm from "../../components/AvisForm";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function Temoignages() {
  const { t } = usePublicLang();
  const [avis, setAvis] = useState([]);
  const [stats, setStats] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [filtreNote, setFiltreNote] = useState("toutes");
  const [filtreService, setFiltreService] = useState("tous");
  const [verifieSeulement, setVerifieSeulement] = useState(false);
  const [modalAvis, setModalAvis] = useState(false);

  const chargerAvis = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const params = new URLSearchParams();
      if (filtreNote !== "toutes") params.append("note", filtreNote);
      if (filtreService !== "tous") params.append("service", filtreService);
      if (verifieSeulement) params.append("verifie", "1");
      params.append("limite", "100");

      const res = await fetch(`${API_URL}/avis?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setAvis(data.avis || []);
        setStats(data.stats);
      } else {
        setErreur(data.message);
      }
    } catch (err) {
      setErreur("Impossible de charger les avis");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerAvis();
  }, [filtreNote, filtreService, verifieSeulement]);

  const marquerUtile = async (avisId) => {
    try {
      const res = await fetch(`${API_URL}/avis/utile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avis_id: avisId }),
      });
      const data = await res.json();

      if (data.success) {
        setAvis((prev) =>
          prev.map((a) =>
            a.id === avisId ? { ...a, utile: data.utile } : a
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const renderEtoiles = (note, size = 16) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={size}
            className={
              i <= note ? "text-yellow-400 fill-yellow-400" : "text-gray-600"
            }
          />
        ))}
      </div>
    );
  };

  const getServiceLabel = (service) => {
    const labels = {
      reservation: "Réservation",
      wifi: "Wi-Fi",
      impression: "Impression",
      accueil: "Accueil",
      autre: "Autre",
    };
    return labels[service] || service;
  };

  return (
    <div className="public-page">
      {/* HERO */}
      <section className="gradient-hero py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-72 h-72 bg-[#06B6D4]/20 rounded-full blur-3xl" />
        </div>

        <div className="public-container relative text-center">
          <span className="section-badge anim-fade-up">
            {t("temoignagesPage.badge")}
          </span>
          <h1 className="section-title anim-fade-up delay-100">
            {t("temoignagesPage.titre")}
          </h1>
          <p className="section-subtitle anim-fade-up delay-200">
            {t("temoignagesPage.sousTitre")}
          </p>

          {/* Stats principales */}
          {stats && stats.total > 0 && (
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto anim-fade-up delay-300">
              <div className="public-card p-4 text-center">
                <div className="text-4xl font-bold text-yellow-400 mb-1">
                  {stats.moyenne}
                </div>
                <div className="flex justify-center mb-2">
                  {renderEtoiles(Math.round(stats.moyenne), 14)}
                </div>
                <p className="text-xs text-gray-400">Note moyenne</p>
              </div>
              <div className="public-card p-4 text-center">
                <div className="text-4xl font-bold text-[#67E8F9] mb-1">
                  {stats.total}
                </div>
                <p className="text-xs text-gray-400">Avis clients</p>
              </div>
              <div className="public-card p-4 text-center">
                <div className="text-4xl font-bold text-green-400 mb-1">
                  {stats.verifies}
                </div>
                <p className="text-xs text-gray-400">Avis vérifiés</p>
              </div>
              <div className="public-card p-4 text-center">
                <div className="text-4xl font-bold text-cyan-400 mb-1">
                  {stats.repartition[5].pourcentage}%
                </div>
                <p className="text-xs text-gray-400">5 étoiles</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CONTENU */}
      <section className="py-16 bg-[#0A1628]">
        <div className="public-container">
          {/* Barre d'actions */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3 flex-wrap">
              <Filter size={16} className="text-gray-400" />
              <select
                value={filtreNote}
                onChange={(e) => setFiltreNote(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
              >
                <option value="toutes">Toutes les notes</option>
                <option value="5">5 étoiles</option>
                <option value="4">4 étoiles</option>
                <option value="3">3 étoiles</option>
                <option value="2">2 étoiles</option>
                <option value="1">1 étoile</option>
              </select>
              <select
                value={filtreService}
                onChange={(e) => setFiltreService(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
              >
                <option value="tous">Tous services</option>
                <option value="reservation">Réservation</option>
                <option value="wifi">Wi-Fi</option>
                <option value="impression">Impression</option>
                <option value="accueil">Accueil</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifieSeulement}
                  onChange={(e) => setVerifieSeulement(e.target.checked)}
                  className="rounded"
                />
                <CheckCircle2 size={14} className="text-green-400" />
                Vérifiés seulement
              </label>
            </div>

            <button
              onClick={() => setModalAvis(true)}
              className="btn-public-cyan"
            >
              <Plus size={16} />
              Laisser un avis
            </button>
          </div>

          {erreur && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle size={20} />
              <p>{erreur}</p>
            </div>
          )}

          {chargement ? (
            <div className="text-center py-20">
              <Loader2 size={40} className="animate-spin text-[#67E8F9] mx-auto" />
              <p className="text-gray-400 mt-4">Chargement des avis...</p>
            </div>
          ) : avis.length === 0 ? (
            <div className="text-center py-20 bg-[#112240] rounded-2xl border border-white/5">
              <MessageSquare size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Aucun avis pour le moment
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Soyez le premier à partager votre expérience !
              </p>
              <button
                onClick={() => setModalAvis(true)}
                className="btn-public-cyan inline-flex"
              >
                <Plus size={16} />
                Écrire le premier avis
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {avis.map((a, i) => (
                <div
                  key={a.id}
                  className="public-card p-6 anim-fade-up"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#1E40AF] flex items-center justify-center text-white font-bold text-sm">
                        {(a.nom_affiche || "?")
                          .split(" ")
                          .map((m) => m[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-sm">
                            {a.nom_affiche}
                          </p>
                          {a.verifie == 1 && (
                            <span title="Avis vérifié">
                              <CheckCircle2
                                size={14}
                                className="text-green-400"
                              />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatDate(a.created_at)}
                        </p>
                      </div>
                    </div>
                    <Quote
                      size={24}
                      className="text-[#06B6D4]/30 flex-shrink-0"
                    />
                  </div>

                  {/* Note */}
                  <div className="mb-3">
                    {renderEtoiles(a.note, 14)}
                  </div>

                  {/* Titre + commentaire */}
                  {a.titre && (
                    <h3 className="font-bold text-base mb-2">{a.titre}</h3>
                  )}
                  <p className="text-sm text-gray-300 leading-relaxed mb-3 line-clamp-4">
                    {a.commentaire}
                  </p>

                  {/* Réponse admin */}
                  {a.reponse_admin && (
                    <div className="bg-[#06B6D4]/5 border-l-2 border-[#06B6D4] rounded-r-lg p-3 mb-3">
                      <p className="text-xs text-[#67E8F9] font-semibold mb-1">
                        💬 Réponse de Cyber Famille
                      </p>
                      <p className="text-xs text-gray-400">
                        {a.reponse_admin}
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <span className="text-xs text-gray-500 capitalize">
                      {getServiceLabel(a.service_note)}
                    </span>
                    <button
                      onClick={() => marquerUtile(a.id)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#67E8F9] transition"
                    >
                      <ThumbsUp size={12} />
                      Utile {a.utile > 0 && `(${a.utile})`}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* MODAL AVIS */}
      {modalAvis && (
        <AvisForm
          inline={false}
          onCancel={() => setModalAvis(false)}
          onSuccess={() => {
            setModalAvis(false);
            chargerAvis();
          }}
        />
      )}
    </div>
  );
}