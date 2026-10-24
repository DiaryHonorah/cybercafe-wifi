import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  Gift,
  Search,
  User,
  Phone,
  Mail,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
  Minus,
  Eye,
  X,
  Trophy,
  Star,
  Zap,
  TrendingUp,
  AlertCircle,
  Power,
  Trash2,
  History,
  Coins,
} from "lucide-react";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function Fidelite() {
  const navigate = useNavigate();
  const [cartes, setCartes] = useState([]);
  const [stats, setStats] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [filtreNiveau, setFiltreNiveau] = useState("tous");
  const [recherche, setRecherche] = useState("");
  const [detailModal, setDetailModal] = useState(null);
  const [historiqueModal, setHistoriqueModal] = useState(null);
  const [modalAjouterPoints, setModalAjouterPoints] = useState(null);
  const [modalRecompense, setModalRecompense] = useState(null);
  const [pointsASaisir, setPointsASaisir] = useState("");
  const [raisonPoints, setRaisonPoints] = useState("");
  const [recompenses, setRecompenses] = useState([]);

  // ===== TOKEN =====
  const getToken = () => {
    return (
      localStorage.getItem("admin_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("auth_token") ||
      ""
    );
  };

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
      const statsRes = await fetchAvecToken(`${API_URL}/fidelite/stats`);
      if (statsRes.status === 401) {
        navigate("/login");
        return;
      }
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.stats);

      // Liste
      const params = new URLSearchParams();
      if (filtreNiveau !== "tous") params.append("niveau", filtreNiveau);
      if (recherche.trim()) params.append("recherche", recherche.trim());

      const listeRes = await fetchAvecToken(
        `${API_URL}/fidelite?${params.toString()}`
      );
      const listeData = await listeRes.json();
      if (listeData.success) setCartes(listeData.cartes || []);

      // Récompenses
      const rRes = await fetch(`${API_URL}/fidelite/recompenses`);
      const rData = await rRes.json();
      if (rData.success) setRecompenses(rData.recompenses || []);
    } catch (err) {
      console.error("Erreur:", err);
      setErreur("Impossible de contacter le serveur");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, [filtreNiveau]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (recherche.length === 0 || recherche.length >= 2) {
        chargerDonnees();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [recherche]);

  // ===== ACTIONS =====
  const ajouterPoints = async () => {
    const points = parseInt(pointsASaisir);
    if (!points || points <= 0) {
      alert("Veuillez saisir un nombre positif");
      return;
    }

    try {
      const res = await fetchAvecToken(
        `${API_URL}/fidelite/ajouter-points`,
        {
          method: "POST",
          body: JSON.stringify({
            carte_id: modalAjouterPoints.id,
            points,
            raison: raisonPoints || "Ajout manuel",
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setModalAjouterPoints(null);
        setPointsASaisir("");
        setRaisonPoints("");
        chargerDonnees();
      } else {
        alert(data.message || "Erreur");
      }
    } catch (err) {
      alert("Erreur serveur");
    }
  };

  const utiliserRecompense = async (recompenseId) => {
    try {
      const res = await fetchAvecToken(
        `${API_URL}/fidelite/utiliser-recompense`,
        {
          method: "POST",
          body: JSON.stringify({
            carte_id: modalRecompense.id,
            recompense_id: recompenseId,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setModalRecompense(null);
        chargerDonnees();
      } else {
        alert(data.message || "Erreur");
      }
    } catch (err) {
      alert("Erreur serveur");
    }
  };

  const toggleActif = async (id) => {
    if (!confirm("Changer le statut de cette carte ?")) return;
    try {
      const res = await fetchAvecToken(`${API_URL}/fidelite/toggle-actif`, {
        method: "POST",
        body: JSON.stringify({ carte_id: id }),
      });
      const data = await res.json();
      if (data.success) chargerDonnees();
    } catch (err) {
      alert("Erreur");
    }
  };

  const supprimer = async (id) => {
    if (!confirm("Supprimer définitivement cette carte ?")) return;
    try {
      const res = await fetchAvecToken(`${API_URL}/fidelite/supprimer`, {
        method: "POST",
        body: JSON.stringify({ carte_id: id }),
      });
      const data = await res.json();
      if (data.success) {
        setDetailModal(null);
        chargerDonnees();
      }
    } catch (err) {
      alert("Erreur");
    }
  };

  const chargerHistorique = async (carteId) => {
    try {
      const res = await fetchAvecToken(
        `${API_URL}/fidelite/historique?carte_id=${carteId}`
      );
      const data = await res.json();
      if (data.success) {
        setHistoriqueModal({
          carte: cartes.find((c) => c.id === carteId),
          historique: data.historique || [],
        });
      }
    } catch (err) {
      alert("Erreur");
    }
  };

  // ===== HELPERS =====
  const getNiveauBadge = (niveau) => {
    const badges = {
      bronze: {
        label: "Bronze",
        icone: "🥉",
        color: "bg-[#CD7F32]/10 text-[#CD7F32] border-[#CD7F32]/30",
        gradient: "from-[#CD7F32] to-[#A0522D]",
      },
      argent: {
        label: "Argent",
        icone: "🥈",
        color: "bg-[#C0C0C0]/10 text-[#C0C0C0] border-[#C0C0C0]/30",
        gradient: "from-[#C0C0C0] to-[#A9A9A9]",
      },
      or: {
        label: "Or",
        icone: "🥇",
        color: "bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30",
        gradient: "from-[#FFD700] to-[#FFA500]",
      },
      platine: {
        label: "Platine",
        icone: "💎",
        color: "bg-[#E5E4E2]/10 text-[#E5E4E2] border-[#E5E4E2]/30",
        gradient: "from-[#E5E4E2] to-[#B0C4DE]",
      },
    };
    return badges[niveau] || badges.bronze;
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
              <Award size={24} className="text-white" />
            </div>
            Cartes de fidélité
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Gérez les cartes et les points de vos clients
          </p>
        </div>

        <button
          onClick={chargerDonnees}
          disabled={chargement}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition disabled:opacity-50"
        >
          <RefreshCw size={16} className={chargement ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {/* STATS */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-[#112240] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <Award size={14} /> Total cartes
            </div>
            <p className="text-2xl font-bold">{stats.total || 0}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-green-500/20">
            <div className="flex items-center gap-2 text-xs text-green-400 mb-1">
              <CheckCircle2 size={14} /> Actives
            </div>
            <p className="text-2xl font-bold text-green-400">
              {stats.actifs || 0}
            </p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-cyan-500/20">
            <div className="flex items-center gap-2 text-xs text-cyan-400 mb-1">
              <Coins size={14} /> Points dispo
            </div>
            <p className="text-2xl font-bold text-cyan-400">
              {parseInt(stats.total_points_disponibles || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-yellow-500/20">
            <div className="flex items-center gap-2 text-xs text-yellow-400 mb-1">
              <TrendingUp size={14} /> Points distribués
            </div>
            <p className="text-2xl font-bold text-yellow-400">
              {parseInt(stats.total_points_distribues || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-orange-500/20">
            <div className="flex items-center gap-2 text-xs text-orange-400 mb-1">
              <Gift size={14} /> Points utilisés
            </div>
            <p className="text-2xl font-bold text-orange-400">
              {parseInt(stats.total_points_utilises || 0).toLocaleString()}
            </p>
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
              placeholder="Rechercher par nom, téléphone ou code..."
              className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-orange-500 focus:outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-gray-400" />
            <select
              value={filtreNiveau}
              onChange={(e) => setFiltreNiveau(e.target.value)}
              className="bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none transition"
            >
              <option value="tous">Tous les niveaux</option>
              <option value="bronze">🥉 Bronze</option>
              <option value="argent">🥈 Argent</option>
              <option value="or">🥇 Or</option>
              <option value="platine">💎 Platine</option>
            </select>
          </div>
        </div>
      </div>

      {/* ERREUR */}
      {erreur && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} />
          <p>{erreur}</p>
        </div>
      )}

      {/* CHARGEMENT / LISTE */}
      {chargement && cartes.length === 0 ? (
        <div className="text-center py-20">
          <Loader2 size={40} className="animate-spin text-orange-500 mx-auto" />
          <p className="text-gray-400 mt-4">Chargement des cartes...</p>
        </div>
      ) : cartes.length === 0 ? (
        <div className="text-center py-20 bg-[#112240] rounded-2xl border border-white/5">
          <Award size={48} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune carte</h3>
          <p className="text-sm text-gray-400">
            {recherche || filtreNiveau !== "tous"
              ? "Aucun résultat pour vos filtres"
              : "Les cartes créées par les clients apparaîtront ici"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {cartes.map((carte) => {
            const badge = getNiveauBadge(carte.niveau);
            return (
              <div
                key={carte.id}
                className={`bg-[#112240] rounded-xl p-4 border transition ${
                  carte.actif
                    ? "border-white/5 hover:border-orange-500/30"
                    : "border-red-500/30 opacity-60"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Niveau + Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-2xl">{badge.icone}</span>
                      <span className="font-mono font-bold text-orange-400 text-lg">
                        {carte.code_carte}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                      {!carte.actif && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/30">
                          Désactivée
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <User size={14} className="text-gray-500 flex-shrink-0" />
                        <span className="truncate">{carte.client_nom}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Phone
                          size={14}
                          className="text-gray-500 flex-shrink-0"
                        />
                        <span>{carte.client_telephone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Coins size={14} className="text-cyan-400 flex-shrink-0" />
                        <span className="font-bold text-cyan-400">
                          {carte.points_disponibles.toLocaleString()}
                        </span>
                        <span className="text-gray-500 text-xs">points</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setDetailModal(carte)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition"
                      title="Voir détails"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => chargerHistorique(carte.id)}
                      className="p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 transition"
                      title="Historique"
                    >
                      <History size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setModalAjouterPoints(carte);
                        setPointsASaisir("");
                        setRaisonPoints("");
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-sm font-medium transition"
                      title="Ajouter points"
                    >
                      <Plus size={16} />
                      <span className="hidden md:inline">Points</span>
                    </button>
                    <button
                      onClick={() => setModalRecompense(carte)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-sm font-medium transition"
                      title="Utiliser récompense"
                    >
                      <Gift size={16} />
                      <span className="hidden md:inline">Récompense</span>
                    </button>
                    <button
                      onClick={() => toggleActif(carte.id)}
                      className={`p-2 rounded-lg transition ${
                        carte.actif
                          ? "bg-orange-500/10 hover:bg-orange-500/20 text-orange-400"
                          : "bg-green-500/10 hover:bg-green-500/20 text-green-400"
                      }`}
                      title={carte.actif ? "Désactiver" : "Activer"}
                    >
                      <Power size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== MODAL DÉTAIL ===== */}
      {detailModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setDetailModal(null)}
        >
          <div
            className="bg-[#112240] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#112240] border-b border-white/10 p-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{detailModal.client_nom}</h2>
                <p className="text-sm font-mono text-orange-400 mt-1">
                  {detailModal.code_carte}
                </p>
              </div>
              <button
                onClick={() => setDetailModal(null)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Niveau */}
              <div className="flex justify-center">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium border flex items-center gap-2 ${
                    getNiveauBadge(detailModal.niveau).color
                  }`}
                >
                  <span className="text-xl">
                    {getNiveauBadge(detailModal.niveau).icone}
                  </span>
                  {getNiveauBadge(detailModal.niveau).label}
                </span>
              </div>

              {/* Infos contact */}
              <div className="bg-[#0A1628] rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Client
                </h3>
                <div className="flex items-center gap-3 text-sm">
                  <Phone size={16} className="text-orange-400 flex-shrink-0" />
                  <a
                    href={`tel:${detailModal.client_telephone}`}
                    className="hover:text-orange-400 transition"
                  >
                    {detailModal.client_telephone}
                  </a>
                </div>
                {detailModal.client_email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail size={16} className="text-orange-400 flex-shrink-0" />
                    <a
                      href={`mailto:${detailModal.client_email}`}
                      className="hover:text-orange-400 transition"
                    >
                      {detailModal.client_email}
                    </a>
                  </div>
                )}
              </div>

              {/* Points */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#0A1628] rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Total</p>
                  <p className="text-xl font-bold">
                    {detailModal.points_total.toLocaleString()}
                  </p>
                </div>
                <div className="bg-[#0A1628] rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Utilisés</p>
                  <p className="text-xl font-bold text-orange-400">
                    {detailModal.points_utilises.toLocaleString()}
                  </p>
                </div>
                <div className="bg-[#0A1628] rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Disponibles</p>
                  <p className="text-xl font-bold text-cyan-400">
                    {detailModal.points_disponibles.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Progression */}
              {detailModal.prochain_niveau && (
                <div className="bg-[#0A1628] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="text-gray-400">
                      Vers {getNiveauBadge(detailModal.prochain_niveau).label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {detailModal.points_manquants} points restants
                    </span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                      style={{ width: `${detailModal.progression}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Méta */}
              <div className="bg-[#0A1628] rounded-xl p-4 text-xs text-gray-500 space-y-1">
                <p>Créée le : {formatDate(detailModal.date_creation)}</p>
                {detailModal.date_derniere_utilisation && (
                  <p>
                    Dernière activité :{" "}
                    {formatDate(detailModal.date_derniere_utilisation)}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setModalAjouterPoints(detailModal);
                    setPointsASaisir("");
                    setRaisonPoints("");
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition"
                >
                  <Plus size={16} />
                  Ajouter points
                </button>
                <button
                  onClick={() => supprimer(detailModal.id)}
                  className="px-4 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL AJOUTER POINTS ===== */}
      {modalAjouterPoints && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalAjouterPoints(null)}
        >
          <div
            className="bg-[#112240] rounded-2xl max-w-md w-full border border-green-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Plus size={20} className="text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Ajouter des points</h2>
                <p className="text-xs text-gray-400">
                  {modalAjouterPoints.client_nom} ({modalAjouterPoints.code_carte})
                </p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Points à ajouter *
                </label>
                <input
                  type="number"
                  value={pointsASaisir}
                  onChange={(e) => setPointsASaisir(e.target.value)}
                  min="1"
                  placeholder="Ex: 500"
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-3 px-4 text-white focus:border-green-500 focus:outline-none transition text-2xl font-bold text-center"
                />
                <div className="flex gap-2 mt-2">
                  {[100, 500, 1000, 2000].map((n) => (
                    <button
                      key={n}
                      onClick={() => setPointsASaisir(n.toString())}
                      className="flex-1 px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 text-xs transition"
                    >
                      +{n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Raison
                </label>
                <input
                  type="text"
                  value={raisonPoints}
                  onChange={(e) => setRaisonPoints(e.target.value)}
                  placeholder="Ex: Achat forfait 2h"
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-green-500 focus:outline-none transition"
                />
              </div>
            </div>

            <div className="p-5 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setModalAjouterPoints(null)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition font-medium"
              >
                Annuler
              </button>
              <button
                onClick={ajouterPoints}
                className="flex-1 px-4 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL RÉCOMPENSE ===== */}
      {modalRecompense && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalRecompense(null)}
        >
          <div
            className="bg-[#112240] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-yellow-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#112240] border-b border-white/10 p-5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Gift size={20} className="text-yellow-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold">Utiliser une récompense</h2>
                <p className="text-xs text-gray-400">
                  {modalRecompense.client_nom} ·{" "}
                  {modalRecompense.points_disponibles.toLocaleString()} points
                  dispo
                </p>
              </div>
              <button
                onClick={() => setModalRecompense(null)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-2">
              {recompenses.map((r) => {
                const debloquee =
                  modalRecompense.points_disponibles >= parseInt(r.points_requis);
                const manque = Math.max(
                  0,
                  parseInt(r.points_requis) - modalRecompense.points_disponibles
                );

                return (
                  <div
                    key={r.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      debloquee
                        ? "bg-yellow-500/10 border-yellow-500/30"
                        : "bg-white/5 border-white/10 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Star
                        size={18}
                        className={
                          debloquee ? "text-yellow-400" : "text-gray-500"
                        }
                      />
                      <div>
                        <p className="font-medium text-sm">{r.nom}</p>
                        <p className="text-xs text-gray-400">
                          {parseInt(r.points_requis).toLocaleString()} points
                        </p>
                      </div>
                    </div>
                    {debloquee ? (
                      <button
                        onClick={() => utiliserRecompense(r.id)}
                        className="px-3 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium transition"
                      >
                        Utiliser
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500">
                        Manque {manque}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL HISTORIQUE ===== */}
      {historiqueModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setHistoriqueModal(null)}
        >
          <div
            className="bg-[#112240] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-purple-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#112240] border-b border-white/10 p-5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <History size={20} className="text-purple-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold">Historique</h2>
                <p className="text-xs text-gray-400">
                  {historiqueModal.carte?.client_nom}
                </p>
              </div>
              <button
                onClick={() => setHistoriqueModal(null)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              {historiqueModal.historique.length === 0 ? (
                <p className="text-center text-gray-400 py-8">
                  Aucun mouvement
                </p>
              ) : (
                <div className="space-y-2">
                  {historiqueModal.historique.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                    >
                      <div>
                        <p className="text-sm">{h.raison || h.type}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(h.created_at)}
                        </p>
                      </div>
                      <span
                        className={`font-bold ${
                          parseInt(h.points) > 0
                            ? "text-green-400"
                            : "text-orange-400"
                        }`}
                      >
                        {parseInt(h.points) > 0 ? "+" : ""}
                        {h.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}