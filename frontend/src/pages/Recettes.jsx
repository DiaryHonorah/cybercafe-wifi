import { useEffect, useState } from "react";
import {
  Download,
  DollarSign,
  TrendingUp,
  Calendar,
  FileText,
  Loader2,
} from "lucide-react";
import api from "../api";
import { useLanguage } from "../context/LanguageContext";

export default function Recettes() {
  const [ventes, setVentes] = useState([]);
  const [resume, setResume] = useState({ total: 0, nombre_ventes: 0 });
  const [chargement, setChargement] = useState(true);
  const [debut, setDebut] = useState(new Date().toISOString().slice(0, 10));
  const [fin, setFin] = useState(new Date().toISOString().slice(0, 10));
  const [exportEnCours, setExportEnCours] = useState(false);
  const { t } = useLanguage();

  const charger = async () => {
    setChargement(true);
    try {
      const r = await api.get(`/api/export/resume?debut=${debut}&fin=${fin}`);
      setVentes(r.data.ventes || []);
      setResume({
        total: r.data.total || 0,
        nombre_ventes: r.data.nombre_ventes || 0,
      });
    } catch {
      setVentes([]);
      setResume({ total: 0, nombre_ventes: 0 });
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
  }, [debut, fin]);

  const exporterCSV = () => {
    setExportEnCours(true);
    const url = `http://localhost/cybercafe-wifi/backend/api/export/csv?debut=${debut}&fin=${fin}`;
    window.open(url, "_blank");
    setTimeout(() => setExportEnCours(false), 1000);
  };

  const moyenne =
    resume.nombre_ventes > 0
      ? Math.round(resume.total / resume.nombre_ventes)
      : 0;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("recettes.titre")}</h1>
          <p className="text-gray-400 text-sm">{t("recettes.sousTitre")}</p>
        </div>
        <button
          onClick={exporterCSV}
          disabled={exportEnCours}
          className="flex items-center gap-2 bg-accent hover:bg-accentDark disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
        >
          {exportEnCours ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Download size={16} />
          )}
          {t("recettes.exporterCSV")}
        </button>
      </div>

      <div className="bg-panel rounded-2xl p-5 border border-white/5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              {t("recettes.dateDebut")}
            </label>
            <input
              type="date"
              value={debut}
              onChange={(e) => setDebut(e.target.value)}
              className="w-full bg-night border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              {t("recettes.dateFin")}
            </label>
            <input
              type="date"
              value={fin}
              onChange={(e) => setFin(e.target.value)}
              className="w-full bg-night border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-panel rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-accent/10 text-accent p-3 rounded-xl">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">
                {t("recettes.totalPeriode")}
              </p>
              <p className="text-xl font-bold text-accent">{resume.total} Ar</p>
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
                {t("recettes.ticketsVendus")}
              </p>
              <p className="text-xl font-bold">{resume.nombre_ventes}</p>
            </div>
          </div>
        </div>
        <div className="bg-panel rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-success/10 text-success p-3 rounded-xl">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">
                {t("recettes.panierMoyen")}
              </p>
              <p className="text-xl font-bold text-success">{moyenne} Ar</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-panel rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center gap-2">
          <FileText size={18} className="text-accent" />
          <h3 className="font-semibold">{t("recettes.detailVentes")}</h3>
        </div>

        {chargement ? (
          <div className="p-12 text-center text-gray-500">
            {t("commun.chargement")}
          </div>
        ) : ventes.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText size={48} className="text-gray-600 mx-auto mb-4" />
            <p>{t("recettes.aucuneVente")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                <tr>
                  <th className="text-left p-4">{t("recettes.code")}</th>
                  <th className="text-left p-4">{t("recettes.forfait")}</th>
                  <th className="text-left p-4">{t("recettes.caissier")}</th>
                  <th className="text-left p-4">{t("recettes.date")}</th>
                  <th className="text-right p-4">{t("recettes.montant")}</th>
                </tr>
              </thead>
              <tbody>
                {ventes.map((v) => (
                  <tr
                    key={v.id}
                    className="border-t border-white/5 hover:bg-white/5 transition"
                  >
                    <td className="p-4 font-mono text-accent">{v.code}</td>
                    <td className="p-4">{v.forfait}</td>
                    <td className="p-4 text-gray-400">{v.caissier}</td>
                    <td className="p-4 text-gray-400 text-xs">
                      {new Date(v.date_vente).toLocaleString("fr-FR")}
                    </td>
                    <td className="p-4 text-right font-semibold text-success">
                      {v.montant} Ar
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-white/5">
                <tr>
                  <td
                    colSpan="4"
                    className="p-4 text-right font-semibold text-gray-400"
                  >
                    {t("recettes.total")}
                  </td>
                  <td className="p-4 text-right font-bold text-accent">
                    {resume.total} Ar
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}