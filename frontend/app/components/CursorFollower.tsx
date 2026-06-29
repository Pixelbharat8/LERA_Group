"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Premium custom cursor for the PUBLIC marketing site: a small brand dot that tracks the
 * pointer exactly, plus a larger ring that smoothly trails it and grows/fills when hovering
 * interactive elements. Uses the brand CSS vars so it follows the configured theme colours.
 *
 * Self-disables where it would hurt: touch / coarse-pointer devices, users who prefer reduced
 * motion, and the internal dashboard / auth screens (never on the working app).
 */
export default function CursorFollower() {
  const pathname = usePathname() || "";
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  const isPublic = !(pathname.startsWith("/dashboard") || pathname.startsWith("/auth"));
  const active = enabled && isPublic;

  // Decide once whether this device should get the custom cursor at all.
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (fine && !reduced) setEnabled(true);
  }, []);

  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    root.classList.add("lera-cursor"); // hides the native cursor (CSS keeps carets on inputs)

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring = { x: mouse.x, y: mouse.y };
    let raf = 0;
    let hovering = false;

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      const d = dotRef.current;
      if (d) {
        d.style.opacity = "1";
        d.style.transform = `translate(${mouse.x}px, ${mouse.y}px) translate(-50%, -50%)`;
      }
      if (ringRef.current) ringRef.current.style.opacity = "0.6";

      const el = e.target as HTMLElement | null;
      const over = !!(el && el.closest && el.closest(
        "a, button, [role='button'], input, textarea, select, label, .cursor-pointer"
      ));
      if (over !== hovering) {
        hovering = over;
        ringRef.current?.classList.toggle("cursor-ring--hover", over);
      }
    };

    const loop = () => {
      // Lerp the ring toward the pointer for a smooth trailing feel.
      ring.x += (mouse.x - ring.x) * 0.18;
      ring.y += (mouse.y - ring.y) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.x}px, ${ring.y}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(loop);
    };

    const hide = () => {
      if (dotRef.current) dotRef.current.style.opacity = "0";
      if (ringRef.current) ringRef.current.style.opacity = "0";
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", hide);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", hide);
      root.classList.remove("lera-cursor");
    };
  }, [active]);

  if (!active) return null;
  return (
    <>
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
