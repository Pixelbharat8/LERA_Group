"use client";

import Link from "next/link";
import { useLanguage } from "../context/LanguageContext";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import { useBrandLogo } from "@/hooks/useBrandLogo";
import { useState, useEffect } from "react";
import { apiUrl } from "../../lib/api";

type FooterLink = { id: number; label: { en: string; vi: string }; url: string; openInNewTab?: boolean };
type FooterColumn = { id: number; title: { en: string; vi: string }; links: FooterLink[] };
type FooterCfg = { columns?: FooterColumn[]; copyright?: { en: string; vi: string }; description?: { en: string; vi: string } };

export default function Footer() {
  const { t, language } = useLanguage();
  const { getSetting } = useWebsiteSettings();
  const { logoUrl, altEn, altVi } = useBrandLogo();
  const [courses, setCourses] = useState<any[]>([]);
  // Footer links the Chairman configures in Website Content → Footer. When a config
  // exists we render it; otherwise we fall back to the built-in columns below, so the
  // footer is unchanged until someone deliberately saves a configuration.
  const [cfg, setCfg] = useState<FooterCfg | null>(null);
  const vi = language === "VI";

  useEffect(() => {
    fetchCourses();
    fetchFooterCfg();
  }, []);

  const fetchFooterCfg = async () => {
    try {
      // Public endpoint (academy SecurityConfig permits GET /api/cms-settings/value/*).
      const res = await fetch(apiUrl("/api/cms-settings/value/footer_settings"));
      if (!res.ok) return;
      const raw = await res.text();
      if (!raw) return;
      const parsed: FooterCfg = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.columns) && parsed.columns.length > 0) {
        setCfg(parsed);
      }
    } catch {
      /* no config / parse error → keep built-in footer */
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch(apiUrl("/api/courses/active"));
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCourses(data.filter((c: any) => 
            c.category === 'ENGLISH' || c.name?.includes('LERA') || c.name?.includes('IELTS') || c.name?.includes('English')
          ).slice(0, 6));
        }
      }
    } catch (err) {
      console.error("Footer: Error fetching courses:", err);
    }
  };

  // Map course code to URL slug
  const codeToSlug: Record<string, string> = {
    "STARTERS": "lera-starters", "EXPLORERS": "lera-explorers", "PRIMARY": "lera-primary",
    "TEENS": "lera-teens", "IELTS_SAT": "ielts-sat", "BUSINESS": "business-english",
    "CONVERSATION": "conversation", "PHONICS": "phonics",
  };
  
  // Get dynamic values from settings
  const facebookUrl = getSetting('social_facebook', 'https://www.facebook.com/profile.php?id=61580971978601');
  const instagramUrl = getSetting('instagram_url', 'https://instagram.com/leraacademy');
  const youtubeUrl = getSetting('youtube_url', 'https://youtube.com/@leraacademy');
  const tiktokUrl = getSetting('tiktok_url', 'https://tiktok.com/@leraacademy');
  const zaloUrl = getSetting('zalo_url', 'https://zalo.me/0387633141');
  const phone = getSetting('contact_phone', '0387.633.141');
  const address = language === 'VI' 
    ? getSetting('contact_address', '95 Hải Đăng, khu đô thị Vinhomes Marina, phường An Biên, Hải Phòng')
    : getSetting('contact_address_en', '95 Hai Dang, Vinhomes Marina, An Bien Ward, Hai Phong');
  const workingHours = getSetting('working_hours', '8:00 AM - 9:00 PM');

  return (
    <footer className="bg-brand-navy text-[color:var(--brand-on-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              {logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={logoUrl} alt={vi ? altVi : altEn} className="h-10 object-contain" />
              ) : (
                <>
                  <div className="w-10 h-10 bg-brand-orange rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">L</span>
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold text-[color:var(--brand-on-primary)]">LERA</span>
                    <span className="text-2xl font-light text-[color:var(--brand-on-primary-soft)] ml-1">Academy</span>
                  </div>
                </>
              )}
            </div>
            <p className="text-[color:var(--brand-on-primary-soft)] mb-6 max-w-md">
              {cfg?.description ? (vi ? cfg.description.vi : cfg.description.en) : t("footerDesc")}
            </p>
            <div className="flex space-x-4">
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                style={{ width: "2.5rem", height: "2.5rem", minWidth: "2.5rem", minHeight: "2.5rem", flexShrink: 0 }}
              >
                <svg className="w-5 h-5" width={20} height={20} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/>
                </svg>
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-500 transition-colors"
                style={{ width: "2.5rem", height: "2.5rem", minWidth: "2.5rem", minHeight: "2.5rem", flexShrink: 0 }}
              >
                <svg className="w-5 h-5" width={20} height={20} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                style={{ width: "2.5rem", height: "2.5rem", minWidth: "2.5rem", minHeight: "2.5rem", flexShrink: 0 }}
              >
                <svg className="w-5 h-5" width={20} height={20} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a
                href={tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-black transition-colors"
                style={{ width: "2.5rem", height: "2.5rem", minWidth: "2.5rem", minHeight: "2.5rem", flexShrink: 0 }}
              >
                <svg className="w-5 h-5" width={20} height={20} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </a>
              {/* Zalo */}
              <a
                href={zaloUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors"
                style={{ width: "2.5rem", height: "2.5rem", minWidth: "2.5rem", minHeight: "2.5rem", flexShrink: 0 }}
              >
                <span className="text-sm font-bold">Z</span>
              </a>
            </div>
          </div>

          {cfg?.columns?.length ? (
            /* Chairman-configured columns (Website Content → Footer) */
            cfg.columns.map((col) => (
              <div key={col.id}>
                <h4 className="font-display font-bold text-lg mb-6">{vi ? col.title.vi : col.title.en}</h4>
                <ul className="space-y-3">
                  {col.links.map((lk) => (
                    <li key={lk.id}>
                      <Link
                        href={lk.url || "#"}
                        target={lk.openInNewTab ? "_blank" : undefined}
                        rel={lk.openInNewTab ? "noopener noreferrer" : undefined}
                        className="text-[color:var(--brand-on-primary-soft)] hover:text-orange-400 transition-colors"
                      >
                        {vi ? lk.label.vi : lk.label.en}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <>
              {/* Pages */}
              <div>
                <h4 className="font-display font-bold text-lg mb-6">{t("pages")}</h4>
                <ul className="space-y-3">
                  <li><Link href="/" className="text-[color:var(--brand-on-primary-soft)] hover:text-orange-400 transition-colors">{t("home")}</Link></li>
                  <li><Link href="/courses" className="text-[color:var(--brand-on-primary-soft)] hover:text-orange-400 transition-colors">{t("courses")}</Link></li>
                  <li><Link href="/pricing" className="text-[color:var(--brand-on-primary-soft)] hover:text-orange-400 transition-colors">{vi ? "Học phí" : "Pricing"}</Link></li>
                  <li><Link href="/enroll" className="text-[color:var(--brand-on-primary-soft)] hover:text-orange-400 transition-colors">{vi ? "Đăng ký nhập học" : "Enrol online"}</Link></li>
                  <li><Link href="/portal" className="text-[color:var(--brand-on-primary-soft)] hover:text-orange-400 transition-colors">{vi ? "Cổng phụ huynh" : "Parent portal"}</Link></li>
                  <li><Link href="/teachers" className="text-[color:var(--brand-on-primary-soft)] hover:text-orange-400 transition-colors">{vi ? "Giáo viên" : "Teachers"}</Link></li>
                  <li><Link href="/corporate" className="text-[color:var(--brand-on-primary-soft)] hover:text-orange-400 transition-colors">{vi ? "Đào tạo doanh nghiệp" : "Corporate training"}</Link></li>
                  <li><Link href="/about" className="text-[color:var(--brand-on-primary-soft)] hover:text-orange-400 transition-colors">{t("about")}</Link></li>
                  <li><Link href="/contact" className="text-[color:var(--brand-on-primary-soft)] hover:text-orange-400 transition-colors">{t("contact")}</Link></li>
                </ul>
              </div>

              {/* Courses - Dynamic from API */}
              <div>
                <h4 className="font-display font-bold text-lg mb-6">{t("coursesFooter")}</h4>
                <ul className="space-y-3">
                  {courses.length > 0 ? courses.map((c: any) => {
                    const slug = codeToSlug[c.code] || c.code?.toLowerCase() || c.id;
                    const name = vi && c.nameVi ? c.nameVi : c.name;
                    return (
                      <li key={c.id || slug}>
                        <Link href={`/courses/${slug}`} className="text-[color:var(--brand-on-primary-soft)] hover:text-orange-400 transition-colors">{name}</Link>
                      </li>
                    );
                  }) : (
                    <>
                      <li><Link href="/courses/lera-starters" className="text-[color:var(--brand-on-primary-soft)] hover:text-orange-400 transition-colors">LERA Starters</Link></li>
                      <li><Link href="/courses/lera-explorers" className="text-[color:var(--brand-on-primary-soft)] hover:text-orange-400 transition-colors">LERA Explorers</Link></li>
                      <li><Link href="/courses/lera-primary" className="text-[color:var(--brand-on-primary-soft)] hover:text-orange-400 transition-colors">LERA Primary</Link></li>
                      <li><Link href="/courses/lera-teens" className="text-[color:var(--brand-on-primary-soft)] hover:text-orange-400 transition-colors">LERA Teens</Link></li>
                      <li><Link href="/courses/ielts-sat" className="text-[color:var(--brand-on-primary-soft)] hover:text-orange-400 transition-colors">IELTS & SAT</Link></li>
                      <li><Link href="/courses/business-english" className="text-[color:var(--brand-on-primary-soft)] hover:text-orange-400 transition-colors">Business English</Link></li>
                    </>
                  )}
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Contact Info */}
        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">📍</span>
              <p className="text-[color:var(--brand-on-primary-soft)]">{address}</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-2xl">📞</span>
              <div>
                <a href={`tel:${phone.replace(/\./g, '')}`} className="text-[color:var(--brand-on-primary-soft)] hover:text-orange-400">{phone}</a>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-2xl">🕐</span>
              <p className="text-[color:var(--brand-on-primary-soft)]">{workingHours}</p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-[color:var(--brand-on-primary-soft)] text-sm">
            {cfg?.copyright ? (vi ? cfg.copyright.vi : cfg.copyright.en) : <>© 2024 LERA Academy. {t("allRightsReserved")}</>}
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="text-[color:var(--brand-on-primary-soft)] hover:text-orange-400 text-sm">{t("privacy")}</Link>
            <Link href="/terms" className="text-[color:var(--brand-on-primary-soft)] hover:text-orange-400 text-sm">{t("termsFooter")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
