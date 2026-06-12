"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";

interface FooterLink {
  id: number;
  label: { en: string; vi: string };
  url: string;
  openInNewTab: boolean;
}

interface FooterColumn {
  id: number;
  title: { en: string; vi: string };
  links: FooterLink[];
}

interface FooterSettings {
  copyright: { en: string; vi: string };
  description: { en: string; vi: string };
  columns: FooterColumn[];
  socialLinks: { platform: string; url: string; enabled: boolean }[];
  contactInfo: {
    email: string;
    phone: string;
    address: { en: string; vi: string };
  };
  backgroundColor: string;
  textColor: string;
}

const initialSettings: FooterSettings = {
  copyright: { 
    en: "© 2024 LERA Academy. All rights reserved.", 
    vi: "© 2024 LERA Academy. Bản quyền thuộc về LERA Academy." 
  },
  description: { 
    en: "LERA Academy - Learn English with Cambridge methodology. Trusted by 10,000+ students across Vietnam.", 
    vi: "LERA Academy - Học Tiếng Anh theo phương pháp Cambridge. Được tin tưởng bởi hơn 10,000 học viên trên toàn Việt Nam." 
  },
  columns: [
    {
      id: 1,
      title: { en: "Programs", vi: "Chương trình" },
      links: [
        { id: 1, label: { en: "Starters (4-6 years)", vi: "Starters (4-6 tuổi)" }, url: "/courses/starters", openInNewTab: false },
        { id: 2, label: { en: "Explorers (6-9 years)", vi: "Explorers (6-9 tuổi)" }, url: "/courses/explorers", openInNewTab: false },
        { id: 3, label: { en: "Primary (9-12 years)", vi: "Primary (9-12 tuổi)" }, url: "/courses/primary", openInNewTab: false },
        { id: 4, label: { en: "Teens (12-16 years)", vi: "Teens (12-16 tuổi)" }, url: "/courses/teens", openInNewTab: false },
      ]
    },
    {
      id: 2,
      title: { en: "Company", vi: "Công ty" },
      links: [
        { id: 5, label: { en: "About Us", vi: "Về chúng tôi" }, url: "/about", openInNewTab: false },
        { id: 6, label: { en: "Our Teachers", vi: "Giáo viên" }, url: "/teachers", openInNewTab: false },
        { id: 7, label: { en: "Blog", vi: "Blog" }, url: "/blog", openInNewTab: false },
        { id: 8, label: { en: "Careers", vi: "Tuyển dụng" }, url: "/careers", openInNewTab: false },
      ]
    },
    {
      id: 3,
      title: { en: "Support", vi: "Hỗ trợ" },
      links: [
        { id: 9, label: { en: "Contact Us", vi: "Liên hệ" }, url: "/contact", openInNewTab: false },
        { id: 10, label: { en: "FAQ", vi: "Câu hỏi thường gặp" }, url: "/faq", openInNewTab: false },
        { id: 11, label: { en: "Privacy Policy", vi: "Chính sách bảo mật" }, url: "/privacy", openInNewTab: false },
        { id: 12, label: { en: "Terms of Service", vi: "Điều khoản dịch vụ" }, url: "/terms", openInNewTab: false },
      ]
    }
  ],
  socialLinks: [
    { platform: "facebook", url: "https://facebook.com/leraacademy", enabled: true },
    { platform: "youtube", url: "https://youtube.com/leraacademy", enabled: true },
    { platform: "instagram", url: "https://instagram.com/leraacademy", enabled: true },
    { platform: "linkedin", url: "https://linkedin.com/company/leraacademy", enabled: false },
    { platform: "tiktok", url: "https://tiktok.com/@leraacademy", enabled: true },
  ],
  contactInfo: {
    email: "contact@leraacademy.vn",
    phone: "+84 28 1234 5678",
    address: { 
      en: "123 Nguyen Hue, District 1, Ho Chi Minh City", 
      vi: "123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh" 
    }
  },
  backgroundColor: "#0a1a5c",
  textColor: "#ffffff",
};

const socialIcons: Record<string, string> = {
  facebook: "📘",
  youtube: "🎬",
  instagram: "📷",
  linkedin: "💼",
  tiktok: "🎵",
  twitter: "🐦",
};

export default function FooterEditor() {
  const [settings, setSettings] = useState<FooterSettings>(initialSettings);
  const [activeTab, setActiveTab] = useState<"columns" | "social" | "contact" | "style">("columns");
  const [lang, setLang] = useState<"en" | "vi">("en");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingColumn, setEditingColumn] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFooterSettings();
  }, []);

  const fetchFooterSettings = async () => {
    try {
      const data = await apiFetch("/api/cms-settings/key/footer_settings").catch(() => ({}));
      if (data?.settingValue) {
        setSettings(JSON.parse(data.settingValue));
      }
    } catch (err) {
      console.log("No existing footer settings, using defaults");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await apiFetch("/api/cms-settings/key/footer_settings", {
        method: "PUT",
        body: JSON.stringify({ value: JSON.stringify(settings), category: "footer" })
      });
      alert("✅ Footer settings saved successfully!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addLink = (columnId: number) => {
    const newSettings = { ...settings };
    const column = newSettings.columns.find(c => c.id === columnId);
    if (column) {
      const newId = Math.max(...column.links.map(l => l.id), 0) + 1;
      column.links.push({
        id: newId,
        label: { en: "New Link", vi: "Liên kết mới" },
        url: "/",
        openInNewTab: false,
      });
      setSettings(newSettings);
    }
  };

  const removeLink = (columnId: number, linkId: number) => {
    const newSettings = { ...settings };
    const column = newSettings.columns.find(c => c.id === columnId);
    if (column) {
      column.links = column.links.filter(l => l.id !== linkId);
      setSettings(newSettings);
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
            <span className="text-gray-900">Footer</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">🦶 Footer Editor</h1>
          <p className="text-gray-500">Customize your website footer content and style</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? "⏳ Saving..." : "💾 Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Language Toggle */}
          <div className="flex gap-2">
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

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="border-b flex">
              {(["columns", "social", "contact", "style"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 font-medium transition-colors ${
                    activeTab === tab 
                      ? "text-blue-600 border-b-2 border-blue-600" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab === "columns" && "📑 Link Columns"}
                  {tab === "social" && "🔗 Social Links"}
                  {tab === "contact" && "📞 Contact Info"}
                  {tab === "style" && "🎨 Style"}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* Columns Tab */}
              {activeTab === "columns" && (
                <div className="space-y-6">
                  {settings.columns.map((column) => (
                    <div key={column.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <input
                          type="text"
                          value={column.title[lang]}
                          onChange={(e) => {
                            const newSettings = { ...settings };
                            const col = newSettings.columns.find(c => c.id === column.id);
                            if (col) col.title[lang] = e.target.value;
                            setSettings(newSettings);
                          }}
                          className="text-lg font-bold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none"
                        />
                        <button
                          onClick={() => addLink(column.id)}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          + Add Link
                        </button>
                      </div>
                      <div className="space-y-2">
                        {column.links.map((link) => (
                          <div key={link.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <span className="text-gray-400 cursor-move">⋮⋮</span>
                            <input
                              type="text"
                              value={link.label[lang]}
                              onChange={(e) => {
                                const newSettings = { ...settings };
                                const col = newSettings.columns.find(c => c.id === column.id);
                                const l = col?.links.find(lk => lk.id === link.id);
                                if (l) l.label[lang] = e.target.value;
                                setSettings(newSettings);
                              }}
                              className="flex-1 px-2 py-1 border rounded text-sm"
                              placeholder="Label"
                            />
                            <input
                              type="text"
                              value={link.url}
                              onChange={(e) => {
                                const newSettings = { ...settings };
                                const col = newSettings.columns.find(c => c.id === column.id);
                                const l = col?.links.find(lk => lk.id === link.id);
                                if (l) l.url = e.target.value;
                                setSettings(newSettings);
                              }}
                              className="w-32 px-2 py-1 border rounded text-sm"
                              placeholder="URL"
                            />
                            <button
                              onClick={() => removeLink(column.id, link.id)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              🗑
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Copyright Text ({lang.toUpperCase()})</label>
                    <input
                      type="text"
                      value={settings.copyright[lang]}
                      onChange={(e) => setSettings({ ...settings, copyright: { ...settings.copyright, [lang]: e.target.value } })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Footer Description ({lang.toUpperCase()})</label>
                    <textarea
                      value={settings.description[lang]}
                      onChange={(e) => setSettings({ ...settings, description: { ...settings.description, [lang]: e.target.value } })}
                      rows={3}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Social Links Tab */}
              {activeTab === "social" && (
                <div className="space-y-4">
                  {settings.socialLinks.map((social, index) => (
                    <div key={social.platform} className="flex items-center gap-4 p-4 border rounded-lg">
                      <span className="text-2xl">{socialIcons[social.platform]}</span>
                      <div className="flex-1">
                        <p className="font-medium capitalize">{social.platform}</p>
                        <input
                          type="text"
                          value={social.url}
                          onChange={(e) => {
                            const newSettings = { ...settings };
                            newSettings.socialLinks[index].url = e.target.value;
                            setSettings(newSettings);
                          }}
                          className="w-full px-3 py-1 border rounded text-sm mt-1"
                          placeholder="Enter URL"
                        />
                      </div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={social.enabled}
                          onChange={(e) => {
                            const newSettings = { ...settings };
                            newSettings.socialLinks[index].enabled = e.target.checked;
                            setSettings(newSettings);
                          }}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">Show</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {/* Contact Info Tab */}
              {activeTab === "contact" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={settings.contactInfo.email}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        contactInfo: { ...settings.contactInfo, email: e.target.value } 
                      })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="text"
                      value={settings.contactInfo.phone}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        contactInfo: { ...settings.contactInfo, phone: e.target.value } 
                      })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address ({lang.toUpperCase()})</label>
                    <textarea
                      value={settings.contactInfo.address[lang]}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        contactInfo: { 
                          ...settings.contactInfo, 
                          address: { ...settings.contactInfo.address, [lang]: e.target.value } 
                        } 
                      })}
                      rows={2}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Style Tab */}
              {activeTab === "style" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={settings.backgroundColor}
                        onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                        className="w-12 h-12 rounded cursor-pointer border"
                      />
                      <input
                        type="text"
                        value={settings.backgroundColor}
                        onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                        className="flex-1 px-4 py-2 border rounded-lg uppercase"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={settings.textColor}
                        onChange={(e) => setSettings({ ...settings, textColor: e.target.value })}
                        className="w-12 h-12 rounded cursor-pointer border"
                      />
                      <input
                        type="text"
                        value={settings.textColor}
                        onChange={(e) => setSettings({ ...settings, textColor: e.target.value })}
                        className="flex-1 px-4 py-2 border rounded-lg uppercase"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">👁 Live Preview</h2>
            
            <div 
              className="rounded-lg overflow-hidden text-sm"
              style={{ backgroundColor: settings.backgroundColor, color: settings.textColor }}
            >
              <div className="p-4">
                {/* Logo & Description */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-white rounded flex items-center justify-center text-xs font-bold" style={{ color: settings.backgroundColor }}>L</div>
                    <span className="font-bold text-sm">LERA Academy</span>
                  </div>
                  <p className="text-xs opacity-80 line-clamp-2">{settings.description[lang]}</p>
                </div>

                {/* Columns */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {settings.columns.map((col) => (
                    <div key={col.id}>
                      <h4 className="font-bold text-xs mb-1">{col.title[lang]}</h4>
                      <ul className="space-y-0.5">
                        {col.links.slice(0, 3).map((link) => (
                          <li key={link.id} className="text-xs opacity-70">{link.label[lang]}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Social Links */}
                <div className="flex gap-2 mb-3">
                  {settings.socialLinks.filter(s => s.enabled).map((social) => (
                    <span key={social.platform} className="text-sm">{socialIcons[social.platform]}</span>
                  ))}
                </div>

                {/* Copyright */}
                <div className="border-t border-white/20 pt-2">
                  <p className="text-xs opacity-60">{settings.copyright[lang]}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
