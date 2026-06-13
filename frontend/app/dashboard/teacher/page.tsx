"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { apiFetch, hasAuthSession } from "../../../lib/api";
import {
  countStudentsInClasses,
  countTodaySessionsForClasses,
  loadScopedClasses,
  resolveMyTeacherId,
} from "../../../lib/teacher-context";
import { useLanguage } from "../../context/LanguageContext";

export default function TeacherDashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    myClasses: 0,
    myStudents: 0,
    todaySessions: 0,
    pendingAttendance: 0,
  });

  const quickActions = [
    { label: t("mySchedule"), href: "/dashboard/teacher/schedule", icon: "📅", color: "bg-indigo-600" },
    { label: t("takeAttendance"), href: "/dashboard/teacher/attendance", icon: "✅", color: "bg-green-600" },
    { label: t("myClasses"), href: "/dashboard/teacher/classes", icon: "📚", color: "bg-blue-600" },
    { label: t("myGrades"), href: "/dashboard/teacher/grades", icon: "📊", color: "bg-orange-600" },
    { label: t("studentList"), href: "/dashboard/teacher/students", icon: "👨‍🎓", color: "bg-purple-600" },
    { label: t("messages"), href: "/dashboard/teacher/messages", icon: "💬", color: "bg-pink-600" },
  ];

  const fetchTeacherStats = async () => {
    try {
      const teacherEntityId = await resolveMyTeacherId();
      const classes = teacherEntityId
        ? await loadScopedClasses("teacher", teacherEntityId)
        : [];
      const classIds = classes.map((c) => c.id);
      const today = new Date().toISOString().split("T")[0];

      const [studentCount, todaySessionCount, sessionLists] = await Promise.all([
        countStudentsInClasses(classIds),
        countTodaySessionsForClasses(classIds),
        Promise.all(
          classIds.map((id) =>
            apiFetch(`/api/class-sessions?classId=${id}`).catch(() => [])
          )
        ),
      ]);
      const todaySessions = sessionLists
        .flat()
        .filter((s): s is { sessionDate?: string; status?: string } => !!s && typeof s === "object")
        .filter((s) => String(s.sessionDate || "").startsWith(today));
      const pendingAttendance = todaySessions.filter((s) => s.status !== "COMPLETED").length;

      setStatsData({
        myClasses: classes.length,
        myStudents: studentCount,
        todaySessions: todaySessionCount,
        pendingAttendance,
      });
    } catch (error) {
      console.error("Error fetching teacher stats:", error);
    }
  };

  useEffect(() => {
    if (!hasAuthSession()) {
      router.push("/auth/login");
      return;
    }
    
    try {
      const userData = Cookies.get("userData");
      if (userData) {
        const parsed = JSON.parse(decodeURIComponent(userData));
        setUser(parsed);
        fetchTeacherStats();
      }
    } catch (e) {
      console.error("Error parsing user data:", e);
    }
    setLoading(false);
  }, [router]);

  const stats = [
    { label: t("myClasses"), value: statsData.myClasses.toString(), icon: "📚", color: "bg-blue-500" },
    { label: t("myStudents"), value: statsData.myStudents.toString(), icon: "👨‍🎓", color: "bg-green-500" },
    { label: t("todaySessions"), value: statsData.todaySessions.toString(), icon: "📅", color: "bg-purple-500" },
    { label: t("pendingAttendance"), value: statsData.pendingAttendance.toString(), icon: "✅", color: "bg-orange-500" },
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
          <h1 className="text-3xl font-bold text-gray-800">{t("teacherDashboard")}</h1>
          <p className="text-gray-600">{t("welcomeTeacher")}, {user?.firstName || user?.email || "Teacher"}!</p>
        </div>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
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
        <h2 className="text-xl font-bold text-gray-800 mb-4">{t("quickActions")}</h2>
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

      {/* Today's Schedule */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{t("todaysSchedule")}</h2>
        <div className="space-y-4">
          <div className="flex items-center p-4 bg-blue-50 rounded-lg">
            <div className="text-blue-600 font-bold mr-4">09:00</div>
            <div className="flex-1">
              <p className="font-medium">English Beginners - Class A</p>
              <p className="text-sm text-gray-500">Room 101 • 25 students</p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">Completed</span>
          </div>
          <div className="flex items-center p-4 bg-purple-50 rounded-lg">
            <div className="text-purple-600 font-bold mr-4">11:00</div>
            <div className="flex-1">
              <p className="font-medium">IELTS Preparation</p>
              <p className="text-sm text-gray-500">Room 203 • 15 students</p>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">In Progress</span>
          </div>
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <div className="text-gray-600 font-bold mr-4">14:00</div>
            <div className="flex-1">
              <p className="font-medium">Advanced Speaking</p>
              <p className="text-sm text-gray-500">Room 105 • 12 students</p>
            </div>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">Upcoming</span>
          </div>
        </div>
      </div>
    </div>
  );
}
