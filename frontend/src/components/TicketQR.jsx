import { useEffect, useState } from "react";
import api from "../api";

export default function TicketQR({ code, size = 120 }) {
  const [qrBase64, setQrBase64] = useState(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    if (!code) return;
    api
      .get(`/api/qrcode?code=${encodeURIComponent(code)}`)
      .then((r) => {
        if (r.data.qr_base64) setQrBase64(r.data.qr_base64);
        else setErreur(true);
      })
      .catch(() => setErreur(true));
  }, [code]);

  if (erreur) {
    return (
      <div
        className="bg-white flex items-center justify-center border-2 border-dashed border-gray-300 text-gray-400 text-xs"
        style={{ width: size, height: size }}
      >
        QR indisponible
      </div>
    );
  }

  if (!qrBase64) {
    return (
      <div
        className="bg-white flex items-center justify-center border border-gray-300 text-gray-400 text-xs animate-pulse"
        style={{ width: size, height: size }}
      >
        Chargement...
      </div>
    );
  }

  return (
    <img
      src={qrBase64}
      alt={`QR Code ${code}`}
      style={{ width: size, height: size }}
      className="border border-gray-300"
    />
  );
}