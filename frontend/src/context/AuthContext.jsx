import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem("admin_data");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          avatar_url: parsed.avatar_url || null,
        };
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(true);

  const getToken = () =>
    localStorage.getItem("admin_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token");

  const setToken = (token) => {
    localStorage.setItem("admin_token", token);
  };

  const clearAuth = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("token");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("admin_data");
    setAdmin(null);
  };

  // Login
  const login = async (email, motDePasse, code2fa = null) => {
    const body = { email, mot_de_passe: motDePasse };
    if (code2fa) body.code_2fa = code2fa;

    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (data.requires_2fa) {
      return { requires_2fa: true, admin_id: data.admin_id };
    }

    if (!res.ok || !data.success) {
      throw new Error(data.erreur || "Identifiants incorrects");
    }

    setToken(data.token);
    setAdmin({
      ...data.admin,
      avatar_url: data.admin.avatar_url || null,
    });
    localStorage.setItem("admin_data", JSON.stringify(data.admin));

    return data;
  };

  // Logout
  const logout = async () => {
    try {
      const token = getToken();
      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
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

  // Vérifier l'authentification
  const verifierAuth = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/verifier`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.valide && data.admin) {
        setAdmin({
          ...data.admin,
          avatar_url: data.admin.avatar_url || null,
        });
        localStorage.setItem("admin_data", JSON.stringify(data.admin));
      } else {
        clearAuth();
      }
    } catch (e) {
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  // Rafraîchir le profil (avatar, nom, etc.)
  const rafraichirProfil = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/profil/mon-profil`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success && data.profil) {
        setAdmin((prev) => ({
          ...prev,
          ...data.profil,
          avatar_url: data.profil.avatar_url,
        }));
        localStorage.setItem("admin_data", JSON.stringify(data.profil));
      }
    } catch (e) {
      console.error("Erreur rafraichirProfil:", e);
    }
  };

  // Charger le profil au démarrage
  useEffect(() => {
    verifierAuth().then(() => {
      // Rafraîchir le profil une fois l'auth OK
      setTimeout(() => rafraichirProfil(), 100);
    });
  }, []);

  const value = {
    admin,
    login,
    logout,
    verifierAuth,
    rafraichirProfil,
    isAuthenticated: !!admin,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
};