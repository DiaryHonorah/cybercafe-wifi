import { createContext, useContext, useState, useEffect } from "react";

const ClientAuthContext = createContext(null);

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export function ClientAuthProvider({ children }) {
  const [client, setClient] = useState(() => {
    const stored = localStorage.getItem("client_data");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem("client_token");

  const setAuth = (client, token) => {
    setClient(client);
    localStorage.setItem("client_data", JSON.stringify(client));
    localStorage.setItem("client_token", token);
  };

  const clearAuth = () => {
    setClient(null);
    localStorage.removeItem("client_data");
    localStorage.removeItem("client_token");
  };

  // Inscription
  const inscription = async (data) => {
    const res = await fetch(`${API_URL}/client/auth/inscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
      throw new Error(result.message || "Erreur lors de l'inscription");
    }

    setAuth(result.client, result.token);
    return result;
  };

  // Connexion
  const connexion = async (email, motDePasse) => {
    const res = await fetch(`${API_URL}/client/auth/connexion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, mot_de_passe: motDePasse }),
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
      throw new Error(result.message || "Erreur de connexion");
    }

    setAuth(result.client, result.token);
    return result;
  };

  // Déconnexion
  const deconnexion = async () => {
    try {
      const token = getToken();
      if (token) {
        await fetch(`${API_URL}/client/auth/deconnexion`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (e) {
      // Silencieux
    } finally {
      clearAuth();
    }
  };

  // Vérifier le token au démarrage
  const verifierAuth = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/client/auth/verifier`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success && data.client) {
        setClient(data.client);
        localStorage.setItem("client_data", JSON.stringify(data.client));
      } else {
        clearAuth();
      }
    } catch (e) {
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifierAuth();
  }, []);

  const value = {
    client,
    loading,
    inscription,
    connexion,
    deconnexion,
    verifierAuth,
    isAuthenticated: !!client,
  };

  return (
    <ClientAuthContext.Provider value={value}>
      {children}
    </ClientAuthContext.Provider>
  );
}

export const useClientAuth = () => {
  const context = useContext(ClientAuthContext);
  if (!context) {
    throw new Error("useClientAuth doit être utilisé dans un ClientAuthProvider");
  }
  return context;
};