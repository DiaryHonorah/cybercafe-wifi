import { forwardRef, useEffect, useState } from "react";
import api from "../api";

const TicketImprimable = forwardRef(({ tickets }, ref) => {
  const [qrs, setQrs] = useState({});

  useEffect(() => {
    if (!tickets || tickets.length === 0) return;

    tickets.forEach((t) => {
      if (qrs[t.code]) return;
      api
        .get(`/api/qrcode?code=${encodeURIComponent(t.code)}`)
        .then((r) => {
          if (r.data.qr_base64) {
            setQrs((prev) => ({ ...prev, [t.code]: r.data.qr_base64 }));
          }
        })
        .catch(() => {});
    });
  }, [tickets]);

  return (
    <div ref={ref} className="ticket-print">
      {tickets.map((t, i) => (
        <div key={i} className="ticket">
          <div className="ticket-header">
            <h1>CYBER FAMILLE</h1>
            <p>Starlink Wi-Fi Haut Débit</p>
          </div>

          <div className="ticket-sep" />

          <p className="ticket-title">TICKET DE CONNEXION WI-FI</p>

          <div className="ticket-info">
            <div className="ligne">
              <span>Réseau :</span>
              <strong>CYBER_FAMILLE</strong>
            </div>
            <div className="ligne">
              <span>Code :</span>
              <strong className="mono">{t.code}</strong>
            </div>
            <div className="ligne">
              <span>Mot de passe :</span>
              <strong className="mono">{t.mot_de_passe}</strong>
            </div>
            <div className="ligne">
              <span>Durée :</span>
              <strong>{t.duree} minutes</strong>
            </div>
            <div className="ligne">
              <span>Prix :</span>
              <strong>{t.prix} Ar</strong>
            </div>
          </div>

          {qrs[t.code] && (
            <div className="ticket-qr">
              <img src={qrs[t.code]} alt={`QR ${t.code}`} />
              <p className="qr-label">Scannez pour vous connecter</p>
            </div>
          )}

          <div className="ticket-sep" />

          <p className="ticket-footer">
            1. Connectez-vous au Wi-Fi CYBER_FAMILLE
            <br />
            2. Ouvrez votre navigateur
            <br />
            3. Entrez le code et le mot de passe
            <br />
            4. Bonne navigation !
          </p>

          <p className="ticket-date">
            Émis le {new Date().toLocaleString("fr-FR")}
          </p>
        </div>
      ))}
    </div>
  );
});

TicketImprimable.displayName = "TicketImprimable";

export default TicketImprimable;