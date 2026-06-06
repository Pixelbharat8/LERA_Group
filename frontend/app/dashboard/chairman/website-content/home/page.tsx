"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../../../../lib/api";
import Link from "next/link";

export default function HomeContentPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"EN" | "VI">("EN");
  
  // Hero Section
  const [heroTitleEN, setHeroTitleEN] = useState("Master English with LERA Academy");
  const [heroTitleVI, setHeroTitleVI] = useState("Chinh Phục Tiếng Anh Cùng LERA Academy");
  const [heroSubtitleEN, setHeroSubtitleEN] = useState("Vietnam's Leading English Education Center");
  const [heroSubtitleVI, setHeroSubtitleVI] = useState("Trung Tâm Giáo Dục Tiếng Anh Hàng Đầu Việt Nam");
  const [heroDescEN, setHeroDescEN] = useState("Join over 10,000+ students who have transformed their English skills with our innovative AI-powered learning platform and expert native teachers.");
  const [heroDescVI, setHeroDescVI] = useState("Tham gia cùng hơn 10.000+ học viên đã cải thiện kỹ năng tiếng Anh với nền tảng học tập AI tiên tiến và giáo viên bản ngữ chuyên nghiệp.");

  // Stats Section
  const [stat1Value, setStat1Value] = useState("10,000+");
  const [stat1LabelEN, setStat1LabelEN] = useState("Happy Students");
  const [stat1LabelVI, setStat1LabelVI] = useState("Học viên hài lòng");
  const [stat2Value, setStat2Value] = useState("50+");
  const [stat2LabelEN, setStat2LabelEN] = useState("Expert Teachers");
  const [stat2LabelVI, setStat2LabelVI] = useState("Giáo viên chuyên nghiệp");
  const [stat3Value, setStat3Value] = useState("5");
  const [stat3LabelEN, setStat3LabelEN] = useState("Learning Centers");
  const [stat3LabelVI, setStat3LabelVI] = useState("Cơ sở học tập");
  const [stat4Value, setStat4Value] = useState("98%");
  const [stat4LabelEN, setStat4LabelEN] = useState("Success Rate");
  const [stat4LabelVI, setStat4LabelVI] = useState("Tỷ lệ thành công");

  // CTA Section
  const [ctaTitleEN, setCtaTitleEN] = useState("Ready to Start Your English Journey?");
  const [ctaTitleVI, setCtaTitleVI] = useState("Sẵn sàng bắt đầu hành trình tiếng Anh?");
  const [ctaDescEN, setCtaDescEN] = useState("Book a free consultation and placement test today!");
  const [ctaDescVI, setCtaDescVI] = useState("Đặt lịch tư vấn và kiểm tra trình độ miễn phí ngay hôm nay!");

  // Facebook / Social Feed Section (defaults mirror the fallbacks in app/page.tsx)
  const [facebookPageUrl, setFacebookPageUrl] = useState("https://www.facebook.com/profile.php?id=61580971978601");
  const [facebookEyebrowEN, setFacebookEyebrowEN] = useState("Life at LERA");
  const [facebookEyebrowVI, setFacebookEyebrowVI] = useState("Tại LERA");
  const [facebookTitleEN, setFacebookTitleEN] = useState("From Our Facebook");
  const [facebookTitleVI, setFacebookTitleVI] = useState("Từ Facebook của chúng tôi");
  const [facebookSubtitleEN, setFacebookSubtitleEN] = useState("Real photos and videos from our classes, events and students — straight from the LERA Academy page.");
  const [facebookSubtitleVI, setFacebookSubtitleVI] = useState("Hình ảnh và video thực tế từ lớp học, sự kiện và học viên — trực tiếp từ trang LERA Academy.");
  const [facebookCtaEN, setFacebookCtaEN] = useState("Visit our Facebook page");
  const [facebookCtaVI, setFacebookCtaVI] = useState("Ghé thăm trang Facebook của chúng tôi");

  // Curated "featured posts" grid (ILA-style). Each item: thumbnail + post link + labels.
  type FbPost = { thumb: string; link: string; nameEN: string; nameVI: string; captionEN: string; captionVI: string; isVideo: boolean };
  const emptyPost: FbPost = { thumb: "", link: "", nameEN: "", nameVI: "", captionEN: "", captionVI: "", isVideo: true };
  const [fbPosts, setFbPosts] = useState<FbPost[]>([]);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const updatePost = (idx: number, patch: Partial<FbPost>) =>
    setFbPosts((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  const addPost = () => setFbPosts((prev) => [...prev, { ...emptyPost }]);
  const removePost = (idx: number) => setFbPosts((prev) => prev.filter((_, i) => i !== idx));

  const handleThumbUpload = async (idx: number, file: File) => {
    setUploadingIdx(idx);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res: any = await apiFetch("/api/upload/image", { method: "POST", body: fd });
      if (res && res.url) {
        updatePost(idx, { thumb: res.url });
      } else {
        alert("Upload failed. Please try a different image.");
      }
    } catch (e) {
      console.error("Thumbnail upload failed:", e);
      alert("Upload failed. Please try again.");
    } finally {
      setUploadingIdx(null);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const data = await apiFetch("/api/cms-settings/map/homepage").catch(() => ({}));
      if (data && Object.keys(data).length > 0) {
        // Hero
        if (data.hero_title_en) setHeroTitleEN(data.hero_title_en);
        if (data.hero_title_vi) setHeroTitleVI(data.hero_title_vi);
        if (data.hero_subtitle_en) setHeroSubtitleEN(data.hero_subtitle_en);
        if (data.hero_subtitle_vi) setHeroSubtitleVI(data.hero_subtitle_vi);
        if (data.hero_description_en) setHeroDescEN(data.hero_description_en);
        if (data.hero_description_vi) setHeroDescVI(data.hero_description_vi);
        
        // Stats
        if (data.stat1_value) setStat1Value(data.stat1_value);
        if (data.stat1_label_en) setStat1LabelEN(data.stat1_label_en);
        if (data.stat1_label_vi) setStat1LabelVI(data.stat1_label_vi);
        if (data.stat2_value) setStat2Value(data.stat2_value);
        if (data.stat2_label_en) setStat2LabelEN(data.stat2_label_en);
        if (data.stat2_label_vi) setStat2LabelVI(data.stat2_label_vi);
        if (data.stat3_value) setStat3Value(data.stat3_value);
        if (data.stat3_label_en) setStat3LabelEN(data.stat3_label_en);
        if (data.stat3_label_vi) setStat3LabelVI(data.stat3_label_vi);
        if (data.stat4_value) setStat4Value(data.stat4_value);
        if (data.stat4_label_en) setStat4LabelEN(data.stat4_label_en);
        if (data.stat4_label_vi) setStat4LabelVI(data.stat4_label_vi);
        
        // CTA
        if (data.cta_title_en) setCtaTitleEN(data.cta_title_en);
        if (data.cta_title_vi) setCtaTitleVI(data.cta_title_vi);
        if (data.cta_description_en) setCtaDescEN(data.cta_description_en);
        if (data.cta_description_vi) setCtaDescVI(data.cta_description_vi);

        // Facebook / Social Feed
        if (data.facebook_page_url_en) setFacebookPageUrl(data.facebook_page_url_en);
        if (data.facebook_eyebrow_en) setFacebookEyebrowEN(data.facebook_eyebrow_en);
        if (data.facebook_eyebrow_vi) setFacebookEyebrowVI(data.facebook_eyebrow_vi);
        if (data.facebook_title_en) setFacebookTitleEN(data.facebook_title_en);
        if (data.facebook_title_vi) setFacebookTitleVI(data.facebook_title_vi);
        if (data.facebook_subtitle_en) setFacebookSubtitleEN(data.facebook_subtitle_en);
        if (data.facebook_subtitle_vi) setFacebookSubtitleVI(data.facebook_subtitle_vi);
        if (data.facebook_cta_en) setFacebookCtaEN(data.facebook_cta_en);
        if (data.facebook_cta_vi) setFacebookCtaVI(data.facebook_cta_vi);
        if (data.facebook_featured_posts_en) {
          try {
            const parsed = JSON.parse(data.facebook_featured_posts_en);
            if (Array.isArray(parsed)) {
              setFbPosts(parsed.map((p: any) => ({ ...emptyPost, ...p })));
            }
          } catch { /* ignore malformed stored JSON */ }
        }
      }
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const settings = [
        // Hero
        { settingKey: "hero_title_en", settingValue: heroTitleEN, category: "homepage" },
        { settingKey: "hero_title_vi", settingValue: heroTitleVI, category: "homepage" },
        { settingKey: "hero_subtitle_en", settingValue: heroSubtitleEN, category: "homepage" },
        { settingKey: "hero_subtitle_vi", settingValue: heroSubtitleVI, category: "homepage" },
        { settingKey: "hero_description_en", settingValue: heroDescEN, category: "homepage" },
        { settingKey: "hero_description_vi", settingValue: heroDescVI, category: "homepage" },
        // Stats
        { settingKey: "stat1_value", settingValue: stat1Value, category: "homepage" },
        { settingKey: "stat1_label_en", settingValue: stat1LabelEN, category: "homepage" },
        { settingKey: "stat1_label_vi", settingValue: stat1LabelVI, category: "homepage" },
        { settingKey: "stat2_value", settingValue: stat2Value, category: "homepage" },
        { settingKey: "stat2_label_en", settingValue: stat2LabelEN, category: "homepage" },
        { settingKey: "stat2_label_vi", settingValue: stat2LabelVI, category: "homepage" },
        { settingKey: "stat3_value", settingValue: stat3Value, category: "homepage" },
        { settingKey: "stat3_label_en", settingValue: stat3LabelEN, category: "homepage" },
        { settingKey: "stat3_label_vi", settingValue: stat3LabelVI, category: "homepage" },
        { settingKey: "stat4_value", settingValue: stat4Value, category: "homepage" },
        { settingKey: "stat4_label_en", settingValue: stat4LabelEN, category: "homepage" },
        { settingKey: "stat4_label_vi", settingValue: stat4LabelVI, category: "homepage" },
        // CTA
        { settingKey: "cta_title_en", settingValue: ctaTitleEN, category: "homepage" },
        { settingKey: "cta_title_vi", settingValue: ctaTitleVI, category: "homepage" },
        { settingKey: "cta_description_en", settingValue: ctaDescEN, category: "homepage" },
        { settingKey: "cta_description_vi", settingValue: ctaDescVI, category: "homepage" },
        // Facebook / Social Feed (URL written to both _en and _vi — getContent appends the suffix)
        { settingKey: "facebook_page_url_en", settingValue: facebookPageUrl, category: "homepage" },
        { settingKey: "facebook_page_url_vi", settingValue: facebookPageUrl, category: "homepage" },
        { settingKey: "facebook_eyebrow_en", settingValue: facebookEyebrowEN, category: "homepage" },
        { settingKey: "facebook_eyebrow_vi", settingValue: facebookEyebrowVI, category: "homepage" },
        { settingKey: "facebook_title_en", settingValue: facebookTitleEN, category: "homepage" },
        { settingKey: "facebook_title_vi", settingValue: facebookTitleVI, category: "homepage" },
        { settingKey: "facebook_subtitle_en", settingValue: facebookSubtitleEN, category: "homepage" },
        { settingKey: "facebook_subtitle_vi", settingValue: facebookSubtitleVI, category: "homepage" },
        { settingKey: "facebook_cta_en", settingValue: facebookCtaEN, category: "homepage" },
        { settingKey: "facebook_cta_vi", settingValue: facebookCtaVI, category: "homepage" },
        // Curated featured posts (same JSON stored under both _en/_vi — per-language labels live inside the JSON)
        { settingKey: "facebook_featured_posts_en", settingValue: JSON.stringify(fbPosts.filter((p) => p.thumb)), category: "homepage" },
        { settingKey: "facebook_featured_posts_vi", settingValue: JSON.stringify(fbPosts.filter((p) => p.thumb)), category: "homepage" }
      ];

      await apiFetch("/api/cms-settings/batch", {
        method: "POST",
        body: JSON.stringify(settings)
      });

      alert("Home page saved successfully!");
    } catch (error) {
      console.error("Error saving:", error);
      alert("Error saving. Please try again.");
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
                <h1 className="text-xl font-bold text-gray-900">Home Page</h1>
                <p className="text-sm text-gray-500">Edit homepage content</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a href="/" target="_blank" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                👁️ Preview
              </a>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSaving ? "Saving..." : "💾 Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Language Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("EN")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "EN" ? "bg-blue-600 text-white" : "bg-white border border-gray-300 hover:bg-gray-50"
            }`}
          >
            🇬🇧 English
          </button>
          <button
            onClick={() => setActiveTab("VI")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "VI" ? "bg-blue-600 text-white" : "bg-white border border-gray-300 hover:bg-gray-50"
            }`}
          >
            🇻🇳 Vietnamese
          </button>
        </div>

        {/* Hero Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🎯 Hero Section</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Main Title</label>
              <input
                type="text"
                value={activeTab === "EN" ? heroTitleEN : heroTitleVI}
                onChange={(e) => activeTab === "EN" ? setHeroTitleEN(e.target.value) : setHeroTitleVI(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
              <input
                type="text"
                value={activeTab === "EN" ? heroSubtitleEN : heroSubtitleVI}
                onChange={(e) => activeTab === "EN" ? setHeroSubtitleEN(e.target.value) : setHeroSubtitleVI(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={activeTab === "EN" ? heroDescEN : heroDescVI}
                onChange={(e) => activeTab === "EN" ? setHeroDescEN(e.target.value) : setHeroDescVI(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📊 Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stat 1 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Stat 1</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Value</label>
                  <input
                    type="text"
                    value={stat1Value}
                    onChange={(e) => setStat1Value(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Label</label>
                  <input
                    type="text"
                    value={activeTab === "EN" ? stat1LabelEN : stat1LabelVI}
                    onChange={(e) => activeTab === "EN" ? setStat1LabelEN(e.target.value) : setStat1LabelVI(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
            {/* Stat 2 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Stat 2</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Value</label>
                  <input
                    type="text"
                    value={stat2Value}
                    onChange={(e) => setStat2Value(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Label</label>
                  <input
                    type="text"
                    value={activeTab === "EN" ? stat2LabelEN : stat2LabelVI}
                    onChange={(e) => activeTab === "EN" ? setStat2LabelEN(e.target.value) : setStat2LabelVI(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
            {/* Stat 3 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Stat 3</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Value</label>
                  <input
                    type="text"
                    value={stat3Value}
                    onChange={(e) => setStat3Value(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Label</label>
                  <input
                    type="text"
                    value={activeTab === "EN" ? stat3LabelEN : stat3LabelVI}
                    onChange={(e) => activeTab === "EN" ? setStat3LabelEN(e.target.value) : setStat3LabelVI(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
            {/* Stat 4 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Stat 4</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Value</label>
                  <input
                    type="text"
                    value={stat4Value}
                    onChange={(e) => setStat4Value(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Label</label>
                  <input
                    type="text"
                    value={activeTab === "EN" ? stat4LabelEN : stat4LabelVI}
                    onChange={(e) => activeTab === "EN" ? setStat4LabelEN(e.target.value) : setStat4LabelVI(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📢 Call to Action</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CTA Title</label>
              <input
                type="text"
                value={activeTab === "EN" ? ctaTitleEN : ctaTitleVI}
                onChange={(e) => activeTab === "EN" ? setCtaTitleEN(e.target.value) : setCtaTitleVI(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CTA Description</label>
              <textarea
                value={activeTab === "EN" ? ctaDescEN : ctaDescVI}
                onChange={(e) => activeTab === "EN" ? setCtaDescEN(e.target.value) : setCtaDescVI(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Facebook / Social Feed Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📘 Facebook / Social Feed</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Page URL (applies to both languages)</label>
              <input
                type="text"
                value={facebookPageUrl}
                onChange={(e) => setFacebookPageUrl(e.target.value)}
                placeholder="https://www.facebook.com/YourLeraPage"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Paste your public Facebook <strong>Page</strong> URL. The homepage embeds its photos &amp; videos automatically. (The embed only works for public Pages, not personal profiles.)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Eyebrow (small label above title)</label>
              <input
                type="text"
                value={activeTab === "EN" ? facebookEyebrowEN : facebookEyebrowVI}
                onChange={(e) => activeTab === "EN" ? setFacebookEyebrowEN(e.target.value) : setFacebookEyebrowVI(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={activeTab === "EN" ? facebookTitleEN : facebookTitleVI}
                onChange={(e) => activeTab === "EN" ? setFacebookTitleEN(e.target.value) : setFacebookTitleVI(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
              <textarea
                value={activeTab === "EN" ? facebookSubtitleEN : facebookSubtitleVI}
                onChange={(e) => activeTab === "EN" ? setFacebookSubtitleEN(e.target.value) : setFacebookSubtitleVI(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button text</label>
              <input
                type="text"
                value={activeTab === "EN" ? facebookCtaEN : facebookCtaVI}
                onChange={(e) => activeTab === "EN" ? setFacebookCtaEN(e.target.value) : setFacebookCtaVI(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Featured posts repeater (ILA-style curated grid) */}
            <div className="border-t border-gray-200 pt-5 mt-5">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-gray-900">Featured posts / videos (shown as a grid, like ILA)</label>
                <button
                  type="button"
                  onClick={addPost}
                  className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  + Add post
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Pick the posts/videos to feature. Upload a thumbnail (or paste an image URL) and the Facebook post link.
                The homepage shows up to 6 in a grid. <strong>Leave this empty to show the live Facebook timeline feed instead.</strong>
              </p>

              {fbPosts.length === 0 && (
                <div className="text-center text-sm text-gray-400 border border-dashed border-gray-300 rounded-lg py-6">
                  No featured posts yet — the homepage will show the live Facebook feed. Click “+ Add post” to curate.
                </div>
              )}

              <div className="space-y-5">
                {fbPosts.map((post, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      {/* Thumbnail preview + upload */}
                      <div className="flex-shrink-0">
                        <div className="w-24 h-28 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 flex items-center justify-center">
                          {post.thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={post.thumb} alt="thumbnail" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] text-gray-400 text-center px-1">No image</span>
                          )}
                        </div>
                        <label className="mt-2 block text-center text-xs text-blue-600 hover:text-blue-800 cursor-pointer">
                          {uploadingIdx === idx ? "Uploading…" : "Upload"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingIdx === idx}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleThumbUpload(idx, f);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>

                      {/* Fields */}
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Thumbnail URL</label>
                            <input
                              type="text"
                              value={post.thumb}
                              onChange={(e) => updatePost(idx, { thumb: e.target.value })}
                              placeholder="/uploads/images/… or https://…"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Facebook post link</label>
                            <input
                              type="text"
                              value={post.link}
                              onChange={(e) => updatePost(idx, { link: e.target.value })}
                              placeholder="https://www.facebook.com/…/posts/…"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Name label ({activeTab})</label>
                            <input
                              type="text"
                              value={activeTab === "EN" ? post.nameEN : post.nameVI}
                              onChange={(e) => updatePost(idx, activeTab === "EN" ? { nameEN: e.target.value } : { nameVI: e.target.value })}
                              placeholder={activeTab === "EN" ? "e.g. Parent of Bảo Ngọc" : "vd: Mẹ Bảo Ngọc"}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Caption ({activeTab})</label>
                            <input
                              type="text"
                              value={activeTab === "EN" ? post.captionEN : post.captionVI}
                              onChange={(e) => updatePost(idx, activeTab === "EN" ? { captionEN: e.target.value } : { captionVI: e.target.value })}
                              placeholder={activeTab === "EN" ? "Short caption shown on the card" : "Chú thích ngắn hiển thị trên thẻ"}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={post.isVideo}
                              onChange={(e) => updatePost(idx, { isVideo: e.target.checked })}
                              className="rounded border-gray-300"
                            />
                            Show play icon (video)
                          </label>
                          <button
                            type="button"
                            onClick={() => removePost(idx)}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
