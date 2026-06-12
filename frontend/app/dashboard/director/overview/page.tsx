"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalCenters: number;
  totalClasses: number;
  attendanceRate: number;
  pendingLeaves: number;
}

export default function DirectorDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalCenters: 0,
    totalClasses: 0,
    attendanceRate: 0,
    pendingLeaves: 0,
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
        attendanceRate: 0,
        pendingLeaves: 0,
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🎯 Director Dashboard</h1>
        <p className="text-gray-500">Operational oversight and academic management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-xs uppercase">Students</h3>
          <p className="text-2xl font-bold">{stats.totalStudents}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-gray-500 text-xs uppercase">Teachers</h3>
          <p className="text-2xl font-bold">{stats.totalTeachers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <h3 className="text-gray-500 text-xs uppercase">Centers</h3>
          <p className="text-2xl font-bold">{stats.totalCenters}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <h3 className="text-gray-500 text-xs uppercase">Classes</h3>
          <p className="text-2xl font-bold">{stats.totalClasses}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-teal-500">
          <h3 className="text-gray-500 text-xs uppercase">Attendance Rate</h3>
          <p className="text-2xl font-bold">{stats.attendanceRate}%</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <h3 className="text-gray-500 text-xs uppercase">Pending Leaves</h3>
          <p className="text-2xl font-bold">{stats.pendingLeaves}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">⚡ Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/dashboard/superadmin" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center">
              <span className="text-2xl">📊</span>
              <p className="font-medium mt-2">Full Dashboard</p>
            </Link>
            <Link href="/dashboard/academy/students" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center">
              <span className="text-2xl">👨‍🎓</span>
              <p className="font-medium mt-2">Students</p>
            </Link>
            <Link href="/dashboard/academy/teachers" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center">
              <span className="text-2xl">👨‍🏫</span>
              <p className="font-medium mt-2">Teachers</p>
            </Link>
            <Link href="/dashboard/attendance/leave-approvals" className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-center">
              <span className="text-2xl">📋</span>
              <p className="font-medium mt-2">Leave Approvals</p>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">📈 Performance Metrics</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span>Student Attendance</span>
                <span className="font-bold">{stats.attendanceRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${stats.attendanceRate}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Teacher Attendance</span>
                <span className="font-bold">96%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: "96%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Class Completion</span>
                <span className="font-bold">88%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: "88%" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Center Performance */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">🏢 Center Performance</h2>
          <Link href="/dashboard/superadmin/centers" className="text-blue-600 hover:text-blue-800">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-gray-500 text-sm">
                <th className="pb-3">Center</th>
                <th className="pb-3">Students</th>
                <th className="pb-3">Teachers</th>
                <th className="pb-3">Attendance</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-3 font-medium">Main Campus</td>
                <td className="py-3">245</td>
                <td className="py-3">18</td>
                <td className="py-3">95%</td>
                <td className="py-3"><span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Excellent</span></td>
              </tr>
              <tr>
                <td className="py-3 font-medium">District 2 Branch</td>
                <td className="py-3">180</td>
                <td className="py-3">12</td>
                <td className="py-3">92%</td>
                <td className="py-3"><span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Good</span></td>
              </tr>
              <tr>
                <td className="py-3 font-medium">District 7 Branch</td>
                <td className="py-3">120</td>
                <td className="py-3">8</td>
                <td className="py-3">89%</td>
                <td className="py-3"><span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Fair</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
