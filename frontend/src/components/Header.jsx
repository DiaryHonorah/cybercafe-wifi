import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Notifications from "./Notifications";
import NotificationPermission from "./NotificationPermission";
import LanguageSelector from "./LanguageSelector";
import { Menu, Shield, ShieldCheck, User, ChevronDown, Settings, LogOut } from "lucide-react";

export default function Header({ onToggleSidebar }) {
  const { admin, logout } = useAuth();
  const { t, langue } = useLanguage();
  const navigate = useNavigate();
  const [menuProfil, setMenuProfil] = useState(false);

  const formaterDate = () => {
    const date = new Date();
    const locales = { fr: "fr-FR", mg: "fr-FR" };
    return date.toLocaleDateString(locales[langue] || "fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Helper avatar
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

  const handleLogout = async () => {
    setMenuProfil(false);
    await logout();
    navigate("/login");
  };

  return (
    <header className="bg-panel/80 backdrop-blur border-b border-white/5 px-4 md:px-6 py-3 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
          aria-label="Menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <p className="text-sm font-medium flex items-center gap-2">
            {t("header.bonjour")}
            {admin ? `, ${admin.nom.split(" ")[0]}` : ""} 👋
            {admin?.twofa_actif ? (
              <ShieldCheck
                size={14}
                className="text-success"
                title="2FA activé"
              />
            ) : (
              <Shield size={14} className="text-warn" title="2FA non activé" />
            )}
          </p>
          <p className="text-xs text-gray-400">{formaterDate()}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Notifications />
        <NotificationPermission />
        <LanguageSelector />

        {admin && (
          <div className="relative pl-3 border-l border-white/10">
            <button
              onClick={() => setMenuProfil(!menuProfil)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/5 transition"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-orange-500/30 bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
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

              <div className="hidden md:block text-left">
                <p className="text-xs font-medium">{admin.nom}</p>
                <p className="text-xs text-gray-400 capitalize">{admin.role}</p>
              </div>
              <ChevronDown size={14} className="text-gray-400 hidden md:block" />
            </button>

            {/* Menu dropdown */}
            {menuProfil && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuProfil(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-64 bg-[#112240] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                  {/* En-tête profil */}
                  <div className="p-4 border-b border-white/10 flex flex-col items-center gap-2 bg-gradient-to-br from-orange-500/10 to-transparent">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-orange-500/30 bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-xl">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={admin.nom}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        initiales
                      )}
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-sm">{admin.nom}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[200px]">
                        {admin.email}
                      </p>
                      <p className="text-xs text-orange-400 capitalize mt-1">
                        {admin.role}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => {
                      navigate("/admin/profil");
                      setMenuProfil(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition text-left"
                  >
                    <Settings size={16} className="text-gray-400" />
                    <span className="text-sm">Mon profil</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 transition text-left text-red-400 border-t border-white/10"
                  >
                    <LogOut size={16} />
                    <span className="text-sm">Se déconnecter</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}