"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";

interface AboutSettings {
  about_title_en: string;
  about_title_vi: string;
  about_subtitle_en: string;
  about_subtitle_vi: string;
  about_description_en: string;
  about_description_vi: string;
  about_mission_en: string;
  about_mission_vi: string;
  about_vision_en: string;
  about_vision_vi: string;
  about_history_en: string;
  about_history_vi: string;
  about_values_en: string;
  about_values_vi: string;
  about_hero_image: string;
  about_team_image: string;
  years_experience: string;
  students_count: string;
  teachers_count: string;
  centers_count: string;
}

interface TeamMember {
  id: string;
  name: string;
  nameVi?: string;
  role: string;
  roleVi?: string;
  bio: string;
  bioVi?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
}

export default function AboutPageEditor() {
  const [activeTab, setActiveTab] = useState<"content" | "stats" | "team" | "preview">("content");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [settings, setSettings] = useState<AboutSettings>({
    about_title_en: "About LERA Academy",
    about_title_vi: "Về LERA Academy",
    about_subtitle_en: "Nurturing Tomorrow's Leaders",
    about_subtitle_vi: "Nuôi Dưỡng Thế Hệ Lãnh Đạo Tương Lai",
    about_description_en: "LERA Academy is a leading English education center committed to providing world-class language learning experiences for students of all ages.",
    about_description_vi: "LERA Academy là trung tâm giáo dục Anh ngữ hàng đầu, cam kết mang đến trải nghiệm học ngôn ngữ đẳng cấp quốc tế cho học viên mọi lứa tuổi.",
    about_mission_en: "To empower students with English language skills that open doors to global opportunities.",
    about_mission_vi: "Trang bị cho học viên kỹ năng tiếng Anh, mở ra cánh cửa cơ hội toàn cầu.",
    about_vision_en: "To be Vietnam's most trusted English education partner, producing confident communicators and future leaders.",
    about_vision_vi: "Trở thành đối tác giáo dục Anh ngữ đáng tin cậy nhất Việt Nam, đào tạo những người giao tiếp tự tin và lãnh đạo tương lai.",
    about_history_en: "Founded in 2018, LERA Academy started with a small classroom and a big dream. Today, we serve thousands of students across multiple centers.",
    about_history_vi: "Thành lập năm 2018, LERA Academy bắt đầu với một phòng học nhỏ và giấc mơ lớn. Ngày nay, chúng tôi phục vụ hàng nghìn học viên tại nhiều trung tâm.",
    about_values_en: "Excellence, Innovation, Care, Integrity",
    about_values_vi: "Xuất sắc, Đổi mới, Tận tâm, Chính trực",
    about_hero_image: "",
    about_team_image: "",
    years_experience: "7+",
    students_count: "5000+",
    teachers_count: "50+",
    centers_count: "3",
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState<Partial<TeamMember>>({
    name: "",
    role: "",
    bio: "",
    imageUrl: "",
    isActive: true,
  });

  useEffect(() => {
    fetchSettings();
    fetchTeamMembers();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await apiFetch("/api/cms-settings/map/about");
      if (data && Object.keys(data).length > 0) {
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.log("Using default about settings");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const data = await apiFetch("/api/team-members");
      if (Array.isArray(data)) {
        setTeamMembers(data);
      }
    } catch (err) {
      console.log("No team members found");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const settingsToSave = Object.entries(settings).map(([key, value]) => ({
        settingKey: key,
        settingValue: value || "",
        category: "about",
      }));

      await apiFetch("/api/cms-settings/batch", {
        method: "POST",
        body: JSON.stringify(settingsToSave),
      });

      setMessage("✅ About page saved successfully!");
    } catch (err: any) {
      setMessage("❌ Error saving: " + err.message);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleAddMember = async () => {
    try {
      const member = await apiFetch("/api/team-members", {
        method: "POST",
        body: JSON.stringify({
          ...newMember,
          displayOrder: teamMembers.length + 1,
        }),
      });
      setTeamMembers([...teamMembers, member]);
      setNewMember({ name: "", role: "", bio: "", imageUrl: "", isActive: true });
      setShowAddMember(false);
      setMessage("✅ Team member added!");
    } catch (err: any) {
      setMessage("❌ Error: " + err.message);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm("Delete this team member?")) return;
    try {
      await apiFetch(`/api/team-members/${id}`, { method: "DELETE" });
      setTeamMembers(teamMembers.filter(m => m.id !== id));
      setMessage("✅ Team member deleted!");
    } catch (err: any) {
      setMessage("❌ Error: " + err.message);
    }
  };

  const updateSetting = (key: keyof AboutSettings, value: string) => {
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
            <span className="text-gray-900">About Page</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">ℹ️ About Page Editor</h1>
          <p className="text-gray-500">Edit the About Us page content, mission, vision, and team</p>
        </div>
        <div className="flex items-center gap-3">
          {message && <span className={message.includes("✅") ? "text-green-600" : "text-red-600"}>{message}</span>}
          <Link href="/about" target="_blank" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
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
              { id: "content", label: "📝 Content" },
              { id: "stats", label: "📊 Statistics" },
              { id: "team", label: "👥 Team" },
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
          {/* Content Tab */}
          {activeTab === "content" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title (English)</label>
                  <input
                    type="text"
                    value={settings.about_title_en}
                    onChange={(e) => updateSetting("about_title_en", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title (Vietnamese)</label>
                  <input
                    type="text"
                    value={settings.about_title_vi}
                    onChange={(e) => updateSetting("about_title_vi", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle (English)</label>
                  <input
                    type="text"
                    value={settings.about_subtitle_en}
                    onChange={(e) => updateSetting("about_subtitle_en", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle (Vietnamese)</label>
                  <input
                    type="text"
                    value={settings.about_subtitle_vi}
                    onChange={(e) => updateSetting("about_subtitle_vi", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (English)</label>
                <textarea
                  value={settings.about_description_en}
                  onChange={(e) => updateSetting("about_description_en", e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Vietnamese)</label>
                <textarea
                  value={settings.about_description_vi}
                  onChange={(e) => updateSetting("about_description_vi", e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🎯 Mission (English)</label>
                  <textarea
                    value={settings.about_mission_en}
                    onChange={(e) => updateSetting("about_mission_en", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🎯 Mission (Vietnamese)</label>
                  <textarea
                    value={settings.about_mission_vi}
                    onChange={(e) => updateSetting("about_mission_vi", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🔭 Vision (English)</label>
                  <textarea
                    value={settings.about_vision_en}
                    onChange={(e) => updateSetting("about_vision_en", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🔭 Vision (Vietnamese)</label>
                  <textarea
                    value={settings.about_vision_vi}
                    onChange={(e) => updateSetting("about_vision_vi", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">💎 Core Values (English, comma-separated)</label>
                <input
                  type="text"
                  value={settings.about_values_en}
                  onChange={(e) => updateSetting("about_values_en", e.target.value)}
                  placeholder="Excellence, Innovation, Care, Integrity"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">💎 Core Values (Vietnamese, comma-separated)</label>
                <input
                  type="text"
                  value={settings.about_values_vi}
                  onChange={(e) => updateSetting("about_values_vi", e.target.value)}
                  placeholder="Xuất sắc, Đổi mới, Tận tâm, Chính trực"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">📜 History (English)</label>
                <textarea
                  value={settings.about_history_en}
                  onChange={(e) => updateSetting("about_history_en", e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">📜 History (Vietnamese)</label>
                <textarea
                  value={settings.about_history_vi}
                  onChange={(e) => updateSetting("about_history_vi", e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === "stats" && (
            <div className="space-y-6">
              <p className="text-gray-600">These statistics are displayed on the About page and Home page.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-blue-700 mb-2">🗓️ Years Experience</label>
                  <input
                    type="text"
                    value={settings.years_experience}
                    onChange={(e) => updateSetting("years_experience", e.target.value)}
                    className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-green-700 mb-2">👨‍🎓 Students Count</label>
                  <input
                    type="text"
                    value={settings.students_count}
                    onChange={(e) => updateSetting("students_count", e.target.value)}
                    className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-purple-700 mb-2">👨‍🏫 Teachers Count</label>
                  <input
                    type="text"
                    value={settings.teachers_count}
                    onChange={(e) => updateSetting("teachers_count", e.target.value)}
                    className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-orange-700 mb-2">🏢 Centers Count</label>
                  <input
                    type="text"
                    value={settings.centers_count}
                    onChange={(e) => updateSetting("centers_count", e.target.value)}
                    className="w-full px-4 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Team Tab */}
          {activeTab === "team" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Leadership Team</h3>
                <button
                  onClick={() => setShowAddMember(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  ➕ Add Member
                </button>
              </div>

              {showAddMember && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <input
                        type="text"
                        value={newMember.name || ""}
                        onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Role/Position</label>
                      <input
                        type="text"
                        value={newMember.role || ""}
                        onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Bio</label>
                      <textarea
                        value={newMember.bio || ""}
                        onChange={(e) => setNewMember({ ...newMember, bio: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Photo URL</label>
                      <input
                        type="url"
                        value={newMember.imageUrl || ""}
                        onChange={(e) => setNewMember({ ...newMember, imageUrl: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddMember} className="px-4 py-2 bg-green-600 text-white rounded-lg">
                      ✓ Add Member
                    </button>
                    <button onClick={() => setShowAddMember(false)} className="px-4 py-2 bg-gray-200 rounded-lg">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamMembers.length === 0 ? (
                  <p className="text-gray-500 col-span-full text-center py-8">No team members yet.</p>
                ) : (
                  teamMembers.map((member) => (
                    <div key={member.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-2xl">
                          {member.imageUrl ? (
                            <img src={member.imageUrl} alt={member.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            "👤"
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold">{member.name}</h4>
                          <p className="text-sm text-blue-600">{member.role}</p>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{member.bio}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          🗑️
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
              <div className="bg-white rounded-xl shadow-lg p-8 max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{settings.about_title_en}</h1>
                <p className="text-xl text-blue-600 mb-6">{settings.about_subtitle_en}</p>
                <p className="text-gray-700 mb-8">{settings.about_description_en}</p>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-bold text-blue-900 mb-2">🎯 Mission</h3>
                    <p className="text-sm text-gray-700">{settings.about_mission_en}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-bold text-green-900 mb-2">🔭 Vision</h3>
                    <p className="text-sm text-gray-700">{settings.about_vision_en}</p>
                  </div>
                </div>

                <div className="flex justify-center gap-8 py-6 border-t border-b">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{settings.years_experience}</div>
                    <div className="text-sm text-gray-500">Years</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{settings.students_count}</div>
                    <div className="text-sm text-gray-500">Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{settings.teachers_count}</div>
                    <div className="text-sm text-gray-500">Teachers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">{settings.centers_count}</div>
                    <div className="text-sm text-gray-500">Centers</div>
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
