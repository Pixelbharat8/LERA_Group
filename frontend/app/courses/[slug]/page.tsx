"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { apiFetch } from "../../../lib/api";
import { TRIAL_BOOKING_LEAD_CONTEXT } from "../../../lib/english-centre-vertical-scope";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

interface CourseData {
  id: string;
  code: string;
  name: string;
  nameVi?: string;
  description?: string;
  descriptionVi?: string;
  ageFrom?: number;
  ageTo?: number;
  ageRange?: string;
  durationWeeks?: number;
  sessionsPerWeek?: number;
  maxClassSize?: number;
  level?: string;
  levelVi?: string;
  color?: string;
  icon?: string;
  curriculum?: string[];
  curriculumVi?: string[];
  benefits?: string[];
  benefitsVi?: string[];
  imageUrl?: string;
}

// Slug to code mapping
const slugToCode: Record<string, string> = {
  "lera-starters": "STARTERS",
  "lera-explorers": "EXPLORERS",
  "lera-primary": "PRIMARY",
  "lera-teens": "TEENS",
  "ielts-sat": "IELTS_SAT",
  "business-english": "BUSINESS"
};

// Default content for fallback
const defaultCourseData: Record<string, CourseData> = {
  "lera-starters": {
    id: "lera-starters",
    code: "STARTERS",
    name: "LERA Starters",
    nameVi: "LERA Starters",
    description: "Introduction to English through songs, games, and interactive activities for young learners aged 2.5-4.",
    descriptionVi: "Làm quen tiếng Anh qua bài hát, trò chơi và hoạt động tương tác cho bé 2.5-4 tuổi.",
    ageFrom: 2.5,
    ageTo: 4,
    durationWeeks: 12,
    sessionsPerWeek: 2,
    maxClassSize: 8,
    level: "Beginner",
    levelVi: "Sơ cấp",
    color: "pink",
    icon: "🎨",
    curriculum: ["Alphabet and phonics", "Basic vocabulary", "Simple greetings", "Colors, numbers, shapes", "Interactive storytelling", "Arts and crafts"],
    curriculumVi: ["Bảng chữ cái và phát âm", "Từ vựng cơ bản", "Chào hỏi đơn giản", "Màu sắc, số đếm, hình dạng", "Kể chuyện tương tác", "Thủ công nghệ thuật"],
    benefits: ["Native teachers", "Small class sizes", "Fun learning environment", "Progress reports", "AI pronunciation practice"],
    benefitsVi: ["Giáo viên bản ngữ", "Lớp học nhỏ", "Môi trường vui vẻ", "Báo cáo tiến độ", "Luyện phát âm AI"]
  },
  "lera-explorers": {
    id: "lera-explorers",
    code: "EXPLORERS",
    name: "LERA Explorers",
    nameVi: "LERA Explorers",
    description: "Develop communication skills and expand vocabulary for children aged 5-6.",
    descriptionVi: "Phát triển kỹ năng giao tiếp và mở rộng từ vựng cho trẻ 5-6 tuổi.",
    ageFrom: 5,
    ageTo: 6,
    durationWeeks: 16,
    sessionsPerWeek: 2,
    maxClassSize: 10,
    level: "Elementary",
    levelVi: "Sơ cấp",
    color: "blue",
    icon: "🚀",
    curriculum: ["Vocabulary building", "Sentence construction", "Listening skills", "Basic reading", "Group activities", "Presentations"],
    curriculumVi: ["Mở rộng từ vựng", "Xây dựng câu", "Kỹ năng nghe", "Đọc cơ bản", "Hoạt động nhóm", "Thuyết trình"],
    benefits: ["Engaging methods", "Age-appropriate materials", "Digital tools", "Parent portal", "Fun games"],
    benefitsVi: ["Phương pháp hấp dẫn", "Tài liệu phù hợp độ tuổi", "Công cụ số", "Cổng phụ huynh", "Trò chơi vui"]
  },
  "lera-primary": {
    id: "lera-primary",
    code: "PRIMARY",
    name: "LERA Primary",
    nameVi: "LERA Primary",
    description: "Comprehensive English program for primary school students aged 7-10.",
    descriptionVi: "Chương trình tiếng Anh toàn diện cho học sinh tiểu học 7-10 tuổi.",
    ageFrom: 7,
    ageTo: 10,
    durationWeeks: 20,
    sessionsPerWeek: 3,
    maxClassSize: 12,
    level: "Elementary - Pre-Intermediate",
    levelVi: "Sơ cấp - Tiền trung cấp",
    color: "green",
    icon: "🏆",
    curriculum: ["Grammar fundamentals", "Reading comprehension", "Writing skills", "Conversation practice", "Topic vocabulary", "Cambridge YLE prep"],
    curriculumVi: ["Ngữ pháp cơ bản", "Đọc hiểu", "Kỹ năng viết", "Luyện hội thoại", "Từ vựng theo chủ đề", "Chuẩn bị Cambridge YLE"],
    benefits: ["School curriculum aligned", "Cambridge YLE prep", "Interactive platform", "Progress assessments", "Homework support"],
    benefitsVi: ["Phù hợp chương trình trường", "Chuẩn bị Cambridge YLE", "Nền tảng tương tác", "Đánh giá tiến độ", "Hỗ trợ bài tập"]
  },
  "lera-teens": {
    id: "lera-teens",
    code: "TEENS",
    name: "LERA Teens",
    nameVi: "LERA Teens",
    description: "Advanced English program for teenagers aged 11-14 focusing on academic English.",
    descriptionVi: "Chương trình tiếng Anh nâng cao cho thiếu niên 11-14 tuổi.",
    ageFrom: 11,
    ageTo: 14,
    durationWeeks: 24,
    sessionsPerWeek: 3,
    maxClassSize: 12,
    level: "Intermediate - Upper-Intermediate",
    levelVi: "Trung cấp - Trung cấp cao",
    color: "purple",
    icon: "🌍",
    curriculum: ["Academic writing", "Advanced grammar", "Reading strategies", "Critical thinking", "Debate skills", "Cambridge KET/PET"],
    curriculumVi: ["Viết học thuật", "Ngữ pháp nâng cao", "Chiến lược đọc", "Tư duy phản biện", "Kỹ năng tranh luận", "Cambridge KET/PET"],
    benefits: ["International exam prep", "Academic English", "Critical thinking", "Group projects", "Study abroad guidance"],
    benefitsVi: ["Chuẩn bị thi quốc tế", "Tiếng Anh học thuật", "Tư duy phản biện", "Dự án nhóm", "Hướng dẫn du học"]
  },
  "ielts-sat": {
    id: "ielts-sat",
    code: "IELTS_SAT",
    name: "IELTS & SAT",
    nameVi: "IELTS & SAT",
    description: "Intensive preparation for IELTS and SAT exams with comprehensive training.",
    descriptionVi: "Khóa luyện thi IELTS và SAT chuyên sâu với đào tạo toàn diện.",
    ageFrom: 15,
    ageTo: 99,
    durationWeeks: 16,
    sessionsPerWeek: 4,
    maxClassSize: 8,
    level: "Advanced",
    levelVi: "Nâng cao",
    color: "indigo",
    icon: "📚",
    curriculum: ["Test strategies", "Reading mastery", "Writing development", "Speaking/Listening", "Math (SAT)", "Mock tests"],
    curriculumVi: ["Chiến lược thi", "Thành thạo đọc", "Phát triển viết", "Nói/Nghe", "Toán (SAT)", "Thi thử"],
    benefits: ["Score improvement guarantee", "Experienced teachers", "Personalized plans", "Unlimited mock tests", "Free re-study"],
    benefitsVi: ["Cam kết cải thiện điểm", "Giáo viên kinh nghiệm", "Kế hoạch cá nhân", "Thi thử không giới hạn", "Học lại miễn phí"]
  },
  "business-english": {
    id: "business-english",
    code: "BUSINESS",
    name: "Business English",
    nameVi: "Tiếng Anh Thương mại",
    description: "Professional English for workplace communication and business correspondence.",
    descriptionVi: "Tiếng Anh chuyên nghiệp cho giao tiếp văn phòng và thư tín kinh doanh.",
    ageFrom: 18,
    ageTo: 99,
    durationWeeks: 12,
    sessionsPerWeek: 2,
    maxClassSize: 10,
    level: "Intermediate - Advanced",
    levelVi: "Trung cấp - Nâng cao",
    color: "violet",
    icon: "💼",
    curriculum: ["Business email", "Meeting skills", "Presentations", "Business vocabulary", "Cross-cultural communication", "Networking"],
    curriculumVi: ["Email kinh doanh", "Kỹ năng họp", "Thuyết trình", "Từ vựng kinh doanh", "Giao tiếp đa văn hóa", "Networking"],
    benefits: ["Real business scenarios", "Corporate experienced teachers", "Flexible scheduling", "Industry vocabulary", "Certificate"],
    benefitsVi: ["Tình huống thực tế", "Giáo viên doanh nghiệp", "Lịch linh hoạt", "Từ vựng ngành nghề", "Chứng chỉ"]
  }
};

export default function CourseDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { language } = useLanguage();
  const { getSetting } = useWebsiteSettings();
  const contactPhone = getSetting('contact_phone', '0387.633.141');
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", childName: "", age: "", website: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [course, setCourse] = useState<CourseData | null>(null);
  const [otherCourses, setOtherCourses] = useState<CourseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCourseData();
  }, [slug]);

  const fetchCourseData = async () => {
    try {
      // Try to fetch all courses from API
      const courses = await apiFetch("/api/courses/active").catch(() => []);
      
      if (Array.isArray(courses) && courses.length > 0) {
        // Find the current course by slug or code
        const courseCode = slugToCode[slug];
        const foundCourse = courses.find((c: any) => 
          c.code === courseCode || 
          c.id === slug || 
          c.code?.toLowerCase() === slug?.replace(/-/g, '_')
        );
        
        if (foundCourse) {
          // Map API data to our format
          const mappedCourse: CourseData = {
            id: slug,
            code: foundCourse.code,
            name: foundCourse.name,
            nameVi: foundCourse.nameVi || foundCourse.name,
            description: foundCourse.description,
            descriptionVi: foundCourse.descriptionVi || foundCourse.description,
            ageFrom: foundCourse.ageFrom,
            ageTo: foundCourse.ageTo,
            durationWeeks: foundCourse.durationWeeks || 12,
            sessionsPerWeek: foundCourse.sessionsPerWeek || 2,
            maxClassSize: foundCourse.maxClassSize || 12,
            level: foundCourse.level || "All levels",
            levelVi: foundCourse.levelVi || "Mọi trình độ",
            color: foundCourse.color || defaultCourseData[slug]?.color || "blue",
            icon: foundCourse.icon || defaultCourseData[slug]?.icon || "📚",
            curriculum: foundCourse.curriculum || defaultCourseData[slug]?.curriculum || [],
            curriculumVi: foundCourse.curriculumVi || defaultCourseData[slug]?.curriculumVi || [],
            benefits: foundCourse.benefits || defaultCourseData[slug]?.benefits || [],
            benefitsVi: foundCourse.benefitsVi || defaultCourseData[slug]?.benefitsVi || [],
            imageUrl: foundCourse.imageUrl
          };
          setCourse(mappedCourse);
          
          // Get other courses for recommendations
          const others = courses
            .filter((c: any) => c.code !== courseCode)
            .slice(0, 3)
            .map((c: any) => ({
              id: Object.entries(slugToCode).find(([_, code]) => code === c.code)?.[0] || c.code?.toLowerCase(),
              code: c.code,
              name: c.name,
              nameVi: c.nameVi || c.name,
              ageFrom: c.ageFrom,
              ageTo: c.ageTo,
              color: c.color || defaultCourseData[Object.entries(slugToCode).find(([_, code]) => code === c.code)?.[0] || ""]?.color || "blue",
              icon: c.icon || defaultCourseData[Object.entries(slugToCode).find(([_, code]) => code === c.code)?.[0] || ""]?.icon || "📚"
            }));
          setOtherCourses(others);
        } else {
          // Use default data if course not found in API
          setCourse(defaultCourseData[slug] || null);
          const others = Object.entries(defaultCourseData)
            .filter(([key]) => key !== slug)
            .slice(0, 3)
            .map(([_, c]) => c);
          setOtherCourses(others);
        }
      } else {
        // Use default data if API fails
        setCourse(defaultCourseData[slug] || null);
        const others = Object.entries(defaultCourseData)
          .filter(([key]) => key !== slug)
          .slice(0, 3)
          .map(([_, c]) => c);
        setOtherCourses(others);
      }
    } catch (error) {
      console.error("Error fetching course data:", error);
      setCourse(defaultCourseData[slug] || null);
    } finally {
      setIsLoading(false);
    }
  };

  const getAgeDisplay = (course: CourseData) => {
    if (course.ageRange) return course.ageRange;
    if (course.ageFrom && course.ageTo) {
      if (course.ageTo >= 99) return `${course.ageFrom}+`;
      return `${course.ageFrom}-${course.ageTo}`;
    }
    return "All ages";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="pt-32 pb-16 flex items-center justify-center">
          <div className="animate-pulse space-y-8 max-w-4xl w-full px-4">
            <div className="h-48 bg-gray-200 rounded-2xl"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Header />
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-gray-600 mb-8">{language === "EN" ? "Course not found" : "Không tìm thấy khóa học"}</p>
          <Link href="/courses" className="text-blue-600 font-semibold hover:underline">
            ← {language === "EN" ? "Back to Courses" : "Quay lại khóa học"}
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const leadData = {
        parentName: formData.name,
        parentPhone: formData.phone,
        parentEmail: formData.email,
        studentName: formData.childName,
        studentAge: formData.age ? parseInt(formData.age) : null,
        notes: `[Trial / placement funnel] Course: ${language === "EN" ? course.name : course.nameVi} (${getAgeDisplay(course)} years)`,
        utmSource: TRIAL_BOOKING_LEAD_CONTEXT.utmSource,
        utmMedium: TRIAL_BOOKING_LEAD_CONTEXT.utmMedium,
        utmCampaign: slug,
        website: formData.website,
      };
      
      await apiFetch("/api/public/leads", {
        method: "POST",
        body: JSON.stringify(leadData)
      });
      
      setSubmitted(true);
      setFormData({ name: "", phone: "", email: "", childName: "", age: "", website: "" });
    } catch (err) {
      console.error("Error submitting course registration:", err);
      alert(language === "EN" ? "Registration failed. Please try again." : "Đăng ký thất bại. Vui lòng thử lại.");
    }
    setIsSubmitting(false);
  };

  const colorClasses: Record<string, string> = {
    pink: "from-pink-500 to-pink-600",
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    indigo: "from-indigo-500 to-indigo-600",
    violet: "from-violet-500 to-violet-600",
  };

  const bgClasses: Record<string, string> = {
    pink: "bg-pink-500",
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    indigo: "bg-indigo-600",
    violet: "bg-violet-600",
  };

  const courseColor = course.color || "blue";
  const curriculum = language === "EN" ? (course.curriculum || []) : (course.curriculumVi || course.curriculum || []);
  const benefits = language === "EN" ? (course.benefits || []) : (course.benefitsVi || course.benefits || []);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className={`pt-32 pb-16 bg-gradient-to-br ${colorClasses[courseColor] || colorClasses.blue} text-white`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/courses" className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors">
            ← {language === "EN" ? "Back to Courses" : "Quay lại khóa học"}
          </Link>
          <div className="flex items-center gap-6">
            <div className="text-8xl">{course.icon || "📚"}</div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-2">
                {language === "EN" ? course.name : (course.nameVi || course.name)}
              </h1>
              <p className="text-xl text-white/90">
                {language === "EN" ? `Ages ${getAgeDisplay(course)}` : `${getAgeDisplay(course)} tuổi`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Course Details */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Description */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {language === "EN" ? "About This Course" : "Về khóa học này"}
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {language === "EN" ? course.description : (course.descriptionVi || course.description)}
                </p>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">📅</div>
                  <div className="text-2xl font-bold text-gray-900">{course.durationWeeks || 12}</div>
                  <div className="text-sm text-gray-500">{language === "EN" ? "Weeks" : "Tuần"}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">⏰</div>
                  <div className="text-2xl font-bold text-gray-900">{course.sessionsPerWeek || 2}</div>
                  <div className="text-sm text-gray-500">{language === "EN" ? "Sessions/week" : "Buổi/tuần"}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">👥</div>
                  <div className="text-2xl font-bold text-gray-900">{course.maxClassSize || 12}</div>
                  <div className="text-sm text-gray-500">{language === "EN" ? "Max students" : "Học viên tối đa"}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">📊</div>
                  <div className="text-lg font-bold text-gray-900">{language === "EN" ? course.level : (course.levelVi || course.level)}</div>
                  <div className="text-sm text-gray-500">{language === "EN" ? "Level" : "Trình độ"}</div>
                </div>
              </div>

              {/* Curriculum */}
              {curriculum.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {language === "EN" ? "What You'll Learn" : "Bạn sẽ học được gì"}
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {curriculum.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 bg-gray-50 rounded-lg p-4">
                        <span className="text-green-500 text-xl">✓</span>
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Benefits */}
              {benefits.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {language === "EN" ? "Why Choose This Course" : "Tại sao chọn khóa học này"}
                  </h2>
                  <div className="space-y-4">
                    {benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-4 border border-gray-100 rounded-xl hover:border-blue-200 transition-colors">
                        <div className={`w-10 h-10 rounded-full ${bgClasses[courseColor] || bgClasses.blue} flex items-center justify-center text-white font-bold`}>
                          {idx + 1}
                        </div>
                        <p className="text-gray-700 pt-2">{benefit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Registration Form */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-8 sticky top-28">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  {language === "EN" ? "Register for Free Trial" : "Đăng ký học thử miễn phí"}
                </h3>

                {submitted ? (
                  <div className="text-center py-8">
                    <div className="text-5xl mb-4">🎉</div>
                    <h4 className="text-xl font-bold text-green-600 mb-2">
                      {language === "EN" ? "Registration Successful!" : "Đăng ký thành công!"}
                    </h4>
                    <p className="text-gray-600">
                      {language === "EN" 
                        ? "We will contact you within 24 hours."
                        : "Chúng tôi sẽ liên hệ bạn trong 24 giờ."}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
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
                        placeholder={language === "EN" ? "Parent's name *" : "Tên phụ huynh *"}
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        placeholder={language === "EN" ? "Phone number *" : "Số điện thoại *"}
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder={language === "EN" ? "Child's name" : "Tên con"}
                        value={formData.childName}
                        onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder={language === "EN" ? "Child's age" : "Tuổi con"}
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full py-4 rounded-lg font-semibold text-white transition-all ${
                        isSubmitting
                          ? "bg-gray-400 cursor-not-allowed"
                          : `bg-gradient-to-r ${colorClasses[courseColor] || colorClasses.blue} hover:shadow-lg hover:scale-105`
                      }`}
                    >
                      {isSubmitting
                        ? (language === "EN" ? "Submitting..." : "Đang gửi...")
                        : (language === "EN" ? "Register Now" : "Đăng ký ngay")}
                    </button>
                  </form>
                )}

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <span>📞</span>
                    <span className="font-semibold">{contactPhone}</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {language === "EN" ? "Call us for immediate assistance" : "Gọi ngay để được tư vấn"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Other Courses */}
      {otherCourses.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              {language === "EN" ? "Other Courses You Might Like" : "Các khóa học khác có thể phù hợp"}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {otherCourses.map((c) => {
                const cColor = c.color || "blue";
                const cAge = c.ageFrom && c.ageTo ? (c.ageTo >= 99 ? `${c.ageFrom}+` : `${c.ageFrom}-${c.ageTo}`) : "All ages";
                return (
                  <Link key={c.id} href={`/courses/${c.id}`} className="group">
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      <div className={`h-32 ${bgClasses[cColor] || bgClasses.blue} flex items-center justify-center`}>
                        <span className="text-5xl group-hover:scale-110 transition-transform">{c.icon || "📚"}</span>
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-gray-900 mb-1">{language === "EN" ? c.name : (c.nameVi || c.name)}</h3>
                        <p className="text-sm text-gray-500">{cAge} {language === "EN" ? "years old" : "tuổi"}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
