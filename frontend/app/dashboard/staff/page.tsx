"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { apiFetch, hasAuthSession } from "../../../lib/api";
import { useLanguage } from "../../context/LanguageContext";

export default function StaffDashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    tasksToday: 0,
    completed: 0,
    pending: 0,
    messages: 0,
  });

  const quickActions = [
    { label: t("myTasks"), href: "/dashboard/staff/tasks", icon: "📋", color: "bg-blue-600" },
    { label: t("attendance"), href: "/dashboard/staff/attendance", icon: "✅", color: "bg-green-600" },
    { label: t("myCalendar"), href: "/dashboard/staff/calendar", icon: "📅", color: "bg-orange-600" },
    { label: t("messages"), href: "/dashboard/staff/messages", icon: "💬", color: "bg-purple-600" },
    { label: "My Workspace", href: "/dashboard/self-service", icon: "🙋", color: "bg-indigo-600" },
    { label: "Training", href: "/dashboard/training", icon: "📚", color: "bg-teal-600" },
    { label: "Performance", href: "/dashboard/performance", icon: "⭐", color: "bg-amber-600" },
    { label: "Recruitment", href: "/dashboard/recruitment", icon: "🧑‍💼", color: "bg-rose-600" },
  ];

  const fetchStaffStats = async (staffId: string | number) => {
    try {
      const [tasks, messages] = await Promise.all([
        apiFetch(`/api/tasks?assigneeId=${staffId}`).catch(() => []),
        apiFetch(`/api/messages/unread?userId=${staffId}`).catch(() => []),
      ]);

      const completedTasks = Array.isArray(tasks) 
        ? tasks.filter((t: any) => t.status === 'completed').length 
        : 0;
      const pendingTasks = Array.isArray(tasks) 
        ? tasks.filter((t: any) => t.status === 'pending').length 
        : 0;

      setStatsData({
        tasksToday: Array.isArray(tasks) ? tasks.length : 0,
        completed: completedTasks,
        pending: pendingTasks,
        messages: Array.isArray(messages) ? messages.length : 0,
      });
    } catch (error) {
      console.error("Error fetching staff stats:", error);
    }
  };

  useEffect(() => {
    if (!hasAuthSession()) { router.push("/auth/login"); return; }
    try {
      const userData = Cookies.get("userData");
      if (userData) {
        const parsed = JSON.parse(decodeURIComponent(userData));
        setUser(parsed);
        fetchStaffStats(parsed.id || parsed.userId);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [router]);

  const stats = [
    { label: t("tasksToday"), value: statsData.tasksToday.toString(), icon: "📋", color: "bg-blue-500" },
    { label: t("completed"), value: statsData.completed.toString(), icon: "✅", color: "bg-green-500" },
    { label: t("pending"), value: statsData.pending.toString(), icon: "⏳", color: "bg-orange-500" },
    { label: t("messages"), value: statsData.messages.toString(), icon: "💬", color: "bg-purple-500" },
  ];

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-3xl font-bold text-gray-800">{t("staffDashboard")}</h1><p className="text-gray-600">{t("welcomeStaff")}, {user?.firstName || "Staff"}!</p></div>
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
