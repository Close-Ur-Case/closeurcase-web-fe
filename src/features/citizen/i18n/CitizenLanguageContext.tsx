import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  getCitizenSession,
  setCitizenSession,
  type CitizenLanguage,
} from "@/features/citizen/session";
import { t, type TranslationKey } from "@/features/citizen/i18n/translations";

interface CitizenLanguageContextValue {
  language: CitizenLanguage;
  setLanguage: (lang: CitizenLanguage) => void;
  translate: (key: TranslationKey) => string;
}

const CitizenLanguageContext = createContext<CitizenLanguageContextValue | null>(null);

export function CitizenLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<CitizenLanguage>(
    () => getCitizenSession().language ?? "en",
  );

  const setLanguage = useCallback((lang: CitizenLanguage) => {
    setLanguageState(lang);
    setCitizenSession({ language: lang });
  }, []);

  const translate = useCallback((key: TranslationKey) => t(language, key), [language]);

  const value = useMemo(
    () => ({ language, setLanguage, translate }),
    [language, setLanguage, translate],
  );

  return (
    <CitizenLanguageContext.Provider value={value}>{children}</CitizenLanguageContext.Provider>
  );
}

export function useCitizenLanguage() {
  const ctx = useContext(CitizenLanguageContext);
  if (!ctx) {
    throw new Error("useCitizenLanguage must be used within CitizenLanguageProvider");
  }
  return ctx;
}
