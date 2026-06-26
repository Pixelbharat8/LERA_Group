"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";

interface BrandingSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  logoUrl: string;
  faviconUrl: string;
  fontPrimary: string;
  fontSecondary: string;
  borderRadius: string;
  buttonStyle: "rounded" | "pill" | "square";
}

const initialSettings: BrandingSettings = {
  primaryColor: "#0a1a5c",
  secondaryColor: "#1e3a8a",
  accentColor: "#3b82f6",
  textColor: "#1f2937",
  backgroundColor: "#ffffff",
  logoUrl: "/logo.png",
  faviconUrl: "/favicon.ico",
  fontPrimary: "Inter",
  fontSecondary: "Inter",
  borderRadius: "8px",
  buttonStyle: "rounded",
};

const colorPresets = [
  { name: "LERA Navy", primary: "#0a1a5c", secondary: "#1e3a8a" },
  { name: "Ocean Blue", primary: "#0369a1", secondary: "#0ea5e9" },
  { name: "Forest Green", primary: "#166534", secondary: "#22c55e" },
  { name: "Royal Purple", primary: "#6b21a8", secondary: "#a855f7" },
  { name: "Crimson Red", primary: "#be123c", secondary: "#f43f5e" },
];

const fonts = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Poppins",
  "Montserrat",
  "Nunito",
  "Playfair Display",
];

export default function BrandingEditor() {
  const [settings, setSettings] = useState<BrandingSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBrandingSettings();
  }, []);

  const fetchBrandingSettings = async () => {
    try {
      const data = await apiFetch("/api/cms-settings/key/branding_settings").catch(() => ({}));
      if (data?.settingValue) {
        // Merge over defaults so a partial/older saved blob can't drop required keys and crash render.
        setSettings({ ...initialSettings, ...JSON.parse(data.settingValue) });
      }
    } catch (err) {
      console.log("No existing branding settings, using defaults");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await apiFetch("/api/cms-settings/key/branding_settings", {
        method: "PUT",
        body: JSON.stringify({ value: JSON.stringify(settings), category: "branding" })
      });
      alert("✅ Branding settings saved successfully!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const ColorInput = ({ label, value, field }: { label: string; value: string; field: keyof BrandingSettings }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex gap-2">
        <input 
          type="color" 
          value={value}
          onChange={(e) => setSettings({ ...settings, [field]: e.target.value })}
          className="w-12 h-12 rounded cursor-pointer border"
        />
        <input 
          type="text" 
          value={value}
          onChange={(e) => setSettings({ ...settings, [field]: e.target.value })}
          className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase"
        />
      </div>
    </div>
  );

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
            <span className="text-gray-900">Branding</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">🎨 Branding & Colors</h1>
          <p className="text-gray-500">Customize your brand identity across the website</p>
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
        {/* Settings Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Color Presets */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">🎯 Quick Color Presets</h2>
            <div className="flex flex-wrap gap-3">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setSettings({ ...settings, primaryColor: preset.primary, secondaryColor: preset.secondary })}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    settings.primaryColor === preset.primary ? "border-blue-500 shadow-md" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.primary }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.secondary }}></div>
                    <span className="text-sm font-medium">{preset.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">🌈 Brand Colors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ColorInput label="Primary Color" value={settings.primaryColor} field="primaryColor" />
              <ColorInput label="Secondary Color" value={settings.secondaryColor} field="secondaryColor" />
              <ColorInput label="Accent Color" value={settings.accentColor} field="accentColor" />
              <ColorInput label="Text Color" value={settings.textColor} field="textColor" />
              <ColorInput label="Background Color" value={settings.backgroundColor} field="backgroundColor" />
            </div>
          </div>

          {/* Typography */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">🔤 Typography</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Font (Headings)</label>
                <select 
                  value={settings.fontPrimary}
                  onChange={(e) => setSettings({ ...settings, fontPrimary: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {fonts.map(font => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Font (Body)</label>
                <select 
                  value={settings.fontSecondary}
                  onChange={(e) => setSettings({ ...settings, fontSecondary: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {fonts.map(font => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p style={{ fontFamily: settings.fontPrimary }} className="text-2xl font-bold mb-2">
                Heading Preview Text
              </p>
              <p style={{ fontFamily: settings.fontSecondary }} className="text-gray-600">
                This is body text preview. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>
            </div>
          </div>

          {/* Button Style */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">🔘 Button Style</h2>
            <div className="flex gap-4">
              {(["rounded", "pill", "square"] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setSettings({ ...settings, buttonStyle: style })}
                  className={`flex-1 py-4 border-2 transition-all ${
                    settings.buttonStyle === style ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={{ borderRadius: style === "rounded" ? "8px" : style === "pill" ? "999px" : "0" }}
                >
                  <div 
                    className="mx-auto w-32 py-2 text-center text-white text-sm font-medium"
                    style={{ 
                      backgroundColor: settings.primaryColor,
                      borderRadius: style === "rounded" ? "8px" : style === "pill" ? "999px" : "0"
                    }}
                  >
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Logo & Favicon */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📷 Logo & Favicon</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                  <div className="w-16 h-16 mx-auto bg-[#0a1a5c] rounded-lg flex items-center justify-center text-white text-2xl font-bold mb-4">
                    L
                  </div>
                  <p className="text-sm text-gray-500">Click to upload logo</p>
                  <p className="text-xs text-gray-400">Recommended: 200x60px, PNG or SVG</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Favicon</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                  <div className="w-16 h-16 mx-auto bg-[#0a1a5c] rounded-lg flex items-center justify-center text-white text-xl font-bold mb-4">
                    L
                  </div>
                  <p className="text-sm text-gray-500">Click to upload favicon</p>
                  <p className="text-xs text-gray-400">Recommended: 32x32px, PNG or ICO</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">👁 Live Preview</h2>
            
            {/* Header Preview */}
            <div className="border rounded-lg overflow-hidden mb-4">
              <div className="p-4" style={{ backgroundColor: settings.primaryColor }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-xs font-bold" style={{ color: settings.primaryColor }}>L</div>
                    <span className="text-white font-bold text-sm" style={{ fontFamily: settings.fontPrimary }}>LERA Academy</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-12 h-2 bg-white/30 rounded"></div>
                    <div className="w-12 h-2 bg-white/30 rounded"></div>
                    <div className="w-12 h-2 bg-white/30 rounded"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Preview */}
            <div className="border rounded-lg overflow-hidden mb-4" style={{ backgroundColor: settings.backgroundColor }}>
              <div className="p-4">
                <h3 className="text-lg font-bold mb-2" style={{ color: settings.primaryColor, fontFamily: settings.fontPrimary }}>
                  Welcome to LERA
                </h3>
                <p className="text-sm mb-4" style={{ color: settings.textColor, fontFamily: settings.fontSecondary }}>
                  Learn English with Cambridge methodology
                </p>
                <div className="flex gap-2">
                  <button 
                    className="px-4 py-2 text-white text-xs font-medium"
                    style={{ 
                      backgroundColor: settings.primaryColor,
                      borderRadius: settings.buttonStyle === "rounded" ? "6px" : settings.buttonStyle === "pill" ? "999px" : "0"
                    }}
                  >
                    Get Started
                  </button>
                  <button 
                    className="px-4 py-2 text-xs font-medium border"
                    style={{ 
                      color: settings.secondaryColor,
                      borderColor: settings.secondaryColor,
                      borderRadius: settings.buttonStyle === "rounded" ? "6px" : settings.buttonStyle === "pill" ? "999px" : "0"
                    }}
                  >
                    Learn More
                  </button>
                </div>
              </div>
            </div>

            {/* Card Preview */}
            <div className="border rounded-lg overflow-hidden" style={{ borderRadius: settings.borderRadius }}>
              <div className="h-20" style={{ backgroundColor: settings.accentColor }}></div>
              <div className="p-4" style={{ backgroundColor: settings.backgroundColor }}>
                <h4 className="font-bold mb-1" style={{ color: settings.textColor, fontFamily: settings.fontPrimary }}>Course Card</h4>
                <p className="text-xs" style={{ color: settings.textColor + "99", fontFamily: settings.fontSecondary }}>Preview of card style</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <button 
                onClick={() => setSettings(initialSettings)}
                className="w-full py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                ↩️ Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
