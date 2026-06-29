"use client";

import { useEffect, useState } from "react";
import { publicFetch } from "../lib/api";
import { useLanguage } from "../app/context/LanguageContext";

/**
 * Reads editable page content from the CMS — category `<category>`, keys named
 * `<category>_<field>_<en|vi>` (same convention as the home/about pages). Returns a
 * `c(field, fallback)` getter resolved for the current language, falling back to the
 * in-code default so the page renders unchanged until edited in
 * Chairman → Website Content. The matching editor is <CmsPageEditor category=… />.
 */
export function usePageContent(category: string) {
  const { language } = useLanguage();
  const [map, setMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await publicFetch(`/api/cms-settings/map/${category}`);
        if (active && data && typeof data === "object") {
          setMap(data as Record<string, string>);
        }
      } catch {
        /* keep in-code fallbacks */
      }
    })();
    return () => {
      active = false;
    };
  }, [category]);

  const lang = language === "VI" ? "vi" : "en";
  const c = (field: string, fallback: string): string =>
    map[`${category}_${field}_${lang}`] || fallback;

  return { c };
}
