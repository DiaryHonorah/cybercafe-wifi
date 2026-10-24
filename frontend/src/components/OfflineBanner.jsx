import { useEffect, useState } from "react";
import { WifiOff, Wifi, CheckCircle2 } from "lucide-react";

export default function OfflineBanner() {
  const [enLigne, setEnLigne] = useState(navigator.onLine);
  const [afficherRetour, setAfficherRetour] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setEnLigne(true);
      setAfficherRetour(true);
      // Masquer le message "retour" après 3 secondes
      setTimeout(() => setAfficherRetour(false), 3000);
    };

    const handleOffline = () => {
      setEnLigne(false);
      setAfficherRetour(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Tout va bien : rien à afficher
  if (enLigne && !afficherRetour) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[500] flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium animate-slide-down ${
        enLigne
          ? "bg-success/90 text-white"
          : "bg-danger/90 text-white"
      }`}
    >
      {enLigne ? (
        <>
          <CheckCircle2 size={16} />
          <span>Connexion rétablie</span>
        </>
      ) : (
        <>
          <WifiOff size={16} className="animate-pulse" />
          <span>Vous êtes hors ligne — Vérifiez votre connexion Internet</span>
        </>
      )}
    </div>
  );
}