"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { apiFetch, hasAuthSession } from "../../../lib/api";
import { buildCenterFilterUrl } from "../../../lib/center-filter";
import { useUserCenter } from "../../hooks/useUserCenter";
import { useLanguage } from "../../context/LanguageContext";

export default function AcademicManagerDashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const { centerId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    totalClasses: 0,
    activeTeachers: 0,
    totalCourses: 0,
    avgAttendance: 0,
  });
  const [recentClasses, setRecentClasses] = useState<any[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);

  const quickActions = [
    { label: "Manage Classes", href: "/dashboard/academicmanager/classes", icon: "📚", color: "bg-blue-600" },
    { label: "Teachers", href: "/dashboard/academicmanager/teachers", icon: "👨‍🏫", color: "bg-green-600" },
    { label: "Courses", href: "/dashboard/academicmanager/courses", icon: "📖", color: "bg-purple-600" },
    { label: "Reports", href: "/dashboard/reports", icon: "📊", color: "bg-orange-600" },
  ];

  useEffect(() => {
    if (!hasAuthSession()) {
      router.push("/auth/login");
      return;
    }
    
    try {
      const userData = Cookies.get("userData");
      if (userData) {
        setUser(JSON.parse(decodeURIComponent(userData)));
      }
    } catch (e) {
      console.error("Error parsing user data:", e);
    }
    if (!userLoading) {
      fetchDashboardData();
    }
  }, [router, userLoading, centerId]);

  const fetchDashboardData = async () => {
    try {
      const center = shouldFilterByCenter ? centerId : null;
      const [classes, teachers, courses, attendanceRes, examsRes] = await Promise.all([
        apiFetch(buildCenterFilterUrl("/api/classes", center)).catch(() => []),
        apiFetch(buildCenterFilterUrl("/api/teachers", center)).catch(() => []),
        apiFetch("/api/courses").catch(() => []),
        apiFetch(center ? `/api/attendance/summary?centerId=${encodeURIComponent(center)}` : "/api/attendance/summary").catch(() => null),
        apiFetch(buildCenterFilterUrl("/api/exams", center)).catch(() => []),
      ]);

      const classCount = Array.isArray(classes) ? classes.length : 0;
      const teacherCount = Array.isArray(teachers) ? teachers.filter((t: any) => t.status === 'active' || !t.status).length : 0;
      const courseCount = Array.isArray(courses) ? courses.length : 0;
      const avgAttendance = attendanceRes && typeof (attendanceRes as any).attendanceRate === "number"
        ? Math.round((attendanceRes as any).attendanceRate)
        : 0;

      setStatsData({
        totalClasses: classCount,
        activeTeachers: teacherCount,
        totalCourses: courseCount,
        avgAttendance,
      });

      // Set recent classes for display
      if (Array.isArray(classes)) {
        setRecentClasses(classes.slice(0, 3));
      }

      // Upcoming exams (real) replace the old hardcoded "Final Exams / Graduation" block.
      const now = Date.now();
      const upcoming = (Array.isArray(examsRes) ? examsRes : [])
        .filter((e: any) => {
          const d = new Date(e.examDate || e.date || e.startDate).getTime();
          return !isNaN(d) && d >= now;
        })
        .sort((a: any, b: any) =>
          new Date(a.examDate || a.date || a.startDate).getTime() -
          new Date(b.examDate || b.date || b.startDate).getTime())
        .slice(0, 3);
      setUpcomingExams(upcoming);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: "Total Classes", value: statsData.totalClasses.toString(), icon: "📚", color: "bg-blue-500", href: "/dashboard/academicmanager/classes" },
    { label: "Active Teachers", value: statsData.activeTeachers.toString(), icon: "👨‍🏫", color: "bg-green-500", href: "/dashboard/academicmanager/teachers" },
    { label: "Total Courses", value: statsData.totalCourses.toString(), icon: "📖", color: "bg-purple-500", href: "/dashboard/academicmanager/courses" },
    { label: "Avg. Attendance", value: `${statsData.avgAttendance}%`, icon: "📊", color: "bg-orange-500", href: "/dashboard/attendance" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{t("academicManagerDashboard")}</h1>
          <p className="text-gray-600">{t("academyOverview")}</p>
        </div>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} onClick={() => (stat as any).href && (window.location.href = (stat as any).href)} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-4 rounded-full text-2xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <div className={`${action.color} text-white p-4 rounded-xl text-center hover:opacity-90 transition-opacity cursor-pointer`}>
                <div className="text-3xl mb-2">{action.icon}</div>
                <p className="font-medium">{action.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Class Performance</h2>
          <div className="space-y-4">
            {recentClasses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No classes found</p>
            ) : (
              recentClasses.map((cls, index) => (
                <div key={cls.id || index} className={`flex items-center justify-between p-3 ${
                  index === 0 ? 'bg-green-50' : index === 1 ? 'bg-blue-50' : 'bg-purple-50'
                } rounded-lg`}>
                  <span className="font-medium">{cls.name || cls.className || 'Class'}</span>
                  <span className={`${
                    index === 0 ? 'text-green-600' : index === 1 ? 'text-blue-600' : 'text-purple-600'
                  } font-bold`}>{cls.attendanceRate || 0}%</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Upcoming Exams</h2>
          <div className="space-y-4">
            {upcomingExams.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No upcoming exams scheduled</p>
            ) : (
              upcomingExams.map((exam, index) => {
                const d = new Date(exam.examDate || exam.date || exam.startDate);
                return (
                  <div key={exam.id || index} className="flex items-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-orange-600 text-2xl mr-3">📅</div>
                    <div>
                      <p className="font-medium">{exam.name || exam.title || "Exam"}</p>
                      <p className="text-sm text-gray-500">
                        {isNaN(d.getTime()) ? "Date TBD" : d.toLocaleDateString()}
                        {exam.subject ? ` • ${exam.subject}` : ""}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
