"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";

interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
  url: string;
  enabled: boolean;
  followers?: string;
  engagement?: string;
}

interface SocialPixel {
  id: string;
  platform: string;
  pixelId: string;
  enabled: boolean;
}

export default function SocialMediaPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"platforms" | "pixels" | "sharing">("platforms");

  const [platforms, setPlatforms] = useState<SocialPlatform[]>([
    { id: "facebook", name: "Facebook", icon: "📘", color: "#1877F2", url: "", enabled: true, followers: "12.5K", engagement: "4.2%" },
    { id: "instagram", name: "Instagram", icon: "📸", color: "#E4405F", url: "", enabled: true, followers: "8.3K", engagement: "6.8%" },
    { id: "tiktok", name: "TikTok", icon: "🎵", color: "#000000", url: "", enabled: true, followers: "5.1K", engagement: "12.4%" },
    { id: "youtube", name: "YouTube", icon: "▶️", color: "#FF0000", url: "", enabled: false, followers: "2.1K", engagement: "3.1%" },
    { id: "linkedin", name: "LinkedIn", icon: "💼", color: "#0A66C2", url: "", enabled: false, followers: "1.8K", engagement: "2.5%" },
    { id: "twitter", name: "X (Twitter)", icon: "🐦", color: "#1DA1F2", url: "", enabled: false, followers: "956", engagement: "1.8%" },
    { id: "zalo", name: "Zalo", icon: "💬", color: "#0068FF", url: "", enabled: true, followers: "3.2K", engagement: "8.5%" },
  ]);

  const [pixels, setPixels] = useState<SocialPixel[]>([
    { id: "fb_pixel", platform: "Facebook Pixel", pixelId: "", enabled: false },
    { id: "ga4", platform: "Google Analytics 4", pixelId: "", enabled: false },
    { id: "gtm", platform: "Google Tag Manager", pixelId: "", enabled: false },
    { id: "tiktok_pixel", platform: "TikTok Pixel", pixelId: "", enabled: false },
    { id: "linkedin_insight", platform: "LinkedIn Insight Tag", pixelId: "", enabled: false },
  ]);

  const [sharingDefaults, setSharingDefaults] = useState({
    ogTitle: "LERA Education - English Learning Center",
    ogTitleVi: "LERA - Trung tâm Giáo dục Tiếng Anh",
    ogDescription: "Premier English education for all ages. Expert teachers, proven methods.",
    ogDescriptionVi: "Giáo dục tiếng Anh hàng đầu cho mọi lứa tuổi.",
    ogImage: "",
    twitterCard: "summary_large_image",
    twitterHandle: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // First try to fetch from social-platforms API
      const platformsData = await apiFetch("/api/social-platforms/active").catch(() => []);
      if (Array.isArray(platformsData) && platformsData.length > 0) {
        const updatedPlatforms = platforms.map((p) => {
          const apiPlatform = platformsData.find((ap: Record<string, unknown>) => 
            (ap.platformName as string || "").toLowerCase() === p.id.toLowerCase()
          );
          if (apiPlatform) {
            return {
              ...p,
              url: apiPlatform.pageUrl as string || "",
              enabled: apiPlatform.isActive as boolean ?? true,
              followers: apiPlatform.followers as string || p.followers,
            };
          }
          return p;
        });
        setPlatforms(updatedPlatforms);
      }

      // Also try CMS settings for additional config
      const cmsData = await apiFetch("/api/cms-settings/map/social").catch(() => null);
      if (cmsData && typeof cmsData === "object") {
        // Update platforms with CMS data if social-platforms API didn't have data
        const updatedPlatforms = platforms.map((p) => ({
          ...p,
          url: p.url || cmsData[`social_${p.id}_url`] || "",
          enabled: p.enabled ?? cmsData[`social_${p.id}_enabled`] !== "false",
        }));
        setPlatforms(updatedPlatforms);

        // Map pixels
        const updatedPixels = pixels.map((px) => ({
          ...px,
          pixelId: cmsData[`pixel_${px.id}`] || "",
          enabled: !!cmsData[`pixel_${px.id}`],
        }));
        setPixels(updatedPixels);

        // Map sharing defaults
        setSharingDefaults({
          ogTitle: cmsData.og_title || sharingDefaults.ogTitle,
          ogTitleVi: cmsData.og_title_vi || sharingDefaults.ogTitleVi,
          ogDescription: cmsData.og_description || sharingDefaults.ogDescription,
          ogDescriptionVi: cmsData.og_description_vi || sharingDefaults.ogDescriptionVi,
          ogImage: cmsData.og_image || "",
          twitterCard: cmsData.twitter_card || "summary_large_image",
          twitterHandle: cmsData.twitter_handle || "",
        });
      }
    } catch (error) {
      console.error("Error fetching social settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const settings: { key: string; value: string }[] = [];

      // Platform settings
      platforms.forEach((p) => {
        settings.push({ key: `social_${p.id}_url`, value: p.url });
        settings.push({ key: `social_${p.id}_enabled`, value: String(p.enabled) });
      });

      // Pixel settings
      pixels.forEach((px) => {
        settings.push({ key: `pixel_${px.id}`, value: px.pixelId });
      });

      // Sharing defaults
      settings.push({ key: "og_title", value: sharingDefaults.ogTitle });
      settings.push({ key: "og_title_vi", value: sharingDefaults.ogTitleVi });
      settings.push({ key: "og_description", value: sharingDefaults.ogDescription });
      settings.push({ key: "og_description_vi", value: sharingDefaults.ogDescriptionVi });
      settings.push({ key: "og_image", value: sharingDefaults.ogImage });
      settings.push({ key: "twitter_card", value: sharingDefaults.twitterCard });
      settings.push({ key: "twitter_handle", value: sharingDefaults.twitterHandle });

      await apiFetch("/api/cms-settings/batch", {
        method: "PUT",
        body: JSON.stringify({ settings }),
      });
      alert("Social media settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Error saving settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const updatePlatform = (id: string, field: keyof SocialPlatform, value: string | boolean) => {
    setPlatforms((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const updatePixel = (id: string, field: keyof SocialPixel, value: string | boolean) => {
    setPixels((prev) => prev.map((px) => (px.id === id ? { ...px, [field]: value } : px)));
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
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/chairman/marketing" className="text-gray-500 hover:text-gray-700">
                ← Back
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">📱 Social Media Management</h1>
                <p className="text-sm text-gray-500">Manage social links, tracking pixels, and sharing defaults</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              {isSaving ? "Saving..." : "💾 Save All Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-6 pt-6">
        <div className="flex gap-2 border-b border-gray-200">
          {[
            { id: "platforms", label: "🔗 Social Platforms", desc: "Links & profiles" },
            { id: "pixels", label: "📊 Tracking Pixels", desc: "Analytics & ads" },
            { id: "sharing", label: "🔄 Sharing Defaults", desc: "OG & meta tags" },
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
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Social Platforms Tab */}
        {activeTab === "platforms" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-bold text-gray-900">Social Media Profiles</h2>
                <p className="text-sm text-gray-500">Configure your organization's social media links</p>
              </div>
              <div className="divide-y divide-gray-100">
                {platforms.map((platform) => (
                  <div key={platform.id} className="p-4 flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${platform.color}20` }}
                    >
                      {platform.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-gray-900">{platform.name}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={platform.enabled}
                            onChange={(e) => updatePlatform(platform.id, "enabled", e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                        {platform.followers && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            {platform.followers} followers
                          </span>
                        )}
                        {platform.engagement && (
                          <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                            {platform.engagement} engagement
                          </span>
                        )}
                      </div>
                      <input
                        type="url"
                        value={platform.url}
                        onChange={(e) => updatePlatform(platform.id, "url", e.target.value)}
                        placeholder={`https://${platform.id}.com/lera-education`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={!platform.enabled}
                      />
                    </div>
                    {platform.url && (
                      <a
                        href={platform.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                      >
                        Visit ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                <div className="text-3xl mb-1">📊</div>
                <div className="text-2xl font-bold">33.9K</div>
                <div className="text-blue-100 text-sm">Total Followers</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                <div className="text-3xl mb-1">💬</div>
                <div className="text-2xl font-bold">5.6%</div>
                <div className="text-green-100 text-sm">Avg Engagement</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                <div className="text-3xl mb-1">🔗</div>
                <div className="text-2xl font-bold">{platforms.filter((p) => p.enabled).length}</div>
                <div className="text-purple-100 text-sm">Active Platforms</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                <div className="text-3xl mb-1">📈</div>
                <div className="text-2xl font-bold">+12%</div>
                <div className="text-orange-100 text-sm">Growth This Month</div>
              </div>
            </div>
          </div>
        )}

        {/* Tracking Pixels Tab */}
        {activeTab === "pixels" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-bold text-gray-900">Tracking & Analytics Pixels</h2>
                <p className="text-sm text-gray-500">Configure tracking codes for analytics and advertising</p>
              </div>
              <div className="divide-y divide-gray-100">
                {pixels.map((pixel) => (
                  <div key={pixel.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900">{pixel.platform}</span>
                        {pixel.pixelId && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            ✓ Configured
                          </span>
                        )}
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pixel.enabled}
                          onChange={(e) => updatePixel(pixel.id, "enabled", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <input
                      type="text"
                      value={pixel.pixelId}
                      onChange={(e) => updatePixel(pixel.id, "pixelId", e.target.value)}
                      placeholder={`Enter your ${pixel.platform} ID`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {pixel.id === "fb_pixel" && "Format: 1234567890123456"}
                      {pixel.id === "ga4" && "Format: G-XXXXXXXXXX"}
                      {pixel.id === "gtm" && "Format: GTM-XXXXXXX"}
                      {pixel.id === "tiktok_pixel" && "Format: CXXXXXXXXXXXXXXXXX"}
                      {pixel.id === "linkedin_insight" && "Format: 1234567"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pixel Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">📘</div>
                  <div>
                    <div className="font-bold text-gray-900">Facebook Ads</div>
                    <div className="text-xs text-gray-500">Track conversions & retarget</div>
                  </div>
                </div>
                <div className={`text-sm ${pixels.find((p) => p.id === "fb_pixel")?.pixelId ? "text-green-600" : "text-gray-400"}`}>
                  {pixels.find((p) => p.id === "fb_pixel")?.pixelId ? "✓ Tracking Active" : "○ Not configured"}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">📊</div>
                  <div>
                    <div className="font-bold text-gray-900">Google Analytics</div>
                    <div className="text-xs text-gray-500">Website analytics</div>
                  </div>
                </div>
                <div className={`text-sm ${pixels.find((p) => p.id === "ga4")?.pixelId ? "text-green-600" : "text-gray-400"}`}>
                  {pixels.find((p) => p.id === "ga4")?.pixelId ? "✓ Tracking Active" : "○ Not configured"}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white">🎵</div>
                  <div>
                    <div className="font-bold text-gray-900">TikTok Ads</div>
                    <div className="text-xs text-gray-500">Track TikTok campaigns</div>
                  </div>
                </div>
                <div className={`text-sm ${pixels.find((p) => p.id === "tiktok_pixel")?.pixelId ? "text-green-600" : "text-gray-400"}`}>
                  {pixels.find((p) => p.id === "tiktok_pixel")?.pixelId ? "✓ Tracking Active" : "○ Not configured"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sharing Defaults Tab */}
        {activeTab === "sharing" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-4">Open Graph (Facebook, LinkedIn)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Title (English)</label>
                  <input
                    type="text"
                    value={sharingDefaults.ogTitle}
                    onChange={(e) => setSharingDefaults({ ...sharingDefaults, ogTitle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Title (Vietnamese)</label>
                  <input
                    type="text"
                    value={sharingDefaults.ogTitleVi}
                    onChange={(e) => setSharingDefaults({ ...sharingDefaults, ogTitleVi: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Description (English)</label>
                  <textarea
                    value={sharingDefaults.ogDescription}
                    onChange={(e) => setSharingDefaults({ ...sharingDefaults, ogDescription: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Description (Vietnamese)</label>
                  <textarea
                    value={sharingDefaults.ogDescriptionVi}
                    onChange={(e) => setSharingDefaults({ ...sharingDefaults, ogDescriptionVi: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Share Image URL</label>
                <input
                  type="url"
                  value={sharingDefaults.ogImage}
                  onChange={(e) => setSharingDefaults({ ...sharingDefaults, ogImage: e.target.value })}
                  placeholder="https://example.com/og-image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-xs text-gray-400 mt-1">Recommended size: 1200x630 pixels</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-4">Twitter Card</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Card Type</label>
                  <select
                    value={sharingDefaults.twitterCard}
                    onChange={(e) => setSharingDefaults({ ...sharingDefaults, twitterCard: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="summary">Summary</option>
                    <option value="summary_large_image">Summary with Large Image</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Twitter Handle</label>
                  <input
                    type="text"
                    value={sharingDefaults.twitterHandle}
                    onChange={(e) => setSharingDefaults({ ...sharingDefaults, twitterHandle: e.target.value })}
                    placeholder="@leraacademy"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-4">📱 Share Preview</h2>
              <div className="max-w-md border border-gray-300 rounded-lg overflow-hidden">
                {sharingDefaults.ogImage ? (
                  <img src={sharingDefaults.ogImage} alt="OG Preview" className="w-full h-40 object-cover bg-gray-100" />
                ) : (
                  <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">
                    No image set
                  </div>
                )}
                <div className="p-3">
                  <div className="text-xs text-gray-400 uppercase">leraacademy.edu.vn</div>
                  <div className="font-bold text-gray-900 mt-1">{sharingDefaults.ogTitle || "Page Title"}</div>
                  <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {sharingDefaults.ogDescription || "Page description will appear here"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
