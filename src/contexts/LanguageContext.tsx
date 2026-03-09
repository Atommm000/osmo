import React, { createContext, useContext, useMemo, useState } from "react";
import { translations, TranslationKeys } from "../i18n";

interface LanguageContextType {
  language: "vi" | "en";
  setLanguage: (lang: "vi" | "en") => void;
  t: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<"vi" | "en">(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("cosmo_language");
      if (saved === "vi" || saved === "en") {
        return saved as "vi" | "en";
      }
    }
    return "vi";
  });

  const setLanguage = (nextLang: "vi" | "en") => {
    setLanguageState(nextLang);
    localStorage.setItem("cosmo_language", nextLang);
  };

  const value = useMemo(() => {
    return {
      language,
      setLanguage,
      t: translations[language],
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
