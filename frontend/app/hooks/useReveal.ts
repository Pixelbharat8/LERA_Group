"use client";

import { useEffect } from "react";

/**
 * Tasteful scroll-reveal for public pages. Reuses the `.reveal` / `.reveal.active`
 * (and `.reveal-stagger`) CSS in globals.css. Reveal-once: each element animates the
 * first time it enters the viewport, then is unobserved.
 *
 * Robust to async content: a MutationObserver picks up `.reveal`/`.reveal-stagger`
 * elements that render AFTER data loads (e.g. fetched course/teacher grids) — without
 * it those would observe nothing on mount and stay permanently hidden. A safety timer
 * guarantees nothing is ever stuck invisible if the observer is unavailable.
 *
 * Respects `prefers-reduced-motion` — those users get content shown instantly.
 */
export function useReveal() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SEL = ".reveal, .reveal-stagger";
    const activateAll = () =>
      document.querySelectorAll<HTMLElement>(SEL).forEach((el) => el.classList.add("active"));

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      activateAll();
      return;
    }

    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    const seen = new WeakSet<Element>();
    const scan = () =>
      document.querySelectorAll<HTMLElement>(SEL).forEach((el) => {
        if (!seen.has(el)) {
          seen.add(el);
          io.observe(el);
        }
      });
    scan();

    // Re-scan when async content (fetched grids) mounts after the initial render.
    const mo = new MutationObserver(() => scan());
    mo.observe(document.body, { childList: true, subtree: true });

    // Safety net: if anything is still un-activated a few seconds in (observer edge
    // cases), reveal it so content is never permanently hidden.
    const safety = window.setTimeout(activateAll, 4000);

    return () => {
      io.disconnect();
      mo.disconnect();
      window.clearTimeout(safety);
    };
  }, []);
}
