import { createContext, useContext, useState, useEffect } from "react";

const ClientAuthContext = createContext(null);

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

/**
 * Helper robuste : fetch + lecture texte + parse JSON sécurisé
 * Ne plante JAMAIS sur JSON.parse, retourne TOUJOURS un objet
 */
async function fetchJsonSafe(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const text = await res.text();

    console.log(`🔍 [${options.method || 'GET'} ${url}] Status=${res.status}, Longueur=${text.length}`);

    // Réponse vide → erreur serveur
    if (!text || text.trim() === '') {
      console.error(`🚨 [${url}] Réponse VIDE du serveur (Status ${res.status})`);
      return {
        ok: false,
        status: res.status,
        error: `Le serveur a renvoyé une réponse vide (Status ${res.status}). Vérifie les logs PHP.`,
      };
    }

    // Tentative de parse JSON
    try {
      const data = JSON.parse(text);
      return { ok: res.ok, status: res.status, data };
    } catch (e) {
      // Pas du JSON → probablement HTML (erreur PHP)
      console.error(`🚨 [${url}] Réponse non-JSON (Status ${res.status}):`, text.substring(0, 500));
      return {
        ok: false,
        status: res.status,
        error: `Le serveur a renvoyé une réponse invalide (Status ${res.status}). Vérifie les logs PHP. Détail : ${text.substring(0, 200)}`,
      };
    }
  } catch (err) {
    console.error(`❌ [${url}] Erreur réseau:`, err);
    return {
      ok: false,
      status: 0,
      error: `Impossible de contacter le serveur. Vérifie qu'Apache et MySQL sont démarrés. (${err.message})`,
    };
  }
}

export function ClientAuthProvider({ children }) {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("client_token");
    const data = localStorage.getItem("client_data");
    if (token && data) {
      try {
        setClient(JSON.parse(data));
      } catch (err) {
        console.error("Erreur parsing client_data:", err);
        localStorage.removeItem("client_data");
        localStorage.removeItem("client_token");
      }
    }
    setLoading(false);
  }, []);

  // ================ INSCRIPTION ================
  const inscription = async (donnees) => {
    console.log("📝 [INSCRIPTION] Données envoyées:", donnees);

    const result = await fetchJsonSafe(`${API_URL}/client/auth/inscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "omit",
      body: JSON.stringify(donnees),
    });

    if (result.error) {
      return { success: false, message: result.error };
    }

    const data = result.data;
    console.log("📥 [INSCRIPTION] Réponse backend:", data);

    if (data.success) {
      if (data.token && data.client) {
        localStorage.setItem("client_token", data.token);
        localStorage.setItem("client_data", JSON.stringify(data.client));
        setClient(data.client);
      }
      return {
        success: true,
        message: data.message || "Inscription réussie",
        client: data.client,
      };
    } else {
      return {
        success: false,
        message: data.message || data.erreur || "Erreur d'inscription",
      };
    }
  };

  // ================ CONNEXION ================
  const connexion = async (email, mot_de_passe) => {
    console.log("🔐 [LOGIN] Tentative avec:", email);

    const result = await fetchJsonSafe(`${API_URL}/client/auth/connexion`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "omit",
      body: JSON.stringify({ email, mot_de_passe }),
    });

    if (result.error) {
      return { success: false, message: result.error };
    }

    const data = result.data;
    console.log("📥 [LOGIN] Réponse backend:", data);

    if (data.success) {
      if (data.token && data.client) {
        localStorage.setItem("client_token", data.token);
        localStorage.setItem("client_data", JSON.stringify(data.client));
        setClient(data.client);
      }
      return {
        success: true,
        message: data.message || "Connexion réussie",
        client: data.client,
      };
    } else {
      return {
        success: false,
        message: data.message || data.erreur || "Email ou mot de passe incorrect",
      };
    }
  };

  // ================ DÉCONNEXION ================
  const deconnexion = async () => {
    try {
      const token = localStorage.getItem("client_token");
      if (token) {
        await fetch(`${API_URL}/client/auth/deconnexion`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "omit",
        });
      }
    } catch (err) {
      console.error("Erreur déconnexion API:", err);
    } finally {
      localStorage.removeItem("client_token");
      localStorage.removeItem("client_data");
      setClient(null);
    }
  };

  // ================ VÉRIFICATION SESSION ================
  const verifierSession = async () => {
    const token = localStorage.getItem("client_token");
    if (!token) {
      setClient(null);
      return false;
    }

    const result = await fetchJsonSafe(`${API_URL}/client/auth/verifier`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      credentials: "omit",
    });

    if (result.error || !result.data?.success) {
      localStorage.removeItem("client_token");
      localStorage.removeItem("client_data");
      setClient(null);
      return false;
    }

    setClient(result.data.client);
    localStorage.setItem("client_data", JSON.stringify(result.data.client));
    return true;
  };

  const value = {
    client,
    loading,
    isAuthenticated: !!client,
    inscription,
    connexion,
    deconnexion,
    verifierSession,
  };

  return (
    <ClientAuthContext.Provider value={value}>
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const context = useContext(ClientAuthContext);
  if (!context) {
    throw new Error("useClientAuth doit être utilisé dans un ClientAuthProvider");
  }
  return context;
}