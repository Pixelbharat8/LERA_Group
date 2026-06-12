# 🎯 DYNAMIC CONTENT SYSTEM - COMPLETE

## Summary

Everything is now **dynamic** and manageable from the admin dashboard!

---

## ✅ Backend API Created

### New Files Created:
1. **`WebsiteSettings.java`** - Entity for storing dynamic settings
   - Location: `/backend/identity_service/src/main/java/com/lera/identity_service/entity/`
   - Fields: `id`, `settingKey`, `settingValue` (JSONB), `updatedAt`

2. **`WebsiteSettingsRepository.java`** - JPA Repository
   - Location: `/backend/identity_service/src/main/java/com/lera/identity_service/repository/`
   - Methods: `findBySettingKey`, `findBySettingKeyStartingWith`, `findBySettingKeyIn`

3. **`WebsiteSettingsService.java`** - Business logic service
   - Location: `/backend/identity_service/src/main/java/com/lera/identity_service/service/`
   - Methods: `getAllSettings`, `getSettingsByPrefix`, `getSetting`, `saveSetting`, `getGroupedSettings`

4. **`WebsiteSettingsController.java`** - REST API Controller
   - Location: `/backend/identity_service/src/main/java/com/lera/identity_service/controller/`
   - Endpoints:
     - `GET /api/website-settings` - Get all settings (PUBLIC)
     - `GET /api/website-settings/grouped` - Get grouped settings (PUBLIC)
     - `GET /api/website-settings/prefix/{prefix}` - Get by prefix (PUBLIC)
     - `GET /api/website-settings/{key}` - Get single setting (PUBLIC)
     - `POST /api/website-settings/batch` - Get multiple by keys (PUBLIC)
     - `PUT /api/website-settings/{key}` - Update setting (ADMIN)
     - `PUT /api/website-settings/bulk` - Bulk update (ADMIN)
     - `DELETE /api/website-settings/{key}` - Delete setting (ADMIN)

---

## ✅ Frontend Hook Created

### New File:
**`/frontend/hooks/useWebsiteSettings.tsx`**

Features:
- `WebsiteSettingsProvider` - Context provider for entire app
- `useWebsiteSettings()` - Hook to access settings from any component
- `fetchWebsiteSettings()` - Standalone function for server components
- Default fallback values for offline/error scenarios

---

## ✅ Admin Dashboard Page

### New Page:
**`/frontend/app/admin/website-settings/page.tsx`**

Features:
- Category tabs: Contact, Hero, Social, Branding, SEO/Meta
- Live preview panel
- Save all changes button
- Color picker for brand colors
- Image URL preview
- Bilingual support (EN/VI)

Access: `http://localhost:3000/admin/website-settings`

---

## ✅ Database Settings (25 entries)

| Setting Key | Value |
|-------------|-------|
| `contact_phone` | 0387.633.141 |
| `contact_email` | info@lera.edu.vn |
| `contact_address` | 95 Hải Đăng, khu đô thị Vinhomes Marina, phường An Biên, Hải Phòng |
| `contact_address_en` | 95 Hai Dang, Vinhomes Marina, An Bien Ward, Hai Phong |
| `working_hours` | 8:00 AM - 9:00 PM |
| `hero_image` | /images/gallery/lera-hero.jpg |
| `hero_title_en` | Ready for Knowledge for the Future |
| `hero_title_vi` | Sẵn Sàng Tri Thức Cho Tương Lai |
| `hero_subtitle_en` | Where Excellence is the Standard |
| `hero_subtitle_vi` | Nơi xuất sắc là tiêu chuẩn |
| `social_facebook` | https://www.facebook.com/profile.php?id=61580971978601 |
| `instagram_url` | https://instagram.com/leraacademy |
| `tiktok_url` | https://tiktok.com/@leraacademy |
| `zalo_url` | https://zalo.me/0387633141 |
| `logo_url` | /images/logo/lera-logo.png |
| `site_name` | LERA Academy |
| `primary_color` | #1e40af |
| `secondary_color` | #f59e0b |
| `site_tagline_en` | Where Excellence is the Standard |
| `site_tagline_vi` | Nơi xuất sắc là tiêu chuẩn |
| `about_title_en` | About LERA Academy |
| `about_title_vi` | Về LERA Academy |
| `about_story_en` | Founded in 2020, LERA Academy... |
| `about_story_vi` | Được thành lập năm 2020... |
| `contact_phone_label` | Mr. Giang/Ms. Ledia |

---

## ✅ Components Updated

### Homepage (`/frontend/app/page.tsx`)
- ✅ Hero image from settings
- ✅ Hero title/subtitle from settings
- ✅ Dynamic content fallbacks

### Footer (`/frontend/app/components/Footer.tsx`)
- ✅ Social media links (Facebook, Instagram, YouTube, TikTok, Zalo)
- ✅ Phone number
- ✅ Address (EN/VI)
- ✅ Working hours

### Root Layout (`/frontend/app/layout.tsx`)
- ✅ WebsiteSettingsProvider wraps entire app

---

## 🔧 How to Use

### From any React component:
```tsx
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';

function MyComponent() {
  const { getSetting, settings } = useWebsiteSettings();
  
  // Get a single setting with fallback
  const phone = getSetting('contact_phone', '0387.633.141');
  
  // Get all settings object
  console.log(settings.hero_image);
  
  return <p>Phone: {phone}</p>;
}
```

### Test API:
```bash
# Get all settings
curl http://localhost:8081/api/website-settings

# Get grouped settings
curl http://localhost:8081/api/website-settings/grouped

# Get settings by prefix
curl http://localhost:8081/api/website-settings/prefix/contact

# Update a setting (requires auth)
curl -X PUT -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '"new value"' \
     http://localhost:8081/api/website-settings/contact_phone
```

---

## 📱 Access Points

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Homepage (dynamic content) |
| http://localhost:3000/admin/website-settings | Admin settings page |
| http://localhost:8081/api/website-settings | API endpoint |
| http://localhost:8081/swagger-ui/index.html | API documentation |

---

## ✨ Benefits

1. **No Code Changes Needed** - Update content from admin dashboard
2. **Instant Updates** - Changes reflect immediately
3. **Bilingual Support** - EN/VI versions of all text
4. **Type-Safe** - TypeScript interfaces for settings
5. **Fallback Values** - Works even if API is down
6. **Grouped Settings** - Organized by category
7. **Image Preview** - See images before saving
8. **Color Picker** - Easy brand color selection

---

*Created: January 2026*
*System: LERA Academy Platform*
