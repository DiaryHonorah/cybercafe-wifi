import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Clock,
  PieChart,
  BarChart3,
  DollarSign,
  Award,
} from "lucide-react";
import api from "../api";

export default function StatistiquesAvancees() {
  const [periode, setPeriode] = useState("semaine");
  const [graphique, setGraphique] = useState([]);
  const [previsions, setPrevisions] = useState(null);
  const [topClients, setTopClients] = useState([]);
  const [heuresPointe, setHeuresPointe] = useState([]);
  const [repartition, setRepartition] = useState({ forfaits: [], total_global: 0 });
  const [joursSemaine, setJoursSemaine] = useState([]);
  const [chargement, setChargement] = useState(true);

  const chargerTout = async () => {
    setChargement(true);
    try {
      const [
        r1, r2, r3, r4, r5, r6
      ] = await Promise.all([
        api.get(`/api/statistiques/graphique?periode=${periode}`).catch(() => ({ data: [] })),
        api.get("/api/statistiques/previsions").catch(() => ({ data: null })),
        api.get("/api/statistiques/top-clients").catch(() => ({ data: [] })),
        api.get("/api/statistiques/heures-pointe").catch(() => ({ data: [] })),
        api.get("/api/statistiques/repartition-forfaits").catch(() => ({ data: { forfaits: [], total_global: 0 } })),
        api.get("/api/statistiques/jours-semaine").catch(() => ({ data: [] })),
      ]);

      setGraphique(r1.data || []);
      setPrevisions(r2.data);
      setTopClients(r3.data || []);
      setHeuresPointe(r4.data || []);
      setRepartition(r5.data || { forfaits: [], total_global: 0 });
      setJoursSemaine(r6.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerTout();
  }, [periode]);

  const maxTotal = Math.max(...graphique.map((g) => Number(g.total) || 0), 1);

  const libelleColonne = (g) => {
    if (periode === "jour") return `${g.heure}h`;
    if (periode === "semaine") {
      return new Date(g.date).toLocaleDateString("fr-FR", { weekday: "short" });
    }
    if (periode === "mois") return `${g.jour}`;
    if (periode === "annee") return g.mois_nom ? g.mois_nom.substring(0, 3) : g.date;
    return g.date;
  };

  const maxJoursSemaine = Math.max(...joursSemaine.map((j) => Number(j.total) || 0), 1);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Statistiques avancées</h1>
        <p className="text-gray-400 text-sm">
          Analysez vos performances en détail
        </p>
      </div>

      {/* ===== Prévisions ===== */}
      {previsions && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-panel rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="bg-accent/10 text-accent p-3 rounded-xl">
                <DollarSign size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Moyenne / jour</p>
                <p className="text-xl font-bold text-accent">
                  {previsions.moyenne_jour} Ar
                </p>
              </div>
            </div>
          </div>
          <div className="bg-panel rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-xl ${
                  previsions.tendance >= 0
                    ? "bg-success/10 text-success"
                    : "bg-danger/10 text-danger"
                }`}
              >
                {previsions.tendance >= 0 ? (
                  <TrendingUp size={20} />
                ) : (
                  <TrendingDown size={20} />
                )}
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Tendance</p>
                <p
                  className={`text-xl font-bold ${
                    previsions.tendance >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {previsions.tendance >= 0 ? "+" : ""}
                  {previsions.tendance} Ar / jour
                </p>
              </div>
            </div>
          </div>
          <div className="bg-panel rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="bg-cyan/10 text-cyan p-3 rounded-xl">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">
                  Prévision demain
                </p>
                <p className="text-xl font-bold text-cyan">
                  {previsions.previsions?.[0]?.prevision || 0} Ar
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Graphique principal ===== */}
      <div className="bg-panel rounded-2xl p-6 border border-white/5 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold flex items-center gap-2">
            <BarChart3 size={18} className="text-accent" />
            Évolution des revenus
          </h3>
          <div className="flex gap-2">
            {["jour", "semaine", "mois", "annee"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriode(p)}
                className={`text-xs px-3 py-1.5 rounded-lg transition font-medium ${
                  periode === p
                    ? "bg-accent text-white"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                {p === "jour" ? "Jour" : p === "semaine" ? "Semaine" : p === "mois" ? "Mois" : "Année"}
              </button>
            ))}
          </div>
        </div>

        {chargement ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            Chargement...
          </div>
        ) : graphique.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            Aucune donnée pour cette période
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="h-64 flex items-end gap-2 min-w-[600px] pb-8">
              {graphique.map((g, i) => {
                const hauteur = (Number(g.total) / maxTotal) * 100;
                return (
                  <div
                    key={i}
                    className="flex-shrink-0 flex flex-col items-center gap-2"
                    style={{ width: `${Math.max(40, 100 / graphique.length)}%` }}
                  >
                    <div className="text-xs text-gray-400 font-mono">
                      {g.total} Ar
                    </div>
                    <div
                      className="w-full bg-gradient-to-t from-accent/40 to-accent rounded-t-lg transition-all hover:from-accent hover:to-accentDark min-h-[4px]"
                      style={{ height: `${Math.max(2, hauteur)}%` }}
                    />
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {libelleColonne(g)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ===== Jours de la semaine ===== */}
      <div className="bg-panel rounded-2xl p-6 border border-white/5 mb-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-cyan" />
          Revenus par jour de la semaine (30 derniers jours)
        </h3>
        {joursSemaine.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            Aucune donnée
          </p>
        ) : (
          <div className="space-y-3">
            {joursSemaine.map((j, i) => {
              const largeur = (Number(j.total) / maxJoursSemaine) * 100;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-gray-400">
                    {j.jour_nom}
                  </span>
                  <div className="flex-1 bg-white/5 rounded-full h-6 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan/60 to-cyan flex items-center justify-end pr-3 transition-all"
                      style={{ width: `${largeur}%` }}
                    >
                      {largeur > 20 && (
                        <span className="text-xs text-white font-medium">
                          {j.total} Ar
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="w-20 text-right text-xs text-gray-500">
                    {j.nb_ventes} vente{j.nb_ventes > 1 ? "s" : ""}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== Répartition + Heures pointe ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-panel rounded-2xl p-6 border border-white/5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <PieChart size={18} className="text-success" />
            Répartition par forfait
          </h3>
          {repartition.forfaits.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              Aucune donnée
            </p>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                {repartition.forfaits.map((f, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{f.forfait}</span>
                      <span className="font-medium text-white">
                        {f.pourcentage}%
                      </span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${f.pourcentage}%`,
                          background: `hsl(${i * 60 + 20}, 70%, 55%)`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-white/5 flex justify-between text-sm">
                <span className="text-gray-400">Total global</span>
                <span className="font-bold text-accent">
                  {repartition.total_global} Ar
                </span>
              </div>
            </>
          )}
        </div>

        <div className="bg-panel rounded-2xl p-6 border border-white/5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock size={18} className="text-warn" />
            Heures de pointe (30 derniers jours)
          </h3>
          {heuresPointe.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              Aucune donnée
            </p>
          ) : (
            <ul className="space-y-3">
              {heuresPointe.map((h, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-warn/10 text-warn flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{h.heure}h - {h.heure + 1}h</p>
                      <p className="text-xs text-gray-500">
                        {h.nb_ventes} vente{h.nb_ventes > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-success font-semibold text-sm">
                    {h.total} Ar
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ===== Top clients ===== */}
      <div className="bg-panel rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center gap-2">
          <Award size={18} className="text-accent" />
          <h3 className="font-semibold">Top 10 clients</h3>
        </div>
        {topClients.length === 0 ? (
          <p className="p-8 text-center text-gray-500 text-sm">
            Aucun client enregistré. Créez des reçus pour identifier vos clients.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                <tr>
                  <th className="text-left p-4">#</th>
                  <th className="text-left p-4">Client</th>
                  <th className="text-left p-4">Téléphone</th>
                  <th className="text-right p-4">Achats</th>
                  <th className="text-right p-4">Total dépensé</th>
                  <th className="text-right p-4">Dernière visite</th>
                </tr>
              </thead>
              <tbody>
                {topClients.map((c, i) => (
                  <tr
                    key={i}
                    className="border-t border-white/5 hover:bg-white/5 transition"
                  >
                    <td className="p-4">
                      <span className="w-7 h-7 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                    </td>
                    <td className="p-4 font-medium">{c.nom_client}</td>
                    <td className="p-4 text-gray-400">
                      {c.telephone_client || "—"}
                    </td>
                    <td className="p-4 text-right">{c.nb_achats}</td>
                    <td className="p-4 text-right font-bold text-success">
                      {c.total_depense} Ar
                    </td>
                    <td className="p-4 text-right text-xs text-gray-400">
                      {new Date(c.derniere_visite).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}