import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet, Search, Filter, Loader2, RefreshCw, AlertCircle, CheckCircle2,
  XCircle, Users, TrendingUp, DollarSign, Clock, Eye, Check, X, Send,
  CreditCard, Banknote, Smartphone, Building2, FileText, User,
} from "lucide-react";

const API_URL = "http://localhost/cybercafe-wifi/backend/api";

export default function Portefeuilles() {
  const navigate = useNavigate();
  const [ongletActif, setOngletActif] = useState("demandes");
  const [demandes, setDemandes] = useState([]);
  const [portefeuilles, setPortefeuilles] = useState([]);
  const [stats, setStats] = useState(null);
  const [config, setConfig] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [filtreStatut, setFiltreStatut] = useState("en_attente");
  const [recherche, setRecherche] = useState("");
  const [modalValider, setModalValider] = useState(null);
  const [modalRejeter, setModalRejeter] = useState(null);
  const [noteAdmin, setNoteAdmin] = useState("");
  const [actionEnCours, setActionEnCours] = useState(false);

  const getToken = () =>
    localStorage.getItem("admin_token") || localStorage.getItem("token") || localStorage.getItem("auth_token");

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

  const chargerDemandes = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const params = new URLSearchParams();
      if (filtreStatut !== "tous") params.append("statut", filtreStatut);
      if (recherche.trim()) params.append("recherche", recherche.trim());

      const res = await fetchAvecToken(`${API_URL}/portefeuille/admin/demandes?${params.toString()}`);
      if (res.status === 401) { navigate("/login"); return; }
      const data = await res.json();
      if (data.success) setDemandes(data.demandes || []);
      else setErreur(data.message);
    } catch (err) {
      setErreur("Impossible de contacter le serveur");
    } finally {
      setChargement(false);
    }
  };

  const chargerPortefeuilles = async () => {
    setChargement(true);
    setErreur(null);
    try {
      const params = new URLSearchParams();
      if (recherche.trim()) params.append("recherche", recherche.trim());

      const res = await fetchAvecToken(`${API_URL}/portefeuille/admin/liste?${params.toString()}`);
      if (res.status === 401) { navigate("/login"); return; }
      const data = await res.json();
      if (data.success) setPortefeuilles(data.portefeuilles || []);
      else setErreur(data.message);
    } catch (err) {
      setErreur("Impossible de contacter le serveur");
    } finally {
      setChargement(false);
    }
  };

  const chargerStats = async () => {
    try {
      const res = await fetchAvecToken(`${API_URL}/portefeuille/admin/stats`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setConfig(data.config);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    chargerStats();
  }, []);

  useEffect(() => {
    if (ongletActif === "demandes") chargerDemandes();
    else chargerPortefeuilles();
  }, [ongletActif, filtreStatut]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (ongletActif === "demandes") chargerDemandes();
      else chargerPortefeuilles();
    }, 500);
    return () => clearTimeout(timer);
  }, [recherche]);

  const validerDemande = async () => {
    if (!modalValider) return;
    setActionEnCours(true);
    try {
      const res = await fetchAvecToken(`${API_URL}/portefeuille/admin/valider`, {
        method: "POST",
        body: JSON.stringify({ demande_id: modalValider.id, note: noteAdmin || null }),
      });
      const data = await res.json();
      if (data.success) {
        setModalValider(null);
        setNoteAdmin("");
        chargerDemandes();
        chargerStats();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Erreur serveur");
    } finally {
      setActionEnCours(false);
    }
  };

  const rejeterDemande = async () => {
    if (!modalRejeter) return;
    setActionEnCours(true);
    try {
      const res = await fetchAvecToken(`${API_URL}/portefeuille/admin/rejeter`, {
        method: "POST",
        body: JSON.stringify({ demande_id: modalRejeter.id, raison: noteAdmin || null }),
      });
      const data = await res.json();
      if (data.success) {
        setModalRejeter(null);
        setNoteAdmin("");
        chargerDemandes();
        chargerStats();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Erreur serveur");
    } finally {
      setActionEnCours(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const formatPrix = (n) => Number(n || 0).toLocaleString("fr-FR");

  const getMethodeLabel = (methode) => {
    const labels = {
      mvola: "MVola", orange_money: "Orange Money", airtel_money: "Airtel Money",
      virement: "Virement bancaire", especes: "Espèces", autre: "Autre",
    };
    return labels[methode] || methode;
  };

  const getMethodeIcon = (methode) => {
    const icons = {
      mvola: <Smartphone size={14} />, orange_money: <Smartphone size={14} />,
      airtel_money: <Smartphone size={14} />, virement: <Building2 size={14} />,
      especes: <Banknote size={14} />, autre: <CreditCard size={14} />,
    };
    return icons[methode] || <CreditCard size={14} />;
  };

  const getStatutColor = (statut) => {
    const colors = {
      en_attente: "bg-orange-500/10 text-orange-400 border-orange-500/30",
      validee: "bg-green-500/10 text-green-400 border-green-500/30",
      rejetee: "bg-red-500/10 text-red-400 border-red-500/30",
    };
    return colors[statut] || "bg-gray-500/10 text-gray-400 border-gray-500/30";
  };

  const getStatutLabel = (statut) => {
    const labels = { en_attente: "En attente", validee: "Validée", rejetee: "Rejetée" };
    return labels[statut] || statut;
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#06B6D4] to-[#1E40AF]">
              <Wallet size={24} className="text-white" />
            </div>
            Portefeuilles clients
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Gérez les rechargements et les soldes
          </p>
        </div>

        <button
          onClick={() => {
            chargerStats();
            if (ongletActif === "demandes") chargerDemandes();
            else chargerPortefeuilles();
          }}
          disabled={chargement}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition disabled:opacity-50"
        >
          <RefreshCw size={16} className={chargement ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {/* STATS */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-[#112240] rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <Users size={14} /> Portefeuilles
            </div>
            <p className="text-2xl font-bold">{stats.total_portefeuilles}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-cyan-500/20">
            <div className="flex items-center gap-2 text-xs text-cyan-400 mb-1">
              <Wallet size={14} /> Solde total
            </div>
            <p className="text-lg font-bold text-cyan-400">{formatPrix(stats.solde_total)} Ar</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-orange-500/20">
            <div className="flex items-center gap-2 text-xs text-orange-400 mb-1">
              <Clock size={14} /> Demandes en attente
            </div>
            <p className="text-2xl font-bold text-orange-400">{stats.demandes_en_attente}</p>
          </div>
          <div className="bg-[#112240] rounded-xl p-4 border border-green-500/20">
            <div className="flex items-center gap-2 text-xs text-green-400 mb-1">
              <DollarSign size={14} /> Total rechargé
            </div>
            <p className="text-lg font-bold text-green-400">{formatPrix(stats.total_recharge)} Ar</p>
          </div>
        </div>
      )}

      {/* CONFIG INFO */}
      {config && (
        <div className="bg-gradient-to-r from-[#06B6D4]/10 to-[#1E40AF]/10 border border-cyan-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap text-sm">
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-medium">
              Min : {formatPrix(config.rechargement_min)} Ar
            </span>
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-medium">
              Max : {formatPrix(config.rechargement_max)} Ar
            </span>
            <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
              Bonus : {config.bonus_pct}% dès {formatPrix(config.bonus_seuil)} Ar
            </span>
            <span className="text-sm text-gray-400">
              🎁 Total bonus versé : {formatPrix(stats?.total_bonus_verse || 0)} Ar
            </span>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-2">
        <button
          onClick={() => setOngletActif("demandes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition ${
            ongletActif === "demandes"
              ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
              : "text-gray-400 hover:bg-white/5"
          }`}
        >
          <FileText size={16} />
          Demandes ({stats?.demandes_en_attente || 0})
        </button>
        <button
          onClick={() => setOngletActif("portefeuilles")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition ${
            ongletActif === "portefeuilles"
              ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
              : "text-gray-400 hover:bg-white/5"
          }`}
        >
          <Wallet size={16} />
          Portefeuilles
        </button>
      </div>

      {/* FILTRES */}
      <div className="bg-[#112240] rounded-xl p-4 mb-6 border border-white/5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher par nom, email ou téléphone..."
              className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>
          {ongletActif === "demandes" && (
            <select
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
              className="bg-[#0A1628] border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:border-cyan-500 focus:outline-none"
            >
              <option value="en_attente">En attente</option>
              <option value="validee">Validées</option>
              <option value="rejetee">Rejetées</option>
              <option value="tous">Toutes</option>
            </select>
          )}
        </div>
      </div>

      {erreur && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} />
          <p>{erreur}</p>
        </div>
      )}

      {/* CONTENU */}
      {chargement && (ongletActif === "demandes" ? demandes : portefeuilles).length === 0 ? (
        <div className="text-center py-20">
          <Loader2 size={40} className="animate-spin text-cyan-500 mx-auto" />
          <p className="text-gray-400 mt-4">Chargement...</p>
        </div>
      ) : ongletActif === "demandes" ? (
        demandes.length === 0 ? (
          <div className="text-center py-20 bg-[#112240] rounded-2xl border border-white/5">
            <FileText size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune demande</h3>
            <p className="text-sm text-gray-400">
              {filtreStatut === "en_attente" ? "Aucune demande en attente" : "Aucune demande trouvée"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {demandes.map((d) => (
              <div key={d.id} className="bg-[#112240] rounded-xl p-4 border border-white/5 hover:border-cyan-500/30 transition">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 flex-shrink-0">
                      {getMethodeIcon(d.methode)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="font-semibold">{d.client_nom}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatutColor(d.statut)}`}>
                          {getStatutLabel(d.statut)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{d.client_email} · {d.client_telephone}</p>
                      {d.reference_paiement && (
                        <p className="text-xs text-cyan-400 mt-1">
                          Réf : <span className="font-mono">{d.reference_paiement}</span>
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(d.created_at)} · {getMethodeLabel(d.methode)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-cyan-400">{formatPrix(d.montant)} Ar</p>
                    {parseFloat(d.bonus_applique) > 0 && (
                      <p className="text-xs text-green-400">+{formatPrix(d.bonus_applique)} bonus</p>
                    )}
                  </div>

                  {d.statut === "en_attente" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => { setModalValider(d); setNoteAdmin(""); }}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-sm font-medium transition"
                      >
                        <Check size={14} />
                        Valider
                      </button>
                      <button
                        onClick={() => { setModalRejeter(d); setNoteAdmin(""); }}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition"
                      >
                        <X size={14} />
                        Rejeter
                      </button>
                    </div>
                  )}
                </div>
                {d.note_admin && (
                  <p className="mt-2 text-xs text-gray-400 italic">Note : {d.note_admin}</p>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        portefeuilles.length === 0 ? (
          <div className="text-center py-20 bg-[#112240] rounded-2xl border border-white/5">
            <Wallet size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun portefeuille</h3>
          </div>
        ) : (
          <div className="bg-[#112240] rounded-xl border border-white/5 overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#0A1628] border-b border-white/10">
                <tr className="text-xs text-gray-400 uppercase">
                  <th className="text-left p-3">Client</th>
                  <th className="text-right p-3">Solde</th>
                  <th className="text-right p-3 hidden md:table-cell">Rechargé</th>
                  <th className="text-right p-3 hidden md:table-cell">Dépensé</th>
                  <th className="text-right p-3 hidden lg:table-cell">Bonus</th>
                </tr>
              </thead>
              <tbody>
                {portefeuilles.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-3">
                      <p className="text-sm font-medium">{p.client_nom}</p>
                      <p className="text-xs text-gray-500">{p.client_email}</p>
                      <p className="text-xs text-gray-500">{p.client_telephone}</p>
                    </td>
                    <td className="p-3 text-right font-bold text-cyan-400">
                      {formatPrix(p.solde)} Ar
                    </td>
                    <td className="p-3 text-right text-sm text-green-400 hidden md:table-cell">
                      {formatPrix(p.total_recharge)} Ar
                    </td>
                    <td className="p-3 text-right text-sm text-orange-400 hidden md:table-cell">
                      {formatPrix(p.total_depense)} Ar
                    </td>
                    <td className="p-3 text-right text-sm text-purple-400 hidden lg:table-cell">
                      {formatPrix(p.total_bonus_rechargement)} Ar
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* MODAL VALIDER */}
      {modalValider && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !actionEnCours && setModalValider(null)}>
          <div className="bg-[#112240] rounded-2xl max-w-md w-full border border-green-500/30"
            onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle2 size={20} className="text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Valider le rechargement</h2>
                <p className="text-xs text-gray-400">{modalValider.client_nom}</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-[#0A1628] rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Montant</span>
                  <span className="font-bold text-cyan-400">{formatPrix(modalValider.montant)} Ar</span>
                </div>
                {config && parseFloat(modalValider.montant) >= parseFloat(config.bonus_seuil) && (
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-sm text-green-400">Bonus {config.bonus_pct}%</span>
                    <span className="font-bold text-green-400">
                      +{formatPrix(parseFloat(modalValider.montant) * parseInt(config.bonus_pct) / 100)} Ar
                    </span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Note (optionnel)</label>
                <textarea value={noteAdmin} onChange={(e) => setNoteAdmin(e.target.value)} rows={2}
                  placeholder="Ex: Paiement MVola reçu..."
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-green-500 focus:outline-none resize-none" />
              </div>
            </div>
            <div className="p-5 border-t border-white/10 flex gap-3">
              <button onClick={() => setModalValider(null)} disabled={actionEnCours}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition font-medium disabled:opacity-50">
                Annuler
              </button>
              <button onClick={validerDemande} disabled={actionEnCours}
                className="flex-1 px-4 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition disabled:opacity-50 flex items-center justify-center gap-2">
                {actionEnCours ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REJETER */}
      {modalRejeter && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !actionEnCours && setModalRejeter(null)}>
          <div className="bg-[#112240] rounded-2xl max-w-md w-full border border-red-500/30"
            onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <XCircle size={20} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Rejeter la demande</h2>
                <p className="text-xs text-gray-400">{modalRejeter.client_nom}</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-[#0A1628] rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Montant</span>
                  <span className="font-bold">{formatPrix(modalRejeter.montant)} Ar</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Raison du rejet</label>
                <textarea value={noteAdmin} onChange={(e) => setNoteAdmin(e.target.value)} rows={3}
                  placeholder="Ex: Référence MVola introuvable, montant non reçu..."
                  className="w-full bg-[#0A1628] border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:border-red-500 focus:outline-none resize-none" />
              </div>
            </div>
            <div className="p-5 border-t border-white/10 flex gap-3">
              <button onClick={() => setModalRejeter(null)} disabled={actionEnCours}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition font-medium disabled:opacity-50">
                Annuler
              </button>
              <button onClick={rejeterDemande} disabled={actionEnCours}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition disabled:opacity-50 flex items-center justify-center gap-2">
                {actionEnCours ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                Rejeter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}