"use client";

import Link from "next/link";
import { useLanguage } from "./context/LanguageContext";

export default function NotFound() {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center px-4">
      <div className="text-center">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <h1 className="text-[150px] sm:text-[200px] font-bold text-white/10 select-none">404</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl sm:text-8xl animate-bounce">🎓</div>
          </div>
        </div>
        
        <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">
          {language === "VI" ? "Trang không tìm thấy" : "Page Not Found"}
        </h2>
        
        <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto">
          {language === "VI" 
            ? "Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển."
            : "Sorry, the page you're looking for doesn't exist or has been moved."}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/"
            className="px-8 py-3 bg-yellow-400 text-gray-900 rounded-full font-bold hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-lg"
          >
            {language === "VI" ? "🏠 Về Trang Chủ" : "🏠 Go Home"}
          </Link>
          <Link 
            href="/courses"
            className="px-8 py-3 bg-white/10 text-white rounded-full font-bold hover:bg-white/20 transition-all border border-white/30"
          >
            {language === "VI" ? "📚 Xem Khóa Học" : "📚 View Courses"}
          </Link>
        </div>
        
        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-gray-400 mb-4">
            {language === "VI" ? "Liên kết hữu ích:" : "Helpful Links:"}
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/about" className="text-blue-300 hover:text-white transition-colors">
              {language === "VI" ? "Về Chúng Tôi" : "About Us"}
            </Link>
            <span className="text-gray-600">•</span>
            <Link href="/contact" className="text-blue-300 hover:text-white transition-colors">
              {language === "VI" ? "Liên Hệ" : "Contact"}
            </Link>
            <span className="text-gray-600">•</span>
            <Link href="/auth/login" className="text-blue-300 hover:text-white transition-colors">
              {language === "VI" ? "Đăng Nhập" : "Login"}
            </Link>
          </div>
        </div>
        
        {/* Contact */}
        <div className="mt-8">
          <p className="text-gray-400 text-sm">
            {language === "VI" ? "Cần hỗ trợ? Liên hệ: " : "Need help? Contact: "}
            <a href="tel:0387633141" className="text-yellow-400 hover:underline">0387.633.141</a>
          </p>
        </div>
      </div>
    </div>
  );
}
