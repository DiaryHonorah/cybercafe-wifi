import { useState, useEffect, useRef } from "react";
import {
  Wifi,
  KeyRound,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  LogOut,
} from "lucide-react";
import api from "../apiPublic";

export default function Portail() {
  const [code, setCode] = useState("");
  const [mdp, setMdp] = useState("");
  const [chargement, setChargement] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [secondesRestantes, setSecondesRestantes] = useState(0);
  const [erreur, setErreur] = useState("");
  const [sessionTerminee, setSessionTerminee] = useState(false);

  const tickRef = useRef(null);
  const pollRef = useRef(null);

  // Décrémenter chaque seconde
  useEffect(() => {
    if (!resultat?.success) return;

    tickRef.current = setInterval(() => {
      setSecondesRestantes((prev) => {
        const suivant = Math.max(0, prev - 1);
        if (suivant === 0) {
          // Session terminée : on affiche l'écran de fin
          setSessionTerminee(true);
        }
        return suivant;
      });
    }, 1000);

    return () => clearInterval(tickRef.current);
  }, [resultat?.success]);

  // Vérifier auprès du serveur toutes les 60 s
  useEffect(() => {
    if (!resultat?.success) return;

    pollRef.current = setInterval(async () => {
      try {
        const r = await api.get(
          `/api/sessions/statut?code=${encodeURIComponent(resultat.code)}`
        );
        if (
          r.data.session_statut === "expiree" ||
          r.data.secondes_restantes <= 0
        ) {
          setSessionTerminee(true);
        } else {
          setSecondesRestantes(r.data.secondes_restantes);
        }
      } catch (e) {
        // Ignore les erreurs réseau ponctuelles
      }
    }, 60000);

    return () => clearInterval(pollRef.current);
  }, [resultat?.success, resultat?.code]);

  const activer = async (e) => {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    setSessionTerminee(false);

    try {
      const r = await api.post("/api/sessions/demarrer", {
        code: code.toUpperCase().trim(),
        mot_de_passe: mdp.toUpperCase().trim(),
      });

      const duree =
        r.data.duree_minutes ?? r.data.duree ?? 0;
      const secondes = r.data.secondes_restantes ?? duree * 60;

      setResultat({
        success: true,
        code: r.data.code,
        message: `Connecté ! Durée : ${duree} minutes`,
      });
      setSecondesRestantes(secondes);
    } catch (err) {
      setErreur(err.response?.data?.erreur || "Erreur de connexion");
      setResultat({ success: false });
    } finally {
      setChargement(false);
    }
  };

  const reinitialiser = () => {
    setCode("");
    setMdp("");
    setResultat(null);
    setSecondesRestantes(0);
    setSessionTerminee(false);
    setErreur("");
  };

  const formatTemps = (s) => {
    if (!s || isNaN(s) || s < 0) return "00:00:00";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(
      sec
    ).padStart(2, "0")}`;
  };

  // Pourcentage pour la barre de progression
  const pourcentage = resultat?.success
    ? Math.min(100, Math.max(0, (secondesRestantes / (60 * 60)) * 100))
    : 0;

  const couleurProgression = () => {
    if (pourcentage > 50) return "bg-success";
    if (pourcentage > 20) return "bg-warn";
    return "bg-danger";
  };

  return (
    <div className="min-h-screen bg-night flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-2xl mb-4 shadow-lg shadow-accent/30">
            <Wifi size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold">Cyber Famille</h1>
          <p className="text-gray-400 mt-1">Portail de connexion Wi-Fi</p>
        </div>

        {/* ====== ÉCRAN 1 : Formulaire d'activation ====== */}
        {!resultat?.success && (
          <form
            onSubmit={activer}
            className="bg-panel border border-white/5 rounded-2xl p-8 shadow-xl"
          >
            <h2 className="text-xl font-semibold mb-6 text-center">
              Activez votre ticket
            </h2>

            {erreur && (
              <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3 mb-4 flex items-start gap-2">
                <XCircle size={18} className="mt-0.5 flex-shrink-0" />
                <span>{erreur}</span>
              </div>
            )}

            <label className="block text-sm text-gray-400 mb-2">
              Code d'accès
            </label>
            <div className="relative mb-4">
              <KeyRound
                size={18}
                className="absolute left-3 top-3.5 text-gray-500"
              />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="CF-XXXXX"
                required
                autoComplete="off"
                className="w-full bg-night border border-white/10 rounded-lg py-3 pl-10 pr-3 text-white font-mono tracking-widest focus:border-accent focus:outline-none transition"
              />
            </div>

            <label className="block text-sm text-gray-400 mb-2">
              Mot de passe
            </label>
            <div className="relative mb-6">
              <KeyRound
                size={18}
                className="absolute left-3 top-3.5 text-gray-500"
              />
              <input
                type="text"
                value={mdp}
                onChange={(e) => setMdp(e.target.value.toUpperCase())}
                placeholder="XXXXXX"
                required
                autoComplete="off"
                className="w-full bg-night border border-white/10 rounded-lg py-3 pl-10 pr-3 text-white font-mono tracking-widest focus:border-accent focus:outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={chargement}
              className="w-full bg-accent hover:bg-accentDark disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {chargement && <Loader2 size={18} className="animate-spin" />}
              {chargement ? "Activation..." : "Se connecter"}
            </button>
          </form>
        )}

        {/* ====== ÉCRAN 2 : Session active avec compte à rebours ====== */}
        {resultat?.success && !sessionTerminee && (
          <div className="bg-panel border border-success/30 rounded-2xl p-8 shadow-xl text-center">
            <CheckCircle2 size={48} className="text-success mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connexion réussie !</h2>
            <p className="text-gray-400 text-sm mb-6">{resultat.message}</p>

            <div className="bg-night rounded-xl p-6 border border-white/5 mb-4">
              <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-2">
                <Clock size={16} />
                Temps restant
              </div>
              <p className="text-4xl font-bold text-accent font-mono mb-4">
                {formatTemps(secondesRestantes)}
              </p>

              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${couleurProgression()} transition-all duration-1000`}
                  style={{ width: `${pourcentage}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Vous pouvez fermer cette page et naviguer normalement.
              <br />
              Votre accès sera coupé automatiquement à la fin du temps.
            </p>
          </div>
        )}

        {/* ====== ÉCRAN 3 : Session terminée ====== */}
        {resultat?.success && sessionTerminee && (
          <div className="bg-panel border border-warn/30 rounded-2xl p-8 shadow-xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-warn/10 rounded-2xl mb-4">
              <Clock size={32} className="text-warn" />
            </div>

            <h2 className="text-xl font-semibold mb-2">Session terminée</h2>
            <p className="text-gray-400 text-sm mb-6">
              Votre temps de connexion est écoulé.
              <br />
              Merci de votre visite chez Cyber Famille !
            </p>

            <div className="bg-night rounded-xl p-5 border border-white/5 mb-6">
              <p className="text-xs text-gray-500 mb-1">Code utilisé</p>
              <p className="font-mono text-accent text-lg">{resultat.code}</p>
            </div>

            <button
              onClick={reinitialiser}
              className="w-full bg-accent hover:bg-accentDark text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              <LogOut size={18} />
              Acheter un nouveau ticket
            </button>

            <p className="text-xs text-gray-500 mt-4">
              Demandez un nouveau ticket à l'accueil pour continuer.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}