"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../../../../lib/api";
import Link from "next/link";

interface BrandingSettings {
  logo_url: string;
  logo_alt_text: string;
  logo_alt_text_vi: string;
  favicon_url: string;
  company_name: string;
  company_name_vi: string;
  tagline: string;
  tagline_vi: string;
  primary_color: string;
  secondary_color: string;
  footer_text: string;
  footer_text_vi: string;
  footer_copyright: string;
  footer_copyright_vi: string;
  social_facebook: string;
  social_instagram: string;
  social_youtube: string;
  social_linkedin: string;
  social_tiktok: string;
}

export default function BrandingContentPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<BrandingSettings>({
    logo_url: "",
    logo_alt_text: "LERA Education",
    logo_alt_text_vi: "Giáo dục LERA",
    favicon_url: "",
    company_name: "LERA Education",
    company_name_vi: "Giáo dục LERA",
    tagline: "Inspiring Excellence in English Education",
    tagline_vi: "Truyền cảm hứng xuất sắc trong giáo dục tiếng Anh",
    primary_color: "#3B82F6",
    secondary_color: "#10B981",
    footer_text: "Your trusted partner in English education",
    footer_text_vi: "Đối tác đáng tin cậy trong giáo dục tiếng Anh",
    footer_copyright: "© 2024 LERA Education. All rights reserved.",
    footer_copyright_vi: "© 2024 Giáo dục LERA. Đã đăng ký bản quyền.",
    social_facebook: "",
    social_instagram: "",
    social_youtube: "",
    social_linkedin: "",
    social_tiktok: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"branding" | "footer" | "social">("branding");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await apiFetch("/api/cms-settings/map/branding").catch(() => ({}));
      if (data && typeof data === "object") {
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error("Error fetching branding settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key: `branding_${key}`,
        value: value || ""
      }));
      await apiFetch("/api/cms-settings/batch", {
        method: "PUT",
        body: JSON.stringify({ settings: settingsArray })
      });
      alert("Branding settings saved successfully!");
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
                <h1 className="text-xl font-bold text-gray-900">Branding & Footer</h1>
                <p className="text-sm text-gray-500">Manage logo, colors, footer, and social links</p>
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
            { id: "branding", label: "🎨 Branding", desc: "Logo & Colors" },
            { id: "footer", label: "📄 Footer", desc: "Footer Content" },
            { id: "social", label: "🔗 Social Media", desc: "Social Links" }
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
        {/* Branding Tab */}
        {activeTab === "branding" && (
          <div className="space-y-6">
            {/* Logo Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">🖼️ Logo & Identity</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                  <input
                    type="text"
                    value={settings.logo_url}
                    onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="https://example.com/logo.png"
                  />
                  {settings.logo_url && (
                    <div className="mt-2 p-4 bg-gray-100 rounded-lg">
                      <img src={settings.logo_url} alt="Logo preview" className="h-12 object-contain" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Favicon URL</label>
                  <input
                    type="text"
                    value={settings.favicon_url}
                    onChange={(e) => setSettings({ ...settings, favicon_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="https://example.com/favicon.ico"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo Alt Text (English)</label>
                  <input
                    type="text"
                    value={settings.logo_alt_text}
                    onChange={(e) => setSettings({ ...settings, logo_alt_text: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo Alt Text (Vietnamese)</label>
                  <input
                    type="text"
                    value={settings.logo_alt_text_vi}
                    onChange={(e) => setSettings({ ...settings, logo_alt_text_vi: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">🏢 Company Identity</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name (English)</label>
                  <input
                    type="text"
                    value={settings.company_name}
                    onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name (Vietnamese)</label>
                  <input
                    type="text"
                    value={settings.company_name_vi}
                    onChange={(e) => setSettings({ ...settings, company_name_vi: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tagline (English)</label>
                  <input
                    type="text"
                    value={settings.tagline}
                    onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tagline (Vietnamese)</label>
                  <input
                    type="text"
                    value={settings.tagline_vi}
                    onChange={(e) => setSettings({ ...settings, tagline_vi: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Brand Colors */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">🎨 Brand Colors</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                      className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.primary_color}
                      onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={settings.secondary_color}
                      onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                      className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.secondary_color}
                      onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="#10B981"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Preview:</p>
                <div className="flex gap-4">
                  <button
                    style={{ backgroundColor: settings.primary_color }}
                    className="px-6 py-2 text-white rounded-lg"
                  >
                    Primary Button
                  </button>
                  <button
                    style={{ backgroundColor: settings.secondary_color }}
                    className="px-6 py-2 text-white rounded-lg"
                  >
                    Secondary Button
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Tab */}
        {activeTab === "footer" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">📄 Footer Content</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text (English)</label>
                    <textarea
                      value={settings.footer_text}
                      onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Your trusted partner in English education"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text (Vietnamese)</label>
                    <textarea
                      value={settings.footer_text_vi}
                      onChange={(e) => setSettings({ ...settings, footer_text_vi: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Đối tác đáng tin cậy trong giáo dục tiếng Anh"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Copyright Text (English)</label>
                    <input
                      type="text"
                      value={settings.footer_copyright}
                      onChange={(e) => setSettings({ ...settings, footer_copyright: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="© 2024 LERA Education. All rights reserved."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Copyright Text (Vietnamese)</label>
                    <input
                      type="text"
                      value={settings.footer_copyright_vi}
                      onChange={(e) => setSettings({ ...settings, footer_copyright_vi: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="© 2024 Giáo dục LERA. Đã đăng ký bản quyền."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Preview */}
            <div className="bg-gray-800 rounded-xl p-6 text-white">
              <h3 className="text-sm font-medium text-gray-400 mb-4">Footer Preview</h3>
              <div className="space-y-4">
                <p className="text-gray-300">{settings.footer_text || "Your trusted partner in English education"}</p>
                <p className="text-sm text-gray-500">{settings.footer_copyright || "© 2024 LERA Education. All rights reserved."}</p>
              </div>
            </div>
          </div>
        )}

        {/* Social Media Tab */}
        {activeTab === "social" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">🔗 Social Media Links</h2>
            <div className="space-y-4">
              {[
                { key: "social_facebook", icon: "📘", label: "Facebook", placeholder: "https://facebook.com/yourpage" },
                { key: "social_instagram", icon: "📸", label: "Instagram", placeholder: "https://instagram.com/yourpage" },
                { key: "social_youtube", icon: "📺", label: "YouTube", placeholder: "https://youtube.com/@yourchannel" },
                { key: "social_linkedin", icon: "💼", label: "LinkedIn", placeholder: "https://linkedin.com/company/yourcompany" },
                { key: "social_tiktok", icon: "🎵", label: "TikTok", placeholder: "https://tiktok.com/@yourhandle" }
              ].map((social) => (
                <div key={social.key} className="flex items-center gap-4">
                  <span className="text-2xl w-10">{social.icon}</span>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{social.label}</label>
                    <input
                      type="text"
                      value={settings[social.key as keyof BrandingSettings] || ""}
                      onChange={(e) => setSettings({ ...settings, [social.key]: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder={social.placeholder}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
