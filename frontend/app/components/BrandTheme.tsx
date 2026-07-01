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

/** WCAG relative luminance (0 = black … 1 = white) of a hex colour. */
function luminance(hex: string): number {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const ch = (i: number) => {
    const c = parseInt(h.substr(i, 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(0) + 0.7152 * ch(2) + 0.0722 * ch(4);
}

/** Readable text colour to place ON a given background colour. */
function onColor(hex: string): { full: string; soft: string } {
  // >0.42 = a light background → dark ink; else → white.
  return luminance(hex) > 0.42
    ? { full: "#0a1a2e", soft: "rgba(10,26,46,0.72)" }
    : { full: "#ffffff", soft: "rgba(255,255,255,0.75)" };
}

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
      // Auto-contrast: compute readable text colours for surfaces painted with the brand
      // primary (e.g. the footer). Uses the Chairman's colour if valid, else the design's
      // navy fallback (#0a1a5c) — so the footer stays legible for ANY brand colour chosen.
      const on = onColor(HEX.test(primary) ? primary : "#0a1a5c");
      root.style.setProperty("--brand-on-primary", on.full);
      root.style.setProperty("--brand-on-primary-soft", on.soft);
    })();
    return () => {
      active = false;
    };
  }, []);

  return null;
}
