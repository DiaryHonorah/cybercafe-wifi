import { useState } from "react";
import {
  FileText,
  Download,
  Calendar,
  Loader2,
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import api from "../api";
import { toast } from "../components/Toast";
import { genererPDF } from "../utils/pdfGenerator";

export default function RapportPDF() {
  const [type, setType] = useState("journalier");
  const [debut, setDebut] = useState(new Date().toISOString().slice(0, 10));
  const [fin, setFin] = useState(new Date().toISOString().slice(0, 10));
  const [chargement, setChargement] = useState(false);
  const [apercu, setApercu] = useState(null);

  // ==========================================
  // CHANGER LE TYPE → METTRE À JOUR LES DATES
  // ==========================================
  const changerType = (nouveauType) => {
    setType(nouveauType);
    const aujourdhui = new Date();

    if (nouveauType === "journalier") {
      const d = aujourdhui.toISOString().slice(0, 10);
      setDebut(d);
      setFin(d);
    } else if (nouveauType === "hebdomadaire") {
      const debutSemaine = new Date(aujourdhui);
      debutSemaine.setDate(aujourdhui.getDate() - 6);
      setDebut(debutSemaine.toISOString().slice(0, 10));
      setFin(aujourdhui.toISOString().slice(0, 10));
    } else if (nouveauType === "mensuel") {
      const debutMois = new Date(aujourdhui);
      debutMois.setDate(aujourdhui.getDate() - 29);
      setDebut(debutMois.toISOString().slice(0, 10));
      setFin(aujourdhui.toISOString().slice(0, 10));
    }
  };

  // ==========================================
  // CHARGER L'APERÇU
  // ==========================================
  const chargerApercu = async () => {
    setChargement(true);
    try {
      const r = await api.get(
        `/api/rapport-pdf?debut=${debut}&fin=${fin}&type=${type}`
      );
      setApercu(r.data);
      toast("Aperçu chargé", "success");
    } catch (e) {
      toast("Erreur de chargement", "error");
    } finally {
      setChargement(false);
    }
  };

  // ==========================================
  // GÉNÉRER LE PDF
  // ==========================================
  const telechargerPDF = () => {
    if (!apercu) {
      toast("Chargez d'abord l'aperçu", "warn");
      return;
    }
    try {
      genererPDF(apercu, type);
      toast("PDF généré avec succès", "success");
    } catch (e) {
      console.error(e);
      toast("Erreur lors de la génération", "error");
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText size={24} className="text-accent" />
            Rapports PDF
          </h1>
          <p className="text-gray-400 text-sm">
            Générez des rapports professionnels pour votre comptabilité
          </p>
        </div>
        <button
          onClick={telechargerPDF}
          disabled={!apercu || chargement}
          className="flex items-center gap-2 bg-accent hover:bg-accentDark disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition hover:scale-105"
        >
          <Download size={16} />
          Télécharger le PDF
        </button>
      </div>

      {/* Choix du type */}
      <div className="bg-panel rounded-2xl p-6 border border-white/5 mb-6 animate-slide-up stagger-1">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-accent" />
          Type de rapport
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {[
            {
              key: "journalier",
              label: "Journalier",
              desc: "Ventes d'une journée",
              icone: "📅",
            },
            {
              key: "hebdomadaire",
              label: "Hebdomadaire",
              desc: "7 derniers jours",
              icone: "📊",
            },
            {
              key: "mensuel",
              label: "Mensuel",
              desc: "30 derniers jours",
              icone: "📈",
            },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => changerType(t.key)}
              className={`p-4 rounded-xl border-2 transition-all text-left hover:scale-105 ${
                type === t.key
                  ? "border-accent bg-accent/10 shadow-lg shadow-accent/20"
                  : "border-white/5 bg-night hover:border-accent/30"
              }`}
            >
              <div className="text-2xl mb-2">{t.icone}</div>
              <p
                className={`font-semibold text-sm mb-1 ${
                  type === t.key ? "text-accent" : "text-white"
                }`}
              >
                {t.label}
              </p>
              <p className="text-xs text-gray-500">{t.desc}</p>
            </button>
          ))}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Date de début
            </label>
            <input
              type="date"
              value={debut}
              onChange={(e) => setDebut(e.target.value)}
              className="w-full bg-night border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Date de fin
            </label>
            <input
              type="date"
              value={fin}
              onChange={(e) => setFin(e.target.value)}
              className="w-full bg-night border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={chargerApercu}
          disabled={chargement}
          className="w-full bg-cyan hover:bg-cyan/80 disabled:opacity-50 text-night font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
        >
          {chargement ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <BarChart3 size={18} />
          )}
          {chargement ? "Chargement..." : "Charger l'aperçu"}
        </button>
      </div>

      {/* Aperçu */}
      {apercu && (
        <>
          {/* Totaux */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-slide-up stagger-2">
            <div className="bg-panel rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="bg-accent/10 text-accent p-3 rounded-xl">
                  <DollarSign size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">
                    Recette totale
                  </p>
                  <p className="text-xl font-bold text-accent">
                    {Number(apercu.totaux.total).toLocaleString("fr-FR")} Ar
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-panel rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="bg-cyan/10 text-cyan p-3 rounded-xl">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">
                    Ventes
                  </p>
                  <p className="text-xl font-bold text-cyan">
                    {apercu.totaux.nb_ventes}
                  </p>
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
                    Tickets
                  </p>
                  <p className="text-xl font-bold text-success">
                    {apercu.totaux.nb_tickets}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Répartition par forfait */}
          {apercu.par_forfait.length > 0 && (
            <div className="bg-panel rounded-2xl border border-white/5 overflow-hidden mb-6 animate-slide-up stagger-3">
              <div className="p-5 border-b border-white/5">
                <h3 className="font-semibold flex items-center gap-2">
                  <BarChart3 size={18} className="text-accent" />
                  Répartition par forfait
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                    <tr>
                      <th className="text-left p-4">Forfait</th>
                      <th className="text-left p-4">Durée</th>
                      <th className="text-right p-4">Quantité</th>
                      <th className="text-right p-4">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apercu.par_forfait.map((f, i) => (
                      <tr
                        key={i}
                        className="border-t border-white/5 hover:bg-white/5 transition"
                      >
                        <td className="p-4 font-medium">{f.forfait}</td>
                        <td className="p-4 text-gray-400">
                          {f.duree_minutes} min
                        </td>
                        <td className="p-4 text-right">{f.nb_ventes}</td>
                        <td className="p-4 text-right font-bold text-accent">
                          {Number(f.total).toLocaleString("fr-FR")} Ar
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Répartition par caissier */}
          {apercu.par_caissier.length > 0 && (
            <div className="bg-panel rounded-2xl border border-white/5 overflow-hidden mb-6 animate-slide-up stagger-4">
              <div className="p-5 border-b border-white/5">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users size={18} className="text-cyan" />
                  Répartition par caissier
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                    <tr>
                      <th className="text-left p-4">Caissier</th>
                      <th className="text-right p-4">Nombre de ventes</th>
                      <th className="text-right p-4">Total encaissé</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apercu.par_caissier.map((c, i) => (
                      <tr
                        key={i}
                        className="border-t border-white/5 hover:bg-white/5 transition"
                      >
                        <td className="p-4 font-medium">{c.caissier}</td>
                        <td className="p-4 text-right">{c.nb_ventes}</td>
                        <td className="p-4 text-right font-bold text-success">
                          {Number(c.total).toLocaleString("fr-FR")} Ar
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Message */}
          <div className="bg-cyan/5 border border-cyan/20 rounded-2xl p-4 mb-6 text-sm text-cyan flex items-start gap-3 animate-slide-up stagger-5">
            <FileText size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Aperçu prêt !</p>
              <p className="text-xs text-gray-400">
                Cliquez sur <b>Télécharger le PDF</b> pour générer un rapport
                professionnel avec toutes les données.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Aucun aperçu */}
      {!apercu && !chargement && (
        <div className="bg-panel rounded-2xl p-12 border border-white/5 text-center animate-fade-in">
          <FileText size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">
            Sélectionnez un type de rapport et cliquez sur
          </p>
          <p className="text-accent font-semibold">Charger l'aperçu</p>
        </div>
      )}
    </div>
  );
}