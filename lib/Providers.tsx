"use client";

import React, { createContext, useContext, useState } from "react";

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
}

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);
const LanguageContext = createContext<LanguageContextType | null>(null);

export function GlobalProviders({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState("dark");
  const [language, setLanguage] = useState("EN");

  const setTheme = (t: string) => {
    setThemeState(t);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", t);
    }
  };

  const toggleLanguage = (lang: string) => {
    setLanguage(lang);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <LanguageContext.Provider value={{ language, setLanguage: toggleLanguage }}>
        {children}
      </LanguageContext.Provider>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a GlobalProviders container");
  return context;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within a GlobalProviders container");
  return context;
};