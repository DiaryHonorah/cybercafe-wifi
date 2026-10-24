import { createContext, useContext, useState, useRef } from "react";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [permission, setPermission] = useState(() => {
    if (!("Notification" in window)) return "unsupported";
    return Notification.permission;
  });

  const [actif, setActif] = useState(() => {
    return localStorage.getItem("notifications_push") === "true";
  });

  const dernierEnvoiRef = useRef(0);

  const demanderPermission = async () => {
    if (!("Notification" in window)) {
      return { ok: false, message: "Notifications non supportées" };
    }
    if (Notification.permission === "granted") {
      setPermission("granted");
      setActif(true);
      localStorage.setItem("notifications_push", "true");
      return { ok: true, message: "Notifications déjà activées" };
    }
    if (Notification.permission === "denied") {
      return { ok: false, message: "Notifications bloquées" };
    }
    const resultat = await Notification.requestPermission();
    setPermission(resultat);
    if (resultat === "granted") {
      setActif(true);
      localStorage.setItem("notifications_push", "true");
      return { ok: true, message: "Notifications activées !" };
    }
    return { ok: false, message: "Permission refusée" };
  };

  const desactiver = () => {
    setActif(false);
    localStorage.setItem("notifications_push", "false");
  };

  const notifier = (titre, message, type = "systeme", options = {}) => {
    if (!actif) return false;
    if (permission !== "granted") return false;
    if (!("Notification" in window)) return false;

    const maintenant = Date.now();
    if (maintenant - dernierEnvoiRef.current < 2000) return false;
    dernierEnvoiRef.current = maintenant;

    const icones = { vente: "🛒", session: "🌐", expiration: "⏰", systeme: "ℹ️" };
    const titreComplet = `${icones[type] || "🔔"} ${titre}`;

    try {
      const notif = new Notification(titreComplet, {
        body: message,
        tag: options.tag || `cyber-${type}-${Date.now()}`,
        ...options,
      });
      setTimeout(() => { try { notif.close(); } catch {} }, 8000);
      notif.onclick = () => {
        window.focus();
        if (options.url) window.location.href = options.url;
        notif.close();
      };
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <NotificationContext.Provider
      value={{ permission, actif, demanderPermission, desactiver, notifier, supporte: "Notification" in window }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotificationPush = () => useContext(NotificationContext);