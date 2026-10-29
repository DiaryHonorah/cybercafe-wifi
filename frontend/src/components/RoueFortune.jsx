import { useState, useEffect } from "react";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles,
  RotateCw,
  Trophy,
  Clock,
  Info,
} from "lucide-react";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function RoueFortune() {
  const [etat, setEtat] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [enTrainDeTourner, setEnTrainDeTourner] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [modalResultat, setModalResultat] = useState(false);

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

  const chargerEtat = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await fetchAvecToken(`${API_URL}/client/roue/etat`);
      const data = await res.json();

      if (data.success) {
        setEtat(data);
      } else {
        setErreur(data.message || "Erreur de chargement");
      }
    } catch (err) {
      setErreur("Impossible de contacter le serveur");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerEtat();
  }, []);

  // Calcul de l'angle pour chaque lot (8 lots = 45° chacun)
  const angleParLot = etat?.lots?.length ? 360 / etat.lots.length : 45;

  // Couleurs de la roue (alternance)
  const getCouleurLot = (lot, index) => {
    if (lot.couleur) return lot.couleur;
    const couleurs = ["#06B6D4", "#1E40AF", "#7C3AED", "#EC4899", "#F59E0B", "#10B981", "#EF4444", "#6B7280"];
    return couleurs[index % couleurs.length];
  };

  // Générer le conic-gradient de la roue
  const genererGradient = () => {
    if (!etat?.lots?.length) return "conic-gradient(#6B7280 0deg 360deg)";

    const segments = etat.lots.map((lot, i) => {
      const couleur = getCouleurLot(lot, i);
      const debut = i * angleParLot;
      const fin = (i + 1) * angleParLot;
      return `${couleur} ${debut}deg ${fin}deg`;
    });

    return `conic-gradient(${segments.join(", ")})`;
  };

  // Calculer l'angle final pour faire tomber le pointeur sur le lot gagnant
  const calculerAngleFinal = (lotGagnant) => {
    if (!etat?.lots) return 0;

    const indexGagnant = etat.lots.findIndex((l) => l.id === lotGagnant.id);
    if (indexGagnant === -1) return 0;

    // Le pointeur est en haut (12h = 0°). On veut que le centre du lot gagnant arrive en haut.
    // Centre du lot i = i * angleParLot + angleParLot / 2
    const centreLot = indexGagnant * angleParLot + angleParLot / 2;

    // Plusieurs tours complets + l'angle pour arriver au lot
    // Le pointeur en haut = 0°, donc on veut rotation = 360 - centreLot (+ multiples de 360)
    const toursComplets = 5 * 360;
    const angleCible = toursComplets + (360 - centreLot);

    // Ajouter quelques degrés aléatoires pour ne pas toujours tomber pile au centre
    const bruit = (Math.random() - 0.5) * (angleParLot * 0.6);

    return rotation + angleCible + bruit;
  };

  const jouer = async () => {
    if (enTrainDeTourner || !etat?.peut_jouer?.peut_jouer) return;

    setEnTrainDeTourner(true);
    setErreur(null);
    setResultat(null);

    try {
      const res = await fetchAvecToken(`${API_URL}/client/roue/jouer`, {
        method: "POST",
      });
      const data = await res.json();

      if (!data.success) {
        setErreur(data.message);
        setEnTrainDeTourner(false);
        return;
      }

      // Lancer l'animation
      const angleFinal = calculerAngleFinal(data.lot);
      setRotation(angleFinal);

      // Attendre la fin de l'animation (5s)
      setTimeout(() => {
        setResultat(data);
        setModalResultat(true);
        setEnTrainDeTourner(false);
        // Recharger l'état pour mettre à jour peut_jouer
        chargerEtat();
      }, 5000);

    } catch (err) {
      setErreur("Erreur lors du tirage");
      setEnTrainDeTourner(false);
    }
  };

  const fermerModal = () => {
    setModalResultat(false);
    setResultat(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ===== RENDU =====
  if (chargement) {
    return (
      <div className="text-center py-20">
        <Loader2 size={40} className="animate-spin text-[#67E8F9] mx-auto" />
        <p className="text-gray-400 mt-4">Chargement de la roue...</p>
      </div>
    );
  }

  if (erreur && !etat) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 flex items-center gap-3">
        <AlertCircle size={20} />
        <p>{erreur}</p>
        <button
          onClick={chargerEtat}
          className="ml-auto px-3 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-xs"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!etat) return null;

  const peutJouer = etat.peut_jouer?.peut_jouer;
  const config = etat.config || {};
  const lots = etat.lots || [];
  const historique = etat.historique || [];

  return (
    <div>
      <style>{`
        @keyframes spin-wheel {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(var(--final-rotation)); }
        }
        .roue-spin {
          animation: spin-wheel 5s cubic-bezier(0.17, 0.67, 0.12, 0.99) forwards;
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(6, 182, 212, 0.5); }
          50% { box-shadow: 0 0 40px rgba(6, 182, 212, 0.9); }
        }
        .roue-glow {
          animation: pulse-glow 2s infinite;
        }
      `}</style>

      {/* MESSAGE D'ERREUR */}
      {erreur && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-4 flex items-center gap-3">
          <AlertCircle size={20} />
          <p>{erreur}</p>
        </div>
      )}

      {/* HEADER DE LA ROUE */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
          <Sparkles className="text-yellow-400" size={28} />
          Roue de la fortune
          <Sparkles className="text-yellow-400" size={28} />
        </h3>
        <p className="text-gray-400 text-sm">
          {peutJouer
            ? "Tentez votre chance et gagnez des récompenses !"
            : etat.peut_jouer?.raison || "Vous ne pouvez pas jouer pour le moment"}
        </p>

        {/* Compteur de tours */}
        <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-white/5 border border-white/10">
          <RotateCw size={14} className="text-[#67E8F9]" />
          <span className="text-sm">
            {etat.peut_jouer?.tours_restants || 0} tour(s) restant(s) ce mois
          </span>
          <span className="text-xs text-gray-500">
            ({etat.peut_jouer?.tours_mois || 0} / {etat.peut_jouer?.limite || 1})
          </span>
        </div>
      </div>

      {/* LA ROUE */}
      <div className="relative flex justify-center mb-8">
        <div className="relative" style={{ width: 340, height: 340 }}>
          {/* Indicateur (pointeur en haut) */}
          <div
            className="absolute z-20"
            style={{
              top: -10,
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "20px solid transparent",
              borderRight: "20px solid transparent",
              borderTop: "35px solid #EF4444",
              filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.4))",
            }}
          />

          {/* Centre de la roue (bouton) */}
          <button
            onClick={jouer}
            disabled={enTrainDeTourner || !peutJouer}
            className={`absolute z-20 rounded-full flex items-center justify-center font-bold text-white shadow-xl transition-all ${
              peutJouer && !enTrainDeTourner
                ? "bg-gradient-to-br from-yellow-400 to-orange-500 hover:scale-110 roue-glow"
                : "bg-gray-500 cursor-not-allowed"
            }`}
            style={{
              width: 80,
              height: 80,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              border: "4px solid white",
            }}
          >
            {enTrainDeTourner ? (
              <Loader2 size={32} className="animate-spin" />
            ) : peutJouer ? (
              <span className="text-lg">JOUER</span>
            ) : (
              <Clock size={28} />
            )}
          </button>

          {/* Roue tournante */}
          <div
            className={`absolute inset-0 rounded-full ${enTrainDeTourner ? "roue-spin" : ""}`}
            style={{
              background: genererGradient(),
              transform: enTrainDeTourner ? undefined : `rotate(${rotation}deg)`,
              ["--final-rotation"]: `${rotation}deg`,
              boxShadow: "0 0 0 8px #1E40AF, 0 0 0 12px #06B6D4, 0 20px 40px rgba(0,0,0,0.4)",
              transition: enTrainDeTourner ? "none" : "transform 0.5s",
            }}
          >
            {/* Icônes des lots */}
            {lots.map((lot, i) => {
              const angle = i * angleParLot + angleParLot / 2;
              return (
                <div
                  key={lot.id}
                  className="absolute inset-0 flex items-start justify-center"
                  style={{
                    transform: `rotate(${angle}deg)`,
                    paddingTop: "20px",
                  }}
                >
                  <div
                    className="text-center"
                    style={{
                      transform: `rotate(${-angle}deg)`,
                    }}
                  >
                    <div className="text-2xl mb-1">{lot.icone || "🎁"}</div>
                    <div className="text-xs font-bold text-white drop-shadow-lg whitespace-nowrap">
                      {lot.nom}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 max-w-2xl mx-auto">
        <div className="public-card p-3 text-center">
          <Trophy size={20} className="text-yellow-400 mx-auto mb-1" />
          <p className="text-xs text-gray-400">Solde bonus</p>
          <p className="text-sm font-bold text-[#67E8F9]">
            {parseFloat(etat.solde_bonus || 0).toLocaleString("fr-FR")} Ar
          </p>
        </div>
        <div className="public-card p-3 text-center">
          <RotateCw size={20} className="text-cyan-400 mx-auto mb-1" />
          <p className="text-xs text-gray-400">Tours restants</p>
          <p className="text-sm font-bold text-cyan-400">
            {etat.peut_jouer?.tours_restants || 0} / {etat.peut_jouer?.limite || 1}
          </p>
        </div>
        <div className="public-card p-3 text-center col-span-2 md:col-span-1">
          <Info size={20} className="text-purple-400 mx-auto mb-1" />
          <p className="text-xs text-gray-400">Type</p>
          <p className="text-sm font-bold text-purple-400">
            {parseFloat(config.cout_ar || 0) > 0
              ? `${parseFloat(config.cout_ar).toLocaleString("fr-FR")} Ar / tour`
              : "Gratuit"}
          </p>
        </div>
      </div>

      {/* HISTORIQUE */}
      {historique.length > 0 && (
        <div className="max-w-2xl mx-auto">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Clock size={16} className="text-[#67E8F9]" />
            Mes derniers tours
          </h4>
          <div className="space-y-2">
            {historique.map((t) => (
              <div
                key={t.id}
                className="public-card p-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-2xl flex-shrink-0">
                    {t.lot_type === "bonus_ar" ? "💰"
                      : t.lot_type === "reduction" ? "🏷️"
                      : t.lot_type === "heure_gratuite" ? "⏰"
                      : t.lot_type === "cadeau" ? "🎁"
                      : "😢"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.lot_nom}</p>
                    <p className="text-xs text-gray-500">{formatDate(t.created_at)}</p>
                  </div>
                </div>
                {parseFloat(t.recompense_versee) > 0 && (
                  <span className="text-green-400 font-bold text-sm flex-shrink-0">
                    +{parseFloat(t.recompense_versee).toLocaleString("fr-FR")} Ar
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL RÉSULTAT */}
      {modalResultat && resultat && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={fermerModal}
        >
          <div
            className="bg-gradient-to-br from-[#112240] to-[#0A1628] rounded-3xl max-w-md w-full border-2 border-yellow-500/50 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: "pop 0.4s ease-out",
            }}
          >
            <style>{`
              @keyframes pop {
                0% { transform: scale(0.5); opacity: 0; }
                70% { transform: scale(1.05); }
                100% { transform: scale(1); opacity: 1; }
              }
              @keyframes confetti {
                0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
                100% { transform: translateY(400px) rotate(720deg); opacity: 0; }
              }
            `}</style>

            {/* Confetti */}
            {parseFloat(resultat.recompense) > 0 && (
              <>
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: 0,
                      backgroundColor: ["#F59E0B", "#EF4444", "#06B6D4", "#22C55E", "#7C3AED"][i % 5],
                      animation: `confetti ${1.5 + Math.random()}s ease-out ${Math.random() * 0.5}s`,
                    }}
                  />
                ))}
              </>
            )}

            <div className="p-8 text-center">
              <div className="text-7xl mb-4">
                {resultat.lot.type === "perdu" ? "😢" : resultat.lot.icone || "🎁"}
              </div>

              <h2 className="text-2xl font-bold mb-2">
                {resultat.lot.type === "perdu"
                  ? "Dommage..."
                  : "🎉 Félicitations !"}
              </h2>

              <p className="text-3xl font-black mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                {resultat.lot.nom}
              </p>

              {parseFloat(resultat.recompense) > 0 && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-4">
                  <p className="text-green-400 font-bold text-lg">
                    +{parseFloat(resultat.recompense).toLocaleString("fr-FR")} Ar
                  </p>
                  <p className="text-xs text-gray-400">
                    Ajoutés à votre solde bonus
                  </p>
                </div>
              )}

              {parseFloat(resultat.recompense) === 0 &&
                resultat.lot.type !== "perdu" && (
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3 mb-4">
                    <p className="text-cyan-400 font-bold">
                      {resultat.lot.type === "reduction"
                        ? `Code : ${resultat.lot.nom}`
                        : resultat.lot.type === "heure_gratuite"
                        ? "1 heure offerte !"
                        : "À récupérer en caisse"}
                    </p>
                  </div>
                )}

              {resultat.peut_rejouer?.peut_jouer && (
                <p className="text-xs text-gray-500 mb-4">
                  Il vous reste {resultat.peut_rejouer.tours_restants} tour(s) ce mois
                </p>
              )}

              <button
                onClick={fermerModal}
                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#1E40AF] hover:opacity-90 text-white font-bold transition"
              >
                <CheckCircle2 size={18} className="inline mr-2" />
                Super !
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}