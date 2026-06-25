"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { publicFetch } from "../../lib/api";
import { HERO_IMAGES } from "../../config/images";

// Types for dynamic content
interface Leader {
  id: string;
  name: string;
  nameVi?: string;
  role: string;
  roleVi?: string;
  image?: string;
  bio?: string;
  bioVi?: string;
  order?: number;
}

interface Stats {
  students: string;
  teachers: string;
  centers: string;
  satisfaction: string;
}

interface AboutContent {
  heroTitle: { EN: string; VI: string };
  heroDesc: { EN: string; VI: string };
  story: { EN: string; VI: string };
  storyDesc: { EN: string; VI: string };
  mission: { EN: string; VI: string };
  missionDesc: { EN: string; VI: string };
  vision: { EN: string; VI: string };
  visionDesc: { EN: string; VI: string };
}

// Default content
const defaultContent: AboutContent = {
  heroTitle: { EN: "About LERA Academy", VI: "Về LERA Academy" },
  heroDesc: { EN: "Empowering learners with English skills for global success", VI: "Trao quyền cho người học với kỹ năng tiếng Anh để thành công toàn cầu" },
  story: { EN: "Our Story", VI: "Câu chuyện của chúng tôi" },
  storyDesc: { EN: "Founded in 2020, LERA Academy has been dedicated to providing high-quality English education combining modern AI technology with experienced native teachers.", VI: "Được thành lập năm 2020, LERA Academy đã cống hiến cho việc cung cấp giáo dục tiếng Anh chất lượng cao kết hợp công nghệ AI hiện đại với giáo viên bản ngữ giàu kinh nghiệm." },
  mission: { EN: "Our Mission", VI: "Sứ mệnh của chúng tôi" },
  missionDesc: { EN: "To make English learning accessible, engaging, and effective for learners of all ages through innovative teaching methods.", VI: "Làm cho việc học tiếng Anh trở nên dễ tiếp cận, hấp dẫn và hiệu quả cho người học ở mọi lứa tuổi thông qua các phương pháp giảng dạy sáng tạo." },
  vision: { EN: "Our Vision", VI: "Tầm nhìn của chúng tôi" },
  visionDesc: { EN: "To become the leading English education center in Vietnam, nurturing confident global citizens.", VI: "Trở thành trung tâm giáo dục tiếng Anh hàng đầu Việt Nam, nuôi dưỡng công dân toàn cầu tự tin." },
};

// Real leadership only — populated from /api/leadership-members/public. No fabricated execs;
// the section hides when there is no real data to show.
const defaultLeaders: Leader[] = [];

// Quality-led, boutique-honest tiles (no fabricated scale). CMS-overridable.
const defaultStats: Stats = {
  students: "≤12",
  teachers: "100%",
  centers: "Cambridge",
  satisfaction: "2.5+"
};

export default function AboutPage() {
  const { language, t } = useLanguage();
  const [content, setContent] = useState<AboutContent>(defaultContent);
  const [leaders, setLeaders] = useState<Leader[]>(defaultLeaders);
  const [stats, setStats] = useState<Stats>(defaultStats);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dynamic content
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch CMS settings for about page
        const cmsData = await publicFetch("/api/cms-settings/map/about");
        if (cmsData && typeof cmsData === 'object') {
          setContent({
            heroTitle: {
              EN: cmsData.about_hero_title_en || defaultContent.heroTitle.EN,
              VI: cmsData.about_hero_title_vi || defaultContent.heroTitle.VI
            },
            heroDesc: {
              EN: cmsData.about_hero_desc_en || defaultContent.heroDesc.EN,
              VI: cmsData.about_hero_desc_vi || defaultContent.heroDesc.VI
            },
            story: {
              EN: cmsData.about_story_title_en || defaultContent.story.EN,
              VI: cmsData.about_story_title_vi || defaultContent.story.VI
            },
            storyDesc: {
              EN: cmsData.about_story_desc_en || defaultContent.storyDesc.EN,
              VI: cmsData.about_story_desc_vi || defaultContent.storyDesc.VI
            },
            mission: {
              EN: cmsData.about_mission_title_en || defaultContent.mission.EN,
              VI: cmsData.about_mission_title_vi || defaultContent.mission.VI
            },
            missionDesc: {
              EN: cmsData.about_mission_desc_en || defaultContent.missionDesc.EN,
              VI: cmsData.about_mission_desc_vi || defaultContent.missionDesc.VI
            },
            vision: {
              EN: cmsData.about_vision_title_en || defaultContent.vision.EN,
              VI: cmsData.about_vision_title_vi || defaultContent.vision.VI
            },
            visionDesc: {
              EN: cmsData.about_vision_desc_en || defaultContent.visionDesc.EN,
              VI: cmsData.about_vision_desc_vi || defaultContent.visionDesc.VI
            }
          });

          // Update stats from CMS
          setStats({
            students: cmsData.stats_students || defaultStats.students,
            teachers: cmsData.stats_teachers || defaultStats.teachers,
            centers: cmsData.stats_centers || defaultStats.centers,
            satisfaction: cmsData.stats_satisfaction || defaultStats.satisfaction
          });
        }
      } catch (error) {
        console.log("Using default about content");
      }

      try {
        // Fetch leadership team from new leadership-members endpoint
        const leadersData = await publicFetch("/api/leadership-members/public");
        if (Array.isArray(leadersData) && leadersData.length > 0) {
          setLeaders(leadersData.map((l: any) => ({
            id: l.id,
            name: l.name,
            nameVi: l.nameVi || l.name,
            role: l.role || l.position,
            roleVi: l.roleVi || l.positionVi || l.role,
            image: l.imageUrl || l.avatar || "📷",
            bio: l.bio,
            bioVi: l.bioVi,
            order: l.displayOrder || 0
          })).sort((a: Leader, b: Leader) => (a.order || 0) - (b.order || 0)));
        }
      } catch (error) {
        console.log("Using default leaders");
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{backgroundImage: `url('${HERO_IMAGES.about}')`}}></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            {language === "EN" ? content.heroTitle.EN : content.heroTitle.VI}
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            {language === "EN" ? content.heroDesc.EN : content.heroDesc.VI}
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl hover:shadow-lg transition-shadow">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📖</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {language === "EN" ? content.story.EN : content.story.VI}
              </h3>
              <p className="text-gray-600">
                {language === "EN" ? content.storyDesc.EN : content.storyDesc.VI}
              </p>
            </div>
            <div className="text-center p-8 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl hover:shadow-lg transition-shadow">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🎯</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {language === "EN" ? content.mission.EN : content.mission.VI}
              </h3>
              <p className="text-gray-600">
                {language === "EN" ? content.missionDesc.EN : content.missionDesc.VI}
              </p>
            </div>
            <div className="text-center p-8 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl hover:shadow-lg transition-shadow">
              <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🌟</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {language === "EN" ? content.vision.EN : content.vision.VI}
              </h3>
              <p className="text-gray-600">
                {language === "EN" ? content.visionDesc.EN : content.visionDesc.VI}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Dynamic */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="p-6 bg-white rounded-2xl shadow-md">
              <p className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">{stats.students}</p>
              <p className="text-gray-600">{language === "EN" ? "Students per class" : "Học viên mỗi lớp"}</p>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-md">
              <p className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">{stats.teachers}</p>
              <p className="text-gray-600">{language === "EN" ? "Qualified teachers" : "Giáo viên đạt chuẩn"}</p>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-md">
              <p className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">{stats.centers}</p>
              <p className="text-gray-600">{language === "EN" ? "Aligned curriculum" : "Chương trình chuẩn"}</p>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-md">
              <p className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">{stats.satisfaction}</p>
              <p className="text-gray-600">{language === "EN" ? "Welcoming ages from" : "Đón nhận từ độ tuổi"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Section — shown only when real leadership data exists */}
      {(isLoading || leaders.length > 0) && (
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {language === "EN" ? "Leadership Team" : "Đội ngũ lãnh đạo"}
          </h2>
          {isLoading ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center p-8 bg-white rounded-2xl shadow-lg animate-pulse">
                  <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-6"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {leaders.map((leader) => (
                <div key={leader.id} className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6 overflow-hidden">
                    {leader.image?.startsWith('http') ? (
                      <img src={leader.image} alt={leader.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-6xl">{leader.image || "👤"}</span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{leader.name}</h3>
                  <p className="text-blue-600">{language === "EN" ? leader.role : (leader.roleVi || leader.role)}</p>
                  {leader.bio && (
                    <p className="text-gray-500 text-sm mt-3">
                      {language === "EN" ? leader.bio : (leader.bioVi || leader.bio)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {language === "EN" ? "Join Our Learning Community" : "Tham gia cộng đồng học tập của chúng tôi"}
          </h2>
          <p className="text-xl text-white/90 mb-8">
            {language === "EN" ? "Start your English journey with LERA Academy today!" : "Bắt đầu hành trình tiếng Anh của bạn với LERA Academy ngay hôm nay!"}
          </p>
          <a 
            href="/"
            className="inline-block px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-gray-100 transition-colors"
          >
            {language === "EN" ? "Register Now →" : "Đăng ký ngay →"}
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
