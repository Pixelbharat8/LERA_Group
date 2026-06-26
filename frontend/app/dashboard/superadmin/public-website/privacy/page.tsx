"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../../../../lib/api";
import Link from "next/link";

interface Section {
  title: string;
  content: string;
}

export default function PrivacyContentPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"EN" | "VI">("EN");
  
  const [titleEN, setTitleEN] = useState("Privacy Policy");
  const [titleVI, setTitleVI] = useState("Chính Sách Bảo Mật");
  const [lastUpdatedEN, setLastUpdatedEN] = useState("Last updated: January 2026");
  const [lastUpdatedVI, setLastUpdatedVI] = useState("Cập nhật lần cuối: Tháng 1, 2026");
  const [introEN, setIntroEN] = useState("At LERA Academy, we are committed to protecting your privacy.");
  const [introVI, setIntroVI] = useState("Tại LERA Academy, chúng tôi cam kết bảo vệ quyền riêng tư của bạn.");
  const [sectionsEN, setSectionsEN] = useState<Section[]>([
    { title: "1. Information We Collect", content: "We collect information you provide directly to us, including name, email, phone number, and other contact details when you register for courses, request information, or communicate with us." },
    { title: "2. How We Use Your Information", content: "We use the information we collect to provide and improve our educational services, communicate with you about courses and updates, process payments, and personalize your learning experience." },
    { title: "3. Information Sharing", content: "We do not sell your personal information to third parties. We may share information with service providers who assist in our operations, or when required by law." },
    { title: "4. Data Security", content: "We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction." },
    { title: "5. Your Rights", content: "You have the right to access, correct, or delete your personal information. You may also opt out of marketing communications at any time." },
    { title: "6. Contact Us", content: "For privacy inquiries, please contact us at privacy@lera.edu.vn or visit any of our learning centers." }
  ]);
  const [sectionsVI, setSectionsVI] = useState<Section[]>([
    { title: "1. Thông Tin Chúng Tôi Thu Thập", content: "Chúng tôi thu thập thông tin bạn cung cấp trực tiếp, bao gồm tên, email, số điện thoại và các thông tin liên lạc khác khi bạn đăng ký khóa học, yêu cầu thông tin hoặc liên lạc với chúng tôi." },
    { title: "2. Cách Sử Dụng Thông Tin", content: "Chúng tôi sử dụng thông tin thu thập để cung cấp và cải thiện dịch vụ giáo dục, liên lạc về khóa học và cập nhật, xử lý thanh toán và cá nhân hóa trải nghiệm học tập." },
    { title: "3. Chia Sẻ Thông Tin", content: "Chúng tôi không bán thông tin cá nhân cho bên thứ ba. Chúng tôi có thể chia sẻ thông tin với nhà cung cấp dịch vụ hỗ trợ hoạt động hoặc khi pháp luật yêu cầu." },
    { title: "4. Bảo Mật Dữ Liệu", content: "Chúng tôi thực hiện các biện pháp bảo mật phù hợp để bảo vệ thông tin cá nhân khỏi truy cập, sửa đổi, tiết lộ hoặc hủy hoại trái phép." },
    { title: "5. Quyền Của Bạn", content: "Bạn có quyền truy cập, sửa đổi hoặc xóa thông tin cá nhân. Bạn cũng có thể từ chối nhận thông tin marketing bất cứ lúc nào." },
    { title: "6. Liên Hệ", content: "Để hỏi về quyền riêng tư, vui lòng liên hệ privacy@lera.edu.vn hoặc đến bất kỳ trung tâm học tập nào của chúng tôi." }
  ]);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const data = await apiFetch("/api/cms-settings/map/privacy").catch(() => ({}));
      if (data && Object.keys(data).length > 0) {
        if (data.privacy_title_en) setTitleEN(data.privacy_title_en);
        if (data.privacy_title_vi) setTitleVI(data.privacy_title_vi);
        if (data.privacy_last_updated_en) setLastUpdatedEN(data.privacy_last_updated_en);
        if (data.privacy_last_updated_vi) setLastUpdatedVI(data.privacy_last_updated_vi);
        if (data.privacy_intro_en) setIntroEN(data.privacy_intro_en);
        if (data.privacy_intro_vi) setIntroVI(data.privacy_intro_vi);
        
        if (data.privacy_sections_en) {
          try {
            { const _v = JSON.parse(data.privacy_sections_en); if (Array.isArray(_v)) setSectionsEN(_v); }
          } catch (e) { console.log("Error parsing EN sections"); }
        }
        if (data.privacy_sections_vi) {
          try {
            { const _v = JSON.parse(data.privacy_sections_vi); if (Array.isArray(_v)) setSectionsVI(_v); }
          } catch (e) { console.log("Error parsing VI sections"); }
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
        { settingKey: "privacy_title_en", settingValue: titleEN, page: "privacy" },
        { settingKey: "privacy_title_vi", settingValue: titleVI, page: "privacy" },
        { settingKey: "privacy_last_updated_en", settingValue: lastUpdatedEN, page: "privacy" },
        { settingKey: "privacy_last_updated_vi", settingValue: lastUpdatedVI, page: "privacy" },
        { settingKey: "privacy_intro_en", settingValue: introEN, page: "privacy" },
        { settingKey: "privacy_intro_vi", settingValue: introVI, page: "privacy" },
        { settingKey: "privacy_sections_en", settingValue: JSON.stringify(sectionsEN), page: "privacy" },
        { settingKey: "privacy_sections_vi", settingValue: JSON.stringify(sectionsVI), page: "privacy" }
      ];

      await apiFetch("/api/cms-settings/batch", {
        method: "POST",
        body: JSON.stringify(settings)
      });

      alert("Privacy policy saved successfully!");
    } catch (error) {
      console.error("Error saving:", error);
      alert("Error saving. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const addSection = () => {
    if (activeTab === "EN") {
      setSectionsEN([...sectionsEN, { title: `${sectionsEN.length + 1}. New Section`, content: "Enter content here..." }]);
    } else {
      setSectionsVI([...sectionsVI, { title: `${sectionsVI.length + 1}. Phần Mới`, content: "Nhập nội dung..." }]);
    }
  };

  const updateSection = (index: number, field: "title" | "content", value: string) => {
    if (activeTab === "EN") {
      const updated = [...sectionsEN];
      updated[index][field] = value;
      setSectionsEN(updated);
    } else {
      const updated = [...sectionsVI];
      updated[index][field] = value;
      setSectionsVI(updated);
    }
  };

  const removeSection = (index: number) => {
    if (activeTab === "EN") {
      setSectionsEN(sectionsEN.filter((_, i) => i !== index));
    } else {
      setSectionsVI(sectionsVI.filter((_, i) => i !== index));
    }
  };

  const sections = activeTab === "EN" ? sectionsEN : sectionsVI;

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
              <Link href="/dashboard/superadmin/public-website" className="text-gray-500 hover:text-gray-700">
                ← Back
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">🔒 Privacy Policy</h1>
                <p className="text-sm text-gray-500">Edit privacy policy content</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a href="/privacy" target="_blank" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
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

        {/* Page Header Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Page Header</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Page Title</label>
              <input
                type="text"
                value={activeTab === "EN" ? titleEN : titleVI}
                onChange={(e) => activeTab === "EN" ? setTitleEN(e.target.value) : setTitleVI(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated Text</label>
              <input
                type="text"
                value={activeTab === "EN" ? lastUpdatedEN : lastUpdatedVI}
                onChange={(e) => activeTab === "EN" ? setLastUpdatedEN(e.target.value) : setLastUpdatedVI(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Introduction</label>
              <textarea
                value={activeTab === "EN" ? introEN : introVI}
                onChange={(e) => activeTab === "EN" ? setIntroEN(e.target.value) : setIntroVI(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Content Sections</h2>
            <button
              onClick={addSection}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              + Add Section
            </button>
          </div>

          <div className="space-y-6">
            {sections.map((section, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => updateSection(index, "title", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-medium"
                    placeholder="Section Title"
                  />
                  <button
                    onClick={() => removeSection(index)}
                    className="ml-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    🗑️ Remove
                  </button>
                </div>
                <textarea
                  value={section.content}
                  onChange={(e) => updateSection(index, "content", e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Section content..."
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
