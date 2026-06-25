"use client";

import { useLanguage } from "./context/LanguageContext";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import Header from "./components/Header";
import Footer from "./components/Footer";
import FloatingCTA from "./components/FloatingCTA";
import AnimatedCounter from "./components/AnimatedCounter";
import Link from "next/link";
import { useState, useEffect } from "react";
import { apiUrl, apiFetch } from "../lib/api";
import { TRIAL_BOOKING_LEAD_CONTEXT } from "../lib/english-centre-vertical-scope";
import { COURSE_IMAGES, GALLERY_IMAGES, HERO_IMAGES, PLACEHOLDERS, TESTIMONIAL_FACES, TEAM_IMAGES } from "../config/images";

// Professional line icons for the "Why Choose" features. Known keys render an SVG;
// anything else (e.g. an emoji set from the CMS) renders as-is, so admin overrides still work.
const FEATURE_ICONS: Record<string, React.ReactNode> = {
  "globe": (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.5-2.5 3.5-6 3.5-9S14.5 5.5 12 3M12 21c-2.5-2.5-3.5-6-3.5-9S9.5 5.5 12 3M3.5 9h17M3.5 15h17" />),
  "sparkles": (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M5 3v4M3 5h4M6 17v4m-2-2h4m9-16l2.2 5.8L23 12l-5.8 2.2L15 20l-2.2-5.8L7 12l5.8-2.2L15 3z" />),
  "users": (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M17 20h5v-1a4 4 0 00-4-4h-1m-2-4a4 4 0 10-8 0 4 4 0 008 0zm-4 6a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zm8-6a3 3 0 10-3-3" />),
  "academic-cap": (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 4l9 5-9 5-9-5 9-5zm0 10v6m6-7v4a6 3 0 01-12 0v-4" />),
};

const FeatureIcon = ({ icon, className = "" }: { icon: string; className?: string }) => {
  const svg = FEATURE_ICONS[icon];
  if (svg) {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        {svg}
      </svg>
    );
  }
  return <span className="text-5xl">{icon}</span>;
};

// Map database course codes to URL slugs
const codeToSlug: Record<string, string> = {
  "STARTERS": "lera-starters",
  "EXPLORERS": "lera-explorers",
  "PRIMARY": "lera-primary",
  "TEENS": "lera-teens",
  "IELTS_SAT": "ielts-sat",
  "BUSINESS": "business-english",
  "CONVERSATION": "conversation",
  "PHONICS": "phonics",
};

// Map courses to use LERA Academy images
const courseImages: Record<string, string> = {
  "STARTERS": COURSE_IMAGES["lera-starters"],
  "EXPLORERS": COURSE_IMAGES["lera-explorers"],
  "PRIMARY": COURSE_IMAGES["lera-primary"],
  "TEENS": COURSE_IMAGES["lera-teens"],
  "IELTS_SAT": COURSE_IMAGES["ielts-sat"],
  "BUSINESS": COURSE_IMAGES["business-english"],
  "CONVERSATION": COURSE_IMAGES["conversation"],
  "PHONICS": COURSE_IMAGES["phonics"],
};

export default function Home() {
  const { language, t } = useLanguage();
  const { settings: siteSettings, getSetting } = useWebsiteSettings();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    course: "",
    city: "",
    website: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [cmsContent, setCmsContent] = useState<any>({});
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [rawCourses, setRawCourses] = useState<any[]>([]);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [whyChooseFeatures, setWhyChooseFeatures] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);

  useEffect(() => {
    setIsVisible(true);
    fetchCmsContent();
    fetchTestimonials();
    fetchCourses();
    fetchGallery();
    fetchCenters();
    fetchAchievements();
    
    const interval = setInterval(() => {
      // Render modulos by the real testimonial count, so just advance unbounded-but-small.
      setCurrentTestimonial((prev) => (prev + 1) % 1000);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update courses when language changes
  useEffect(() => {
    if (rawCourses.length > 0) {
      setCourses(rawCourses.map((c: any) => {
        // Format age display - show 2.5 for STARTERS
        let ageDisplay = "All ages";
        if (c.ageFrom && c.ageTo) {
          const ageFromDisplay = c.code === "STARTERS" ? "2.5" : c.ageFrom;
          const ageToDisplay = c.ageTo >= 99 ? "+" : `-${c.ageTo}`;
          ageDisplay = c.ageTo >= 99 ? `${ageFromDisplay}+` : `${ageFromDisplay}-${c.ageTo}`;
        }
        return {
          id: codeToSlug[c.code] || c.code?.toLowerCase() || c.id,
          title: language === "VI" && c.nameVi ? c.nameVi : c.name,
          age: ageDisplay,
          image: courseImages[c.code] || c.imageUrl || "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop",
          color: c.color || "bg-blue-500"
        };
      }));
    }
  }, [language, rawCourses]);

  const fetchCmsContent = async () => {
    try {
      const res = await fetch(apiUrl("/api/cms-settings/map/homepage"));
      if (res.ok) {
        const data = await res.json();
        setCmsContent(data);
        
        // Parse "Why Choose Us" features from CMS
        const featureCount = parseInt(data.feature_count) || 0;
        const features = [];
        for (let i = 0; i < featureCount; i++) {
          const enabled = data[`feature_${i}_enabled`] !== "false";
          if (enabled) {
            features.push({
              icon: data[`feature_${i}_icon`] || "⭐",
              titleEN: data[`feature_${i}_title_en`] || "",
              titleVI: data[`feature_${i}_title_vi`] || "",
              descEN: data[`feature_${i}_desc_en`] || "",
              descVI: data[`feature_${i}_desc_vi`] || "",
              color: data[`feature_${i}_color`] || "from-blue-500 to-cyan-500",
            });
          }
        }
        if (features.length > 0) setWhyChooseFeatures(features);
      }
    } catch (err) {
      console.error("Error fetching CMS content:", err);
    }
  };

  const fetchTestimonials = async () => {
    try {
      const res = await fetch(apiUrl("/api/testimonials/published"));
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setTestimonials(data.map((t: any, i: number) => ({
            name: t.parentName,
            role: t.studentName ? `Parent of ${t.studentName}` : "Parent",
            text: language === "VI" && t.contentVi ? t.contentVi : t.content,
            rating: t.rating || 5,
            // Use the real parent photo when provided, else a distinct stock face.
            image: t.parentImage || t.imageUrl || TESTIMONIAL_FACES[i % TESTIMONIAL_FACES.length],
          })));
        }
      }
    } catch (err) {
      console.error("Error fetching testimonials:", err);
    }
  };

  // English course codes that we support
  const ENGLISH_COURSE_CODES = ["STARTERS", "EXPLORERS", "PRIMARY", "TEENS", "IELTS_SAT", "BUSINESS", "CONVERSATION", "PHONICS"];

  const fetchCourses = async () => {
    try {
      const res = await fetch(apiUrl("/api/courses/active"));
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Filter only English courses (category === 'ENGLISH' or valid English course codes)
          const englishCourses = data.filter((c: any) => 
            c.category === 'ENGLISH' || 
            ENGLISH_COURSE_CODES.includes(c.code) ||
            c.name?.includes('LERA') ||
            c.name?.includes('English') ||
            c.name?.includes('IELTS')
          );
          
          // Only use API data if it returns English courses
          if (englishCourses.length > 0) {
            setRawCourses(englishCourses);
            setCourses(englishCourses.map((c: any) => {
              // Format age display - show 2.5 for STARTERS
              let ageDisplay = "All ages";
              if (c.ageFrom && c.ageTo) {
                const ageFromDisplay = c.code === "STARTERS" ? "2.5" : c.ageFrom;
                ageDisplay = c.ageTo >= 99 ? `${ageFromDisplay}+` : `${ageFromDisplay}-${c.ageTo}`;
              }
              return {
                id: codeToSlug[c.code] || c.code?.toLowerCase() || c.id,
                title: language === "VI" && c.nameVi ? c.nameVi : c.name,
                age: ageDisplay,
                image: courseImages[c.code] || c.imageUrl || COURSE_IMAGES["default"],
                color: c.color || "bg-blue-500"
              };
            }));
          } else {
            // API returned non-English courses, keep using fallback (displayCourses)
            console.log("API returned non-English courses, using fallback");
          }
        }
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  const fetchGallery = async () => {
    try {
      const res = await fetch(apiUrl("/api/cms-settings/map/gallery"));
      if (res.ok) {
        const data = await res.json();
        const count = parseInt(data.gallery_count) || 0;
        const items = [];
        for (let i = 0; i < count; i++) {
          const src = data[`gallery_${i}_src`];
          if (src) {
            items.push({
              id: `gallery-cms-${i}`,
              src,
              caption: {
                EN: data[`gallery_${i}_caption_en`] || "",
                VI: data[`gallery_${i}_caption_vi`] || "",
              },
            });
          }
        }
        if (items.length > 0) setGalleryImages(items);
      }
    } catch (err) {
      console.error("Error fetching gallery:", err);
    }
  };

  const fetchCenters = async () => {
    try {
      const res = await fetch(apiUrl("/api/centers"));
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setCenters(data);
      }
    } catch (err) {
      console.error("Error fetching centers:", err);
    }
  };

  const fetchAchievements = async () => {
    try {
      const res = await fetch(apiUrl("/api/cms-settings/map/achievements"));
      if (res.ok) {
        const data = await res.json();
        const count = parseInt(data.achievement_count) || 0;
        const items = [];
        for (let i = 0; i < count; i++) {
          if (data[`ach_${i}_published`] !== "false") {
            items.push({
              name: data[`ach_${i}_name`] || "",
              descEN: data[`ach_${i}_desc_en`] || "",
              descVI: data[`ach_${i}_desc_vi`] || "",
              score: data[`ach_${i}_score`] || "",
              exam: data[`ach_${i}_exam`] || "",
              center: data[`ach_${i}_center`] || "",
              image: data[`ach_${i}_image`] || "",
              year: data[`ach_${i}_year`] || "",
            });
          }
        }
        if (items.length > 0) setAchievements(items);
      }
    } catch (err) {
      console.error("Error fetching achievements:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Submit to leads API
      const leadData = {
        parentName: formData.fullName,
        parentPhone: formData.phone,
        notes: `[Trial / placement funnel] Course: ${formData.course}, City: ${formData.city}`,
        utmSource: TRIAL_BOOKING_LEAD_CONTEXT.utmSource,
        utmMedium: TRIAL_BOOKING_LEAD_CONTEXT.utmMedium,
        utmCampaign: "homepage",
        website: formData.website,
      };
      
      await apiFetch("/api/public/leads", {
        method: "POST",
        body: JSON.stringify(leadData)
      });
      
      console.log("Lead created successfully");
      setFormSubmitted(true);
      setFormData({ fullName: "", phone: "", course: "", city: "", website: "" });
      setTimeout(() => setFormSubmitted(false), 5000);
    } catch (err) {
      console.error("Error submitting form:", err);
      alert(language === "EN" ? "Registration failed. Please try again." : "Đăng ký thất bại. Vui lòng thử lại.");
    }
  };

  // Real published testimonials only — no fabricated parents. The section hides when empty.
  const displayTestimonials = testimonials;

  // Default courses if none from API - Using LERA Academy images
  const displayCourses = courses.length > 0 ? courses : [
    { id: "lera-starters", title: "LERA Starters", age: "2.5-4", image: COURSE_IMAGES["lera-starters"], color: "bg-pink-500" },
    { id: "lera-explorers", title: "LERA Explorers", age: "5-6", image: COURSE_IMAGES["lera-explorers"], color: "bg-blue-500" },
    { id: "lera-primary", title: "LERA Primary", age: "7-10", image: COURSE_IMAGES["lera-primary"], color: "bg-green-500" },
    { id: "lera-teens", title: "LERA Teens", age: "11-14", image: COURSE_IMAGES["lera-teens"], color: "bg-purple-500" },
    { id: "ielts-sat", title: "IELTS & SAT", age: "15+", image: COURSE_IMAGES["ielts-sat"], color: "bg-indigo-600" },
    { id: "business-english", title: language === "EN" ? "Business English" : "Tiếng Anh Thương mại", age: "18+", image: COURSE_IMAGES["business-english"], color: "bg-violet-600" },
  ];

  // Get CMS content with fallbacks - also check website settings
  const getContent = (key: string, fallbackEN: string, fallbackVI: string) => {
    // First check website settings, then CMS content
    const settingsKey = language === "VI" ? `${key}_vi` : `${key}_en`;
    const siteValue = getSetting(settingsKey);
    if (siteValue) return siteValue;
    
    if (language === "VI") {
      return cmsContent[`${key}_vi`] || fallbackVI;
    }
    return cmsContent[`${key}_en`] || fallbackEN;
  };
  
  // Get hero image from settings
  const heroImage = getSetting('hero_image', HERO_IMAGES.home);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* ===== HERO ===== */}
      <section className="relative bg-gray-50 pt-32 pb-16 sm:pt-40 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: copy + CTAs */}
            <div className="order-2 lg:order-1">
              <p className="text-sm font-semibold tracking-wider uppercase text-blue-600 mb-4">
                {getContent("hero_subtitle", "Where Excellence is the Standard", "Nơi Xuất Sắc Là Tiêu Chuẩn")}
              </p>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#0a1a5c] leading-tight">
                {getContent("hero_title", "Ready for Knowledge for the Future", "Sẵn Sàng Tri Thức Cho Tương Lai")}
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                {getContent(
                  "hero_description",
                  "A premium English centre in Vietnam. International standards, native and Vietnamese teachers, and small classes that help every child grow with confidence.",
                  "Trung tâm Anh ngữ cao cấp tại Việt Nam. Chuẩn quốc tế, giáo viên bản ngữ và Việt Nam, lớp học nhỏ giúp mỗi học viên tự tin tiến bộ."
                )}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/book-trial"
                  className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-7 py-3.5 rounded-full font-bold text-base shadow-sm transition-all hover:shadow-md"
                >
                  {getContent("hero_cta_primary", "Book a free trial", "Đăng ký học thử")}
                  <span aria-hidden>→</span>
                </Link>
                <Link
                  href="/courses"
                  className="inline-flex items-center justify-center gap-2 border border-[#0a1a5c] text-[#0a1a5c] hover:bg-[#0a1a5c] hover:text-white px-7 py-3.5 rounded-full font-semibold text-base transition-all"
                >
                  {getContent("hero_cta_secondary", "Explore courses", "Khám phá khoá học")}
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-gray-600">
                {[
                  getContent("hero_tick_1", "Cambridge aligned", "Chuẩn Cambridge"),
                  getContent("hero_tick_2", "IELTS specialists", "Chuyên gia IELTS"),
                  getContent("hero_tick_3", "Native teachers", "Giáo viên bản ngữ"),
                ].map((tick) => (
                  <span key={tick} className="inline-flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {tick}
                  </span>
                ))}
              </div>

              <div className="mt-10 hidden lg:block">
                <img
                  src={heroImage || GALLERY_IMAGES[0].src}
                  alt="LERA Academy"
                  className="w-full max-w-lg rounded-2xl object-cover shadow-sm border border-gray-100"
                />
              </div>
            </div>

            {/* Right: registration form (PRESERVED) */}
            <div className="order-1 lg:order-2">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 sm:p-8 w-full max-w-lg mx-auto">
                <div className="text-center mb-6">
                  <p className="text-gray-500 text-sm mb-1">
                    {getContent("form_title", "GET 1 WEEK FREE ENGLISH LEARNING", "NHẬN NGAY 1 TUẦN HỌC TIẾNG ANH MIỄN PHÍ")}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-orange-500">
                    {getContent("form_subtitle", "RECEIVE NOW", "NHẬN NGAY")}
                  </h2>
                  <p className="text-lg sm:text-xl font-bold text-[#0a1a5c]">
                    {getContent("form_subheading", "1 WEEK FREE LEARNING", "1 TUẦN HỌC MIỄN PHÍ")}
                  </p>
                </div>

                {formSubmitted ? (
                  <div className="text-center py-8">
                    <div className="text-5xl mb-4">✅</div>
                    <h3 className="text-xl font-bold text-green-600 mb-2">
                      {language === "EN" ? "Registration Successful!" : "Đăng ký thành công!"}
                    </h3>
                    <p className="text-gray-600">
                      {language === "EN" ? "We will contact you shortly." : "Chúng tôi sẽ liên hệ với bạn sớm."}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 lg:space-y-5">
                    <input
                      type="text"
                      name="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="hidden"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                    />
                    <div>
                      <input
                        type="text"
                        placeholder={language === "EN" ? "Full Name (*)" : "Họ và tên (*)"}
                        value={formData.fullName}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        required
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-lg rounded-lg sm:rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        placeholder={language === "EN" ? "Phone Number (*)" : "Số điện thoại (*)"}
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        required
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-lg rounded-lg sm:rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <select
                        value={formData.course}
                        onChange={(e) => setFormData({...formData, course: e.target.value})}
                        required
                        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-lg rounded-lg sm:rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white appearance-none cursor-pointer ${formData.course ? 'text-gray-900' : 'text-gray-500'}`}
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem' }}
                      >
                        <option value="">{language === "EN" ? "Select a course *" : "Vui lòng chọn khoá học *"}</option>
                        {displayCourses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title} ({c.age} {language === "EN" ? "years" : "tuổi"})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        required
                        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-lg rounded-lg sm:rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white appearance-none cursor-pointer ${formData.city ? 'text-gray-900' : 'text-gray-500'}`}
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem' }}
                      >
                        <option value="">{language === "EN" ? "Select city/province *" : "Vui lòng chọn tỉnh/thành phố *"}</option>
                        {centers.length > 0 ? (
                          // Dynamic cities from centers API (deduplicated)
                          Array.from(new Set(centers.map((c: any) => c.city || c.province).filter(Boolean))).map((city: any) => (
                            <option key={city} value={city.toLowerCase().replace(/\s+/g, '-')}>{city}</option>
                          ))
                        ) : (
                          <>
                            <option value="hai-phong">Hải Phòng</option>
                            <option value="ha-noi">Hà Nội</option>
                            <option value="ho-chi-minh">Hồ Chí Minh</option>
                            <option value="da-nang">Đà Nẵng</option>
                          </>
                        )}
                      </select>
                    </div>
                    
                    <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm lg:text-base text-gray-600">
                      <input type="checkbox" required className="mt-0.5 sm:mt-1 w-4 h-4 lg:w-5 lg:h-5 text-blue-600 rounded flex-shrink-0" />
                      <p>
                        {language === "EN" 
                          ? "By registering, you agree to allow LERA Academy to contact you via phone, message, and email for consultation purposes."
                          : "Bằng việc đăng ký thông tin, bạn đồng ý cho phép LERA liên lạc thông qua các hình thức: cuộc gọi, tin nhắn, email nhằm mục đích tư vấn các chương trình Anh ngữ."}
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 sm:py-4 lg:py-5 rounded-full font-bold text-base sm:text-lg lg:text-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                      {language === "EN" ? "REGISTER NOW" : "ĐĂNG KÝ NGAY"}
                      <span>→</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ACCREDITATION / TRUST STRIP ===== */}
      <section className="bg-white border-y border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs sm:text-sm font-semibold tracking-wider uppercase text-gray-400 mb-6">
            {getContent("trust_title", "Aligned with international standards", "Đạt chuẩn quốc tế")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:gap-x-12">
            {[
              "Cambridge English",
              "IELTS",
              "TOEFL",
              "TESOL / CELTA",
              "Cambridge Assessment",
            ].map((name) => (
              <div
                key={name}
                className="flex items-center gap-2 text-gray-500 hover:text-blue-700 transition-colors"
                title={name}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 12l2 2 4-4m5.6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-bold text-sm sm:text-base whitespace-nowrap">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {/* Parse stats from CMS or use defaults */}
            {(() => {
              const statsCount = parseInt(cmsContent.stats_count) || 4;
              const stats = [];
              for (let i = 0; i < statsCount; i++) {
                const value = cmsContent[`stat_${i}_value`];
                const labelEN = cmsContent[`stat_${i}_label_en`];
                const labelVI = cmsContent[`stat_${i}_label_vi`];
                const enabled = cmsContent[`stat_${i}_enabled`] !== "false";

                if (enabled) {
                  stats.push({
                    value: value || ["15+", "5,000+", "50+", "1"][i] || "0",
                    label: language === "VI" ? (labelVI || ["Năm Kinh Nghiệm", "Học Viên Đã Đăng Ký", "Giáo Viên Chuyên Nghiệp", "Trung Tâm Học Tập"][i]) : (labelEN || ["Years Experience", "Students Enrolled", "Expert Teachers", "Learning Center"][i]),
                    icon: ["🎯", "👨‍🎓", "👩‍🏫", "🏫"][i]
                  });
                }
              }
              // Fallback if no stats in CMS
              if (stats.length === 0) {
                stats.push(
                  { value: "15+", label: t("yearsExperience"), icon: "🎯" },
                  { value: "5,000+", label: t("studentsEnrolled"), icon: "👨‍🎓" },
                  { value: "50+", label: t("expertTeachers"), icon: "👩‍🏫" },
                  { value: "1", label: t("learningCenters"), icon: "🏫" }
                );
              }
              return stats.map((stat, idx) => {
                // A "countable" stat is a plain number (optionally with + / , / spaces),
                // e.g. "5000+" → animate. Quality tiles like "≤12", "100%" or "Cambridge"
                // are rendered literally so their meaning isn't lost.
                const isCountable = /^[0-9][0-9,\s]*\+?$/.test(stat.value.trim());
                const numericValue = parseInt(stat.value.replace(/[^0-9]/g, "")) || 0;
                const suffix = stat.value.includes("+") ? "+" : "";
                return (
                  <div key={idx} className="text-center bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all p-6">
                    <div className="text-4xl sm:text-5xl font-extrabold text-[#0a1a5c] mb-2">
                      {isCountable
                        ? <AnimatedCounter end={numericValue} suffix={suffix} />
                        : <span>{stat.value}</span>}
                    </div>
                    <p className="text-gray-600 font-medium">{stat.label}</p>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </section>

      {/* ===== COURSES ===== */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <p className="text-sm font-semibold tracking-wider uppercase text-blue-600 mb-3">
              {getContent("courses_eyebrow", "Our programmes", "Chương trình học")}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0a1a5c]">{t("learningPathTitle")}</h2>
            <p className="mt-4 text-lg text-gray-600 leading-relaxed">{t("learningPathSubtitle")}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayCourses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="group block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden"
              >
                <div className="h-48 relative overflow-hidden">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-3 left-4 bg-white/95 text-gray-800 text-xs px-3 py-1 rounded-full font-semibold shadow-sm">
                    {t("agesLabel")} {course.age}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#0a1a5c] mb-1">{course.title}</h3>
                  <p className="text-gray-500 mb-4">{course.age} {language === "EN" ? "years old" : "tuổi"}</p>
                  <span className="inline-flex items-center gap-2 text-blue-600 font-semibold">
                    {t("learnMore")}
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 bg-[#0a1a5c] hover:bg-[#0a1a5c]/90 text-white px-8 py-3.5 rounded-full font-semibold transition-all hover:shadow-md"
            >
              {t("viewCourses")}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== WHY CHOOSE US ===== */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <p className="text-sm font-semibold tracking-wider uppercase text-blue-600 mb-3">
              {getContent("why_eyebrow", "Why LERA", "Vì sao chọn LERA")}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0a1a5c]">{t("whyChooseUs")}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(whyChooseFeatures.length > 0 ? whyChooseFeatures.map(f => ({
              icon: f.icon,
              title: language === "VI" ? f.titleVI : f.titleEN,
              desc: language === "VI" ? f.descVI : f.descEN,
              color: f.color,
            })) : [
              { icon: "globe", title: t("nativeTeachers"), desc: t("nativeTeachersDesc"), color: "from-blue-500 to-cyan-500" },
              { icon: "sparkles", title: t("modernMethod"), desc: t("modernMethodDesc"), color: "from-purple-500 to-pink-500" },
              { icon: "users", title: t("smallClass"), desc: t("smallClassDesc"), color: "from-orange-500 to-red-500" },
              { icon: "academic-cap", title: t("intlCertificate"), desc: t("intlCertificateDesc"), color: "from-green-500 to-teal-500" },
            ]).map((feature, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all p-6"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-50 text-blue-600 mb-4">
                  <FeatureIcon icon={feature.icon} className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-[#0a1a5c] mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FACEBOOK FEED (real photos & videos from the LERA page) ===== */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <p className="text-sm font-semibold tracking-wider uppercase text-blue-600 mb-3">
              {getContent("facebook_eyebrow", "Life at LERA", "Tại LERA")}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0a1a5c]">
              {getContent("facebook_title", "From Our Facebook", "Từ Facebook của chúng tôi")}
            </h2>
            <p className="mt-4 text-lg text-gray-600 leading-relaxed">
              {getContent("facebook_subtitle", "Real photos and videos from our classes, events and students — straight from the LERA Academy page.", "Hình ảnh và video thực tế từ lớp học, sự kiện và học viên — trực tiếp từ trang LERA Academy.")}
            </p>
          </div>

          {(() => {
            const fbUrl = getContent("facebook_page_url", "https://www.facebook.com/profile.php?id=61580971978601", "https://www.facebook.com/profile.php?id=61580971978601");
            // Curated "featured posts" selected from the backend (Dashboard → Website Content → Home).
            let posts: any[] = [];
            try {
              const raw = getContent("facebook_featured_posts", "[]", "[]");
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) posts = parsed.filter((p: any) => p && p.thumb);
            } catch { /* ignore malformed JSON, fall back to live feed */ }

            // Curated grid (ILA-style): show the hand-picked posts/videos.
            if (posts.length > 0) {
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.slice(0, 6).map((post: any, idx: number) => {
                    const name = language === "VI" ? (post.nameVI || post.nameEN) : (post.nameEN || post.nameVI);
                    const caption = language === "VI" ? (post.captionVI || post.captionEN) : (post.captionEN || post.captionVI);
                    return (
                      <a
                        key={idx}
                        href={post.link || fbUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative block rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all aspect-[4/5] bg-gray-100"
                      >
                        <img
                          src={post.thumb}
                          alt={name || "LERA Academy"}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                        {post.isVideo && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <svg className="w-7 h-7 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </span>
                          </div>
                        )}
                        {name && (
                          <span className="absolute top-4 left-4 text-xs font-semibold text-white bg-blue-600/90 rounded-md px-3 py-1">
                            {name}
                          </span>
                        )}
                        {caption && (
                          <p className="absolute bottom-4 left-4 right-4 text-white font-semibold text-sm leading-snug drop-shadow">
                            {caption}
                          </p>
                        )}
                      </a>
                    );
                  })}
                </div>
              );
            }

            // Fallback: live Facebook timeline embed (used until posts are curated in the admin).
            return (
              <div className="flex justify-center">
                <div className="w-full max-w-[560px] rounded-2xl border border-gray-100 shadow-sm overflow-hidden bg-white">
                  <iframe
                    title="LERA Academy Facebook"
                    src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(fbUrl)}&tabs=timeline&width=560&height=640&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true`}
                    width="560"
                    height="640"
                    style={{ border: "none", overflow: "hidden", width: "100%" }}
                    scrolling="no"
                    frameBorder="0"
                    allowFullScreen={true}
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  />
                </div>
              </div>
            );
          })()}

          <div className="text-center mt-8">
            <a
              href={getContent("facebook_page_url", "https://www.facebook.com/profile.php?id=61580971978601", "https://www.facebook.com/profile.php?id=61580971978601")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              {getContent("facebook_cta", "Visit our Facebook page", "Ghé thăm trang Facebook của chúng tôi")}
            </a>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      {displayTestimonials.length > 0 && (
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold tracking-wider uppercase text-blue-600 mb-3">
            {getContent("testimonial_eyebrow", "Testimonials", "Cảm nhận")}
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0a1a5c] mb-10">
            {getContent("testimonial_title", "What Parents Say About Us", "Phụ huynh nói gì về chúng tôi")}
          </h2>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-10">
            <div className="flex justify-center gap-1 mb-5">
              {[...Array(displayTestimonials[currentTestimonial % displayTestimonials.length]?.rating || 5)].map((_, i) => (
                <span key={i} className="text-yellow-400 text-lg">⭐</span>
              ))}
            </div>
            <p className="text-lg sm:text-xl text-gray-700 italic leading-relaxed">
              “{displayTestimonials[currentTestimonial % displayTestimonials.length]?.text}”
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <img
                src={displayTestimonials[currentTestimonial % displayTestimonials.length]?.image || TESTIMONIAL_FACES[currentTestimonial % TESTIMONIAL_FACES.length]}
                alt={displayTestimonials[currentTestimonial % displayTestimonials.length]?.name || "Parent"}
                className="w-14 h-14 rounded-full object-cover border border-gray-100"
              />
              <div className="text-left">
                <h4 className="font-bold text-[#0a1a5c]">{displayTestimonials[currentTestimonial % displayTestimonials.length]?.name}</h4>
                <p className="text-sm text-gray-500">{displayTestimonials[currentTestimonial % displayTestimonials.length]?.role}</p>
              </div>
            </div>
            <div className="flex justify-center gap-2 mt-8">
              {displayTestimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentTestimonial(idx)}
                  aria-label={`Testimonial ${idx + 1}`}
                  className={`h-2.5 rounded-full transition-all duration-300 ${idx === currentTestimonial ? "bg-blue-600 w-8" : "bg-gray-300 w-2.5 hover:bg-gray-400"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ===== GALLERY ===== */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <p className="text-sm font-semibold tracking-wider uppercase text-blue-600 mb-3">
              {getContent("gallery_eyebrow", "Gallery", "Hình ảnh")}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0a1a5c]">
              {getContent("gallery_title", "Our Learning Environment", "Môi trường học tập")}
            </h2>
            <p className="mt-4 text-lg text-gray-600 leading-relaxed">{getContent("gallery_subtitle", "Where Excellence is the Standard", "Nơi xuất sắc là tiêu chuẩn")}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(() => {
              const source = galleryImages.length > 0 ? galleryImages : GALLERY_IMAGES;
              const seen = new Set<string>();
              return source.filter((img: any) => {
                if (!img?.src || seen.has(img.src)) return false;
                seen.add(img.src);
                return true;
              }).slice(0, 8);
            })().map((img: any) => (
              <div key={img.id} className="group relative overflow-hidden rounded-2xl border border-gray-100">
                <img
                  src={img.src}
                  alt={language === "EN" ? img.caption.EN : img.caption.VI}
                  className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="absolute bottom-0 left-0 right-0 p-3 text-white text-sm font-medium">
                    {language === "EN" ? img.caption.EN : img.caption.VI}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STUDENT ACHIEVEMENTS (optional, CMS-driven) ===== */}
      {achievements.length > 0 && (
        <section className="py-16 sm:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <p className="text-sm font-semibold tracking-wider uppercase text-blue-600 mb-3">
                {getContent("achievements_eyebrow", "Results", "Thành tích")}
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0a1a5c]">
                {getContent("achievements_title", "Outstanding Students", "Gương mặt xuất sắc")}
              </h2>
              <p className="mt-4 text-lg text-gray-600 leading-relaxed">{getContent("achievements_subtitle", "Our students consistently achieve outstanding results", "Học sinh của chúng tôi luôn đạt thành tích xuất sắc")}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {achievements.map((a, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden group">
                  <div className="h-48 relative overflow-hidden bg-gray-100">
                    {a.image ? (
                      <img src={a.image} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-6xl">🎓</span>
                      </div>
                    )}
                    {a.score && (
                      <div className="absolute top-3 right-3 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full font-bold text-xs shadow-sm">
                        ⭐ {a.score}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-[#0a1a5c] text-sm">{a.name}</h4>
                    {a.exam && <p className="text-xs text-blue-600 font-medium mt-1">{a.exam}</p>}
                    <p className="text-xs text-gray-500 mt-1">{language === "VI" ? a.descVI : a.descEN}</p>
                    {a.center && <p className="text-xs text-gray-400 mt-1">📍 {a.center}</p>}
                    {a.year && <p className="text-xs text-gray-400">📅 {a.year}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== FINAL CTA BAND ===== */}
      <section className="py-16 sm:py-24" style={{ backgroundColor: "#0a1a5c" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
            {getContent("cta_title", t("ctaTitle"), t("ctaTitle"))}
          </h2>
          <p className="text-blue-100/80 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">{getContent("cta_desc", t("ctaDesc"), t("ctaDesc"))}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/book-trial"
              className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-3.5 rounded-full font-bold transition-all hover:shadow-md"
            >
              {getContent("hero_cta_primary", "Book a free trial", "Đăng ký học thử")}
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center border border-white/60 text-white hover:bg-white/10 px-8 py-3.5 rounded-full font-semibold transition-all"
            >
              {t("contactUs")}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <FloatingCTA />
    </div>
  );
}
