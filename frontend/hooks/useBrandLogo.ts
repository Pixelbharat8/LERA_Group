"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "../lib/api";

/**
 * Reads the brand logo configured in Website Content → Branding
 * (cms-settings keys `branding_logo_url` / `branding_logo_alt_text*`).
 * The value-by-key endpoint is public (academy SecurityConfig permits
 * GET /api/cms-settings/value/*). When no logo is set, `logoUrl` stays
 * empty and callers fall back to the built-in text/"L" lockup — so the
 * header/footer are unchanged until a logo is uploaded.
 */
export function useBrandLogo() {
  const [logoUrl, setLogoUrl] = useState("");
  const [altEn, setAltEn] = useState("LERA Academy");
  const [altVi, setAltVi] = useState("LERA Academy");

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
      const [url, ae, av] = await Promise.all([
        get("branding_logo_url"),
        get("branding_logo_alt_text"),
        get("branding_logo_alt_text_vi"),
      ]);
      if (!active) return;
      // Only accept something that can actually be an image source. The endpoint returns the
      // raw setting text, so a JSON/error body served with 200 (seen as "{}" in an audit) would
      // otherwise become <img src="{}"> — a broken logo in the header and footer of every page.
      if (url && /^(https?:\/\/|\/|data:image\/)/i.test(url)) setLogoUrl(url);
      if (ae) setAltEn(ae);
      if (av) setAltVi(av);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { logoUrl, altEn, altVi };
}
