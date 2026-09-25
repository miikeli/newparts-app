import { useEffect, useMemo, useState, type ReactNode } from "react";
import { en } from "./en";
import {
  I18nContext,
  type I18nContextValue,
  type Language,
} from "./context";
import { me } from "./me";

const dictionaries = {
  me,
  en,
};

const languageStorageKey = "newparts_language";

const htmlLangByLanguage: Record<Language, string> = {
  me: "sr-Latn-ME",
  en: "en",
};

const readInitialLanguage = (): Language => {
  if (typeof window === "undefined") {
    return "me";
  }

  try {
    const storedLanguage = window.localStorage.getItem(languageStorageKey);

    return storedLanguage === "en" || storedLanguage === "me"
      ? storedLanguage
      : "me";
  } catch {
    return "me";
  }
};

const interpolate = (
  value: string,
  params?: Record<string, string | number>,
) => {
  if (!params) {
    return value;
  }

  return Object.entries(params).reduce(
    (result, [key, replacement]) =>
      result.replaceAll(`{{${key}}}`, String(replacement)),
    value,
  );
};

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(readInitialLanguage);

  useEffect(() => {
    try {
      window.localStorage.setItem(languageStorageKey, language);
    } catch {
      // Language persistence is optional; the UI can continue with in-memory state.
    }

    document.documentElement.lang = htmlLangByLanguage[language];
  }, [language]);

  const value = useMemo<I18nContextValue>(() => {
    const dictionary = dictionaries[language];

    return {
      language,
      setLanguage,
      t: (key, params) => interpolate(dictionary[key], params),
      privacy: dictionary.privacy,
      terms: dictionary.terms,
    };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
