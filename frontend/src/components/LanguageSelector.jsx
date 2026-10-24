import { useState, useEffect, useRef } from "react";
import { Globe, Check } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function LanguageSelector() {
  const { langue, langueActuelle, langues, changerLangue } = useLanguage();
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOuvert(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOuvert(!ouvert)}
        className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition"
        title={langueActuelle?.nom}
      >
        <Globe size={16} />
        <span className="text-lg leading-none">{langueActuelle?.drapeau}</span>
      </button>

      {ouvert && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-panel border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden">
          {langues.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                changerLangue(l.code);
                setOuvert(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition ${
                langue === l.code
                  ? "bg-accent/10 text-accent"
                  : "text-gray-300 hover:bg-white/5"
              }`}
            >
              <span className="text-lg leading-none">{l.drapeau}</span>
              <span className="flex-1 text-left font-medium">{l.nom}</span>
              {langue === l.code && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}