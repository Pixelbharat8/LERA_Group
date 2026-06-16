"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { apiFetch, hasAuthSession } from "../../../lib/api";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    totalUsers: 0,
    activeSessions: 0,
    systemHealth: 0,
    pendingTasks: 0,
  });

  const quickActions = [
    { label: "User Management", href: "/dashboard/superadmin/users", icon: "👥", color: "bg-blue-600" },
    { label: "System Settings", href: "/dashboard/superadmin/settings", icon: "⚙️", color: "bg-gray-600" },
    { label: "Audit Logs", href: "/dashboard/superadmin/audit", icon: "📋", color: "bg-green-600" },
    { label: "Data Import", href: "/dashboard/superadmin/data-import", icon: "�", color: "bg-purple-600" },
  ];

  const fetchAdminStats = async () => {
    try {
      let leavePendingUrl = "/api/leave-requests?status=pending";
      try {
        const raw = Cookies.get("userData");
        if (raw) {
          const parsed = JSON.parse(raw) as { roleName?: string; centerId?: string };
          const role = (parsed.roleName || "").toUpperCase();
          const centerId =
            parsed.centerId != null && String(parsed.centerId).trim() !== ""
              ? String(parsed.centerId)
              : null;
          const orgWide = ["SUPER_ADMIN", "SUPERADMIN", "CHAIRMAN", "CEO", "DIRECTOR"].includes(role);
          if (!orgWide && centerId) {
            leavePendingUrl = `/api/leave-requests?status=pending&centerId=${encodeURIComponent(centerId)}`;
          }
        }
      } catch {
        /* ignore bad cookie */
      }

      // null = the call failed; we use that to derive a REAL health signal below
      // instead of a hardcoded "98%".
      const [usersRes, leaveRes] = await Promise.all([
        apiFetch("/api/users").catch(() => null),
        apiFetch(leavePendingUrl).catch(() => null),
      ]);

      const users = Array.isArray(usersRes) ? usersRes : [];
      const leaveRequests = Array.isArray(leaveRes) ? leaveRes : [];
      const activeUsers = users.filter((u: any) => u.status === 'active' || u.isActive).length;

      // System health = % of core API checks that responded this load.
      const checks = [usersRes, leaveRes];
      const systemHealth = Math.round(
        (checks.filter((r) => r !== null).length / checks.length) * 100
      );

      setStatsData({
        totalUsers: users.length,
        activeSessions: activeUsers,
        systemHealth,
        pendingTasks: leaveRequests.length,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    }
  };

  useEffect(() => {
    if (!hasAuthSession()) { router.push("/auth/login"); return; }
    try {
      const userData = Cookies.get("userData");
      if (userData) setUser(JSON.parse(decodeURIComponent(userData)));
    } catch (e) { console.error(e); }
    fetchAdminStats().finally(() => setLoading(false));
  }, [router]);

  const stats = [
    { label: "Total Users", value: statsData.totalUsers.toLocaleString(), icon: "👥", color: "bg-blue-500" },
    { label: "Active Users", value: statsData.activeSessions.toLocaleString(), icon: "🔐", color: "bg-green-500" },
    { label: "System Health", value: `${statsData.systemHealth}%`, icon: "💚", color: "bg-purple-500" },
    { label: "Pending Tasks", value: statsData.pendingTasks.toLocaleString(), icon: "📋", color: "bg-orange-500" },
  ];

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1><p className="text-gray-600">System administration & management</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((a, i) => (
            <Link key={i} href={a.href}><div className={`${a.color} text-white p-4 rounded-xl text-center`}><div className="text-3xl mb-2">{a.icon}</div><p>{a.label}</p></div></Link>
          ))}
        </div>
      </div>
    </div>
  );
}
