import { useEffect, useState } from "react";
import {
  TrendingUp,
  DollarSign,
  Users,
  Ticket,
  Calendar,
} from "lucide-react";
import api from "../api";
import { useLanguage } from "../context/LanguageContext";

export default function Statistiques() {
  const [periode, setPeriode] = useState("jour");
  const [donnees, setDonnees] = useState([]);
  const [resume, setResume] = useState({});
  const [topForfaits, setTopForfaits] = useState([]);
  const [chargement, setChargement] = useState(true);
  const { t } = useLanguage();

  const chargerResume = () => {
    api.get("/api/statistiques/resume").then((r) => setResume(r.data)).catch(() => {});
  };

  const chargerTop = () => {
    api.get("/api/statistiques/top-forfaits").then((r) => setTopForfaits(r.data)).catch(() => {});
  };

  const chargerGraphique = () => {
    setChargement(true);
    api
      .get(`/api/statistiques?periode=${periode}`)
      .then((r) => setDonnees(r.data))
      .catch(() => setDonnees([]))
      .finally(() => setChargement(false));
  };

  useEffect(() => {
    chargerResume();
    chargerTop();
  }, []);

  useEffect(() => {
    chargerGraphique();
  }, [periode]);

  const maxTotal = Math.max(...donnees.map((d) => Number(d.total) || 0), 1);

  const libelleColonne = (d) => {
    if (periode === "jour") return `${d.heure}h`;
    return new Date(d.date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("statistiques.titre")}</h1>
        <p className="text-gray-400 text-sm">{t("statistiques.sousTitre")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-panel rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-accent/10 text-accent p-3 rounded-xl">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">
                {t("statistiques.aujourdhui")}
              </p>
              <p className="text-xl font-bold text-accent">
                {resume.total_jour || 0} Ar
              </p>
            </div>
          </div>
        </div>
        <div className="bg-panel rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-cyan/10 text-cyan p-3 rounded-xl">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">
                {t("statistiques.semaine")}
              </p>
              <p className="text-xl font-bold text-cyan">
                {resume.total_semaine || 0} Ar
              </p>
            </div>
          </div>
        </div>
        <div className="bg-panel rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-success/10 text-success p-3 rounded-xl">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">
                {t("statistiques.mois")}
              </p>
              <p className="text-xl font-bold text-success">
                {resume.total_mois || 0} Ar
              </p>
            </div>
          </div>
        </div>
        <div className="bg-panel rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-warn/10 text-warn p-3 rounded-xl">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">
                {t("statistiques.clientsUniques")}
              </p>
              <p className="text-xl font-bold text-warn">
                {resume.clients_uniques || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-panel rounded-2xl p-6 border border-white/5 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold">{t("statistiques.evolutionVentes")}</h3>
          <div className="flex gap-2">
            {["jour", "semaine", "mois"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriode(p)}
                className={`text-xs px-3 py-1.5 rounded-lg transition font-medium ${
                  periode === p
                    ? "bg-accent text-white"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                {p === "jour" ? t("statistiques.jour") : p === "semaine" ? t("statistiques.semaineLabel") : t("statistiques.moisLabel")}
              </button>
            ))}
          </div>
        </div>

        {chargement ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            {t("commun.chargement")}
          </div>
        ) : donnees.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            {t("statistiques.aucuneDonnee")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="h-64 flex items-end gap-2 min-w-[600px] pb-8">
              {donnees.map((d, i) => {
                const hauteur = (Number(d.total) / maxTotal) * 100;
                return (
                  <div
                    key={i}
                    className="flex-shrink-0 flex flex-col items-center gap-2"
                    style={{ width: `${Math.max(40, 100 / donnees.length)}%` }}
                  >
                    <div className="text-xs text-gray-400 font-mono">
                      {d.total} Ar
                    </div>
                    <div
                      className="w-full bg-gradient-to-t from-accent/40 to-accent rounded-t-lg transition-all hover:from-accent hover:to-accentDark min-h-[4px]"
                      style={{ height: `${Math.max(2, hauteur)}%` }}
                    />
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {libelleColonne(d)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-panel rounded-2xl p-6 border border-white/5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Ticket size={18} className="text-accent" />
            {t("statistiques.topForfaits")}
          </h3>
          {topForfaits.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              {t("commun.aucuneDonnee")}
            </p>
          ) : (
            <ul className="space-y-3">
              {topForfaits.map((f, i) => (
                <li
                  key={i}
                  className="flex justify-between items-center border-b border-white/5 pb-3 last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{f.nom}</p>
                      <p className="text-xs text-gray-500">
                        {f.nb_ventes} vente{f.nb_ventes > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-success font-semibold text-sm flex-shrink-0 ml-2">
                    {f.total} Ar
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-panel rounded-2xl p-6 border border-white/5">
          <h3 className="font-semibold mb-4">{t("statistiques.resumeGlobal")}</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">{t("statistiques.totalGlobal")}</span>
              <span className="font-bold text-accent">
                {resume.total_global || 0} Ar
              </span>
            </li>
            <li className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">
                {t("statistiques.ticketsVendusAujourdhui")}
              </span>
              <span className="font-bold">{resume.tickets_jour || 0}</span>
            </li>
            <li className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">
                {t("statistiques.sessionsTotales")}
              </span>
              <span className="font-bold">{resume.sessions_totales || 0}</span>
            </li>
            <li className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">
                {t("statistiques.clientsUniques")}
              </span>
              <span className="font-bold">{resume.clients_uniques || 0}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-400">
                {t("statistiques.forfaitPopulaire")}
              </span>
              <span className="font-bold text-cyan">
                {resume.forfait_populaire || "—"}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}