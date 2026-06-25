"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";
import Cookies from "js-cookie";
import { hasAuthSession } from "@/lib/api";
import { useRouter } from "next/navigation";

interface MenuItem {
  id: string;
  label: string;
  labelVi: string;
  href: string;
  order: number;
  isActive: boolean;
}

interface HeaderSettings {
  phone: string;
  email: string;
  showPhone: boolean;
  showEmail: boolean;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  linkedinUrl: string;
  showSocialLinks: boolean;
  ctaButtonText: string;
  ctaButtonTextVi: string;
  ctaButtonUrl: string;
}

const defaultMenuItems: MenuItem[] = [
  { id: "1", label: "Home", labelVi: "Trang Chủ", href: "/", order: 1, isActive: true },
  { id: "2", label: "Courses", labelVi: "Khóa Học", href: "/courses", order: 2, isActive: true },
  { id: "2b", label: "Teachers", labelVi: "Giáo Viên", href: "/teachers", order: 3, isActive: true },
  { id: "2a", label: "Book a trial", labelVi: "Học thử", href: "/book-trial", order: 4, isActive: true },
  { id: "3", label: "About", labelVi: "Về Chúng Tôi", href: "/about", order: 5, isActive: true },
];

const defaultSettings: HeaderSettings = {
  phone: "0387.633.141",
  email: "info@lera.edu.vn",
  showPhone: true,
  showEmail: false,
  facebookUrl: "https://facebook.com/leraacademy",
  instagramUrl: "https://instagram.com/leraacademy",
  youtubeUrl: "https://youtube.com/leraacademy",
  linkedinUrl: "",
  showSocialLinks: true,
  ctaButtonText: "Register Now",
  ctaButtonTextVi: "Đăng Ký Ngay",
  ctaButtonUrl: "/book-trial",
};

export default function Header() {
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(defaultMenuItems);
  const [settings, setSettings] = useState<HeaderSettings>(defaultSettings);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auth state
  const [loggedInUser, setLoggedInUser] = useState<{ fullname: string; roleName: string; rolePath: string } | null>(null);

  useEffect(() => {
    fetchHeaderData();
    checkAuthState();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const checkAuthState = () => {
    try {
      const userDataStr = Cookies.get("userData");
      if (hasAuthSession() && userDataStr) {
        const userData = JSON.parse(userDataStr);
        const roleName = (userData.roleName || "USER").toUpperCase();
        let rolePath = "guest";
        switch (roleName) {
          case "CHAIRMAN": rolePath = "chairman"; break;
          case "CEO": rolePath = "ceo"; break;
          case "DIRECTOR": rolePath = "director"; break;
          case "SUPER_ADMIN": case "SUPERADMIN": case "ADMIN": rolePath = "superadmin"; break;
          case "CENTER_ADMIN": rolePath = "centeradmin"; break;
          case "ACADEMIC_MANAGER": rolePath = "academicmanager"; break;
          case "TEACHER": rolePath = "teacher"; break;
          case "TEACHING_ASSISTANT": case "TA": rolePath = "ta"; break;
          case "STUDENT": rolePath = "student"; break;
          case "PARENT": rolePath = "parent"; break;
          case "STAFF": rolePath = "staff"; break;
          case "CENTER_MANAGER": rolePath = "centermanager"; break;
          default: rolePath = "guest"; break;
        }
        setLoggedInUser({
          fullname: userData.fullname || userData.email || "User",
          roleName,
          rolePath,
        });
      }
    } catch (e) {
      // Not logged in
    }
  };

  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("tokenSet");
    Cookies.remove("userData");
    Cookies.remove("role");
    Cookies.remove("actualRole");
    Cookies.remove("userPermissions");
    setLoggedInUser(null);
    setUserDropdownOpen(false);
    router.push("/");
  };

  const getFirstName = (fullname: string) => {
    return fullname.split(" ")[0];
  };

  const getInitials = (fullname: string) => {
    const parts = fullname.split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (parts[0]?.[0] || "U").toUpperCase();
  };

  const fetchHeaderData = async () => {
    try {
      // Fetch header settings from CMS
      const res = await fetch("/api/cms-settings/map/header");
      if (res.ok) {
        const data = await res.json();
        
        // Parse menu items
        if (data.header_menu_items) {
          try {
            const parsed = JSON.parse(data.header_menu_items);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setMenuItems(parsed.filter((item: MenuItem) => item.isActive).sort((a: MenuItem, b: MenuItem) => a.order - b.order));
            }
          } catch (e) { /* use defaults */ }
        }

        // Parse settings
        setSettings({
          phone: data.header_phone || defaultSettings.phone,
          email: data.header_email || defaultSettings.email,
          showPhone: data.header_show_phone !== "false",
          showEmail: data.header_show_email === "true",
          facebookUrl: data.header_facebook || defaultSettings.facebookUrl,
          instagramUrl: data.header_instagram || defaultSettings.instagramUrl,
          youtubeUrl: data.header_youtube || defaultSettings.youtubeUrl,
          linkedinUrl: data.header_linkedin || "",
          showSocialLinks: data.header_show_social !== "false",
          ctaButtonText: data.header_cta_text_en || defaultSettings.ctaButtonText,
          ctaButtonTextVi: data.header_cta_text_vi || defaultSettings.ctaButtonTextVi,
          ctaButtonUrl: data.header_cta_url || defaultSettings.ctaButtonUrl,
        });
      }
    } catch (error) {
      // Use defaults
    }
  };

  const getMenuLabel = (item: MenuItem) => language === "VI" ? item.labelVi : item.label;
  const ctaText = language === "VI" ? settings.ctaButtonTextVi : settings.ctaButtonText;
  
  // Scroll detection for header effects
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-lg' : ''}`}>
      {/* Top bar with contact info */}
      {(settings.showPhone || settings.showEmail || settings.showSocialLinks) && (
        <div className={`bg-gradient-to-r from-[#0a1a5c] via-[#1e3a8a] to-[#0a1a5c] text-white text-sm transition-all duration-300 ${scrolled ? 'py-1' : 'py-2'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div className="flex items-center gap-4">
              {settings.showPhone && (
                <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="flex items-center gap-1 hover:text-yellow-300 transition-colors group">
                  <span className="group-hover:animate-bounce">📞</span> {settings.phone}
                </a>
              )}
              {settings.showEmail && (
                <a href={`mailto:${settings.email}`} className="flex items-center gap-1 hover:text-yellow-300 transition-colors group">
                  <span className="group-hover:animate-bounce">✉️</span> {settings.email}
                </a>
              )}
            </div>
            {settings.showSocialLinks && (
              <div className="hidden sm:flex items-center gap-3">
                {settings.facebookUrl && (
                  <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-300 hover:scale-125 transition-all inline-flex" style={{ width: 16, height: 16 }} title="Facebook">
                    <svg className="w-4 h-4" width={16} height={16} fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/></svg>
                  </a>
                )}
                {settings.instagramUrl && (
                  <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-pink-300 hover:scale-125 transition-all inline-flex" style={{ width: 16, height: 16 }} title="Instagram">
                    <svg className="w-4 h-4" width={16} height={16} fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                )}
                {settings.youtubeUrl && (
                  <a href={settings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="hover:text-red-400 hover:scale-125 transition-all inline-flex" style={{ width: 16, height: 16 }} title="YouTube">
                    <svg className="w-4 h-4" width={16} height={16} fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </a>
                )}
                {settings.linkedinUrl && (
                  <a href={settings.linkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-300 hover:scale-125 transition-all inline-flex" style={{ width: 16, height: 16 }} title="LinkedIn">
                    <svg className="w-4 h-4" width={16} height={16} fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main header */}
      <div className={`bg-white/95 backdrop-blur-md transition-all duration-300 ${scrolled ? 'shadow-md py-2' : 'shadow-sm py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo with animation */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className={`bg-gradient-to-br from-[#0a1a5c] to-[#3b82f6] rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg ${scrolled ? 'w-10 h-10' : 'w-14 h-14'}`}>
                <span className={`text-white font-bold transition-all ${scrolled ? 'text-xl' : 'text-3xl'}`}>L</span>
              </div>
              <div className="flex items-baseline gap-2 leading-none whitespace-nowrap">
                <span className={`font-extrabold text-[#0a1a5c] tracking-wide transition-all ${scrolled ? 'text-xl' : 'text-3xl'}`}>LERA</span>
                <span className={`font-semibold bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent transition-all ${scrolled ? 'text-xl' : 'text-3xl'}`}>ACADEMY</span>
              </div>
            </Link>

            {/* Navigation with hover effects */}
            <nav className="hidden md:flex items-center space-x-8">
              {menuItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="relative text-gray-700 hover:text-blue-600 font-medium transition-colors group"
                >
                  {getMenuLabel(item)}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center space-x-4">
              {/* Language Toggle */}
              <div className="flex items-center bg-gray-100 rounded-full p-1">
                <button
                  onClick={() => setLanguage("EN")}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                    language === "EN"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage("VI")}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                    language === "VI"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  VI
                </button>
              </div>

              {!loggedInUser && (
                <Link
                  href="/auth/login"
                  className="hidden sm:block text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  {language === "VI" ? "Đăng Nhập" : "Login"}
                </Link>
              )}

              <Link
                href={loggedInUser ? `/dashboard/${loggedInUser.rolePath}` : settings.ctaButtonUrl}
                className="hidden sm:block px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
              >
                {loggedInUser ? (language === "VI" ? "Bảng Điều Khiển" : "Dashboard") : ctaText}
              </Link>

              {/* User avatar / dropdown when logged in */}
              {loggedInUser && (
                <div className="relative hidden sm:block" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2 focus:outline-none group"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-110 transition-transform">
                      {getInitials(loggedInUser.fullname)}
                    </div>
                    <span className="text-gray-700 font-medium text-sm max-w-[100px] truncate">
                      {getFirstName(loggedInUser.fullname)}
                    </span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-fadeIn">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">{loggedInUser.fullname}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{loggedInUser.roleName.replace(/_/g, " ")}</p>
                      </div>
                      <Link
                        href={`/dashboard/${loggedInUser.rolePath}`}
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        {language === "VI" ? "Bảng Điều Khiển" : "Dashboard"}
                      </Link>
                      <Link
                        href={`/dashboard/${loggedInUser.rolePath}/profile`}
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        {language === "VI" ? "Hồ Sơ" : "Profile"}
                      </Link>
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                          {language === "VI" ? "Đăng Xuất" : "Logout"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile menu button */}
              <button 
                className="md:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100 animate-fadeIn">
              <nav className="flex flex-col space-y-4">
                {menuItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="text-gray-700 hover:text-blue-600 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {getMenuLabel(item)}
                  </Link>
                ))}
                {!loggedInUser && (
                  <Link
                    href="/auth/login"
                    className="px-6 py-2.5 border border-blue-200 text-blue-700 rounded-full font-semibold text-center hover:bg-blue-50 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {language === "VI" ? "Đăng Nhập" : "Login"}
                  </Link>
                )}
                <Link
                  href={loggedInUser ? `/dashboard/${loggedInUser.rolePath}` : settings.ctaButtonUrl}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full font-semibold text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {loggedInUser ? (language === "VI" ? "Bảng Điều Khiển" : "Dashboard") : ctaText}
                </Link>
                {loggedInUser && (
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="px-6 py-2.5 border border-red-200 text-red-600 rounded-full font-semibold text-center hover:bg-red-50 transition-colors"
                  >
                    {language === "VI" ? "Đăng Xuất" : "Logout"}
                  </button>
                )}
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
