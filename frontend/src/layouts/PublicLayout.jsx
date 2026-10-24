import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  Share2,
  LogIn,
} from "lucide-react";
import { usePublicLang } from "../context/PublicLangContext";
import LanguageSwitcher from "../components/LanguageSwitcher";
import Logo from "../components/Logo";
import PromoBanner from "../components/PromoBanner";
import ScrollToTop from "../components/ScrollToTop";
import ChatWidget from "../components/ChatWidget";

export default function PublicLayout() {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const { t, langue } = usePublicLang();

  const liens = [
    { to: "/", labelKey: "nav.accueil", end: true },
    { to: "/services", labelKey: "nav.services" },
    { to: "/tarifs", labelKey: "nav.tarifs" },
    { to: "/reservation", labelKey: "nav.reservation" },
    { to: "/fidelite", labelKey: "nav.fidelite" },
    { to: "/blog", labelKey: "nav.blog" },
    { to: "/galerie", labelKey: "nav.galerie" },
    { to: "/temoignages", labelKey: "nav.temoignages" },
    { to: "/faq", labelKey: "nav.faq" },
    { to: "/contact", labelKey: "nav.contact" },
  ];

  return (
    <div className="public-page">
      {/* ===== BANDEAU PROMO ===== */}
      <PromoBanner
        message="📢 Nouveau : Starlink Wi-Fi maintenant disponible !"
        messageMg="📢 Vaovao : Starlink Wi-Fi misy izao!"
        lien="/services"
      />

      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-[#0A1628]/80 border-b border-[#1E40AF]/20">
        <div className="public-container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="group">
              <Logo size="md" variant="public" />
            </Link>

            {/* Navigation desktop */}
            <nav className="hidden xl:flex items-center gap-0.5">
              {liens.map((lien) => (
                <NavLink
                  key={lien.to}
                  to={lien.to}
                  end={lien.end}
                  className={({ isActive }) =>
                    `px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? "text-[#67E8F9] bg-[#06B6D4]/10"
                        : "text-gray-300 hover:text-[#67E8F9] hover:bg-white/5"
                    }`
                  }
                >
                  {t(lien.labelKey)}
                </NavLink>
              ))}
            </nav>

            {/* CTA admin + langue */}
            <div className="hidden xl:flex items-center gap-2">
              <LanguageSwitcher />
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-[#67E8F9] transition"
              >
                <LogIn size={14} />
                {t("nav.espaceAdmin")}
              </Link>
              <Link to="/portail" className="btn-public-cyan text-xs px-3 py-2">
                {t("nav.seConnecter")}
              </Link>
            </div>

            {/* Bouton menu mobile/tablette */}
            <button
              onClick={() => setMenuOuvert(!menuOuvert)}
              className="xl:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
              aria-label="Menu"
            >
              {menuOuvert ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Menu mobile/tablette */}
        {menuOuvert && (
          <div className="xl:hidden border-t border-[#1E40AF]/20 bg-[#0A1628]">
            <nav className="public-container py-4 space-y-1">
              {liens.map((lien) => (
                <NavLink
                  key={lien.to}
                  to={lien.to}
                  end={lien.end}
                  onClick={() => setMenuOuvert(false)}
                  className={({ isActive }) =>
                    `block px-4 py-3 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? "text-[#67E8F9] bg-[#06B6D4]/10"
                        : "text-gray-300 hover:bg-white/5"
                    }`
                  }
                >
                  {t(lien.labelKey)}
                </NavLink>
              ))}
              <div className="pt-4 border-t border-[#1E40AF]/20 space-y-2">
                <div className="flex justify-end px-4">
                  <LanguageSwitcher />
                </div>
                <Link
                  to="/login"
                  onClick={() => setMenuOuvert(false)}
                  className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300"
                >
                  <LogIn size={16} />
                  {t("nav.espaceAdmin")}
                </Link>
                <Link
                  to="/portail"
                  onClick={() => setMenuOuvert(false)}
                  className="btn-public-cyan text-sm w-full justify-center"
                >
                  {t("nav.seConnecter")}
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ===== CONTENU ===== */}
      <main>
        <Outlet />
      </main>

      <ScrollToTop />

      {/* ===== FOOTER ===== */}
      <footer className="bg-[#0A1628] border-t border-[#1E40AF]/20 py-12 mt-20">
        <div className="public-container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="mb-4">
                <Logo size="md" variant="public" />
              </div>
              <p className="text-sm text-gray-400 mb-4 max-w-md">
                {t("footer.description")}
              </p>
              <div className="flex gap-3">
                <a
                  href="https://www.facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg bg-white/5 hover:bg-[#06B6D4]/20 text-gray-300 hover:text-[#67E8F9] transition"
                  title="Facebook - Hari'son Rkt"
                >
                  <Share2 size={18} />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">
                {t("footer.navigation")}
              </h4>
              <ul className="space-y-2 text-sm">
                {liens.slice(0, 5).map((lien) => (
                  <li key={lien.to}>
                    <Link
                      to={lien.to}
                      className="text-gray-400 hover:text-[#67E8F9] transition"
                    >
                      {t(lien.labelKey)}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    to="/newsletter"
                    className="text-gray-400 hover:text-[#67E8F9] transition"
                  >
                    {langue === "mg" ? "Gazetiboky" : "Newsletter"}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">
                {t("footer.contact")}
              </h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2 text-gray-400">
                  <MapPin
                    size={16}
                    className="text-[#06B6D4] flex-shrink-0 mt-0.5"
                  />
                  <span>
                    Ambalavao 303
                    <br />
                    Fianarantsoa, Madagascar
                  </span>
                </li>
                <li className="flex items-center gap-2 text-gray-400">
                  <Phone size={16} className="text-[#06B6D4] flex-shrink-0" />
                  <a
                    href="tel:+261342248966"
                    className="hover:text-[#67E8F9] transition"
                  >
                    +261 34 22 489 66
                  </a>
                </li>
                <li className="flex items-center gap-2 text-gray-400">
                  <Mail size={16} className="text-[#06B6D4] flex-shrink-0" />
                  <a
                    href="mailto:rakotosolofoharisondiary@gmail.com"
                    className="hover:text-[#67E8F9] transition truncate"
                  >
                    rakotosoloharisondiary@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[#1E40AF]/20 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <p>
              © {new Date().getFullYear()} Cyber Famille Solofoson.{" "}
              {t("footer.droits")}
            </p>
            <p className="flex items-center gap-2">
              {t("footer.propulse")}
              <span className="text-[#67E8F9] font-semibold">
                {t("footer.starlink")}
              </span>
            </p>
          </div>
        </div>
      </footer>

      {/* ===== CHAT WIDGET ===== */}
      <ChatWidget />
    </div>
  );
}