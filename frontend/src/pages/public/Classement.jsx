import { useState, useEffect } from "react";
import {
  Trophy,
  Medal,
  Crown,
  Star,
  Loader2,
  AlertCircle,
  Calendar,
  Award,
  Gift,
  TrendingUp,
  Clock,
} from "lucide-react";
import { usePublicLang } from "../../context/PublicLangContext";
import LeaderboardWidget from "../../components/LeaderboardWidget";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function Classement() {
  const { t } = usePublicLang();
  const [classement, setClassement] = useState([]);
  const [config, setConfig] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [moisActif, setMoisActif] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [actif, setActif] = useState(false);

  const chargerClassement = async (mois = null) => {
    setChargement(true);
    setErreur(null);
    try {
      const params = new URLSearchParams();
      if (mois) params.append("mois", mois);
      params.append("limite", "50");

      const res = await fetch(`${API_URL}/leaderboard?${params.toString()}`);
      const data = await res.json();

      if (data.success && data.actif) {
        setActif(true);
        setClassement(data.classement || []);
        setConfig(data.config);
        setHistorique(data.historique || []);
        setMoisActif(data.mois);
      } else {
        setActif(false);
      }
    } catch (err) {
      setErreur("Impossible de charger le classement");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerClassement();
  }, []);

  const formatPrix = (n) => Number(n || 0).toLocaleString("fr-FR");

  const getMoisLabel = (moisStr) => {
    if (!moisStr) return "-";
    const [annee, mois] = moisStr.split("-");
    const moisNoms = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
    ];
    return `${moisNoms[parseInt(mois) - 1]} ${annee}`;
  };

  // Grouper l'historique par mois
  const historiqueGroupe = historique.reduce((acc, h) => {
    if (!acc[h.mois_annee]) acc[h.mois_annee] = [];
    acc[h.mois_annee].push(h);
    return acc;
  }, {});

  return (
    <div className="public-page">
      {/* HERO */}
      <section className="gradient-hero py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-72 h-72 bg-yellow-500/20 rounded-full blur-3xl" />
        </div>

        <div className="public-container relative text-center">
          <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4 shadow-2xl shadow-yellow-500/30">
            <Trophy size={48} className="text-white" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            🏆 Classement du mois
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Les meilleurs clients du mois sont récompensés !
            Réservations, parrainages, fidélité — tout compte.
          </p>

          {/* Récompenses */}
          {config && (
            <div className="mt-8 grid grid-cols-3 gap-3 max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl p-4">
                <p className="text-3xl mb-1">🥇</p>
                <p className="text-xs text-gray-400">1ère place</p>
                <p className="font-bold text-yellow-400 text-lg">
                  {formatPrix(config.recompense_1er)} Ar
                </p>
              </div>
              <div className="bg-gradient-to-br from-gray-400/20 to-gray-600/20 border border-gray-500/30 rounded-xl p-4">
                <p className="text-3xl mb-1">🥈</p>
                <p className="text-xs text-gray-400">2ème place</p>
                <p className="font-bold text-gray-300 text-lg">
                  {formatPrix(config.recompense_2eme)} Ar
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-400/20 to-orange-600/20 border border-orange-500/30 rounded-xl p-4">
                <p className="text-3xl mb-1">🥉</p>
                <p className="text-xs text-gray-400">3ème place</p>
                <p className="font-bold text-orange-400 text-lg">
                  {formatPrix(config.recompense_3eme)} Ar
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CONTENU */}
      <section className="py-16 bg-[#0A1628]">
        <div className="public-container">
          {erreur && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle size={20} />
              <p>{erreur}</p>
            </div>
          )}

          {chargement ? (
            <div className="text-center py-20">
              <Loader2 size={40} className="animate-spin text-[#67E8F9] mx-auto" />
              <p className="text-gray-400 mt-4">Chargement du classement...</p>
            </div>
          ) : !actif ? (
            <div className="text-center py-20 bg-[#112240] rounded-2xl border border-white/5">
              <Trophy size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Classement indisponible
              </h3>
              <p className="text-sm text-gray-400">
                Le classement n'est pas disponible pour le moment.
              </p>
            </div>
          ) : classement.length === 0 ? (
            <div className="text-center py-20 bg-[#112240] rounded-2xl border border-white/5">
              <Trophy size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Aucun participant ce mois
              </h3>
              <p className="text-sm text-gray-400">
                Soyez le premier à réserver pour apparaître ici !
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Colonne gauche : widget */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
                    <Calendar size={14} />
                    {getMoisLabel(moisActif)}
                  </div>
                  <LeaderboardWidget limite={10} afficherMaPosition={true} />
                </div>
              </div>

              {/* Colonne droite : liste complète */}
              <div className="lg:col-span-2">
                <div className="public-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={20} className="text-[#67E8F9]" />
                    <h2 className="text-xl font-bold">Classement complet</h2>
                  </div>

                  <div className="space-y-2">
                    {classement.map((c) => {
                      const isTop3 = c.position <= 3;
                      const podiumEmoji = c.position === 1 ? "🥇" : c.position === 2 ? "🥈" : c.position === 3 ? "🥉" : null;

                      return (
                        <div
                          key={c.client_id}
                          className={`flex items-center gap-3 p-3 rounded-lg transition ${
                            isTop3
                              ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30"
                              : "bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                              c.position === 1
                                ? "bg-yellow-400 text-gray-900"
                                : c.position === 2
                                ? "bg-gray-400 text-gray-900"
                                : c.position === 3
                                ? "bg-orange-400 text-gray-900"
                                : "bg-cyan-500/20 text-[#67E8F9]"
                            }`}
                          >
                            {podiumEmoji || `#${c.position}`}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">
                              {c.nom_affiche}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                              <span>🎟️ {c.reservations} résa</span>
                              <span>👥 {c.parrainages} parrainage(s)</span>
                              {c.points_fidelite > 0 && (
                                <span>⭐ {c.points_fidelite} pts</span>
                              )}
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-yellow-400 text-lg">
                              {c.score}
                            </p>
                            <p className="text-xs text-gray-500">points</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Historique des gagnants */}
                {Object.keys(historiqueGroupe).length > 0 && (
                  <div className="public-card p-6 mt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Award size={20} className="text-yellow-400" />
                      <h2 className="text-xl font-bold">Palmarès</h2>
                    </div>

                    <div className="space-y-4">
                      {Object.entries(historiqueGroupe)
                        .sort(([a], [b]) => b.localeCompare(a))
                        .map(([mois, gagnants]) => (
                          <div key={mois}>
                            <h3 className="text-sm font-semibold text-gray-400 mb-2">
                              {getMoisLabel(mois)}
                            </h3>
                            <div className="space-y-1">
                              {gagnants
                                .sort((a, b) => a.position - b.position)
                                .map((g) => (
                                  <div
                                    key={g.id}
                                    className="flex items-center justify-between py-1.5 px-2 bg-white/5 rounded text-sm"
                                  >
                                    <span className="flex items-center gap-2">
                                      <span className="text-base">
                                        {g.position === 1 ? "🥇" : g.position === 2 ? "🥈" : "🥉"}
                                      </span>
                                      <span className="font-medium">
                                        {g.client_nom}
                                      </span>
                                    </span>
                                    <span className="text-xs text-yellow-400 font-bold">
                                      +{formatPrix(g.recompense_versee)} Ar
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}