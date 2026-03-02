import { useCallback } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { SupportedLanguage } from '../types';

/**
 * Custom hook for translations.
 * Returns the translate function and current language info.
 */
export const useTranslate = () => {
  const { language, setLanguage, t, isRtl } = useI18n();

  const translate = useCallback(
    (key: string): string => {
      return t(key);
    },
    [t]
  );

  /**
   * Get a localized field from an object.
   * e.g., getLocalizedField(product, 'name') returns product.name_en for English
   */
  const getLocalizedField = useCallback(
    <T extends Record<string, unknown>>(obj: T, fieldPrefix: string): string => {
      const key = `${fieldPrefix}_${language}` as keyof T;
      const fallbackKey = `${fieldPrefix}_en` as keyof T;
      return (obj[key] as string) || (obj[fallbackKey] as string) || '';
    },
    [language]
  );

  return {
    t: translate,
    language,
    setLanguage,
    isRtl,
    getLocalizedField,
    textAlign: isRtl ? 'right' as const : 'left' as const,
    flexDirection: isRtl ? 'row-reverse' as const : 'row' as const,
  };
};

export default useTranslate;
