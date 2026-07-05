"use client";

import { useState } from "react";

/**
 * Renders a real accreditation/partner logo when the asset exists in
 * /public/images/trust/, and gracefully falls back to a styled text label
 * when it doesn't. This lets us ship the premium logo row WITHOUT bundling
 * any copyrighted marks — drop a licensed <slug>.svg (or .png) into
 * public/images/trust/ and it appears automatically; until then, the clean
 * text treatment shows. Never fabricate/scrape marks LERA isn't licensed for.
 */
const EXTENSIONS = ["svg", "png"] as const;

export default function TrustMark({ slug, name }: { slug: string; name: string }) {
  const [attempt, setAttempt] = useState(0);

  if (attempt < EXTENSIONS.length) {
    return (
      <img
        src={`/images/trust/${slug}.${EXTENSIONS[attempt]}`}
        alt={name}
        title={name}
        loading="lazy"
        className="h-8 sm:h-10 w-auto object-contain opacity-60 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
        onError={() => setAttempt((a) => a + 1)}
      />
    );
  }

  // Fallback: no licensed asset present — keep the refined text treatment.
  return (
    <span
      className="font-display font-semibold text-gray-400 hover:text-brand-navy transition-colors text-sm sm:text-base tracking-wide whitespace-nowrap"
      title={name}
    >
      {name}
    </span>
  );
}
