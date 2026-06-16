"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { apiFetch, hasAuthSession } from "../../../lib/api";
import {
  computeMyChildrenAvgAttendance,
  loadMyChildren,
  resolveMyParentUserId,
} from "../../../lib/parent-context";
import {
  isParentDashboardLinkHidden,
  PARENT_PRIMARY_HREFS,
} from "../../../lib/lera-modules";
import { useLanguage } from "../../context/LanguageContext";

export default function ParentDashboard() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    children: 0,
    avgAttendance: 0,
    upcomingFees: 0,
    messages: 0,
  });

  const quickActionsAll = [
    { label: t("childrenProgress"), href: "/dashboard/parent/children", icon: "👨‍👧‍👦", color: "bg-blue-600" },
    { label: t("schedule"), href: "/dashboard/parent/schedule", icon: "📅", color: "bg-indigo-600" },
    { label: t("grades"), href: "/dashboard/parent/grades", icon: "📊", color: "bg-green-600" },
    { label: t("attendance"), href: "/dashboard/parent/attendance", icon: "✅", color: "bg-teal-600" },
    { label: t("payments"), href: "/dashboard/parent/payments", icon: "💰", color: "bg-orange-600" },
    { label: t("messages"), href: "/dashboard/parent/messages", icon: "💬", color: "bg-purple-600" },
    { label: t("communication"), href: "/dashboard/parent/communication", icon: "📞", color: "bg-red-600" },
    { label: t("leraConnect"), href: "/dashboard/connect", icon: "🔗", color: "bg-pink-600" },
    { label: "Permission Slips", href: "/dashboard/parent/permission-slips", icon: "📝", color: "bg-emerald-600" },
    { label: "Resources", href: "/dashboard/parent/resources", icon: "📚", color: "bg-amber-600" },
    { label: t("profile"), href: "/dashboard/parent/profile", icon: "👤", color: "bg-gray-600" },
  ];

  const quickActions = quickActionsAll
    .filter((a) => !isParentDashboardLinkHidden(a.href))
    .sort((a, b) => {
      const pa = PARENT_PRIMARY_HREFS.includes(a.href as (typeof PARENT_PRIMARY_HREFS)[number]) ? 0 : 1;
      const pb = PARENT_PRIMARY_HREFS.includes(b.href as (typeof PARENT_PRIMARY_HREFS)[number]) ? 0 : 1;
      return pa - pb;
    });

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `₫${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `₫${(amount / 1000).toFixed(0)}K`;
    return `₫${amount}`;
  };

  const fetchParentStats = async () => {
    try {
      const parentUserId = await resolveMyParentUserId();
      if (!parentUserId) return;

      const [children, invoices, messages, avgAttendance] = await Promise.all([
        loadMyChildren(),
        apiFetch(`/api/invoices?parentId=${parentUserId}&status=pending`).catch(() => []),
        apiFetch(`/api/messages/unread?userId=${parentUserId}`).catch(() => []),
        computeMyChildrenAvgAttendance(),
      ]);

      const totalPending = Array.isArray(invoices)
        ? invoices.reduce((sum: number, inv: { amount?: number }) => sum + (inv.amount || 0), 0)
        : 0;

      setStatsData({
        children: children.length,
        avgAttendance,
        upcomingFees: totalPending,
        messages: Array.isArray(messages) ? messages.length : 0,
      });
    } catch (error) {
      console.error("Error fetching parent stats:", error);
    }
  };

  useEffect(() => {
    if (!hasAuthSession()) { router.push("/auth/login"); return; }
    try {
      const userData = Cookies.get("userData");
      if (userData) {
        const parsed = JSON.parse(decodeURIComponent(userData));
        setUser(parsed);
        fetchParentStats();
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [router]);

  const stats = [
    { label: t("children"), value: statsData.children.toString(), icon: "👨‍👧‍👦", color: "bg-blue-500" },
    { label: t("avgAttendance"), value: `${statsData.avgAttendance}%`, icon: "✅", color: "bg-green-500" },
    { label: t("upcomingFees"), value: formatCurrency(statsData.upcomingFees), icon: "💰", color: "bg-orange-500" },
    { label: t("messages"), value: statsData.messages.toString(), icon: "💬", color: "bg-purple-500" },
  ];

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-3xl font-bold text-gray-800">{t("parentDashboard")}</h1><p className="text-gray-600">{t("monitorProgress")}</p></div>
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
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-2">{language === "VI" ? "Việc chính" : "Primary tasks"}</h2>
          <p className="text-sm text-gray-500 mb-4">
            {language === "VI"
              ? "Lịch, học phí, tin nhắn, điểm danh, con cái — tối ưu màn hình nhỏ."
              : "Schedule, fees, messages, attendance, children — optimized for small screens."}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {quickActions
              .filter((a) => PARENT_PRIMARY_HREFS.includes(a.href as (typeof PARENT_PRIMARY_HREFS)[number]))
              .map((a, i) => (
                <Link key={i} href={a.href}>
                  <div
                    className={`${a.color} text-white p-4 rounded-xl text-center hover:opacity-90 transition-opacity min-h-[100px] flex flex-col justify-center`}
                  >
                    <div className="text-2xl mb-1">{a.icon}</div>
                    <p className="text-sm font-medium leading-tight">{a.label}</p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-700">{language === "VI" ? "Thêm" : "More"}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions
              .filter((a) => !PARENT_PRIMARY_HREFS.includes(a.href as (typeof PARENT_PRIMARY_HREFS)[number]))
              .map((a, i) => (
                <Link key={i} href={a.href}>
                  <div
                    className={`${a.color} text-white p-4 rounded-xl text-center hover:opacity-90 transition-opacity`}
                  >
                    <div className="text-3xl mb-2">{a.icon}</div>
                    <p>{a.label}</p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
