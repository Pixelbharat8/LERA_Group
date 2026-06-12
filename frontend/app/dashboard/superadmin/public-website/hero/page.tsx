"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";
import { uploadFile, uploadPublicPath } from "../../../../../lib/upload-file";

// Reusable Image Upload Component
const ImageUploadField = ({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const data = await uploadFile(file);
      const path = uploadPublicPath(data);
      if (path) {
        onChange(path);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          onChange(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-1 flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          {uploading ? "⏳" : "📤"} Upload
        </button>
      </div>
      {value && (
        <div className="mt-2">
          <img 
            src={value} 
            alt="Preview" 
            className="h-20 w-auto rounded border object-cover"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        </div>
      )}
    </div>
  );
};

export default function HeroEditorPage() {
  const [heroData, setHeroData] = useState({
    hero_title: "LERA Academy",
    hero_subtitle: "Nurturing Tomorrow's Leaders",
    hero_cta_text: "Enroll Now",
    hero_cta_link: "/contact",
    hero_background_image: "/images/hero-bg.jpg"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHeroSettings();
  }, []);

  const fetchHeroSettings = async () => {
    try {
      const data = await apiFetch("/api/cms-settings/map/hero").catch(() => ({}));
      if (Object.keys(data).length > 0) {
        setHeroData(prev => ({
          ...prev,
          ...data
        }));
      }
    } catch (err) {
      console.log("No existing hero settings found, using defaults");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const settingsToSave = Object.entries(heroData).map(([key, value]) => ({
        settingKey: key,
        settingValue: value,
        category: "hero"
      }));

      await apiFetch("/api/cms-settings/batch", {
        method: "POST",
        body: JSON.stringify(settingsToSave)
      });

      alert("✅ Hero section saved successfully!");
    } catch (err: any) {
      setError(err.message);
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
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/superadmin" className="hover:text-blue-600">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-900">Public Website - Hero Editor</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">🖼️ Hero Section Editor</h1>
        <p className="text-gray-500">Customize the hero section of your public website</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Edit Content</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={heroData.hero_title}
                onChange={(e) => setHeroData({...heroData, hero_title: e.target.value})}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Subtitle</label>
              <input
                type="text"
                value={heroData.hero_subtitle}
                onChange={(e) => setHeroData({...heroData, hero_subtitle: e.target.value})}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">CTA Button Text</label>
              <input
                type="text"
                value={heroData.hero_cta_text}
                onChange={(e) => setHeroData({...heroData, hero_cta_text: e.target.value})}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">CTA Link</label>
              <input
                type="text"
                value={heroData.hero_cta_link}
                onChange={(e) => setHeroData({...heroData, hero_cta_link: e.target.value})}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
            <ImageUploadField
              label="Background Image"
              value={heroData.hero_background_image}
              onChange={(url) => setHeroData({...heroData, hero_background_image: url})}
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "💾 Save Changes"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Preview</h2>
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-lg p-8 text-white text-center">
            <h1 className="text-3xl font-bold mb-2">{heroData.hero_title}</h1>
            <p className="text-xl mb-6 text-blue-200">{heroData.hero_subtitle}</p>
            <button className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-bold">
              {heroData.hero_cta_text}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
