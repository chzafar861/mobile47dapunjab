import React, { createContext, useContext, useState, useMemo, ReactNode, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager, Platform } from "react-native";
import { en } from "@/lib/translations/en";
import { ur } from "@/lib/translations/ur";
import { hi } from "@/lib/translations/hi";
import { pa } from "@/lib/translations/pa";

export type Language = "en" | "ur" | "hi" | "pa";

export const LANGUAGES: { code: Language; label: string; nativeLabel: string; rtl: boolean }[] = [
  { code: "en", label: "English", nativeLabel: "English", rtl: false },
  { code: "ur", label: "Urdu", nativeLabel: "اردو", rtl: true },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", rtl: false },
  { code: "pa", label: "Punjabi", nativeLabel: "ਪੰਜਾਬੀ", rtl: false },
];

export type TranslationKeys = typeof en;

const translations: Record<Language, TranslationKeys> = { en, ur, hi, pa };

interface I18nContextValue {
  lang: Language;
  t: TranslationKeys;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "@47dapunjab_lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>("en");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && (saved === "en" || saved === "ur" || saved === "hi" || saved === "pa")) {
        setLang(saved as Language);
      }
    }).catch(() => {});
  }, []);

  const setLanguage = (newLang: Language) => {
    setLang(newLang);
    AsyncStorage.setItem(STORAGE_KEY, newLang).catch(() => {});
  };

  const value = useMemo(() => ({
    lang,
    t: translations[lang],
    setLanguage,
    isRTL: lang === "ur",
  }), [lang]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
