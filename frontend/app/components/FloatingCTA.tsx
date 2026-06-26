"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

export default function FloatingCTA() {
  const { t, language } = useLanguage();
  const { getSetting } = useWebsiteSettings();
  const pathname = usePathname() || "";
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const phone = getSetting('contact_phone', '0387633141');
  const zaloUrl = getSetting('social_zalo', `https://zalo.me/${phone.replace(/\./g, '')}`);
  const messengerUrl = getSetting('messenger_url', 'https://m.me/61580971978601');
  
  // CTA text: use website settings if available, fallback to hardcoded translation
  const ctaTextEn = getSetting('floating_cta_en', '');
  const ctaTextVi = getSetting('floating_cta_vi', '');
  const ctaText = language === 'VI' 
    ? (ctaTextVi || t("floatingCta")) 
    : (ctaTextEn || t("floatingCta"));
  const ctaLink = getSetting('floating_cta_link', '#register');
  const ctaEnabled = getSetting('floating_cta_enabled', 'yes');

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 300px
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Public marketing pages only — never on the internal dashboard or auth screens.
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/auth")) return null;
  if (!isVisible || ctaEnabled === 'no') return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Quick Contact Buttons */}
      <div className={`flex flex-col gap-2 transition-all duration-300 ${isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        {/* Phone Call */}
        <a
          href={`tel:${phone.replace(/\./g, '')}`}
          className="w-14 h-14 bg-green-500 rounded-full shadow-lg flex items-center justify-center hover:bg-green-600 transition-all transform hover:scale-110 group"
          title={language === "VI" ? "Gọi ngay" : "Call now"}
        >
          <span className="text-2xl">📞</span>
          <span className="absolute right-16 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {phone}
          </span>
        </a>
        
        {/* Zalo */}
        <a
          href={zaloUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 bg-blue-500 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 transition-all transform hover:scale-110 group"
          title="Chat Zalo"
        >
          <span className="text-white font-bold text-lg">Z</span>
          <span className="absolute right-16 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Chat Zalo
          </span>
        </a>
        
        {/* Messenger/Facebook */}
        <a
          href={messengerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full shadow-lg flex items-center justify-center hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-110 group"
          title="Messenger"
        >
          <span className="text-2xl">💬</span>
          <span className="absolute right-16 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Messenger
          </span>
        </a>
      </div>

      {/* Expanded Menu */}
      {isExpanded && (
        <div className="absolute bottom-20 right-0 bg-white rounded-2xl shadow-2xl p-4 w-64 animate-slideUp">
          <div className="space-y-3">
            <a href={ctaLink} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <span className="text-2xl">🎓</span>
              <span className="text-gray-700 font-medium">{t("scholarshipThisMonth")}</span>
            </a>
            <a href="/courses" className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <span className="text-2xl">📚</span>
              <span className="text-gray-700 font-medium">{t("exploreClass")}</span>
            </a>
            <a href="/about" className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <span className="text-2xl">👨‍🏫</span>
              <span className="text-gray-700 font-medium">{t("teacherQuality")}</span>
            </a>
          </div>
        </div>
      )}

      {/* Main Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="group relative text-white rounded-full shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
        style={{ background: "linear-gradient(135deg, #0a1a5c 0%, #1e3a8a 100%)" }}
      >
        <div className="flex items-center px-6 py-4">
          <span className="text-2xl mr-3 animate-bounce">🎁</span>
          <span className="font-bold whitespace-nowrap">{ctaText}</span>
          <svg 
            className={`w-5 h-5 ml-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </div>
        
        {/* Pulse animation */}
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
        </span>
      </button>
    </div>
  );
}
