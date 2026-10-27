import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Tag,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Power,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  Percent,
  DollarSign,
  Users,
  Copy,
  Check,
  X,
  Save,
  BarChart3,
  History,
  Eye,
} from "lucide-react";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function Promotions() {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);
  const [stats, setStats] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [modalEdition, setModalEdition] = useState(null);
  const [modalSupprimer, setModalSupprimer] = useState(null);
  const [modalUtilisations, setModalUtilisations] = useState(null);
  const [utilisations, setUtilisations] = useState([]);
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);
  const [copieCode, setCopieCode] = useState(null);

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
        `${API_URL}/promotions/admin/liste?${params.toString()}`
      );
      if (res.status === 401) {
        navigate("/login");
        return;
      }
      const data = await res.json();

      if (data.success) {
        setPromotions(data.promotions || []);
        setStats(data.stats);
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

  const nouvellePromotion = () => {
    const now = new Date();
    const debut = new Date(now);
    const fin = new Date(now);
    fin.setDate(fin.getDate() + 30);

    setModalEdition({
      id: null,
      code: "",
      description: "",
      type: "pourcentage",
      valeur: 10,
      montant_min: 0,
      date_debut: debut.toISOString().slice(0, 16),
      date_fin: fin.toISOString().slice(0, 16),
      max_utilisations: "",
      max_par_client: 1,
      services_applicables: "tous",
      actif: true,
    });
  };

  const editerPromotion = (promo) => {
    setModalEdition({
      id: promo.id,
      code: promo.code,
      description: promo.description || "",
      type: promo.type,
      valeur: parseFloat(promo.valeur),
      montant_min: parseFloat(promo.montant_min || 0),
      date_debut: new Date(promo.date_debut).toISOString().slice(0, 16),
      date_fin: new Date(promo.date_fin).toISOString().slice(0, 16),
      max_utilisations: promo.max_utilisations || "",
      max_par_client: parseInt(promo.max_par_client || 1),
      services_applicables: promo.services_applicables || "tous",
      actif: promo.actif == 1,
    });
  };

  const sauvegarder = async () => {
    setSauvegardeEnCours(true);

    try {
      const url = modalEdition.id
        ? `${API_URL}/promotions/admin/modifier`
        : `${API_URL}/promotions/admin/creer`;

      const res = await fetchAvecToken(url, {
        method: "POST",
        body: JSON.stringify(modalEdition),
      });

      const data = await res.json();

      if (data.success) {
        setModalEdition(null);
        chargerDonnees();
      } else {
        alert(data.message || "Erreur");
      }
    } catch (err) {
      alert("Erreur serveur");
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const supprimer = async () => {
    if (!modalSupprimer) return;

    try {
      const res = await fetchAvecToken(
        `${API_URL}/promotions/admin/supprimer`,
        {
          method: "POST",
          body: JSON.stringify({ id: modalSupprimer.id }),
        }
      );
      const data = await res.json();

      if (data.success) {
        setModalSupprimer(null);
        chargerDonnees();
      }
    } catch (err) {
      alert("Erreur");
    }
  };

  const toggleActif = async (promo) => {
    try {
      const res = await fetchAvecToken(`${API_URL}/promotions/admin/toggle`, {
        method: "POST",
        body: JSON.stringify({ id: promo.id }),
      });
      const data = await res.json();
      if (data.success) chargerDonnees();
    } catch (err) {
      alert("Erreur");
    }
  };

  const voirUtilisations = async (promo) => {
    setModalUtilisations(promo);
    setUtilisations([]);

    try {
      const res = await fetchAvecToken(
        `${API_URL}/promotions/admin/utilisations?promotion_id=${promo.id}`
      );
      const data = await res.json();
      if (data.success) setUtilisations(data.utilisations || []);
    } catch (err) {
      console.error(err);
    }
  };

  const copierCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopieCode(code);
      setTimeout(() => setCopieCode(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // ===== HELPERS =====
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatPrix = (n) => Number(n).toLocaleString("fr-FR");

  const getStatutBadge = (promo) => {
    const now = new Date();
    const debut = new Date(promo.date_debut);
    const fin = new Date(promo.date_fin);

    if (!promo.actif) {
      return { label: "Désactivée", color: "bg-gray-500/10 text-gray-400 border-gray-500/30", icon: XCircle };
    }
    if (now < debut) {
      return { label: "Planifiée", color: "bg-blue-500/10 text-blue-400 border-blue-500/30", icon: Clock };
    }
    if (now > fin) {
      return { label: "Expirée", color: "bg-red-500/10 text-red-400 border-red-500/30", icon: XCircle };
    }
    if (promo.max_utilisations && promo.nb_utilisations >= promo.max_utilisations) {
      return { label: "Épuisée", color: "bg-orange-500/10 text-orange-400 border-orange-500/30", icon: AlertCircle };
    }
    return { label: "Active", color: "bg-green-500/10 text-green-400 border-green-500/30", icon: CheckCircle2 };
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
              <Tag size={24} className="text-white" />
            </div>
            Codes promo
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Créez et gérez vos codes de réduction
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
            onClick={nouvellePromotion}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition"
          >
            <Plus size={16} />
            Nouveau code
          </button>
        </div>
      </div>

      {/* STATS */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-[#112240] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <Tag size={14} /> Total
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-green-500/20">
            <div className="flex items-center gap-2 text-xs text-green-400 mb-1">
              <CheckCircle2 size={14} /> Actives
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.actives}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-red-500/20">
            <div className="flex items-center gap-2 text-xs text-red-400 mb-1">
              <XCircle size={14} /> Expirées
            </div>
            <p className="text-2xl font-bold text-red-400">{stats.expirees}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-cyan-500/20">
            <div className="flex items-center gap-2 text-xs text-cyan-400 mb-1">
              <BarChart3 size={14} /> Utilisations
            </div>
            <p className="text-2xl font-bold text-cyan-400">{stats.total_utilisations}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-orange-500/20">
            <div className="flex items-center gap-2 text-xs text-orange-400 mb-1">
              <TrendingDown size={14} /> Économisé
            </div>
            <p className="text-lg font-bold text-orange-400">
              {formatPrix(stats.total_economise)} Ar
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
              placeholder="Rechercher un code..."
              className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-orange-500 focus:outline-none transition"
            />
          </div>
          <select
            value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value)}
            className="bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none"
          >
            <option value="tous">Tous les codes</option>
            <option value="actives">Actifs</option>
            <option value="planifiees">Planifiés</option>
            <option value="expirees">Expirés</option>
          </select>
        </div>
      </div>

      {erreur && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} />
          <p>{erreur}</p>
        </div>
      )}

      {/* LISTE */}
      {chargement && promotions.length === 0 ? (
        <div className="text-center py-20">
          <Loader2 size={40} className="animate-spin text-orange-500 mx-auto" />
          <p className="text-gray-400 mt-4">Chargement...</p>
        </div>
      ) : promotions.length === 0 ? (
        <div className="text-center py-20 bg-[#112240] rounded-2xl border border-white/5">
          <Tag size={48} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun code promo</h3>
          <p className="text-sm text-gray-400 mb-4">
            Créez votre premier code pour booster vos ventes
          </p>
          <button
            onClick={nouvellePromotion}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition"
          >
            <Plus size={16} />
            Créer un code
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {promotions.map((promo) => {
            const badge = getStatutBadge(promo);
            const BadgeIcon = badge.icon;
            const reductionLabel = promo.type === "pourcentage"
              ? `-${parseFloat(promo.valeur)}%`
              : `-${formatPrix(promo.valeur)} Ar`;

            return (
              <div
                key={promo.id}
                className="bg-[#112240] rounded-xl p-4 border border-white/5 hover:border-orange-500/30 transition relative overflow-hidden"
              >
                {/* Décoration */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl" />

                <div className="relative">
                  {/* Header code */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          onClick={() => copierCode(promo.code)}
                          className="font-mono font-bold text-orange-400 text-lg hover:text-orange-300 transition flex items-center gap-1"
                          title="Copier le code"
                        >
                          {promo.code}
                          {copieCode === promo.code ? (
                            <Check size={12} className="text-green-400" />
                          ) : (
                            <Copy size={12} className="opacity-0 group-hover:opacity-100" />
                          )}
                        </button>
                      </div>
                      {promo.description && (
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {promo.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 flex-shrink-0 ${badge.color}`}
                    >
                      <BadgeIcon size={10} />
                      {badge.label}
                    </span>
                  </div>

                  {/* Réduction */}
                  <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-lg p-3 mb-3 text-center">
                    <p className="text-2xl font-bold text-orange-400">
                      {reductionLabel}
                    </p>
                    {parseFloat(promo.montant_min) > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        min. {formatPrix(promo.montant_min)} Ar
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div className="bg-[#0A1628] rounded p-2 text-center">
                      <p className="text-gray-500 mb-0.5">Utilisations</p>
                      <p className="font-bold">
                        {promo.utilisations_reelles || 0}
                        {promo.max_utilisations && ` / ${promo.max_utilisations}`}
                      </p>
                    </div>
                    <div className="bg-[#0A1628] rounded p-2 text-center">
                      <p className="text-gray-500 mb-0.5">Économisé</p>
                      <p className="font-bold text-orange-400">
                        {formatPrix(promo.total_economise || 0)} Ar
                      </p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar size={10} />
                      <span>{formatDate(promo.date_debut)}</span>
                    </div>
                    <span>→</span>
                    <div className="flex items-center gap-1">
                      <Calendar size={10} />
                      <span>{formatDate(promo.date_fin)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 pt-3 border-t border-white/5">
                    <button
                      onClick={() => voirUtilisations(promo)}
                      className="p-1.5 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 transition"
                      title="Voir les utilisations"
                    >
                      <History size={14} />
                    </button>
                    <button
                      onClick={() => editerPromotion(promo)}
                      className="p-1.5 rounded bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 transition"
                      title="Modifier"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => toggleActif(promo)}
                      className={`p-1.5 rounded transition ${
                        promo.actif
                          ? "bg-green-500/10 hover:bg-green-500/20 text-green-400"
                          : "bg-gray-500/10 hover:bg-gray-500/20 text-gray-400"
                      }`}
                      title={promo.actif ? "Désactiver" : "Activer"}
                    >
                      <Power size={14} />
                    </button>
                    <button
                      onClick={() => setModalSupprimer(promo)}
                      className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition ml-auto"
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== MODAL ÉDITION ===== */}
      {modalEdition && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => !sauvegardeEnCours && setModalEdition(null)}
        >
          <div
            className="bg-[#112240] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#112240] border-b border-white/10 p-5 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <Tag size={20} className="text-orange-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    {modalEdition.id ? "Modifier le code" : "Nouveau code promo"}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setModalEdition(null)}
                disabled={sauvegardeEnCours}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Code promo *
                </label>
                <input
                  type="text"
                  value={modalEdition.code}
                  onChange={(e) =>
                    setModalEdition({
                      ...modalEdition,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  disabled={!!modalEdition.id}
                  placeholder="EX: STARLINK10"
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white font-mono uppercase focus:border-orange-500 focus:outline-none disabled:opacity-50"
                  maxLength={50}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={modalEdition.description}
                  onChange={(e) =>
                    setModalEdition({
                      ...modalEdition,
                      description: e.target.value,
                    })
                  }
                  placeholder="Ex: -10% sur toutes les réservations"
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Type + Valeur */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Type *
                  </label>
                  <select
                    value={modalEdition.type}
                    onChange={(e) =>
                      setModalEdition({
                        ...modalEdition,
                        type: e.target.value,
                      })
                    }
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="pourcentage">Pourcentage (%)</option>
                    <option value="montant_fixe">Montant fixe (Ar)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Valeur *
                  </label>
                  <input
                    type="number"
                    value={modalEdition.valeur}
                    onChange={(e) =>
                      setModalEdition({
                        ...modalEdition,
                        valeur: parseFloat(e.target.value) || 0,
                      })
                    }
                    min="0"
                    max={modalEdition.type === "pourcentage" ? 100 : undefined}
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Montant min */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Montant minimum (Ar)
                </label>
                <input
                  type="number"
                  value={modalEdition.montant_min}
                  onChange={(e) =>
                    setModalEdition({
                      ...modalEdition,
                      montant_min: parseFloat(e.target.value) || 0,
                    })
                  }
                  min="0"
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Date de début *
                  </label>
                  <input
                    type="datetime-local"
                    value={modalEdition.date_debut}
                    onChange={(e) =>
                      setModalEdition({
                        ...modalEdition,
                        date_debut: e.target.value,
                      })
                    }
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Date de fin *
                  </label>
                  <input
                    type="datetime-local"
                    value={modalEdition.date_fin}
                    onChange={(e) =>
                      setModalEdition({
                        ...modalEdition,
                        date_fin: e.target.value,
                      })
                    }
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Limites */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Max utilisations (vide = illimité)
                  </label>
                  <input
                    type="number"
                    value={modalEdition.max_utilisations}
                    onChange={(e) =>
                      setModalEdition({
                        ...modalEdition,
                        max_utilisations: e.target.value,
                      })
                    }
                    min="1"
                    placeholder="Illimité"
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Max par client
                  </label>
                  <input
                    type="number"
                    value={modalEdition.max_par_client}
                    onChange={(e) =>
                      setModalEdition({
                        ...modalEdition,
                        max_par_client: parseInt(e.target.value) || 1,
                      })
                    }
                    min="1"
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Services */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Services applicables
                </label>
                <select
                  value={modalEdition.services_applicables}
                  onChange={(e) =>
                    setModalEdition({
                      ...modalEdition,
                      services_applicables: e.target.value,
                    })
                  }
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="tous">Tous les services</option>
                  <option value="reservation">Réservations uniquement</option>
                  <option value="ticket">Tickets uniquement</option>
                  <option value="vip">VIP uniquement</option>
                </select>
              </div>

              {/* Actif */}
              <div className="flex items-center gap-3 bg-[#0A1628] rounded-lg p-4">
                <input
                  type="checkbox"
                  id="actif"
                  checked={modalEdition.actif}
                  onChange={(e) =>
                    setModalEdition({
                      ...modalEdition,
                      actif: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="actif" className="text-sm cursor-pointer">
                  Activer ce code immédiatement
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-[#112240] border-t border-white/10 p-5 flex gap-3 justify-end">
              <button
                onClick={() => setModalEdition(null)}
                disabled={sauvegardeEnCours}
                className="px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={sauvegarder}
                disabled={sauvegardeEnCours}
                className="px-6 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition disabled:opacity-50 flex items-center gap-2"
              >
                {sauvegardeEnCours ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {modalEdition.id ? "Enregistrer" : "Créer"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL SUPPRESSION ===== */}
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
                <h2 className="text-lg font-bold">Supprimer le code</h2>
                <p className="text-xs text-gray-400 font-mono">
                  {modalSupprimer.code}
                </p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-300">
                Cette action est irréversible. L'historique des utilisations sera
                supprimé.
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
                onClick={supprimer}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL UTILISATIONS ===== */}
      {modalUtilisations && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalUtilisations(null)}
        >
          <div
            className="bg-[#112240] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#112240] border-b border-white/10 p-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Utilisations</h2>
                <p className="text-xs text-gray-400 font-mono">
                  {modalUtilisations.code}
                </p>
              </div>
              <button
                onClick={() => setModalUtilisations(null)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              {utilisations.length === 0 ? (
                <p className="text-center text-gray-400 py-8">
                  Aucune utilisation pour ce code
                </p>
              ) : (
                <div className="space-y-2">
                  {utilisations.map((u) => (
                    <div
                      key={u.id}
                      className="bg-[#0A1628] rounded-lg p-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {u.client_telephone || u.client_email || "Anonyme"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(u.created_at)} · {u.service}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-orange-400">
                          -{formatPrix(u.reduction)} Ar
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatPrix(u.montant_avant)} → {formatPrix(u.montant_apres)}
                        </p>
                      </div>
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