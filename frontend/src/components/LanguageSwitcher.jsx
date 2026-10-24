import { useState } from "react";
import { Globe } from "lucide-react";
import { usePublicLang } from "../context/PublicLangContext";

export default function LanguageSwitcher() {
  const { langue, changerLangue } = usePublicLang();
  const [ouvert, setOuvert] = useState(false);

  const langues = [
    { code: "fr", nom: "Français", drapeau: "🇫🇷" },
    { code: "mg", nom: "Malagasy", drapeau: "🇲🇬" },
  ];

  const langueActuelle = langues.find((l) => l.code === langue);

  return (
    <div className="relative">
      <button
        onClick={() => setOuvert(!ouvert)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm"
        title={langueActuelle?.nom}
      >
        <Globe size={16} className="text-[#67E8F9]" />
        <span className="text-lg leading-none">{langueActuelle?.drapeau}</span>
      </button>

      {ouvert && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOuvert(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-40 bg-[#112240] border border-[#1E40AF]/30 rounded-xl shadow-2xl z-50 overflow-hidden">
            {langues.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  changerLangue(l.code);
                  setOuvert(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition ${
                  langue === l.code
                    ? "bg-[#06B6D4]/10 text-[#67E8F9]"
                    : "text-gray-300 hover:bg-white/5"
                }`}
              >
                <span className="text-lg leading-none">{l.drapeau}</span>
                <span className="font-medium">{l.nom}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}