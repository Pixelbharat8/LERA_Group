"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Floating quick-contact buttons (Zalo, phone, Facebook Messenger) — what Vietnamese
 * parents expect for instant contact. Public pages only; hidden on dashboard/auth.
 * Numbers default to LERA's real contact and can be overridden via the CMS "contact" map.
 */
export default function FloatingContact() {
  const pathname = usePathname() || "";
  const [c, setC] = useState({
    phone: "0387.633.141",
    zalo: "https://zalo.me/0387633141",
    messenger: "https://m.me/61580971978601",
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/cms-settings/map/contact");
        if (!res.ok) return;
        const d = await res.json();
        const phone = d.contact_phone || "0387.633.141";
        const digits = (d.contact_phone || phone).replace(/\D/g, "");
        setC({
          phone,
          zalo: d.contact_zalo || (digits ? `https://zalo.me/${digits}` : "https://zalo.me/0387633141"),
          messenger: d.contact_messenger || "https://m.me/61580971978601",
        });
      } catch {
        /* keep defaults */
      }
    })();
  }, []);

  // Internal app surfaces shouldn't show the marketing contact widget.
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/auth")) return null;

  const telDigits = c.phone.replace(/\D/g, "");

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-center gap-3 print:hidden">
      {/* Zalo */}
      <a
        href={c.zalo}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on Zalo"
        title="Zalo"
        className="group relative w-12 h-12 rounded-full bg-[#0068FF] shadow-lg flex items-center justify-center text-white font-bold hover:scale-110 transition-transform"
      >
        <span className="text-[11px] leading-none font-extrabold">Zalo</span>
        <span className="absolute inset-0 rounded-full bg-[#0068FF] animate-ping opacity-20" />
      </a>

      {/* Facebook Messenger */}
      <a
        href={c.messenger}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on Messenger"
        title="Messenger"
        className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00B2FF] to-[#006AFF] shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform"
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17.16.14.26.35.27.57l.05 1.78c.03.57.62.94 1.14.71l1.98-.87c.17-.07.36-.09.54-.04 1.01.28 2.09.43 3.23.43 5.64 0 10-4.13 10-9.7C22 6.13 17.64 2 12 2zm6 7.46l-2.93 4.65c-.47.74-1.47.93-2.18.41l-2.33-1.75a.6.6 0 0 0-.72 0l-3.15 2.39c-.42.32-.97-.18-.69-.63l2.93-4.65c.47-.74 1.47-.93 2.18-.41l2.33 1.75c.21.16.51.16.72 0l3.15-2.39c.42-.32.97.18.69.63z" />
        </svg>
      </a>

      {/* Phone */}
      <a
        href={`tel:${telDigits}`}
        aria-label={`Call ${c.phone}`}
        title={c.phone}
        className="w-12 h-12 rounded-full bg-green-500 shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform"
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
        </svg>
      </a>
    </div>
  );
}
