"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: "LERA Academy",
    siteUrl: "https://lera.edu.vn",
    supportEmail: "support@lera.edu.vn",
    phone: "0225 123 4567",
    address: "95 Hải Đăng, khu đô thị Vinhomes Marina, phường An Biên, Hải Phòng",
    timezone: "Asia/Ho_Chi_Minh",
    currency: "VND",
    dateFormat: "DD/MM/YYYY",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await apiFetch("/api/system-settings/map").catch(() => ({}));
      setSettings(prev => ({
        siteName: data.site_name || prev.siteName,
        siteUrl: data.site_url || prev.siteUrl,
        supportEmail: data.support_email || prev.supportEmail,
        phone: data.phone || prev.phone,
        address: data.address || prev.address,
        timezone: data.timezone || prev.timezone,
        currency: data.currency || prev.currency,
        dateFormat: data.date_format || prev.dateFormat,
      }));
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsList = [
        { settingKey: "site_name", settingValue: settings.siteName, category: "general" },
        { settingKey: "site_url", settingValue: settings.siteUrl, category: "general" },
        { settingKey: "support_email", settingValue: settings.supportEmail, category: "contact" },
        { settingKey: "phone", settingValue: settings.phone, category: "contact" },
        { settingKey: "address", settingValue: settings.address, category: "contact" },
        { settingKey: "timezone", settingValue: settings.timezone, category: "regional" },
        { settingKey: "currency", settingValue: settings.currency, category: "regional" },
        { settingKey: "date_format", settingValue: settings.dateFormat, category: "regional" },
      ];
      
      await apiFetch("/api/system-settings/bulk", {
        method: "POST",
        body: JSON.stringify(settingsList)
      });
      alert("Settings saved successfully!");
    } catch (err) {
      console.error("Error saving settings:", err);
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/superadmin" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">Settings</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">⚙️ Global Settings</h1>
          <p className="text-gray-500">Configure system-wide settings</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? "💾 Saving..." : "💾 Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">General</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site URL</label>
              <input
                type="url"
                value={settings.siteUrl}
                onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Contact Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Contact</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Regional Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Regional</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Asia/Ho_Chi_Minh">Asia/Ho Chi Minh (GMT+7)</option>
                <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
                <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="VND">VND - Vietnamese Dong</option>
                <option value="USD">USD - US Dollar</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
              <select
                value={settings.dateFormat}
                onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Database Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">System Info</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Database</span>
              <span className="font-mono text-gray-900">PostgreSQL 15</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Backend</span>
              <span className="font-mono text-gray-900">Spring Boot 3.2.1</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Frontend</span>
              <span className="font-mono text-gray-900">Next.js 14.1.0</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Java</span>
              <span className="font-mono text-gray-900">OpenJDK 17</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Services</span>
              <span className="font-mono text-green-600">8 running</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
