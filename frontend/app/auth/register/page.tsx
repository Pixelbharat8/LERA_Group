"use client";

import { useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Link from "next/link";
import { useLanguage } from "../../context/LanguageContext";

export default function RegisterPage() {
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!formData.fullname || !formData.email || !formData.password) {
      setError(language === "VI" ? "Vui lòng điền đầy đủ thông tin" : "Please fill in all required fields");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(language === "VI" ? "Mật khẩu không khớp" : "Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError(language === "VI" ? "Mật khẩu phải có ít nhất 6 ký tự" : "Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      // Register with STUDENT role (pending admin approval)
      const res = await axios.post("/api/auth/register", {
        fullname: formData.fullname,
        email: formData.email,
        phone: formData.phone || null,
        password: formData.password,
        roleName: "STUDENT",
      });

      if (res.data?.success) {
        // Public registration: account is PENDING admin approval
        // No token is returned — user cannot log in until approved
        setSuccess(true);
      } else {
        throw new Error(res.data?.message || "Registration failed");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        (language === "VI" ? "Đăng ký thất bại. Vui lòng thử lại." : "Registration failed. Please try again.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white shadow-2xl rounded-2xl p-8">
            <div className="text-6xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold text-blue-600 mb-4">
              {language === "VI" ? "Đăng ký thành công!" : "Registration Submitted!"}
            </h1>
            <p className="text-gray-600 mb-2">
              {language === "VI"
                ? "Tài khoản của bạn đã được tạo và đang chờ xét duyệt."
                : "Your account has been created and is pending approval."}
            </p>
            <p className="text-gray-500 text-sm mb-6">
              {language === "VI"
                ? "Quản trị viên sẽ xem xét và kích hoạt tài khoản của bạn. Bạn sẽ có thể đăng nhập sau khi được phê duyệt."
                : "An administrator will review and activate your account. You will be able to log in once approved."}
            </p>
            <Link 
              href="/auth/login"
              className="inline-block w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              {language === "VI" ? "Quay lại đăng nhập" : "Back to Login"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Back Link */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-8">
            <span>←</span>
            <span>{language === "VI" ? "Về trang chủ" : "Back to Home"}</span>
          </Link>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-3xl">L</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {language === "VI" ? "Tạo tài khoản" : "Create Account"}
          </h1>
          <p className="text-gray-600 mt-2">
            {language === "VI" ? "Đăng ký để bắt đầu hành trình học tập" : "Sign up to start your learning journey"}
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white shadow-2xl rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="fullname" className="block text-sm font-medium text-gray-700 mb-2">
                {language === "VI" ? "Họ và tên" : "Full Name"} <span className="text-red-500">*</span>
              </label>
              <input 
                id="fullname"
                name="fullname"
                type="text" 
                placeholder={language === "VI" ? "Nguyễn Văn A" : "John Doe"}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                value={formData.fullname}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {language === "VI" ? "Email" : "Email Address"} <span className="text-red-500">*</span>
              </label>
              <input 
                id="email"
                name="email"
                type="email" 
                placeholder="example@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                {language === "VI" ? "Số điện thoại" : "Phone Number"}
              </label>
              <input 
                id="phone"
                name="phone"
                type="tel" 
                placeholder="0912 345 678"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {language === "VI" ? "Mật khẩu" : "Password"} <span className="text-red-500">*</span>
              </label>
              <input 
                id="password"
                name="password"
                type="password" 
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                {language === "VI" ? "Xác nhận mật khẩu" : "Confirm Password"} <span className="text-red-500">*</span>
              </label>
              <input 
                id="confirmPassword"
                name="confirmPassword"
                type="password" 
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="flex items-start">
              <input 
                type="checkbox" 
                id="terms"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1" 
                required
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                {language === "VI" 
                  ? "Tôi đồng ý với " 
                  : "I agree to the "}
                <Link href="/terms" className="text-blue-600 hover:underline">
                  {language === "VI" ? "Điều khoản sử dụng" : "Terms of Service"}
                </Link>
                {language === "VI" ? " và " : " and "}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  {language === "VI" ? "Chính sách bảo mật" : "Privacy Policy"}
                </Link>
              </label>
            </div>

            <button 
              type="submit" 
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {language === "VI" ? "Đang xử lý..." : "Processing..."}
                </span>
              ) : (
                language === "VI" ? "Đăng ký" : "Create Account"
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <span className="text-xl">ℹ️</span>
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">
                  {language === "VI" ? "Sau khi đăng ký" : "After Registration"}
                </p>
                <p>
                  {language === "VI" 
                    ? "Tài khoản của bạn sẽ được xét duyệt bởi quản trị viên. Sau khi được phê duyệt, bạn sẽ nhận được quyền truy cập đầy đủ vào hệ thống."
                    : "Your account will be reviewed by an administrator. Once approved, you'll receive full access to the system."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-8">
          {language === "VI" ? "Đã có tài khoản?" : "Already have an account?"}{' '}
          <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-semibold">
            {language === "VI" ? "Đăng nhập" : "Sign In"}
          </Link>
        </p>
      </div>
    </div>
  );
}
