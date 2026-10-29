import { useState, useEffect } from "react";
import {
  Star,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { useClientAuth } from "../context/ClientAuthContext";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

/**
 * Formulaire d'avis client
 * Props:
 *  - reservationId (optionnel) : ID de la réservation liée
 *  - onSuccess (optionnel) : callback après succès
 *  - onCancel (optionnel) : callback si annulé
 *  - inline (bool) : true = intégré, false = modal
 */
export default function AvisForm({
  reservationId = null,
  onSuccess,
  onCancel,
  inline = true,
}) {
  const { client } = useClientAuth();
  const [config, setConfig] = useState(null);
  const [note, setNote] = useState(5);
  const [hoverNote, setHoverNote] = useState(0);
  const [titre, setTitre] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [nomAffiche, setNomAffiche] = useState("");
  const [service, setService] = useState("reservation");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(null);

  useEffect(() => {
    // Charger la config
    fetch(`${API_URL}/avis/config`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setConfig(d.config);
      })
      .catch(() => {});

    // Pré-remplir le nom
    if (client?.nom) {
      setNomAffiche(client.nom);
    }
  }, [client]);

  const getToken = () => localStorage.getItem("client_token");

  const envoyer = async () => {
    setErreur(null);
    setSucces(null);

    if (!commentaire.trim()) {
      setErreur("Veuillez écrire un commentaire");
      return;
    }

    if (config && commentaire.trim().length < parseInt(config.min_caracteres)) {
      setErreur(`Commentaire trop court (min ${config.min_caracteres} caractères)`);
      return;
    }

    if (!nomAffiche.trim()) {
      setErreur("Veuillez indiquer un nom");
      return;
    }

    setChargement(true);

    try {
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      const token = getToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/avis`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          reservation_id: reservationId,
          note,
          titre: titre.trim() || null,
          commentaire: commentaire.trim(),
          nom_affiche: nomAffiche.trim(),
          service_note: service,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSucces(data.message);
        setCommentaire("");
        setTitre("");
        setNote(5);

        if (onSuccess) {
          setTimeout(() => onSuccess(data.avis), 1500);
        }
      } else {
        setErreur(data.message);
      }
    } catch (err) {
      setErreur("Erreur serveur");
    } finally {
      setChargement(false);
    }
  };

  const renderEtoiles = () => {
    const valeur = hoverNote || note;
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((etoile) => (
          <button
            key={etoile}
            type="button"
            onClick={() => setNote(etoile)}
            onMouseEnter={() => setHoverNote(etoile)}
            onMouseLeave={() => setHoverNote(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              size={32}
              className={
                etoile <= valeur
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-600"
              }
            />
          </button>
        ))}
      </div>
    );
  };

  const getNoteLabel = () => {
    const labels = {
      1: "Très mauvais",
      2: "Mauvais",
      3: "Moyen",
      4: "Bien",
      5: "Excellent",
    };
    return labels[note] || "";
  };

  const contenu = (
    <div className={inline ? "public-card p-6" : ""}>
      {succes ? (
        <div className="text-center py-8">
          <div className="inline-flex p-4 rounded-full bg-green-500/20 mb-4">
            <CheckCircle2 size={48} className="text-green-400" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-green-400">
            Merci pour votre avis !
          </h3>
          <p className="text-gray-400 text-sm">{succes}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <Sparkles size={20} className="text-yellow-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Laissez votre avis</h3>
              <p className="text-xs text-gray-400">
                Votre retour nous aide à améliorer nos services
              </p>
            </div>
          </div>

          {erreur && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 flex items-center gap-2">
              <AlertCircle size={16} />
              <p>{erreur}</p>
            </div>
          )}

          {/* Note */}
          <div className="mb-6 text-center">
            <p className="text-sm text-gray-400 mb-3">Votre note *</p>
            <div className="flex flex-col items-center gap-2">
              {renderEtoiles()}
              <p className="text-sm font-medium text-yellow-400">
                {getNoteLabel()}
              </p>
            </div>
          </div>

          {/* Service */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              Service concerné
            </label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-2.5 px-4 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
            >
              <option value="reservation">Réservation</option>
              <option value="wifi">Wi-Fi</option>
              <option value="impression">Impression</option>
              <option value="accueil">Accueil</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          {/* Nom affiché */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              Nom affiché *
            </label>
            <input
              type="text"
              value={nomAffiche}
              onChange={(e) => setNomAffiche(e.target.value)}
              placeholder="Ex: Rakoto J."
              maxLength={100}
              className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-2.5 px-4 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
            />
          </div>

          {/* Titre */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              Titre (optionnel)
            </label>
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex: Très bonne expérience"
              maxLength={200}
              className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-2.5 px-4 text-white text-sm focus:border-[#06B6D4] focus:outline-none"
            />
          </div>

          {/* Commentaire */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              Votre commentaire *
            </label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={4}
              placeholder="Partagez votre expérience..."
              maxLength={1000}
              className="w-full bg-[#0A1628] border border-[#1E40AF]/30 rounded-lg py-2.5 px-4 text-white text-sm focus:border-[#06B6D4] focus:outline-none resize-none"
            />
            <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
              <span>
                Min : {config?.min_caracteres || 10} caractères
              </span>
              <span>{commentaire.length} / 1000</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {onCancel && (
              <button
                onClick={onCancel}
                disabled={chargement}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 font-medium transition disabled:opacity-50"
              >
                Annuler
              </button>
            )}
            <button
              onClick={envoyer}
              disabled={chargement || !commentaire.trim()}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 text-white font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {chargement ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              Publier mon avis
            </button>
          </div>
        </>
      )}
    </div>
  );

  // Mode modal
  if (!inline) {
    return (
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        onClick={() => !chargement && onCancel && onCancel()}
      >
        <div
          className="bg-[#112240] rounded-2xl max-w-md w-full border border-yellow-500/30 my-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#112240] z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <MessageSquare size={20} className="text-yellow-400" />
              </div>
              <h2 className="text-lg font-bold">Mon avis</h2>
            </div>
            <button
              onClick={onCancel}
              disabled={chargement}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-5">{contenu}</div>
        </div>
      </div>
    );
  }

  return contenu;
}