import { useState, useEffect } from "react";
import {
  Trophy,
  Medal,
  Crown,
  Star,
  Loader2,
  TrendingUp,
  Award,
  Gift,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

/**
 * Widget Classement / Leaderboard
 * Props:
 *  - limite (défaut 5) : nombre de clients affichés
 *  - compact (bool) : version compacte pour accueil
 *  - mois (string|null) : mois au format YYYY-MM
 *  - afficherMaPosition (bool) : afficher la position du client connecté
 */
export default function LeaderboardWidget({
  limite = 5,
  compact = false,
  mois = null,
  afficherMaPosition = true,
}) {
  const [classement, setClassement] = useState([]);
  const [config, setConfig] = useState(null);
  const [maPosition, setMaPosition] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [actif, setActif] = useState(false);

  const getToken = () => localStorage.getItem("client_token");

  const chargerClassement = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const params = new URLSearchParams();
      params.append("limite", limite);
      if (mois) params.append("mois", mois);

      const res = await fetch(`${API_URL}/leaderboard?${params.toString()}`);
      const data = await res.json();

      if (data.success && data.actif) {
        setActif(true);
        setClassement(data.classement || []);
        setConfig(data.config);
      } else {
        setActif(false);
      }

      // Si connecté, charger ma position
      const token = getToken();
      if (token && afficherMaPosition) {
        const posParams = new URLSearchParams();
        if (mois) posParams.append("mois", mois);

        const posRes = await fetch(
          `${API_URL}/client/leaderboard/ma-position?${posParams.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const posData = await posRes.json();
        if (posData.success) setMaPosition(posData.ma_position);
      }
    } catch (err) {
      setErreur("Impossible de charger le classement");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerClassement();
  }, [mois, limite]);

  const formatPrix = (n) => Number(n || 0).toLocaleString("fr-FR");

  const getPodiumColor = (position) => {
    if (position === 1) return { bg: "from-yellow-400 to-yellow-600", icon: "🥇", border: "border-yellow-400" };
    if (position === 2) return { bg: "from-gray-300 to-gray-500", icon: "🥈", border: "border-gray-400" };
    if (position === 3) return { bg: "from-orange-400 to-orange-600", icon: "🥉", border: "border-orange-400" };
    return { bg: "from-cyan-500 to-blue-600", icon: "⭐", border: "border-cyan-500" };
  };

  // ===== RENDU =====
  if (chargement) {
    return (
      <div className={`public-card ${compact ? "p-4" : "p-6"} text-center`}>
        <Loader2 size={32} className="animate-spin text-[#67E8F9] mx-auto" />
        <p className="text-gray-400 text-sm mt-2">Chargement...</p>
      </div>
    );
  }

  if (!actif) {
    return (
      <div className={`public-card ${compact ? "p-4" : "p-6"} text-center`}>
        <Trophy size={32} className="text-gray-600 mx-auto mb-2" />
        <p className="text-gray-400 text-sm">
          Le classement n'est pas disponible pour le moment.
        </p>
      </div>
    );
  }

  if (classement.length === 0) {
    return (
      <div className={`public-card ${compact ? "p-4" : "p-6"} text-center`}>
        <Trophy size={32} className="text-gray-600 mx-auto mb-2" />
        <p className="text-gray-400 text-sm">
          Aucun participant ce mois. Soyez le premier !
        </p>
      </div>
    );
  }

  // Compact (pour accueil)
  if (compact) {
    return (
      <div className="public-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-yellow-400" />
            <h3 className="font-bold text-sm">
              {config?.titre || "Classement du mois"}
            </h3>
          </div>
          <Link
            to="/classement"
            className="text-xs text-[#67E8F9] hover:text-[#06B6D4] flex items-center gap-1"
          >
            Voir tout
            <ChevronRight size={12} />
          </Link>
        </div>

        <div className="space-y-1.5">
          {classement.slice(0, 5).map((c) => {
            const podium = getPodiumColor(c.position);
            return (
              <div
                key={c.client_id}
                className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-white/5 transition"
              >
                <span className="text-lg flex-shrink-0">
                  {c.position <= 3 ? podium.icon : `#${c.position}`}
                </span>
                <p className="flex-1 text-sm truncate font-medium">
                  {c.nom_affiche}
                </p>
                <p className="text-xs font-bold text-yellow-400">
                  {c.score} pts
                </p>
              </div>
            );
          })}
        </div>

        {maPosition && maPosition.position && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-xs text-gray-400 mb-1">Ta position :</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#67E8F9]">
                #{maPosition.position}
              </span>
              <span className="text-xs text-yellow-400">
                {maPosition.score} pts
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Version complète
  return (
    <div className="public-card p-6">
      <div className="text-center mb-6">
        <div className="inline-flex p-3 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 mb-3">
          <Trophy size={32} className="text-yellow-400" />
        </div>
        <h2 className="text-xl font-bold mb-1">
          {config?.titre || "Classement du mois"}
        </h2>
        {config?.description && (
          <p className="text-sm text-gray-400">{config.description}</p>
        )}
      </div>

      {/* Podium top 3 */}
      {classement.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 mb-6">
          {/* 2ème */}
          {classement[1] && (
            <div className="mt-8">
              <div className="bg-gradient-to-b from-gray-400 to-gray-600 rounded-t-lg p-3 text-center text-white">
                <span className="text-2xl">🥈</span>
                <p className="text-xs font-bold mt-1 truncate">
                  {classement[1].nom_affiche}
                </p>
                <p className="text-xs opacity-90">{classement[1].score} pts</p>
              </div>
            </div>
          )}

          {/* 1er */}
          {classement[0] && (
            <div>
              <div className="bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-t-lg p-3 text-center text-white shadow-lg">
                <span className="text-3xl">🥇</span>
                <p className="text-sm font-bold mt-1 truncate">
                  {classement[0].nom_affiche}
                </p>
                <p className="text-xs opacity-90">{classement[0].score} pts</p>
              </div>
            </div>
          )}

          {/* 3ème */}
          {classement[2] && (
            <div className="mt-12">
              <div className="bg-gradient-to-b from-orange-400 to-orange-600 rounded-t-lg p-3 text-center text-white">
                <span className="text-2xl">🥉</span>
                <p className="text-xs font-bold mt-1 truncate">
                  {classement[2].nom_affiche}
                </p>
                <p className="text-xs opacity-90">{classement[2].score} pts</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Liste complète */}
      <div className="space-y-1.5">
        {classement.slice(3).map((c) => (
          <div
            key={c.client_id}
            className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
          >
            <span className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-xs font-bold text-[#67E8F9] flex-shrink-0">
              #{c.position}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{c.nom_affiche}</p>
              <p className="text-xs text-gray-500">
                {c.reservations} résa · {c.parrainages} parrainage(s)
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-yellow-400">
                {c.score} pts
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Ma position */}
      {maPosition && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-gray-400 mb-2">📊 Ta position ce mois :</p>
          <div className="bg-gradient-to-r from-[#06B6D4]/10 to-[#1E40AF]/10 border border-[#06B6D4]/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">
                {maPosition.position
                  ? `Rang #${maPosition.position}`
                  : "Pas encore classé"}
              </span>
              <span className="text-lg font-bold text-yellow-400">
                {maPosition.score} pts
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div>
                <p className="text-gray-500">Résa</p>
                <p className="font-bold text-[#67E8F9]">
                  {maPosition.reservations}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Parrainages</p>
                <p className="font-bold text-purple-400">
                  {maPosition.parrainages}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Points fid.</p>
                <p className="font-bold text-cyan-400">
                  {maPosition.points_fidelite}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Bonus</p>
                <p className="font-bold text-green-400">
                  {formatPrix(maPosition.bonus_gagnes)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Récompenses */}
      {config && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
            <Gift size={12} />
            Récompenses du mois
          </p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2">
              <p className="text-lg">🥇</p>
              <p className="font-bold text-yellow-400">
                {formatPrix(config.recompense_1er)} Ar
              </p>
            </div>
            <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-2">
              <p className="text-lg">🥈</p>
              <p className="font-bold text-gray-300">
                {formatPrix(config.recompense_2eme)} Ar
              </p>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2">
              <p className="text-lg">🥉</p>
              <p className="font-bold text-orange-400">
                {formatPrix(config.recompense_3eme)} Ar
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}