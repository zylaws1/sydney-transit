import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DICTIONARIES, LANGUAGES, type LanguageCode } from './translations';

const STORAGE_KEY = 'app-language';

function readLanguage(): LanguageCode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw && raw in DICTIONARIES ? (raw as LanguageCode) : 'en';
  } catch {
    return 'en';
  }
}

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  isRtl: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>(readLanguage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const isRtl = LANGUAGES.find((l) => l.code === language)?.rtl ?? false;

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRtl]);

  const t = useMemo(() => {
    return (key: string, params?: Record<string, string | number>) => {
      const dict = DICTIONARIES[language] ?? DICTIONARIES.en;
      let value = dict[key] ?? DICTIONARIES.en[key] ?? key;
      if (params) {
        for (const [name, replacement] of Object.entries(params)) {
          value = value.replace(`{${name}}`, String(replacement));
        }
      }
      return value;
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRtl, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
