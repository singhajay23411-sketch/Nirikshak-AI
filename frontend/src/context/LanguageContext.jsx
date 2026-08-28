import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, getTranslation } from '../i18n';

const STORAGE_KEY = 'nirikshak_language';

const LanguageContext = createContext({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key, fallback) => fallback || key,
  tObj: (key) => null,
  supportedLanguages: SUPPORTED_LANGUAGES,
  isHindi: false
});

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (saved === 'en' || saved === 'hi')) {
        return saved;
      }
    } catch (e) {
      console.warn('Could not read language from localStorage:', e);
    }
    return DEFAULT_LANGUAGE;
  });

  // Keep document lang attribute in sync
  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch (e) {
      console.warn('Could not save language to localStorage:', e);
    }
  }, [language]);

  const setLanguage = useCallback((langCode) => {
    if (langCode === 'en' || langCode === 'hi') {
      setLanguageState(langCode);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === 'en' ? 'hi' : 'en'));
  }, []);

  const t = useCallback((keyPath, fallback = '') => {
    return getTranslation(language, keyPath, fallback);
  }, [language]);

  const tObj = useCallback((keyPath) => {
    return getTranslation(language, keyPath, null);
  }, [language]);

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    tObj,
    supportedLanguages: SUPPORTED_LANGUAGES,
    isHindi: language === 'hi'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
