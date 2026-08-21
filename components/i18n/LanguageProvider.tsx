'use client';

import React, { createContext, useContext, useState } from 'react';
import { Locale } from '@/lib/i18n';
import { Dictionary } from '@/translations/en';

interface LanguageContextType {
  locale: Locale;
  t: (key: string) => string;
  setLanguage: (lang: Locale) => void;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({
  children,
  initialLocale,
  dictionary,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
  dictionary: Dictionary;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [currentDictionary] = useState<Dictionary>(dictionary);

  const setLanguage = (lang: Locale) => {
    // Save to cookie for SSR (max-age=1 year)
    document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    setLocaleState(lang);

    // Reload to ensure server components render with the new locale.
    // This provides a clean transition without needing heavy client-side dictionary fetching.
    window.location.reload();
  };

  // Basic object path resolution for t('nav.login')
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = currentDictionary;
    for (const k of keys) {
      if (value === undefined || value === null) return key;
      value = value[k];
    }
    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ locale, t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
