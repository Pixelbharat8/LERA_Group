"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../../../../lib/api";
import Link from "next/link";

export default function ContactContentPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"EN" | "VI">("EN");
  
  // Hero
  const [heroTitleEN, setHeroTitleEN] = useState("Get in Touch");
  const [heroTitleVI, setHeroTitleVI] = useState("Liên Hệ Với Chúng Tôi");
  const [heroSubtitleEN, setHeroSubtitleEN] = useState("We'd love to hear from you!");
  const [heroSubtitleVI, setHeroSubtitleVI] = useState("Chúng tôi rất mong nhận được phản hồi từ bạn!");

  // Contact Info
  const [phone, setPhone] = useState("0387.633.141");
  const [email, setEmail] = useState("info@lera.edu.vn");
  const [addressEN, setAddressEN] = useState("95 Hai Dang, Vinhomes Marina, An Bien Ward, Hai Phong");
  const [addressVI, setAddressVI] = useState("95 Hải Đăng, khu đô thị Vinhomes Marina, phường An Biên, Hải Phòng");
  const [workingHoursEN, setWorkingHoursEN] = useState("Mon-Fri: 8:00 AM - 9:00 PM, Sat-Sun: 8:00 AM - 5:00 PM");
  const [workingHoursVI, setWorkingHoursVI] = useState("T2-T6: 8:00 - 21:00, T7-CN: 8:00 - 17:00");

  // Form Labels
  const [formTitleEN, setFormTitleEN] = useState("Send us a message");
  const [formTitleVI, setFormTitleVI] = useState("Gửi tin nhắn cho chúng tôi");

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const data = await apiFetch("/api/cms-settings/map/contact").catch(() => ({}));
      if (data && Object.keys(data).length > 0) {
        if (data.contact_hero_title_en) setHeroTitleEN(data.contact_hero_title_en);
        if (data.contact_hero_title_vi) setHeroTitleVI(data.contact_hero_title_vi);
        if (data.contact_hero_subtitle_en) setHeroSubtitleEN(data.contact_hero_subtitle_en);
        if (data.contact_hero_subtitle_vi) setHeroSubtitleVI(data.contact_hero_subtitle_vi);
        if (data.contact_phone) setPhone(data.contact_phone);
        if (data.contact_email) setEmail(data.contact_email);
        if (data.contact_address_en) setAddressEN(data.contact_address_en);
        if (data.contact_address_vi) setAddressVI(data.contact_address_vi);
        if (data.contact_working_hours_en) setWorkingHoursEN(data.contact_working_hours_en);
        if (data.contact_working_hours_vi) setWorkingHoursVI(data.contact_working_hours_vi);
        if (data.contact_form_title_en) setFormTitleEN(data.contact_form_title_en);
        if (data.contact_form_title_vi) setFormTitleVI(data.contact_form_title_vi);
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
        { settingKey: "contact_hero_title_en", settingValue: heroTitleEN, page: "contact" },
        { settingKey: "contact_hero_title_vi", settingValue: heroTitleVI, page: "contact" },
        { settingKey: "contact_hero_subtitle_en", settingValue: heroSubtitleEN, page: "contact" },
        { settingKey: "contact_hero_subtitle_vi", settingValue: heroSubtitleVI, page: "contact" },
        { settingKey: "contact_phone", settingValue: phone, page: "contact" },
        { settingKey: "contact_email", settingValue: email, page: "contact" },
        { settingKey: "contact_address_en", settingValue: addressEN, page: "contact" },
        { settingKey: "contact_address_vi", settingValue: addressVI, page: "contact" },
        { settingKey: "contact_working_hours_en", settingValue: workingHoursEN, page: "contact" },
        { settingKey: "contact_working_hours_vi", settingValue: workingHoursVI, page: "contact" },
        { settingKey: "contact_form_title_en", settingValue: formTitleEN, page: "contact" },
        { settingKey: "contact_form_title_vi", settingValue: formTitleVI, page: "contact" }
      ];

      await apiFetch("/api/cms-settings/batch", {
        method: "POST",
        body: JSON.stringify(settings)
      });

      // Also sync key contact fields to website-settings (used by Footer, FloatingCTA, etc.)
      try {
        await apiFetch("/api/website-settings/bulk", {
          method: "PUT",
          body: JSON.stringify({
            contact_phone: phone,
            contact_email: email,
            contact_address: addressVI,
            contact_address_en: addressEN,
          })
        });
      } catch (syncError) {
        console.warn("Could not sync to website-settings:", syncError);
      }

      alert("Contact page saved successfully!");
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
                <h1 className="text-xl font-bold text-gray-900">Contact Page</h1>
                <p className="text-sm text-gray-500">Edit contact information</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a href="/contact" target="_blank" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
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
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === "EN" ? "bg-blue-600 text-white" : "bg-white border border-gray-300"}`}
          >
            🇬🇧 English
          </button>
          <button
            onClick={() => setActiveTab("VI")}
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === "VI" ? "bg-blue-600 text-white" : "bg-white border border-gray-300"}`}
          >
            🇻🇳 Vietnamese
          </button>
        </div>

        {/* Hero Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🎯 Hero Section</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={activeTab === "EN" ? heroTitleEN : heroTitleVI}
                onChange={(e) => activeTab === "EN" ? setHeroTitleEN(e.target.value) : setHeroTitleVI(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
              <input
                type="text"
                value={activeTab === "EN" ? heroSubtitleEN : heroSubtitleVI}
                onChange={(e) => activeTab === "EN" ? setHeroSubtitleEN(e.target.value) : setHeroSubtitleVI(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📞 Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={activeTab === "EN" ? addressEN : addressVI}
                onChange={(e) => activeTab === "EN" ? setAddressEN(e.target.value) : setAddressVI(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Working Hours</label>
              <input
                type="text"
                value={activeTab === "EN" ? workingHoursEN : workingHoursVI}
                onChange={(e) => activeTab === "EN" ? setWorkingHoursEN(e.target.value) : setWorkingHoursVI(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Form Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📝 Contact Form</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Form Title</label>
            <input
              type="text"
              value={activeTab === "EN" ? formTitleEN : formTitleVI}
              onChange={(e) => activeTab === "EN" ? setFormTitleEN(e.target.value) : setFormTitleVI(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
