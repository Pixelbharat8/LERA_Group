"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";
import { useLanguage } from "../../../../context/LanguageContext";

interface ReportData {
  items: any[];
  summary: Record<string, number>;
}

const REPORT_CONFIG: Record<string, { title: string; icon: string; apiPath: string; columns: { key: string; label: string }[] }> = {
  revenue: {
    title: "Revenue Report",
    icon: "📈",
    apiPath: "/api/payments",
    columns: [
      { key: "paymentDate", label: "Date" },
      { key: "studentName", label: "Student" },
      { key: "amount", label: "Amount" },
      { key: "paymentMethod", label: "Method" },
      { key: "status", label: "Status" },
    ],
  },
  fees: {
    title: "Fee Collection Report",
    icon: "🧾",
    apiPath: "/api/invoices",
    columns: [
      { key: "invoiceDate", label: "Date" },
      { key: "studentName", label: "Student" },
      { key: "totalAmount", label: "Total" },
      { key: "paidAmount", label: "Paid" },
      { key: "status", label: "Status" },
    ],
  },
  performance: {
    title: "Student Performance Report",
    icon: "📝",
    apiPath: "/api/students",
    columns: [
      { key: "fullName", label: "Student" },
      { key: "className", label: "Class" },
      { key: "avgScore", label: "Avg Score" },
      { key: "grade", label: "Grade" },
      { key: "status", label: "Status" },
    ],
  },
  attendance: {
    title: "Attendance Summary Report",
    icon: "📅",
    apiPath: "/api/attendance/summary",
    columns: [
      { key: "date", label: "Date" },
      { key: "className", label: "Class" },
      { key: "present", label: "Present" },
      { key: "absent", label: "Absent" },
      { key: "rate", label: "Rate" },
    ],
  },
  exams: {
    title: "Exam Results Report",
    icon: "✅",
    apiPath: "/api/exams",
    columns: [
      { key: "examName", label: "Exam" },
      { key: "className", label: "Class" },
      { key: "totalStudents", label: "Students" },
      { key: "avgScore", label: "Avg Score" },
      { key: "passRate", label: "Pass Rate" },
    ],
  },
  staff: {
    title: "Staff Overview Report",
    icon: "👨‍💼",
    apiPath: "/api/users?role=STAFF",
    columns: [
      { key: "fullName", label: "Name" },
      { key: "department", label: "Department" },
      { key: "role", label: "Role" },
      { key: "joinDate", label: "Joined" },
      { key: "status", label: "Status" },
    ],
  },
  leave: {
    title: "Leave Summary Report",
    icon: "🏖️",
    apiPath: "/api/leave-requests",
    columns: [
      { key: "employeeName", label: "Employee" },
      { key: "leaveType", label: "Type" },
      { key: "startDate", label: "From" },
      { key: "endDate", label: "To" },
      { key: "status", label: "Status" },
    ],
  },
  training: {
    title: "Training Records Report",
    icon: "📚",
    apiPath: "/api/sport-training-sessions",
    columns: [
      { key: "sessionName", label: "Session" },
      { key: "coachName", label: "Coach" },
      { key: "date", label: "Date" },
      { key: "participants", label: "Participants" },
      { key: "status", label: "Status" },
    ],
  },
  centers: {
    title: "Center Performance Report",
    icon: "🏛️",
    apiPath: "/api/centers",
    columns: [
      { key: "name", label: "Center" },
      { key: "totalStudents", label: "Students" },
      { key: "totalTeachers", label: "Teachers" },
      { key: "totalClasses", label: "Classes" },
      { key: "status", label: "Status" },
    ],
  },
  enrollments: {
    title: "Enrollment Trends Report",
    icon: "📊",
    apiPath: "/api/enrollments",
    columns: [
      { key: "enrollmentDate", label: "Date" },
      { key: "studentName", label: "Student" },
      { key: "courseName", label: "Course" },
      { key: "centerName", label: "Center" },
      { key: "status", label: "Status" },
    ],
  },
  capacity: {
    title: "Capacity Analysis Report",
    icon: "📉",
    apiPath: "/api/classes",
    columns: [
      { key: "className", label: "Class" },
      { key: "centerName", label: "Center" },
      { key: "enrolled", label: "Enrolled" },
      { key: "capacity", label: "Capacity" },
      { key: "utilization", label: "Utilization" },
    ],
  },
};

export default function ReportTypePage() {
  const params = useParams();
  const { t } = useLanguage();
  const reportType = params.type as string;
  const config = REPORT_CONFIG[reportType];

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  useEffect(() => {
    if (!config) return;
    fetchReportData();
  }, [reportType]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const result = await apiFetch(config.apiPath);
      const items = Array.isArray(result)
        ? result
        : (result?.items ?? result?.content ?? []);
      setData(items);
    } catch (err) {
      console.error("Error fetching report data:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const getCellValue = (item: any, key: string) => {
    const value = item[key] || item[key.replace(/([A-Z])/g, "_$1").toLowerCase()] || "—";
    if (key === "amount" || key === "totalAmount" || key === "paidAmount") {
      const num = Number(value);
      return isNaN(num) ? value : `₫${num.toLocaleString()}`;
    }
    if (key === "rate" || key === "passRate" || key === "utilization") {
      return typeof value === "number" ? `${value}%` : value;
    }
    if (key.includes("Date") || key === "date") {
      return value ? String(value).split("T")[0] : "—";
    }
    return String(value);
  };

  if (!config) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-6xl mb-4">📊</p>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Report Not Found</h2>
          <p className="text-gray-500 mb-4">The report type &quot;{reportType}&quot; is not available.</p>
          <Link href="/dashboard/superadmin/reports" className="text-blue-600 hover:underline">
            ← Back to Reports
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/superadmin" className="hover:text-blue-600">{t("dashboard")}</Link>
            <span>/</span>
            <Link href="/dashboard/superadmin/reports" className="hover:text-blue-600">{t("reports")}</Link>
            <span>/</span>
            <span className="text-gray-900">{config.title}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{config.icon} {config.title}</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchReportData}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            🔄 {t("refresh")}
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            📊 {t("export")} Excel
          </button>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            📄 {t("export")} PDF
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
          <p className="text-sm text-gray-500">Total Records</p>
          <p className="text-2xl font-bold text-blue-600">{loading ? "..." : data.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
          <p className="text-sm text-gray-500">{t("active")}</p>
          <p className="text-2xl font-bold text-green-600">
            {loading ? "..." : data.filter((d: any) => d.status === "ACTIVE" || d.status === "active" || d.status === "APPROVED").length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
          <p className="text-sm text-gray-500">Report Date</p>
          <p className="text-2xl font-bold text-gray-700">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">{config.icon}</p>
            <p className="text-gray-500">{t("noData")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  {config.columns.map((col) => (
                    <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.slice(0, 50).map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                    {config.columns.map((col) => (
                      <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {col.key === "status" ? (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            ["ACTIVE", "active", "PAID", "APPROVED", "COMPLETED", "PRESENT"].includes(getCellValue(item, col.key))
                              ? "bg-green-100 text-green-800"
                              : ["PENDING", "pending", "PARTIAL"].includes(getCellValue(item, col.key))
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {getCellValue(item, col.key)}
                          </span>
                        ) : (
                          getCellValue(item, col.key)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length > 50 && (
              <div className="text-center py-3 bg-gray-50 text-sm text-gray-500">
                Showing 50 of {data.length} records
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
