import axios from "axios";

// Instance axios SANS intercepteur, pour les pages publiques
const apiPublic = axios.create({
  baseURL: "http://localhost/cybercafe-wifi/backend",
});

export default apiPublic;