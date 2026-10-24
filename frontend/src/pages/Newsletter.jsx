import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Users,
  Search,
  Filter,
  Send,
  Trash2,
  Eye,
  Calendar,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  Plus,
  TrendingUp,
  FileText,
  LoaderCircle,
  UserCheck,
  UserX,
} from "lucide-react";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function Newsletter() {
  const navigate = useNavigate();
  const [abonnes, setAbonnes] = useState([]);
  const [envois, setEnvois] = useState([]);
  const [stats, setStats] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [recherche, setRecherche] = useState("");
  const [ongletActif, setOngletActif] = useState("abonnes"); // abonnes | envois
  const [modalEnvoi, setModalEnvoi] = useState(false);
  const [modalSupprimer, setModalSupprimer] = useState(null);
  const [sujetNewsletter, setSujetNewsletter] = useState("");
  const [contenuNewsletter, setContenuNewsletter] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  // ===== TOKEN =====
  const getToken = () =>
    localStorage.getItem("admin_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    "";

  const fetchAvecToken = async (url, options = {}) => {
    const token = getToken();
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {}),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return fetch(url, { ...options, headers, credentials: "omit" });
  };

  // ===== CHARGEMENT =====
  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);

    const token = getToken();
    if (!token) {
      setErreur("Aucun token. Redirection...");
      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    try {
      // Stats
      const statsRes = await fetchAvecToken(
        `${API_URL}/newsletter/admin/stats`
      );
      if (statsRes.status === 401) {
        navigate("/login");
        return;
      }
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.stats);

      // Abonnés
      const params = new URLSearchParams();
      if (filtreStatut === "confirme") params.append("confirme", "1");
      if (filtreStatut === "attente") params.append("confirme", "0");
      if (filtreStatut === "desabonne") params.append("actif", "0");
      if (recherche.trim()) params.append("recherche", recherche.trim());

      const abonnesRes = await fetchAvecToken(
        `${API_URL}/newsletter/admin/abonnes?${params.toString()}`
      );
      const abonnesData = await abonnesRes.json();
      if (abonnesData.success) setAbonnes(abonnesData.abonnes || []);

      // Envois
      const envoisRes = await fetchAvecToken(
        `${API_URL}/newsletter/admin/envois`
      );
      const envoisData = await envoisRes.json();
      if (envoisData.success) setEnvois(envoisData.envois || []);
    } catch (err) {
      console.error("Erreur:", err);
      setErreur("Impossible de contacter le serveur");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, [filtreStatut]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (recherche.length === 0 || recherche.length >= 2) {
        chargerDonnees();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [recherche]);

  // ===== ACTIONS =====
  const envoyerNewsletter = async () => {
    if (!sujetNewsletter.trim() || !contenuNewsletter.trim()) {
      alert("Sujet et contenu requis");
      return;
    }

    if (
      !confirm(
        "Envoyer la newsletter à tous les abonnés confirmés ? Cette action est irréversible."
      )
    ) {
      return;
    }

    setEnvoiEnCours(true);

    try {
      const res = await fetchAvecToken(
        `${API_URL}/newsletter/admin/envoyer`,
        {
          method: "POST",
          body: JSON.stringify({
            sujet: sujetNewsletter,
            contenu: contenuNewsletter,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        alert(data.message);
        setModalEnvoi(false);
        setSujetNewsletter("");
        setContenuNewsletter("");
        chargerDonnees();
      } else {
        alert(data.message || "Erreur lors de l'envoi");
      }
    } catch (err) {
      alert("Erreur serveur");
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const supprimerAbonne = async () => {
    if (!modalSupprimer) return;

    try {
      const res = await fetchAvecToken(
        `${API_URL}/newsletter/admin/supprimer`,
        {
          method: "POST",
          body: JSON.stringify({ id: modalSupprimer.id }),
        }
      );
      const data = await res.json();

      if (data.success) {
        setModalSupprimer(null);
        chargerDonnees();
      } else {
        alert(data.message || "Erreur");
      }
    } catch (err) {
      alert("Erreur serveur");
    }
  };

  // ===== HELPERS =====
  const getStatutBadge = (abonne) => {
    if (!abonne.actif) {
      return {
        label: "Désabonné",
        color: "bg-red-500/10 text-red-400 border-red-500/30",
        icon: UserX,
      };
    }
    if (abonne.confirme) {
      return {
        label: "Confirmé",
        color: "bg-green-500/10 text-green-400 border-green-500/30",
        icon: UserCheck,
      };
    }
    return {
      label: "En attente",
      color: "bg-orange-500/10 text-orange-400 border-orange-500/30",
      icon: Clock,
    };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ===== RENDER =====
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
              <Mail size={24} className="text-white" />
            </div>
            Newsletter
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Gérez vos abonnés et envoyez des newsletters
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={chargerDonnees}
            disabled={chargement}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition disabled:opacity-50"
          >
            <RefreshCw size={16} className={chargement ? "animate-spin" : ""} />
            Actualiser
          </button>
          <button
            onClick={() => setModalEnvoi(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition"
          >
            <Send size={16} />
            Nouvelle newsletter
          </button>
        </div>
      </div>

      {/* STATS */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-[#112240] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <Users size={14} /> Total
            </div>
            <p className="text-2xl font-bold">{stats.total || 0}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-green-500/20">
            <div className="flex items-center gap-2 text-xs text-green-400 mb-1">
              <UserCheck size={14} /> Actifs
            </div>
            <p className="text-2xl font-bold text-green-400">
              {stats.actifs || 0}
            </p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-orange-500/20">
            <div className="flex items-center gap-2 text-xs text-orange-400 mb-1">
              <Clock size={14} /> En attente
            </div>
            <p className="text-2xl font-bold text-orange-400">
              {stats.en_attente || 0}
            </p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-cyan-500/20">
            <div className="flex items-center gap-2 text-xs text-cyan-400 mb-1">
              <TrendingUp size={14} /> Ce mois
            </div>
            <p className="text-2xl font-bold text-cyan-400">
              {stats.ce_mois || 0}
            </p>
          </div>
        </div>
      )}

      {/* ONGLETS */}
      <div className="flex items-center gap-2 mb-4 border-b border-white/10">
        <button
          onClick={() => setOngletActif("abonnes")}
          className={`px-4 py-2.5 font-medium text-sm transition border-b-2 ${
            ongletActif === "abonnes"
              ? "border-orange-500 text-orange-400"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <Users size={16} className="inline mr-2" />
          Abonnés ({abonnes.length})
        </button>
        <button
          onClick={() => setOngletActif("envois")}
          className={`px-4 py-2.5 font-medium text-sm transition border-b-2 ${
            ongletActif === "envois"
              ? "border-orange-500 text-orange-400"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <FileText size={16} className="inline mr-2" />
          Envois ({envois.length})
        </button>
      </div>

      {/* ===== ONGLET ABONNÉS ===== */}
      {ongletActif === "abonnes" && (
        <>
          {/* Filtres */}
          <div className="bg-[#112240] rounded-xl p-4 mb-6 border border-white/5">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  placeholder="Rechercher par email ou nom..."
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-orange-500 focus:outline-none transition"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-400" />
                <select
                  value={filtreStatut}
                  onChange={(e) => setFiltreStatut(e.target.value)}
                  className="bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none transition"
                >
                  <option value="tous">Tous les abonnés</option>
                  <option value="confirme">Confirmés</option>
                  <option value="attente">En attente</option>
                  <option value="desabonne">Désabonnés</option>
                </select>
              </div>
            </div>
          </div>

          {/* Erreur */}
          {erreur && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle size={20} />
              <p>{erreur}</p>
            </div>
          )}

          {/* Liste abonnés */}
          {chargement && abonnes.length === 0 ? (
            <div className="text-center py-20">
              <Loader2
                size={40}
                className="animate-spin text-orange-500 mx-auto"
              />
              <p className="text-gray-400 mt-4">Chargement...</p>
            </div>
          ) : abonnes.length === 0 ? (
            <div className="text-center py-20 bg-[#112240] rounded-2xl border border-white/5">
              <Users size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun abonné</h3>
              <p className="text-sm text-gray-400">
                Les inscriptions apparaîtront ici
              </p>
            </div>
          ) : (
            <div className="bg-[#112240] rounded-xl border border-white/5 overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#0A1628] border-b border-white/10">
                  <tr className="text-xs text-gray-400 uppercase">
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3 hidden md:table-cell">Nom</th>
                    <th className="text-left p-3 hidden lg:table-cell">
                      Inscription
                    </th>
                    <th className="text-center p-3">Statut</th>
                    <th className="text-center p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {abonnes.map((abonne) => {
                    const badge = getStatutBadge(abonne);
                    const BadgeIcon = badge.icon;
                    return (
                      <tr
                        key={abonne.id}
                        className="border-b border-white/5 hover:bg-white/[0.02]"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-gray-500" />
                            <span className="text-sm font-medium truncate max-w-[200px]">
                              {abonne.email}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 hidden md:table-cell text-sm text-gray-400">
                          {abonne.nom || "-"}
                        </td>
                        <td className="p-3 hidden lg:table-cell text-xs text-gray-500">
                          {formatDate(abonne.date_inscription)}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${badge.color}`}
                          >
                            <BadgeIcon size={12} />
                            {badge.label}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setModalSupprimer(abonne)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ===== ONGLET ENVOIS ===== */}
      {ongletActif === "envois" && (
        <>
          {envois.length === 0 ? (
            <div className="text-center py-20 bg-[#112240] rounded-2xl border border-white/5">
              <FileText size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Aucune newsletter envoyée
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Créez votre première newsletter pour la voir apparaître ici
              </p>
              <button
                onClick={() => setModalEnvoi(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition"
              >
                <Send size={16} />
                Créer une newsletter
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {envois.map((envoi) => (
                <div
                  key={envoi.id}
                  className="bg-[#112240] rounded-xl p-4 border border-white/5 hover:border-orange-500/30 transition"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-2 line-clamp-1">
                        {envoi.sujet}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} />
                          <span>{formatDate(envoi.date_envoi)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-green-400">
                          <CheckCircle2 size={12} />
                          <span>{envoi.nb_envoyes} envoyés</span>
                        </div>
                        {parseInt(envoi.nb_echecs) > 0 && (
                          <div className="flex items-center gap-1.5 text-red-400">
                            <XCircle size={12} />
                            <span>{envoi.nb_echecs} échecs</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Users size={12} />
                          <span>{envoi.nb_destinataires} destinataires</span>
                        </div>
                        {envoi.auteur_nom && (
                          <span>Par {envoi.auteur_nom}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ===== MODAL ENVOI NEWSLETTER ===== */}
      {modalEnvoi && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => !envoiEnCours && setModalEnvoi(false)}
        >
          <div
            className="bg-[#112240] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-white/10 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#112240] border-b border-white/10 p-5 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <Send size={20} className="text-orange-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Nouvelle newsletter</h2>
                  <p className="text-xs text-gray-400">
                    Sera envoyée à{" "}
                    <strong className="text-green-400">
                      {stats?.actifs || 0} abonnés confirmés
                    </strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalEnvoi(false)}
                disabled={envoiEnCours}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Sujet *
                </label>
                <input
                  type="text"
                  value={sujetNewsletter}
                  onChange={(e) => setSujetNewsletter(e.target.value)}
                  placeholder="Ex: 🎁 Promo spéciale Octobre !"
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Contenu (HTML) *
                </label>
                <textarea
                  value={contenuNewsletter}
                  onChange={(e) => setContenuNewsletter(e.target.value)}
                  rows={15}
                  placeholder="<h2>Titre</h2><p>Votre contenu...</p>"
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-3 px-4 text-white focus:border-orange-500 focus:outline-none transition font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 Le footer avec le lien de désinscription sera ajouté
                  automatiquement.
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-[#112240] border-t border-white/10 p-5 flex gap-3 justify-end">
              <button
                onClick={() => setModalEnvoi(false)}
                disabled={envoiEnCours}
                className="px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={envoyerNewsletter}
                disabled={envoiEnCours}
                className="px-6 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition disabled:opacity-50 flex items-center gap-2"
              >
                {envoiEnCours ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Envoyer à {stats?.actifs || 0} abonnés
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL SUPPRESSION ABONNÉ ===== */}
      {modalSupprimer && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalSupprimer(null)}
        >
          <div
            className="bg-[#112240] rounded-2xl max-w-md w-full border border-red-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <Trash2 size={20} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Supprimer l'abonné</h2>
                <p className="text-xs text-gray-400">
                  {modalSupprimer.email}
                </p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-300">
                Cette action est irréversible. L'abonné sera définitivement
                supprimé de la liste.
              </p>
            </div>
            <div className="p-5 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setModalSupprimer(null)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition font-medium"
              >
                Annuler
              </button>
              <button
                onClick={supprimerAbonne}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}