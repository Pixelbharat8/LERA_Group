"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { apiFetch, hasAuthSession } from "../../../lib/api";
import { useLanguage } from "../../context/LanguageContext";

export default function CEODashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalRevenue: 0,
    totalCenters: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalEnrollments: 0,
    growthRate: 0
  });
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  const quickActions = [
    { label: t("financialReports"), href: "/dashboard/ceo/finance", icon: "💰", color: "bg-green-600" },
    { label: t("allCenters"), href: "/dashboard/ceo/centers", icon: "🏢", color: "bg-blue-600" },
    { label: t("analytics"), href: "/dashboard/ceo/analytics", icon: "📊", color: "bg-purple-600" },
    { label: t("strategicPlans"), href: "/dashboard/ceo/strategy", icon: "🎯", color: "bg-orange-600" },
  ];

  useEffect(() => {
    if (!hasAuthSession()) { router.push("/auth/login"); return; }
    try {
      const userData = Cookies.get("userData");
      if (userData) setUser(JSON.parse(decodeURIComponent(userData)));
    } catch (e) { console.error(e); }
    fetchStats();
  }, [router]);

  const fetchStats = async () => {
    try {
      const [centersData, studentsData, financeData, teachersData, enrollmentsData, paymentsData] = await Promise.all([
        apiFetch("/api/centers").catch(() => []),
        apiFetch("/api/students").catch(() => []),
        apiFetch("/api/finance/dashboard").catch(() => null),
        apiFetch("/api/users?role=TEACHER").catch(() => []),
        apiFetch("/api/enrollments").catch(() => []),
        apiFetch("/api/payments").catch(() => []),
      ]);

      const centers = Array.isArray(centersData) ? centersData.length : (centersData?.content?.length || 0);
      const studentsList = Array.isArray(studentsData) ? studentsData : (studentsData?.content || []);
      const students = studentsList.length;
      const teachersList = Array.isArray(teachersData) ? teachersData : (teachersData?.content || []);
      const teachers = teachersList.length;
      const enrollmentsList = Array.isArray(enrollmentsData) ? enrollmentsData : [];
      const paymentList = Array.isArray(paymentsData) ? paymentsData : [];
      const revenue = financeData?.totalRevenue || paymentList
        .filter((p: any) => p.status === "COMPLETED")
        .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

      setDashboardStats({
        totalRevenue: revenue,
        totalCenters: centers,
        totalStudents: students,
        totalTeachers: teachers,
        totalEnrollments: enrollmentsList.length,
        growthRate: 0
      });

      // Store recent students and payments for display
      setRecentStudents(
        [...studentsList]
          .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
          .slice(0, 5)
      );
      setRecentPayments(
        [...paymentList]
          .sort((a: any, b: any) => new Date(b.createdAt || b.paymentDate || 0).getTime() - new Date(a.createdAt || a.paymentDate || 0).getTime())
          .slice(0, 5)
      );
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) return `₫${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `₫${(amount / 1000000).toFixed(1)}M`;
    return `₫${amount.toLocaleString()}`;
  };

  const stats = [
    { label: t("totalRevenue"), value: formatCurrency(dashboardStats.totalRevenue), icon: "💰", color: "bg-green-500" },
    { label: t("totalCenters"), value: dashboardStats.totalCenters.toString(), icon: "🏢", color: "bg-blue-500" },
    { label: t("totalStudents"), value: dashboardStats.totalStudents.toLocaleString(), icon: "👨‍🎓", color: "bg-purple-500" },
    { label: t("totalTeachers"), value: dashboardStats.totalTeachers.toLocaleString(), icon: "👨‍🏫", color: "bg-indigo-500" },
    { label: t("enrollments"), value: dashboardStats.totalEnrollments.toLocaleString(), icon: "📝", color: "bg-teal-500" },
    { label: t("growthRate"), value: dashboardStats.growthRate > 0 ? `+${dashboardStats.growthRate}%` : "N/A", icon: "📈", color: "bg-yellow-500" },
  ];

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-3xl font-bold text-gray-800">{t("ceoDashboard")}</h1><p className="text-gray-600">{t("executiveOverview")}</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-xl shadow-lg p-6">
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
            <Link key={i} href={a.href}><div className={`${a.color} text-white p-4 rounded-xl text-center`}><div className="text-3xl mb-2">{a.icon}</div><p>{a.label}</p></div></Link>
          ))}
        </div>
      </div>

      {/* Recent Students - interconnected data from all centers */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">👨‍🎓 {t("recentStudents")}</h2>
        {recentStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">{t("name")}</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">{t("code")}</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">{t("email")}</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">{t("status")}</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">{t("date")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentStudents.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{s.fullname || s.name || "-"}</td>
                    <td className="px-4 py-2 text-gray-600">{s.studentCode || "-"}</td>
                    <td className="px-4 py-2 text-gray-600">{s.email || "-"}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        s.status === "ACTIVE" || s.isActive !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>{s.status === "ACTIVE" || s.isActive !== false ? t("active") : t("inactive")}</span>
                    </td>
                    <td className="px-4 py-2 text-gray-500 text-sm">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">{t("noStudentsFound")}</p>
        )}
      </div>

      {/* Recent Payments - interconnected financial data */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">💰 {t("recentPayments")}</h2>
        {recentPayments.length > 0 ? (
          <div className="space-y-3">
            {recentPayments.map((p: any, idx: number) => (
              <div key={p.id || idx} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{t("paymentReceived")}</p>
                  <p className="text-sm text-gray-500">₫{(parseFloat(p.amount) || 0).toLocaleString()} - {p.paymentMethod || "N/A"}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs ${
                    p.status === "COMPLETED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                  }`}>{p.status || "PENDING"}</span>
                  <p className="text-xs text-gray-400 mt-1">
                    {p.createdAt || p.paymentDate ? new Date(p.createdAt || p.paymentDate).toLocaleDateString() : "-"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">{t("noRecentActivity")}</p>
        )}
      </div>
    </div>
  );
}
