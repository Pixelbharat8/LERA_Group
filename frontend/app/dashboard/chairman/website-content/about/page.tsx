"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../../../../lib/api";
import Link from "next/link";

export default function AboutContentPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"EN" | "VI">("EN");
  
  // Hero Section - using keys that match public page
  const [heroTitleEN, setHeroTitleEN] = useState("About LERA Academy");
  const [heroTitleVI, setHeroTitleVI] = useState("Về LERA Academy");
  const [heroDescEN, setHeroDescEN] = useState("Empowering learners with English skills for global success");
  const [heroDescVI, setHeroDescVI] = useState("Trao quyền cho người học với kỹ năng tiếng Anh để thành công toàn cầu");

  // Story Section
  const [storyTitleEN, setStoryTitleEN] = useState("Our Story");
  const [storyTitleVI, setStoryTitleVI] = useState("Câu chuyện của chúng tôi");
  const [storyDescEN, setStoryDescEN] = useState("Founded in 2020, LERA Academy has been dedicated to providing high-quality English education.");
  const [storyDescVI, setStoryDescVI] = useState("Được thành lập năm 2020, LERA Academy đã cống hiến cho việc cung cấp giáo dục tiếng Anh chất lượng cao.");

  // Mission Section
  const [missionTitleEN, setMissionTitleEN] = useState("Our Mission");
  const [missionTitleVI, setMissionTitleVI] = useState("Sứ mệnh của chúng tôi");
  const [missionDescEN, setMissionDescEN] = useState("To make English learning accessible, engaging, and effective for learners of all ages.");
  const [missionDescVI, setMissionDescVI] = useState("Làm cho việc học tiếng Anh trở nên dễ tiếp cận, hấp dẫn và hiệu quả cho người học ở mọi lứa tuổi.");

  // Vision Section
  const [visionTitleEN, setVisionTitleEN] = useState("Our Vision");
  const [visionTitleVI, setVisionTitleVI] = useState("Tầm nhìn của chúng tôi");
  const [visionDescEN, setVisionDescEN] = useState("To become the leading English education center in Vietnam.");
  const [visionDescVI, setVisionDescVI] = useState("Trở thành trung tâm giáo dục tiếng Anh hàng đầu Việt Nam.");

  // Stats
  const [statsStudents, setStatsStudents] = useState("10,000+");
  const [statsTeachers, setStatsTeachers] = useState("50+");
  const [statsCenters, setStatsCenters] = useState("5");
  const [statsSatisfaction, setStatsSatisfaction] = useState("98%");

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const data = await apiFetch("/api/cms-settings/map/about").catch(() => ({}));
      if (data && Object.keys(data).length > 0) {
        if (data.about_hero_title_en) setHeroTitleEN(data.about_hero_title_en);
        if (data.about_hero_title_vi) setHeroTitleVI(data.about_hero_title_vi);
        if (data.about_hero_desc_en) setHeroDescEN(data.about_hero_desc_en);
        if (data.about_hero_desc_vi) setHeroDescVI(data.about_hero_desc_vi);
        if (data.about_story_title_en) setStoryTitleEN(data.about_story_title_en);
        if (data.about_story_title_vi) setStoryTitleVI(data.about_story_title_vi);
        if (data.about_story_desc_en) setStoryDescEN(data.about_story_desc_en);
        if (data.about_story_desc_vi) setStoryDescVI(data.about_story_desc_vi);
        if (data.about_mission_title_en) setMissionTitleEN(data.about_mission_title_en);
        if (data.about_mission_title_vi) setMissionTitleVI(data.about_mission_title_vi);
        if (data.about_mission_desc_en) setMissionDescEN(data.about_mission_desc_en);
        if (data.about_mission_desc_vi) setMissionDescVI(data.about_mission_desc_vi);
        if (data.about_vision_title_en) setVisionTitleEN(data.about_vision_title_en);
        if (data.about_vision_title_vi) setVisionTitleVI(data.about_vision_title_vi);
        if (data.about_vision_desc_en) setVisionDescEN(data.about_vision_desc_en);
        if (data.about_vision_desc_vi) setVisionDescVI(data.about_vision_desc_vi);
        if (data.stats_students) setStatsStudents(data.stats_students);
        if (data.stats_teachers) setStatsTeachers(data.stats_teachers);
        if (data.stats_centers) setStatsCenters(data.stats_centers);
        if (data.stats_satisfaction) setStatsSatisfaction(data.stats_satisfaction);
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
        { settingKey: "about_hero_title_en", settingValue: heroTitleEN, category: "about" },
        { settingKey: "about_hero_title_vi", settingValue: heroTitleVI, category: "about" },
        { settingKey: "about_hero_desc_en", settingValue: heroDescEN, category: "about" },
        { settingKey: "about_hero_desc_vi", settingValue: heroDescVI, category: "about" },
        { settingKey: "about_story_title_en", settingValue: storyTitleEN, category: "about" },
        { settingKey: "about_story_title_vi", settingValue: storyTitleVI, category: "about" },
        { settingKey: "about_story_desc_en", settingValue: storyDescEN, category: "about" },
        { settingKey: "about_story_desc_vi", settingValue: storyDescVI, category: "about" },
        { settingKey: "about_mission_title_en", settingValue: missionTitleEN, category: "about" },
        { settingKey: "about_mission_title_vi", settingValue: missionTitleVI, category: "about" },
        { settingKey: "about_mission_desc_en", settingValue: missionDescEN, category: "about" },
        { settingKey: "about_mission_desc_vi", settingValue: missionDescVI, category: "about" },
        { settingKey: "about_vision_title_en", settingValue: visionTitleEN, category: "about" },
        { settingKey: "about_vision_title_vi", settingValue: visionTitleVI, category: "about" },
        { settingKey: "about_vision_desc_en", settingValue: visionDescEN, category: "about" },
        { settingKey: "about_vision_desc_vi", settingValue: visionDescVI, category: "about" },
        { settingKey: "stats_students", settingValue: statsStudents, category: "about" },
        { settingKey: "stats_teachers", settingValue: statsTeachers, category: "about" },
        { settingKey: "stats_centers", settingValue: statsCenters, category: "about" },
        { settingKey: "stats_satisfaction", settingValue: statsSatisfaction, category: "about" }
      ];

      await apiFetch("/api/cms-settings/batch", {
        method: "POST",
        body: JSON.stringify(settings)
      });

      alert("About page saved successfully!");
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
                <h1 className="text-xl font-bold text-gray-900">About Page</h1>
                <p className="text-sm text-gray-500">Edit about us content</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a href="/about" target="_blank" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={activeTab === "EN" ? heroDescEN : heroDescVI}
                onChange={(e) => activeTab === "EN" ? setHeroDescEN(e.target.value) : setHeroDescVI(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Statistics Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📊 Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Students</label>
              <input type="text" value={statsStudents} onChange={(e) => setStatsStudents(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teachers</label>
              <input type="text" value={statsTeachers} onChange={(e) => setStatsTeachers(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Centers</label>
              <input type="text" value={statsCenters} onChange={(e) => setStatsCenters(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Satisfaction</label>
              <input type="text" value={statsSatisfaction} onChange={(e) => setStatsSatisfaction(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Story Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📖 Our Story</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={activeTab === "EN" ? storyTitleEN : storyTitleVI}
                onChange={(e) => activeTab === "EN" ? setStoryTitleEN(e.target.value) : setStoryTitleVI(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                value={activeTab === "EN" ? storyDescEN : storyDescVI}
                onChange={(e) => activeTab === "EN" ? setStoryDescEN(e.target.value) : setStoryDescVI(e.target.value)}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">🎯 Mission</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={activeTab === "EN" ? missionTitleEN : missionTitleVI}
                  onChange={(e) => activeTab === "EN" ? setMissionTitleEN(e.target.value) : setMissionTitleVI(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  value={activeTab === "EN" ? missionDescEN : missionDescVI}
                  onChange={(e) => activeTab === "EN" ? setMissionDescEN(e.target.value) : setMissionDescVI(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">🔭 Vision</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={activeTab === "EN" ? visionTitleEN : visionTitleVI}
                  onChange={(e) => activeTab === "EN" ? setVisionTitleEN(e.target.value) : setVisionTitleVI(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  value={activeTab === "EN" ? visionDescEN : visionDescVI}
                  onChange={(e) => activeTab === "EN" ? setVisionDescEN(e.target.value) : setVisionDescVI(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
