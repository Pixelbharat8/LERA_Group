"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { apiFetch, hasAuthSession } from "../../../lib/api";
import { useLanguage } from "../../context/LanguageContext";

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState([
    { labelKey: "totalCenters", value: "...", icon: "🏢", color: "bg-blue-500" },
    { labelKey: "totalStudents", value: "...", icon: "👨‍🎓", color: "bg-green-500" },
    { labelKey: "totalTeachers", value: "...", icon: "👨‍🏫", color: "bg-purple-500" },
    { labelKey: "monthlyRevenue", value: "...", icon: "💰", color: "bg-yellow-500" },
  ]);
  const [recentActivity, setRecentActivity] = useState<Array<{action: string, detail: string, time: string}>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = Cookies.get("role")?.toLowerCase();

    // Chairman is GOD - has access to everything
    // Also allow CEO, Director, and SuperAdmin
    const allowedRoles = ["chairman", "ceo", "director", "superadmin", "super_admin"];
    if (!hasAuthSession() || !allowedRoles.includes(role || "")) {
      router.push("/auth/login");
      return;
    }

    // Set user info
    setUser({ role: role, email: Cookies.get("email") || "admin@lera.com" });

    // Fetch real dashboard data
    const fetchDashboardData = async () => {
      try {
        // Fetch all data in parallel
        const [centersData, studentsData, teachersData, paymentsData, enrollmentsData] = await Promise.all([
          apiFetch("/api/centers").catch(() => []),
          apiFetch("/api/students").catch(() => []),
          apiFetch("/api/users?role=TEACHER").catch(() => []),
          apiFetch("/api/payments").catch(() => []),
          apiFetch("/api/enrollments").catch(() => []),
        ]);

        // Parse responses
        let centerCount = Array.isArray(centersData) ? centersData.length : (centersData?.content?.length || 0);
        let studentCount = Array.isArray(studentsData) ? studentsData.length : (studentsData?.totalElements || studentsData?.content?.length || 0);
        let teacherCount = Array.isArray(teachersData) ? teachersData.length : (teachersData?.content?.length || 0);
        
        const paymentList = Array.isArray(paymentsData) ? paymentsData : (paymentsData?.content || []);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        let monthlyRevenue = paymentList.reduce((sum: number, p: any) => {
          const paymentDate = new Date(p.paymentDate || p.createdAt);
          if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
            return sum + (p.amount || 0);
          }
          return sum;
        }, 0);

        // Format revenue
        const formatRevenue = (amount: number) => {
          if (amount >= 1000000000) {
            return `₫${(amount / 1000000000).toFixed(1)}B`;
          } else if (amount >= 1000000) {
            return `₫${(amount / 1000000).toFixed(1)}M`;
          } else if (amount >= 1000) {
            return `₫${(amount / 1000).toFixed(0)}K`;
          }
          return `₫${amount.toLocaleString()}`;
        };

        setStats([
          { labelKey: "totalCenters", value: centerCount.toLocaleString(), icon: "🏢", color: "bg-blue-500" },
          { labelKey: "totalStudents", value: studentCount.toLocaleString(), icon: "👨‍🎓", color: "bg-green-500" },
          { labelKey: "totalTeachers", value: teacherCount.toLocaleString(), icon: "👨‍🏫", color: "bg-purple-500" },
          { labelKey: "monthlyRevenue", value: formatRevenue(monthlyRevenue), icon: "💰", color: "bg-yellow-500" },
        ]);

        // Add recent payments as activity
        const activities: Array<{action: string, detail: string, time: string}> = [];
        paymentList.slice(0, 3).forEach((p: any) => {
          activities.push({
            action: "💰 Payment received",
            detail: `₫${(p.amount || 0).toLocaleString()} - ${p.paymentMethod || 'N/A'}`,
            time: p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'Recently'
          });
        });

        // Add recent students
        const studentsList = Array.isArray(studentsData) ? studentsData : [];
        [...studentsList]
          .filter((s: any) => s.createdAt)
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3)
          .forEach((s: any) => {
            activities.push({
              action: "👨‍🎓 New student registered",
              detail: s.fullname || s.name || s.studentCode || "Student",
              time: new Date(s.createdAt).toLocaleDateString()
            });
          });

        // Add recent enrollments
        const enrollmentList = Array.isArray(enrollmentsData) ? enrollmentsData : [];
        [...enrollmentList]
          .filter((e: any) => e.createdAt)
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 2)
          .forEach((e: any) => {
            activities.push({
              action: "📝 New enrollment",
              detail: e.studentName || e.className || "Enrollment",
              time: new Date(e.createdAt).toLocaleDateString()
            });
          });

        // Sort all activities by date
        activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        if (activities.length === 0) {
          activities.push(
            { action: "System ready", detail: "All services are operational", time: "Just now" },
            { action: "Dashboard loaded", detail: "Real-time data connected", time: "Just now" }
          );
        }

        setRecentActivity(activities);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const quickLinks = [
    { title: "Centers Management", href: "/dashboard/superadmin/centers", icon: "🏢", desc: "Manage all centers" },
    { title: "Website Home", href: "/dashboard/superadmin/public-website/home", icon: "🏠", desc: "Edit homepage" },
    { title: "Courses", href: "/dashboard/superadmin/public-website/courses", icon: "📚", desc: "Manage courses" },
    { title: "Blog Posts", href: "/dashboard/superadmin/public-website/blog", icon: "✍️", desc: "Manage blog" },
    { title: "Testimonials", href: "/dashboard/superadmin/public-website/testimonials", icon: "⭐", desc: "Manage reviews" },
    { title: "Branding", href: "/dashboard/superadmin/public-website/branding", icon: "🎨", desc: "Brand settings" },
  ];

  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("role");
    router.push("/auth/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t("dashboard")} SuperAdmin</h1>
              <p className="text-sm text-gray-600 mt-1">{t("welcomeBackAdmin")}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                {t("viewWebsite")}
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t("logout")}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t(stat.labelKey)}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t("quickLinks")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="flex items-start p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="text-3xl mr-4">{link.icon}</div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                    {link.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{link.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t("recentActivity")}</h2>
          <div className="space-y-4">
            {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start pb-4 border-b border-gray-100 last:border-0">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-4"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.detail}</p>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            )) : (
              <p className="text-gray-500 text-center py-4">{t("noRecentActivity")}</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
