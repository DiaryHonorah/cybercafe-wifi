import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import { ClientAuthProvider } from "./context/ClientAuthContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import { CaisseProvider } from "./context/CaisseContext";
import RouteProtegee from "./components/RouteProtegee";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import ToastContainer from "./components/Toast";
import OfflineBanner from "./components/OfflineBanner";

import "./styles/public.css";

// ===== LAYOUTS =====
import PublicLayout from "./layouts/PublicLayout";

// ===== PAGES PUBLIQUES =====
import Accueil from "./pages/public/Accueil";
import Services from "./pages/public/Services";
import Tarifs from "./pages/public/Tarifs";
import Reservation from "./pages/public/Reservation";
import FidelitePublic from "./pages/public/Fidelite";
import BlogPublic from "./pages/public/Blog";
import ArticlePublic from "./pages/public/Article";
import NewsletterPublic from "./pages/public/Newsletter";
import Galerie from "./pages/public/Galerie";
import Temoignages from "./pages/public/Temoignages";
import FAQ from "./pages/public/FAQ";
import Contact from "./pages/public/Contact";
import ClientLogin from "./pages/public/ClientLogin";
import ClientRegister from "./pages/public/ClientRegister";
import ClientDashboard from "./pages/public/ClientDashboard";

// ===== PAGES ADMIN =====
import Login from "./pages/Login";
import Portail from "./pages/Portail";
import Dashboard from "./pages/Dashboard";
import Vente from "./pages/Vente";
import Clients from "./pages/Clients";
import Reservations from "./pages/Reservations";
import Fidelite from "./pages/Fidelite";
import Blog from "./pages/Blog";
import Newsletter from "./pages/Newsletter";
import Chat from "./pages/Chat";
import Profil from "./pages/Profil";
import Promotions from "./pages/Promotions";
import GalerieAdmin from "./pages/Galerie";
import Monitoring from "./pages/Monitoring";
import Sauvegarde from "./pages/Sauvegarde";
import Recettes from "./pages/Recettes";
import Rapport from "./pages/Rapport";
import RapportPDF from "./pages/RapportPDF";
import Statistiques from "./pages/Statistiques";
import StatistiquesAvancees from "./pages/StatistiquesAvancees";
import NotificationsExternes from "./pages/NotificationsExternes";
import Admins from "./pages/Admins";
import TwoFactorSetup from "./pages/TwoFactorSetup";
import SessionsActives from "./pages/SessionsActives";
import Sites from "./pages/Sites";
import Caisses from "./pages/Caisses";
import Diagnostic from "./pages/Diagnostic";
import Parametres from "./pages/Parametres";
import Aide from "./pages/Aide";

// ===== LAYOUT ADMIN =====
function AdminLayout() {
  const [sidebarOuverte, setSidebarOuverte] = useState(false);

  return (
    <div className="flex h-screen bg-night overflow-hidden">
      <div className="hidden lg:block flex-shrink-0 h-screen">
        <Sidebar />
      </div>

      {sidebarOuverte && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setSidebarOuverte(false)}
          />
          <div className="relative z-10">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <Header onToggleSidebar={() => setSidebarOuverte(!sidebarOuverte)} />

        <main className="flex-1 p-4 md:p-6 overflow-y-auto print:p-0 print:overflow-visible">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/vente" element={<Vente />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/reservations" element={<Reservations />} />
            <Route path="/fidelite" element={<Fidelite />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/newsletter" element={<Newsletter />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/profil" element={<Profil />} />
            <Route path="/promotions" element={<Promotions />} />
            <Route path="/galerie" element={<GalerieAdmin />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/sauvegarde" element={<Sauvegarde />} />
            <Route path="/recettes" element={<Recettes />} />
            <Route path="/rapport" element={<Rapport />} />
            <Route path="/rapport-pdf" element={<RapportPDF />} />
            <Route path="/statistiques" element={<Statistiques />} />
            <Route path="/statistiques-avancees" element={<StatistiquesAvancees />} />
            <Route path="/notifications-externes" element={<NotificationsExternes />} />
            <Route path="/admins" element={<Admins />} />
            <Route path="/2fa" element={<TwoFactorSetup />} />
            <Route path="/sessions-actives" element={<SessionsActives />} />
            <Route path="/sites" element={<Sites />} />
            <Route path="/caisses" element={<Caisses />} />
            <Route path="/diagnostic" element={<Diagnostic />} />
            <Route path="/parametres" element={<Parametres />} />
            <Route path="/aide" element={<Aide />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// ===== APP PRINCIPAL =====
export default function App() {
  return (
    <AuthProvider>
      <ClientAuthProvider>
        <WebSocketProvider>
          <CaisseProvider>
            <BrowserRouter>
              <OfflineBanner />
              <Routes>
                {/* ===== ROUTES PUBLIQUES ===== */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Accueil />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/tarifs" element={<Tarifs />} />
                  <Route path="/reservation" element={<Reservation />} />
                  <Route path="/fidelite" element={<FidelitePublic />} />
                  <Route path="/blog" element={<BlogPublic />} />
                  <Route path="/blog/:slug" element={<ArticlePublic />} />
                  <Route path="/newsletter" element={<NewsletterPublic />} />
                  <Route path="/galerie" element={<Galerie />} />
                  <Route path="/temoignages" element={<Temoignages />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/connexion" element={<ClientLogin />} />
                  <Route path="/inscription" element={<ClientRegister />} />
                  <Route path="/mon-compte" element={<ClientDashboard />} />
                </Route>

                {/* ===== AUTHENTIFICATION ADMIN ===== */}
                <Route path="/login" element={<Login />} />
                <Route path="/portail" element={<Portail />} />

                {/* ===== ADMIN ===== */}
                <Route
                  path="/admin/*"
                  element={
                    <RouteProtegee>
                      <AdminLayout />
                    </RouteProtegee>
                  }
                />
              </Routes>
              <ToastContainer />
            </BrowserRouter>
          </CaisseProvider>
        </WebSocketProvider>
      </ClientAuthProvider>
    </AuthProvider>
  );
}