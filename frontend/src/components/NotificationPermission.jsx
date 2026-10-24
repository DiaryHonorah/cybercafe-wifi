import { useState } from "react";
import { Bell, BellOff, BellRing, Check, X } from "lucide-react";
import { useNotificationPush } from "../context/NotificationContext";
import { toast } from "./Toast";

export default function NotificationPermission() {
  const { permission, actif, demanderPermission, desactiver, supporte } =
    useNotificationPush();
  const [ouvert, setOuvert] = useState(false);

  if (!supporte) return null;

  const handleActiver = async () => {
    const resultat = await demanderPermission();
    if (resultat.ok) {
      toast(resultat.message, "success");
    } else {
      toast(resultat.message, "warn");
    }
    setOuvert(false);
  };

  const handleDesactiver = () => {
    desactiver();
    toast("Notifications désactivées", "info");
    setOuvert(false);
  };

  // État visuel du bouton
  const getIcone = () => {
    if (actif && permission === "granted") return BellRing;
    if (permission === "denied") return BellOff;
    return Bell;
  };

  const Icone = getIcone();

  const couleur = () => {
    if (actif && permission === "granted") return "text-success";
    if (permission === "denied") return "text-danger";
    return "text-gray-400";
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOuvert(!ouvert)}
        className={`p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition ${couleur()}`}
        title={
          actif
            ? "Notifications push activées"
            : permission === "denied"
            ? "Notifications bloquées"
            : "Activer les notifications push"
        }
      >
        <Icone size={16} />
      </button>

      {ouvert && (
        <>
          <div
            className="fixed inset-0 z-[90]"
            onClick={() => setOuvert(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-panel border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Bell size={16} className="text-accent" />
                <h3 className="font-semibold text-sm">
                  Notifications push
                </h3>
              </div>
              <p className="text-xs text-gray-400">
                Recevez des alertes système même si l'onglet est en arrière-plan.
              </p>
            </div>

            <div className="p-4 space-y-3">
              {/* État actuel */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">État</span>
                <span
                  className={`flex items-center gap-1 font-medium ${
                    actif && permission === "granted"
                      ? "text-success"
                      : permission === "denied"
                      ? "text-danger"
                      : "text-gray-400"
                  }`}
                >
                  {actif && permission === "granted" ? (
                    <>
                      <Check size={14} /> Activées
                    </>
                  ) : permission === "denied" ? (
                    <>
                      <X size={14} /> Bloquées
                    </>
                  ) : (
                    <>Désactivées</>
                  )}
                </span>
              </div>

              {/* Info si bloqué */}
              {permission === "denied" && (
                <div className="bg-danger/10 border border-danger/30 text-danger text-xs rounded-lg p-3">
                  Les notifications sont bloquées par votre navigateur.
                  <br />
                  <b>Comment débloquer :</b> cliquez sur l'icône 🔒 dans la barre
                  d'adresse, puis autorisez les notifications.
                </div>
              )}

              {/* Boutons */}
              {permission !== "denied" && (
                <>
                  {!actif || permission !== "granted" ? (
                    <button
                      onClick={handleActiver}
                      className="w-full bg-accent hover:bg-accentDark text-white text-sm font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <BellRing size={16} />
                      Activer les notifications
                    </button>
                  ) : (
                    <button
                      onClick={handleDesactiver}
                      className="w-full bg-white/5 hover:bg-white/10 text-sm font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <BellOff size={16} />
                      Désactiver
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Info */}
            <div className="p-4 bg-night/50 border-t border-white/5">
              <p className="text-xs text-gray-500">
                💡 Vous recevrez une alerte pour : nouvelles ventes, sessions
                démarrées, expirations.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}