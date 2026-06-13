"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "../../context/LanguageContext";
import { apiFetch } from "../../../lib/api";

export default function ResetPasswordPage() {
  const { language } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const t = {
    title: language === "VI" ? "Đặt Lại Mật Khẩu" : "Reset Password",
    subtitle: language === "VI" 
      ? "Nhập mật khẩu mới của bạn" 
      : "Enter your new password",
    newPassword: language === "VI" ? "Mật Khẩu Mới" : "New Password",
    confirmPassword: language === "VI" ? "Xác Nhận Mật Khẩu" : "Confirm Password",
    passwordPlaceholder: language === "VI" ? "Nhập mật khẩu mới" : "Enter new password",
    confirmPlaceholder: language === "VI" ? "Nhập lại mật khẩu" : "Confirm password",
    submit: language === "VI" ? "Đặt Lại Mật Khẩu" : "Reset Password",
    submitting: language === "VI" ? "Đang xử lý..." : "Processing...",
    successTitle: language === "VI" ? "Mật Khẩu Đã Được Đặt Lại!" : "Password Reset Successful!",
    successMessage: language === "VI" 
      ? "Mật khẩu của bạn đã được thay đổi thành công. Bạn có thể đăng nhập ngay bây giờ." 
      : "Your password has been changed successfully. You can now log in.",
    goToLogin: language === "VI" ? "Đi Đến Đăng Nhập" : "Go to Login",
    passwordMismatch: language === "VI" ? "Mật khẩu không khớp" : "Passwords do not match",
    passwordTooShort: language === "VI" 
      ? "Mật khẩu phải có ít nhất 8 ký tự" 
      : "Password must be at least 8 characters",
    invalidToken: language === "VI" 
      ? "Liên kết không hợp lệ hoặc đã hết hạn" 
      : "Invalid or expired reset link",
    errorMessage: language === "VI" 
      ? "Đã xảy ra lỗi. Vui lòng thử lại sau." 
      : "An error occurred. Please try again later.",
    passwordRequirements: language === "VI" ? "Yêu cầu mật khẩu:" : "Password requirements:",
    req1: language === "VI" ? "Ít nhất 8 ký tự" : "At least 8 characters",
    req2: language === "VI" ? "Chứa chữ hoa và chữ thường" : "Contains uppercase and lowercase",
    req3: language === "VI" ? "Chứa ít nhất một số" : "Contains at least one number",
  };

  useEffect(() => {
    if (!token) {
      setError(t.invalidToken);
    }
  }, [token, t.invalidToken]);

  const validatePassword = () => {
    if (password.length < 8) {
      setError(t.passwordTooShort);
      return false;
    }
    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validatePassword()) return;

    setLoading(true);

    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setSuccess(true);
    } catch (err) {
      setError(t.errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t.successTitle}</h1>
          <p className="text-gray-600 mb-6">{t.successMessage}</p>
          <Link
            href="/auth/login"
            className="inline-block w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t.goToLogin}
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
        {token && !error.includes("expired") && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.newPassword}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.confirmPassword}
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t.confirmPlaceholder}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Password Requirements */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">{t.passwordRequirements}</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className={`flex items-center gap-2 ${password.length >= 8 ? "text-green-600" : ""}`}>
                  <span>{password.length >= 8 ? "✓" : "○"}</span> {t.req1}
                </li>
                <li className={`flex items-center gap-2 ${/[a-z]/.test(password) && /[A-Z]/.test(password) ? "text-green-600" : ""}`}>
                  <span>{/[a-z]/.test(password) && /[A-Z]/.test(password) ? "✓" : "○"}</span> {t.req2}
                </li>
                <li className={`flex items-center gap-2 ${/\d/.test(password) ? "text-green-600" : ""}`}>
                  <span>{/\d/.test(password) ? "✓" : "○"}</span> {t.req3}
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t.submitting : t.submit}
            </button>
          </form>
        )}

        {/* Back to Login */}
        <div className="mt-8 text-center">
          <Link
            href="/auth/login"
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {language === "VI" ? "Quay lại Đăng nhập" : "Back to Login"}
          </Link>
        </div>
      </div>
    </div>
  );
}
