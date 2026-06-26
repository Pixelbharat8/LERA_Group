"use client";

import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useLanguage } from "../context/LanguageContext";

export default function PortalPage() {
  const { language } = useLanguage();
  const EN = language === "EN";

  const parentFeatures = EN
    ? [
        { icon: "📊", t: "Progress & grades", d: "See your child's grades and progress each term." },
        { icon: "✅", t: "Attendance", d: "Know when your child attended, at a glance." },
        { icon: "📅", t: "Class schedule", d: "View class times and upcoming sessions." },
        { icon: "💬", t: "Message teachers", d: "Talk to teachers and the centre directly." },
        { icon: "💳", t: "Payments & invoices", d: "View invoices and payment history in one place." },
        { icon: "📝", t: "Permission slips", d: "Approve activities and trips online." },
        { icon: "📚", t: "Learning resources", d: "Access materials your teachers share." },
        { icon: "👨‍👩‍👧", t: "All your children", d: "Manage every child from one account." },
      ]
    : [
        { icon: "📊", t: "Tiến độ & điểm số", d: "Xem điểm và tiến bộ của con mỗi khoá." },
        { icon: "✅", t: "Điểm danh", d: "Biết con đã đến lớp khi nào, chỉ trong nháy mắt." },
        { icon: "📅", t: "Lịch học", d: "Xem giờ học và các buổi sắp tới." },
        { icon: "💬", t: "Nhắn tin giáo viên", d: "Trao đổi trực tiếp với giáo viên và trung tâm." },
        { icon: "💳", t: "Thanh toán & hoá đơn", d: "Xem hoá đơn và lịch sử thanh toán ở một nơi." },
        { icon: "📝", t: "Phiếu cho phép", d: "Duyệt hoạt động và dã ngoại trực tuyến." },
        { icon: "📚", t: "Tài liệu học tập", d: "Truy cập tài liệu giáo viên chia sẻ." },
        { icon: "👨‍👩‍👧", t: "Tất cả các con", d: "Quản lý mọi con từ một tài khoản." },
      ];

  const studentFeatures = EN
    ? [
        { icon: "📚", t: "My classes", d: "Your classes and what you're learning." },
        { icon: "📝", t: "Assignments", d: "See and submit your assignments." },
        { icon: "📊", t: "Grades & feedback", d: "Track your results and teacher feedback." },
        { icon: "✅", t: "My attendance", d: "Check your own attendance record." },
        { icon: "📅", t: "My schedule", d: "Know exactly when your classes are." },
        { icon: "💬", t: "Messages", d: "Message your teachers when you need help." },
      ]
    : [
        { icon: "📚", t: "Lớp của tôi", d: "Các lớp và nội dung bạn đang học." },
        { icon: "📝", t: "Bài tập", d: "Xem và nộp bài tập của bạn." },
        { icon: "📊", t: "Điểm & nhận xét", d: "Theo dõi kết quả và nhận xét của giáo viên." },
        { icon: "✅", t: "Điểm danh", d: "Kiểm tra lịch sử điểm danh của bạn." },
        { icon: "📅", t: "Lịch học", d: "Biết chính xác khi nào có lớp." },
        { icon: "💬", t: "Tin nhắn", d: "Nhắn cho giáo viên khi cần hỗ trợ." },
      ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-[#0a1a5c] via-blue-800 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="inline-block px-4 py-2 bg-white/15 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
            {EN ? "📱 Parent & Student Portal" : "📱 Cổng phụ huynh & học viên"}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {EN ? "Stay connected to your child's learning" : "Luôn kết nối với việc học của con"}
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            {EN
              ? "Every LERA family gets a secure online portal — track progress, attendance, schedule, payments and message teachers, any time."
              : "Mỗi gia đình LERA đều có cổng trực tuyến bảo mật — theo dõi tiến độ, điểm danh, lịch học, thanh toán và nhắn tin giáo viên, mọi lúc."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link href="/auth/login" className="px-6 py-3 bg-yellow-400 text-gray-900 font-bold rounded-full hover:bg-yellow-300 transition-colors">
              {EN ? "Log in to your portal" : "Đăng nhập cổng của bạn"}
            </Link>
            <Link href="/book-trial" className="px-6 py-3 bg-white/15 text-white font-semibold rounded-full hover:bg-white/25 transition-colors backdrop-blur-sm">
              {EN ? "Book a free trial" : "Học thử miễn phí"}
            </Link>
          </div>
        </div>
      </section>

      {/* Parent portal */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold tracking-wider uppercase text-blue-600 mb-2">{EN ? "For parents" : "Dành cho phụ huynh"}</p>
            <h2 className="text-3xl font-extrabold text-[#0a1a5c]">{EN ? "Your child's progress, in your pocket" : "Tiến độ của con, ngay trong tầm tay"}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {parentFeatures.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{f.t}</h3>
                <p className="text-gray-600 text-sm">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Student portal */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold tracking-wider uppercase text-blue-600 mb-2">{EN ? "For students" : "Dành cho học viên"}</p>
            <h2 className="text-3xl font-extrabold text-[#0a1a5c]">{EN ? "Everything you need to learn" : "Mọi thứ bạn cần để học"}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {studentFeatures.map((f, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl border border-gray-100 p-6">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{f.t}</h3>
                <p className="text-gray-600 text-sm">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{EN ? "New to LERA?" : "Mới biết đến LERA?"}</h2>
          <p className="text-white/80 mb-8">
            {EN ? "Join a free trial and we'll set up your family portal when you enrol." : "Tham gia học thử miễn phí — cổng gia đình sẽ được tạo khi bạn nhập học."}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/enroll" className="px-8 py-4 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-300 transition-colors">
              {EN ? "Enrol online →" : "Đăng ký nhập học →"}
            </Link>
            <Link href="/book-trial" className="px-8 py-4 bg-white/15 text-white font-bold rounded-xl hover:bg-white/25 transition-colors backdrop-blur-sm">
              {EN ? "Book a free trial" : "Học thử miễn phí"}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
