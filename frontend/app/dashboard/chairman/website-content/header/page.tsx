"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../../../../lib/api";
import Link from "next/link";

interface MenuItem {
  id: string;
  label: string;
  labelVi: string;
  href: string;
  order: number;
  isActive: boolean;
  children?: MenuItem[];
}

interface HeaderSettings {
  phone: string;
  email: string;
  showPhone: boolean;
  showEmail: boolean;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  linkedinUrl: string;
  showSocialLinks: boolean;
  ctaButtonText: string;
  ctaButtonTextVi: string;
  ctaButtonUrl: string;
}

const defaultMenuItems: MenuItem[] = [
  { id: "1", label: "Home", labelVi: "Trang Chủ", href: "/", order: 1, isActive: true },
  { id: "2", label: "Courses", labelVi: "Khóa Học", href: "/courses", order: 2, isActive: true },
  { id: "3", label: "About", labelVi: "Về Chúng Tôi", href: "/about", order: 3, isActive: true },
  { id: "4", label: "Centers", labelVi: "Cơ Sở", href: "/centers", order: 4, isActive: true },
  { id: "5", label: "Contact", labelVi: "Liên Hệ", href: "/contact", order: 5, isActive: true },
];

const defaultSettings: HeaderSettings = {
  phone: "0387.633.141",
  email: "info@lera.edu.vn",
  showPhone: true,
  showEmail: true,
  facebookUrl: "https://facebook.com/leraacademy",
  instagramUrl: "https://instagram.com/leraacademy",
  youtubeUrl: "https://youtube.com/leraacademy",
  linkedinUrl: "",
  showSocialLinks: true,
  ctaButtonText: "Login",
  ctaButtonTextVi: "Đăng Nhập",
  ctaButtonUrl: "/auth/login",
};

export default function HeaderMenuPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(defaultMenuItems);
  const [settings, setSettings] = useState<HeaderSettings>(defaultSettings);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch menu items
      const menuData = await apiFetch("/api/cms-settings/value/header_menu_items").catch(() => null);
      if (menuData) {
        try {
          const parsed = JSON.parse(menuData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMenuItems(parsed);
          }
        } catch (e) { console.log("Using default menu items"); }
      }

      // Fetch header settings
      const settingsData = await apiFetch("/api/cms-settings/map/header").catch(() => ({}));
      if (settingsData && Object.keys(settingsData).length > 0) {
        setSettings({
          phone: settingsData.header_phone || defaultSettings.phone,
          email: settingsData.header_email || defaultSettings.email,
          showPhone: settingsData.header_show_phone !== "false",
          showEmail: settingsData.header_show_email !== "false",
          facebookUrl: settingsData.header_facebook || defaultSettings.facebookUrl,
          instagramUrl: settingsData.header_instagram || defaultSettings.instagramUrl,
          youtubeUrl: settingsData.header_youtube || defaultSettings.youtubeUrl,
          linkedinUrl: settingsData.header_linkedin || "",
          showSocialLinks: settingsData.header_show_social !== "false",
          ctaButtonText: settingsData.header_cta_text_en || defaultSettings.ctaButtonText,
          ctaButtonTextVi: settingsData.header_cta_text_vi || defaultSettings.ctaButtonTextVi,
          ctaButtonUrl: settingsData.header_cta_url || defaultSettings.ctaButtonUrl,
        });
      }
    } catch (error) {
      console.error("Error fetching header data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const cmsSettings = [
        { settingKey: "header_menu_items", settingValue: JSON.stringify(menuItems), page: "header" },
        { settingKey: "header_phone", settingValue: settings.phone, page: "header" },
        { settingKey: "header_email", settingValue: settings.email, page: "header" },
        { settingKey: "header_show_phone", settingValue: String(settings.showPhone), page: "header" },
        { settingKey: "header_show_email", settingValue: String(settings.showEmail), page: "header" },
        { settingKey: "header_facebook", settingValue: settings.facebookUrl, page: "header" },
        { settingKey: "header_instagram", settingValue: settings.instagramUrl, page: "header" },
        { settingKey: "header_youtube", settingValue: settings.youtubeUrl, page: "header" },
        { settingKey: "header_linkedin", settingValue: settings.linkedinUrl, page: "header" },
        { settingKey: "header_show_social", settingValue: String(settings.showSocialLinks), page: "header" },
        { settingKey: "header_cta_text_en", settingValue: settings.ctaButtonText, page: "header" },
        { settingKey: "header_cta_text_vi", settingValue: settings.ctaButtonTextVi, page: "header" },
        { settingKey: "header_cta_url", settingValue: settings.ctaButtonUrl, page: "header" },
      ];

      await apiFetch("/api/cms-settings/batch", {
        method: "POST",
        body: JSON.stringify(cmsSettings),
      });

      // Also sync key fields to website-settings (used by Footer, FloatingCTA, etc.)
      try {
        await apiFetch("/api/website-settings/bulk", {
          method: "PUT",
          body: JSON.stringify({
            header_phone: settings.phone,
            social_facebook: settings.facebookUrl,
            social_instagram: settings.instagramUrl,
            social_youtube: settings.youtubeUrl,
            zalo_url: settings.linkedinUrl ? undefined : undefined, // keep existing
          })
        });
      } catch (syncError) {
        console.warn("Could not sync to website-settings:", syncError);
      }

      alert("Header settings saved successfully!");
    } catch (error) {
      console.error("Error saving:", error);
      alert("Error saving. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const addMenuItem = () => {
    const newItem: MenuItem = {
      id: Date.now().toString(),
      label: "New Menu",
      labelVi: "Menu Mới",
      href: "/",
      order: menuItems.length + 1,
      isActive: true,
    };
    setEditingItem(newItem);
    setIsCreating(true);
  };

  const saveMenuItem = () => {
    if (!editingItem) return;
    if (isCreating) {
      setMenuItems([...menuItems, editingItem]);
    } else {
      setMenuItems(menuItems.map(item => item.id === editingItem.id ? editingItem : item));
    }
    setEditingItem(null);
    setIsCreating(false);
  };

  const deleteMenuItem = (id: string) => {
    if (!confirm("Delete this menu item?")) return;
    setMenuItems(menuItems.filter(item => item.id !== id));
  };

  const moveItem = (id: string, direction: "up" | "down") => {
    const index = menuItems.findIndex(item => item.id === id);
    if (direction === "up" && index > 0) {
      const newItems = [...menuItems];
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
      newItems.forEach((item, i) => item.order = i + 1);
      setMenuItems(newItems);
    } else if (direction === "down" && index < menuItems.length - 1) {
      const newItems = [...menuItems];
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
      newItems.forEach((item, i) => item.order = i + 1);
      setMenuItems(newItems);
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
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/chairman/website-content" className="text-gray-500 hover:text-gray-700">
                ← Back
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">📋 Header & Menu Settings</h1>
                <p className="text-sm text-gray-500">Configure navigation menu and header information</p>
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

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📞 Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="0387.633.141"
                />
                <label className="flex items-center gap-2 px-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={settings.showPhone}
                    onChange={(e) => setSettings({ ...settings, showPhone: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Show</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="info@lera.edu.vn"
                />
                <label className="flex items-center gap-2 px-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={settings.showEmail}
                    onChange={(e) => setSettings({ ...settings, showEmail: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Show</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">🔗 Social Media Links</h2>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.showSocialLinks}
                onChange={(e) => setSettings({ ...settings, showSocialLinks: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">Show in Header</span>
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
              <input
                type="url"
                value={settings.facebookUrl}
                onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="https://facebook.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
              <input
                type="url"
                value={settings.instagramUrl}
                onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="https://instagram.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">YouTube</label>
              <input
                type="url"
                value={settings.youtubeUrl}
                onChange={(e) => setSettings({ ...settings, youtubeUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="https://youtube.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
              <input
                type="url"
                value={settings.linkedinUrl}
                onChange={(e) => setSettings({ ...settings, linkedinUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="https://linkedin.com/..."
              />
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🔘 Call-to-Action Button</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button Text (English)</label>
              <input
                type="text"
                value={settings.ctaButtonText}
                onChange={(e) => setSettings({ ...settings, ctaButtonText: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Login"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button Text (Vietnamese)</label>
              <input
                type="text"
                value={settings.ctaButtonTextVi}
                onChange={(e) => setSettings({ ...settings, ctaButtonTextVi: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Đăng Nhập"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button URL</label>
              <input
                type="text"
                value={settings.ctaButtonUrl}
                onChange={(e) => setSettings({ ...settings, ctaButtonUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="/auth/login"
              />
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">🧭 Navigation Menu</h2>
            <button
              onClick={addMenuItem}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              + Add Menu Item
            </button>
          </div>
          
          <div className="space-y-3">
            {menuItems.sort((a, b) => a.order - b.order).map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center gap-4 p-4 border rounded-lg ${
                  item.isActive ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50"
                }`}
              >
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveItem(item.id, "up")}
                    disabled={index === 0}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveItem(item.id, "down")}
                    disabled={index === menuItems.length - 1}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>
                <div className="flex-1 grid grid-cols-4 gap-4">
                  <div>
                    <span className="text-xs text-gray-500">Label (EN)</span>
                    <p className="font-medium">{item.label}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Label (VI)</span>
                    <p className="font-medium">{item.labelVi}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">URL</span>
                    <p className="text-blue-600">{item.href}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Status</span>
                    <p className={item.isActive ? "text-green-600" : "text-gray-400"}>
                      {item.isActive ? "✅ Active" : "⚪ Hidden"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditingItem(item); setIsCreating(false); }}
                    className="px-3 py-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => deleteMenuItem(item.id)}
                    className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">👁️ Header Preview</h2>
          <div className="border rounded-xl overflow-hidden">
            <div className="bg-gray-800 text-white text-xs px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {settings.showPhone && <span>📞 {settings.phone}</span>}
                {settings.showEmail && <span>✉️ {settings.email}</span>}
              </div>
              {settings.showSocialLinks && (
                <div className="flex gap-2">
                  {settings.facebookUrl && <span>📘</span>}
                  {settings.instagramUrl && <span>📷</span>}
                  {settings.youtubeUrl && <span>📺</span>}
                  {settings.linkedinUrl && <span>💼</span>}
                </div>
              )}
            </div>
            <div className="bg-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-900 rounded flex items-center justify-center text-white font-bold">L</div>
                <span className="font-bold text-blue-900">LERA Academy</span>
              </div>
              <div className="flex items-center gap-6">
                {menuItems.filter(i => i.isActive).map(item => (
                  <span key={item.id} className="text-sm text-gray-700">{item.label}</span>
                ))}
              </div>
              <button className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-sm">
                {settings.ctaButtonText}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{isCreating ? "Add Menu Item" : "Edit Menu Item"}</h2>
                <button onClick={() => { setEditingItem(null); setIsCreating(false); }} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Label (English)</label>
                  <input
                    type="text"
                    value={editingItem.label}
                    onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Label (Vietnamese)</label>
                  <input
                    type="text"
                    value={editingItem.labelVi}
                    onChange={(e) => setEditingItem({ ...editingItem, labelVi: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Path</label>
                <input
                  type="text"
                  value={editingItem.href}
                  onChange={(e) => setEditingItem({ ...editingItem, href: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="/courses or https://..."
                />
                <p className="text-xs text-gray-500 mt-1">Use relative paths like /courses or full URLs</p>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingItem.isActive}
                    onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">Show in navigation</span>
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => { setEditingItem(null); setIsCreating(false); }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveMenuItem}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {isCreating ? "Add Item" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
