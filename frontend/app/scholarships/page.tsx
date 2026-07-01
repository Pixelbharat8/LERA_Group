"use client";

import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useLanguage } from "../context/LanguageContext";
import { usePageContent } from "@/hooks/usePageContent";

/**
 * Public Scholarships page — the "Scholarship this month" CTA lands here. Fully CMS-editable
 * from Dashboard → Chairman → Website Content → Scholarships (category `scholarships`).
 */
export default function ScholarshipsPage() {
  const { language } = useLanguage();
  const EN = language !== "VI";
  const { c } = usePageContent("scholarships");

  const benefits = [
    c("benefit1", EN ? "Up to 50% off tuition for qualifying students" : "Giảm tới 50% học phí cho học viên đủ điều kiện"),
    c("benefit2", EN ? "Free placement test & learning consultation" : "Kiểm tra trình độ & tư vấn học tập miễn phí"),
    c("benefit3", EN ? "Priority enrolment into small Cambridge-aligned classes" : "Ưu tiên ghi danh lớp nhỏ theo chuẩn Cambridge"),
  ];
  const steps = [
    c("step1", EN ? "Register your interest below or book a free trial." : "Đăng ký quan tâm bên dưới hoặc đặt học thử miễn phí."),
    c("step2", EN ? "Take a short placement assessment at the centre." : "Làm bài kiểm tra xếp lớp ngắn tại trung tâm."),
    c("step3", EN ? "Receive your scholarship offer within 3 working days." : "Nhận suất học bổng trong vòng 3 ngày làm việc."),
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="bg-brand-navy text-[color:var(--brand-on-primary)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 text-center">
          <p className="text-sm font-semibold tracking-wider uppercase text-[color:var(--brand-on-primary-soft)] mb-3">
            {c("eyebrow", EN ? "LERA Scholarships" : "Học bổng LERA")}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight mb-5">
            {c("title", EN ? "Scholarship This Month" : "Học bổng tháng này")}
          </h1>
          <p className="text-lg text-[color:var(--brand-on-primary-soft)] max-w-2xl mx-auto leading-relaxed">
            {c("subtitle", EN
              ? "We set aside a limited number of scholarships each month for motivated learners. Apply today — places are limited."
              : "Mỗi tháng LERA dành một số suất học bổng cho học viên có động lực. Đăng ký ngay — số lượng có hạn.")}
          </p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Link href="/book-trial" className="btn-primary">
              {c("cta_label", EN ? "Apply / Book a free trial" : "Đăng ký / Đặt học thử")}
            </Link>
            <Link href="/contact" className="btn-secondary">
              {c("cta_secondary", EN ? "Ask a question" : "Đặt câu hỏi")}
            </Link>
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center mb-10">
            {c("benefits_title", EN ? "What the scholarship includes" : "Học bổng bao gồm")}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <div key={i} className="card-premium p-6 text-center">
                <div className="text-3xl mb-3">🎓</div>
                <p className="text-gray-700 leading-relaxed">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eligibility + How to apply */}
      <section className="py-16 sm:py-20 bg-mist">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="section-title mb-4">{c("eligibility_title", EN ? "Who can apply" : "Ai có thể đăng ký")}</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {c("eligibility", EN
                ? "New and current students aged 5–18, and adult learners preparing for IELTS/SAT. Priority is given to students who demonstrate commitment and financial need."
                : "Học viên mới và hiện tại từ 5–18 tuổi, và người lớn ôn luyện IELTS/SAT. Ưu tiên học viên có tinh thần cầu tiến và hoàn cảnh khó khăn.")}
            </p>
          </div>
          <div>
            <h2 className="section-title mb-4">{c("how_title", EN ? "How to apply" : "Cách đăng ký")}</h2>
            <ol className="space-y-4">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-brand-navy text-[color:var(--brand-on-primary)] flex items-center justify-center text-sm font-bold">{i + 1}</span>
                  <span className="text-gray-700 leading-relaxed">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-16 bg-brand-navy text-[color:var(--brand-on-primary)]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold mb-4">
            {c("footer_cta_title", EN ? "Ready to apply?" : "Sẵn sàng đăng ký?")}
          </h2>
          <p className="text-[color:var(--brand-on-primary-soft)] mb-8">
            {c("footer_cta_desc", EN ? "Places are limited each month — secure yours now." : "Số suất mỗi tháng có hạn — đăng ký ngay hôm nay.")}
          </p>
          <Link href="/book-trial" className="btn-primary">
            {c("cta_label", EN ? "Apply / Book a free trial" : "Đăng ký / Đặt học thử")}
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
