import { useEffect, useState, useRef } from "react";
import {
  FileText,
  Printer,
  Calendar,
  DollarSign,
  User,
  Loader2,
} from "lucide-react";
import api from "../api";

export default function Rapport() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [rapport, setRapport] = useState(null);
  const [chargement, setChargement] = useState(true);
  const printRef = useRef();

  const charger = async () => {
    setChargement(true);
    try {
      const r = await api.get(`/api/rapport?date=${date}`);
      setRapport(r.data);
    } catch {
      setRapport(null);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
  }, [date]);

  const imprimer = () => window.print();

  return (
    <div className="max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Rapport journalier</h1>
          <p className="text-gray-400 text-sm">
            Synthèse complète des ventes d'une journée
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-night border border-white/10 rounded-lg p-2.5 text-white focus:border-accent focus:outline-none transition text-sm"
          />
          <button
            onClick={imprimer}
            className="flex items-center gap-2 bg-accent hover:bg-accentDark text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
          >
            <Printer size={16} />
            Imprimer
          </button>
        </div>
      </div>

      {chargement ? (
        <div className="bg-panel rounded-2xl p-12 text-center text-gray-500 border border-white/5">
          <Loader2 size={32} className="animate-spin mx-auto mb-3" />
          Chargement du rapport...
        </div>
      ) : !rapport ? (
        <div className="bg-panel rounded-2xl p-12 text-center text-gray-500 border border-white/5">
          Impossible de charger le rapport
        </div>
      ) : (
        <div ref={printRef} className="space-y-6 print:text-black print:bg-white">
          {/* En-tête imprimable */}
          <div className="bg-panel rounded-2xl p-6 border border-white/5 print:border-black print:rounded-none">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">
                  {rapport.parametres?.nom_cyber || "Cyber Famille"}
                </h2>
                <p className="text-sm text-gray-400 print:text-gray-700">
                  Réseau : {rapport.parametres?.nom_reseau || "CYBER_FAMILLE"}
                </p>
                {rapport.parametres?.telephone && (
                  <p className="text-sm text-gray-400 print:text-gray-700">
                    Tél : {rapport.parametres.telephone}
                  </p>
                )}
                {rapport.parametres?.adresse && (
                  <p className="text-sm text-gray-400 print:text-gray-700">
                    {rapport.parametres.adresse}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase print:text-gray-700">
                  Rapport journalier
                </p>
                <p className="font-mono font-bold">
                  {new Date(rapport.date).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Totaux */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-panel rounded-2xl p-6 border border-white/5 print:border-black print:rounded-none">
              <div className="flex items-center gap-3">
                <div className="bg-accent/10 text-accent p-3 rounded-xl print:hidden">
                  <DollarSign size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase print:text-gray-700">
                    Recette totale
                  </p>
                  <p className="text-2xl font-bold text-accent">
                    {rapport.totaux.total} {rapport.parametres?.devise || "Ar"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-panel rounded-2xl p-6 border border-white/5 print:border-black print:rounded-none">
              <div className="flex items-center gap-3">
                <div className="bg-cyan/10 text-cyan p-3 rounded-xl print:hidden">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase print:text-gray-700">
                    Nombre de tickets vendus
                  </p>
                  <p className="text-2xl font-bold text-cyan">
                    {rapport.totaux.nb_ventes}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Répartition par forfait */}
          <div className="bg-panel rounded-2xl border border-white/5 overflow-hidden print:border-black print:rounded-none">
            <div className="p-5 border-b border-white/5 print:border-black">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText size={18} className="text-accent print:hidden" />
                Répartition par forfait
              </h3>
            </div>
            {rapport.par_forfait.length === 0 ? (
              <p className="p-6 text-gray-500 text-sm text-center">
                Aucune vente ce jour
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead className="bg-white/5 text-gray-400 text-xs uppercase print:bg-gray-200 print:text-black">
                    <tr>
                      <th className="text-left p-4">Forfait</th>
                      <th className="text-left p-4">Durée</th>
                      <th className="text-right p-4">Prix unitaire</th>
                      <th className="text-right p-4">Quantité</th>
                      <th className="text-right p-4">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rapport.par_forfait.map((f, i) => (
                      <tr
                        key={i}
                        className="border-t border-white/5 print:border-gray-300"
                      >
                        <td className="p-4 font-medium">{f.forfait}</td>
                        <td className="p-4 text-gray-400 print:text-gray-700">
                          {f.duree_minutes} min
                        </td>
                        <td className="p-4 text-right text-gray-400 print:text-gray-700">
                          {f.prix} {rapport.parametres?.devise || "Ar"}
                        </td>
                        <td className="p-4 text-right">{f.nb_ventes}</td>
                        <td className="p-4 text-right font-bold text-accent">
                          {f.total} {rapport.parametres?.devise || "Ar"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Répartition par caissier */}
          <div className="bg-panel rounded-2xl border border-white/5 overflow-hidden print:border-black print:rounded-none">
            <div className="p-5 border-b border-white/5 print:border-black">
              <h3 className="font-semibold flex items-center gap-2">
                <User size={18} className="text-cyan print:hidden" />
                Répartition par caissier
              </h3>
            </div>
            {rapport.par_caissier.length === 0 ? (
              <p className="p-6 text-gray-500 text-sm text-center">
                Aucune vente ce jour
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead className="bg-white/5 text-gray-400 text-xs uppercase print:bg-gray-200 print:text-black">
                    <tr>
                      <th className="text-left p-4">Caissier</th>
                      <th className="text-right p-4">Nombre de ventes</th>
                      <th className="text-right p-4">Total encaissé</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rapport.par_caissier.map((c, i) => (
                      <tr
                        key={i}
                        className="border-t border-white/5 print:border-gray-300"
                      >
                        <td className="p-4 font-medium">{c.caissier}</td>
                        <td className="p-4 text-right">{c.nb_ventes}</td>
                        <td className="p-4 text-right font-bold text-accent">
                          {c.total} {rapport.parametres?.devise || "Ar"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Détail complet */}
          <div className="bg-panel rounded-2xl border border-white/5 overflow-hidden print:border-black print:rounded-none">
            <div className="p-5 border-b border-white/5 print:border-black">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar size={18} className="text-success print:hidden" />
                Détail des ventes
              </h3>
            </div>
            {rapport.details.length === 0 ? (
              <p className="p-6 text-gray-500 text-sm text-center">
                Aucune vente ce jour
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="bg-white/5 text-gray-400 text-xs uppercase print:bg-gray-200 print:text-black">
                    <tr>
                      <th className="text-left p-4">Heure</th>
                      <th className="text-left p-4">Code ticket</th>
                      <th className="text-left p-4">Forfait</th>
                      <th className="text-left p-4">Caissier</th>
                      <th className="text-right p-4">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rapport.details.map((d, i) => (
                      <tr
                        key={i}
                        className="border-t border-white/5 print:border-gray-300"
                      >
                        <td className="p-4 font-mono text-gray-400 print:text-gray-700">
                          {new Date(d.date_vente).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="p-4 font-mono text-accent">{d.code}</td>
                        <td className="p-4">{d.forfait}</td>
                        <td className="p-4 text-gray-400 print:text-gray-700">
                          {d.caissier}
                        </td>
                        <td className="p-4 text-right font-semibold text-success">
                          {d.montant} {rapport.parametres?.devise || "Ar"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-white/5 print:bg-gray-200">
                    <tr>
                      <td
                        colSpan="4"
                        className="p-4 text-right font-semibold print:text-black"
                      >
                        TOTAL
                      </td>
                      <td className="p-4 text-right font-bold text-accent text-base">
                        {rapport.totaux.total} {rapport.parametres?.devise || "Ar"}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Pied de page imprimable */}
          <div className="hidden print:block text-center text-xs text-gray-500 pt-4">
            Rapport généré automatiquement par{" "}
            {rapport.parametres?.nom_cyber || "Cyber Famille"} —{" "}
            {new Date().toLocaleString("fr-FR")}
          </div>
        </div>
      )}
    </div>
  );
}