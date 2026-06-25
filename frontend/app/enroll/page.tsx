"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useLanguage } from "../context/LanguageContext";
import { publicFetch } from "../../lib/api";
import { ENROLMENT_LEAD_CONTEXT } from "../../lib/english-centre-vertical-scope";

interface Course {
  code: string;
  name: string;
  nameVi?: string;
  ageFrom?: number;
  ageTo?: number;
  level?: string;
  price?: number;
  isActive?: boolean;
}

const fmt = (n?: number) => (n == null ? "" : new Intl.NumberFormat("vi-VN").format(n) + "₫");

function EnrollInner() {
  const { language } = useLanguage();
  const EN = language === "EN";
  const params = useSearchParams();
  const presetCode = params.get("course") || "";

  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState({
    courseCode: presetCode,
    studentName: "",
    studentAge: "",
    parentName: "",
    phone: "",
    email: "",
    startPref: "",
    notes: "",
    website: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await publicFetch("/api/courses/active");
        const list = (Array.isArray(data) ? data : []).filter((c: Course) => c.isActive !== false);
        setCourses(list);
        if (!presetCode && list.length > 0) setForm((f) => ({ ...f, courseCode: f.courseCode || "" }));
      } catch {
        setCourses([]);
      }
    })();
  }, [presetCode]);

  const selected = courses.find((c) => c.code === form.courseCode);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const courseLabel = selected ? `${selected.name}${selected.price ? ` (${fmt(selected.price)}/mo)` : ""}` : form.courseCode || "—";
      const note =
        `[Online enrolment] Course: ${courseLabel}` +
        ` | Student: ${form.studentName.trim() || "—"}${form.studentAge ? `, age ${form.studentAge}` : ""}` +
        ` | Preferred start: ${form.startPref || "—"}` +
        (form.notes.trim() ? ` | Notes: ${form.notes.trim()}` : "");
      await publicFetch("/api/public/leads", {
        method: "POST",
        body: JSON.stringify({
          parentName: form.parentName.trim() || form.studentName.trim(),
          parentPhone: form.phone.trim(),
          parentEmail: form.email.trim() || undefined,
          studentName: form.studentName.trim() || undefined,
          studentAge: form.studentAge ? parseInt(form.studentAge, 10) : undefined,
          preferredSchedule: form.startPref || undefined,
          notes: note,
          utmSource: ENROLMENT_LEAD_CONTEXT.utmSource,
          utmMedium: ENROLMENT_LEAD_CONTEXT.utmMedium,
          utmCampaign: form.courseCode || ENROLMENT_LEAD_CONTEXT.utmCampaign,
          website: form.website,
        }),
      });
      setDone(true);
    } catch {
      alert(EN ? "Something went wrong. Please try again." : "Đã có lỗi. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <section className="pt-32 pb-12 bg-gradient-to-br from-[#0a1a5c] via-blue-800 to-blue-700 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {EN ? "Enrol online" : "Đăng ký nhập học"}
          </h1>
          <p className="text-lg text-white/90">
            {EN
              ? "Reserve your child's place in a few steps. Our team confirms availability and sends payment details — no payment needed now."
              : "Giữ chỗ cho con chỉ trong vài bước. Đội ngũ của chúng tôi sẽ xác nhận chỗ trống và gửi thông tin thanh toán — chưa cần thanh toán ngay."}
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-2xl mx-auto px-4">
          {done ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="text-5xl mb-4 text-center">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
                {EN ? "Enrolment request received" : "Đã nhận yêu cầu nhập học"}
              </h2>
              <p className="text-gray-600 text-center mb-6">
                {EN
                  ? "Thank you! Our team will confirm your place and send payment instructions shortly."
                  : "Cảm ơn bạn! Đội ngũ của chúng tôi sẽ xác nhận chỗ và gửi hướng dẫn thanh toán trong thời gian sớm nhất."}
              </p>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-900">
                <p className="font-semibold mb-1">{EN ? "Next steps" : "Các bước tiếp theo"}</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>{EN ? "We confirm class availability and your start date." : "Chúng tôi xác nhận lớp còn chỗ và ngày bắt đầu."}</li>
                  <li>{EN ? "You receive tuition & payment details (bank transfer or at the centre)." : "Bạn nhận thông tin học phí & thanh toán (chuyển khoản hoặc tại trung tâm)."}</li>
                  <li>{EN ? "Your place is secured once payment is confirmed." : "Chỗ học được giữ sau khi xác nhận thanh toán."}</li>
                </ul>
              </div>
              <div className="text-center mt-6">
                <Link href="/" className="text-blue-700 font-semibold underline">{EN ? "Back to home" : "Về trang chủ"}</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 space-y-4">
              <input type="text" name="website" value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{EN ? "Programme *" : "Chương trình *"}</label>
                <select required value={form.courseCode}
                  onChange={(e) => setForm({ ...form, courseCode: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg bg-white">
                  <option value="">{EN ? "Select a programme…" : "Chọn chương trình…"}</option>
                  {courses.map((c) => (
                    <option key={c.code} value={c.code}>
                      {(EN ? c.name : (c.nameVi || c.name)) + (c.price ? ` — ${fmt(c.price)}/mo` : "")}
                    </option>
                  ))}
                </select>
                {selected && (
                  <p className="text-sm text-gray-500 mt-1">
                    {selected.ageFrom != null ? `${EN ? "Ages" : "Tuổi"} ${selected.ageFrom}–${selected.ageTo}` : ""}
                    {selected.price ? ` · ${fmt(selected.price)}/${EN ? "month" : "tháng"}` : ""}
                  </p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{EN ? "Student name *" : "Tên học viên *"}</label>
                  <input required className="w-full px-4 py-2 border rounded-lg"
                    value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{EN ? "Student age" : "Tuổi học viên"}</label>
                  <input type="number" min={2} max={99} className="w-full px-4 py-2 border rounded-lg"
                    value={form.studentAge} onChange={(e) => setForm({ ...form, studentAge: e.target.value })} />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{EN ? "Parent / contact name *" : "Tên phụ huynh / liên hệ *"}</label>
                  <input required className="w-full px-4 py-2 border rounded-lg"
                    value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{EN ? "Phone *" : "Điện thoại *"}</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">{EN ? "Preferred start" : "Thời gian bắt đầu mong muốn"}</label>
                  <input className="w-full px-4 py-2 border rounded-lg"
                    placeholder={EN ? "e.g. Next month" : "VD: Tháng sau"}
                    value={form.startPref} onChange={(e) => setForm({ ...form, startPref: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{EN ? "Anything else?" : "Thông tin thêm?"}</label>
                <textarea rows={2} className="w-full px-4 py-2 border rounded-lg"
                  value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>

              <button type="submit" disabled={submitting}
                className="w-full py-3 rounded-lg bg-[#0a1a5c] text-white font-semibold hover:bg-blue-900 disabled:opacity-50">
                {submitting ? (EN ? "Submitting…" : "Đang gửi…") : (EN ? "Reserve my place" : "Giữ chỗ cho con")}
              </button>
              <p className="text-xs text-gray-400 text-center">
                {EN
                  ? "No payment is taken now — we'll confirm availability and send payment details."
                  : "Chưa thu tiền ngay — chúng tôi sẽ xác nhận chỗ và gửi thông tin thanh toán."}
              </p>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function EnrollPage() {
  return (
    <Suspense fallback={null}>
      <EnrollInner />
    </Suspense>
  );
}
