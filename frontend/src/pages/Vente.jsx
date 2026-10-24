import { useEffect, useState, useRef } from "react";
import {
  Printer,
  Ticket as TicketIcon,
  Loader2,
  Receipt,
  Send,
  User,
} from "lucide-react";
import api from "../api";
import TicketImprimable from "../components/TicketImprimable";
import RecuImprimable from "../components/RecuImprimable";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import { toast } from "../components/Toast";
import { useLanguage } from "../context/LanguageContext";

export default function Vente() {
  const { t } = useLanguage();
  const [forfaits, setForfaits] = useState([]);
  const [forfaitId, setForfaitId] = useState("");
  const [quantite, setQuantite] = useState(1);
  const [tickets, setTickets] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [impressionEnCours, setImpressionEnCours] = useState(false);

  const [modalOuvert, setModalOuvert] = useState(false);
  const [clientNom, setClientNom] = useState("");
  const [clientTel, setClientTel] = useState("");
  const [remarque, setRemarque] = useState("");
  const [recu, setRecu] = useState(null);
  const [chargementRecu, setChargementRecu] = useState(false);

  const ticketRef = useRef();
  const recuRef = useRef();

  useEffect(() => {
    api
      .get("/api/forfaits")
      .then((r) => setForfaits(r.data))
      .catch(() => {
        setForfaits([
          { id: 1, nom: "Petit forfait", duree_minutes: 60, prix: 500 },
          { id: 2, nom: "Forfait moyen", duree_minutes: 120, prix: 1000 },
          { id: 3, nom: "Forfait longue durée", duree_minutes: 240, prix: 2000 },
        ]);
      });
  }, []);

  const creerTickets = async () => {
    if (!forfaitId) return;
    setErreur("");
    setChargement(true);
    try {
      const res = await api.post("/api/tickets/creer", {
        forfait_id: forfaitId,
        quantite: quantite,
        admin_id: 1,
      });
      setTickets(res.data.tickets);
      toast(`${res.data.tickets.length} ${t("vente.ticketCree")}`, "success");
      if (res.data.tickets.length > 0) setModalOuvert(true);
    } catch (e) {
      setErreur(e.response?.data?.erreur || t("commun.erreur"));
    } finally {
      setChargement(false);
    }
  };

  const enregistrerClient = async () => {
    if (!tickets[0]?.id) return;
    setChargementRecu(true);
    try {
      const vente = await api.get("/api/recu/dernier");
      const vente_id = vente.data.vente_id;
      await api.post("/api/recu/client", {
        vente_id,
        nom_client: clientNom,
        telephone: clientTel,
        remarque,
      });
      const recuComplet = await api.get(`/api/recu?vente_id=${vente_id}`);
      setRecu(recuComplet.data);
      toast(t("commun.succes"), "success");
    } catch (e) {
      toast(t("commun.erreur"), "error");
    } finally {
      setChargementRecu(false);
    }
  };

  const imprimerDirectement = async () => {
    if (tickets.length === 0) return;
    setImpressionEnCours(true);
    let succes = 0,
      erreurs = 0;
    for (const t2 of tickets) {
      try {
        const r = await api.post("/api/impression/ticket", { ticket_id: t2.id });
        if (r.data.success) succes++;
        else erreurs++;
      } catch {
        erreurs++;
      }
    }
    setImpressionEnCours(false);
    toast(
      erreurs === 0
        ? `${succes} ${t("vente.ticketEnvoye")}`
        : `${succes} OK, ${erreurs} KO`,
      erreurs > 0 ? "warn" : "success"
    );
  };

  const forfaitSelectionne = forfaits.find((f) => f.id == forfaitId);

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="mb-6 animate-slide-up">
        <h1 className="text-2xl font-bold mb-1">{t("vente.titre")}</h1>
        <p className="text-gray-400 text-sm">{t("vente.sousTitre")}</p>
      </div>

      {erreur && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3 mb-4 animate-slide-down">
          {erreur}
        </div>
      )}

      {/* Formulaire */}
      <div className="bg-panel rounded-2xl p-6 border border-white/5 max-w-2xl animate-slide-up stagger-1">
        <label className="block text-sm text-gray-400 mb-2">
          {t("vente.forfait")}
        </label>
        <select
          value={forfaitId}
          onChange={(e) => setForfaitId(e.target.value)}
          className="w-full bg-night border border-white/10 rounded-lg p-3 mb-4 text-white focus:border-accent focus:outline-none transition"
        >
          <option value="">{t("vente.choisirForfait")}</option>
          {forfaits.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nom} — {f.duree_minutes} min — {f.prix} Ar
            </option>
          ))}
        </select>

        <label className="block text-sm text-gray-400 mb-2">
          {t("vente.quantite")}
        </label>
        <input
          type="number"
          min="1"
          value={quantite}
          onChange={(e) => setQuantite(Number(e.target.value))}
          className="w-full bg-night border border-white/10 rounded-lg p-3 mb-6 text-white focus:border-accent focus:outline-none transition"
        />

        <button
          onClick={creerTickets}
          disabled={!forfaitId || chargement}
          className="w-full bg-accent hover:bg-accentDark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 hover:scale-[1.02]"
        >
          {chargement ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <TicketIcon size={18} />
          )}
          {chargement ? t("vente.creationEnCours") : t("vente.creerTickets")}
        </button>

        {forfaitSelectionne && (
          <div className="mt-4 bg-night rounded-lg p-3 border border-white/5 text-sm animate-slide-down">
            <div className="flex justify-between">
              <span className="text-gray-400">{t("vente.totalAEncaisser")}</span>
              <span className="font-bold text-accent">
                {forfaitSelectionne.prix * quantite} Ar
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tickets créés */}
      {tickets.length > 0 && (
        <>
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 mb-4 animate-slide-up stagger-2">
            <button
              onClick={imprimerDirectement}
              disabled={impressionEnCours}
              className="flex items-center justify-center gap-2 bg-success hover:bg-success/80 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg transition hover:scale-105"
            >
              {impressionEnCours ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
              {impressionEnCours
                ? t("vente.envoiEnCours")
                : t("vente.imprimerDirectement")}
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 bg-cyan hover:bg-cyan/80 text-night font-semibold px-5 py-2.5 rounded-lg transition hover:scale-105"
            >
              <Printer size={18} />
              {t("vente.imprimerTickets")}
            </button>

            <button
              onClick={() => setModalOuvert(true)}
              className="flex items-center justify-center gap-2 bg-accent hover:bg-accentDark text-white font-semibold px-5 py-2.5 rounded-lg transition hover:scale-105"
            >
              <Receipt size={18} />
              {t("vente.genererRecu")}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tickets.map((t2, i) => (
              <div
                key={i}
                className="bg-white text-black rounded-xl p-4 border-4 border-accent hover-lift animate-slide-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <h3 className="text-center font-bold text-accent">
                  CYBER FAMILLE
                </h3>
                <p className="text-center text-xs mb-3">
                  TICKET DE CONNEXION WI-FI
                </p>
                <div className="space-y-1 text-sm">
                  <p>
                    <b>{t("vente.code")} :</b> {t2.code}
                  </p>
                  <p>
                    <b>{t("vente.motDePasse")} :</b> {t2.mot_de_passe}
                  </p>
                  <p>
                    <b>{t("vente.duree")} :</b> {t2.duree} min
                  </p>
                  <p>
                    <b>{t("vente.prix")} :</b> {t2.prix} Ar
                  </p>
                </div>
              </div>
            ))}
          </div>

          <TicketImprimable ref={ticketRef} tickets={tickets} />
        </>
      )}

      {/* Modal Reçu */}
      <Modal
        ouvert={modalOuvert}
        onClose={() => {
          setModalOuvert(false);
          setRecu(null);
        }}
        titre={recu ? "Reçu prêt à imprimer" : "Informations du client"}
        sousTitre="Optionnel — pour le reçu"
        icon={User}
        couleur="accent"
      >
        {!recu ? (
          <>
            <label className="block text-sm text-gray-400 mb-2">
              Nom du client
            </label>
            <input
              type="text"
              value={clientNom}
              onChange={(e) => setClientNom(e.target.value)}
              placeholder="Rakoto"
              className="w-full bg-night border border-white/10 rounded-lg p-3 mb-4 text-white focus:border-accent focus:outline-none"
            />

            <label className="block text-sm text-gray-400 mb-2">
              Téléphone
            </label>
            <input
              type="text"
              value={clientTel}
              onChange={(e) => setClientTel(e.target.value)}
              placeholder="034 00 000 00"
              className="w-full bg-night border border-white/10 rounded-lg p-3 mb-4 text-white focus:border-accent focus:outline-none"
            />

            <label className="block text-sm text-gray-400 mb-2">Remarque</label>
            <textarea
              value={remarque}
              onChange={(e) => setRemarque(e.target.value)}
              rows="2"
              className="w-full bg-night border border-white/10 rounded-lg p-3 mb-6 text-white focus:border-accent focus:outline-none resize-none"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setModalOuvert(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-sm font-medium py-3 rounded-lg transition"
              >
                {t("commun.annuler")}
              </button>
              <button
                onClick={enregistrerClient}
                disabled={chargementRecu}
                className="flex-1 bg-accent hover:bg-accentDark disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                {chargementRecu ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Receipt size={16} />
                )}
                {chargementRecu ? "..." : t("vente.genererRecu")}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-night rounded-lg p-4 border border-white/5 mb-4 text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">N° Reçu</span>
                <span className="font-mono text-accent">{recu.numero_recu}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Client</span>
                <span>{recu.nom_client || "—"}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/5">
                <span className="text-gray-400">Total</span>
                <span className="font-bold text-accent">
                  {recu.montant} {recu.devise}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRecu(null);
                  setModalOuvert(false);
                }}
                className="flex-1 bg-white/5 hover:bg-white/10 text-sm font-medium py-3 rounded-lg transition"
              >
                {t("commun.fermer")}
              </button>
              <button
                onClick={() => setTimeout(() => window.print(), 100)}
                className="flex-1 bg-accent hover:bg-accentDark text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                <Printer size={16} />
                {t("rapport.imprimer")}
              </button>
            </div>
          </>
        )}
      </Modal>

      {recu && <RecuImprimable ref={recuRef} recu={recu} />}
    </div>
  );
}