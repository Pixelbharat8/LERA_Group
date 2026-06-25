"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "../context/LanguageContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { publicFetch } from "../../lib/api";

interface Course {
  code: string;
  name: string;
  nameVi?: string;
  ageFrom?: number;
  ageTo?: number;
  level?: string;
  price?: number;
  sessionsPerWeek?: number;
  maxClassSize?: number;
  isActive?: boolean;
  category?: string;
  displayOrder?: number;
}

const CODE_TO_SLUG: Record<string, string> = {
  STARTERS: "lera-starters", EXPLORERS: "lera-explorers", PRIMARY: "lera-primary",
  TEENS: "lera-teens", IELTS_SAT: "ielts-sat", BUSINESS: "business-english",
  CONVERSATION: "conversation", PHONICS: "phonics",
};

const fmt = (n?: number) => (n == null ? "" : new Intl.NumberFormat("vi-VN").format(n) + "₫");
const ageLabel = (c: Course, en: boolean) => {
  if (c.ageFrom == null) return en ? "All ages" : "Mọi lứa tuổi";
  if ((c.ageTo ?? 99) >= 99) return en ? `${c.ageFrom}+` : `${c.ageFrom}+`;
  return `${c.ageFrom}–${c.ageTo}`;
};

export default function PricingPage() {
  const { language } = useLanguage();
  const EN = language === "EN";
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await publicFetch("/api/courses/active");
        const list = (Array.isArray(data) ? data : [])
          .filter((c: Course) => c.isActive !== false && c.price != null)
          .sort((a: Course, b: Course) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || (a.ageFrom ?? 0) - (b.ageFrom ?? 0));
        setCourses(list);
      } catch {
        setCourses([]);
      }
      setLoading(false);
    })();
  }, []);

  const included = EN
    ? ["Small classes (≤12 students)", "Cambridge-aligned curriculum & materials", "Native & qualified teachers", "Termly progress reports", "A free trial lesson before you enrol"]
    : ["Lớp nhỏ (≤12 học viên)", "Chương trình & giáo trình chuẩn Cambridge", "Giáo viên bản ngữ & đạt chuẩn", "Báo cáo tiến độ mỗi khoá", "Một buổi học thử miễn phí trước khi đăng ký"];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <span className="inline-block px-4 py-2 bg-white/15 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
            {EN ? "💳 Transparent pricing" : "💳 Học phí minh bạch"}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {EN ? "Tuition & Programmes" : "Học phí & Chương trình"}
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            {EN
              ? "Clear monthly tuition for every programme. No hidden fees — and every course starts with a free trial."
              : "Học phí hàng tháng rõ ràng cho mọi chương trình. Không phí ẩn — và mọi khoá học đều bắt đầu bằng buổi học thử miễn phí."}
          </p>
        </div>
      </section>

      {/* Pricing table */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          ) : courses.length === 0 ? (
            <p className="text-center text-gray-500">{EN ? "Pricing is being updated — please contact us." : "Học phí đang được cập nhật — vui lòng liên hệ."}</p>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-600 text-sm">
                    <tr>
                      <th className="px-5 py-4 font-semibold">{EN ? "Programme" : "Chương trình"}</th>
                      <th className="px-5 py-4 font-semibold">{EN ? "Ages" : "Độ tuổi"}</th>
                      <th className="px-5 py-4 font-semibold hidden sm:table-cell">{EN ? "Level" : "Trình độ"}</th>
                      <th className="px-5 py-4 font-semibold hidden md:table-cell">{EN ? "Schedule" : "Lịch học"}</th>
                      <th className="px-5 py-4 font-semibold hidden md:table-cell">{EN ? "Class size" : "Sĩ số"}</th>
                      <th className="px-5 py-4 font-semibold text-right">{EN ? "Tuition / month" : "Học phí / tháng"}</th>
                      <th className="px-5 py-4" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {courses.map((c) => (
                      <tr key={c.code} className="hover:bg-gray-50">
                        <td className="px-5 py-4 font-semibold text-gray-900">{EN ? c.name : (c.nameVi || c.name)}</td>
                        <td className="px-5 py-4 text-gray-600">{ageLabel(c, EN)}</td>
                        <td className="px-5 py-4 text-gray-600 hidden sm:table-cell">{c.level || "—"}</td>
                        <td className="px-5 py-4 text-gray-600 hidden md:table-cell">
                          {c.sessionsPerWeek ? `${c.sessionsPerWeek}× / ${EN ? "week" : "tuần"}` : "—"}
                        </td>
                        <td className="px-5 py-4 text-gray-600 hidden md:table-cell">{c.maxClassSize ? `≤${c.maxClassSize}` : "—"}</td>
                        <td className="px-5 py-4 text-right font-bold text-[#0a1a5c] whitespace-nowrap">{fmt(c.price)}</td>
                        <td className="px-5 py-4 text-right">
                          <Link href={`/courses/${CODE_TO_SLUG[c.code] || ""}`} className="text-blue-600 font-semibold hover:text-blue-700 whitespace-nowrap">
                            {EN ? "Details →" : "Chi tiết →"}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-500 mt-4 text-center">
            {EN
              ? "Tuition shown is the standard monthly fee per programme. Sibling and multi-course discounts may apply — ask us."
              : "Học phí hiển thị là mức tháng tiêu chuẩn cho mỗi chương trình. Có thể áp dụng ưu đãi cho anh chị em hoặc nhiều khoá — hãy hỏi chúng tôi."}
          </p>
        </div>
      </section>

      {/* What's included */}
      <section className="pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              {EN ? "Every programme includes" : "Mọi chương trình đều bao gồm"}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {included.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {EN ? "Try before you enrol" : "Học thử trước khi đăng ký"}
          </h2>
          <p className="text-white/80 mb-8">
            {EN ? "Book a free trial lesson — no commitment." : "Đặt buổi học thử miễn phí — không ràng buộc."}
          </p>
          <Link href="/book-trial" className="inline-block px-8 py-4 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-300 transition-colors">
            {EN ? "Book a free trial →" : "Đăng ký học thử →"}
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
