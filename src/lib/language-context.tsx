"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./auth-context";
import { TRANSLATIONS, type Language } from "./translations";

export type { Language };

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  options: LanguageOption[];
  t: typeof TRANSLATIONS["en"];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const { user } = useAuth();

  // Load initial language from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("jansahayak_lang") as Language | null;
      if (saved && (saved === "en" || saved === "hi" || saved === "ml")) {
        setLanguageState(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const setLanguage = useCallback(
    async (newLang: Language) => {
      setLanguageState(newLang);
      try {
        localStorage.setItem("jansahayak_lang", newLang);
        // If user is a logged-in worker, sync with server store
        if (user?.id) {
          await fetch("/api/workers/language", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workerId: user.id, language: newLang }),
          });
        }
      } catch (e) {
        console.error("Failed to persist language preference", e);
      }
    },
    [user]
  );

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, options: LANGUAGES, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
