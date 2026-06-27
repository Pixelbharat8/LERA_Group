"use client";

import { useEffect } from "react";

/**
 * Tasteful scroll-reveal for public pages. Reuses the `.reveal` / `.reveal.active`
 * CSS already in globals.css (fade + translateY). Reveal-once: each element animates
 * the first time it enters the viewport, then is unobserved (no re-trigger jank).
 *
 * Respects `prefers-reduced-motion` — those users get content shown instantly.
 * Call once near the top of a page component; it picks up every `.reveal` in the DOM.
 */
export function useReveal() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (els.length === 0) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("active"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}
