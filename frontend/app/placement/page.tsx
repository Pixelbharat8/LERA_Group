"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useLanguage } from "../context/LanguageContext";
import { publicFetch } from "../../lib/api";
import { FUNNEL_NOTES_PREFIX, PLACEMENT_QUIZ_LEAD_CONTEXT } from "../../lib/english-centre-vertical-scope";

type Q = { id: string; en: string; vi: string };

const QUESTIONS: Q[] = [
  {
    id: "q1",
    en: "How comfortable are you speaking English in everyday situations?",
    vi: "Bạn tự tin nói tiếng Anh trong các tình huống hàng ngày đến mức nào?",
  },
  {
    id: "q2",
    en: "How well do you understand spoken English (videos, conversations)?",
    vi: "Bạn hiểu tiếng Anh nói (video, hội thoại) đến mức nào?",
  },
  {
    id: "q3",
    en: "How confident are you reading English texts (articles, emails)?",
    vi: "Bạn tự tin đọc văn bản tiếng Anh (bài báo, email) đến mức nào?",
  },
  {
    id: "q4",
    en: "How comfortable are you writing messages or short paragraphs in English?",
    vi: "Bạn thoải mái viết tin nhắn hoặc đoạn văn ngắn bằng tiếng Anh đến mức nào?",
  },
];

function bandFromScore(total: number): { track: string; trackVi: string } {
  if (total <= 4) return { track: "Beginner / foundation", trackVi: "Cơ bản / nền tảng" };
  if (total <= 8) return { track: "Elementary to pre-intermediate", trackVi: "Sơ cấp đến trung cấp phía dưới" };
  if (total <= 12) return { track: "Intermediate", trackVi: "Trung cấp" };
  return { track: "Upper-intermediate / advanced skills", trackVi: "Trung cấp cao / nâng cao" };
}

export default function PlacementPage() {
  const { language } = useLanguage();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [contact, setContact] = useState({ name: "", phone: "", email: "", website: "" });
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const score = useMemo(
    () => QUESTIONS.reduce((s, q) => s + (answers[q.id] ?? 0), 0),
    [answers]
  );

  const recommendation = useMemo(() => bandFromScore(score), [score]);

  const submitLead = async () => {
    setSubmitting(true);
    const detail = QUESTIONS.map((q) => `${q.id}:${answers[q.id] ?? 0}`).join("; ");
    const notes =
      `${FUNNEL_NOTES_PREFIX} Placement self-check (informal). Score band ~${score}/16. ` +
      `Suggested track: ${recommendation.track}. Answers: ${detail}`;

    try {
      await publicFetch("/api/public/leads", {
        method: "POST",
        body: JSON.stringify({
          parentName: contact.name.trim(),
          parentPhone: contact.phone.trim(),
          parentEmail: contact.email.trim() || undefined,
          placementScoreOutOf16: score,
          placementTrackEn: recommendation.track,
          placementTrackVi: recommendation.trackVi,
          notes,
          utmSource: PLACEMENT_QUIZ_LEAD_CONTEXT.utmSource,
          utmMedium: PLACEMENT_QUIZ_LEAD_CONTEXT.utmMedium,
          utmCampaign: PLACEMENT_QUIZ_LEAD_CONTEXT.utmCampaign,
          website: contact.website,
        }),
      });
      setDone(true);
    } catch {
      alert(language === "EN" ? "Could not submit. Try again." : "Gửi không thành công. Thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-24">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {language === "EN" ? "Quick English level check" : "Kiểm tra trình độ nhanh"}
        </h1>
        <p className="text-gray-600 mb-8 text-sm">
          {language === "EN"
            ? "This is an informal guide — our teachers will confirm your level after a proper placement or trial."
            : "Đây chỉ là tham khảo — giáo viên sẽ xác nhận trình độ sau khi kiểm tra hoặc học thử."}
        </p>

        {done ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6">
            <p className="text-emerald-900 font-medium">
              {language === "EN"
                ? "Thanks — we saved your result and will contact you soon."
                : "Cảm ơn — chúng tôi đã ghi nhận và sẽ liên hệ bạn sớm."}
            </p>
            <Link href="/book-trial" className="inline-block mt-4 text-emerald-700 font-semibold underline">
              {language === "EN" ? "Book a trial class →" : "Đăng ký học thử →"}
            </Link>
          </div>
        ) : step < QUESTIONS.length ? (
          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
            <p className="text-gray-800 font-medium">
              {language === "EN" ? QUESTIONS[step].en : QUESTIONS[step].vi}
            </p>
            <div className="space-y-2">
              {(
                [
                  [0, language === "EN" ? "Not yet / struggle" : "Chưa / còn khó"],
                  [1, language === "EN" ? "Sometimes / OK" : "Đôi khi / tạm ổn"],
                  [2, language === "EN" ? "Comfortable / confident" : "Thoải mái / tự tin"],
                ] as const
              ).map(([val, label]) => (
                <label key={val} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={QUESTIONS[step].id}
                    checked={answers[QUESTIONS[step].id] === val}
                    onChange={() =>
                      setAnswers({ ...answers, [QUESTIONS[step].id]: val })
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              {step > 0 && (
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border"
                  onClick={() => setStep((s) => s - 1)}
                >
                  {language === "EN" ? "Back" : "Quay lại"}
                </button>
              )}
              <button
                type="button"
                disabled={answers[QUESTIONS[step].id] === undefined}
                className="flex-1 py-2 rounded-lg bg-emerald-600 text-white font-semibold disabled:opacity-40"
                onClick={() => setStep((s) => s + 1)}
              >
                {language === "EN" ? "Next" : "Tiếp"}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
            <div>
              <h2 className="font-semibold text-gray-900 mb-2">
                {language === "EN" ? "Suggested starting point" : "Gợi ý khởi đầu"}
              </h2>
              <p className="text-lg text-emerald-700">
                {language === "EN" ? recommendation.track : recommendation.trackVi}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {language === "EN" ? `Rough score: ${score} / 16` : `Điểm tham khảo: ${score} / 16`}
              </p>
              <Link
                href="/courses"
                className="inline-flex items-center gap-1 mt-4 text-blue-600 font-semibold hover:text-blue-700"
              >
                {language === "EN" ? "Explore matching courses" : "Khám phá khoá học phù hợp"} <span>→</span>
              </Link>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                name="website"
                value={contact.website}
                onChange={(e) => setContact({ ...contact, website: e.target.value })}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              <input
                required
                placeholder={language === "EN" ? "Your name *" : "Họ tên *"}
                className="w-full px-4 py-2 border rounded-lg"
                value={contact.name}
                onChange={(e) => setContact({ ...contact, name: e.target.value })}
              />
              <input
                required
                placeholder={language === "EN" ? "Phone *" : "Số điện thoại *"}
                className="w-full px-4 py-2 border rounded-lg"
                value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full px-4 py-2 border rounded-lg"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
              />
            </div>
            <button
              type="button"
              disabled={submitting || !contact.name.trim() || !contact.phone.trim()}
              onClick={submitLead}
              className="w-full py-3 rounded-lg bg-emerald-600 text-white font-semibold disabled:opacity-50"
            >
              {submitting
                ? language === "EN"
                  ? "Sending…"
                  : "Đang gửi…"
                : language === "EN"
                  ? "Send my result to LERA"
                  : "Gửi kết quả cho LERA"}
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
