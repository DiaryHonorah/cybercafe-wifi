import { useState } from "react";
import {
  Tag,
  Check,
  X,
  Loader2,
  Sparkles,
  TrendingDown,
} from "lucide-react";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

/**
 * Composant pour saisir et valider un code promo
 * 
 * Props :
 * - montant : montant actuel (avant réduction)
 * - service : 'reservation', 'ticket', 'vip', 'tous'
 * - clientTelephone : téléphone du client (optionnel)
 * - onApply : callback (montantFinal, reduction, promo) quand appliqué
 * - onRemove : callback quand retiré
 * - langue : 'fr' | 'mg' (défaut 'fr')
 */
export default function PromoInput({
  montant = 0,
  service = "tous",
  clientTelephone = null,
  onApply,
  onRemove,
  langue = "fr",
}) {
  const [code, setCode] = useState("");
  const [chargement, setChargement] = useState(false);
  const [promoAppliquee, setPromoAppliquee] = useState(null);
  const [erreur, setErreur] = useState(null);

  const textes = {
    fr: {
      placeholder: "Code promo (optionnel)",
      bouton: "Appliquer",
      boutonChargement: "Vérification...",
      applique: "Code appliqué",
      retirer: "Retirer",
      economie: "Vous économisez",
      erreur: "Code invalide",
    },
    mg: {
      placeholder: "Kaody promo (tsy voatery)",
      bouton: "Ampiharo",
      boutonChargement: "Manamarina...",
      applique: "Voampiharina ny kaody",
      retirer: "Esory",
      economie: "Voavonjy ianao",
      erreur: "Kaody diso",
    },
  };

  const t = textes[langue] || textes.fr;

  const appliquer = async () => {
    if (!code.trim()) return;

    setChargement(true);
    setErreur(null);

    try {
      const res = await fetch(`${API_URL}/promotions/valider`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          montant,
          service,
          client_telephone: clientTelephone,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setPromoAppliquee(data);
        setErreur(null);
        if (onApply) {
          onApply({
            montant_final: data.montant_apres,
            reduction: data.reduction,
            promotion: data.promotion,
            code: code.trim(),
          });
        }
      } else {
        setErreur(data.message || t.erreur);
      }
    } catch (err) {
      setErreur(t.erreur);
    } finally {
      setChargement(false);
    }
  };

  const retirer = () => {
    setPromoAppliquee(null);
    setCode("");
    setErreur(null);
    if (onRemove) onRemove();
  };

  const formatPrix = (n) => Number(n).toLocaleString("fr-FR");

  // Si un code est appliqué
  if (promoAppliquee) {
    return (
      <div className="bg-green-500/10 border-2 border-green-500/30 rounded-xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-lg bg-green-500/20 flex-shrink-0">
              <Check size={20} className="text-green-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-green-400 flex items-center gap-2">
                <Tag size={14} />
                {promoAppliquee.promotion.code}
              </p>
              <p className="text-sm text-gray-300 mt-1">
                {promoAppliquee.promotion.description}
              </p>
              <p className="text-sm text-green-400 font-medium mt-2 flex items-center gap-1">
                <TrendingDown size={14} />
                {t.economie} {formatPrix(promoAppliquee.reduction)} Ar
              </p>
            </div>
          </div>
          <button
            onClick={retirer}
            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition flex-shrink-0"
            title={t.retirer}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Tag
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setErreur(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                appliquer();
              }
            }}
            placeholder={t.placeholder}
            disabled={chargement}
            className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm uppercase focus:border-[#06B6D4] focus:outline-none transition"
            maxLength={50}
          />
        </div>
        <button
          onClick={appliquer}
          disabled={!code.trim() || chargement}
          className="px-4 py-2.5 rounded-lg bg-[#06B6D4] hover:bg-[#0891B2] text-white text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
        >
          {chargement ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span className="hidden sm:inline">{t.boutonChargement}</span>
            </>
          ) : (
            <>
              <Sparkles size={14} />
              <span className="hidden sm:inline">{t.bouton}</span>
            </>
          )}
        </button>
      </div>

      {erreur && (
        <div className="mt-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg p-2 flex items-center gap-2">
          <X size={12} />
          {erreur}
        </div>
      )}
    </div>
  );
}