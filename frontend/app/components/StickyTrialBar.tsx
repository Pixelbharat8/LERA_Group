"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "../context/LanguageContext";

/**
 * Slim sticky "Book a free trial" bar. Desktop-only (lg+) so it never competes with the
 * mobile FloatingCTA. Slides up once the user scrolls past the hero; dismissible.
 * z-40 sits below FloatingCTA (z-50); right padding keeps copy clear of the floating widget.
 */
export default function StickyTrialBar() {
  const { language } = useLanguage();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (dismissed) return null;
  const en = language === "EN";

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-40 hidden lg:block transition-transform duration-500 ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="bg-brand-navy/95 backdrop-blur shadow-lift border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:pr-32 py-3 flex items-center justify-center gap-5">
          <p className="text-white font-medium">
            {en
              ? "Try a free trial lesson — small classes, Cambridge-aligned, native teachers."
              : "Học thử miễn phí — lớp nhỏ, chuẩn Cambridge, giáo viên bản ngữ."}
          </p>
          <Link href="/book-trial" className="btn-primary whitespace-nowrap">
            {en ? "Book a free trial" : "Đăng ký học thử"}
            <span aria-hidden>→</span>
          </Link>
          <button
            onClick={() => setDismissed(true)}
            aria-label={en ? "Dismiss" : "Đóng"}
            className="text-white/60 hover:text-white text-xl leading-none px-1"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
