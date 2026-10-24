import { useEffect, useState } from "react";
import {
  Mail,
  MessageSquare,
  Save,
  Loader2,
  Send,
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BarChart3,
  Settings,
} from "lucide-react";
import api from "../api";
import { toast } from "../components/Toast";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";

export default function NotificationsExternes() {
  const [onglet, setOnglet] = useState("email");
  const [config, setConfig] = useState({ email: null, sms: null });
  const [chargement, setChargement] = useState(true);
  const [sauvegarde, setSauvegarde] = useState(false);
  const [testEnCours, setTestEnCours] = useState(false);
  const [historique, setHistorique] = useState([]);
  const [stats, setStats] = useState(null);
  const [modalTest, setModalTest] = useState(null);
  const [destinataireTest, setDestinataireTest] = useState("");

  // Formulaire email
  const [formEmail, setFormEmail] = useState({
    type: "email",
    actif: 0,
    smtp_host: "smtp.gmail.com",
    smtp_port: 587,
    smtp_user: "",
    smtp_password: "",
    smtp_secure: "tls",
    email_from: "",
    email_from_nom: "Cyber Famille",
    destinataires_email: "",
    alerte_vente: 0,
    alerte_expiration: 1,
    alerte_stock_faible: 1,
    alerte_rapport_journalier: 0,
  });

  // Formulaire SMS
  const [formSms, setFormSms] = useState({
    type: "sms",
    actif: 0,
    sms_provider: "twilio",
    sms_api_key: "",
    sms_api_secret: "",
    sms_from: "",
    destinataires_sms: "",
    alerte_vente: 0,
    alerte_expiration: 1,
    alerte_stock_faible: 1,
    alerte_rapport_journalier: 0,
  });

  const charger = async () => {
    setChargement(true);
    try {
      const [r1, r2, r3] = await Promise.all([
        api.get("/api/notifications-externes/config"),
        api.get("/api/notifications-externes/historique"),
        api.get("/api/notifications-externes/stats"),
      ]);

      setConfig(r1.data);
      if (r1.data.email) {
        setFormEmail((prev) => ({ ...prev, ...r1.data.email }));
      }
      if (r1.data.sms) {
        setFormSms((prev) => ({ ...prev, ...r1.data.sms }));
      }
      setHistorique(r2.data || []);
      setStats(r3.data);
    } catch (e) {
      toast("Erreur de chargement", "error");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const sauvegarder = async () => {
    setSauvegarde(true);
    try {
      const form = onglet === "email" ? formEmail : formSms;
      await api.post("/api/notifications-externes/config", form);
      toast("Configuration enregistrée", "success");
      charger();
    } catch (e) {
      toast("Erreur de sauvegarde", "error");
    } finally {
      setSauvegarde(false);
    }
  };

  const ouvrirTest = (type) => {
    setModalTest(type);
    setDestinataireTest(
      type === "email" ? formEmail.destinataires_email : formSms.destinataires_sms
    );
  };

  const envoyerTest = async () => {
    if (!destinataireTest) {
      toast("Destinataire requis", "warn");
      return;
    }

    setTestEnCours(true);
    try {
      const url =
        modalTest === "email"
          ? "/api/notifications-externes/test-email"
          : "/api/notifications-externes/test-sms";

      const formData = new FormData();
      formData.append("destinataire", destinataireTest);

      const r = await api.post(url, formData);
      if (r.data.success) {
        toast("Test envoyé avec succès !", "success");
      } else {
        toast(r.data.erreur || "Échec du test", "error");
      }
      setModalTest(null);
      charger();
    } catch (e) {
      toast("Erreur lors du test", "error");
    } finally {
      setTestEnCours(false);
    }
  };

  if (chargement) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center text-gray-500">
        <Loader2 size={32} className="animate-spin mx-auto mb-3 text-accent" />
        Chargement...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail size={24} className="text-accent" />
            Notifications Email & SMS
          </h1>
          <p className="text-gray-400 text-sm">
            Recevez des alertes automatiques par email ou SMS
          </p>
        </div>
        <button
          onClick={sauvegarder}
          disabled={sauvegarde}
          className="flex items-center gap-2 bg-accent hover:bg-accentDark disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition hover:scale-105"
        >
          {sauvegarde ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {sauvegarde ? "..." : "Enregistrer"}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-panel rounded-xl p-4 border border-white/5">
            <p className="text-xs text-gray-400 mb-1">Total envois</p>
            <p className="text-xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-panel rounded-xl p-4 border border-white/5">
            <p className="text-xs text-gray-400 mb-1">Emails</p>
            <p className="text-xl font-bold text-accent">{stats.email}</p>
          </div>
          <div className="bg-panel rounded-xl p-4 border border-white/5">
            <p className="text-xs text-gray-400 mb-1">SMS</p>
            <p className="text-xl font-bold text-cyan">{stats.sms}</p>
          </div>
          <div className="bg-panel rounded-xl p-4 border border-white/5">
            <p className="text-xs text-gray-400 mb-1">Échecs</p>
            <p className="text-xl font-bold text-danger">{stats.echecs}</p>
          </div>
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-2 mb-6 border-b border-white/5">
        <button
          onClick={() => setOnglet("email")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition border-b-2 -mb-px ${
            onglet === "email"
              ? "border-accent text-accent"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <Mail size={16} />
          Email (SMTP)
        </button>
        <button
          onClick={() => setOnglet("sms")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition border-b-2 -mb-px ${
            onglet === "sms"
              ? "border-accent text-accent"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <MessageSquare size={16} />
          SMS (Twilio)
        </button>
        <button
          onClick={() => setOnglet("historique")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition border-b-2 -mb-px ${
            onglet === "historique"
              ? "border-accent text-accent"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <History size={16} />
          Historique
        </button>
      </div>

      {/* Onglet Email */}
      {onglet === "email" && (
        <div className="bg-panel rounded-2xl p-6 border border-white/5 animate-slide-up">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-semibold flex items-center gap-2">
              <Settings size={18} className="text-accent" />
              Configuration SMTP
            </h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!formEmail.actif}
                onChange={(e) =>
                  setFormEmail({ ...formEmail, actif: e.target.checked ? 1 : 0 })
                }
                className="w-4 h-4 accent-accent"
              />
              <span className="text-sm">
                {formEmail.actif ? "Activé" : "Désactivé"}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Serveur SMTP
              </label>
              <input
                type="text"
                value={formEmail.smtp_host}
                onChange={(e) =>
                  setFormEmail({ ...formEmail, smtp_host: e.target.value })
                }
                placeholder="smtp.gmail.com"
                className="w-full bg-night border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Port</label>
              <input
                type="number"
                value={formEmail.smtp_port}
                onChange={(e) =>
                  setFormEmail({
                    ...formEmail,
                    smtp_port: parseInt(e.target.value),
                  })
                }
                placeholder="587"
                className="w-full bg-night border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Utilisateur (email)
              </label>
              <input
                type="text"
                value={formEmail.smtp_user}
                onChange={(e) =>
                  setFormEmail({ ...formEmail, smtp_user: e.target.value })
                }
                placeholder="ton.email@gmail.com"
                className="w-full bg-night border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                value={formEmail.smtp_password}
                onChange={(e) =>
                  setFormEmail({ ...formEmail, smtp_password: e.target.value })
                }
                placeholder="••••••••"
                className="w-full bg-night border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Sécurité
              </label>
              <select
                value={formEmail.smtp_secure}
                onChange={(e) =>
                  setFormEmail({ ...formEmail, smtp_secure: e.target.value })
                }
                className="w-full bg-night border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none"
              >
                <option value="tls">TLS (port 587)</option>
                <option value="ssl">SSL (port 465)</option>
                <option value="">Aucune</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Nom d'expéditeur
              </label>
              <input
                type="text"
                value={formEmail.email_from_nom}
                onChange={(e) =>
                  setFormEmail({ ...formEmail, email_from_nom: e.target.value })
                }
                placeholder="Cyber Famille"
                className="w-full bg-night border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              Destinataires (séparés par virgule)
            </label>
            <input
              type="text"
              value={formEmail.destinataires_email}
              onChange={(e) =>
                setFormEmail({
                  ...formEmail,
                  destinataires_email: e.target.value,
                })
              }
              placeholder="admin@cyber.mg, maman@cyber.mg"
              className="w-full bg-night border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none"
            />
          </div>

          <div className="bg-night rounded-lg p-4 border border-white/5 mb-4">
            <p className="text-sm font-medium mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-warn" />
              Types d'alertes
            </p>
            <div className="space-y-2">
              {[
                { key: "alerte_vente", label: "À chaque nouvelle vente" },
                { key: "alerte_expiration", label: "Sessions qui expirent" },
                { key: "alerte_stock_faible", label: "Stock de tickets faible" },
                { key: "alerte_rapport_journalier", label: "Rapport journalier (23h)" },
              ].map((a) => (
                <label
                  key={a.key}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={!!formEmail[a.key]}
                    onChange={(e) =>
                      setFormEmail({
                        ...formEmail,
                        [a.key]: e.target.checked ? 1 : 0,
                      })
                    }
                    className="w-4 h-4 accent-accent"
                  />
                  <span className="text-sm text-gray-300">{a.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={() => ouvrirTest("email")}
            className="w-full bg-cyan hover:bg-cyan/80 text-night font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Send size={16} />
            Tester l'envoi d'email
          </button>
        </div>
      )}

      {/* Onglet SMS */}
      {onglet === "sms" && (
        <div className="bg-panel rounded-2xl p-6 border border-white/5 animate-slide-up">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-semibold flex items-center gap-2">
              <MessageSquare size={18} className="text-cyan" />
              Configuration SMS
            </h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!formSms.actif}
                onChange={(e) =>
                  setFormSms({ ...formSms, actif: e.target.checked ? 1 : 0 })
                }
                className="w-4 h-4 accent-accent"
              />
              <span className="text-sm">
                {formSms.actif ? "Activé" : "Désactivé"}
              </span>
            </label>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              Fournisseur
            </label>
            <select
              value={formSms.sms_provider}
              onChange={(e) =>
                setFormSms({ ...formSms, sms_provider: e.target.value })
              }
              className="w-full bg-night border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none"
            >
              <option value="twilio">Twilio</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Account SID (API Key)
              </label>
              <input
                type="text"
                value={formSms.sms_api_key}
                onChange={(e) =>
                  setFormSms({ ...formSms, sms_api_key: e.target.value })
                }
                className="w-full bg-night border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Auth Token (API Secret)
              </label>
              <input
                type="password"
                value={formSms.sms_api_secret}
                onChange={(e) =>
                  setFormSms({ ...formSms, sms_api_secret: e.target.value })
                }
                placeholder="••••••••"
                className="w-full bg-night border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              Numéro expéditeur
            </label>
            <input
              type="text"
              value={formSms.sms_from}
              onChange={(e) =>
                setFormSms({ ...formSms, sms_from: e.target.value })
              }
              placeholder="+1234567890"
              className="w-full bg-night border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              Destinataires (séparés par virgule)
            </label>
            <input
              type="text"
              value={formSms.destinataires_sms}
              onChange={(e) =>
                setFormSms({ ...formSms, destinataires_sms: e.target.value })
              }
              placeholder="+261341234567, +261331234567"
              className="w-full bg-night border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none"
            />
          </div>

          <div className="bg-night rounded-lg p-4 border border-white/5 mb-4">
            <p className="text-sm font-medium mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-warn" />
              Types d'alertes SMS
            </p>
            <div className="space-y-2">
              {[
                { key: "alerte_vente", label: "À chaque nouvelle vente" },
                { key: "alerte_expiration", label: "Sessions qui expirent" },
                { key: "alerte_stock_faible", label: "Stock de tickets faible" },
                { key: "alerte_rapport_journalier", label: "Rapport journalier (23h)" },
              ].map((a) => (
                <label
                  key={a.key}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={!!formSms[a.key]}
                    onChange={(e) =>
                      setFormSms({
                        ...formSms,
                        [a.key]: e.target.checked ? 1 : 0,
                      })
                    }
                    className="w-4 h-4 accent-accent"
                  />
                  <span className="text-sm text-gray-300">{a.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={() => ouvrirTest("sms")}
            className="w-full bg-cyan hover:bg-cyan/80 text-night font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Send size={16} />
            Tester l'envoi de SMS
          </button>
        </div>
      )}

      {/* Onglet Historique */}
      {onglet === "historique" && (
        <div className="bg-panel rounded-2xl border border-white/5 overflow-hidden animate-slide-up">
          <div className="p-5 border-b border-white/5">
            <h3 className="font-semibold flex items-center gap-2">
              <History size={18} className="text-accent" />
              Historique des envois (50 derniers)
            </h3>
          </div>

          {historique.length === 0 ? (
            <EmptyState
              icon={History}
              titre="Aucun envoi"
              sousTitre="Les notifications envoyées apparaîtront ici"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                  <tr>
                    <th className="text-left p-4">Date</th>
                    <th className="text-left p-4">Type</th>
                    <th className="text-left p-4">Sujet</th>
                    <th className="text-left p-4">Destinataires</th>
                    <th className="text-left p-4">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {historique.map((h) => (
                    <tr
                      key={h.id}
                      className="border-t border-white/5 hover:bg-white/5 transition"
                    >
                      <td className="p-4 text-gray-400 text-xs">
                        {new Date(h.cree_le).toLocaleString("fr-FR")}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            h.type === "email"
                              ? "bg-accent/20 text-accent"
                              : "bg-cyan/20 text-cyan"
                          }`}
                        >
                          {h.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 truncate max-w-[200px]">
                        {h.sujet}
                      </td>
                      <td className="p-4 text-gray-400 text-xs truncate max-w-[200px]">
                        {h.destinataires}
                      </td>
                      <td className="p-4">
                        {h.statut === "reussi" ? (
                          <span className="flex items-center gap-1 text-success text-xs">
                            <CheckCircle2 size={14} />
                            Réussi
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-danger text-xs">
                            <XCircle size={14} />
                            Échoué
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Test */}
      <Modal
        ouvert={!!modalTest}
        onClose={() => setModalTest(null)}
        titre={`Tester l'envoi ${modalTest === "email" ? "d'email" : "de SMS"}`}
        icon={Send}
        couleur="cyan"
        taille="sm"
      >
        <label className="block text-sm text-gray-400 mb-2">
          Destinataire de test
        </label>
        <input
          type="text"
          value={destinataireTest}
          onChange={(e) => setDestinataireTest(e.target.value)}
          placeholder={
            modalTest === "email" ? "test@example.com" : "+261341234567"
          }
          className="w-full bg-night border border-white/10 rounded-lg p-3 mb-6 text-white focus:border-accent focus:outline-none"
        />

        <div className="flex gap-3">
          <button
            onClick={() => setModalTest(null)}
            className="flex-1 bg-white/5 hover:bg-white/10 text-sm font-medium py-3 rounded-lg transition"
          >
            Annuler
          </button>
          <button
            onClick={envoyerTest}
            disabled={testEnCours}
            className="flex-1 bg-cyan hover:bg-cyan/80 disabled:opacity-50 text-night font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            {testEnCours ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {testEnCours ? "..." : "Envoyer"}
          </button>
        </div>
      </Modal>
    </div>
  );
}