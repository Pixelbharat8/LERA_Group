"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch, apiUrl } from "../../../../../lib/api";
import { uploadFile, uploadPublicPath } from "../../../../../lib/upload-file";

const GALLERY_IMAGES = [
  { path: '/images/gallery/lera-hero.jpg', name: 'LERA Hero' },
  { path: '/images/gallery/lera-classroom.jpg', name: 'LERA Classroom' },
];

const SETTING_CATEGORIES = [
  {
    title: 'Hero Section',
    titleVi: 'Phần Hero',
    icon: '🖼️',
    fields: [
      { key: 'hero_image', label: 'Hero Image', type: 'upload' },
      { key: 'hero_title_en', label: 'Hero Title (EN)', type: 'text' },
      { key: 'hero_title_vi', label: 'Hero Title (VI)', type: 'text' },
      { key: 'hero_subtitle_en', label: 'Subtitle (EN)', type: 'text' },
      { key: 'hero_subtitle_vi', label: 'Subtitle (VI)', type: 'text' },
    ],
  },
  {
    title: 'Header & Logo',
    titleVi: 'Header & Logo',
    icon: '📋',
    fields: [
      { key: 'logo_url', label: 'Logo Image', type: 'upload' },
      { key: 'site_name', label: 'Site Name', type: 'text' },
      { key: 'header_phone', label: 'Header Phone', type: 'text' },
    ],
  },
  {
    title: 'Contact Info',
    titleVi: 'Liên Hệ',
    icon: '📞',
    fields: [
      { key: 'contact_phone', label: 'Phone Number', type: 'text' },
      { key: 'contact_email', label: 'Email', type: 'text' },
      { key: 'contact_address', label: 'Address', type: 'textarea' },
    ],
  },
  {
    title: 'Social Media',
    titleVi: 'Mạng Xã Hội',
    icon: '🌐',
    fields: [
      { key: 'facebook_url', label: 'Facebook URL', type: 'url' },
      { key: 'youtube_url', label: 'YouTube URL', type: 'url' },
      { key: 'instagram_url', label: 'Instagram URL', type: 'url' },
      { key: 'tiktok_url', label: 'TikTok URL', type: 'url' },
      { key: 'zalo_url', label: 'Zalo URL', type: 'url' },
    ],
  },
  {
    title: 'Floating CTA / Promotions',
    titleVi: 'Nút CTA / Khuyến Mãi',
    icon: '🎁',
    fields: [
      { key: 'floating_cta_en', label: 'CTA Button Text (EN)', type: 'text' },
      { key: 'floating_cta_vi', label: 'CTA Button Text (VI)', type: 'text' },
      { key: 'floating_cta_link', label: 'CTA Button Link (optional)', type: 'text' },
      { key: 'floating_cta_enabled', label: 'Show Floating CTA (yes/no)', type: 'text' },
      { key: 'messenger_url', label: 'Messenger URL', type: 'url' },
    ],
  },
];

export default function WebsiteSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: string; text: string} | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [showGallery, setShowGallery] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});  // Store blob URLs for uploaded files

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await apiFetch("/api/website-settings");
      setSettings(data);
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await apiFetch("/api/website-settings/bulk", {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      setMessage({ type: 'success', text: '✅ Settings saved successfully!' });
      setImagePreviews({});
    } catch (err: any) {
      if (err.message?.includes('401') || err.message?.includes('403')) {
        setMessage({ type: 'error', text: '❌ Session expired. Please logout and login again.' });
      } else {
        setMessage({ type: 'error', text: `❌ Failed to save: ${err.message || 'Network error'}` });
      }
    } finally {
      setSaving(false);
    }
  };

  const selectFromGallery = (key: string, path: string) => {
    handleChange(key, path);
    setShowGallery(null);
  };

  // Check if URL is a valid image URL (not a page URL like Facebook)
  const isValidImageUrl = (url: string) => {
    if (!url) return false;
    // Local paths are valid
    if (url.startsWith('/')) return true;
    // Check for image extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    const lowerUrl = url.toLowerCase();
    if (imageExtensions.some(ext => lowerUrl.includes(ext))) return true;
    // Check for common image hosting patterns
    if (url.includes('unsplash.com') || url.includes('images.') || url.includes('img.') || url.includes('cdn.')) return true;
    return false;
  };

  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (key: string) => {
    setImageErrors(prev => ({ ...prev, [key]: true }));
  };

  const handleImageLoad = (key: string) => {
    setImageErrors(prev => ({ ...prev, [key]: false }));
  };

  const renderField = (field: any) => {
    const value = settings[field.key] || '';
    const hasError = imageErrors[field.key];

    if (field.type === 'textarea') {
      return (
        <textarea
          value={value}
          onChange={(e) => handleChange(field.key, e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg min-h-[100px]"
          placeholder={field.label}
        />
      );
    }

    if (field.type === 'upload') {
      const showWarning = value && !isValidImageUrl(value) && !imagePreviews[field.key];
      const previewSrc = imagePreviews[field.key] || value;  // Use blob preview if available
      const hasPreview = !!imagePreviews[field.key];  // File was uploaded but not yet saved to server
      
      return (
        <div className="space-y-3">
          {/* Image Preview */}
          <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
            {(value || previewSrc) ? (
              <>
                {(hasError || showWarning) && !hasPreview ? (
                  <div className="flex flex-col items-center justify-center h-full text-amber-600 bg-amber-50 p-4">
                    <span className="text-3xl mb-2">⚠️</span>
                    <p className="text-sm text-center font-medium">Cannot load image</p>
                    <p className="text-xs text-center mt-1 text-gray-500">
                      {showWarning ? 'This URL is not a direct image link' : 'Image failed to load'}
                    </p>
                  </div>
                ) : (
                  <img 
                    src={previewSrc} 
                    alt="Preview" 
                    className="w-full h-full object-cover" 
                    onError={() => !hasPreview && handleImageError(field.key)}
                    onLoad={() => handleImageLoad(field.key)}
                  />
                )}
                {hasPreview && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    ✓ Uploaded Preview
                  </div>
                )}
                <button onClick={() => { 
                  handleChange(field.key, ''); 
                  setImageErrors(prev => ({ ...prev, [field.key]: false })); 
                  setImagePreviews(prev => { const n = {...prev}; delete n[field.key]; return n; });
                }} className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full text-sm hover:bg-red-600">✕</button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">{value}</div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <span className="text-3xl mb-1">🖼️</span>
                <span className="text-sm">No image selected</span>
              </div>
            )}
          </div>

          {/* Warning for non-image URLs */}
          {showWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              ⚠️ <strong>Note:</strong> This URL appears to be a webpage, not a direct image. 
              Use Gallery or Upload for best results, or use a direct image URL ending in .jpg, .png, etc.
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button onClick={() => setShowGallery(field.key)} className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-200 hover:bg-blue-100 flex items-center justify-center gap-1">
              🖼️ Gallery
            </button>
            <label className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200 hover:bg-green-100 flex items-center justify-center gap-1 cursor-pointer">
              📤 Upload
              <input 
                type="file" 
                accept="image/*" 
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Create blob preview URL for immediate display
                    const blobUrl = URL.createObjectURL(file);
                    setImagePreviews(prev => ({ ...prev, [field.key]: blobUrl }));
                    setMessage({ type: 'success', text: '📤 Uploading image...' });
                    
                    try {
                      const result = await uploadFile(file);
                      const path = uploadPublicPath(result);
                      if (!path) {
                        throw new Error(result.error || "Upload failed");
                      }
                      handleChange(field.key, path);
                      setImageErrors(prev => ({ ...prev, [field.key]: false }));
                      setMessage({ type: 'success', text: `📸 Image uploaded successfully! Path: ${path}` });
                    } catch (error) {
                      console.error('Upload error:', error);
                      setMessage({ type: 'error', text: `❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
                    }
                  }
                }}
              />
            </label>
            <button onClick={() => { 
              const url = prompt('Enter direct image URL (must end with .jpg, .png, etc.):'); 
              if (url) { 
                handleChange(field.key, url); 
                setImageErrors(prev => ({ ...prev, [field.key]: false }));
                setImagePreviews(prev => { const n = {...prev}; delete n[field.key]; return n; });
              } 
            }} className="flex-1 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm border border-gray-200 hover:bg-gray-100 flex items-center justify-center gap-1">
              🔗 URL
            </button>
          </div>

          {/* URL Input */}
          <input
            type="text"
            value={value}
            onChange={(e) => { 
              handleChange(field.key, e.target.value); 
              setImageErrors(prev => ({ ...prev, [field.key]: false }));
              // Clear blob preview when manually typing URL
              if (!e.target.value.startsWith('blob:')) {
                setImagePreviews(prev => { const n = {...prev}; delete n[field.key]; return n; });
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
            placeholder="/images/gallery/hero.jpg or https://example.com/image.jpg"
          />

          {/* Gallery Modal */}
          {showGallery === field.key && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowGallery(null)}>
              <div className="bg-white rounded-xl max-w-lg w-full max-h-[70vh] overflow-auto" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                  <h3 className="font-bold">🖼️ Select Image from Gallery</h3>
                  <button onClick={() => setShowGallery(null)} className="text-gray-500 text-xl">&times;</button>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  {GALLERY_IMAGES.map((img) => (
                    <div key={img.path} onClick={() => { 
                      selectFromGallery(field.key, img.path); 
                      setImageErrors(prev => ({ ...prev, [field.key]: false }));
                      setImagePreviews(prev => { const n = {...prev}; delete n[field.key]; return n; });
                    }} className="cursor-pointer rounded-lg overflow-hidden border-2 hover:border-blue-500 transition-all">
                      <img src={img.path} alt={img.name} className="w-full h-24 object-cover" />
                      <p className="text-xs text-center py-2 bg-gray-50 font-medium">{img.name}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-blue-50 text-sm text-blue-700">
                  💡 Add new images to <code className="bg-blue-100 px-1 rounded">/public/images/gallery/</code> folder
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        type={field.type === 'url' ? 'url' : 'text'}
        value={value}
        onChange={(e) => handleChange(field.key, e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
        placeholder={field.label}
      />
    );
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
      {/* Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <span>/</span>
          <Link href="/dashboard/superadmin/public-website/home" className="hover:text-blue-600">Public Website</Link>
          <span>/</span>
          <span className="text-gray-900">Website Settings</span>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">⚙️ Website Settings</h1>
            <p className="text-gray-500">Manage hero image, header, contact info and social links</p>
          </div>
          <div className="flex gap-3">
            <Link href="/" target="_blank" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              🌐 Preview Site
            </Link>
            <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {saving ? '⏳ Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {SETTING_CATEGORIES.map((cat, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-3 font-medium border-b-2 -mb-px ${activeTab === i ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {cat.icon} {cat.title}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Form */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            {SETTING_CATEGORIES[activeTab].icon} {SETTING_CATEGORIES[activeTab].title}
          </h2>
          <div className="space-y-5">
            {SETTING_CATEGORIES[activeTab].fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  <span className="ml-2 text-xs text-gray-400 font-mono">{field.key}</span>
                </label>
                {renderField(field)}
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4">👁️ Preview</h2>
          
          {activeTab === 0 && (
            <div className="rounded-lg overflow-hidden border">
              <div className="relative h-48 bg-gradient-to-r from-blue-900 to-blue-600">
                {(imagePreviews.hero_image || settings.hero_image) && (
                  <img 
                    src={imagePreviews.hero_image || settings.hero_image} 
                    alt="Hero" 
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-4">
                  <p className="text-yellow-400 text-sm mb-1">{settings.hero_subtitle_en || 'Where Excellence is the Standard'}</p>
                  <h2 className="text-xl font-bold">{settings.hero_title_en || 'Ready for Knowledge'}</h2>
                </div>
              </div>
            </div>
          )}

          {activeTab === 1 && (
            <div className="rounded-lg overflow-hidden border">
              <div className="bg-white px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {(imagePreviews.logo_url || settings.logo_url) ? (
                    <img src={imagePreviews.logo_url || settings.logo_url} alt="Logo" className="h-8" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">L</div>
                  )}
                  <span className="font-bold text-blue-900">{settings.site_name || 'LERA Academy'}</span>
                </div>
                <span className="text-sm text-gray-600">📞 {settings.header_phone || '0387.633.141'}</span>
              </div>
            </div>
          )}

          {activeTab === 2 && (
            <div className="space-y-3">
              <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-3">
                <span className="text-xl">📞</span>
                <span className="font-medium">{settings.contact_phone || '0387.633.141'}</span>
              </div>
              <div className="bg-green-50 rounded-lg p-3 flex items-center gap-3">
                <span className="text-xl">📧</span>
                <span className="font-medium">{settings.contact_email || 'info@lera.edu.vn'}</span>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 flex items-center gap-3">
                <span className="text-xl">📍</span>
                <span className="text-sm">{settings.contact_address || '95 Hải Đăng, Vinhomes Marina'}</span>
              </div>
            </div>
          )}

          {activeTab === 3 && (
            <div className="flex gap-3 flex-wrap">
              {settings.facebook_url && <a href={settings.facebook_url} target="_blank" className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">f</a>}
              {settings.youtube_url && <a href={settings.youtube_url} target="_blank" className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white">▶</a>}
              {settings.instagram_url && <a href={settings.instagram_url} target="_blank" className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white">📷</a>}
              {settings.tiktok_url && <a href={settings.tiktok_url} target="_blank" className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white">♪</a>}
              {settings.zalo_url && <a href={settings.zalo_url} target="_blank" className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">Z</a>}
              {!settings.facebook_url && !settings.youtube_url && !settings.instagram_url && <p className="text-gray-400">No social links configured</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
