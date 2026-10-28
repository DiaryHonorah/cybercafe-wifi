import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Crown,
  Search,
  Filter,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  Ban,
  Gift,
  Plus,
  X,
  Save,
} from "lucide-react";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function Vip() {
  const navigate = useNavigate();
  const [abonnements, setAbonnements] = useState([]);
  const [stats, setStats] = useState(null);
  const [config, setConfig] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [modalAnnuler, setModalAnnuler] = useState(null);
  const [modalActiver, setModalActiver] = useState(false);
  const [clientIdActiver, setClientIdActiver] = useState("");

  const getToken = () =>
    localStorage.getItem("admin_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token");

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

  const chargerDonnees = async () => {
    setChargement(true);
    setErreur(null);

    try {
      const params = new URLSearchParams();
      if (filtreStatut !== "tous") params.append("statut", filtreStatut);
      if (recherche.trim()) params.append("recherche", recherche.trim());

      const res = await fetchAvecToken(
        `${API_URL}/vip/admin/liste?${params.toString()}`
      );
      if (res.status === 401) {
        navigate("/login");
        return;
      }
      const data = await res.json();

      if (data.success) {
        setAbonnements(data.abonnements || []);
        setStats(data.stats);
        setConfig(data.config);
      } else {
        setErreur(data.message);
      }
    } catch (err) {
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

  const annuler = async () => {
    if (!modalAnnuler) return;

    try {
      const res = await fetchAvecToken(`${API_URL}/vip/admin/annuler`, {
        method: "POST",
        body: JSON.stringify({ id: modalAnnuler.id }),
      });
      const data = await res.json();

      if (data.success) {
        setModalAnnuler(null);
        chargerDonnees();
      }
    } catch (err) {
      alert("Erreur");
    }
  };

  const activerManuellement = async () => {
    const clientId = parseInt(clientIdActiver);
    if (!clientId || clientId <= 0) {
      alert("ID client invalide");
      return;
    }

    try {
      const res = await fetchAvecToken(`${API_URL}/vip/admin/activer`, {
        method: "POST",
        body: JSON.stringify({ client_id: clientId }),
      });
      const data = await res.json();

      if (data.success) {
        alert(data.message);
        setModalActiver(false);
        setClientIdActiver("");
        chargerDonnees();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Erreur");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatutBadge = (statut, dateFin) => {
    const maintenant = new Date();
    const fin = new Date(dateFin);

    if (statut === "annule") {
      return {
        label: "Annulé",
        color: "bg-gray-500/10 text-gray-400 border-gray-500/30",
      };
    }

    if (fin < maintenant) {
      return {
        label: "Expiré",
        color: "bg-red-500/10 text-red-400 border-red-500/30",
      };
    }

    return {
      label: "Actif",
      color: "bg-green-500/10 text-green-400 border-green-500/30",
    };
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#DC2626]">
              <Crown size={24} className="text-white" />
            </div>
            Programme VIP
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Gérez les abonnements VIP de vos clients
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setModalActiver(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-white font-medium transition"
          >
            <Plus size={16} />
            Activer VIP manuellement
          </button>
          <button
            onClick={chargerDonnees}
            disabled={chargement}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition disabled:opacity-50"
          >
            <RefreshCw size={16} className={chargement ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>
      </div>

      {/* STATS */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-[#112240] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <Users size={14} /> Total abonnements
            </div>
            <p className="text-2xl font-bold">{stats.total_abonnements || 0}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-green-500/20">
            <div className="flex items-center gap-2 text-xs text-green-400 mb-1">
              <CheckCircle2 size={14} /> Actifs
            </div>
            <p className="text-2xl font-bold text-green-400">
              {stats.abonnes_actifs || 0}
            </p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-red-500/20">
            <div className="flex items-center gap-2 text-xs text-red-400 mb-1">
              <XCircle size={14} /> Expirés
            </div>
            <p className="text-2xl font-bold text-red-400">
              {stats.abonnes_expires || 0}
            </p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-cyan-500/20">
            <div className="flex items-center gap-2 text-xs text-cyan-400 mb-1">
              <DollarSign size={14} /> Revenus mensuels
            </div>
            <p className="text-lg font-bold text-cyan-400">
              {parseFloat(stats.revenus_mensuels || 0).toLocaleString("fr-FR")} Ar
            </p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-yellow-500/20">
            <div className="flex items-center gap-2 text-xs text-yellow-400 mb-1">
              <TrendingUp size={14} /> Revenus total
            </div>
            <p className="text-lg font-bold text-yellow-400">
              {parseFloat(stats.revenus_total || 0).toLocaleString("fr-FR")} Ar
            </p>
          </div>
        </div>
      )}

      {/* CONFIG INFO */}
      {config && (
        <div className="bg-gradient-to-r from-[#F59E0B]/10 to-[#DC2626]/10 border border-orange-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-medium">
              💎 Prix : {parseFloat(config.prix_mensuel).toLocaleString("fr-FR")} Ar/mois
            </span>
            <span className="text-sm text-gray-400">
              🖨️ {config.impressions_limite} impressions/mois
            </span>
            <span className="text-sm text-gray-400">
              💰 -{config.reduction_services}% sur services
            </span>
          </div>
        </div>
      )}

      {/* FILTRES */}
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
              placeholder="Rechercher par nom, email ou téléphone..."
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
              <option value="tous">Tous les statuts</option>
              <option value="actif">Actifs</option>
              <option value="expire">Expirés</option>
              <option value="annule">Annulés</option>
            </select>
          </div>
        </div>
      </div>

      {erreur && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} />
          <p>{erreur}</p>
        </div>
      )}

      {/* LISTE */}
      {chargement && abonnements.length === 0 ? (
        <div className="text-center py-20">
          <Loader2 size={40} className="animate-spin text-orange-500 mx-auto" />
          <p className="text-gray-400 mt-4">Chargement...</p>
        </div>
      ) : abonnements.length === 0 ? (
        <div className="text-center py-20 bg-[#112240] rounded-2xl border border-white/5">
          <Crown size={48} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun abonnement VIP</h3>
          <p className="text-sm text-gray-400">
            Les abonnements VIP apparaîtront ici
          </p>
        </div>
      ) : (
        <div className="bg-[#112240] rounded-xl border border-white/5 overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0A1628] border-b border-white/10">
              <tr className="text-xs text-gray-400 uppercase">
                <th className="text-left p-3">Client</th>
                <th className="text-left p-3 hidden md:table-cell">Période</th>
                <th className="text-left p-3 hidden lg:table-cell">Impressions</th>
                <th className="text-left p-3 hidden lg:table-cell">Montant</th>
                <th className="text-center p-3">Statut</th>
                <th className="text-center p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {abonnements.map((a) => {
                const badge = getStatutBadge(a.statut, a.date_fin);
                return (
                  <tr
                    key={a.id}
                    className="border-b border-white/5 hover:bg-white/[0.02]"
                  >
                    <td className="p-3">
                      <p className="text-sm font-medium">{a.client_nom}</p>
                      <p className="text-xs text-gray-500">{a.client_email}</p>
                      <p className="text-xs text-gray-500">{a.client_telephone}</p>
                    </td>
                    <td className="p-3 hidden md:table-cell text-sm">
                      {formatDate(a.date_debut)} → {formatDate(a.date_fin)}
                    </td>
                    <td className="p-3 hidden lg:table-cell text-sm">
                      {a.impressions_utilisees} / {a.impressions_limite}
                    </td>
                    <td className="p-3 hidden lg:table-cell text-sm font-bold text-[#67E8F9]">
                      {parseFloat(a.montant_paye).toLocaleString("fr-FR")} Ar
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {badge.label === "Actif" && (
                        <button
                          onClick={() => setModalAnnuler(a)}
                          className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                          title="Annuler"
                        >
                          <Ban size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== MODAL ANNULATION ===== */}
      {modalAnnuler && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalAnnuler(null)}
        >
          <div
            className="bg-[#112240] rounded-2xl max-w-md w-full border border-red-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <Ban size={20} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Annuler l'abonnement</h2>
                <p className="text-xs text-gray-400">{modalAnnuler.client_nom}</p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-300">
                L'abonnement VIP sera annulé immédiatement. Le client perdra ses
                avantages.
              </p>
            </div>
            <div className="p-5 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setModalAnnuler(null)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition font-medium"
              >
                Annuler
              </button>
              <button
                onClick={annuler}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL ACTIVER MANUELLEMENT ===== */}
      {modalActiver && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalActiver(false)}
        >
          <div
            className="bg-[#112240] rounded-2xl max-w-md w-full border border-orange-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Gift size={20} className="text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Activer VIP gratuitement</h2>
                <p className="text-xs text-gray-400">Offrir 30 jours de VIP</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  ID du client *
                </label>
                <input
                  type="number"
                  value={clientIdActiver}
                  onChange={(e) => setClientIdActiver(e.target.value)}
                  placeholder="Ex: 5"
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-3 px-4 text-white focus:border-orange-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Trouvez l'ID dans la page Clients de l'admin
                </p>
              </div>
            </div>
            <div className="p-5 border-t border-white/10 flex gap-3">
              <button
                onClick={() => {
                  setModalActiver(false);
                  setClientIdActiver("");
                }}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition font-medium"
              >
                Annuler
              </button>
              <button
                onClick={activerManuellement}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-white font-medium transition flex items-center justify-center gap-2"
              >
                <Gift size={16} />
                Activer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}