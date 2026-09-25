import { createContext, useContext } from "react";
import type { me } from "./me";

export type Language = "me" | "en";

export type Dictionary = typeof me;
export type TranslationKey = Exclude<keyof Dictionary, "privacy" | "terms">;

export type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  privacy: Dictionary["privacy"];
  terms: Dictionary["terms"];
};

export const I18nContext = createContext<I18nContextValue | undefined>(
  undefined,
);

export const useI18n = () => {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return context;
};
