"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useLanguage } from "../../context/LanguageContext";

function ResultInner() {
  const { language } = useLanguage();
  const EN = language === "EN";
  const params = useSearchParams();
  const status = params.get("status") || "failed";
  const ref = params.get("ref") || "";

  const ok = status === "success";
  const icon = ok ? "🎉" : status === "invalid" ? "⚠️" : "❌";
  const title = ok
    ? (EN ? "Payment successful" : "Thanh toán thành công")
    : status === "invalid"
      ? (EN ? "Could not verify payment" : "Không xác minh được thanh toán")
      : (EN ? "Payment not completed" : "Thanh toán chưa hoàn tất");
  const body = ok
    ? (EN
        ? "Thank you! Your place is secured. Our team will be in touch to finalise your enrolment and schedule."
        : "Cảm ơn bạn! Chỗ học đã được giữ. Đội ngũ của chúng tôi sẽ liên hệ để hoàn tất đăng ký và xếp lịch.")
    : status === "invalid"
      ? (EN
          ? "We couldn't verify this payment securely. If money was deducted, please contact us with your reference and we'll resolve it."
          : "Chúng tôi không thể xác minh thanh toán này một cách an toàn. Nếu đã bị trừ tiền, vui lòng liên hệ kèm mã tham chiếu để được hỗ trợ.")
      : (EN
          ? "Your payment was not completed. You can try again or reserve a place and pay later."
          : "Thanh toán của bạn chưa hoàn tất. Bạn có thể thử lại hoặc giữ chỗ và thanh toán sau.");

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <section className="pt-32 pb-24">
        <div className="max-w-xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="text-6xl mb-4">{icon}</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">{title}</h1>
            <p className="text-gray-600 mb-6">{body}</p>
            {ref && (
              <p className="text-xs text-gray-400 mb-6">{EN ? "Reference" : "Mã tham chiếu"}: {ref}</p>
            )}
            <div className="flex flex-wrap gap-3 justify-center">
              {ok ? (
                <Link href="/" className="px-6 py-3 bg-[#0a1a5c] text-white font-semibold rounded-lg hover:bg-blue-900">
                  {EN ? "Back to home" : "Về trang chủ"}
                </Link>
              ) : (
                <>
                  <Link href="/enroll" className="px-6 py-3 bg-[#0a1a5c] text-white font-semibold rounded-lg hover:bg-blue-900">
                    {EN ? "Try again" : "Thử lại"}
                  </Link>
                  <Link href="/contact" className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50">
                    {EN ? "Contact us" : "Liên hệ"}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default function EnrollResultPage() {
  return (
    <Suspense fallback={null}>
      <ResultInner />
    </Suspense>
  );
}
