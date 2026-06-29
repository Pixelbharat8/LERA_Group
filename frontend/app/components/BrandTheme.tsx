"use client";

import { useEffect } from "react";
import { apiUrl } from "../../lib/api";

/**
 * Applies the brand colours configured in Website Content → Branding
 * (cms-settings keys `branding_primary_color` / `branding_secondary_color`)
 * by setting CSS custom properties on <html>. The Tailwind `brand.navy` /
 * `brand.orange` tokens read `var(--brand-primary/secondary, <fallback>)`,
 * so when nothing is configured the vars stay unset and the static brand
 * palette is used unchanged. Renders nothing.
 */
const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export default function BrandTheme() {
  useEffect(() => {
    let active = true;
    const get = async (key: string): Promise<string> => {
      try {
        const res = await fetch(apiUrl(`/api/cms-settings/value/${key}`));
        if (!res.ok) return "";
        return (await res.text()).trim();
      } catch {
        return "";
      }
    };
    (async () => {
      const [primary, secondary] = await Promise.all([
        get("branding_primary_color"),
        get("branding_secondary_color"),
      ]);
      if (!active) return;
      const root = document.documentElement;
      // Only set valid hex values — never let a bad/empty value blank the site.
      if (HEX.test(primary)) root.style.setProperty("--brand-primary", primary);
      if (HEX.test(secondary)) root.style.setProperty("--brand-secondary", secondary);
    })();
    return () => {
      active = false;
    };
  }, []);

  return null;
}
