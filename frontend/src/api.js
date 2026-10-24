import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost/cybercafe-wifi/backend",
  timeout: 15000,
});

// Ajout automatique du token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Gestion minimale des erreurs 401 (session expirée)
api.interceptors.response.use(
  (r) => r,
  (err) => {
    const chemin = window.location.pathname;
    const pagePublique = chemin === "/login" || chemin === "/portail";

    if (err.response?.status === 401 && !pagePublique) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(err);
  }
);

export default api;