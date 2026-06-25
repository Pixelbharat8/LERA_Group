"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "../context/LanguageContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { publicFetch } from "../../lib/api";
import { COURSE_IMAGES, HERO_IMAGES, PLACEHOLDERS } from "../../config/images";

// Types for dynamic courses
interface Course {
  id: string;
  name: string;
  nameVi?: string;
  description?: string;
  descriptionVi?: string;
  ageMin?: number;
  ageMax?: number;
  ageRange?: string;
  imageUrl?: string;
  color?: string;
  category?: string;
  price?: number;
  duration?: string;
  sessionsPerWeek?: number;
  isActive?: boolean;
  order?: number;
  code?: string;
}

// English course codes that we support
const ENGLISH_COURSE_CODES = ["STARTERS", "EXPLORERS", "PRIMARY", "TEENS", "IELTS_SAT", "BUSINESS", "CONVERSATION", "PHONICS"];

// Map course codes to slug, image, colour, AND the age-group/age-range used for
// filtering. The backend stores category="ENGLISH" (a subject, not an age group)
// and leaves ageMin/ageMax null, so the code is the reliable signal for which
// "Kids / Teens / Adults" filter a programme belongs to.
const courseCodeMapping: Record<string, { slug: string; image: string; color: string; category: string; ageRange: string; ageMin: number; ageMax: number }> = {
  "STARTERS":     { slug: "lera-starters",   image: COURSE_IMAGES["lera-starters"],   color: "bg-pink-500",   category: "kids",   ageRange: "2.5-4", ageMin: 2.5, ageMax: 4 },
  "EXPLORERS":    { slug: "lera-explorers",  image: COURSE_IMAGES["lera-explorers"],  color: "bg-blue-500",   category: "kids",   ageRange: "5-6",   ageMin: 5,   ageMax: 6 },
  "PRIMARY":      { slug: "lera-primary",    image: COURSE_IMAGES["lera-primary"],    color: "bg-green-500",  category: "kids",   ageRange: "7-10",  ageMin: 7,   ageMax: 10 },
  "PHONICS":      { slug: "phonics",         image: COURSE_IMAGES["phonics"] || COURSE_IMAGES["default"], color: "bg-amber-500", category: "kids", ageRange: "4-7", ageMin: 4, ageMax: 7 },
  "TEENS":        { slug: "lera-teens",      image: COURSE_IMAGES["lera-teens"],      color: "bg-purple-500", category: "teens",  ageRange: "11-14", ageMin: 11,  ageMax: 14 },
  "IELTS_SAT":    { slug: "ielts-sat",       image: COURSE_IMAGES["ielts-sat"],       color: "bg-indigo-600", category: "teens",  ageRange: "15-17", ageMin: 15,  ageMax: 17 },
  "BUSINESS":     { slug: "business-english", image: COURSE_IMAGES["business-english"], color: "bg-violet-600", category: "adults", ageRange: "18+", ageMin: 18, ageMax: 99 },
  "CONVERSATION": { slug: "conversation",    image: COURSE_IMAGES["conversation"] || COURSE_IMAGES["default"], color: "bg-cyan-500", category: "adults", ageRange: "16+", ageMin: 16, ageMax: 99 },
};

// Fallback courses (LERA Academy English programs - always used if API returns non-English courses)
const fallbackCourses: Course[] = [
  { id: "lera-starters", code: "STARTERS", name: "LERA Starters", nameVi: "LERA Khởi Đầu", ageMin: 2.5, ageMax: 4, ageRange: "2.5-4", imageUrl: COURSE_IMAGES["lera-starters"], color: "bg-pink-500", category: "kids", description: "Fun English learning for toddlers through play, songs, and interactive activities", descriptionVi: "Học tiếng Anh vui nhộn cho trẻ nhỏ qua trò chơi, bài hát và hoạt động tương tác", order: 1 },
  { id: "lera-explorers", code: "EXPLORERS", name: "LERA Explorers", nameVi: "LERA Khám Phá", ageMin: 5, ageMax: 6, ageRange: "5-6", imageUrl: COURSE_IMAGES["lera-explorers"], color: "bg-blue-500", category: "kids", description: "Discover English through stories, crafts, and games", descriptionVi: "Khám phá tiếng Anh qua câu chuyện, thủ công và trò chơi", order: 2 },
  { id: "lera-primary", code: "PRIMARY", name: "LERA Primary", nameVi: "LERA Tiểu Học", ageMin: 7, ageMax: 10, ageRange: "7-10", imageUrl: COURSE_IMAGES["lera-primary"], color: "bg-green-500", category: "kids", description: "Comprehensive English for primary school students", descriptionVi: "Tiếng Anh toàn diện cho học sinh tiểu học", order: 3 },
  { id: "lera-teens", code: "TEENS", name: "LERA Teens", nameVi: "LERA Thiếu Niên", ageMin: 11, ageMax: 14, ageRange: "11-14", imageUrl: COURSE_IMAGES["lera-teens"], color: "bg-purple-500", category: "teens", description: "Academic English and Cambridge exam preparation", descriptionVi: "Tiếng Anh học thuật và luyện thi Cambridge", order: 4 },
  { id: "ielts-sat", code: "IELTS_SAT", name: "IELTS & SAT Preparation", nameVi: "Luyện Thi IELTS & SAT", ageMin: 15, ageMax: 99, ageRange: "15+", imageUrl: COURSE_IMAGES["ielts-sat"], color: "bg-indigo-600", category: "adults", description: "Intensive exam preparation with expert instructors", descriptionVi: "Luyện thi chuyên sâu với giáo viên chuyên gia", order: 5 },
  { id: "business-english", code: "BUSINESS", name: "Business English", nameVi: "Tiếng Anh Thương Mại", ageMin: 18, ageMax: 99, ageRange: "18+", imageUrl: COURSE_IMAGES["business-english"], color: "bg-violet-600", category: "adults", description: "Professional English for the workplace", descriptionVi: "Tiếng Anh chuyên nghiệp cho môi trường làm việc", order: 6 },
];

// Color mapping for dynamic courses
const categoryColors: Record<string, string> = {
  kids: "bg-pink-500",
  teens: "bg-purple-500", 
  adults: "bg-indigo-600",
  default: "bg-blue-500"
};

export default function CoursesPage() {
  const { language, t } = useLanguage();
  const [filter, setFilter] = useState<string>("all");
  const [courses, setCourses] = useState<Course[]>(fallbackCourses);
  const [isLoading, setIsLoading] = useState(true);
  const [heroContent, setHeroContent] = useState({
    title: { EN: "Our English Programs", VI: "Chương Trình Tiếng Anh" },
    subtitle: { EN: "Comprehensive courses for all ages and levels", VI: "Khóa học toàn diện cho mọi lứa tuổi và trình độ" }
  });

  // Fetch courses from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch courses from backend
        const coursesData = await publicFetch("/api/courses/active");
        if (Array.isArray(coursesData) && coursesData.length > 0) {
          // Check if courses are English courses (category === 'ENGLISH') or have valid English course codes
          const englishCourses = coursesData.filter((c: any) => 
            c.category === 'ENGLISH' || 
            ENGLISH_COURSE_CODES.includes(c.code) ||
            c.name?.includes('LERA') ||
            c.name?.includes('English') ||
            c.name?.includes('IELTS')
          );
          
          // If we have English courses from API, use them
          if (englishCourses.length > 0) {
            const transformedCourses = englishCourses
              .filter((c: any) => c.isActive !== false)
              .map((course: any) => {
                const mapping = courseCodeMapping[course.code];
                return {
                  id: mapping?.slug || course.id || course.slug || `course-${Math.random()}`,
                  code: course.code,
                  name: course.name || course.title || course.nameEN,
                  nameVi: course.nameVi || course.titleVI || course.name,
                  description: course.description || course.descriptionEN,
                  descriptionVi: course.descriptionVi || course.descriptionVI || course.description,
                  ageMin: course.ageMin || course.ageFrom || course.minAge || mapping?.ageMin,
                  ageMax: course.ageMax || course.ageTo || course.maxAge || mapping?.ageMax,
                  ageRange: course.ageRange || mapping?.ageRange || (course.ageFrom && course.ageTo ? `${course.ageFrom}-${course.ageTo}` : "All ages"),
                  imageUrl: mapping?.image || course.imageUrl || course.image || COURSE_IMAGES["default"],
                  color: mapping?.color || course.color || categoryColors[course.category] || categoryColors.default,
                  // Filter by AGE GROUP: prefer a real age-group from the API, else the
                  // code mapping, else derive from age. (API category is a subject, e.g. ENGLISH.)
                  category: ["kids", "teens", "adults"].includes(String(course.category).toLowerCase())
                    ? String(course.category).toLowerCase()
                    : (mapping?.category || determineCategory(course.ageMin || mapping?.ageMin, course.ageMax || mapping?.ageMax)),
                  price: course.price || course.tuitionFee,
                  duration: course.duration,
                  sessionsPerWeek: course.sessionsPerWeek,
                  order: course.displayOrder || course.order || course.sortOrder || 0
                };
              })
              .sort((a: Course, b: Course) => (a.order || 0) - (b.order || 0));
            
            if (transformedCourses.length > 0) {
              setCourses(transformedCourses);
            }
          } else {
            // API returned non-English courses (sports), use fallback
            console.log("API returned non-English courses, using fallback English courses");
            setCourses(fallbackCourses);
          }
        }
      } catch (error) {
        console.log("Using fallback courses data");
        setCourses(fallbackCourses);
      }

      try {
        // Fetch CMS content for hero section
        const cmsData = await publicFetch("/api/cms-settings/map/courses");
        if (cmsData && typeof cmsData === 'object') {
          setHeroContent({
            title: {
              EN: cmsData.courses_hero_title_en || heroContent.title.EN,
              VI: cmsData.courses_hero_title_vi || heroContent.title.VI
            },
            subtitle: {
              EN: cmsData.courses_hero_subtitle_en || heroContent.subtitle.EN,
              VI: cmsData.courses_hero_subtitle_vi || heroContent.subtitle.VI
            }
          });
        }
      } catch (error) {
        console.log("Using default hero content");
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);

  // Helper to determine category based on age
  function determineCategory(ageMin?: number, ageMax?: number): string {
    if (!ageMin) return "kids";
    if (ageMin >= 18) return "adults";
    if (ageMin >= 13) return "teens";
    return "kids";
  }

  // Get age display string
  function getAgeDisplay(course: Course): string {
    if (course.ageRange) {
      return language === "EN" ? `Ages ${course.ageRange}` : `${course.ageRange} tuổi`;
    }
    if (course.ageMin && course.ageMax) {
      return language === "EN" ? `Ages ${course.ageMin}-${course.ageMax}` : `${course.ageMin}-${course.ageMax} tuổi`;
    }
    return language === "EN" ? "All ages" : "Mọi lứa tuổi";
  }

  const filteredCourses = filter === "all" ? courses : courses.filter(c => c.category === filter);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section - Dynamic from CMS */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{backgroundImage: `url('${HERO_IMAGES.courses}')`}}></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="inline-block px-4 py-2 bg-white/20 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
            {language === "EN" ? `📚 ${courses.length} Programs Available` : `📚 ${courses.length} Chương trình có sẵn`}
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            {language === "EN" ? heroContent.title.EN : heroContent.title.VI}
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            {language === "EN" ? heroContent.subtitle.EN : heroContent.subtitle.VI}
          </p>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-8 bg-gray-50 sticky top-20 z-40 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setFilter("all")}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${filter === "all" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}
            >
              {t("allCourses")}
            </button>
            <button
              onClick={() => setFilter("kids")}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${filter === "kids" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}
            >
              {language === "EN" ? "Kids (3-12)" : "Trẻ em (3-12)"}
            </button>
            <button
              onClick={() => setFilter("teens")}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${filter === "teens" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}
            >
              {language === "EN" ? "Teens (13-17)" : "Thiếu niên (13-17)"}
            </button>
            <button
              onClick={() => setFilter("adults")}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${filter === "adults" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}
            >
              {language === "EN" ? "Adults (18+)" : "Người lớn (18+)"}
            </button>
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {language === "EN" ? "No courses found in this category" : "Không tìm thấy khóa học trong danh mục này"}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course) => (
                <Link key={course.id} href={`/courses/${course.id}`} className="group">
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="h-48 relative overflow-hidden">
                      <img 
                        src={course.imageUrl || COURSE_IMAGES["default"]} 
                        alt={language === "EN" ? course.name : (course.nameVi || course.name)}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className={`absolute inset-0 ${course.color || 'bg-blue-500'} opacity-40`} />
                      <div className="absolute bottom-3 left-4 bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-3 py-1 rounded-full font-semibold">
                        {getAgeDisplay(course)}
                      </div>
                      {course.price && (
                        <div className="absolute top-3 right-3 bg-yellow-400 text-gray-900 text-xs px-3 py-1 rounded-full font-bold">
                          {new Intl.NumberFormat("vi-VN").format(course.price)}₫
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {language === "EN" ? course.name : (course.nameVi || course.name)}
                      </h3>
                      <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                        {language === "EN" ? course.description : (course.descriptionVi || course.description)}
                      </p>
                      {(course.duration || course.sessionsPerWeek) && (
                        <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                          {course.duration && (
                            <span className="flex items-center gap-1">
                              <span>📅</span> {course.duration}
                            </span>
                          )}
                          {course.sessionsPerWeek && (
                            <span className="flex items-center gap-1">
                              <span>📚</span> {course.sessionsPerWeek}x/{language === "EN" ? "week" : "tuần"}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-blue-600 font-semibold group-hover:text-blue-700 transition-colors">
                          {language === "EN" ? "Learn More" : "Xem thêm"} <span className="ml-1">→</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {language === "EN" ? "Not Sure Which Course is Right?" : "Chưa biết khóa học nào phù hợp?"}
          </h2>
          <p className="text-xl text-white/90 mb-8">
            {language === "EN" ? "Book a free consultation and we'll help you find the perfect program" : "Đặt lịch tư vấn miễn phí và chúng tôi sẽ giúp bạn tìm chương trình phù hợp"}
          </p>
          <Link 
            href="/"
            className="inline-block px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-gray-100 transition-colors"
          >
            {language === "EN" ? "Get Free Consultation →" : "Nhận tư vấn miễn phí →"}
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
