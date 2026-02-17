import { useState, useEffect, useCallback, useRef } from "react";
import { getApiUrl } from "@/lib/query-client";
import { useI18n } from "@/lib/i18n";

const globalCache = new Map<string, string>();

function getCacheKey(text: string, lang: string): string {
  return `${lang}:${text}`;
}

export function useTranslate(texts: string[]): { translated: string[]; loading: boolean } {
  const { lang: language } = useI18n();
  const [translated, setTranslated] = useState<string[]>(texts);
  const [loading, setLoading] = useState(false);
  const prevKey = useRef("");

  useEffect(() => {
    const key = `${language}:${JSON.stringify(texts)}`;
    if (key === prevKey.current) return;
    prevKey.current = key;

    if (language === "en" || texts.length === 0) {
      setTranslated(texts);
      setLoading(false);
      return;
    }

    const allCached = texts.every((t) => globalCache.has(getCacheKey(t, language)));
    if (allCached) {
      setTranslated(texts.map((t) => globalCache.get(getCacheKey(t, language)) || t));
      setLoading(false);
      return;
    }

    const uncachedTexts: string[] = [];
    const uncachedIndices: number[] = [];
    const result = [...texts];

    texts.forEach((t, i) => {
      const cached = globalCache.get(getCacheKey(t, language));
      if (cached) {
        result[i] = cached;
      } else if (t && t.trim()) {
        uncachedTexts.push(t);
        uncachedIndices.push(i);
      }
    });

    if (uncachedTexts.length === 0) {
      setTranslated(result);
      setLoading(false);
      return;
    }

    setLoading(true);

    const apiUrl = getApiUrl();
    fetch(new URL("/api/translate", apiUrl).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: uncachedTexts, targetLang: language }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.translations) {
          data.translations.forEach((tr: string, idx: number) => {
            const originalText = uncachedTexts[idx];
            globalCache.set(getCacheKey(originalText, language), tr);
            result[uncachedIndices[idx]] = tr;
          });
        }
        setTranslated(result);
      })
      .catch(() => {
        setTranslated(texts);
      })
      .finally(() => setLoading(false));
  }, [language, JSON.stringify(texts)]);

  return { translated, loading };
}

export function useTranslateOne(text: string): { translated: string; loading: boolean } {
  const result = useTranslate(text ? [text] : []);
  return {
    translated: result.translated[0] || text,
    loading: result.loading,
  };
}

export function translateTexts(
  texts: string[],
  targetLang: string
): Promise<string[]> {
  if (targetLang === "en" || texts.length === 0) return Promise.resolve(texts);

  const allCached = texts.every((t) => globalCache.has(getCacheKey(t, targetLang)));
  if (allCached) {
    return Promise.resolve(texts.map((t) => globalCache.get(getCacheKey(t, targetLang)) || t));
  }

  const apiUrl = getApiUrl();
  return fetch(new URL("/api/translate", apiUrl).toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts, targetLang }),
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.translations) {
        data.translations.forEach((tr: string, idx: number) => {
          globalCache.set(getCacheKey(texts[idx], targetLang), tr);
        });
        return data.translations;
      }
      return texts;
    })
    .catch(() => texts);
}
