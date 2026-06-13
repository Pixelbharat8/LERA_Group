"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";

interface Achievement {
  id?: string;
  studentName: string;
  achievement: string;
  achievementVi: string;
  score?: string;
  exam?: string;
  centerName?: string;
  imageUrl?: string;
  year?: string;
  published: boolean;
}

export default function AchievementsEditor() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const data = await apiFetch("/api/cms-settings/map/achievements");
      const count = parseInt(data?.achievement_count) || 0;
      const items: Achievement[] = [];
      for (let i = 0; i < count; i++) {
        items.push({
          id: String(i),
          studentName: data[`ach_${i}_name`] || "",
          achievement: data[`ach_${i}_desc_en`] || "",
          achievementVi: data[`ach_${i}_desc_vi`] || "",
          score: data[`ach_${i}_score`] || "",
          exam: data[`ach_${i}_exam`] || "",
          centerName: data[`ach_${i}_center`] || "",
          imageUrl: data[`ach_${i}_image`] || "",
          year: data[`ach_${i}_year`] || new Date().getFullYear().toString(),
          published: data[`ach_${i}_published`] !== "false",
        });
      }
      setAchievements(items);
    } catch (error) {
      console.error("Error fetching achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveMessage("");
    try {
      const settings = achievements.flatMap((a, i) => [
        { settingKey: `ach_${i}_name`, settingValue: a.studentName, category: "achievements" },
        { settingKey: `ach_${i}_desc_en`, settingValue: a.achievement, category: "achievements" },
        { settingKey: `ach_${i}_desc_vi`, settingValue: a.achievementVi, category: "achievements" },
        { settingKey: `ach_${i}_score`, settingValue: a.score || "", category: "achievements" },
        { settingKey: `ach_${i}_exam`, settingValue: a.exam || "", category: "achievements" },
        { settingKey: `ach_${i}_center`, settingValue: a.centerName || "", category: "achievements" },
        { settingKey: `ach_${i}_image`, settingValue: a.imageUrl || "", category: "achievements" },
        { settingKey: `ach_${i}_year`, settingValue: a.year || "", category: "achievements" },
        { settingKey: `ach_${i}_published`, settingValue: String(a.published), category: "achievements" },
      ]);
      settings.push({ settingKey: "achievement_count", settingValue: String(achievements.length), category: "achievements" });
      
      await apiFetch("/api/cms-settings/batch", {
        method: "POST",
        body: JSON.stringify(settings),
      });
      setSaveMessage("✅ Achievements saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error("Error saving achievements:", error);
      setSaveMessage("❌ Error saving");
    }
  };

  const addAchievement = () => {
    setAchievements(prev => [...prev, {
      studentName: "",
      achievement: "",
      achievementVi: "",
      score: "",
      exam: "Cambridge",
      centerName: "",
      imageUrl: "",
      year: new Date().getFullYear().toString(),
      published: true,
    }]);
  };

  const updateAchievement = (index: number, field: keyof Achievement, value: any) => {
    setAchievements(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a));
  };

  const removeAchievement = (index: number) => {
    setAchievements(prev => prev.filter((_, i) => i !== index));
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
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/superadmin/public-website" className="hover:text-blue-600">Public Website</Link>
            <span>/</span>
            <span className="text-gray-900">Student Achievements</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">🏆 Student Achievements</h1>
          <p className="text-gray-500">Showcase outstanding students (like ILA's "GƯƠNG MẶT XUẤT SẮC")</p>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && <span className="text-sm font-medium">{saveMessage}</span>}
          <button onClick={addAchievement} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">+ Add Student</button>
          <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">💾 Save All</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        {achievements.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-4">🏆</div>
            <p className="text-lg">No student achievements yet</p>
            <p className="text-sm">Add your first outstanding student to showcase on the homepage</p>
          </div>
        ) : (
          achievements.map((a, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg border space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-700">🎓 Student #{index + 1}</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={a.published} onChange={(e) => updateAchievement(index, "published", e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm">Published</span>
                  </label>
                  <button onClick={() => removeAchievement(index)} className="text-red-600 hover:text-red-700 text-sm">🗑 Remove</button>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Student Name</label>
                  <input type="text" value={a.studentName} onChange={(e) => updateAchievement(index, "studentName", e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Score</label>
                  <input type="text" value={a.score} onChange={(e) => updateAchievement(index, "score", e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="15/15 Shields" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Exam / Certificate</label>
                  <input type="text" value={a.exam} onChange={(e) => updateAchievement(index, "exam", e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Cambridge Starters" />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Center Name</label>
                  <input type="text" value={a.centerName} onChange={(e) => updateAchievement(index, "centerName", e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="LERA Vinhomes Marina" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
                  <input type="text" value={a.year} onChange={(e) => updateAchievement(index, "year", e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="2024" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Photo URL</label>
                  <input type="text" value={a.imageUrl} onChange={(e) => updateAchievement(index, "imageUrl", e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://..." />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Achievement (EN)</label>
                  <textarea value={a.achievement} onChange={(e) => updateAchievement(index, "achievement", e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Achieved 15/15 shields in Cambridge Starters" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Achievement (VI)</label>
                  <textarea value={a.achievementVi} onChange={(e) => updateAchievement(index, "achievementVi", e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Đạt 15/15 khiên trong Cambridge Starters" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
