"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalCenters: number;
  totalClasses: number;
  totalRevenue: number;
  pendingApprovals: number;
}

export default function CEODashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalCenters: 0,
    totalClasses: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [students, teachers, centers, classes] = await Promise.all([
        apiFetch("/api/students").catch(() => []),
        apiFetch("/api/teachers").catch(() => []),
        apiFetch("/api/centers").catch(() => []),
        apiFetch("/api/classes").catch(() => []),
      ]);

      setStats({
        totalStudents: Array.isArray(students) ? students.length : 0,
        totalTeachers: Array.isArray(teachers) ? teachers.length : 0,
        totalCenters: Array.isArray(centers) ? centers.length : 0,
        totalClasses: Array.isArray(classes) ? classes.length : 0,
        totalRevenue: 0,
        pendingApprovals: 0,
      });
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">👔 CEO Dashboard</h1>
        <p className="text-gray-500">Executive overview of LERA Academy operations</p>
      </div>

      {/* Executive Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-xs uppercase">Total Students</h3>
          <p className="text-2xl font-bold">{stats.totalStudents}</p>
          <p className="text-xs text-green-500 mt-1">+12% from last month</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-gray-500 text-xs uppercase">Total Teachers</h3>
          <p className="text-2xl font-bold">{stats.totalTeachers}</p>
          <p className="text-xs text-green-500 mt-1">+3 new hires</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <h3 className="text-gray-500 text-xs uppercase">Centers</h3>
          <p className="text-2xl font-bold">{stats.totalCenters}</p>
          <p className="text-xs text-gray-500 mt-1">All operational</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <h3 className="text-gray-500 text-xs uppercase">Active Classes</h3>
          <p className="text-2xl font-bold">{stats.totalClasses}</p>
          <p className="text-xs text-blue-500 mt-1">Across all centers</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-teal-500">
          <h3 className="text-gray-500 text-xs uppercase">Monthly Revenue</h3>
          <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-green-500 mt-1">+8% growth</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <h3 className="text-gray-500 text-xs uppercase">Pending Approvals</h3>
          <p className="text-2xl font-bold">{stats.pendingApprovals}</p>
          <p className="text-xs text-orange-500 mt-1">Action required</p>
        </div>
      </div>

      {/* Quick Access Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Strategic Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">📊 Strategic Overview</h2>
          <div className="space-y-3">
            <Link href="/dashboard/superadmin" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
              <span>Full Dashboard</span>
              <span>→</span>
            </Link>
            <Link href="/dashboard/superadmin/reports" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
              <span>Reports & Analytics</span>
              <span>→</span>
            </Link>
            <Link href="/dashboard/ceo/growth" className="flex items-center justify-between p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium">
              <span>📈 Growth & Marketing KPIs</span>
              <span>→</span>
            </Link>
            <Link href="/dashboard/superadmin/centers" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
              <span>Center Performance</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Financial Management */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">💰 Financial</h2>
          <div className="space-y-3">
            <Link href="/dashboard/finance" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
              <span>Finance Dashboard</span>
              <span>→</span>
            </Link>
            <Link href="/dashboard/superadmin/payroll" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
              <span>Payroll Overview</span>
              <span>→</span>
            </Link>
            <Link href="/dashboard/payments" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
              <span>Payment Records</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* HR & Operations */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">👥 HR & Operations</h2>
          <div className="space-y-3">
            <Link href="/dashboard/superadmin/users" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
              <span>User Management</span>
              <span>→</span>
            </Link>
            <Link href="/dashboard/superadmin/approvals" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
              <span>Pending Approvals</span>
              <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">{stats.pendingApprovals}</span>
            </Link>
            <Link href="/dashboard/attendance/leave-approvals" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
              <span>Leave Requests</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">📝 Recent Executive Updates</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <span className="text-xl">✅</span>
            <div>
              <p className="font-medium">Q4 Revenue Target Achieved</p>
              <p className="text-sm text-gray-500">Revenue exceeded projections by 8%</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <span className="text-xl">🏢</span>
            <div>
              <p className="font-medium">New Center Expansion Proposal</p>
              <p className="text-sm text-gray-500">District 7 location under review</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-medium">Staff Meeting Scheduled</p>
              <p className="text-sm text-gray-500">All-hands meeting on Friday 3PM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
