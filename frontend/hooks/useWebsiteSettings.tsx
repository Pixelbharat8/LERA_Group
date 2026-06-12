'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { apiFetch } from '../lib/api';

// Types for website settings
export interface WebsiteSettings {
  // Contact information
  contact_phone?: string;
  contact_email?: string;
  contact_address?: string;
  contact_hours?: string;
  
  // Hero section
  hero_image?: string;
  hero_title_en?: string;
  hero_title_vi?: string;
  hero_subtitle_en?: string;
  hero_subtitle_vi?: string;
  
  // Social links
  social_facebook?: string;
  social_youtube?: string;
  social_instagram?: string;
  social_tiktok?: string;
  social_zalo?: string;
  
  // Branding
  logo_url?: string;
  favicon_url?: string;
  primary_color?: string;
  secondary_color?: string;
  site_name?: string;
  
  // Meta
  meta_description_en?: string;
  meta_description_vi?: string;
  meta_keywords?: string;
  
  // Dynamic fields
  [key: string]: string | undefined;
}

export interface GroupedSettings {
  contact?: Record<string, string>;
  hero?: Record<string, string>;
  social?: Record<string, string>;
  branding?: Record<string, string>;
  meta?: Record<string, string>;
  general?: Record<string, string>;
}

// Context for website settings
interface WebsiteSettingsContextType {
  settings: WebsiteSettings;
  grouped: GroupedSettings;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
  getSetting: (key: string, defaultValue?: string) => string;
}

const WebsiteSettingsContext = createContext<WebsiteSettingsContextType | null>(null);

// Default values for fallback
const DEFAULT_SETTINGS: WebsiteSettings = {
  contact_phone: '0387.633.141',
  contact_email: 'info@leraacademy.edu.vn',
  contact_address: '95 Hải Đăng, khu đô thị Vinhomes Marina, phường An Biên, Hải Phòng',
  contact_hours: 'Mon-Fri: 8:00 AM - 6:00 PM, Sat: 8:00 AM - 12:00 PM',
  hero_image: '/images/gallery/lera-hero.jpg',
  hero_title_en: 'Ready for Knowledge for the Future',
  hero_title_vi: 'Sẵn Sàng Tri Thức Cho Tương Lai',
  hero_subtitle_en: 'Where Excellence is the Standard',
  hero_subtitle_vi: 'Nơi Xuất Sắc Là Tiêu Chuẩn',
  social_facebook: 'https://www.facebook.com/profile.php?id=61580971978601',
  logo_url: '/images/lera-logo.png',
  site_name: 'LERA Academy',
  primary_color: '#1e40af',
  secondary_color: '#3b82f6',
};

// Provider component
export function WebsiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<WebsiteSettings>(DEFAULT_SETTINGS);
  const [grouped, setGrouped] = useState<GroupedSettings>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = (await apiFetch('/api/website-settings')) as WebsiteSettings;
      setSettings({ ...DEFAULT_SETTINGS, ...data });
      setError(null);
    } catch (err) {
      console.warn('Error fetching website settings:', err);
      setSettings(DEFAULT_SETTINGS);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupedSettings = async () => {
    try {
      const data = (await apiFetch('/api/website-settings/grouped')) as GroupedSettings;
      setGrouped(data);
    } catch (err) {
      console.warn('Error fetching grouped settings:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchGroupedSettings();
  }, []);

  const refreshSettings = async () => {
    await Promise.all([fetchSettings(), fetchGroupedSettings()]);
  };

  const getSetting = (key: string, defaultValue: string = ''): string => {
    return settings[key] || defaultValue;
  };

  return (
    <WebsiteSettingsContext.Provider value={{ settings, grouped, loading, error, refreshSettings, getSetting }}>
      {children}
    </WebsiteSettingsContext.Provider>
  );
}

// Hook to use website settings
export function useWebsiteSettings() {
  const context = useContext(WebsiteSettingsContext);
  if (!context) {
    throw new Error('useWebsiteSettings must be used within a WebsiteSettingsProvider');
  }
  return context;
}

// Standalone function to fetch settings (for server components or outside provider)
export async function fetchWebsiteSettings(): Promise<WebsiteSettings> {
  try {
    if (typeof window === 'undefined') {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || '';
      const url = `${base}/api/website-settings`;
      const response = await fetch(url, { next: { revalidate: 60 } });
      if (response.ok) {
        const data = (await response.json()) as WebsiteSettings;
        return { ...DEFAULT_SETTINGS, ...data };
      }
    } else {
      const data = (await apiFetch('/api/website-settings')) as WebsiteSettings;
      return { ...DEFAULT_SETTINGS, ...data };
    }
  } catch (err) {
    console.warn('Error fetching website settings:', err);
  }

  return DEFAULT_SETTINGS;
}

// Export default settings for fallback
export { DEFAULT_SETTINGS };
