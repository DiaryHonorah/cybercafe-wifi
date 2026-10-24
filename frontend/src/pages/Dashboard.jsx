import { useEffect, useState } from "react";
import {
  DollarSign,
  Users,
  Ticket,
  Wifi,
  TrendingUp,
  Activity,
  BarChart3,
  Clock,
} from "lucide-react";
import api from "../api";
import StatCard from "../components/StatCard";
import KpiAnime from "../components/KpiAnime";
import ComparaisonHier from "../components/ComparaisonHier";
import TopHeures from "../components/TopHeures";
import Alertes from "../components/Alertes";
import PageLoader from "../components/PageLoader";
import EmptyState from "../components/EmptyState";
import { useLanguage } from "../context/LanguageContext";
import { useWebSocket } from "../context/WebSocketContext";

export default function Dashboard() {
  const [stats, setStats] = useState({
    ventes_jour: 0,
    sessions_actives: 0,
    tickets_vendus: 0,
    tickets_disponibles: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [graphique, setGraphique] = useState([]);
  const [periode, setPeriode] = useState("jour");
  const [chargementGraphique, setChargementGraphique] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [derniereMaj, setDerniereMaj] = useState(null);
  const { t } = useLanguage();
  const { souscrire } = useWebSocket();

  // ==========================================
  // CHARGER STATS + TRANSACTIONS
  // ==========================================
  useEffect(() => {
    const chargerStats = () => {
      api
        .get("/api/dashboard")
        .then((r) => {
          setStats(r.data);
          setDerniereMaj(new Date());
        })
        .catch(() => {})
        .finally(() => setChargement(false));
    };

    const chargerTransactions = () => {
      api
        .get("/api/dashboard/transactions")
        .then((r) => setTransactions(r.data))
        .catch(() => {});
    };

    chargerStats();
    chargerTransactions();

    // ⭐ Rafraîchissement toutes les 5 secondes (temps réel)
    const interval = setInterval(() => {
      chargerStats();
      chargerTransactions();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // ==========================================
  // ÉCOUTE WEBSOCKET (recharge immédiate)
  // ==========================================
  useEffect(() => {
    const desouscrire = souscrire((data) => {
      if (data.type === "vente" || data.type === "session" || data.type === "expiration") {
        api.get("/api/dashboard").then((r) => setStats(r.data)).catch(() => {});
        api
          .get("/api/dashboard/transactions")
          .then((r) => setTransactions(r.data))
          .catch(() => {});
      }
    });
    return () => desouscrire();
  }, [souscrire]);

  // ==========================================
  // CHARGER LE GRAPHIQUE
  // ==========================================
  useEffect(() => {
    setChargementGraphique(true);
    api
      .get(`/api/dashboard/graphique?periode=${periode}`)
      .then((r) => setGraphique(Array.isArray(r.data) ? r.data : []))
      .catch(() => setGraphique([]))
      .finally(() => setChargementGraphique(false));
  }, [periode]);

  const maxTotal = Math.max(...graphique.map((g) => Number(g.total) || 0), 1);

  const formatLabel = (g) => {
    if (periode === "jour") return `${g.heure}h`;
    if (periode === "semaine") {
      const jours = {
        Monday: "Lun",
        Tuesday: "Mar",
        Wednesday: "Mer",
        Thursday: "Jeu",
        Friday: "Ven",
        Saturday: "Sam",
        Sunday: "Dim",
      };
      return jours[g.jour_nom] || g.date;
    }
    if (periode === "mois") return `${g.jour}`;
    return g.date;
  };

  if (chargement) {
    return <PageLoader message="Chargement du tableau de bord..." />;
  }

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* En-tête */}
      <div className="flex justify-between items-start mb-6">
        <div className="animate-slide-up">
          <h1 className="text-2xl font-bold">{t("dashboard.titre")}</h1>
          <p className="text-gray-400 text-sm">{t("dashboard.sousTitre")}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 animate-slide-up">
          <Activity size={14} className="text-success animate-pulse" />
          <span>
            {t("dashboard.misAJourA")}{" "}
            {derniereMaj ? derniereMaj.toLocaleTimeString("fr-FR") : "—"}
          </span>
        </div>
      </div>

      {/* Alertes */}
      <Alertes />

      {/* KPI animés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="animate-slide-up stagger-1">
          <KpiAnime
            label={t("dashboard.ventesJour")}
            valeur={stats.ventes_jour}
            unite="Ar"
            icon={DollarSign}
            couleur="accent"
            sousTitre={t("dashboard.toutesTransactions")}
          />
        </div>
        <div className="animate-slide-up stagger-2">
          <KpiAnime
            label={t("dashboard.sessionsActives")}
            valeur={stats.sessions_actives}
            unite=""
            icon={Users}
            couleur="success"
            sousTitre={t("dashboard.clientsEnLigne")}
          />
        </div>
        <div className="animate-slide-up stagger-3">
          <KpiAnime
            label={t("dashboard.ticketsVendus")}
            valeur={stats.tickets_vendus}
            unite=""
            icon={Ticket}
            couleur="cyan"
            sousTitre={t("dashboard.aujourdhuiLabel")}
          />
        </div>
        <div className="animate-slide-up stagger-4">
          <KpiAnime
            label={t("dashboard.ticketsDisponibles")}
            valeur={stats.tickets_disponibles}
            unite=""
            icon={Wifi}
            couleur="danger"
            sousTitre={t("dashboard.pretsAVendre")}
          />
        </div>
      </div>

      {/* Comparaison + Top heures */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="animate-slide-up stagger-5">
          <ComparaisonHier />
        </div>
        <div className="animate-slide-up stagger-6">
          <TopHeures />
        </div>
      </div>

      {/* Graphique + Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Graphique */}
        <div className="lg:col-span-2 bg-panel rounded-2xl p-6 border border-white/5 animate-slide-up stagger-7">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp size={18} className="text-accent" />
              {t("dashboard.revenusJournaliers")}
            </h3>
            <div className="flex gap-2">
              {[
                { key: "jour", label: t("dashboard.jour") },
                { key: "semaine", label: t("dashboard.semaine") },
                { key: "mois", label: t("dashboard.mois") },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriode(p.key)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                    periode === p.key
                      ? "bg-accent text-white shadow-lg shadow-accent/20"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {chargementGraphique ? (
            <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
              Chargement...
            </div>
          ) : graphique.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <BarChart3 size={48} className="text-gray-600 mb-3" />
              <p className="text-sm">Aucune vente pour cette période</p>
            </div>
          ) : (
            <div className="flex items-end gap-3 h-64 pb-8 overflow-x-auto">
              {graphique.map((g, i) => {
                const hauteur = (Number(g.total) / maxTotal) * 100;
                return (
                  <div
                    key={i}
                    className="flex-shrink-0 flex flex-col items-center justify-end h-full"
                    style={{
                      minWidth: "50px",
                      width: `${Math.max(50, 100 / graphique.length)}%`,
                    }}
                  >
                    <div className="text-xs font-semibold text-accent mb-1 whitespace-nowrap">
                      {g.total > 0 ? `${g.total}` : ""}
                    </div>
                    <div
                      className="w-full max-w-[60px] bg-gradient-to-t from-accent/40 to-accent rounded-t-lg transition-all duration-500 hover:from-accent hover:to-accentDark"
                      style={{
                        height: `${Math.max(4, hauteur)}%`,
                        minHeight: "4px",
                      }}
                    />
                    <span className="text-xs text-gray-500 mt-2 whitespace-nowrap">
                      {formatLabel(g)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Transactions */}
        <div className="bg-panel rounded-2xl p-6 border border-white/5 animate-slide-up stagger-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock size={18} className="text-success" />
              {t("dashboard.transactionsRecentes")}
            </h3>
            <button className="text-xs text-accent hover:underline transition">
              {t("dashboard.toutVoir")}
            </button>
          </div>

          {transactions.length === 0 ? (
            <EmptyState titre={t("dashboard.aucuneTransaction")} compact />
          ) : (
            <ul className="space-y-3 text-sm">
              {transactions.map((tx, i) => (
                <li
                  key={i}
                  className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="min-w-0">
                    <p className="font-medium font-mono text-xs truncate">
                      #{tx.code}
                    </p>
                    <p className="text-xs text-gray-500">
                      {tx.forfait} ·{" "}
                      {new Date(tx.date_vente).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className="text-success font-semibold flex-shrink-0 ml-2">
                    {tx.montant} Ar
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}