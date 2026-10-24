import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Ticket,
  Users,
  DollarSign,
  BarChart3,
  TrendingUp,
  FileText,
  FileDown,
  Mail,
  Settings,
  Shield,
  MonitorSmartphone,
  Building2,
  Store,
  Database,
  HelpCircle,
  Activity,
  LogOut,
  Wifi,
  Calendar,
  Award,
  BookOpen,
  Send,
  MessageCircle,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import ConfirmDialog from "./ConfirmDialog";

const links = [
  { to: "/admin", labelKey: "sidebar.dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/vente", labelKey: "sidebar.vente", icon: Ticket },
  { to: "/admin/clients", labelKey: "sidebar.clients", icon: Users },
  { to: "/admin/reservations", labelKey: "sidebar.reservations", icon: Calendar },
  { to: "/admin/fidelite", labelKey: "sidebar.fidelite", icon: Award },
  { to: "/admin/blog", labelKey: "sidebar.blog", icon: BookOpen },
  { to: "/admin/newsletter", labelKey: "sidebar.newsletter", icon: Send },
  { to: "/admin/chat", labelKey: "sidebar.chat", icon: MessageCircle, badge: true },
  { to: "/admin/profil", labelKey: "sidebar.profil", icon: User },
  { to: "/admin/recettes", labelKey: "sidebar.recettes", icon: DollarSign },
  { to: "/admin/rapport", labelKey: "sidebar.rapport", icon: FileText },
  { to: "/admin/rapport-pdf", labelKey: "sidebar.rapportPdf", icon: FileDown },
  { to: "/admin/statistiques", labelKey: "sidebar.statistiques", icon: BarChart3 },
  { to: "/admin/statistiques-avancees", labelKey: "sidebar.statsAvancees", icon: TrendingUp },
  { to: "/admin/notifications-externes", labelKey: "sidebar.notifExternes", icon: Mail },
  { to: "/admin/admins", labelKey: "sidebar.admins", icon: Shield },
  { to: "/admin/2fa", labelKey: "sidebar.securite2fa", icon: Shield },
  { to: "/admin/sessions-actives", labelKey: "sidebar.sessionsActives", icon: MonitorSmartphone },
  { to: "/admin/sites", labelKey: "sidebar.sites", icon: Building2 },
  { to: "/admin/caisses", labelKey: "sidebar.caisses", icon: Store },
  { to: "/admin/sauvegarde", labelKey: "sidebar.sauvegarde", icon: Database },
  { to: "/admin/diagnostic", labelKey: "sidebar.diagnostic", icon: Activity },
  { to: "/admin/parametres", labelKey: "sidebar.parametres", icon: Settings },
  { to: "/admin/aide", labelKey: "sidebar.aide", icon: HelpCircle },
];

export default function Sidebar() {
  const { admin, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [confirmDeconnexion, setConfirmDeconnexion] = useState(false);
  const [deconnexionEnCours, setDeconnexionEnCours] = useState(false);
  const [nonLus, setNonLus] = useState(0);

  // Charger le nombre de messages non lus
  useEffect(() => {
    const fetchNonLus = async () => {
      const token =
        localStorage.getItem("admin_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("auth_token");
      if (!token) return;

      try {
        const res = await fetch(
          "http://localhost/cybercafe-wifi/backend/api/chat/admin/non-lus",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (data.success) setNonLus(data.messages || 0);
      } catch (e) {
        // Silencieux
      }
    };

    fetchNonLus();
    const interval = setInterval(fetchNonLus, 10000); // toutes les 10s
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => setConfirmDeconnexion(true);

  const confirmerDeconnexion = async () => {
    setDeconnexionEnCours(true);
    try {
      await logout();
    } catch (e) {
      navigate("/login");
    } finally {
      setDeconnexionEnCours(false);
      setConfirmDeconnexion(false);
    }
  };

  // Avatar helper
  const getAvatarUrl = () => {
    if (!admin?.avatar_url) return null;
    return admin.avatar_url;
  };

  const avatarUrl = getAvatarUrl();
  const initiales = (admin?.nom || "A")
    .split(" ")
    .map((m) => m[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <aside className="w-64 bg-panel border-r border-white/5 flex flex-col h-screen flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div className="bg-accent p-2 rounded-xl shadow-lg shadow-accent/20 flex-shrink-0">
            <Wifi size={22} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-lg truncate">{t("app.nom")}</h1>
            <p className="text-xs text-gray-400 truncate">{t("app.slogan")}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map(({ to, labelKey, icon: Icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg transition ${
                  isActive
                    ? "bg-accent text-white shadow-lg shadow-accent/20"
                    : "text-gray-300 hover:bg-white/5"
                }`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className="text-sm font-medium truncate flex-1">
                {t(labelKey) || labelKey.split(".")[1]}
              </span>
              {badge && nonLus > 0 && (
                <span className="min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5">
                  {nonLus > 99 ? "99+" : nonLus}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Admin connecté */}
        {admin && (
          <div className="mx-3 mb-3 bg-night/50 rounded-lg p-3 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full overflow-hidden border border-orange-500/30 bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={admin.nom}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <span
                  style={{ display: avatarUrl ? "none" : "flex" }}
                  className="w-full h-full items-center justify-center"
                >
                  {initiales}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400">
                  {t("sidebar.connecteEnTantQue")}
                </p>
                <p className="text-sm font-medium truncate">{admin.nom}</p>
              </div>
            </div>
            <p className="text-xs text-accent capitalize">{admin.role}</p>
          </div>
        )}

        {/* Bouton Déconnexion */}
        <div className="px-3 pb-4">
          <button
            onClick={handleLogout}
            disabled={deconnexionEnCours}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition disabled:opacity-50"
          >
            <LogOut size={18} className="flex-shrink-0" />
            <span className="text-sm">
              {deconnexionEnCours
                ? "Déconnexion..."
                : t("sidebar.deconnexion")}
            </span>
          </button>
        </div>
      </aside>

      <ConfirmDialog
        ouvert={confirmDeconnexion}
        titre="Se déconnecter ?"
        message="Êtes-vous sûr de vouloir vous déconnecter de Cyber Famille ? Vous devrez saisir vos identifiants pour vous reconnecter."
        onConfirm={confirmerDeconnexion}
        onCancel={() => setConfirmDeconnexion(false)}
        couleur="danger"
        labelConfirm={
          deconnexionEnCours ? "Déconnexion..." : "Se déconnecter"
        }
        labelCancel="Annuler"
      />
    </>
  );
}