import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import { SupportedLanguage } from '../types';
import { translations, isRTL } from './translations';

interface I18nContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (key: string) => string;
  isRtl: boolean;
}

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: async () => {},
  t: (key: string) => key,
  isRtl: false,
});

const LANGUAGE_KEY = '@47daPunjab_language';

interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (stored && (stored === 'en' || stored === 'ur' || stored === 'hi' || stored === 'pa')) {
        setLanguageState(stored as SupportedLanguage);
        const rtl = isRTL(stored as SupportedLanguage);
        if (I18nManager.isRTL !== rtl) {
          I18nManager.allowRTL(rtl);
          I18nManager.forceRTL(rtl);
        }
      }
    } catch (error) {
      console.error('Error loading language:', error);
    } finally {
      setIsReady(true);
    }
  };

  const setLanguage = async (lang: SupportedLanguage) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      setLanguageState(lang);
      const rtl = isRTL(lang);
      if (I18nManager.isRTL !== rtl) {
        I18nManager.allowRTL(rtl);
        I18nManager.forceRTL(rtl);
      }
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  if (!isReady) {
    return null;
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, isRtl: isRTL(language) }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
export default I18nProvider;
