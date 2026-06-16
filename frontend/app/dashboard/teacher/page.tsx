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

function statusBadge(status: string): {
  label: string;
  pill: string;
  rowBg: string;
  time: string;
} {
  switch (status.toUpperCase()) {
    case "COMPLETED":
      return { label: "Completed", pill: "bg-green-100 text-green-600", rowBg: "bg-green-50", time: "text-green-600" };
    case "IN_PROGRESS":
    case "ONGOING":
      return { label: "In Progress", pill: "bg-blue-100 text-blue-600", rowBg: "bg-blue-50", time: "text-blue-600" };
    case "CANCELLED":
      return { label: "Cancelled", pill: "bg-red-100 text-red-600", rowBg: "bg-red-50", time: "text-red-600" };
    default:
      return { label: "Upcoming", pill: "bg-gray-100 text-gray-600", rowBg: "bg-gray-50", time: "text-gray-600" };
  }
}

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
  type ScheduleRow = {
    id: string;
    time: string;
    className: string;
    room: string;
    students: number;
    status: string;
  };
  const [todaySchedule, setTodaySchedule] = useState<ScheduleRow[]>([]);

  const quickActions = [
    { label: t("mySchedule"), href: "/dashboard/teacher/schedule", icon: "📅", color: "bg-indigo-600" },
    { label: t("takeAttendance"), href: "/dashboard/teacher/attendance", icon: "✅", color: "bg-green-600" },
    { label: t("myClasses"), href: "/dashboard/teacher/classes", icon: "📚", color: "bg-blue-600" },
    { label: t("myGrades"), href: "/dashboard/teacher/grades", icon: "📊", color: "bg-orange-600" },
    { label: t("studentList"), href: "/dashboard/teacher/students", icon: "👨‍🎓", color: "bg-purple-600" },
    { label: t("messages"), href: "/dashboard/teacher/messages", icon: "💬", color: "bg-pink-600" },
    { label: "My Workspace", href: "/dashboard/self-service", icon: "🙋", color: "bg-teal-600" },
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
      const classById = new Map(classes.map((c) => [String(c.id), c]));
      const todaySessions = sessionLists
        .flat()
        .filter(
          (s): s is { id?: string; classId?: string; startTime?: string; sessionDate?: string; status?: string } =>
            !!s && typeof s === "object"
        )
        .filter((s) => String(s.sessionDate || "").startsWith(today));
      const pendingAttendance = todaySessions.filter((s) => s.status !== "COMPLETED").length;

      const schedule: ScheduleRow[] = todaySessions
        .map((s) => {
          const cls = classById.get(String(s.classId));
          return {
            id: String(s.id ?? `${s.classId}-${s.startTime ?? ""}`),
            time: String(s.startTime || "").slice(0, 5) || "—",
            className: cls?.className || cls?.name || "Class",
            room: cls?.room || "",
            students: cls?.enrolledCount ?? 0,
            status: String(s.status || "SCHEDULED"),
          };
        })
        .sort((a, b) => a.time.localeCompare(b.time));
      setTodaySchedule(schedule);

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
        {todaySchedule.length === 0 ? (
          <p className="text-gray-500 text-sm py-6 text-center">{t("noSessionsToday")}</p>
        ) : (
          <div className="space-y-4">
            {todaySchedule.map((row) => {
              const badge = statusBadge(row.status);
              return (
                <div key={row.id} className={`flex items-center p-4 ${badge.rowBg} rounded-lg`}>
                  <div className={`${badge.time} font-bold mr-4`}>{row.time}</div>
                  <div className="flex-1">
                    <p className="font-medium">{row.className}</p>
                    <p className="text-sm text-gray-500">
                      {[row.room && `Room ${row.room}`, `${row.students} ${t("studentsLabel")}`]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                  </div>
                  <span className={`px-3 py-1 ${badge.pill} rounded-full text-sm`}>{badge.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
