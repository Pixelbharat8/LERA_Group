"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";
import { apiFetch } from "../../lib/api";
import { useUserCenter, buildCenterFilterUrl } from "../hooks/useUserCenter";
import { useLanguage } from "../context/LanguageContext";

export default function DashboardPage() {
  const router = useRouter();
  const { centerId: userCenterId, shouldFilterByCenter, userRole, loading: userLoading } = useUserCenter();
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalCenters: 0,
    activeClasses: 0,
    attendanceRate: 0,
    pendingLeads: 0,
    totalRevenue: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [period, setPeriod] = useState<"today" | "week" | "month">("week");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect users to their appropriate dashboard based on role
    const actualRole = Cookies.get("actualRole");
    const normalizedRole = actualRole?.toUpperCase() || "";
    
    const roleRoutes: Record<string, string> = {
      CHAIRMAN: "/dashboard/chairman",
      CEO: "/dashboard/ceo",
      DIRECTOR: "/dashboard/director",
      SUPER_ADMIN: "/dashboard/superadmin",
      SUPERADMIN: "/dashboard/superadmin",
      CENTER_MANAGER: "/dashboard/centermanager",
      CENTER_ADMIN: "/dashboard/academy",
      TEACHER: "/dashboard/teacher",
      STUDENT: "/dashboard/student",
      PARENT: "/dashboard/parent",
      STAFF: "/dashboard/staff",
      USER: "/dashboard/guest",
      GUEST: "/dashboard/guest",
      PENDING: "/dashboard/guest",
    };
    
    if (normalizedRole && roleRoutes[normalizedRole]) {
      router.replace(roleRoutes[normalizedRole]);
      return;
    }
    
    // If unknown role, redirect to guest
    if (normalizedRole && !roleRoutes[normalizedRole]) {
      router.replace("/dashboard/guest");
      return;
    }
    
    if (!userLoading) {
      fetchDashboardData();
    }
  }, [router, userLoading, userCenterId]);

  const fetchDashboardData = async () => {
    try {
      // Build URLs with center filter for CENTER_MANAGER
      const studentsUrl = shouldFilterByCenter 
        ? buildCenterFilterUrl("/api/students", userCenterId) 
        : "/api/students";
      const teachersUrl = shouldFilterByCenter 
        ? buildCenterFilterUrl("/api/teachers", userCenterId) 
        : "/api/teachers";
      const classesUrl = shouldFilterByCenter 
        ? buildCenterFilterUrl("/api/classes", userCenterId) 
        : "/api/classes";
      
      const [students, teachers, centersData, classes] = await Promise.all([
        apiFetch(studentsUrl).catch(() => []),
        apiFetch(teachersUrl).catch(() => []),
        apiFetch("/api/centers").catch(() => []),
        apiFetch(classesUrl).catch(() => [])
      ]);

      // Store centers data
      setCenters(Array.isArray(centersData) ? centersData : []);

      // Calculate total revenue from centers
      const centersArr = Array.isArray(centersData) ? centersData : [];
      const totalRev = centersArr.reduce((sum: number, c: any) => sum + (c.totalRevenue || 0), 0);

      setStats({
        totalStudents: Array.isArray(students) ? students.length : 0,
        totalTeachers: Array.isArray(teachers) ? teachers.length : 0,
        totalCenters: centersArr.length,
        activeClasses: Array.isArray(classes) ? classes.filter((c: any) => c.status === "OPEN" || c.status === "ACTIVE").length : 0,
        attendanceRate: 0,
        pendingLeads: 0,
        totalRevenue: totalRev,
      });

      // Set some recent activities
      setRecentActivities([
        { id: 1, type: "info", message: `${students.length} students registered`, time: "Updated now", icon: "👤" },
        { id: 2, type: "info", message: `${teachers.length} teachers active`, time: "Updated now", icon: "👨‍🏫" },
        { id: 3, type: "info", message: `${centersData.length} centers operating`, time: "Updated now", icon: "🏢" },
      ]);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("dashboard")}</h1>
          <p className="text-gray-500">{t("welcomeBack")}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-lg shadow p-1">
            {(["today", "week", "month"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  period === p ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {t(p)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t("totalStudents")}
          value={stats.totalStudents.toLocaleString()}
          change="+12%"
          changeType="positive"
          icon="👨‍🎓"
          color="blue"
        />
        <StatCard
          title={t("totalTeachers")}
          value={stats.totalTeachers.toLocaleString()}
          change="+3"
          changeType="positive"
          icon="👨‍🏫"
          color="green"
        />
        <StatCard
          title={t("activeClasses")}
          value={stats.activeClasses.toLocaleString()}
          change="+5"
          changeType="positive"
          icon="📚"
          color="purple"
        />
        <StatCard
          title={t("attendanceRate")}
          value={`${stats.attendanceRate}%`}
          change="+2.3%"
          changeType="positive"
          icon="✅"
          color="orange"
        />
      </div>

      {/* Quick Actions for SuperAdmin */}
      <div className="bg-gradient-to-r from-[#0a1a5c] to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">👑</span>
          <h2 className="text-xl font-bold">{t("superadminQuickActions")}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <QuickActionButton href="/dashboard/superadmin/public-website/home" icon="🏠" label={t("editHomepage")} />
          <QuickActionButton href="/dashboard/superadmin/public-website/courses" icon="📖" label={t("editCourses")} />
          <QuickActionButton href="/dashboard/superadmin/public-website/testimonials" icon="💬" label={t("testimonials")} />
          <QuickActionButton href="/dashboard/superadmin/public-website/blog" icon="📝" label={t("blogPosts")} />
          <QuickActionButton href="/dashboard/superadmin/centers" icon="🏢" label={t("allCenters")} />
          <QuickActionButton href="/dashboard/superadmin/settings" icon="⚙️" label={t("settings")} />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">{t("recentActivities")}</h2>
            <Link href="/dashboard/activities" className="text-sm text-blue-600 hover:text-blue-700">
              {t("viewAll")} →
            </Link>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <p className="text-gray-900">{activity.message}</p>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CRM Leads Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">{t("pendingLeads")}</h2>
            <Link href="/dashboard/crm/leads" className="text-sm text-blue-600 hover:text-blue-700">
              {t("viewAll")} →
            </Link>
          </div>
          <div className="space-y-4">
            <div className="text-center py-4">
              <p className="text-4xl font-bold text-orange-500">{stats.pendingLeads}</p>
              <p className="text-gray-500">{t("awaitingFollowup")}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-green-600">23</p>
                <p className="text-xs text-gray-500">{t("leads")} Hot</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-yellow-600">45</p>
                <p className="text-xs text-gray-500">{t("leads")} Warm</p>
              </div>
            </div>
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
              + {t("add")} {t("leads")}
            </button>
          </div>
        </div>
      </div>

      {/* Center Overview (SuperAdmin sees all, Center Admin sees own) */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">🏢 {t("centerPerformance")}</h2>
          <Link href="/dashboard/superadmin/centers" className="text-sm text-blue-600 hover:text-blue-700">
            {t("allCenters")} →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-3 font-medium">{t("centers")}</th>
                <th className="pb-3 font-medium">Location</th>
                <th className="pb-3 font-medium">{t("studentsNav")}</th>
                <th className="pb-3 font-medium">{t("teachersNav")}</th>
                <th className="pb-3 font-medium">{t("classes")}</th>
                <th className="pb-3 font-medium">Revenue</th>
                <th className="pb-3 font-medium">{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {centers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    {t("noData")}
                  </td>
                </tr>
              ) : (
                centers.map((center: any) => (
                  <tr key={center.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 font-medium">{center.centerName || center.name || 'N/A'}</td>
                    <td className="py-4 text-gray-600">{center.location || center.city || 'N/A'}</td>
                    <td className="py-4">{center.totalStudents || 0}</td>
                    <td className="py-4">{center.totalTeachers || 0}</td>
                    <td className="py-4">{center.totalClasses || 0}</td>
                    <td className="py-4 text-green-600 font-medium">
                      {center.totalRevenue ? `${center.totalRevenue.toLocaleString()} ₫` : 'N/A'}
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 ${center.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'} rounded-full text-xs font-medium`}>
                        {center.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">📈 Revenue Overview</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Revenue Bars */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-4">Monthly Revenue (Last 6 Months)</h3>
            <div className="space-y-3">
              {[
                { month: "Jan 2026", revenue: stats.totalRevenue * 0.85, target: stats.totalRevenue * 0.8 },
                { month: "Dec 2025", revenue: stats.totalRevenue * 0.92, target: stats.totalRevenue * 0.85 },
                { month: "Nov 2025", revenue: stats.totalRevenue * 0.78, target: stats.totalRevenue * 0.82 },
                { month: "Oct 2025", revenue: stats.totalRevenue * 0.88, target: stats.totalRevenue * 0.8 },
                { month: "Sep 2025", revenue: stats.totalRevenue * 0.75, target: stats.totalRevenue * 0.75 },
                { month: "Aug 2025", revenue: stats.totalRevenue * 0.65, target: stats.totalRevenue * 0.7 },
              ].map((item) => (
                <div key={item.month} className="flex items-center gap-4">
                  <span className="w-20 text-sm text-gray-500">{item.month}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                      style={{ width: `${Math.min((item.revenue / (stats.totalRevenue || 1)) * 100, 100)}%` }}
                    ></div>
                    <div 
                      className="absolute top-0 h-full w-0.5 bg-green-500"
                      style={{ left: `${Math.min((item.target / (stats.totalRevenue || 1)) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className="w-28 text-sm font-medium text-right">
                    {item.revenue ? `${(item.revenue / 1000000).toFixed(1)}M ₫` : '0'}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded"></span> Actual</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500"></span> Target</span>
            </div>
          </div>
          
          {/* Revenue by Center */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-4">Revenue by Center</h3>
            <div className="space-y-3">
              {centers.slice(0, 5).map((center, index) => {
                const centerRevenue = center.totalRevenue || Math.floor(stats.totalRevenue * (0.3 - index * 0.05));
                const percentage = stats.totalRevenue ? (centerRevenue / stats.totalRevenue) * 100 : 0;
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
                return (
                  <div key={center.id} className="flex items-center gap-4">
                    <span className="w-32 text-sm text-gray-700 truncate">{center.name}</span>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${colors[index % colors.length]} rounded-full`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                    <span className="w-20 text-sm text-gray-600 text-right">{percentage.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
            {centers.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">No center data available</p>
            )}
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.totalRevenue ? `${(stats.totalRevenue / 1000000).toFixed(1)}M` : '0'}</p>
            <p className="text-xs text-gray-500">Total Revenue (₫)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.totalStudents || 0}</p>
            <p className="text-xs text-gray-500">Students Enrolled</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {stats.totalRevenue && stats.totalStudents ? `${(stats.totalRevenue / stats.totalStudents / 1000).toFixed(0)}K` : '0'}
            </p>
            <p className="text-xs text-gray-500">Avg Revenue/Student (₫)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">+{((stats.totalRevenue || 0) * 0.12 / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-gray-500">Growth This Month (₫)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, change, changeType, icon, color }: {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  icon: string;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${colorClasses[color]}`}>
          {icon}
        </div>
        <span className={`text-sm font-medium ${changeType === "positive" ? "text-green-600" : "text-red-600"}`}>
          {change}
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  );
}

// Quick Action Button Component
function QuickActionButton({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs text-center">{label}</span>
    </Link>
  );
}
