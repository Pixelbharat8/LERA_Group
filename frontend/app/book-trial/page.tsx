"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useLanguage } from "../context/LanguageContext";
import { publicFetch } from "../../lib/api";
import { FUNNEL_NOTES_PREFIX, TRIAL_BOOKING_LEAD_CONTEXT } from "../../lib/english-centre-vertical-scope";

export default function BookTrialPage() {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    parentName: "",
    phone: "",
    email: "",
    studentName: "",
    age: "",
    preferredTime: "",
    website: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await publicFetch("/api/public/leads", {
        method: "POST",
        body: JSON.stringify({
          parentName: formData.parentName.trim(),
          parentPhone: formData.phone.trim(),
          parentEmail: formData.email.trim() || undefined,
          studentName: formData.studentName.trim() || undefined,
          studentAge: formData.age ? parseInt(formData.age, 10) : undefined,
          preferredSchedule: formData.preferredTime || undefined,
          notes: `${FUNNEL_NOTES_PREFIX} Trial class booking request`,
          utmSource: TRIAL_BOOKING_LEAD_CONTEXT.utmSource,
          utmMedium: TRIAL_BOOKING_LEAD_CONTEXT.utmMedium,
          utmCampaign: "book_trial_page",
          website: formData.website,
        }),
      });
      setDone(true);
      setFormData({
        parentName: "",
        phone: "",
        email: "",
        studentName: "",
        age: "",
        preferredTime: "",
        website: "",
      });
    } catch {
      alert(language === "EN" ? "Something went wrong. Please try again." : "Đã có lỗi. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-24">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {language === "EN" ? "Book a free trial class" : "Đăng ký học thử miễn phí"}
        </h1>
        <p className="text-gray-600 mb-8">
          {language === "EN"
            ? "We will contact you to confirm your trial session."
            : "Chúng tôi sẽ liên hệ để xác nhận buổi học thử."}
        </p>

        {done ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6 text-emerald-900">
            {language === "EN"
              ? "Thank you! Our team will reach out shortly."
              : "Cảm ơn bạn! Đội ngũ của chúng tôi sẽ liên hệ sớm."}
            <div className="mt-4">
              <Link href="/" className="text-emerald-700 font-semibold underline">
                {language === "EN" ? "Back to home" : "Về trang chủ"}
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 bg-white rounded-xl shadow-sm border p-6">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === "EN" ? "Parent / contact name *" : "Tên phụ huynh / liên hệ *"}
              </label>
              <input
                required
                className="w-full px-4 py-2 border rounded-lg"
                value={formData.parentName}
                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === "EN" ? "Phone *" : "Điện thoại *"}
              </label>
              <input
                required
                className="w-full px-4 py-2 border rounded-lg"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                className="w-full px-4 py-2 border rounded-lg"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === "EN" ? "Student name" : "Tên học viên"}
              </label>
              <input
                className="w-full px-4 py-2 border rounded-lg"
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === "EN" ? "Age" : "Tuổi"}
              </label>
              <input
                type="number"
                min={2}
                max={99}
                className="w-full px-4 py-2 border rounded-lg"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === "EN" ? "Preferred day / time" : "Ngày / giờ mong muốn"}
              </label>
              <input
                className="w-full px-4 py-2 border rounded-lg"
                placeholder={language === "EN" ? "e.g. Weekday evenings" : "VD: Tối trong tuần"}
                value={formData.preferredTime}
                onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting
                ? language === "EN"
                  ? "Sending…"
                  : "Đang gửi…"
                : language === "EN"
                  ? "Request trial"
                  : "Gửi đăng ký"}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
