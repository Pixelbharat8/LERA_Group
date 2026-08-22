"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ConsentCheckbox from "../components/ConsentCheckbox";
import { useLanguage } from "../context/LanguageContext";
import { publicFetch } from "../../lib/api";
import { usePageContent } from "@/hooks/usePageContent";
import { CORPORATE_LEAD_CONTEXT } from "../../lib/english-centre-vertical-scope";

export default function CorporatePage() {
  const { language } = useLanguage();
  const EN = language === "EN";
  const { c } = usePageContent("corporate"); // editable in Chairman → Website Content → Corporate
  const [form, setForm] = useState({
    company: "",
    contactName: "",
    phone: "",
    email: "",
    teamSize: "",
    focus: "",
    message: "",
    website: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [consent, setConsent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const note =
        `[Corporate / B2B] Company: ${form.company.trim() || "—"}` +
        ` | Team size: ${form.teamSize || "—"}` +
        ` | Focus: ${form.focus || "—"}` +
        (form.message.trim() ? ` | Notes: ${form.message.trim()}` : "");
      await publicFetch("/api/public/leads", {
        method: "POST",
        body: JSON.stringify({
          parentName: form.contactName.trim() || form.company.trim(),
          parentPhone: form.phone.trim(),
          parentEmail: form.email.trim() || undefined,
          notes: note,
          utmSource: CORPORATE_LEAD_CONTEXT.utmSource,
          utmMedium: CORPORATE_LEAD_CONTEXT.utmMedium,
          utmCampaign: CORPORATE_LEAD_CONTEXT.utmCampaign,
          website: form.website,
        }),
      });
      setDone(true);
      setForm({ company: "", contactName: "", phone: "", email: "", teamSize: "", focus: "", message: "", website: "" });
    } catch {
      alert(EN ? "Something went wrong. Please try again." : "Đã có lỗi. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const focusOptions = EN
    ? ["General Business English", "Communication & Presentations", "IELTS / exam prep for staff", "Industry-specific English", "Other"]
    : ["Tiếng Anh thương mại tổng quát", "Giao tiếp & thuyết trình", "Luyện thi IELTS cho nhân viên", "Tiếng Anh chuyên ngành", "Khác"];

  const benefits = [
    {
      icon: "🏢",
      title: c("benefit1_title", EN ? "On-site or at our centre" : "Tại văn phòng hoặc tại trung tâm"),
      desc: c("benefit1_desc", EN ? "Flexible delivery — we come to your office or host your team at LERA." : "Linh hoạt — chúng tôi đến văn phòng bạn hoặc đón đội ngũ tại LERA."),
    },
    {
      icon: "🎯",
      title: c("benefit2_title", EN ? "Tailored to your goals" : "Thiết kế theo mục tiêu"),
      desc: c("benefit2_desc", EN ? "A needs analysis shapes a programme around your team's real tasks." : "Phân tích nhu cầu để xây chương trình quanh công việc thực tế của đội ngũ."),
    },
    {
      icon: "📊",
      title: c("benefit3_title", EN ? "Progress reporting" : "Báo cáo tiến độ"),
      desc: c("benefit3_desc", EN ? "Regular reports so HR can see attendance and measurable improvement." : "Báo cáo định kỳ để HR thấy chuyên cần và tiến bộ đo lường được."),
    },
    {
      icon: "👩‍🏫",
      title: c("benefit4_title", EN ? "Qualified teachers" : "Giáo viên đạt chuẩn"),
      desc: c("benefit4_desc", EN ? "Native and CELTA/TESOL-qualified teachers experienced with professionals." : "Giáo viên bản ngữ và đạt chuẩn CELTA/TESOL, quen làm việc với người đi làm."),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-brand-navy via-blue-800 to-blue-700 text-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <span className="inline-block px-4 py-2 bg-white/15 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
            {c("hero_badge", EN ? "🏢 Corporate training" : "🏢 Đào tạo doanh nghiệp")}
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
            {c("hero_title", EN ? "English training for your team" : "Đào tạo tiếng Anh cho doanh nghiệp")}
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            {c("hero_subtitle", EN
              ? "Tailored Business English programmes for companies in Hải Phòng — delivered on-site or at our centre, built around your team's goals."
              : "Chương trình tiếng Anh thương mại thiết kế riêng cho doanh nghiệp tại Hải Phòng — dạy tại văn phòng hoặc tại trung tâm, theo mục tiêu của đội ngũ bạn.")}
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="text-3xl mb-3">{b.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{b.title}</h3>
                <p className="text-gray-600 text-sm">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inquiry form */}
      <section className="pb-20">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {c("form_title", EN ? "Request a corporate proposal" : "Yêu cầu đề xuất cho doanh nghiệp")}
            </h2>
            <p className="text-gray-600 mb-6">
              {c("form_subtitle", EN
                ? "Tell us about your team and we'll prepare a tailored proposal and quote."
                : "Cho chúng tôi biết về đội ngũ của bạn, chúng tôi sẽ chuẩn bị đề xuất và báo giá phù hợp.")}
            </p>

            {done ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6 text-emerald-900">
                {c("success_msg", EN
                  ? "Thank you! Our team will contact you to discuss a tailored programme."
                  : "Cảm ơn bạn! Đội ngũ của chúng tôi sẽ liên hệ để trao đổi chương trình phù hợp.")}
                <div className="mt-4">
                  <Link href="/" className="text-emerald-700 font-semibold underline">
                    {EN ? "Back to home" : "Về trang chủ"}
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                {/* honeypot */}
                <input
                  type="text"
                  name="website"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {EN ? "Company name *" : "Tên công ty *"}
                  </label>
                  <input required className="w-full px-4 py-2 border rounded-lg"
                    value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {EN ? "Contact name *" : "Người liên hệ *"}
                    </label>
                    <input required className="w-full px-4 py-2 border rounded-lg"
                      value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {EN ? "Phone *" : "Điện thoại *"}
                    </label>
                    <input required className="w-full px-4 py-2 border rounded-lg"
                      value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" className="w-full px-4 py-2 border rounded-lg"
                      value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {EN ? "Approx. team size" : "Quy mô đội ngũ"}
                    </label>
                    <input type="number" min={1} className="w-full px-4 py-2 border rounded-lg"
                      placeholder={EN ? "e.g. 15" : "VD: 15"}
                      value={form.teamSize} onChange={(e) => setForm({ ...form, teamSize: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {EN ? "Training focus" : "Trọng tâm đào tạo"}
                  </label>
                  <select className="w-full px-4 py-2 border rounded-lg bg-white"
                    value={form.focus} onChange={(e) => setForm({ ...form, focus: e.target.value })}>
                    <option value="">{EN ? "Select…" : "Chọn…"}</option>
                    {focusOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {EN ? "Anything else?" : "Thông tin thêm?"}
                  </label>
                  <textarea rows={3} className="w-full px-4 py-2 border rounded-lg"
                    value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                </div>
                <ConsentCheckbox checked={consent} onChange={setConsent} />
                <button type="submit" disabled={submitting || !consent}
                  className="w-full py-3 rounded-lg bg-brand-navy text-white font-semibold hover:bg-blue-900 disabled:opacity-50">
                  {submitting
                    ? (EN ? "Sending…" : "Đang gửi…")
                    : (EN ? "Request a proposal" : "Yêu cầu đề xuất")}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
