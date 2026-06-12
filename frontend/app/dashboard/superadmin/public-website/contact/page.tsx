"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";

interface ContactSettings {
  contact_address: string;
  contact_address_vi: string;
  contact_phone: string;
  contact_phone_hotline: string;
  contact_email: string;
  contact_email_support: string;
  working_hours: string;
  working_hours_vi: string;
  working_days: string;
  working_days_vi: string;
  map_embed_url: string;
  facebook_url: string;
  instagram_url: string;
  tiktok_url: string;
  zalo_url: string;
  youtube_url: string;
  linkedin_url: string;
}

interface FaqItem {
  id: string;
  questionEN: string;
  questionVI: string;
  answerEN: string;
  answerVI: string;
  displayOrder: number;
  isActive: boolean;
}

export default function ContactPageEditor() {
  const [activeTab, setActiveTab] = useState<"info" | "social" | "faq" | "preview">("info");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  
  const [settings, setSettings] = useState<ContactSettings>({
    contact_address: "95 Hải Đăng, khu đô thị Vinhomes Marina, phường An Biên, Hải Phòng",
    contact_address_vi: "95 Hải Đăng, khu đô thị Vinhomes Marina, phường An Biên, Hải Phòng",
    contact_phone: "0387.633.141",
    contact_phone_hotline: "0387.633.141",
    contact_email: "info@lera.edu.vn",
    contact_email_support: "support@lera.edu.vn",
    working_hours: "8:00 AM - 9:00 PM",
    working_hours_vi: "8:00 - 21:00",
    working_days: "Monday - Sunday",
    working_days_vi: "Thứ 2 - Chủ Nhật",
    map_embed_url: "",
    facebook_url: "https://www.facebook.com/profile.php?id=61580971978601",
    instagram_url: "https://instagram.com/leraacademy",
    tiktok_url: "https://tiktok.com/@leraacademy",
    zalo_url: "https://zalo.me/leraacademy",
    youtube_url: "https://youtube.com/leraacademy",
    linkedin_url: "",
  });

  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [showAddFaq, setShowAddFaq] = useState(false);
  const [newFaq, setNewFaq] = useState<Partial<FaqItem>>({
    questionEN: "",
    questionVI: "",
    answerEN: "",
    answerVI: "",
    isActive: true,
  });

  useEffect(() => {
    fetchSettings();
    fetchFaqs();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await apiFetch("/api/cms-settings/map/contact");
      if (data && Object.keys(data).length > 0) {
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.log("Using default contact settings");
    } finally {
      setLoading(false);
    }
  };

  const fetchFaqs = async () => {
    try {
      const data = await apiFetch("/api/faqs");
      if (Array.isArray(data)) {
        setFaqs(data);
      }
    } catch (err) {
      console.log("No FAQs found");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const settingsToSave = Object.entries(settings).map(([key, value]) => ({
        settingKey: key,
        settingValue: value || "",
        category: "contact",
      }));

      await apiFetch("/api/cms-settings/batch", {
        method: "POST",
        body: JSON.stringify(settingsToSave),
      });
      
      setMessage("✅ Contact settings saved successfully!");
    } catch (err: any) {
      setMessage("❌ Error saving: " + err.message);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleAddFaq = async () => {
    try {
      const faq = await apiFetch("/api/faqs", {
        method: "POST",
        body: JSON.stringify({
          ...newFaq,
          displayOrder: faqs.length + 1,
        }),
      });
      setFaqs([...faqs, faq]);
      setNewFaq({ questionEN: "", questionVI: "", answerEN: "", answerVI: "", isActive: true });
      setShowAddFaq(false);
      setMessage("✅ FAQ added successfully!");
    } catch (err: any) {
      setMessage("❌ Error adding FAQ: " + err.message);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    try {
      await apiFetch(`/api/faqs/${id}`, { method: "DELETE" });
      setFaqs(faqs.filter(f => f.id !== id));
      setMessage("✅ FAQ deleted!");
    } catch (err: any) {
      setMessage("❌ Error: " + err.message);
    }
  };

  const updateSetting = (key: keyof ContactSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/superadmin" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/superadmin/public-website" className="hover:text-blue-600">Public Website</Link>
            <span>/</span>
            <span className="text-gray-900">Contact Page</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">📞 Contact Page Editor</h1>
          <p className="text-gray-500">Edit contact information, social links, and FAQs</p>
        </div>
        <div className="flex items-center gap-3">
          {message && <span className={message.includes("✅") ? "text-green-600" : "text-red-600"}>{message}</span>}
          <Link href="/contact" target="_blank" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            👁 Preview
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "⏳ Saving..." : "💾 Save Changes"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b">
          <nav className="flex gap-4 px-6">
            {[
              { id: "info", label: "📍 Contact Info" },
              { id: "social", label: "🔗 Social Media" },
              { id: "faq", label: "❓ FAQs" },
              { id: "preview", label: "👁 Preview" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Contact Info Tab */}
          {activeTab === "info" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address (English)</label>
                  <input
                    type="text"
                    value={settings.contact_address}
                    onChange={(e) => updateSetting("contact_address", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address (Vietnamese)</label>
                  <input
                    type="text"
                    value={settings.contact_address_vi}
                    onChange={(e) => updateSetting("contact_address_vi", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Main Phone</label>
                  <input
                    type="text"
                    value={settings.contact_phone}
                    onChange={(e) => updateSetting("contact_phone", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hotline</label>
                  <input
                    type="text"
                    value={settings.contact_phone_hotline}
                    onChange={(e) => updateSetting("contact_phone_hotline", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={settings.contact_email}
                    onChange={(e) => updateSetting("contact_email", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
                  <input
                    type="email"
                    value={settings.contact_email_support}
                    onChange={(e) => updateSetting("contact_email_support", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours (English)</label>
                  <input
                    type="text"
                    value={settings.working_hours}
                    onChange={(e) => updateSetting("working_hours", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours (Vietnamese)</label>
                  <input
                    type="text"
                    value={settings.working_hours_vi}
                    onChange={(e) => updateSetting("working_hours_vi", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Working Days (English)</label>
                  <input
                    type="text"
                    value={settings.working_days}
                    onChange={(e) => updateSetting("working_days", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Working Days (Vietnamese)</label>
                  <input
                    type="text"
                    value={settings.working_days_vi}
                    onChange={(e) => updateSetting("working_days_vi", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Google Maps Embed URL</label>
                <input
                  type="text"
                  value={settings.map_embed_url}
                  onChange={(e) => updateSetting("map_embed_url", e.target.value)}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Get embed URL from Google Maps → Share → Embed a map</p>
              </div>
            </div>
          )}

          {/* Social Media Tab */}
          {activeTab === "social" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📘 Facebook URL</label>
                  <input
                    type="url"
                    value={settings.facebook_url}
                    onChange={(e) => updateSetting("facebook_url", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📸 Instagram URL</label>
                  <input
                    type="url"
                    value={settings.instagram_url}
                    onChange={(e) => updateSetting("instagram_url", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🎵 TikTok URL</label>
                  <input
                    type="url"
                    value={settings.tiktok_url}
                    onChange={(e) => updateSetting("tiktok_url", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">💬 Zalo URL</label>
                  <input
                    type="url"
                    value={settings.zalo_url}
                    onChange={(e) => updateSetting("zalo_url", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📺 YouTube URL</label>
                  <input
                    type="url"
                    value={settings.youtube_url}
                    onChange={(e) => updateSetting("youtube_url", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">💼 LinkedIn URL</label>
                  <input
                    type="url"
                    value={settings.linkedin_url}
                    onChange={(e) => updateSetting("linkedin_url", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* FAQ Tab */}
          {activeTab === "faq" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Frequently Asked Questions</h3>
                <button
                  onClick={() => setShowAddFaq(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  ➕ Add FAQ
                </button>
              </div>

              {/* Add FAQ Form */}
              {showAddFaq && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Question (English)</label>
                      <input
                        type="text"
                        value={newFaq.questionEN || ""}
                        onChange={(e) => setNewFaq({ ...newFaq, questionEN: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Question (Vietnamese)</label>
                      <input
                        type="text"
                        value={newFaq.questionVI || ""}
                        onChange={(e) => setNewFaq({ ...newFaq, questionVI: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Answer (English)</label>
                      <textarea
                        value={newFaq.answerEN || ""}
                        onChange={(e) => setNewFaq({ ...newFaq, answerEN: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Answer (Vietnamese)</label>
                      <textarea
                        value={newFaq.answerVI || ""}
                        onChange={(e) => setNewFaq({ ...newFaq, answerVI: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddFaq} className="px-4 py-2 bg-green-600 text-white rounded-lg">
                      ✓ Save FAQ
                    </button>
                    <button onClick={() => setShowAddFaq(false)} className="px-4 py-2 bg-gray-200 rounded-lg">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* FAQ List */}
              <div className="space-y-4">
                {faqs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No FAQs yet. Click "Add FAQ" to create one.</p>
                ) : (
                  faqs.map((faq, index) => (
                    <div key={faq.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">Q{index + 1}: {faq.questionEN}</p>
                          <p className="text-sm text-gray-500 mt-1">{faq.questionVI}</p>
                          <p className="text-sm text-gray-700 mt-2">{faq.answerEN}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteFaq(faq.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Preview Tab */}
          {activeTab === "preview" && (
            <div className="bg-gray-100 rounded-lg p-6">
              <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">📍 Contact Information Preview</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">📍</span>
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-gray-600">{settings.contact_address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xl">📞</span>
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-gray-600">{settings.contact_phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xl">✉️</span>
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-gray-600">{settings.contact_email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xl">🕐</span>
                    <div>
                      <p className="font-medium">Hours</p>
                      <p className="text-gray-600">{settings.working_hours} ({settings.working_days})</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t">
                  <p className="font-medium mb-3">Social Media</p>
                  <div className="flex gap-4">
                    {settings.facebook_url && <a href={settings.facebook_url} className="text-blue-600 text-2xl">📘</a>}
                    {settings.instagram_url && <a href={settings.instagram_url} className="text-pink-600 text-2xl">📸</a>}
                    {settings.tiktok_url && <a href={settings.tiktok_url} className="text-black text-2xl">🎵</a>}
                    {settings.zalo_url && <a href={settings.zalo_url} className="text-blue-500 text-2xl">💬</a>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
