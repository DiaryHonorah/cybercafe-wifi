import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useNotificationPush } from "./NotificationContext";

const WebSocketContext = createContext(null);

// ⭐ Instance unique au niveau du module (survit aux re-renders)
let wsGlobal = null;
let wsEstEnCoursDeConnexion = false;

export function WebSocketProvider({ children }) {
  const [connecte, setConnecte] = useState(false);
  const [dernierMessage, setDernierMessage] = useState(null);
  const wsRef = useRef(null);
  const listenersRef = useRef(new Set());
  const reconnectRef = useRef(null);
  const pingRef = useRef(null);
  const { notifier } = useNotificationPush();

  const notifierRef = useRef(notifier);
  useEffect(() => {
    notifierRef.current = notifier;
  }, [notifier]);

  const connecter = useCallback(() => {
    // ⭐ Si déjà connecté, on réutilise
    if (wsGlobal && wsGlobal.readyState === WebSocket.OPEN) {
      console.log("[WS] Réutilisation de la connexion existante");
      wsRef.current = wsGlobal;
      setConnecte(true);
      return;
    }

    // ⭐ Si une connexion est en cours, on attend
    if (wsEstEnCoursDeConnexion) {
      console.log("[WS] Connexion déjà en cours, on attend...");
      return;
    }

    wsEstEnCoursDeConnexion = true;

    try {
      const ws = new WebSocket("ws://localhost:8090");
      wsRef.current = ws;
      wsGlobal = ws;

      ws.onopen = () => {
        console.log("[WS] ✅ Connecté");
        setConnecte(true);
        wsEstEnCoursDeConnexion = false;
        pingRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "pong" || data.type === "bienvenue") return;

          console.log("[WS] 📩 Événement :", data);
          setDernierMessage(data);

          if (notifierRef.current && data.titre) {
            notifierRef.current(data.titre, data.message || "", data.type || "systeme", {
              tag: `ws-${data.type}-${data.timestamp || Date.now()}`,
            });
          }

          listenersRef.current.forEach((fn) => {
            try {
              fn(data);
            } catch (e) {
              console.warn("[WS] Erreur listener :", e);
            }
          });
        } catch (e) {
          console.warn("[WS] Message invalide :", event.data);
        }
      };

      ws.onclose = () => {
        console.log("[WS] ⚠️ Déconnecté — reconnexion dans 5s");
        setConnecte(false);
        wsGlobal = null;
        wsEstEnCoursDeConnexion = false;
        if (pingRef.current) clearInterval(pingRef.current);
        reconnectRef.current = setTimeout(() => connecter(), 5000);
      };

      ws.onerror = (err) => {
        console.warn("[WS] Erreur :", err);
        wsEstEnCoursDeConnexion = false;
      };
    } catch (e) {
      console.warn("[WS] Impossible de se connecter :", e);
      wsEstEnCoursDeConnexion = false;
      reconnectRef.current = setTimeout(() => connecter(), 5000);
    }
  }, []);

  useEffect(() => {
    connecter();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      // ⭐ On ne ferme PAS la connexion globale
    };
  }, [connecter]);

  const souscrire = useCallback((fn) => {
    listenersRef.current.add(fn);
    return () => {
      listenersRef.current.delete(fn);
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ connecte, dernierMessage, souscrire }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => useContext(WebSocketContext);