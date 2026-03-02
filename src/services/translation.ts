import { doc, getDoc, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, functions } from '../config/firebase';
import { COLLECTIONS } from '../constants/collections';
import { SupportedLanguage } from '../types';

const TRANSLATION_CACHE_PREFIX = '@47daPunjab_translation_';

interface TranslateResponse {
  translatedText: string;
}

/**
 * Translate text using Firebase Cloud Function
 * Checks local cache first, then Firestore cache, then calls the function
 */
export const translateText = async (
  text: string,
  targetLang: SupportedLanguage
): Promise<string> => {
  if (targetLang === 'en') return text;

  // Generate a cache key
  const cacheKey = `${text}_${targetLang}`;
  const localCacheKey = `${TRANSLATION_CACHE_PREFIX}${cacheKey}`;

  // Check local cache first
  try {
    const cached = await AsyncStorage.getItem(localCacheKey);
    if (cached) return cached;
  } catch {
    // Ignore cache errors
  }

  // Check Firestore cache
  try {
    const cacheDoc = await getDoc(
      doc(db, COLLECTIONS.TRANSLATIONS_CACHE, encodeURIComponent(cacheKey))
    );
    if (cacheDoc.exists()) {
      const translatedText = cacheDoc.data().translatedText as string;
      // Save to local cache
      await AsyncStorage.setItem(localCacheKey, translatedText).catch(() => {});
      return translatedText;
    }
  } catch {
    // Ignore Firestore cache errors
  }

  // Call the Cloud Function
  try {
    const translateFn = httpsCallable<{ text: string; targetLang: string }, TranslateResponse>(
      functions,
      'translate'
    );
    const result = await translateFn({ text, targetLang });
    const translatedText = result.data.translatedText;

    // Cache in Firestore
    await setDoc(
      doc(db, COLLECTIONS.TRANSLATIONS_CACHE, encodeURIComponent(cacheKey)),
      { text, targetLang, translatedText, createdAt: Date.now() }
    ).catch(() => {});

    // Cache locally
    await AsyncStorage.setItem(localCacheKey, translatedText).catch(() => {});

    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Fallback to original text
  }
};
