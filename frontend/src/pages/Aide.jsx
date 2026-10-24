import { useState } from "react";
import {
  BookOpen,
  HelpCircle,
  Wifi,
  Ticket,
  Users,
  DollarSign,
  BarChart3,
  Printer,
  Router,
  Database,
  ChevronRight,
  Search,
  Shield,
  Mail,
  FileText,
  Store,
  MonitorSmartphone,
} from "lucide-react";

export default function Aide() {
  const [recherche, setRecherche] = useState("");
  const [sectionOuverte, setSectionOuverte] = useState("demarrage");

  const sections = [
    {
      id: "demarrage",
      titre: "Démarrage rapide",
      icone: BookOpen,
      couleur: "accent",
      contenu: (
        <div className="space-y-4 text-sm text-gray-300">
          <div>
            <h4 className="font-semibold text-white mb-2">1. Démarrer les services</h4>
            <p>Double-cliquez sur <code className="bg-night px-2 py-1 rounded text-accent">demarrer_tout.bat</code> dans le dossier principal.</p>
            <p className="mt-2">Cela lance :</p>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>Apache et MySQL (XAMPP)</li>
              <li>Le serveur WebSocket</li>
              <li>Le frontend React</li>
              <li>Le navigateur s'ouvre automatiquement</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">2. Se connecter</h4>
            <p>Ouvrez <code className="bg-night px-2 py-1 rounded text-accent">http://localhost:5173</code></p>
            <p className="mt-2">Utilisez vos identifiants admin.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">3. Vendre un ticket</h4>
            <ol className="list-decimal list-inside ml-4 space-y-1">
              <li>Allez dans <b>Vente & Tickets</b></li>
              <li>Choisissez un forfait et une quantité</li>
              <li>Cliquez sur <b>Créer les tickets</b></li>
              <li>Imprimez le ticket</li>
              <li>Donnez-le au client</li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: "tickets",
      titre: "Gestion des tickets",
      icone: Ticket,
      couleur: "cyan",
      contenu: (
        <div className="space-y-4 text-sm text-gray-300">
          <div>
            <h4 className="font-semibold text-white mb-2">Forfaits par défaut</h4>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><b>1 heure</b> : 500 Ar</li>
              <li><b>2 heures</b> : 1 000 Ar</li>
              <li><b>4 heures</b> : 2 000 Ar</li>
              <li><b>Journée</b> : 5 000 Ar (12h)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">Activation par le client</h4>
            <ol className="list-decimal list-inside ml-4 space-y-1">
              <li>Le client se connecte au Wi-Fi <b>CYBER_FAMILLE</b></li>
              <li>Il ouvre son navigateur → redirection vers le portail</li>
              <li>Il saisit le code + mot de passe du ticket</li>
              <li>Le chrono démarre</li>
            </ol>
          </div>
          <div className="bg-warn/10 border border-warn/30 rounded-lg p-3">
            <p className="text-warn text-xs">
              ⚠️ Chaque ticket ne peut être utilisé <b>qu'une seule fois</b>.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "securite",
      titre: "Sécurité 2FA",
      icone: Shield,
      couleur: "success",
      contenu: (
        <div className="space-y-4 text-sm text-gray-300">
          <div>
            <h4 className="font-semibold text-white mb-2">Activer le 2FA</h4>
            <ol className="list-decimal list-inside ml-4 space-y-1">
              <li>Allez dans <b>Sécurité 2FA</b></li>
              <li>Cliquez sur <b>Activer le 2FA</b></li>
              <li>Scannez le QR code avec <b>Google Authenticator</b></li>
              <li>Entrez le code à 6 chiffres</li>
              <li>Téléchargez les <b>codes de secours</b></li>
            </ol>
          </div>
          <div className="bg-success/10 border border-success/30 rounded-lg p-3">
            <p className="text-success text-xs">
              ✅ Le 2FA protège votre compte même si votre mot de passe est volé.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "sessions",
      titre: "Sessions actives",
      icone: MonitorSmartphone,
      couleur: "cyan",
      contenu: (
        <div className="space-y-4 text-sm text-gray-300">
          <div>
            <h4 className="font-semibold text-white mb-2">Voir les appareils connectés</h4>
            <p>Allez dans <b>Sessions actives</b> pour voir :</p>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>Type d'appareil (Windows, Android, iPhone)</li>
              <li>Adresse IP</li>
              <li>Dernière activité</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">Déconnecter un appareil</h4>
            <p>Cliquez sur <b>Déconnecter les autres</b> pour révoquer toutes les sessions sauf la vôtre.</p>
          </div>
        </div>
      ),
    },
    {
      id: "impression",
      titre: "Impression",
      icone: Printer,
      couleur: "warn",
      contenu: (
        <div className="space-y-4 text-sm text-gray-300">
          <div>
            <h4 className="font-semibold text-white mb-2">Imprimante thermique</h4>
            <ol className="list-decimal list-inside ml-4 space-y-1">
              <li>Branchez l'imprimante sur le réseau</li>
              <li>Notez son IP</li>
              <li>Allez dans <b>Paramètres → Imprimante</b></li>
              <li>Saisissez l'IP et le port 9100</li>
              <li>Cliquez sur <b>Tester</b></li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: "routeur",
      titre: "Routeur MikroTik",
      icone: Router,
      couleur: "danger",
      contenu: (
        <div className="space-y-4 text-sm text-gray-300">
          <div>
            <h4 className="font-semibold text-white mb-2">Configuration</h4>
            <ol className="list-decimal list-inside ml-4 space-y-1">
              <li>Connectez-vous à RouterOS (WinBox)</li>
              <li>Activez le service API (port 8728)</li>
              <li>Créez un utilisateur API</li>
              <li>Configurez le Hotspot</li>
              <li>Dans l'app : <b>Paramètres → Routeur</b></li>
            </ol>
          </div>
          <div className="bg-cyan/10 border border-cyan/30 rounded-lg p-3">
            <p className="text-cyan text-xs">
              💡 Sans MikroTik, le système fonctionne en <b>mode simulation</b>.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "caisses",
      titre: "Multi-caisses",
      icone: Store,
      couleur: "accent",
      contenu: (
        <div className="space-y-4 text-sm text-gray-300">
          <div>
            <h4 className="font-semibold text-white mb-2">Créer une caisse</h4>
            <ol className="list-decimal list-inside ml-4 space-y-1">
              <li>Allez dans <b>Caisses</b></li>
              <li>Cliquez sur <b>Nouvelle caisse</b></li>
              <li>Donnez-lui un nom (ex: "Caisse principale")</li>
              <li>Cliquez sur <b>Ouvrir</b> pour y associer votre session</li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: "rapports",
      titre: "Rapports PDF",
      icone: FileText,
      couleur: "success",
      contenu: (
        <div className="space-y-4 text-sm text-gray-300">
          <div>
            <h4 className="font-semibold text-white mb-2">Générer un rapport</h4>
            <ol className="list-decimal list-inside ml-4 space-y-1">
              <li>Allez dans <b>Rapports PDF</b></li>
              <li>Choisissez Journalier / Hebdomadaire / Mensuel</li>
              <li>Chargez l'aperçu</li>
              <li>Cliquez sur <b>Télécharger le PDF</b></li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: "notifications",
      titre: "Email & SMS",
      icone: Mail,
      couleur: "cyan",
      contenu: (
        <div className="space-y-4 text-sm text-gray-300">
          <div>
            <h4 className="font-semibold text-white mb-2">Alertes email</h4>
            <ol className="list-decimal list-inside ml-4 space-y-1">
              <li>Allez dans <b>Notifications externes</b></li>
              <li>Onglet <b>Email (SMTP)</b></li>
              <li>Saisissez votre config Gmail / autre</li>
              <li>Testez l'envoi</li>
            </ol>
          </div>
          <div className="bg-cyan/10 border border-cyan/30 rounded-lg p-3">
            <p className="text-cyan text-xs">
              💡 Pour Gmail, utilisez un <b>mot de passe d'application</b>.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "sauvegarde",
      titre: "Sauvegardes",
      icone: Database,
      couleur: "cyan",
      contenu: (
        <div className="space-y-4 text-sm text-gray-300">
          <div>
            <h4 className="font-semibold text-white mb-2">Sauvegarde manuelle</h4>
            <ol className="list-decimal list-inside ml-4 space-y-1">
              <li>Allez dans <b>Sauvegardes</b></li>
              <li>Cliquez sur <b>Nouvelle sauvegarde</b></li>
              <li>Téléchargez le fichier .sql</li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">Automatique</h4>
            <p>Programmez une tâche quotidienne avec <b>cron_quotidien.bat</b>.</p>
          </div>
        </div>
      ),
    },
  ];

  const sectionsFiltrees = sections.filter(
    (s) =>
      s.titre.toLowerCase().includes(recherche.toLowerCase()) ||
      s.id.toLowerCase().includes(recherche.toLowerCase())
  );

  const couleurMap = {
    accent: "bg-accent/10 text-accent",
    cyan: "bg-cyan/10 text-cyan",
    success: "bg-success/10 text-success",
    warn: "bg-warn/10 text-warn",
    danger: "bg-danger/10 text-danger",
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="mb-6 animate-slide-up">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HelpCircle size={24} className="text-accent" />
          Aide & Documentation
        </h1>
        <p className="text-gray-400 text-sm">
          Guide complet pour utiliser votre application Cyber Famille
        </p>
      </div>

      <div className="bg-panel rounded-2xl p-4 border border-white/5 mb-6 animate-slide-up stagger-1">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-3.5 text-gray-500" />
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher une section (tickets, sécurité, impressions...)"
            className="w-full bg-night border border-white/10 rounded-lg py-3 pl-10 pr-3 text-white focus:border-accent focus:outline-none transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-panel rounded-2xl p-3 border border-white/5 lg:sticky lg:top-20 animate-slide-up stagger-2">
            <nav className="space-y-1">
              {sectionsFiltrees.map((s) => {
                const Icone = s.icone;
                const actif = sectionOuverte === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSectionOuverte(s.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition text-left ${
                      actif
                        ? "bg-accent text-white"
                        : "text-gray-300 hover:bg-white/5"
                    }`}
                  >
                    <Icone size={16} className="flex-shrink-0" />
                    <span className="text-sm font-medium flex-1 truncate">
                      {s.titre}
                    </span>
                    <ChevronRight size={14} />
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="lg:col-span-3">
          {sectionsFiltrees.length === 0 ? (
            <div className="bg-panel rounded-2xl p-12 border border-white/5 text-center">
              <Search size={48} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Aucune section trouvée</p>
            </div>
          ) : (
            sectionsFiltrees
              .filter((s) => s.id === sectionOuverte)
              .map((s) => {
                const Icone = s.icone;
                return (
                  <div
                    key={s.id}
                    className="bg-panel rounded-2xl p-6 border border-white/5 animate-slide-up stagger-3"
                  >
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                      <div className={`p-3 rounded-xl ${couleurMap[s.couleur]}`}>
                        <Icone size={22} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{s.titre}</h2>
                        <p className="text-xs text-gray-400">Section {s.id}</p>
                      </div>
                    </div>
                    {s.contenu}
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}