'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';
import Link from 'next/link';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { apiFetch } from '@/lib/api';
import { uploadFile, uploadPublicPath } from '@/lib/upload-file';

interface SettingCategory {
  title: string;
  titleVi: string;
  prefix: string;
  icon: string;
  fields: { key: string; label: string; labelVi: string; type: 'text' | 'textarea' | 'url' | 'color' | 'image' | 'upload' }[];
}

const SETTING_CATEGORIES: SettingCategory[] = [
  {
    title: 'Hero Section',
    titleVi: 'Phần Hero (Banner Chính)',
    prefix: 'hero_',
    icon: '🖼️',
    fields: [
      { key: 'hero_image', label: 'Hero Image', labelVi: 'Hình Ảnh Hero', type: 'upload' },
      { key: 'hero_title_en', label: 'Hero Title (English)', labelVi: 'Tiêu Đề Hero (Tiếng Anh)', type: 'text' },
      { key: 'hero_title_vi', label: 'Hero Title (Vietnamese)', labelVi: 'Tiêu Đề Hero (Tiếng Việt)', type: 'text' },
      { key: 'hero_subtitle_en', label: 'Subtitle (English)', labelVi: 'Phụ Đề (Tiếng Anh)', type: 'text' },
      { key: 'hero_subtitle_vi', label: 'Subtitle (Vietnamese)', labelVi: 'Phụ Đề (Tiếng Việt)', type: 'text' },
    ],
  },
  {
    title: 'Header Settings',
    titleVi: 'Cài Đặt Header',
    prefix: 'header_',
    icon: '📋',
    fields: [
      { key: 'logo_url', label: 'Logo Image', labelVi: 'Hình Ảnh Logo', type: 'upload' },
      { key: 'site_name', label: 'Site Name', labelVi: 'Tên Trang Web', type: 'text' },
      { key: 'site_tagline_en', label: 'Tagline (English)', labelVi: 'Slogan (Tiếng Anh)', type: 'text' },
      { key: 'site_tagline_vi', label: 'Tagline (Vietnamese)', labelVi: 'Slogan (Tiếng Việt)', type: 'text' },
      { key: 'header_phone', label: 'Header Phone', labelVi: 'SĐT Trên Header', type: 'text' },
      { key: 'header_cta_text_en', label: 'CTA Button Text (EN)', labelVi: 'Text Nút CTA (EN)', type: 'text' },
      { key: 'header_cta_text_vi', label: 'CTA Button Text (VI)', labelVi: 'Text Nút CTA (VI)', type: 'text' },
    ],
  },
  {
    title: 'Contact Information',
    titleVi: 'Thông Tin Liên Hệ',
    prefix: 'contact_',
    icon: '📞',
    fields: [
      { key: 'contact_phone', label: 'Phone Number', labelVi: 'Số Điện Thoại', type: 'text' },
      { key: 'contact_phone_label', label: 'Phone Label (e.g. Mr. Giang)', labelVi: 'Tên Liên Hệ', type: 'text' },
      { key: 'contact_email', label: 'Email Address', labelVi: 'Địa Chỉ Email', type: 'text' },
      { key: 'contact_address', label: 'Address (Vietnamese)', labelVi: 'Địa Chỉ (Tiếng Việt)', type: 'textarea' },
      { key: 'contact_address_en', label: 'Address (English)', labelVi: 'Địa Chỉ (Tiếng Anh)', type: 'textarea' },
      { key: 'working_hours', label: 'Working Hours', labelVi: 'Giờ Làm Việc', type: 'text' },
    ],
  },
  {
    title: 'Social Media Links',
    titleVi: 'Liên Kết Mạng Xã Hội',
    prefix: 'social_',
    icon: '🌐',
    fields: [
      { key: 'facebook_url', label: 'Facebook URL', labelVi: 'URL Facebook', type: 'url' },
      { key: 'youtube_url', label: 'YouTube URL', labelVi: 'URL YouTube', type: 'url' },
      { key: 'instagram_url', label: 'Instagram URL', labelVi: 'URL Instagram', type: 'url' },
      { key: 'tiktok_url', label: 'TikTok URL', labelVi: 'URL TikTok', type: 'url' },
      { key: 'zalo_url', label: 'Zalo URL', labelVi: 'URL Zalo', type: 'url' },
    ],
  },
  {
    title: 'Branding & Colors',
    titleVi: 'Thương Hiệu & Màu Sắc',
    prefix: 'branding_',
    icon: '🎨',
    fields: [
      { key: 'favicon_url', label: 'Favicon', labelVi: 'Favicon', type: 'upload' },
      { key: 'primary_color', label: 'Primary Color', labelVi: 'Màu Chính', type: 'color' },
      { key: 'secondary_color', label: 'Secondary Color', labelVi: 'Màu Phụ', type: 'color' },
    ],
  },
  {
    title: 'About Section',
    titleVi: 'Phần Giới Thiệu',
    prefix: 'about_',
    icon: '📖',
    fields: [
      { key: 'about_title_en', label: 'About Title (English)', labelVi: 'Tiêu Đề Giới Thiệu (EN)', type: 'text' },
      { key: 'about_title_vi', label: 'About Title (Vietnamese)', labelVi: 'Tiêu Đề Giới Thiệu (VI)', type: 'text' },
      { key: 'about_story_en', label: 'About Story (English)', labelVi: 'Câu Chuyện (EN)', type: 'textarea' },
      { key: 'about_story_vi', label: 'About Story (Vietnamese)', labelVi: 'Câu Chuyện (VI)', type: 'textarea' },
    ],
  },
  {
    title: 'SEO / Meta',
    titleVi: 'SEO / Meta',
    prefix: 'meta_',
    icon: '🔍',
    fields: [
      { key: 'meta_description_en', label: 'Meta Description (English)', labelVi: 'Mô Tả Meta (Tiếng Anh)', type: 'textarea' },
      { key: 'meta_description_vi', label: 'Meta Description (Vietnamese)', labelVi: 'Mô Tả Meta (Tiếng Việt)', type: 'textarea' },
      { key: 'meta_keywords', label: 'Meta Keywords', labelVi: 'Từ Khóa Meta', type: 'text' },
    ],
  },
];

// Predefined gallery images for selection
const GALLERY_IMAGES = [
  { path: '/images/gallery/lera-hero.jpg', name: 'LERA Hero - Excellence' },
  { path: '/images/gallery/lera-classroom.jpg', name: 'LERA Classroom' },
];

export default function WebsiteSettingsPage() {
  const { language } = useLanguage();
  const isVi = language === 'VI';
  const { settings, refreshSettings, loading } = useWebsiteSettings();
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeCategory, setActiveCategory] = useState(0);
  const [showImagePicker, setShowImagePicker] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<{key: string; url: string} | null>(null);

  useEffect(() => {
    if (!loading && settings) {
      setEditedSettings(settings as Record<string, string>);
    }
  }, [settings, loading]);

  const handleInputChange = (key: string, value: string) => {
    setEditedSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSaveMessage(null);

    try {
      await apiFetch('/api/website-settings/bulk', {
        method: 'PUT',
        body: JSON.stringify(editedSettings),
      });
      setSaveMessage({ type: 'success', text: isVi ? '✅ Đã lưu thành công!' : '✅ Settings saved successfully!' });
      await refreshSettings();
    } catch (error) {
      setSaveMessage({ type: 'error', text: isVi ? '❌ Lưu thất bại. Vui lòng đăng nhập lại.' : '❌ Failed to save. Please login again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleImageSelect = (key: string, imagePath: string) => {
    handleInputChange(key, imagePath);
    setShowImagePicker(null);
  };

  const handleFileUpload = async (key: string, file: File) => {
    setUploadingImage(true);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreview({ key, url: previewUrl });
    
    try {
      const result = await uploadFile(file);
      const imagePath = uploadPublicPath(result);
      if (!imagePath) {
        throw new Error(result.error || 'Upload failed');
      }
      
      handleInputChange(key, imagePath);
      setSaveMessage({ 
        type: 'success', 
        text: isVi 
          ? `📸 Đã tải ảnh lên thành công! Đường dẫn: ${imagePath}` 
          : `📸 Image uploaded successfully! Path: ${imagePath}` 
      });
    } catch (error) {
      console.error('Upload error:', error);
      setSaveMessage({ 
        type: 'error', 
        text: isVi 
          ? `❌ Lỗi tải ảnh: ${error instanceof Error ? error.message : 'Unknown error'}` 
          : `❌ Upload error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
    
    setUploadingImage(false);
  };

  const renderField = (field: typeof SETTING_CATEGORIES[0]['fields'][0]) => {
    const value = editedSettings[field.key] || '';
    
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px] resize-y"
            placeholder={isVi ? field.labelVi : field.label}
          />
        );
      case 'color':
        return (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={value || '#1e40af'}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              className="w-14 h-14 rounded-lg cursor-pointer border-2 border-gray-300 p-1"
            />
            <input
              type="text"
              value={value}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="#1e40af"
            />
            <div 
              className="w-20 h-14 rounded-lg border-2 border-gray-300"
              style={{ backgroundColor: value || '#1e40af' }}
            ></div>
          </div>
        );
      case 'upload':
      case 'image':
        return (
          <div className="space-y-4">
            {/* Current Image Preview */}
            <div className="relative w-full h-56 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden border-2 border-dashed border-gray-300">
              {value ? (
                <>
                  <img
                    src={imagePreview?.key === field.key ? imagePreview.url : value}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x300?text=Image+Not+Found';
                    }}
                  />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={() => handleInputChange(field.key, '')}
                      className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg"
                      title={isVi ? 'Xóa ảnh' : 'Remove image'}
                    >
                      🗑️
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm">
                    {value}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <span className="text-5xl mb-2">🖼️</span>
                  <p>{isVi ? 'Chưa có hình ảnh' : 'No image selected'}</p>
                </div>
              )}
            </div>
            
            {/* Upload Options */}
            <div className="flex flex-wrap gap-3">
              {/* Choose from Gallery */}
              <button
                type="button"
                onClick={() => setShowImagePicker(field.key)}
                className="flex-1 min-w-[140px] px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2 border border-blue-200 transition-all"
              >
                🖼️ {isVi ? 'Chọn từ thư viện' : 'From Gallery'}
              </button>
              
              {/* Upload New */}
              <label className="flex-1 min-w-[140px] px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 flex items-center justify-center gap-2 cursor-pointer border border-green-200 transition-all">
                📤 {isVi ? 'Tải ảnh lên' : 'Upload Image'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(field.key, file);
                  }}
                />
              </label>
              
              {/* Enter URL */}
              <button
                type="button"
                onClick={() => {
                  const url = prompt(isVi ? 'Nhập URL hình ảnh:' : 'Enter image URL:');
                  if (url) handleInputChange(field.key, url);
                }}
                className="flex-1 min-w-[140px] px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 flex items-center justify-center gap-2 border border-gray-200 transition-all"
              >
                🔗 {isVi ? 'Nhập URL' : 'Enter URL'}
              </button>
            </div>
            
            {/* Current URL Input */}
            <input
              type="text"
              value={value}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-mono"
              placeholder={isVi ? 'URL hình ảnh (vd: /images/gallery/hero.jpg)' : 'Image URL (e.g., /images/gallery/hero.jpg)'}
            />
            
            {/* Image Picker Modal */}
            {showImagePicker === field.key && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowImagePicker(null)}>
                <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <h3 className="text-xl font-bold">🖼️ {isVi ? 'Chọn Hình Ảnh' : 'Select Image'}</h3>
                    <button onClick={() => setShowImagePicker(null)} className="text-gray-500 hover:text-gray-700 text-3xl leading-none">&times;</button>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {GALLERY_IMAGES.map((img) => (
                        <div
                          key={img.path}
                          onClick={() => handleImageSelect(field.key, img.path)}
                          className="cursor-pointer rounded-xl overflow-hidden border-3 border-transparent hover:border-blue-500 transition-all hover:shadow-lg group"
                        >
                          <div className="relative">
                            <img src={img.path} alt={img.name} className="w-full h-36 object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/20 transition-colors flex items-center justify-center">
                              <span className="text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity">✓</span>
                            </div>
                          </div>
                          <p className="text-sm text-center py-3 bg-gray-50 font-medium">{img.name}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        💡 <strong>{isVi ? 'Mẹo:' : 'Tip:'}</strong> {isVi 
                          ? 'Thêm ảnh mới vào thư mục /public/images/gallery/ để hiển thị ở đây.'
                          : 'Add new images to /public/images/gallery/ folder to show them here.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return (
          <input
            type={field.type === 'url' ? 'url' : 'text'}
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={isVi ? field.labelVi : field.label}
          />
        );
    }
  };

  if (loading) {
    return (
      <ProtectedRoute
        allowedRoles={['CHAIRMAN', 'CEO', 'DIRECTOR', 'SUPER_ADMIN', 'SUPERADMIN', 'ADMIN'] as any}
        fallbackUrl="/dashboard"
      >
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">{isVi ? 'Đang tải cài đặt...' : 'Loading settings...'}</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute
      allowedRoles={['CHAIRMAN', 'CEO', 'DIRECTOR', 'SUPER_ADMIN', 'SUPERADMIN', 'ADMIN'] as any}
      fallbackUrl="/dashboard"
    >
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-blue-600 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm">L</span>
                LERA
              </Link>
              <span className="ml-4 text-gray-400">/</span>
              <span className="ml-2 text-gray-600 font-medium">{isVi ? 'Cài Đặt Website' : 'Website Settings'}</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 flex items-center gap-1">
                ← {isVi ? 'Dashboard' : 'Dashboard'}
              </Link>
              <Link href="/" target="_blank" className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 flex items-center gap-1">
                🌐 {isVi ? 'Xem Website' : 'View Site'}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 mb-6 text-white shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                ⚙️ {isVi ? 'Cài Đặt Website' : 'Website Settings'}
              </h1>
              <p className="text-blue-100 mt-2">
                {isVi 
                  ? 'Quản lý Hero Image, Header, Thông tin liên hệ và nội dung website'
                  : 'Manage Hero Image, Header, Contact info and website content'}
              </p>
            </div>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-blue-50 disabled:opacity-50 flex items-center gap-2 font-bold shadow-lg transition-all hover:scale-105"
            >
              {saving ? (
                <>
                  <span className="animate-spin">⏳</span>
                  {isVi ? 'Đang lưu...' : 'Saving...'}
                </>
              ) : (
                <>
                  💾 {isVi ? 'Lưu Tất Cả Thay Đổi' : 'Save All Changes'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 shadow-md ${
            saveMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <span className="text-xl">{saveMessage.type === 'success' ? '✅' : '❌'}</span>
            <span className="flex-1">{saveMessage.text}</span>
            <button onClick={() => setSaveMessage(null)} className="text-2xl opacity-50 hover:opacity-100">&times;</button>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-2 px-2">
          {SETTING_CATEGORIES.map((category, index) => (
            <button
              key={category.prefix}
              onClick={() => setActiveCategory(index)}
              className={`px-5 py-3 rounded-xl whitespace-nowrap transition-all flex items-center gap-2 font-medium ${
                activeCategory === index
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
              }`}
            >
              <span className="text-lg">{category.icon}</span>
              <span className="hidden sm:inline">{isVi ? category.titleVi : category.title}</span>
            </button>
          ))}
        </div>

        {/* Settings Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-gray-800 border-b pb-4">
            <span className="text-3xl">{SETTING_CATEGORIES[activeCategory].icon}</span>
            {isVi 
              ? SETTING_CATEGORIES[activeCategory].titleVi 
              : SETTING_CATEGORIES[activeCategory].title}
          </h2>
          
          <div className="grid gap-8">
            {SETTING_CATEGORIES[activeCategory].fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  {isVi ? field.labelVi : field.label}
                  <span className="text-gray-400 text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{field.key}</span>
                </label>
                {renderField(field)}
              </div>
            ))}
          </div>
        </div>

        {/* Live Preview Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
            👁️ {isVi ? 'Xem Trước Trực Tiếp' : 'Live Preview'}
          </h3>
          
          {/* Hero Preview */}
          {activeCategory === 0 && (
            <div className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-inner">
              <div className="relative h-72 bg-gradient-to-r from-blue-900 to-blue-600">
                {editedSettings.hero_image && (
                  <img 
                    src={editedSettings.hero_image} 
                    alt="Hero Preview" 
                    className="absolute inset-0 w-full h-full object-cover opacity-70"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6">
                  <p className="text-yellow-400 text-lg mb-3 font-semibold tracking-wide">
                    {isVi ? editedSettings.hero_subtitle_vi : editedSettings.hero_subtitle_en || 'Where Excellence is the Standard'}
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold drop-shadow-lg">
                    {isVi ? editedSettings.hero_title_vi : editedSettings.hero_title_en || 'Ready for Knowledge for the Future'}
                  </h2>
                </div>
              </div>
            </div>
          )}
          
          {/* Header Preview */}
          {activeCategory === 1 && (
            <div className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-inner">
              <div className="bg-blue-900 text-white px-4 py-2 text-sm flex justify-between items-center">
                <span>📞 {editedSettings.header_phone || editedSettings.contact_phone || '0387.633.141'}</span>
                <div className="flex gap-3">
                  <span className="hover:text-blue-300 cursor-pointer">Facebook</span>
                  <span className="hover:text-pink-300 cursor-pointer">Instagram</span>
                  <span className="hover:text-red-300 cursor-pointer">YouTube</span>
                </div>
              </div>
              <div className="bg-white px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {editedSettings.logo_url ? (
                    <img src={editedSettings.logo_url} alt="Logo" className="h-12 w-auto" />
                  ) : (
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">L</div>
                  )}
                  <div>
                    <span className="font-bold text-blue-900 text-lg">{editedSettings.site_name || 'LERA Academy'}</span>
                    <p className="text-xs text-gray-500">{isVi ? editedSettings.site_tagline_vi : editedSettings.site_tagline_en || 'Where Excellence is the Standard'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <nav className="hidden md:flex gap-6 text-gray-600">
                    <span>{isVi ? 'Trang Chủ' : 'Home'}</span>
                    <span>{isVi ? 'Khóa Học' : 'Courses'}</span>
                    <span>{isVi ? 'Về Chúng Tôi' : 'About'}</span>
                    <span>{isVi ? 'Liên Hệ' : 'Contact'}</span>
                  </nav>
                  <button className="px-5 py-2.5 bg-blue-600 text-white rounded-full font-medium">
                    {isVi ? editedSettings.header_cta_text_vi || 'Đăng Nhập' : editedSettings.header_cta_text_en || 'Login'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Contact Preview */}
          {activeCategory === 2 && (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                <div className="text-3xl mb-3">📞</div>
                <p className="font-bold text-lg text-gray-800">{editedSettings.contact_phone || '0387.633.141'}</p>
                <p className="text-sm text-gray-500">{editedSettings.contact_phone_label || 'Mr. Giang/Ms. Ledia'}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                <div className="text-3xl mb-3">📧</div>
                <p className="font-bold text-gray-800">{editedSettings.contact_email || 'info@lera.edu.vn'}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
                <div className="text-3xl mb-3">📍</div>
                <p className="text-sm text-gray-700">{isVi ? editedSettings.contact_address : editedSettings.contact_address_en || '95 Hải Đăng, Vinhomes Marina'}</p>
              </div>
            </div>
          )}
          
          {/* Social Preview */}
          {activeCategory === 3 && (
            <div className="flex gap-4 justify-center py-4">
              {editedSettings.facebook_url && (
                <a href={editedSettings.facebook_url} target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl hover:scale-110 transition-transform shadow-lg">f</a>
              )}
              {editedSettings.instagram_url && (
                <a href={editedSettings.instagram_url} target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xl hover:scale-110 transition-transform shadow-lg">📷</a>
              )}
              {editedSettings.youtube_url && (
                <a href={editedSettings.youtube_url} target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center text-white text-xl hover:scale-110 transition-transform shadow-lg">▶</a>
              )}
              {editedSettings.tiktok_url && (
                <a href={editedSettings.tiktok_url} target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-black rounded-full flex items-center justify-center text-white text-xl hover:scale-110 transition-transform shadow-lg">♪</a>
              )}
              {editedSettings.zalo_url && (
                <a href={editedSettings.zalo_url} target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl hover:scale-110 transition-transform shadow-lg">Z</a>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Link href="/" target="_blank" className="bg-white rounded-xl p-5 shadow-lg hover:shadow-xl transition-all flex items-center gap-4 group">
            <div className="text-4xl group-hover:scale-110 transition-transform">🌐</div>
            <div>
              <p className="font-bold text-gray-800">{isVi ? 'Xem Website' : 'View Website'}</p>
              <p className="text-sm text-gray-500">{isVi ? 'Xem thay đổi trực tiếp' : 'See changes live'}</p>
            </div>
          </Link>
          <Link href="/dashboard" className="bg-white rounded-xl p-5 shadow-lg hover:shadow-xl transition-all flex items-center gap-4 group">
            <div className="text-4xl group-hover:scale-110 transition-transform">📊</div>
            <div>
              <p className="font-bold text-gray-800">{isVi ? 'Dashboard' : 'Dashboard'}</p>
              <p className="text-sm text-gray-500">{isVi ? 'Quản lý hệ thống' : 'System management'}</p>
            </div>
          </Link>
          <button onClick={handleSaveAll} disabled={saving} className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all flex items-center gap-4 text-left text-white group">
            <div className="text-4xl group-hover:scale-110 transition-transform">💾</div>
            <div>
              <p className="font-bold">{isVi ? 'Lưu Ngay' : 'Save Now'}</p>
              <p className="text-sm text-blue-100">{isVi ? 'Lưu tất cả thay đổi' : 'Save all changes'}</p>
            </div>
          </button>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}
