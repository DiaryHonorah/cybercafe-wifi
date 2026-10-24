import { createContext, useContext, useState, useEffect } from "react";
import fr from "../i18n/public-fr.json";
import mg from "../i18n/public-mg.json";

const PublicLangContext = createContext(null);

const traductions = { fr, mg };

export function PublicLangProvider({ children }) {
  const [langue, setLangue] = useState(() => {
    return localStorage.getItem("public_langue") || "fr";
  });

  useEffect(() => {
    localStorage.setItem("public_langue", langue);
  }, [langue]);

  /**
   * Traduire une clé : t("accueil.titre1")
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
    if (traductions[code]) setLangue(code);
  };

  return (
    <PublicLangContext.Provider value={{ langue, t, changerLangue }}>
      {children}
    </PublicLangContext.Provider>
  );
}

export const usePublicLang = () => useContext(PublicLangContext);