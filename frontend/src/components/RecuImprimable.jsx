import { forwardRef } from "react";

const RecuImprimable = forwardRef(({ recu }, ref) => {
  if (!recu) return null;

  const date = new Date(recu.date_vente);
  const devise = recu.devise || "Ar";

  return (
    <div ref={ref} className="recu-print">
      <div className="recu">
        {/* En-tête */}
        <div className="recu-header">
          <h1>{recu.nom_cyber || "Cyber Famille"}</h1>
          {recu.adresse_cyber && <p>{recu.adresse_cyber}</p>}
          {recu.telephone_cyber && <p>Tél : {recu.telephone_cyber}</p>}
        </div>

        <div className="recu-sep" />

        <h2 className="recu-titre">REÇU DE PAIEMENT</h2>

        <p className="recu-numero">
          N° <b>{recu.numero_recu || `REC-${recu.vente_id}`}</b>
        </p>

        <div className="recu-sep" />

        {/* Infos vente */}
        <div className="recu-lignes">
          <div className="ligne">
            <span>Date :</span>
            <strong>{date.toLocaleString("fr-FR")}</strong>
          </div>
          <div className="ligne">
            <span>Caissier :</span>
            <strong>{recu.caissier}</strong>
          </div>
          {recu.nom_client && (
            <div className="ligne">
              <span>Client :</span>
              <strong>{recu.nom_client}</strong>
            </div>
          )}
          {recu.telephone_client && (
            <div className="ligne">
              <span>Téléphone :</span>
              <strong>{recu.telephone_client}</strong>
            </div>
          )}
        </div>

        <div className="recu-sep" />

        {/* Détails */}
        <div className="recu-lignes">
          <div className="ligne">
            <span>Forfait :</span>
            <strong>{recu.forfait_nom}</strong>
          </div>
          <div className="ligne">
            <span>Durée :</span>
            <strong>{recu.duree_minutes} minutes</strong>
          </div>
          <div className="ligne">
            <span>Code ticket :</span>
            <strong className="mono">{recu.ticket_code}</strong>
          </div>
        </div>

        <div className="recu-sep" />

        {/* Total */}
        <div className="recu-total">
          <span>MONTANT TOTAL</span>
          <strong>{recu.montant} {devise}</strong>
        </div>

        {recu.remarque && (
          <p className="recu-remarque">
            <b>Remarque :</b> {recu.remarque}
          </p>
        )}

        <div className="recu-sep" />

        {/* Signature */}
        <div className="recu-signature">
          <div className="sig-bloc">
            <p>Signature client</p>
            <div className="sig-ligne"></div>
          </div>
          <div className="sig-bloc">
            <p>Signature caissier</p>
            <div className="sig-ligne"></div>
          </div>
        </div>

        {/* Footer */}
        <p className="recu-footer">
          Merci de votre confiance !
          <br />
          Conservez ce reçu pour tout réclamation.
        </p>
      </div>
    </div>
  );
});

RecuImprimable.displayName = "RecuImprimable";

export default RecuImprimable;