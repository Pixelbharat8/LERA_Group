/**
 * LERA Academy - Centralized Image Configuration
 * 
 * REAL DATA from LERA Academy Facebook page:
 * https://www.facebook.com/profile.php?id=61580971978601
 * 
 * Contact: 0387.633.141 (Mr. Giang/Ms. Ledia)
 * Address: 95 Hải Đăng, khu đô thị Vinhomes Marina, phường An Biên, Hải Phòng
 */

// LERA Academy Images - "Where Excellence is the Standard"
// Main hero image: Teacher helping students write (navy blue frame)
const LERA_HERO = "/images/gallery/lera-hero.jpg";

// Real LERA Academy photos already in the project (from the LERA Facebook page / uploads).
// Prefer these over stock for authenticity.
const LERA_REAL = [
  "/images/gallery/lera-hero.jpg",
  "/images/gallery/lera-classroom.jpg",
  "/images/gallery/1769244373931-main.jpg",
  "/images/gallery/1768668431496-main.jpg",
  "/images/uploads/1769869085843-main.jpg",
  "/images/uploads/1769909549952-main.jpg",
  "/images/uploads/1769696032658-main.jpg",
];

// English Education Images (from Unsplash) - High quality images for English learning
const KIDS_ENGLISH_1 = "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80"; // Kids learning in classroom
const KIDS_ENGLISH_2 = "https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=800&q=80"; // Children studying together
const KIDS_ENGLISH_3 = "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80"; // Happy kids learning
const TEENS_ENGLISH = "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&q=80"; // Teen students studying
const IELTS_PREP = "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80"; // Student studying for exams
const BUSINESS_ENGLISH = "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80"; // Business meeting/presentation
const CONVERSATION_CLASS = "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80"; // Group discussion
const PHONICS_READING = "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80"; // Reading books

// ============================================
// LOGO & BRANDING
// ============================================
export const LOGO = {
  main: "/images/logo/lera-logo.png",
  white: "/images/logo/lera-logo-white.png",
  favicon: "/favicon.ico",
  icon: "/images/logo/lera-icon.png",
};

// ============================================
// HERO & BACKGROUND IMAGES
// ============================================
export const HERO_IMAGES = {
  home: LERA_HERO,  // Main hero - Teacher with students "Where Excellence is the Standard"
  about: LERA_HERO,
  contact: LERA_HERO,
  centers: LERA_HERO,
  courses: LERA_HERO,
};

// ============================================
// GALLERY IMAGES - LERA Academy photos
// ============================================
// Only 2 of the uploaded LERA photos are actually distinct, so the gallery uses those 2
// real photos first, then distinct stock classroom shots — no duplicates. Add more real
// LERA photos to public/images and extend this list for a fully authentic gallery.
export const GALLERY_IMAGES = [
  {
    id: "gallery-1",
    src: "/images/uploads/1769696032658-main.jpg",  // Real LERA - teacher with student
    alt: "LERA Academy - teacher with student",
    caption: { EN: "Where Excellence is the Standard", VI: "Nơi xuất sắc là tiêu chuẩn" }
  },
  {
    id: "gallery-2",
    src: "/images/gallery/lera-classroom.jpg",  // Real LERA - classroom
    alt: "LERA Academy classroom",
    caption: { EN: "Interactive English Classes", VI: "Lớp học tiếng Anh tương tác" }
  },
  {
    id: "gallery-3",
    src: KIDS_ENGLISH_3,
    alt: "Young students learning",
    caption: { EN: "Creative Learning Activities", VI: "Hoạt động học tập sáng tạo" }
  },
  {
    id: "gallery-4",
    src: TEENS_ENGLISH,
    alt: "Teen students studying English",
    caption: { EN: "Academic English Programs", VI: "Chương trình tiếng Anh học thuật" }
  },
  {
    id: "gallery-5",
    src: CONVERSATION_CLASS,
    alt: "Conversation class",
    caption: { EN: "Speaking & Communication", VI: "Nói và giao tiếp" }
  },
  {
    id: "gallery-6",
    src: KIDS_ENGLISH_2,
    alt: "Children studying together",
    caption: { EN: "Professional English Training", VI: "Đào tạo tiếng Anh chuyên nghiệp" }
  }
];

// ============================================
// COURSE IMAGES - English Language Courses
// ============================================
// Student-focused photos by age. Each shows children/students actually learning
// (no abstract stock). Swap for real LERA class photos via the website-content admin.
export const COURSE_IMAGES: Record<string, string> = {
  "lera-starters": "https://images.unsplash.com/photo-1587616211892-f743fcca64f9?w=800&q=80",   // Young child reading/learning
  "lera-explorers": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80",  // Kids in classroom with teacher
  "lera-primary": "https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=800&q=80",       // Children studying together
  "lera-teens": "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&q=80",      // Teen students studying
  "ielts-sat": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80",       // Student writing / exam prep
  "business-english": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",   // Professional discussion
  "conversation": "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80",    // Group discussion
  "phonics": "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80",         // Happy kids reading
  "default": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80"          // Default fallback
};

// ============================================
// CENTER IMAGES
// ============================================
export const CENTER_IMAGES: Record<string, string> = {
  "default": KIDS_ENGLISH_1,
  "vinhomes-marina": LERA_HERO,
  "hanoi": CONVERSATION_CLASS,
  "hcm": TEENS_ENGLISH,
  "danang": KIDS_ENGLISH_2,
};

// ============================================
// TEAM/LEADERSHIP IMAGES
// ============================================
export const TEAM_IMAGES: Record<string, string> = {
  "founder": "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop",
  "academic-director": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop",
  "operations-director": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
  "default-male": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
  "default-female": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
};

// ============================================
// TESTIMONIAL FACES
// Distinct, friendly portrait placeholders for parent testimonials. These are stock
// photos — replace with REAL, consented LERA parent/student photos via the testimonials
// admin (Dashboard → website content) for an authentic Vietnamese site.
// crop=faces tells the CDN to centre the crop on the face.
// ============================================
export const TESTIMONIAL_FACES: string[] = [
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=160&h=160&fit=crop&crop=faces&q=80", // woman
  "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=160&h=160&fit=crop&crop=faces&q=80",     // man
  "https://images.unsplash.com/photo-1592621385612-4d7129426394?w=160&h=160&fit=crop&crop=faces&q=80",  // woman
  "https://images.unsplash.com/photo-1601412436009-d964bd02edbc?w=160&h=160&fit=crop&crop=faces&q=80",  // man
];

// ============================================
// PLACEHOLDER & DEFAULT IMAGES
// ============================================
export const PLACEHOLDERS = {
  avatar: TESTIMONIAL_FACES[0],
  course: KIDS_ENGLISH_1,
  center: LERA_HERO,
  classroom: CONVERSATION_CLASS,
  students: KIDS_ENGLISH_2,
};

// ============================================
// FACEBOOK PAGE - LERA Academy
// ============================================
export const FACEBOOK_IMAGES = {
  profilePicture: "/images/logo/lera-logo.png",
  coverPhoto: LERA_HERO,
  classes: [KIDS_ENGLISH_1, KIDS_ENGLISH_2],
  kidsActivities: [KIDS_ENGLISH_3],
  events: [],
  graduation: [],
};

// Helper function
export const getImage = (imageUrl: string | undefined, fallback: string): string => {
  return imageUrl && imageUrl.length > 0 ? imageUrl : fallback;
};

// Export all
const IMAGES = {
  LOGO,
  HERO_IMAGES,
  GALLERY_IMAGES,
  COURSE_IMAGES,
  CENTER_IMAGES,
  TEAM_IMAGES,
  PLACEHOLDERS,
  FACEBOOK_IMAGES,
  getImage,
};

export default IMAGES;
