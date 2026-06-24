"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// --- THEME CONTEXT ---
type Theme = "dark" | "executive" | "light";
interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// --- LANGUAGE CONTEXT ---
type Language = "EN" | "AM";
interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (en: string, am: string) => string;
}
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function GlobalProviders({ children }: { children: React.ReactNode }) {
  // Theme State
  const [theme, setThemeState] = useState<Theme>("dark");
  
  useEffect(() => {
    // Load saved theme on mount
    const savedTheme = localStorage.getItem("amanzone-theme") as Theme;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("amanzone-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  // Language State
  const [language, setLanguage] = useState<Language>("EN");
  const toggleLanguage = () => setLanguage((prev) => (prev === "EN" ? "AM" : "EN"));
  const t = (enText: string, amText: string) => (language === "EN" ? enText : amText);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
        {children}
      </LanguageContext.Provider>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within GlobalProviders");
  return context;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within GlobalProviders");
  return context;
};