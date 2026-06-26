"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { exportToCsv, datedFilename } from "@/lib/export-csv";

interface SEOSettings {
  title: { en: string; vi: string };
  description: { en: string; vi: string };
  keywords: { en: string; vi: string };
  ogImage: string;
  favicon: string;
  canonicalUrl: string;
  googleAnalyticsId: string;
  facebookPixelId: string;
  robotsTxt: string;
  structuredData: boolean;
  sitemapEnabled: boolean;
}

interface PageSEO {
  path: string;
  name: string;
  title: { en: string; vi: string };
  description: { en: string; vi: string };
  indexed: boolean;
}

const initialSettings: SEOSettings = {
  title: { 
    en: "LERA Academy - Learn English with Cambridge Methodology", 
    vi: "LERA Academy - Học Tiếng Anh Theo Phương Pháp Cambridge" 
  },
  description: { 
    en: "LERA Academy offers premium English courses using Cambridge methodology. Join 10,000+ students learning English effectively.", 
    vi: "LERA Academy cung cấp khóa học tiếng Anh cao cấp theo phương pháp Cambridge. Tham gia cùng 10,000+ học viên học tiếng Anh hiệu quả." 
  },
  keywords: { 
    en: "English courses, Cambridge English, IELTS preparation, English learning Vietnam, LERA Academy", 
    vi: "Khóa học tiếng Anh, Cambridge English, Luyện thi IELTS, Học tiếng Anh Việt Nam, LERA Academy" 
  },
  ogImage: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200",
  favicon: "/favicon.ico",
  canonicalUrl: "https://leraacademy.vn",
  googleAnalyticsId: "G-XXXXXXXXXX",
  facebookPixelId: "1234567890",
  robotsTxt: "User-agent: *\nAllow: /\nDisallow: /dashboard/\nSitemap: https://leraacademy.vn/sitemap.xml",
  structuredData: true,
  sitemapEnabled: true,
};

const initialPages: PageSEO[] = [
  { path: "/", name: "Homepage", title: { en: "LERA Academy - Home", vi: "LERA Academy - Trang Chủ" }, description: { en: "Welcome to LERA Academy", vi: "Chào mừng đến LERA Academy" }, indexed: true },
  { path: "/courses", name: "Courses", title: { en: "Our Courses | LERA", vi: "Khóa Học | LERA" }, description: { en: "Explore our English courses", vi: "Khám phá các khóa học tiếng Anh" }, indexed: true },
  { path: "/about", name: "About Us", title: { en: "About Us | LERA", vi: "Về Chúng Tôi | LERA" }, description: { en: "Learn about LERA Academy", vi: "Tìm hiểu về LERA Academy" }, indexed: true },
  { path: "/contact", name: "Contact", title: { en: "Contact Us | LERA", vi: "Liên Hệ | LERA" }, description: { en: "Get in touch with us", vi: "Liên hệ với chúng tôi" }, indexed: true },
  { path: "/blog", name: "Blog", title: { en: "Blog | LERA", vi: "Blog | LERA" }, description: { en: "English learning tips and news", vi: "Mẹo học tiếng Anh và tin tức" }, indexed: true },
];

// Coerce any value into a { en, vi } pair so render/edit never hit `undefined.en`.
function toBilingual(v: any): { en: string; vi: string } {
  if (v && typeof v === "object") return { en: String(v.en ?? ""), vi: String(v.vi ?? v.en ?? "") };
  const s = v == null ? "" : String(v);
  return { en: s, vi: s };
}
// Normalize SEO data loaded from the CMS (older/foreign saves may have the wrong shape) so the
// page can't crash on a malformed `seo_settings` / `seo_pages` value.
function normalizeSettings(s: any): SEOSettings {
  return {
    ...initialSettings,
    ...(s && typeof s === "object" ? s : {}),
    title: toBilingual(s?.title),
    description: toBilingual(s?.description),
    keywords: toBilingual(s?.keywords),
  };
}
function normalizePage(p: any): PageSEO {
  return {
    ...(p && typeof p === "object" ? p : {}),
    path: p?.path ?? "",
    name: p?.name ?? p?.path ?? "Page",
    title: toBilingual(p?.title),
    description: toBilingual(p?.description),
    indexed: p?.indexed !== false,
  };
}

export default function SEOSettings() {
  const [settings, setSettings] = useState<SEOSettings>(initialSettings);
  const [pages, setPages] = useState<PageSEO[]>(initialPages);
  const [activeTab, setActiveTab] = useState<"global" | "pages" | "analytics" | "advanced">("global");
  const [lang, setLang] = useState<"en" | "vi">("en");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSEOSettings();
  }, []);

  const fetchSEOSettings = async () => {
    try {
      // apiFetch adds the JWT (these endpoints are STAFF-gated) and returns parsed JSON.
      const [settingsData, pagesData] = await Promise.all([
        apiFetch("/api/cms-settings/key/seo_settings").catch(() => null),
        apiFetch("/api/cms-settings/key/seo_pages").catch(() => null),
      ]);
      if (settingsData?.settingValue) setSettings(normalizeSettings(JSON.parse(settingsData.settingValue)));
      if (pagesData?.settingValue) {
        const parsed = JSON.parse(pagesData.settingValue);
        setPages(Array.isArray(parsed) ? parsed.map(normalizePage) : initialPages);
      }
    } catch (err) {
      console.log("No existing SEO settings, using defaults");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      // apiFetch sends auth and throws on non-2xx, so success only shows on a real save
      // (the old raw fetch() 401'd silently yet still alerted "saved").
      await Promise.all([
        apiFetch("/api/cms-settings/key/seo_settings", {
          method: "PUT",
          body: JSON.stringify({ value: JSON.stringify(settings), category: "seo" }),
        }),
        apiFetch("/api/cms-settings/key/seo_pages", {
          method: "PUT",
          body: JSON.stringify({ value: JSON.stringify(pages), category: "seo" }),
        }),
      ]);
      alert("✅ SEO settings saved successfully!");
    } catch (err: any) {
      setError(err?.message || "Failed to save SEO settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span>Public Website</span>
            <span>/</span>
            <span className="text-gray-900">SEO Settings</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">🔍 SEO Settings</h1>
          <p className="text-gray-500">Optimize your website for search engines</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? "⏳ Saving..." : "💾 Save All Settings"}
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b flex">
          {(["global", "pages", "analytics", "advanced"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === tab 
                  ? "text-blue-600 border-b-2 border-blue-600" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "global" && "🌍 Global SEO"}
              {tab === "pages" && "📄 Page SEO"}
              {tab === "analytics" && "📊 Analytics"}
              {tab === "advanced" && "⚙️ Advanced"}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Language Toggle */}
          {(activeTab === "global" || activeTab === "pages") && (
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setLang("en")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  lang === "en" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                🇬🇧 English
              </button>
              <button
                onClick={() => setLang("vi")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  lang === "vi" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                🇻🇳 Tiếng Việt
              </button>
            </div>
          )}

          {/* Global SEO Tab */}
          {activeTab === "global" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Title ({lang === "en" ? "English" : "Vietnamese"})
                </label>
                <input
                  type="text"
                  value={settings.title[lang]}
                  onChange={(e) => setSettings({ ...settings, title: { ...settings.title, [lang]: e.target.value } })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">Recommended: 50-60 characters. Current: {settings.title[lang].length}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Description ({lang === "en" ? "English" : "Vietnamese"})
                </label>
                <textarea
                  value={settings.description[lang]}
                  onChange={(e) => setSettings({ ...settings, description: { ...settings.description, [lang]: e.target.value } })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">Recommended: 150-160 characters. Current: {settings.description[lang].length}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords ({lang === "en" ? "English" : "Vietnamese"})
                </label>
                <input
                  type="text"
                  value={settings.keywords[lang]}
                  onChange={(e) => setSettings({ ...settings, keywords: { ...settings.keywords, [lang]: e.target.value } })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">Comma-separated keywords</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">OG Image URL</label>
                <input
                  type="text"
                  value={settings.ogImage}
                  onChange={(e) => setSettings({ ...settings, ogImage: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                {settings.ogImage && (
                  <img src={settings.ogImage} alt="OG Preview" className="mt-2 w-64 h-32 object-cover rounded-lg border" />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Canonical URL</label>
                <input
                  type="text"
                  value={settings.canonicalUrl}
                  onChange={(e) => setSettings({ ...settings, canonicalUrl: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Preview */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-gray-700 mb-3">🔎 Google Search Preview</h3>
                <div className="bg-white p-4 rounded border max-w-xl">
                  <p className="text-blue-700 text-lg hover:underline cursor-pointer">{settings.title[lang]}</p>
                  <p className="text-green-700 text-sm">{settings.canonicalUrl}</p>
                  <p className="text-gray-600 text-sm">{settings.description[lang]}</p>
                </div>
              </div>
            </div>
          )}

          {/* Pages SEO Tab */}
          {activeTab === "pages" && (
            <div className="space-y-4">
              {pages.map((page, index) => (
                <div key={page.path} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900">{page.name}</h3>
                      <p className="text-sm text-gray-500">{page.path}</p>
                    </div>
                    <label className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={page.indexed}
                        onChange={(e) => {
                          const newPages = [...pages];
                          newPages[index].indexed = e.target.checked;
                          setPages(newPages);
                        }}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm text-gray-600">Index</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Title ({lang.toUpperCase()})</label>
                      <input
                        type="text"
                        value={page.title[lang]}
                        onChange={(e) => {
                          const newPages = [...pages];
                          newPages[index].title[lang] = e.target.value;
                          setPages(newPages);
                        }}
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Description ({lang.toUpperCase()})</label>
                      <input
                        type="text"
                        value={page.description[lang]}
                        onChange={(e) => {
                          const newPages = [...pages];
                          newPages[index].description[lang] = e.target.value;
                          setPages(newPages);
                        }}
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Google Analytics ID</label>
                <input
                  type="text"
                  value={settings.googleAnalyticsId}
                  onChange={(e) => setSettings({ ...settings, googleAnalyticsId: e.target.value })}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">Enter your GA4 measurement ID</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Facebook Pixel ID</label>
                <input
                  type="text"
                  value={settings.facebookPixelId}
                  onChange={(e) => setSettings({ ...settings, facebookPixelId: e.target.value })}
                  placeholder="1234567890"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input 
                    type="checkbox" 
                    checked={settings.structuredData}
                    onChange={(e) => setSettings({ ...settings, structuredData: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <div>
                    <p className="font-medium">Enable Structured Data</p>
                    <p className="text-sm text-gray-500">JSON-LD for rich snippets</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input 
                    type="checkbox" 
                    checked={settings.sitemapEnabled}
                    onChange={(e) => setSettings({ ...settings, sitemapEnabled: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <div>
                    <p className="font-medium">Auto-generate Sitemap</p>
                    <p className="text-sm text-gray-500">XML sitemap at /sitemap.xml</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === "advanced" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">robots.txt</label>
                <textarea
                  value={settings.robotsTxt}
                  onChange={(e) => setSettings({ ...settings, robotsTxt: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-bold text-yellow-800 mb-2">⚠️ Advanced Settings</h3>
                <p className="text-sm text-yellow-700">
                  Be careful when modifying these settings. Incorrect configuration may affect your search engine rankings.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() =>
                    exportToCsv(datedFilename("seo_pages"), pages, [
                      { key: "name", label: "Page" },
                      { key: "path", label: "Path" },
                      { key: (p) => p.title.en, label: "Title (EN)" },
                      { key: (p) => p.title.vi, label: "Title (VI)" },
                      { key: (p) => p.description.en, label: "Description (EN)" },
                      { key: (p) => p.description.vi, label: "Description (VI)" },
                      { key: (p) => (p.indexed ? "Yes" : "No"), label: "Indexed" },
                    ])
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  📥 Export SEO Config
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  📤 Import SEO Config
                </button>
                <button
                  onClick={() =>
                    window.open(`${settings.canonicalUrl.replace(/\/$/, "")}/sitemap.xml`, "_blank")
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  🔄 Test Sitemap
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
