import { Platform } from "react-native";
import React, { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  path?: string;
  keywords?: string;
}

export function SEOHead({ title, description, path, keywords }: SEOHeadProps) {
  const fullTitle = `${title} | 47daPunjab`;
  const url = path ? `https://47dapunjab.com${path}` : "https://47dapunjab.com";
  const imageUrl = "https://47dapunjab.com/assets/images/icon.png";

  useEffect(() => {
    if (Platform.OS !== "web") return;

    document.title = fullTitle;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("name", "description", description);
    if (keywords) {
      setMeta("name", "keywords", keywords);
    }
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", url);
    setMeta("property", "og:image", imageUrl);
    setMeta("property", "og:image:width", "1024");
    setMeta("property", "og:image:height", "1024");
    setMeta("property", "og:image:alt", fullTitle);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", imageUrl);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);
  }, [fullTitle, description, url, keywords]);

  return null;
}
