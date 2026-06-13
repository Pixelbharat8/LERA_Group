"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";

const GALLERY_IMAGES = [
  { path: '/images/gallery/lera-hero.jpg', name: 'LERA Hero' },
  { path: '/images/gallery/lera-classroom.jpg', name: 'LERA Classroom' },
];

export default function HomePageEditor() {
  const [showGallery, setShowGallery] = useState(false);
  const [content, setContent] = useState({
    hero: {
      titleEN: "Ready for Knowledge for the Future",
      titleVI: "Sẵn Sàng Tri Thức Cho Tương Lai",
      subtitleEN: "Cambridge Standard English",
      subtitleVI: "Tiếng Anh Chuẩn Cambridge",
      descriptionEN: "Specialized English programs helping children become confident and achieve high results",
      descriptionVI: "Các chương trình học chuyên sâu, giúp trẻ tự tin và đạt thành tích cao",
      ctaButtonTextEN: "Register Now",
      ctaButtonTextVI: "Đăng Ký Ngay",
      backgroundImage: "",
      showForm: true,
    },
    formOffer: {
      titleEN: "GET 1 MONTH FREE ENGLISH LEARNING",
      titleVI: "NHẬN NGAY 1 THÁNG HỌC TIẾNG ANH MIỄN PHÍ",
      subtitleEN: "RECEIVE NOW",
      subtitleVI: "NHẬN NGAY",
      subheadingEN: "1 MONTH FREE LEARNING",
      subheadingVI: "1 THÁNG HỌC MIỄN PHÍ",
    },
    stats: [
      { labelEN: "Years Experience", labelVI: "Năm Kinh Nghiệm", value: "15+", enabled: true },
      { labelEN: "Students Enrolled", labelVI: "Học Viên Đã Đăng Ký", value: "5,000+", enabled: true },
      { labelEN: "Expert Teachers", labelVI: "Giáo Viên Chuyên Nghiệp", value: "50+", enabled: true },
      { labelEN: "Learning Centers", labelVI: "Trung Tâm Học Tập", value: "1", enabled: true },
    ],
    features: [
      { icon: "🌍", titleEN: "Native Teachers", titleVI: "Giáo viên bản ngữ", descEN: "100% teachers from USA, UK, Australia with international TESOL/CELTA certificates", descVI: "100% giáo viên đến từ Mỹ, Anh, Úc với chứng chỉ TESOL/CELTA quốc tế", color: "from-blue-500 to-cyan-500", enabled: true },
      { icon: "📱", titleEN: "Modern Methods", titleVI: "Phương pháp hiện đại", descEN: "Combining AI technology with proven teaching techniques", descVI: "Kết hợp công nghệ AI với phương pháp giảng dạy đã được chứng minh", color: "from-purple-500 to-pink-500", enabled: true },
      { icon: "👥", titleEN: "Small Class Size", titleVI: "Lớp học nhỏ", descEN: "Maximum 12 students per class for personalized attention", descVI: "Tối đa 12 học sinh mỗi lớp cho sự chú ý cá nhân", color: "from-orange-500 to-red-500", enabled: true },
      { icon: "🏆", titleEN: "International Certificates", titleVI: "Chứng chỉ quốc tế", descEN: "Prepare students for Cambridge, IELTS, TOEFL exams", descVI: "Chuẩn bị cho học sinh thi Cambridge, IELTS, TOEFL", color: "from-green-500 to-teal-500", enabled: true },
    ],
    gallery: [
      { src: "/images/gallery/lera-hero.jpg", captionEN: "Where Excellence is the Standard", captionVI: "Nơi xuất sắc là tiêu chuẩn" },
      { src: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80", captionEN: "Interactive English Classes", captionVI: "Lớp học tiếng Anh tương tác" },
      { src: "https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=800&q=80", captionEN: "Creative Learning Activities", captionVI: "Hoạt động học tập sáng tạo" },
      { src: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&q=80", captionEN: "Academic English Programs", captionVI: "Chương trình tiếng Anh học thuật" },
    ],
    cta: {
      titleEN: "Start Your Child's Journey to English Fluency",
      titleVI: "Bắt đầu hành trình tiếng Anh cho con bạn",
      descEN: "Register today for a free trial class and see the difference LERA Academy makes",
      descVI: "Đăng ký ngay hôm nay để nhận lớp học thử miễn phí",
    },
  });
  const [activeTab, setActiveTab] = useState<"hero" | "form" | "stats" | "features" | "gallery" | "cta" | "preview">("hero");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const data = await apiFetch("/api/cms-settings/map/homepage").catch(() => ({}));
      if (data && Object.keys(data).length > 0) {
        // Parse stats from CMS settings
        const statsCount = parseInt(data.stats_count) || 4;
        const loadedStats: (typeof content.stats)[number][] = [];
        for (let i = 0; i < statsCount; i++) {
          loadedStats.push({
            labelEN: data[`stat_${i}_label_en`] || content.stats[i]?.labelEN || "Label",
            labelVI: data[`stat_${i}_label_vi`] || content.stats[i]?.labelVI || "Nhãn",
            value: data[`stat_${i}_value`] || content.stats[i]?.value || "0",
            enabled: data[`stat_${i}_enabled`] !== "false",
          });
        }

        // Map CMS settings to content structure
        setContent(prev => {
          // Parse features
          const featureCount = parseInt(data.feature_count) || 0;
          const loadedFeatures = [];
          for (let i = 0; i < featureCount; i++) {
            loadedFeatures.push({
              icon: data[`feature_${i}_icon`] || prev.features[i]?.icon || "⭐",
              titleEN: data[`feature_${i}_title_en`] || prev.features[i]?.titleEN || "",
              titleVI: data[`feature_${i}_title_vi`] || prev.features[i]?.titleVI || "",
              descEN: data[`feature_${i}_desc_en`] || prev.features[i]?.descEN || "",
              descVI: data[`feature_${i}_desc_vi`] || prev.features[i]?.descVI || "",
              color: data[`feature_${i}_color`] || prev.features[i]?.color || "from-blue-500 to-cyan-500",
              enabled: data[`feature_${i}_enabled`] !== "false",
            });
          }

          // Parse gallery
          const galleryCount = parseInt(data.gallery_count) || 0;
          const loadedGallery = [];
          for (let i = 0; i < galleryCount; i++) {
            loadedGallery.push({
              src: data[`gallery_${i}_src`] || prev.gallery[i]?.src || "",
              captionEN: data[`gallery_${i}_caption_en`] || prev.gallery[i]?.captionEN || "",
              captionVI: data[`gallery_${i}_caption_vi`] || prev.gallery[i]?.captionVI || "",
            });
          }

          return {
            hero: {
              titleEN: data.hero_title_en || prev.hero.titleEN,
              titleVI: data.hero_title_vi || prev.hero.titleVI,
              subtitleEN: data.hero_subtitle_en || prev.hero.subtitleEN,
              subtitleVI: data.hero_subtitle_vi || prev.hero.subtitleVI,
              descriptionEN: data.hero_description_en || prev.hero.descriptionEN,
              descriptionVI: data.hero_description_vi || prev.hero.descriptionVI,
              ctaButtonTextEN: data.hero_cta_en || prev.hero.ctaButtonTextEN,
              ctaButtonTextVI: data.hero_cta_vi || prev.hero.ctaButtonTextVI,
              backgroundImage: data.hero_bg_image || prev.hero.backgroundImage,
              showForm: data.hero_show_form !== "false",
            },
            formOffer: {
              titleEN: data.form_title_en || prev.formOffer.titleEN,
              titleVI: data.form_title_vi || prev.formOffer.titleVI,
              subtitleEN: data.form_subtitle_en || prev.formOffer.subtitleEN,
              subtitleVI: data.form_subtitle_vi || prev.formOffer.subtitleVI,
              subheadingEN: data.form_subheading_en || prev.formOffer.subheadingEN,
              subheadingVI: data.form_subheading_vi || prev.formOffer.subheadingVI,
            },
            stats: loadedStats.length > 0 ? loadedStats : prev.stats,
            features: loadedFeatures.length > 0 ? loadedFeatures : prev.features,
            gallery: loadedGallery.length > 0 ? loadedGallery : prev.gallery,
            cta: {
              titleEN: data.cta_title_en || prev.cta.titleEN,
              titleVI: data.cta_title_vi || prev.cta.titleVI,
              descEN: data.cta_desc_en || prev.cta.descEN,
              descVI: data.cta_desc_vi || prev.cta.descVI,
            },
          };
        });
      }
    } catch (err) {
      console.error("Error fetching content:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage("");
    
    try {
      // Save all settings to backend including stats
      const settings = [
        { settingKey: "hero_title_en", settingValue: content.hero.titleEN, category: "homepage" },
        { settingKey: "hero_title_vi", settingValue: content.hero.titleVI, category: "homepage" },
        { settingKey: "hero_subtitle_en", settingValue: content.hero.subtitleEN, category: "homepage" },
        { settingKey: "hero_subtitle_vi", settingValue: content.hero.subtitleVI, category: "homepage" },
        { settingKey: "hero_description_en", settingValue: content.hero.descriptionEN, category: "homepage" },
        { settingKey: "hero_description_vi", settingValue: content.hero.descriptionVI, category: "homepage" },
        { settingKey: "hero_cta_en", settingValue: content.hero.ctaButtonTextEN, category: "homepage" },
        { settingKey: "hero_cta_vi", settingValue: content.hero.ctaButtonTextVI, category: "homepage" },
        { settingKey: "hero_bg_image", settingValue: content.hero.backgroundImage, category: "homepage" },
        { settingKey: "hero_show_form", settingValue: String(content.hero.showForm), category: "homepage" },
        { settingKey: "form_title_en", settingValue: content.formOffer.titleEN, category: "homepage" },
        { settingKey: "form_title_vi", settingValue: content.formOffer.titleVI, category: "homepage" },
        { settingKey: "form_subtitle_en", settingValue: content.formOffer.subtitleEN, category: "homepage" },
        { settingKey: "form_subtitle_vi", settingValue: content.formOffer.subtitleVI, category: "homepage" },
        { settingKey: "form_subheading_en", settingValue: content.formOffer.subheadingEN, category: "homepage" },
        { settingKey: "form_subheading_vi", settingValue: content.formOffer.subheadingVI, category: "homepage" },
        // Stats settings
        ...content.stats.map((stat, index) => ([
          { settingKey: `stat_${index}_value`, settingValue: stat.value, category: "homepage" },
          { settingKey: `stat_${index}_label_en`, settingValue: stat.labelEN, category: "homepage" },
          { settingKey: `stat_${index}_label_vi`, settingValue: stat.labelVI, category: "homepage" },
          { settingKey: `stat_${index}_enabled`, settingValue: String(stat.enabled), category: "homepage" },
        ])).flat(),
        { settingKey: "stats_count", settingValue: String(content.stats.length), category: "homepage" },
        // Features ("Why Choose Us") settings
        ...content.features.map((f, index) => ([
          { settingKey: `feature_${index}_icon`, settingValue: f.icon, category: "homepage" },
          { settingKey: `feature_${index}_title_en`, settingValue: f.titleEN, category: "homepage" },
          { settingKey: `feature_${index}_title_vi`, settingValue: f.titleVI, category: "homepage" },
          { settingKey: `feature_${index}_desc_en`, settingValue: f.descEN, category: "homepage" },
          { settingKey: `feature_${index}_desc_vi`, settingValue: f.descVI, category: "homepage" },
          { settingKey: `feature_${index}_color`, settingValue: f.color, category: "homepage" },
          { settingKey: `feature_${index}_enabled`, settingValue: String(f.enabled), category: "homepage" },
        ])).flat(),
        { settingKey: "feature_count", settingValue: String(content.features.length), category: "homepage" },
        // Gallery settings
        ...content.gallery.map((g, index) => ([
          { settingKey: `gallery_${index}_src`, settingValue: g.src, category: "gallery" },
          { settingKey: `gallery_${index}_caption_en`, settingValue: g.captionEN, category: "gallery" },
          { settingKey: `gallery_${index}_caption_vi`, settingValue: g.captionVI, category: "gallery" },
        ])).flat(),
        { settingKey: "gallery_count", settingValue: String(content.gallery.length), category: "gallery" },
        // CTA settings
        { settingKey: "cta_title_en", settingValue: content.cta.titleEN, category: "homepage" },
        { settingKey: "cta_title_vi", settingValue: content.cta.titleVI, category: "homepage" },
        { settingKey: "cta_desc_en", settingValue: content.cta.descEN, category: "homepage" },
        { settingKey: "cta_desc_vi", settingValue: content.cta.descVI, category: "homepage" },
      ];

      await apiFetch("/api/cms-settings/batch", {
        method: "POST",
        body: JSON.stringify(settings),
      });
      setSaveMessage("✅ Changes saved successfully!");
    } catch (err) {
      console.error("Error saving:", err);
      setSaveMessage("❌ Error saving changes");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  const updateHero = (field: string, value: any) => {
    setContent(prev => ({
      ...prev,
      hero: { ...prev.hero, [field]: value }
    }));
  };

  const updateFormOffer = (field: string, value: any) => {
    setContent(prev => ({
      ...prev,
      formOffer: { ...prev.formOffer, [field]: value }
    }));
  };

  const updateStat = (index: number, field: string, value: any) => {
    setContent(prev => ({
      ...prev,
      stats: prev.stats.map((stat, i) => 
        i === index ? { ...stat, [field]: value } : stat
      )
    }));
  };

  const updateFeature = (index: number, field: string, value: any) => {
    setContent(prev => ({
      ...prev,
      features: prev.features.map((f, i) =>
        i === index ? { ...f, [field]: value } : f
      )
    }));
  };

  const addFeature = () => {
    setContent(prev => ({
      ...prev,
      features: [...prev.features, { icon: "⭐", titleEN: "", titleVI: "", descEN: "", descVI: "", color: "from-blue-500 to-cyan-500", enabled: true }]
    }));
  };

  const removeFeature = (index: number) => {
    setContent(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const updateGallery = (index: number, field: string, value: string) => {
    setContent(prev => ({
      ...prev,
      gallery: prev.gallery.map((g, i) =>
        i === index ? { ...g, [field]: value } : g
      )
    }));
  };

  const addGalleryItem = () => {
    setContent(prev => ({
      ...prev,
      gallery: [...prev.gallery, { src: "", captionEN: "", captionVI: "" }]
    }));
  };

  const removeGalleryItem = (index: number) => {
    setContent(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index)
    }));
  };

  const updateCta = (field: string, value: string) => {
    setContent(prev => ({
      ...prev,
      cta: { ...prev.cta, [field]: value }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500">Loading home page editor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span>Public Website</span>
            <span>/</span>
            <span className="text-gray-900">Home Page</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">🏠 Home Page Editor</h1>
          <p className="text-gray-500">Edit the public website homepage content</p>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className="text-green-600 font-medium">{saveMessage}</span>
          )}
          <Link 
            href="/" 
            target="_blank"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            👁 Preview Site
          </Link>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="animate-spin">⏳</span> Saving...
              </>
            ) : (
              <>💾 Save Changes</>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b">
          <nav className="flex gap-4 px-6">
            {[
              { id: "hero", label: "🎯 Hero Section", icon: "🎯" },
              { id: "form", label: "📝 Registration Form", icon: "📝" },
              { id: "stats", label: "📊 Statistics", icon: "📊" },
              { id: "features", label: "⭐ Why Choose Us", icon: "⭐" },
              { id: "gallery", label: "🖼 Gallery", icon: "🖼" },
              { id: "cta", label: "📢 CTA Section", icon: "📢" },
              { id: "preview", label: "👁 Live Preview", icon: "👁" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Hero Section Editor */}
          {activeTab === "hero" && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* English Content */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    🇬🇧 English Content
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                    <input
                      type="text"
                      value={content.hero.subtitleEN}
                      onChange={(e) => updateHero("subtitleEN", e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Main Title</label>
                    <textarea
                      value={content.hero.titleEN}
                      onChange={(e) => updateHero("titleEN", e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={content.hero.descriptionEN}
                      onChange={(e) => updateHero("descriptionEN", e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CTA Button Text</label>
                    <input
                      type="text"
                      value={content.hero.ctaButtonTextEN}
                      onChange={(e) => updateHero("ctaButtonTextEN", e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Vietnamese Content */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    🇻🇳 Vietnamese Content
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                    <input
                      type="text"
                      value={content.hero.subtitleVI}
                      onChange={(e) => updateHero("subtitleVI", e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Main Title</label>
                    <textarea
                      value={content.hero.titleVI}
                      onChange={(e) => updateHero("titleVI", e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={content.hero.descriptionVI}
                      onChange={(e) => updateHero("descriptionVI", e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CTA Button Text</label>
                    <input
                      type="text"
                      value={content.hero.ctaButtonTextVI}
                      onChange={(e) => updateHero("ctaButtonTextVI", e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Hero Image */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-gray-900 mb-4">🖼 Hero Image</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                      <input
                        type="text"
                        value={content.hero.backgroundImage}
                        onChange={(e) => updateHero("backgroundImage", e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="/images/gallery/lera-hero.jpg"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowGallery(true)}
                        className="flex-1 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 flex items-center justify-center gap-2"
                      >
                        🖼️ Choose from Gallery
                      </button>
                      <label className="flex-1 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100 flex items-center justify-center gap-2 cursor-pointer">
                        📤 Upload
                        <input type="file" accept="image/*" className="hidden" />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preview</label>
                    {content.hero.backgroundImage ? (
                      <img 
                        src={content.hero.backgroundImage} 
                        alt="Hero preview"
                        className="w-full h-40 object-cover rounded-lg border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Image+Not+Found';
                        }}
                      />
                    ) : (
                      <div className="w-full h-40 flex items-center justify-center bg-gray-100 rounded-lg border text-gray-400">
                        <span className="text-3xl mr-2">🖼️</span>
                        <span>No image URL</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Show Registration Form Toggle */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">📝 Show Registration Form</h3>
                    <p className="text-sm text-gray-500">Display the registration form in the hero section</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={content.hero.showForm}
                      onChange={(e) => updateHero("showForm", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Form Offer Editor */}
          {activeTab === "form" && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* English */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900">🇬🇧 English</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Main Title</label>
                    <input
                      type="text"
                      value={content.formOffer.titleEN}
                      onChange={(e) => updateFormOffer("titleEN", e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                    <input
                      type="text"
                      value={content.formOffer.subtitleEN}
                      onChange={(e) => updateFormOffer("subtitleEN", e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sub-heading</label>
                    <input
                      type="text"
                      value={content.formOffer.subheadingEN}
                      onChange={(e) => updateFormOffer("subheadingEN", e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Vietnamese */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900">🇻🇳 Vietnamese</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Main Title</label>
                    <input
                      type="text"
                      value={content.formOffer.titleVI}
                      onChange={(e) => updateFormOffer("titleVI", e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                    <input
                      type="text"
                      value={content.formOffer.subtitleVI}
                      onChange={(e) => updateFormOffer("subtitleVI", e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sub-heading</label>
                    <input
                      type="text"
                      value={content.formOffer.subheadingVI}
                      onChange={(e) => updateFormOffer("subheadingVI", e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Editor */}
          {activeTab === "stats" && (
            <div className="space-y-6">
              <h3 className="font-bold text-gray-900">📊 Statistics Section</h3>
              <div className="space-y-4">
                {content.stats.map((stat, index) => (
                  <div key={index} className="grid md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg items-center">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Value</label>
                      <input
                        type="text"
                        value={stat.value}
                        onChange={(e) => updateStat(index, "value", e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Label (EN)</label>
                      <input
                        type="text"
                        value={stat.labelEN}
                        onChange={(e) => updateStat(index, "labelEN", e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Label (VI)</label>
                      <input
                        type="text"
                        value={stat.labelVI}
                        onChange={(e) => updateStat(index, "labelVI", e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={stat.enabled}
                        onChange={(e) => updateStat(index, "enabled", e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-600">Visible</span>
                    </div>
                    <div>
                      <button className="text-red-600 hover:text-red-700 text-sm">
                        🗑 Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors w-full">
                + Add New Stat
              </button>
            </div>
          )}

          {/* Why Choose Us Features Editor */}
          {activeTab === "features" && (
            <div className="space-y-6">
              <h3 className="font-bold text-gray-900">⭐ "Why Choose Us" Features</h3>
              <p className="text-sm text-gray-500">These features appear on the homepage "Why Choose Us" section. Each feature shows an icon, title, and description.</p>
              <div className="space-y-4">
                {content.features.map((feature, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3 border">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">Feature #{index + 1}</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={feature.enabled} onChange={(e) => updateFeature(index, "enabled", e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                          <span className="text-sm text-gray-600">Visible</span>
                        </label>
                        <button onClick={() => removeFeature(index)} className="text-red-600 hover:text-red-700 text-sm">🗑 Remove</button>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Icon (emoji)</label>
                        <input type="text" value={feature.icon} onChange={(e) => updateFeature(index, "icon", e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="🌍" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Title (EN)</label>
                        <input type="text" value={feature.titleEN} onChange={(e) => updateFeature(index, "titleEN", e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Title (VI)</label>
                        <input type="text" value={feature.titleVI} onChange={(e) => updateFeature(index, "titleVI", e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Description (EN)</label>
                        <textarea value={feature.descEN} onChange={(e) => updateFeature(index, "descEN", e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Description (VI)</label>
                        <textarea value={feature.descVI} onChange={(e) => updateFeature(index, "descVI", e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Gradient Color</label>
                      <select value={feature.color} onChange={(e) => updateFeature(index, "color", e.target.value)} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="from-blue-500 to-cyan-500">Blue → Cyan</option>
                        <option value="from-purple-500 to-pink-500">Purple → Pink</option>
                        <option value="from-orange-500 to-red-500">Orange → Red</option>
                        <option value="from-green-500 to-teal-500">Green → Teal</option>
                        <option value="from-indigo-500 to-blue-500">Indigo → Blue</option>
                        <option value="from-yellow-500 to-orange-500">Yellow → Orange</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addFeature} className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors w-full">
                + Add New Feature
              </button>
            </div>
          )}

          {/* Gallery Editor */}
          {activeTab === "gallery" && (
            <div className="space-y-6">
              <h3 className="font-bold text-gray-900">🖼 Gallery Section</h3>
              <p className="text-sm text-gray-500">Manage the photos that appear in the "Our Learning Environment" gallery section on the homepage.</p>
              <div className="space-y-4">
                {content.gallery.map((item, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border grid md:grid-cols-4 gap-4 items-start">
                    <div className="md:col-span-1">
                      {item.src ? (
                        <img src={item.src} alt={item.captionEN} className="w-full h-24 object-cover rounded-lg border" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x100?text=Image'; }} />
                      ) : (
                        <div className="w-full h-24 flex items-center justify-center bg-gray-200 rounded-lg text-gray-400 text-sm">No image</div>
                      )}
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Image URL</label>
                        <input type="text" value={item.src} onChange={(e) => updateGallery(index, "src", e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="https://..." />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Caption (EN)</label>
                          <input type="text" value={item.captionEN} onChange={(e) => updateGallery(index, "captionEN", e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Caption (VI)</label>
                          <input type="text" value={item.captionVI} onChange={(e) => updateGallery(index, "captionVI", e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end">
                      <button onClick={() => removeGalleryItem(index)} className="text-red-600 hover:text-red-700 text-sm">🗑 Remove</button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addGalleryItem} className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors w-full">
                + Add Gallery Image
              </button>
            </div>
          )}

          {/* CTA Section Editor */}
          {activeTab === "cta" && (
            <div className="space-y-6">
              <h3 className="font-bold text-gray-900">📢 Call-to-Action Section</h3>
              <p className="text-sm text-gray-500">The CTA section appears at the bottom of the homepage before the footer.</p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">🇬🇧 English</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CTA Title</label>
                    <input type="text" value={content.cta.titleEN} onChange={(e) => updateCta("titleEN", e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CTA Description</label>
                    <textarea value={content.cta.descEN} onChange={(e) => updateCta("descEN", e.target.value)} rows={3} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">🇻🇳 Vietnamese</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CTA Title</label>
                    <input type="text" value={content.cta.titleVI} onChange={(e) => updateCta("titleVI", e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CTA Description</label>
                    <textarea value={content.cta.descVI} onChange={(e) => updateCta("descVI", e.target.value)} rows={3} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Live Preview */}
          {activeTab === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">👁 Live Preview</h3>
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-sm bg-gray-100 rounded">Desktop</button>
                  <button className="px-3 py-1 text-sm bg-gray-100 rounded">Mobile</button>
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <iframe 
                  src="/" 
                  className="w-full h-[600px]"
                  title="Preview"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowGallery(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[70vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">🖼️ Select Image from Gallery</h3>
              <button onClick={() => setShowGallery(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              {GALLERY_IMAGES.map((img) => (
                <div
                  key={img.path}
                  onClick={() => {
                    updateHero("backgroundImage", img.path);
                    setShowGallery(false);
                  }}
                  className="cursor-pointer rounded-lg overflow-hidden border-2 hover:border-blue-500 transition-all"
                >
                  <img src={img.path} alt={img.name} className="w-full h-28 object-cover" />
                  <p className="text-sm text-center py-2 bg-gray-50 font-medium">{img.name}</p>
                </div>
              ))}
            </div>
            <div className="p-4 bg-blue-50 text-sm text-blue-700">
              💡 Add new images to <code className="bg-blue-100 px-1 rounded">/public/images/gallery/</code> folder
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
