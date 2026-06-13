"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../../../../lib/api";
import Link from "next/link";

interface Section {
  title: string;
  content: string;
}

export default function TermsContentPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"EN" | "VI">("EN");
  
  const [titleEN, setTitleEN] = useState("Terms of Service");
  const [titleVI, setTitleVI] = useState("Điều Khoản Sử Dụng");
  const [lastUpdatedEN, setLastUpdatedEN] = useState("Last updated: January 2026");
  const [lastUpdatedVI, setLastUpdatedVI] = useState("Cập nhật lần cuối: Tháng 1, 2026");
  const [introEN, setIntroEN] = useState("Please read these Terms of Service carefully before using LERA Academy's services.");
  const [introVI, setIntroVI] = useState("Vui lòng đọc kỹ Điều khoản Sử dụng trước khi sử dụng dịch vụ của LERA Academy.");
  const [sectionsEN, setSectionsEN] = useState<Section[]>([
    { title: "1. Acceptance of Terms", content: "By accessing or using LERA Academy's services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services." },
    { title: "2. Services", content: "LERA Academy provides English language education services including in-person classes, online courses, tutoring, and related educational materials. We reserve the right to modify or discontinue services at any time." },
    { title: "3. Registration and Enrollment", content: "To enroll in our courses, you must provide accurate and complete information. Students under 18 must have parental or guardian consent. You are responsible for maintaining the confidentiality of your account." },
    { title: "4. Payment and Refunds", content: "Course fees are due upon enrollment unless otherwise arranged. Refund requests must be submitted within 7 days of course start date. A processing fee may apply to refunds." },
    { title: "5. Attendance and Conduct", content: "Students are expected to attend classes regularly and maintain appropriate conduct. LERA Academy reserves the right to dismiss students who violate our code of conduct." },
    { title: "6. Intellectual Property", content: "All course materials, including textbooks, videos, and online content, are the intellectual property of LERA Academy. Unauthorized reproduction or distribution is prohibited." }
  ]);
  const [sectionsVI, setSectionsVI] = useState<Section[]>([
    { title: "1. Chấp Nhận Điều Khoản", content: "Bằng việc truy cập hoặc sử dụng dịch vụ của LERA Academy, bạn đồng ý tuân theo các Điều khoản Sử dụng này. Nếu bạn không đồng ý, vui lòng không sử dụng dịch vụ của chúng tôi." },
    { title: "2. Dịch Vụ", content: "LERA Academy cung cấp dịch vụ giáo dục tiếng Anh bao gồm lớp học trực tiếp, khóa học trực tuyến, gia sư và tài liệu giáo dục liên quan. Chúng tôi có quyền sửa đổi hoặc ngừng dịch vụ bất cứ lúc nào." },
    { title: "3. Đăng Ký và Ghi Danh", content: "Để đăng ký khóa học, bạn phải cung cấp thông tin chính xác và đầy đủ. Học viên dưới 18 tuổi cần có sự đồng ý của phụ huynh hoặc người giám hộ. Bạn có trách nhiệm bảo mật tài khoản của mình." },
    { title: "4. Thanh Toán và Hoàn Tiền", content: "Học phí phải thanh toán khi ghi danh trừ khi có thỏa thuận khác. Yêu cầu hoàn tiền phải được gửi trong vòng 7 ngày kể từ ngày bắt đầu khóa học. Phí xử lý có thể áp dụng cho hoàn tiền." },
    { title: "5. Điểm Danh và Nội Quy", content: "Học viên được yêu cầu đi học đều đặn và duy trì hành vi phù hợp. LERA Academy có quyền cho thôi học những học viên vi phạm nội quy." },
    { title: "6. Sở Hữu Trí Tuệ", content: "Tất cả tài liệu khóa học, bao gồm sách giáo khoa, video và nội dung trực tuyến, là tài sản trí tuệ của LERA Academy. Nghiêm cấm sao chép hoặc phân phối trái phép." }
  ]);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const data = await apiFetch("/api/cms-settings/map/terms").catch(() => ({}));
      if (data && Object.keys(data).length > 0) {
        if (data.terms_title_en) setTitleEN(data.terms_title_en);
        if (data.terms_title_vi) setTitleVI(data.terms_title_vi);
        if (data.terms_last_updated_en) setLastUpdatedEN(data.terms_last_updated_en);
        if (data.terms_last_updated_vi) setLastUpdatedVI(data.terms_last_updated_vi);
        if (data.terms_intro_en) setIntroEN(data.terms_intro_en);
        if (data.terms_intro_vi) setIntroVI(data.terms_intro_vi);
        
        if (data.terms_sections_en) {
          try {
            setSectionsEN(JSON.parse(data.terms_sections_en));
          } catch (e) { console.log("Error parsing EN sections"); }
        }
        if (data.terms_sections_vi) {
          try {
            setSectionsVI(JSON.parse(data.terms_sections_vi));
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
        { settingKey: "terms_title_en", settingValue: titleEN, page: "terms" },
        { settingKey: "terms_title_vi", settingValue: titleVI, page: "terms" },
        { settingKey: "terms_last_updated_en", settingValue: lastUpdatedEN, page: "terms" },
        { settingKey: "terms_last_updated_vi", settingValue: lastUpdatedVI, page: "terms" },
        { settingKey: "terms_intro_en", settingValue: introEN, page: "terms" },
        { settingKey: "terms_intro_vi", settingValue: introVI, page: "terms" },
        { settingKey: "terms_sections_en", settingValue: JSON.stringify(sectionsEN), page: "terms" },
        { settingKey: "terms_sections_vi", settingValue: JSON.stringify(sectionsVI), page: "terms" }
      ];

      await apiFetch("/api/cms-settings/batch", {
        method: "POST",
        body: JSON.stringify(settings)
      });

      alert("Terms of Service saved successfully!");
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
                <h1 className="text-xl font-bold text-gray-900">📜 Terms of Service</h1>
                <p className="text-sm text-gray-500">Edit terms and conditions content</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a href="/terms" target="_blank" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
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
