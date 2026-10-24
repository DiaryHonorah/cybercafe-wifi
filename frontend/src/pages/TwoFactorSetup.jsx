import { useEffect, useState } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  KeyRound,
  Copy,
  Check,
  Loader2,
  QrCode,
  AlertTriangle,
  Download,
} from "lucide-react";
import api from "../api";
import { toast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";

export default function TwoFactorSetup() {
  const { admin } = useAuth();
  const [statut, setStatut] = useState(null);
  const [etape, setEtape] = useState("statut"); // statut | setup | backup | actif
  const [secret, setSecret] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState([]);
  const [motDePasse, setMotDePasse] = useState("");
  const [chargement, setChargement] = useState(false);
  const [copie, setCopie] = useState(false);

  const chargerStatut = async () => {
    try {
      const r = await api.get(`/api/2fa/statut?admin_id=${admin?.id || 1}`);
      setStatut(r.data);
      if (r.data.actif) setEtape("actif");
      else setEtape("statut");
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    chargerStatut();
  }, []);

  // Étape 1 : Générer le secret
  const demarrer = async () => {
    setChargement(true);
    try {
      const r = await api.post("/api/2fa/generer", {
        admin_id: admin?.id || 1,
      });
      if (r.data.success) {
        setSecret(r.data.secret);
        setQrUrl(r.data.url);
        setEtape("setup");
      }
    } catch (e) {
      toast("Erreur lors de la génération", "error");
    } finally {
      setChargement(false);
    }
  };

  // Étape 2 : Activer avec le code
  const activer = async () => {
    if (code.length !== 6) {
      toast("Le code doit contenir 6 chiffres", "warn");
      return;
    }

    setChargement(true);
    try {
      const r = await api.post("/api/2fa/activer", {
        admin_id: admin?.id || 1,
        code,
      });
      if (r.data.success) {
        setBackupCodes(r.data.backup_codes);
        setEtape("backup");
        toast("2FA activé !", "success");
      } else {
        toast(r.data.erreur || "Code incorrect", "error");
      }
    } catch (e) {
      toast(e.response?.data?.erreur || "Code incorrect", "error");
    } finally {
      setChargement(false);
    }
  };

  // Étape 3 : Désactiver
  const desactiver = async () => {
    if (!motDePasse) {
      toast("Mot de passe requis", "warn");
      return;
    }
    setChargement(true);
    try {
      const r = await api.post("/api/2fa/desactiver", {
        admin_id: admin?.id || 1,
        mot_de_passe: motDePasse,
      });
      if (r.data.success) {
        toast("2FA désactivé", "success");
        setMotDePasse("");
        chargerStatut();
      }
    } catch (e) {
      toast(e.response?.data?.erreur || "Erreur", "error");
    } finally {
      setChargement(false);
    }
  };

  const copierSecret = () => {
    navigator.clipboard.writeText(secret);
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  };

  const telechargerBackupCodes = () => {
    const texte = `Cyber Famille - Codes de secours 2FA
=========================================

Conservez ces codes en lieu sûr. Chaque code ne peut être utilisé qu'une seule fois.

${backupCodes.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Date : ${new Date().toLocaleString("fr-FR")}
Compte : ${admin?.email}
`;

    const blob = new Blob([texte], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup-codes-2fa.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const qrCodeGoogle = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6 animate-slide-up">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield size={24} className="text-accent" />
          Sécurité 2FA
        </h1>
        <p className="text-gray-400 text-sm">
          Ajoutez une couche de sécurité avec l'authentification à deux facteurs
        </p>
      </div>

      {/* Étape : Statut */}
      {etape === "statut" && (
        <div className="bg-panel rounded-2xl p-6 border border-white/5 animate-slide-up">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-warn/10 text-warn p-4 rounded-xl">
              <ShieldOff size={32} />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-1">
                Le 2FA n'est pas activé
              </h2>
              <p className="text-gray-400 text-sm">
                Votre compte n'est pas protégé par l'authentification à deux
                facteurs. Activez-le pour renforcer la sécurité.
              </p>
            </div>
          </div>

          <div className="bg-cyan/5 border border-cyan/20 rounded-xl p-4 mb-6">
            <p className="text-sm text-cyan mb-2 font-medium">
              💡 Comment ça marche ?
            </p>
            <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
              <li>Scannez un QR code avec Google Authenticator (ou Authy)</li>
              <li>À chaque connexion, un code à 6 chiffres sera demandé</li>
              <li>8 codes de secours vous seront fournis</li>
            </ol>
          </div>

          <button
            onClick={demarrer}
            disabled={chargement}
            className="w-full bg-accent hover:bg-accentDark disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            {chargement ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Shield size={18} />
            )}
            {chargement ? "..." : "Activer le 2FA"}
          </button>
        </div>
      )}

      {/* Étape : Setup (QR Code) */}
      {etape === "setup" && (
        <div className="bg-panel rounded-2xl p-6 border border-white/5 animate-slide-up">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <QrCode size={20} className="text-accent" />
            Scannez le QR code
          </h2>

          <div className="bg-white rounded-2xl p-4 w-fit mx-auto mb-6">
            <img
              src={qrCodeGoogle}
              alt="QR Code 2FA"
              className="w-48 h-48"
            />
          </div>

          <div className="bg-night rounded-xl p-4 border border-white/5 mb-6">
            <p className="text-xs text-gray-400 mb-2">
              Ou entrez le code manuellement :
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-black/30 rounded-lg p-3 text-accent font-mono text-sm break-all">
                {secret}
              </code>
              <button
                onClick={copierSecret}
                className="bg-white/5 hover:bg-white/10 p-3 rounded-lg transition"
                title="Copier"
              >
                {copie ? (
                  <Check size={16} className="text-success" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
          </div>

          <label className="block text-sm text-gray-400 mb-2">
            Entrez le code à 6 chiffres généré par l'application
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className="w-full bg-night border border-white/10 rounded-lg p-4 text-white text-center text-2xl font-mono tracking-widest focus:border-accent focus:outline-none mb-4"
          />

          <div className="flex gap-3">
            <button
              onClick={() => setEtape("statut")}
              className="flex-1 bg-white/5 hover:bg-white/10 text-sm font-medium py-3 rounded-lg transition"
            >
              Annuler
            </button>
            <button
              onClick={activer}
              disabled={chargement || code.length !== 6}
              className="flex-1 bg-success hover:bg-success/80 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {chargement ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ShieldCheck size={18} />
              )}
              {chargement ? "..." : "Vérifier et activer"}
            </button>
          </div>
        </div>
      )}

      {/* Étape : Backup codes */}
      {etape === "backup" && (
        <div className="bg-panel rounded-2xl p-6 border border-success/30 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-success/10 text-success p-3 rounded-xl">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-success">
                2FA activé avec succès !
              </h2>
              <p className="text-xs text-gray-400">
                Conservez ces codes en lieu sûr
              </p>
            </div>
          </div>

          <div className="bg-warn/10 border border-warn/30 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-2">
              <AlertTriangle size={18} className="text-warn flex-shrink-0 mt-0.5" />
              <p className="text-xs text-warn">
                <b>Important :</b> ces codes ne seront plus jamais affichés.
                Téléchargez-les et conservez-les en sécurité. Chaque code ne
                peut être utilisé qu'<b>une seule fois</b>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {backupCodes.map((c, i) => (
              <div
                key={i}
                className="bg-night rounded-lg p-3 border border-white/5 flex items-center gap-2"
              >
                <span className="text-xs text-gray-500">{i + 1}.</span>
                <code className="text-sm font-mono text-accent">{c}</code>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={telechargerBackupCodes}
              className="flex-1 bg-cyan hover:bg-cyan/80 text-night font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Télécharger (.txt)
            </button>
            <button
              onClick={() => setEtape("actif")}
              className="flex-1 bg-accent hover:bg-accentDark text-white font-semibold py-3 rounded-lg transition"
            >
              J'ai sauvegardé
            </button>
          </div>
        </div>
      )}

      {/* Étape : Déjà actif */}
      {etape === "actif" && (
        <div className="bg-panel rounded-2xl p-6 border border-success/30 animate-slide-up">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-success/10 text-success p-4 rounded-xl">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-1 text-success">
                Le 2FA est activé
              </h2>
              <p className="text-gray-400 text-sm">
                Votre compte est protégé par l'authentification à deux facteurs.
              </p>
              {statut && (
                <p className="text-xs text-gray-500 mt-2">
                  Codes de secours restants : <b className="text-accent">{statut.backup_codes_restants}</b>
                </p>
              )}
            </div>
          </div>

          <div className="bg-danger/5 border border-danger/20 rounded-xl p-4">
            <p className="text-sm font-medium text-danger mb-3 flex items-center gap-2">
              <ShieldOff size={16} />
              Désactiver le 2FA
            </p>
            <p className="text-xs text-gray-400 mb-3">
              Cette action réduit la sécurité de votre compte.
            </p>

            <input
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="Entrez votre mot de passe"
              className="w-full bg-night border border-white/10 rounded-lg p-3 mb-3 text-white focus:border-danger focus:outline-none"
            />

            <button
              onClick={desactiver}
              disabled={chargement || !motDePasse}
              className="w-full bg-danger/10 hover:bg-danger/20 disabled:opacity-50 text-danger font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {chargement ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ShieldOff size={18} />
              )}
              {chargement ? "..." : "Désactiver le 2FA"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}