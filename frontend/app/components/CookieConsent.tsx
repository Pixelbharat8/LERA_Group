"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";

/**
 * Cookie-consent notice for the public site. Records acceptance in localStorage so it
 * shows once. Public pages only (never the dashboard/auth). Bilingual EN/VI.
 */
export default function CookieConsent() {
  const pathname = usePathname() || "";
  const { language } = useLanguage();
  const vi = language === "VI";
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("lera_cookie_consent")) setShow(true);
    } catch {
      /* storage blocked — just don't show */
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem("lera_cookie_consent", new Date().toISOString());
    } catch { /* ignore */ }
    setShow(false);
  };

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/auth")) return null;
  if (!show) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[60] bg-brand-navy text-white px-4 py-3 shadow-2xl">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <p className="text-sm text-white/90">
          {vi
            ? "Chúng tôi sử dụng cookie để cải thiện trải nghiệm và phân tích lưu lượng truy cập. Xem "
            : "We use cookies to improve your experience and analyse site traffic. See our "}
          <Link href="/privacy" className="underline font-medium">
            {vi ? "Chính sách bảo mật" : "Privacy Policy"}
          </Link>
          .
        </p>
        <button
          onClick={accept}
          className="px-5 py-2 rounded-lg bg-brand-orange text-white text-sm font-semibold hover:opacity-90 whitespace-nowrap flex-shrink-0"
        >
          {vi ? "Đồng ý" : "Accept"}
        </button>
      </div>
    </div>
  );
}
