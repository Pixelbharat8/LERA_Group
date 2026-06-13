"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { apiFetch, hasAuthSession } from "../../../lib/api";
import {
  computeAttendanceRate,
  resolveMyStudentId,
} from "../../../lib/student-context";
import { useLanguage } from "../../context/LanguageContext";

export default function StudentDashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    myCourses: 0,
    attendanceRate: 0,
    upcomingClasses: 0,
    assignmentsDue: 0,
  });

  const quickActions = [
    { label: t("myClasses"), href: "/dashboard/student/classes", icon: "📚", color: "bg-blue-600" },
    { label: t("schedule"), href: "/dashboard/student/schedule", icon: "📅", color: "bg-indigo-600" },
    { label: t("grades"), href: "/dashboard/student/grades", icon: "📊", color: "bg-green-600" },
    { label: t("assignments"), href: "/dashboard/student/assignments", icon: "📝", color: "bg-purple-600" },
    { label: t("attendance"), href: "/dashboard/student/attendance", icon: "✅", color: "bg-teal-600" },
    { label: t("payments"), href: "/dashboard/student/payments", icon: "💰", color: "bg-orange-600" },
    { label: t("messages"), href: "/dashboard/student/messages", icon: "💬", color: "bg-pink-600" },
    { label: t("profile"), href: "/dashboard/student/profile", icon: "👤", color: "bg-gray-600" },
  ];

  const fetchStudentStats = async (studentId: string | number) => {
    try {
      const [enrollments, assignments, schedules] = await Promise.all([
        apiFetch(`/api/enrollments?studentId=${studentId}`).catch(() => []),
        apiFetch(`/api/assignments?studentId=${studentId}`).catch(() => []),
        apiFetch(`/api/schedules/student/${studentId}`).catch(() => []),
      ]);

      const pendingAssignments = Array.isArray(assignments)
        ? assignments.filter((a: any) => a.status === 'pending' || !a.submittedAt).length
        : 0;

      // Get upcoming classes (next 7 days)
      const upcoming = Array.isArray(schedules)
        ? schedules.filter((s: any) => new Date(s.date) > new Date()).length
        : 0;

      const attendanceRate = await computeAttendanceRate(String(studentId));

      setStatsData({
        myCourses: Array.isArray(enrollments) ? enrollments.length : 0,
        attendanceRate,
        upcomingClasses: upcoming,
        assignmentsDue: pendingAssignments,
      });
    } catch (error) {
      console.error("Error fetching student stats:", error);
    }
  };

  useEffect(() => {
    if (!hasAuthSession()) {
      router.push("/auth/login");
      return;
    }
    (async () => {
      try {
        const userData = Cookies.get("userData");
        if (userData) {
          const parsed = JSON.parse(decodeURIComponent(userData));
          setUser(parsed);
          const academyStudentId = await resolveMyStudentId();
          if (academyStudentId) {
            await fetchStudentStats(academyStudentId);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const stats = [
    { label: t("myCourses"), value: statsData.myCourses.toString(), icon: "📚", color: "bg-blue-500" },
    { label: t("attendanceRate"), value: `${statsData.attendanceRate}%`, icon: "✅", color: "bg-green-500" },
    { label: t("upcomingClasses"), value: statsData.upcomingClasses.toString(), icon: "📅", color: "bg-purple-500" },
    { label: t("assignmentsDue"), value: statsData.assignmentsDue.toString(), icon: "📝", color: "bg-orange-500" },
  ];

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{t("studentDashboard")}</h1>
          <p className="text-gray-600">{t("welcomeStudent")}, {user?.firstName || "Student"}!</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">{stat.label}</p><p className="text-3xl font-bold">{stat.value}</p></div>
              <div className={`${stat.color} p-4 rounded-full text-2xl`}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">{t("quickActions")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((a, i) => (
            <Link key={i} href={a.href}><div className={`${a.color} text-white p-4 rounded-xl text-center hover:opacity-90 transition-opacity`}><div className="text-3xl mb-2">{a.icon}</div><p>{a.label}</p></div></Link>
          ))}
        </div>
      </div>
    </div>
  );
}
