"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { apiFetch } from "../../../lib/api";
import { useLanguage } from "../../context/LanguageContext";

interface UserSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  language: string;
  timezone: string;
  twoFactorAuth: boolean;
}

export default function SettingsPage() {
  const { language: currentLang, setLanguage } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("notifications");
  const [settings, setSettings] = useState<UserSettings>({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    marketingEmails: false,
    language: currentLang,
    timezone: "Asia/Ho_Chi_Minh",
    twoFactorAuth: false,
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const isVietnamese = currentLang === "VI";

  const t = {
    title: isVietnamese ? "Cài Đặt" : "Settings",
    notifications: isVietnamese ? "Thông Báo" : "Notifications",
    security: isVietnamese ? "Bảo Mật" : "Security",
    preferences: isVietnamese ? "Tùy Chọn" : "Preferences",
    emailNotifications: isVietnamese ? "Thông báo qua Email" : "Email Notifications",
    emailNotificationsDesc: isVietnamese 
      ? "Nhận thông báo về lớp học, điểm số và tin tức qua email" 
      : "Receive notifications about classes, grades, and news via email",
    smsNotifications: isVietnamese ? "Thông báo SMS" : "SMS Notifications",
    smsNotificationsDesc: isVietnamese 
      ? "Nhận tin nhắn SMS quan trọng" 
      : "Receive important SMS messages",
    pushNotifications: isVietnamese ? "Thông báo đẩy" : "Push Notifications",
    pushNotificationsDesc: isVietnamese 
      ? "Nhận thông báo trực tiếp trên trình duyệt" 
      : "Receive notifications directly in your browser",
    marketingEmails: isVietnamese ? "Email marketing" : "Marketing Emails",
    marketingEmailsDesc: isVietnamese 
      ? "Nhận thông tin về khuyến mãi và khóa học mới" 
      : "Receive information about promotions and new courses",
    changePassword: isVietnamese ? "Đổi Mật Khẩu" : "Change Password",
    currentPassword: isVietnamese ? "Mật khẩu hiện tại" : "Current Password",
    newPassword: isVietnamese ? "Mật khẩu mới" : "New Password",
    confirmPassword: isVietnamese ? "Xác nhận mật khẩu mới" : "Confirm New Password",
    twoFactorAuth: isVietnamese ? "Xác thực 2 bước" : "Two-Factor Authentication",
    twoFactorAuthDesc: isVietnamese 
      ? "Thêm lớp bảo mật cho tài khoản của bạn" 
      : "Add an extra layer of security to your account",
    language: isVietnamese ? "Ngôn ngữ" : "Language",
    timezone: isVietnamese ? "Múi giờ" : "Timezone",
    saveChanges: isVietnamese ? "Lưu Thay Đổi" : "Save Changes",
    saving: isVietnamese ? "Đang lưu..." : "Saving...",
    updatePassword: isVietnamese ? "Cập Nhật Mật Khẩu" : "Update Password",
    passwordUpdated: isVietnamese ? "Mật khẩu đã được cập nhật!" : "Password updated successfully!",
    passwordMismatch: isVietnamese ? "Mật khẩu không khớp" : "Passwords do not match",
    passwordTooShort: isVietnamese ? "Mật khẩu phải có ít nhất 8 ký tự" : "Password must be at least 8 characters",
    settingsSaved: isVietnamese ? "Cài đặt đã được lưu!" : "Settings saved successfully!",
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await apiFetch("/api/users/me/settings");
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.log("Using default settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await apiFetch("/api/users/me/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      alert(t.settingsSaved);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (passwordData.newPassword.length < 8) {
      setPasswordError(t.passwordTooShort);
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError(t.passwordMismatch);
      return;
    }

    setSaving(true);
    try {
      await apiFetch("/api/users/me/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      setPasswordSuccess(true);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      setPasswordError("Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageChange = (lang: string) => {
    setSettings({ ...settings, language: lang });
    setLanguage(lang as "EN" | "VI");
  };

  const tabs = [
    { id: "notifications", label: t.notifications, icon: "🔔" },
    { id: "security", label: t.security, icon: "🔐" },
    { id: "preferences", label: t.preferences, icon: "⚙️" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <nav className="text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{t.title}</span>
        </nav>
        <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">{t.notifications}</h2>
              
              {[
                { key: "emailNotifications", label: t.emailNotifications, desc: t.emailNotificationsDesc },
                { key: "smsNotifications", label: t.smsNotifications, desc: t.smsNotificationsDesc },
                { key: "pushNotifications", label: t.pushNotifications, desc: t.pushNotificationsDesc },
                { key: "marketingEmails", label: t.marketingEmails, desc: t.marketingEmailsDesc },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                  <div>
                    <h3 className="font-medium text-gray-900">{item.label}</h3>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[item.key as keyof UserSettings] as boolean}
                      onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
              ))}

              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? t.saving : t.saveChanges}
              </button>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-6">
              {/* Change Password */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">{t.changePassword}</h2>
                
                {passwordError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {passwordError}
                  </div>
                )}
                
                {passwordSuccess && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                    {t.passwordUpdated}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.currentPassword}</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.newPassword}</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.confirmPassword}</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? t.saving : t.updatePassword}
                  </button>
                </form>
              </div>

              {/* Two-Factor Auth */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{t.twoFactorAuth}</h3>
                    <p className="text-sm text-gray-500">{t.twoFactorAuthDesc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.twoFactorAuth}
                      onChange={(e) => setSettings({ ...settings, twoFactorAuth: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === "preferences" && (
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">{t.preferences}</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.language}</label>
                <select
                  value={settings.language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EN">English</option>
                  <option value="VI">Tiếng Việt</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.timezone}</label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Asia/Ho_Chi_Minh">Vietnam (GMT+7)</option>
                  <option value="Asia/Singapore">Singapore (GMT+8)</option>
                  <option value="Asia/Bangkok">Thailand (GMT+7)</option>
                  <option value="America/New_York">New York (GMT-5)</option>
                  <option value="Europe/London">London (GMT+0)</option>
                </select>
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? t.saving : t.saveChanges}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
