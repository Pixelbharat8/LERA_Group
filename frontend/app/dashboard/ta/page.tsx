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

export default function TADashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    assignedClasses: 0,
    studentsHelping: 0,
    todaySessions: 0,
    tasks: 0,
  });

  const quickActions = [
    { label: t("myClasses"), href: "/dashboard/ta/classes", icon: "📚", color: "bg-blue-600" },
    { label: t("grades"), href: "/dashboard/ta/grades", icon: "📊", color: "bg-indigo-600" },
    { label: t("attendance"), href: "/dashboard/ta/attendance", icon: "✅", color: "bg-green-600" },
    { label: t("tasks"), href: "/dashboard/ta/tasks", icon: "📋", color: "bg-orange-600" },
    { label: t("messages"), href: "/dashboard/ta/messages", icon: "💬", color: "bg-purple-600" },
  ];

  const fetchTAStats = async (userId: string) => {
    try {
      const teacherEntityId = await resolveMyTeacherId();
      const classes = teacherEntityId ? await loadScopedClasses("ta", teacherEntityId) : [];
      const classIds = classes.map((c) => c.id);
      const [studentCount, tasks, todayCount] = await Promise.all([
        countStudentsInClasses(classIds),
        apiFetch(`/api/tasks?assigneeId=${userId}`).catch(() => []),
        countTodaySessionsForClasses(classIds),
      ]);

      setStatsData({
        assignedClasses: classes.length,
        studentsHelping: studentCount,
        todaySessions: todayCount,
        tasks: Array.isArray(tasks)
          ? tasks.filter((t: { status?: string }) => t.status === "pending").length
          : 0,
      });
    } catch (error) {
      console.error("Error fetching TA stats:", error);
    }
  };

  useEffect(() => {
    if (!hasAuthSession()) { router.push("/auth/login"); return; }
    try {
      const userData = Cookies.get("userData");
      if (userData) {
        const parsed = JSON.parse(decodeURIComponent(userData));
        setUser(parsed);
        fetchTAStats(String(parsed.id || parsed.userId || ""));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [router]);

  const stats = [
    { label: t("assignedClasses"), value: statsData.assignedClasses.toString(), icon: "📚", color: "bg-blue-500" },
    { label: t("studentsHelping"), value: statsData.studentsHelping.toString(), icon: "👨‍🎓", color: "bg-green-500" },
    { label: t("todaySessions"), value: statsData.todaySessions.toString(), icon: "📅", color: "bg-purple-500" },
    { label: t("tasks"), value: statsData.tasks.toString(), icon: "📋", color: "bg-orange-500" },
  ];

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-3xl font-bold text-gray-800">{t("taDashboard")}</h1><p className="text-gray-600">{t("welcomeTA")}, {user?.firstName || "TA"}!</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">{s.label}</p><p className="text-3xl font-bold">{s.value}</p></div>
              <div className={`${s.color} p-4 rounded-full text-2xl`}>{s.icon}</div>
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
