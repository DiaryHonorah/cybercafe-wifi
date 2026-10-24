import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api";

const CaisseContext = createContext(null);

export function CaisseProvider({ children }) {
  const [sessionActive, setSessionActive] = useState(null);
  const [chargement, setChargement] = useState(true);

  const chargerSession = useCallback(async () => {
    try {
      const admin_id = 1; // À remplacer par l'ID réel de l'admin connecté
      const r = await api.get(`/api/caisses/session?admin_id=${admin_id}`);
      if (r.data.active) {
        setSessionActive(r.data.session);
      } else {
        setSessionActive(null);
      }
    } catch (e) {
      console.warn("[Caisse] Erreur :", e);
      setSessionActive(null);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    chargerSession();
    // Recharger toutes les 60 secondes
    const interval = setInterval(chargerSession, 60000);
    return () => clearInterval(interval);
  }, [chargerSession]);

  const ouvrirCaisse = async (caisse_id, admin_id) => {
    const r = await api.post("/api/caisses/ouvrir", { caisse_id, admin_id });
    if (r.data.success) {
      await chargerSession();
      return true;
    }
    return false;
  };

  const fermerCaisse = async (admin_id) => {
    const r = await api.post("/api/caisses/fermer", { admin_id });
    if (r.data.success) {
      setSessionActive(null);
      return true;
    }
    return false;
  };

  return (
    <CaisseContext.Provider
      value={{
        sessionActive,
        chargement,
        ouvrirCaisse,
        fermerCaisse,
        recharger: chargerSession,
      }}
    >
      {children}
    </CaisseContext.Provider>
  );
}

export const useCaisse = () => useContext(CaisseContext);