"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "../../context/LanguageContext";
import { apiFetch } from "../../../lib/api";

export default function ForgotPasswordPage() {
  const { language } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const t = {
    title: language === "VI" ? "Quên Mật Khẩu" : "Forgot Password",
    subtitle: language === "VI" 
      ? "Nhập email của bạn để nhận liên kết đặt lại mật khẩu" 
      : "Enter your email to receive a password reset link",
    email: language === "VI" ? "Địa chỉ Email" : "Email Address",
    emailPlaceholder: language === "VI" ? "Nhập email của bạn" : "Enter your email",
    submit: language === "VI" ? "Gửi Liên Kết Đặt Lại" : "Send Reset Link",
    sending: language === "VI" ? "Đang gửi..." : "Sending...",
    backToLogin: language === "VI" ? "Quay lại Đăng nhập" : "Back to Login",
    successTitle: language === "VI" ? "Email Đã Gửi!" : "Email Sent!",
    successMessage: language === "VI" 
      ? "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được liên kết đặt lại mật khẩu trong vài phút." 
      : "If the email exists in our system, you will receive a password reset link within a few minutes.",
    checkSpam: language === "VI" 
      ? "Vui lòng kiểm tra thư mục spam nếu không thấy email." 
      : "Please check your spam folder if you don't see the email.",
    errorMessage: language === "VI" 
      ? "Đã xảy ra lỗi. Vui lòng thử lại sau." 
      : "An error occurred. Please try again later.",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSuccess(true);
    } catch (err) {
      // Still show success to prevent email enumeration
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✉️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t.successTitle}</h1>
          <p className="text-gray-600 mb-4">{t.successMessage}</p>
          <p className="text-sm text-gray-500 mb-6">{t.checkSpam}</p>
          <Link
            href="/auth/login"
            className="inline-block w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t.backToLogin}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="flex items-center justify-center gap-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl font-bold text-white">L</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">LERA Academy</span>
            </div>
          </Link>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.email}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t.sending : t.submit}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-8 text-center">
          <Link
            href="/auth/login"
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t.backToLogin}
          </Link>
        </div>
      </div>
    </div>
  );
}
