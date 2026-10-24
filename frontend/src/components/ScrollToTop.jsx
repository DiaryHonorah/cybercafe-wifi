import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

/**
 * Bouton flottant "Retour en haut"
 * Positionné en bas à droite
 */
export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const remonter = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={remonter}
      aria-label="Retour en haut"
      className={`fixed bottom-6 right-6 z-40 p-3 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#1E40AF] text-white shadow-lg shadow-cyan-500/40 hover:scale-110 transition-all duration-300 ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <ArrowUp size={22} strokeWidth={2.5} />
    </button>
  );
}