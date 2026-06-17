"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { apiFetch, hasAuthSession } from "../../../lib/api";
import { useLanguage } from "../../context/LanguageContext";

export default function DirectorDashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    totalCenters: 0,
    totalStudents: 0,
    totalStaff: 0,
    totalRevenue: 0,
  });

  const quickActions = [
    { label: t("centers"), href: "/dashboard/director/centers", icon: "🏢", color: "bg-blue-600" },
    { label: t("reports"), href: "/dashboard/director/reports", icon: "📊", color: "bg-green-600" },
    { label: t("totalStaff"), href: "/dashboard/director/staff", icon: "👥", color: "bg-purple-600" },
    { label: t("analytics"), href: "/dashboard/director/analytics", icon: "📈", color: "bg-orange-600" },
  ];

  useEffect(() => {
    if (!hasAuthSession()) { router.push("/auth/login"); return; }
    try {
      const userData = Cookies.get("userData");
      if (userData) setUser(JSON.parse(decodeURIComponent(userData)));
    } catch (e) { console.error(e); }
    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      const [centers, students, users, paymentsData, enrollmentsData] = await Promise.all([
        apiFetch("/api/centers").catch(() => []),
        apiFetch("/api/students").catch(() => []),
        apiFetch("/api/users").catch(() => []),
        apiFetch("/api/payments").catch(() => []),
        apiFetch("/api/enrollments").catch(() => []),
      ]);

      const centerCount = Array.isArray(centers) ? centers.length : 0;
      const studentCount = Array.isArray(students) ? students.length : 0;
      const staffCount = Array.isArray(users) ? users.length : 0;
      const paymentList = Array.isArray(paymentsData) ? paymentsData : [];
      const totalRevenue = paymentList
        .filter((p: any) => p.status === "COMPLETED")
        .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

      setStatsData({
        totalCenters: centerCount,
        totalStudents: studentCount,
        totalStaff: staffCount,
        totalRevenue: totalRevenue,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) return `₫${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `₫${(amount / 1000000).toFixed(0)}M`;
    return `₫${amount.toLocaleString()}`;
  };

  const stats = [
    { label: t("totalCenters"), value: statsData.totalCenters.toString(), icon: "🏢", color: "bg-blue-500", href: "/dashboard/director/centers" },
    { label: t("totalStudents"), value: statsData.totalStudents.toLocaleString(), icon: "👨‍🎓", color: "bg-green-500", href: "/dashboard/academy/students" },
    { label: t("totalStaff"), value: statsData.totalStaff.toString(), icon: "👥", color: "bg-purple-500", href: "/dashboard/director/staff" },
    { label: t("monthlyRevenue"), value: formatCurrency(statsData.totalRevenue), icon: "💰", color: "bg-yellow-500", href: "/dashboard/finance" },
  ];

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-3xl font-bold text-gray-800">{t("directorDashboard")}</h1><p className="text-gray-600">{t("strategicOverview")}</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} onClick={() => (s as any).href && (window.location.href = (s as any).href)} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer">
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
