# LERA Academy - Images Directory

This folder contains all images for the LERA Academy website.

## 📁 Directory Structure

```
images/
├── logo/
│   ├── lera-logo.png          # Main logo (recommended: 200x60px)
│   ├── lera-logo-white.png    # White logo for dark backgrounds
│   └── lera-icon.png          # Small icon (recommended: 64x64px)
├── hero/
│   ├── home-hero.jpg          # Homepage hero (recommended: 1920x1080px)
│   ├── about-hero.jpg         # About page hero
│   ├── contact-hero.jpg       # Contact page hero
│   └── courses-hero.jpg       # Courses page hero
├── gallery/
│   ├── classroom-1.jpg        # Classroom photos
│   ├── classroom-2.jpg
│   ├── students-1.jpg         # Student activities
│   ├── students-2.jpg
│   ├── events-1.jpg           # Events photos
│   └── events-2.jpg
├── courses/
│   ├── starters.jpg           # Course thumbnails
│   ├── explorers.jpg
│   ├── primary.jpg
│   ├── teens.jpg
│   └── ielts.jpg
├── team/
│   ├── founder.jpg            # Leadership photos
│   ├── director.jpg
│   └── teachers/              # Teacher photos
└── centers/
    ├── lachtray.jpg           # Center photos
    └── other-centers.jpg
```

## 🖼️ How to Add Images from Facebook

1. **Open the Facebook page**: https://www.facebook.com/profile.php?id=61580971978601
2. **Click on a photo** to open it in full view
3. **Right-click** on the image and select "Open image in new tab"
4. **Save the image** (Ctrl+S or Cmd+S)
5. **Rename** the file appropriately (e.g., `classroom-1.jpg`)
6. **Move** the file to the appropriate folder above
7. **Update** `config/images.ts` with the new path:
   ```typescript
   // Example: Update gallery image
   GALLERY_IMAGES[0].src = "/images/gallery/classroom-1.jpg"
   ```

## 📐 Recommended Image Sizes

| Type | Size | Format |
|------|------|--------|
| Logo | 200x60px | PNG (transparent) |
| Hero | 1920x1080px | JPG |
| Gallery | 800x600px | JPG |
| Course | 400x300px | JPG |
| Team | 400x400px | JPG |
| Center | 800x500px | JPG |

## 🔧 Quick Update Guide

After adding images, update `config/images.ts`:

```typescript
// Example updates
export const HERO_IMAGES = {
  home: "/images/hero/home-hero.jpg",  // Changed from Unsplash
  // ...
};

export const GALLERY_IMAGES = [
  {
    src: "/images/gallery/classroom-1.jpg",  // Changed from Unsplash
    alt: "LERA Academy classroom",
    caption: { EN: "Our Modern Classrooms", VI: "Phòng học hiện đại" }
  },
  // ...
];
```

## 🌐 Alternative: Use External Image Hosting

You can also use external hosting services:

1. **Cloudinary** (Free tier available)
   - Upload images to Cloudinary
   - Use the provided URLs in `config/images.ts`

2. **Google Drive**
   - Upload images and make them public
   - Use direct link format

3. **Facebook CDN** (Not recommended - links may break)
   - URLs from Facebook are temporary
   - Better to download and host locally

## ✅ Checklist

- [ ] Logo uploaded
- [ ] Hero images uploaded
- [ ] Gallery images uploaded (at least 6)
- [ ] Course images uploaded (6 courses)
- [ ] Team photos uploaded
- [ ] Center photos uploaded
- [ ] `config/images.ts` updated
- [ ] Test all pages to verify images load
