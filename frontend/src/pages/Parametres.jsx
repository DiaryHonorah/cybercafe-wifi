import { useEffect, useState } from "react";
import {
  Save,
  Wifi,
  CheckCircle2,
  XCircle,
  Loader2,
  Router,
  Settings as SettingsIcon,
  Building2,
  Printer,
  QrCode,
} from "lucide-react";
import api from "../api";
import { toast } from "../components/Toast";

export default function Parametres() {
  const [onglet, setOnglet] = useState("systeme");

  const [config, setConfig] = useState({
    host: "192.168.88.1",
    port: 8728,
    username: "admin",
    password: "",
    hotspot_server: "hotspot1",
    actif: 0,
  });
  const [sauvegarde, setSauvegarde] = useState(false);
  const [test, setTest] = useState(null);

  const [systeme, setSysteme] = useState({
    nom_cyber: "Cyber Famille",
    nom_reseau: "CYBER_FAMILLE",
    devise: "Ar",
    message_bienvenue: "Bienvenue chez Cyber Famille !",
    telephone: "",
    adresse: "",
    imprimante_ip: "",
    imprimante_port: 9100,
    imprimante_active: 0,
    imprimante_largeur: 32,
  });
  const [sauvegardeSysteme, setSauvegardeSysteme] = useState(false);
  const [testImprimante, setTestImprimante] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/api/hotspot/config").catch(() => ({ data: {} })),
      api.get("/api/parametres").catch(() => ({ data: {} })),
    ]).then(([r1, r2]) => {
      setConfig((prev) => ({ ...prev, ...(r1.data || {}) }));
      setSysteme((prev) => ({ ...prev, ...(r2.data || {}) }));
    });
  }, []);

  const sauvegarderRouteur = async () => {
    setSauvegarde(true);
    try {
      await api.post("/api/hotspot/config", config);
      toast("Configuration routeur enregistrée", "success");
    } catch {
      toast("Erreur lors de la sauvegarde", "error");
    } finally {
      setSauvegarde(false);
    }
  };

  const sauvegarderSysteme = async () => {
    setSauvegardeSysteme(true);
    try {
      await api.post("/api/parametres", systeme);
      toast("Paramètres enregistrés", "success");
    } catch {
      toast("Erreur lors de la sauvegarde", "error");
    } finally {
      setSauvegardeSysteme(false);
    }
  };

  const testerRouteur = async () => {
    setTest({ chargement: true });
    try {
      const r = await api.post("/api/hotspot/tester");
      setTest({ chargement: false, ...r.data });
    } catch {
      setTest({
        chargement: false,
        connecte: false,
        message: "Erreur lors du test",
      });
    }
  };

  const testerImprimante = async () => {
    setTestImprimante({ chargement: true });
    try {
      const r = await api.post("/api/impression/tester");
      setTestImprimante({ chargement: false, ...r.data });
    } catch {
      setTestImprimante({
        chargement: false,
        connecte: false,
        message: "Erreur lors du test",
      });
    }
  };

  const imprimerTest = async () => {
    try {
      const r = await api.post("/api/impression/test");
      if (r.data.success) {
        toast(r.data.message, "success");
      } else {
        toast("Échec du test", "error");
      }
    } catch {
      toast("Erreur lors du test", "error");
    }
  };

  const OngletBouton = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setOnglet(id)}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition border-b-2 -mb-px whitespace-nowrap ${
        onglet === id
          ? "border-accent text-accent"
          : "border-transparent text-gray-400 hover:text-white"
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-gray-400 text-sm">
          Configuration du système, du routeur et de l'imprimante
        </p>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 mb-6 border-b border-white/5 overflow-x-auto">
        <OngletBouton id="systeme" icon={Building2} label="Système" />
        <OngletBouton id="routeur" icon={Router} label="Routeur MikroTik" />
        <OngletBouton id="imprimante" icon={Printer} label="Imprimante" />
      </div>

      {/* ===== Système ===== */}
      {onglet === "systeme" && (
        <div className="bg-panel rounded-2xl p-6 border border-white/5 max-w-2xl">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <SettingsIcon size={18} className="text-accent" />
            Informations du cybercafé
          </h2>

          <label className="block text-sm text-gray-400 mb-2">
            Nom du cybercafé
          </label>
          <input
            type="text"
            value={systeme.nom_cyber || ""}
            onChange={(e) =>
              setSysteme({ ...systeme, nom_cyber: e.target.value })
            }
            className="w-full bg-night border border-white/10 rounded-lg p-3 mb-4 text-white focus:border-accent focus:outline-none transition"
          />

          <label className="block text-sm text-gray-400 mb-2">
            Nom du réseau Wi-Fi
          </label>
          <input
            type="text"
            value={systeme.nom_reseau || ""}
            onChange={(e) =>
              setSysteme({
                ...systeme,
                nom_reseau: e.target.value.toUpperCase(),
              })
            }
            className="w-full bg-night border border-white/10 rounded-lg p-3 mb-4 text-white font-mono focus:border-accent focus:outline-none transition"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Devise</label>
              <input
                type="text"
                value={systeme.devise || ""}
                onChange={(e) =>
                  setSysteme({ ...systeme, devise: e.target.value })
                }
                className="w-full bg-night border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Téléphone
              </label>
              <input
                type="text"
                value={systeme.telephone || ""}
                onChange={(e) =>
                  setSysteme({ ...systeme, telephone: e.target.value })
                }
                className="w-full bg-night border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition"
              />
            </div>
          </div>

          <label className="block text-sm text-gray-400 mb-2">Adresse</label>
          <input
            type="text"
            value={systeme.adresse || ""}
            onChange={(e) => setSysteme({ ...systeme, adresse: e.target.value })}
            className="w-full bg-night border border-white/10 rounded-lg p-3 mb-4 text-white focus:border-accent focus:outline-none transition"
          />

          <label className="block text-sm text-gray-400 mb-2">
            Message de bienvenue (portail)
          </label>
          <textarea
            value={systeme.message_bienvenue || ""}
            onChange={(e) =>
              setSysteme({ ...systeme, message_bienvenue: e.target.value })
            }
            rows="3"
            className="w-full bg-night border border-white/10 rounded-lg p-3 mb-6 text-white focus:border-accent focus:outline-none transition resize-none"
          />

          <button
            onClick={sauvegarderSysteme}
            disabled={sauvegardeSysteme}
            className="w-full bg-accent hover:bg-accentDark disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            {sauvegardeSysteme ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {sauvegardeSysteme ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      )}

      {/* ===== Routeur ===== */}
      {onglet === "routeur" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-panel rounded-2xl p-6 border border-white/5">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Router size={18} className="text-accent" />
              Connexion au routeur
            </h2>

            <label className="block text-sm text-gray-400 mb-2">
              Adresse IP du routeur
            </label>
            <input
              type="text"
              value={config.host || ""}
              onChange={(e) => setConfig({ ...config, host: e.target.value })}
              placeholder="192.168.88.1"
              className="w-full bg-night border border-white/10 rounded-lg p-3 mb-4 text-white focus:border-accent focus:outline-none transition"
            />

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Port API
                </label>
                <input
                  type="number"
                  value={config.port || 8728}
                  onChange={(e) =>
                    setConfig({ ...config, port: parseInt(e.target.value) })
                  }
                  className="w-full bg-night border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Nom du Hotspot
                </label>
                <input
                  type="text"
                  value={config.hotspot_server || ""}
                  onChange={(e) =>
                    setConfig({ ...config, hotspot_server: e.target.value })
                  }
                  className="w-full bg-night border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition"
                />
              </div>
            </div>

            <label className="block text-sm text-gray-400 mb-2">
              Utilisateur API
            </label>
            <input
              type="text"
              value={config.username || ""}
              onChange={(e) =>
                setConfig({ ...config, username: e.target.value })
              }
              className="w-full bg-night border border-white/10 rounded-lg p-3 mb-4 text-white focus:border-accent focus:outline-none transition"
            />

            <label className="block text-sm text-gray-400 mb-2">
              Mot de passe API
            </label>
            <input
              type="password"
              value={config.password || ""}
              onChange={(e) =>
                setConfig({ ...config, password: e.target.value })
              }
              placeholder="••••••••"
              className="w-full bg-night border border-white/10 rounded-lg p-3 mb-4 text-white focus:border-accent focus:outline-none transition"
            />

            <label className="flex items-center gap-3 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={!!config.actif}
                onChange={(e) =>
                  setConfig({ ...config, actif: e.target.checked ? 1 : 0 })
                }
                className="w-4 h-4 accent-accent"
              />
              <span className="text-sm">Activer la communication routeur</span>
            </label>

            <button
              onClick={sauvegarderRouteur}
              disabled={sauvegarde}
              className="w-full bg-accent hover:bg-accentDark disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {sauvegarde ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {sauvegarde ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>

          <div className="bg-panel rounded-2xl p-6 border border-white/5">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Wifi size={18} className="text-cyan" />
              Test de connexion routeur
            </h2>

            <button
              onClick={testerRouteur}
              disabled={test?.chargement}
              className="w-full bg-cyan hover:bg-cyan/80 disabled:opacity-50 text-night font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 mb-4"
            >
              {test?.chargement ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Wifi size={18} />
              )}
              {test?.chargement ? "Test en cours..." : "Tester la connexion"}
            </button>

            {test && !test.chargement && (
              <div
                className={`rounded-lg p-4 border ${
                  test.connecte
                    ? "bg-success/10 border-success/30"
                    : "bg-warn/10 border-warn/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {test.connecte ? (
                    <CheckCircle2 size={18} className="text-success" />
                  ) : (
                    <XCircle size={18} className="text-warn" />
                  )}
                  <span className="font-medium text-sm">
                    {test.connecte ? "Connecté" : "Non connecté"}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{test.message}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== Imprimante ===== */}
      {onglet === "imprimante" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-panel rounded-2xl p-6 border border-white/5">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Printer size={18} className="text-accent" />
              Imprimante thermique réseau
            </h2>

            <label className="block text-sm text-gray-400 mb-2">
              Adresse IP de l'imprimante
            </label>
            <input
              type="text"
              value={systeme.imprimante_ip || ""}
              onChange={(e) =>
                setSysteme({ ...systeme, imprimante_ip: e.target.value })
              }
              placeholder="192.168.1.100"
              className="w-full bg-night border border-white/10 rounded-lg p-3 mb-4 text-white focus:border-accent focus:outline-none transition"
            />

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Port
                </label>
                <input
                  type="number"
                  value={systeme.imprimante_port || 9100}
                  onChange={(e) =>
                    setSysteme({
                      ...systeme,
                      imprimante_port: parseInt(e.target.value),
                    })
                  }
                  className="w-full bg-night border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Largeur (caractères)
                </label>
                <input
                  type="number"
                  value={systeme.imprimante_largeur || 32}
                  onChange={(e) =>
                    setSysteme({
                      ...systeme,
                      imprimante_largeur: parseInt(e.target.value),
                    })
                  }
                  className="w-full bg-night border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={!!systeme.imprimante_active}
                onChange={(e) =>
                  setSysteme({
                    ...systeme,
                    imprimante_active: e.target.checked ? 1 : 0,
                  })
                }
                className="w-4 h-4 accent-accent"
              />
              <span className="text-sm">
                Activer l'impression directe (ESC/POS)
              </span>
            </label>

            <button
              onClick={sauvegarderSysteme}
              disabled={sauvegardeSysteme}
              className="w-full bg-accent hover:bg-accentDark disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {sauvegardeSysteme ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {sauvegardeSysteme ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>

          <div className="bg-panel rounded-2xl p-6 border border-white/5">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Printer size={18} className="text-cyan" />
              Test d'imprimante
            </h2>

            <button
              onClick={testerImprimante}
              disabled={testImprimante?.chargement}
              className="w-full bg-cyan hover:bg-cyan/80 disabled:opacity-50 text-night font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 mb-3"
            >
              {testImprimante?.chargement ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Wifi size={18} />
              )}
              {testImprimante?.chargement
                ? "Test en cours..."
                : "Tester la connexion"}
            </button>

            <button
              onClick={imprimerTest}
              className="w-full bg-white/5 hover:bg-white/10 text-sm font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2 mb-4"
            >
              <Printer size={16} />
              Imprimer un ticket de test
            </button>

            {testImprimante && !testImprimante.chargement && (
              <div
                className={`rounded-lg p-4 border ${
                  testImprimante.connecte
                    ? "bg-success/10 border-success/30"
                    : "bg-warn/10 border-warn/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {testImprimante.connecte ? (
                    <CheckCircle2 size={18} className="text-success" />
                  ) : (
                    <XCircle size={18} className="text-warn" />
                  )}
                  <span className="font-medium text-sm">
                    {testImprimante.connecte ? "Joignable" : "Non joignable"}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{testImprimante.message}</p>
              </div>
            )}

            <div className="mt-6 bg-night rounded-lg p-4 border border-white/5">
              <p className="text-xs text-gray-400 mb-2 font-medium flex items-center gap-2">
                <QrCode size={14} className="text-accent" />
                Info
              </p>
              <p className="text-xs text-gray-500">
                Sans imprimante configurée, le système fonctionne en{" "}
                <b className="text-warn">mode simulation</b> : les impressions
                sont journalisées dans les logs sans planter.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}