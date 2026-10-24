import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

export default function RouteProtegee({ children }) {
  const { admin, chargement } = useAuth();
  const location = useLocation();

  // Éviter la redirection pendant la vérification initiale du token
  if (chargement) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-accent" />
      </div>
    );
  }

  // Si pas connecté, on redirige vers /login en gardant la destination
  if (!admin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}