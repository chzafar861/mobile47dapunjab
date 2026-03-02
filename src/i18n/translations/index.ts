import { en } from './en';
import { ur } from './ur';
import { hi } from './hi';
import { pa } from './pa';
import { SupportedLanguage } from '../../types';

export const translations: Record<SupportedLanguage, Record<string, string>> = {
  en,
  ur,
  hi,
  pa,
};

export const languageNames: Record<SupportedLanguage, string> = {
  en: 'English',
  ur: 'اردو',
  hi: 'हिन्दी',
  pa: 'ਪੰਜਾਬੀ',
};

export const rtlLanguages: SupportedLanguage[] = ['ur'];

export const isRTL = (lang: SupportedLanguage): boolean => rtlLanguages.includes(lang);
