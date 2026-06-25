"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "../context/LanguageContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { publicFetch } from "../../lib/api";
import { HERO_IMAGES } from "../../config/images";

interface PublicTeacher {
  id: string;
  displayName?: string;
  displayNameVi?: string;
  photoUrl?: string;
  specialization?: string;
  qualification?: string;
  yearsOfExperience?: number;
  nationality?: string;
  isNativeSpeaker?: boolean;
  isFeatured?: boolean;
  bio?: string;
  bioVi?: string;
}

function initials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] || "?").toUpperCase();
}

export default function TeachersPage() {
  const { language } = useLanguage();
  const [teachers, setTeachers] = useState<PublicTeacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await publicFetch("/api/teachers/public");
        // Only show teachers with a real public name — no half-built/placeholder profiles.
        const named = Array.isArray(data) ? data.filter((t: PublicTeacher) => t.displayName && t.displayName.trim()) : [];
        setTeachers(named);
      } catch {
        setTeachers([]);
      }
      setIsLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: `url('${HERO_IMAGES.home}')` }} />
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <span className="inline-block px-4 py-2 bg-white/20 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
            {language === "VI" ? "👩‍🏫 Đội ngũ giáo viên" : "👩‍🏫 Our Teachers"}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {language === "VI" ? "Gặp gỡ giáo viên của chúng tôi" : "Meet Our Teachers"}
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            {language === "VI"
              ? "Giáo viên đạt chuẩn quốc tế, bản ngữ và giàu kinh nghiệm — dạy lớp nhỏ để mỗi học viên đều được quan tâm."
              : "Internationally-qualified, native and experienced teachers — teaching small classes so every learner is heard."}
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          ) : teachers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👩‍🏫</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {language === "VI" ? "Đang cập nhật" : "Coming soon"}
              </h3>
              <p className="text-gray-600">
                {language === "VI" ? "Hồ sơ giáo viên sẽ sớm được cập nhật." : "Teacher profiles will be published shortly."}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {teachers.map((tch) => {
                const name = (language === "VI" && tch.displayNameVi) ? tch.displayNameVi : tch.displayName;
                const bio = (language === "VI" && tch.bioVi) ? tch.bioVi : tch.bio;
                return (
                  <div key={tch.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 h-28 relative">
                      <div className="absolute -bottom-10 left-6">
                        {tch.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={tch.photoUrl} alt={name} className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md" />
                        ) : (
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 border-4 border-white shadow-md flex items-center justify-center text-white text-2xl font-bold">
                            {initials(name)}
                          </div>
                        )}
                      </div>
                      {tch.isFeatured && (
                        <span className="absolute top-3 right-3 bg-yellow-400 text-gray-900 text-xs px-2 py-1 rounded-full font-bold">
                          ⭐ {language === "VI" ? "Nổi bật" : "Featured"}
                        </span>
                      )}
                    </div>
                    <div className="pt-12 px-6 pb-6">
                      <h3 className="text-xl font-bold text-gray-900">{name}</h3>
                      {tch.specialization && (
                        <p className="text-blue-600 font-medium text-sm mt-0.5">{tch.specialization}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {tch.isNativeSpeaker && (
                          <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">
                            {language === "VI" ? "Bản ngữ" : "Native speaker"}
                          </span>
                        )}
                        {tch.nationality && (
                          <span className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full font-medium">
                            {tch.nationality}
                          </span>
                        )}
                        {tch.yearsOfExperience ? (
                          <span className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full font-medium">
                            {tch.yearsOfExperience}+ {language === "VI" ? "năm KN" : "yrs"}
                          </span>
                        ) : null}
                      </div>
                      {tch.qualification && (
                        <p className="text-xs text-gray-500 mt-3">
                          <span className="font-semibold">{language === "VI" ? "Bằng cấp: " : "Qualifications: "}</span>
                          {tch.qualification}
                        </p>
                      )}
                      {bio && <p className="text-gray-600 text-sm mt-3 line-clamp-4">{bio}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {language === "VI" ? "Học thử miễn phí với giáo viên của chúng tôi" : "Try a free lesson with our teachers"}
          </h2>
          <p className="text-white/80 mb-8">
            {language === "VI"
              ? "Đặt buổi học thử để gặp giáo viên và trải nghiệm lớp học thật."
              : "Book a free trial to meet a teacher and experience a real class."}
          </p>
          <Link href="/book-trial" className="inline-block px-8 py-4 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-300 transition-colors">
            {language === "VI" ? "Đăng ký học thử →" : "Book a free trial →"}
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
