"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../../../../lib/api";
import Link from "next/link";

interface SEOSettings {
  site_title: string;
  site_title_vi: string;
  site_description: string;
  site_description_vi: string;
  site_keywords: string;
  site_keywords_vi: string;
  og_image: string;
  twitter_handle: string;
  google_analytics_id: string;
  google_tag_manager_id: string;
  facebook_pixel_id: string;
  robots_txt: string;
  canonical_url: string;
  structured_data: string;
}

interface PageSEO {
  page: string;
  title: string;
  titleVi: string;
  description: string;
  descriptionVi: string;
  keywords: string;
  keywordsVi: string;
}

export default function SEOContentPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<SEOSettings>({
    site_title: "LERA Education - English Learning Center",
    site_title_vi: "LERA - Trung tâm Giáo dục Tiếng Anh",
    site_description: "Premier English education for all ages. Expert teachers, proven methods, outstanding results.",
    site_description_vi: "Giáo dục tiếng Anh hàng đầu cho mọi lứa tuổi. Giáo viên chuyên nghiệp, phương pháp đã được chứng minh, kết quả xuất sắc.",
    site_keywords: "english education, language learning, LERA, english courses, vietnam",
    site_keywords_vi: "giáo dục tiếng anh, học ngoại ngữ, LERA, khóa học tiếng anh, việt nam",
    og_image: "",
    twitter_handle: "",
    google_analytics_id: "",
    google_tag_manager_id: "",
    facebook_pixel_id: "",
    robots_txt: "User-agent: *\nAllow: /",
    canonical_url: "",
    structured_data: ""
  });
  const [pageSEO, setPageSEO] = useState<PageSEO[]>([
    { page: "home", title: "", titleVi: "", description: "", descriptionVi: "", keywords: "", keywordsVi: "" },
    { page: "about", title: "", titleVi: "", description: "", descriptionVi: "", keywords: "", keywordsVi: "" },
    { page: "courses", title: "", titleVi: "", description: "", descriptionVi: "", keywords: "", keywordsVi: "" },
    { page: "contact", title: "", titleVi: "", description: "", descriptionVi: "", keywords: "", keywordsVi: "" },
    { page: "centers", title: "", titleVi: "", description: "", descriptionVi: "", keywords: "", keywordsVi: "" }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"global" | "pages" | "analytics">("global");
  const [editingPage, setEditingPage] = useState<PageSEO | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await apiFetch("/api/cms-settings/map/seo").catch(() => ({}));
      if (data && typeof data === "object") {
        // Map settings from API
        const mappedSettings: Partial<SEOSettings> = {};
        Object.entries(data).forEach(([key, value]) => {
          const cleanKey = key.replace("seo_", "");
          if (cleanKey in settings) {
            (mappedSettings as Record<string, string>)[cleanKey] = value as string;
          }
        });
        setSettings((prev) => ({ ...prev, ...mappedSettings }));
      }
    } catch (error) {
      console.error("Error fetching SEO settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key: `seo_${key}`,
        value: value || ""
      }));
      
      // Add page-specific SEO
      pageSEO.forEach((page) => {
        settingsArray.push(
          { key: `seo_${page.page}_title`, value: page.title },
          { key: `seo_${page.page}_title_vi`, value: page.titleVi },
          { key: `seo_${page.page}_description`, value: page.description },
          { key: `seo_${page.page}_description_vi`, value: page.descriptionVi },
          { key: `seo_${page.page}_keywords`, value: page.keywords },
          { key: `seo_${page.page}_keywords_vi`, value: page.keywordsVi }
        );
      });

      await apiFetch("/api/cms-settings/batch", {
        method: "PUT",
        body: JSON.stringify({ settings: settingsArray })
      });
      alert("SEO settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Error saving settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/chairman/website-content" className="text-gray-500 hover:text-gray-700">
                ← Back
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SEO Settings</h1>
                <p className="text-sm text-gray-500">Manage search engine optimization and analytics</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSaving ? "Saving..." : "💾 Save All Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-6 pt-6">
        <div className="flex gap-2 border-b border-gray-200">
          {[
            { id: "global", label: "🌐 Global SEO", desc: "Site-wide settings" },
            { id: "pages", label: "📄 Page SEO", desc: "Per-page settings" },
            { id: "analytics", label: "📊 Analytics", desc: "Tracking codes" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Global SEO Tab */}
        {activeTab === "global" && (
          <div className="space-y-6">
            {/* Site Title & Description */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">📝 Site Metadata</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Site Title (English)</label>
                    <input
                      type="text"
                      value={settings.site_title}
                      onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="LERA Education"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Site Title (Vietnamese)</label>
                    <input
                      type="text"
                      value={settings.site_title_vi}
                      onChange={(e) => setSettings({ ...settings, site_title_vi: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Giáo dục LERA"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Site Description (English)</label>
                    <textarea
                      value={settings.site_description}
                      onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Premier English education..."
                    />
                    <p className="text-xs text-gray-400 mt-1">{settings.site_description.length}/160 characters</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Site Description (Vietnamese)</label>
                    <textarea
                      value={settings.site_description_vi}
                      onChange={(e) => setSettings({ ...settings, site_description_vi: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Giáo dục tiếng Anh hàng đầu..."
                    />
                    <p className="text-xs text-gray-400 mt-1">{settings.site_description_vi.length}/160 characters</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Keywords (English)</label>
                    <input
                      type="text"
                      value={settings.site_keywords}
                      onChange={(e) => setSettings({ ...settings, site_keywords: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="english, education, learning"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Keywords (Vietnamese)</label>
                    <input
                      type="text"
                      value={settings.site_keywords_vi}
                      onChange={(e) => setSettings({ ...settings, site_keywords_vi: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="tiếng anh, giáo dục, học tập"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Social Sharing */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">📱 Social Sharing</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Open Graph Image URL</label>
                  <input
                    type="text"
                    value={settings.og_image}
                    onChange={(e) => setSettings({ ...settings, og_image: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="https://example.com/og-image.jpg"
                  />
                  <p className="text-xs text-gray-400 mt-1">Recommended size: 1200x630 pixels</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Twitter Handle</label>
                    <input
                      type="text"
                      value={settings.twitter_handle}
                      onChange={(e) => setSettings({ ...settings, twitter_handle: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="@leraeducation"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Canonical URL</label>
                    <input
                      type="text"
                      value={settings.canonical_url}
                      onChange={(e) => setSettings({ ...settings, canonical_url: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="https://leraeducation.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">⚙️ Advanced</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Robots.txt</label>
                  <textarea
                    value={settings.robots_txt}
                    onChange={(e) => setSettings({ ...settings, robots_txt: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                    placeholder="User-agent: *\nAllow: /"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Structured Data (JSON-LD)</label>
                  <textarea
                    value={settings.structured_data}
                    onChange={(e) => setSettings({ ...settings, structured_data: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                    placeholder='{"@context": "https://schema.org", ...}'
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page SEO Tab */}
        {activeTab === "pages" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-4">
              Configure SEO settings for individual pages. Leave blank to use global defaults.
            </p>
            {pageSEO.map((page) => (
              <div
                key={page.page}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 capitalize">{page.page} Page</h3>
                    <p className="text-sm text-gray-500">/{page.page === "home" ? "" : page.page}</p>
                  </div>
                  <button
                    onClick={() => setEditingPage(page)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    ✏️ Configure SEO
                  </button>
                </div>
                {page.title && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                    <p className="text-gray-700"><strong>Title:</strong> {page.title}</p>
                    {page.description && <p className="text-gray-500 mt-1">{page.description}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">📊 Analytics & Tracking</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Google Analytics ID
                  </label>
                  <input
                    type="text"
                    value={settings.google_analytics_id}
                    onChange={(e) => setSettings({ ...settings, google_analytics_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="G-XXXXXXXXXX or UA-XXXXXXXX-X"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Google Tag Manager ID
                  </label>
                  <input
                    type="text"
                    value={settings.google_tag_manager_id}
                    onChange={(e) => setSettings({ ...settings, google_tag_manager_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="GTM-XXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facebook Pixel ID
                  </label>
                  <input
                    type="text"
                    value={settings.facebook_pixel_id}
                    onChange={(e) => setSettings({ ...settings, facebook_pixel_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="XXXXXXXXXXXXXXXX"
                  />
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <h3 className="font-bold text-yellow-800 mb-2">⚠️ Important Note</h3>
              <p className="text-sm text-yellow-700">
                After updating analytics IDs, clear the browser cache and verify tracking is working 
                using the respective platform&apos;s debugging tools (Google Tag Assistant, Facebook Pixel Helper).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Page SEO Edit Modal */}
      {editingPage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold capitalize">{editingPage.page} Page SEO</h2>
                <button onClick={() => setEditingPage(null)} className="text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title (English)</label>
                  <input
                    type="text"
                    value={editingPage.title}
                    onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title (Vietnamese)</label>
                  <input
                    type="text"
                    value={editingPage.titleVi}
                    onChange={(e) => setEditingPage({ ...editingPage, titleVi: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (English)</label>
                  <textarea
                    value={editingPage.description}
                    onChange={(e) => setEditingPage({ ...editingPage, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Vietnamese)</label>
                  <textarea
                    value={editingPage.descriptionVi}
                    onChange={(e) => setEditingPage({ ...editingPage, descriptionVi: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keywords (English)</label>
                  <input
                    type="text"
                    value={editingPage.keywords}
                    onChange={(e) => setEditingPage({ ...editingPage, keywords: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keywords (Vietnamese)</label>
                  <input
                    type="text"
                    value={editingPage.keywordsVi}
                    onChange={(e) => setEditingPage({ ...editingPage, keywordsVi: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setEditingPage(null)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setPageSEO(pageSEO.map(p => p.page === editingPage.page ? editingPage : p));
                  setEditingPage(null);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Page SEO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
