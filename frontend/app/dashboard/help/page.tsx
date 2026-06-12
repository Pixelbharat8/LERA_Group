"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "../../context/LanguageContext";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

interface HelpArticle {
  id: string;
  title: string;
  titleVi: string;
  content: string;
  contentVi: string;
  category: string;
  icon: string;
}

const helpArticles: HelpArticle[] = [
  {
    id: "1",
    title: "Getting Started with LERA Dashboard",
    titleVi: "Bắt đầu với LERA Dashboard",
    content: "Learn how to navigate the dashboard, access your classes, and manage your profile. The dashboard provides a central hub for all your learning activities.",
    contentVi: "Tìm hiểu cách điều hướng bảng điều khiển, truy cập lớp học và quản lý hồ sơ của bạn. Bảng điều khiển cung cấp trung tâm cho tất cả các hoạt động học tập.",
    category: "Getting Started",
    icon: "🚀",
  },
  {
    id: "2",
    title: "How to View Your Schedule",
    titleVi: "Cách xem lịch học",
    content: "Access your class schedule from the Schedule menu. You can view daily, weekly, or monthly views and set reminders for upcoming classes.",
    contentVi: "Truy cập lịch học từ menu Lịch học. Bạn có thể xem theo ngày, tuần hoặc tháng và đặt nhắc nhở cho các lớp học sắp tới.",
    category: "Schedule",
    icon: "📅",
  },
  {
    id: "3",
    title: "Checking Your Grades",
    titleVi: "Kiểm tra điểm số",
    content: "View your grades and progress reports in the Grades section. You can see individual assignment scores and overall course performance.",
    contentVi: "Xem điểm số và báo cáo tiến độ trong phần Điểm. Bạn có thể xem điểm từng bài tập và hiệu suất tổng thể của khóa học.",
    category: "Grades",
    icon: "📊",
  },
  {
    id: "4",
    title: "Making Payments",
    titleVi: "Thanh toán học phí",
    content: "Navigate to the Payments section to view your balance, make payments, and download receipts. We accept various payment methods including bank transfer and cards.",
    contentVi: "Đi đến phần Thanh toán để xem số dư, thanh toán và tải hóa đơn. Chúng tôi chấp nhận nhiều phương thức thanh toán bao gồm chuyển khoản và thẻ.",
    category: "Payments",
    icon: "💳",
  },
  {
    id: "5",
    title: "Contacting Your Teacher",
    titleVi: "Liên hệ giáo viên",
    content: "Use the Messages feature to communicate with your teachers. You can ask questions, request feedback, or schedule appointments.",
    contentVi: "Sử dụng tính năng Tin nhắn để liên lạc với giáo viên. Bạn có thể đặt câu hỏi, yêu cầu phản hồi hoặc đặt lịch hẹn.",
    category: "Communication",
    icon: "💬",
  },
  {
    id: "6",
    title: "Attendance Tracking",
    titleVi: "Theo dõi điểm danh",
    content: "Monitor your attendance record in the Attendance section. Maintaining good attendance is important for your learning progress.",
    contentVi: "Theo dõi hồ sơ điểm danh trong phần Điểm danh. Duy trì điểm danh tốt rất quan trọng cho tiến trình học tập của bạn.",
    category: "Attendance",
    icon: "✅",
  },
  {
    id: "7",
    title: "Submitting Assignments",
    titleVi: "Nộp bài tập",
    content: "Access your assignments from the Assignments section. Upload your work before the deadline and track submission status.",
    contentVi: "Truy cập bài tập từ phần Bài tập. Tải lên bài làm trước hạn nộp và theo dõi trạng thái nộp bài.",
    category: "Assignments",
    icon: "📝",
  },
  {
    id: "8",
    title: "Technical Support",
    titleVi: "Hỗ trợ kỹ thuật",
    content: "If you experience technical issues, try refreshing your browser or clearing cache. For persistent problems, contact our support team.",
    contentVi: "Nếu bạn gặp sự cố kỹ thuật, hãy thử làm mới trình duyệt hoặc xóa bộ nhớ cache. Đối với vấn đề liên tục, hãy liên hệ đội hỗ trợ.",
    category: "Technical",
    icon: "🔧",
  },
];

export default function HelpPage() {
  const { language } = useLanguage();
  const { getSetting } = useWebsiteSettings();
  const isVietnamese = language === "VI";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const t = {
    title: isVietnamese ? "Trung tâm Trợ giúp" : "Help Center",
    subtitle: isVietnamese ? "Tìm câu trả lời cho các câu hỏi của bạn" : "Find answers to your questions",
    search: isVietnamese ? "Tìm kiếm trợ giúp..." : "Search for help...",
    allCategories: isVietnamese ? "Tất cả" : "All Categories",
    noResults: isVietnamese ? "Không tìm thấy kết quả" : "No results found",
    contactSupport: isVietnamese ? "Liên hệ hỗ trợ" : "Contact Support",
    contactDesc: isVietnamese 
      ? "Không tìm thấy câu trả lời? Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ." 
      : "Can't find what you're looking for? Our support team is here to help.",
    email: "support@lera.edu.vn",
    phone: getSetting('contact_phone', '0387.633.141'),
    quickLinks: isVietnamese ? "Liên kết nhanh" : "Quick Links",
  };

  const categories = ["all", ...Array.from(new Set(helpArticles.map(a => a.category)))];

  const filteredArticles = helpArticles.filter(article => {
    const title = isVietnamese ? article.titleVi : article.title;
    const content = isVietnamese ? article.contentVi : article.content;
    const matchesSearch = 
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <nav className="text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{t.title}</span>
        </nav>
        <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
        <p className="text-gray-600 mt-1">{t.subtitle}</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="relative max-w-2xl mx-auto">
          <input
            type="text"
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-6 py-4 pl-14 text-lg border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-2xl">🔍</span>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 flex-wrap mb-6">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              selectedCategory === category
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {category === "all" ? t.allCategories : category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Articles */}
        <div className="lg:col-span-2 space-y-4">
          {filteredArticles.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.noResults}</h3>
              <p className="text-gray-500">{isVietnamese ? "Thử tìm kiếm khác" : "Try a different search term"}</p>
            </div>
          ) : (
            filteredArticles.map(article => (
              <div key={article.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === article.id ? null : article.id)}
                  className="w-full p-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{article.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {isVietnamese ? article.titleVi : article.title}
                      </h3>
                      <span className="text-sm text-blue-600">{article.category}</span>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${expandedId === article.id ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedId === article.id && (
                  <div className="px-5 pb-5 pt-0">
                    <div className="pl-16 border-t pt-4">
                      <p className="text-gray-600 leading-relaxed">
                        {isVietnamese ? article.contentVi : article.content}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Support */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 text-white">
            <h3 className="text-xl font-bold mb-2">{t.contactSupport}</h3>
            <p className="text-blue-100 mb-4">{t.contactDesc}</p>
            <div className="space-y-3">
              <a href={`mailto:${t.email}`} className="flex items-center gap-3 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                <span>📧</span>
                <span>{t.email}</span>
              </a>
              <a href={`tel:${t.phone.replace(/\s/g, '')}`} className="flex items-center gap-3 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                <span>📞</span>
                <span>{t.phone}</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">{t.quickLinks}</h3>
            <div className="space-y-2">
              <Link href="/dashboard/profile" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <span>👤</span>
                <span className="text-gray-700">{isVietnamese ? "Hồ sơ của tôi" : "My Profile"}</span>
              </Link>
              <Link href="/dashboard/settings" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <span>⚙️</span>
                <span className="text-gray-700">{isVietnamese ? "Cài đặt" : "Settings"}</span>
              </Link>
              <Link href="/dashboard/notifications" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <span>🔔</span>
                <span className="text-gray-700">{isVietnamese ? "Thông báo" : "Notifications"}</span>
              </Link>
              <Link href="/faq" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <span>❓</span>
                <span className="text-gray-700">{isVietnamese ? "FAQ" : "FAQ"}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
