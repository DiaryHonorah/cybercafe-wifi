import { createContext, useContext, useState, useEffect } from "react";
import fr from "../i18n/fr.json";
import mg from "../i18n/mg.json";

const LanguageContext = createContext(null);

const traductions = {
  fr: fr,
  mg: mg,
};

const langues = [
  { code: "fr", nom: "Français", drapeau: "🇫🇷" },
  { code: "mg", nom: "Malagasy", drapeau: "🇲🇬" },
];

export function LanguageProvider({ children }) {
  const [langue, setLangue] = useState(() => {
    return localStorage.getItem("langue") || "fr";
  });

  useEffect(() => {
    localStorage.setItem("langue", langue);
  }, [langue]);

  /**
   * Traduire une clé avec points : t("sidebar.dashboard")
   */
  const t = (cle) => {
    const parties = cle.split(".");
    let valeur = traductions[langue];

    for (const partie of parties) {
      if (valeur && typeof valeur === "object") {
        valeur = valeur[partie];
      } else {
        return cle;
      }
    }

    return valeur || cle;
  };

  const changerLangue = (code) => {
    if (traductions[code]) {
      setLangue(code);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        langue,
        langueActuelle: langues.find((l) => l.code === langue),
        langues,
        changerLangue,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);