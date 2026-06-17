"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { exportToCsv, exportToExcel, datedFilename } from "@/lib/export-csv";

export default function ReportsPage() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalCenters: 0,
    totalClasses: 0,
    totalEnrollments: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // apiFetch sends the JWT (these endpoints are STAFF-gated); raw fetch() 401'd -> all zeros.
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
        totalEnrollments: 0,
        totalRevenue: 0,
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const statRows = [
    { metric: "Students", value: stats.totalStudents },
    { metric: "Teachers", value: stats.totalTeachers },
    { metric: "Centers", value: stats.totalCenters },
    { metric: "Classes", value: stats.totalClasses },
    { metric: "Enrollments", value: stats.totalEnrollments },
    { metric: "Revenue", value: stats.totalRevenue },
  ];

  const exportColumns = [
    { key: "metric" as const, label: "Metric" },
    { key: "value" as const, label: "Value" },
  ];

  const reportCategories = [
    {
      name: "📊 Financial Reports",
      description: "Revenue, expenses, and payroll reports",
      reports: [
        { name: "Payroll Summary", href: "/dashboard/superadmin/reports/payroll", icon: "💰" },
        { name: "Revenue Report", href: "/dashboard/superadmin/reports/revenue", icon: "📈" },
        { name: "Fee Collection", href: "/dashboard/superadmin/reports/fees", icon: "🧾" },
      ]
    },
    {
      name: "🎓 Academic Reports",
      description: "Student performance and attendance",
      reports: [
        { name: "Student Performance", href: "/dashboard/superadmin/reports/performance", icon: "📝" },
        { name: "Attendance Summary", href: "/dashboard/superadmin/reports/attendance", icon: "📅" },
        { name: "Exam Results", href: "/dashboard/superadmin/reports/exams", icon: "✅" },
      ]
    },
    {
      name: "👥 HR Reports",
      description: "Staff and teacher analytics",
      reports: [
        { name: "Staff Overview", href: "/dashboard/superadmin/reports/staff", icon: "👨‍💼" },
        { name: "Leave Summary", href: "/dashboard/superadmin/reports/leave", icon: "🏖️" },
        { name: "Training Records", href: "/dashboard/superadmin/reports/training", icon: "📚" },
      ]
    },
    {
      name: "🏢 Center Reports",
      description: "Center-wise performance and metrics",
      reports: [
        { name: "Center Performance", href: "/dashboard/superadmin/reports/centers", icon: "🏛️" },
        { name: "Enrollment Trends", href: "/dashboard/superadmin/reports/enrollments", icon: "📊" },
        { name: "Capacity Analysis", href: "/dashboard/superadmin/reports/capacity", icon: "📉" },
      ]
    },
  ];

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
        <h1 className="text-2xl font-bold text-gray-900">📊 Reports & Analytics</h1>
        <p className="text-gray-500">Comprehensive reporting and analytics dashboard</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
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
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-pink-500">
          <h3 className="text-gray-500 text-xs uppercase">Enrollments</h3>
          <p className="text-2xl font-bold">{stats.totalEnrollments}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-teal-500">
          <h3 className="text-gray-500 text-xs uppercase">Revenue</h3>
          <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCategories.map((category, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-2">{category.name}</h2>
            <p className="text-gray-500 text-sm mb-4">{category.description}</p>
            <div className="space-y-2">
              {category.reports.map((report, rIndex) => (
                <Link
                  key={rIndex}
                  href={report.href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  <span className="text-xl">{report.icon}</span>
                  <span className="font-medium text-gray-700">{report.name}</span>
                  <span className="ml-auto text-gray-400">→</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Export Options */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">📥 Export Options</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => exportToExcel(datedFilename("reports-summary"), statRows, exportColumns)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <span>📊</span> Export to Excel
          </button>
          <button
            onClick={() => exportToCsv(datedFilename("reports-summary"), statRows, exportColumns)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <span>📑</span> Export to CSV
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <span>📄</span> Export to PDF
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <span>📧</span> Schedule Email Report
          </button>
        </div>
      </div>
    </div>
  );
}
