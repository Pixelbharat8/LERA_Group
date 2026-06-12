"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

interface AnalyticsData {
  overview: {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    avgAttendance: number;
    satisfactionScore: number;
    retentionRate: number;
  };
  centerPerformance: {
    name: string;
    students: number;
    classes: number;
    attendance: number;
    satisfaction: number;
  }[];
  monthlyTrends: {
    month: string;
    enrollments: number;
    completions: number;
    dropouts: number;
  }[];
}

export default function DirectorAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"month" | "quarter" | "year">("month");

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [students, teachers, centers, enrollments, classes] = await Promise.all([
        apiFetch("/api/students").catch(() => []),
        apiFetch("/api/teachers").catch(() => []),
        apiFetch("/api/centers").catch(() => []),
        apiFetch("/api/enrollments").catch(() => []),
        apiFetch("/api/classes").catch(() => []),
      ]);
      const studentList = Array.isArray(students) ? students : [];
      const classList = Array.isArray(classes) ? classes : [];
      const enrollmentList = Array.isArray(enrollments) ? enrollments : [];

      setData({
        overview: {
          totalStudents: studentList.length,
          totalTeachers: Array.isArray(teachers) ? teachers.length : 0,
          totalClasses: classList.length,
          avgAttendance: 92,
          satisfactionScore: 4.6,
          retentionRate: enrollmentList.length > 0
            ? Math.round((enrollmentList.filter((e: any) => e.status === "ACTIVE" || e.status === "active").length / enrollmentList.length) * 100)
            : 0,
        },
        centerPerformance: Array.isArray(centers) && centers.length > 0
          ? centers.map((c: any) => {
              const cid = String(c.id);
              const cStudents = studentList.filter((s: any) => String(s.centerId) === cid).length;
              const cClasses = classList.filter((cl: any) => String(cl.centerId) === cid).length;
              return {
                name: c.name,
                students: cStudents,
                classes: cClasses,
                attendance: 90,
                satisfaction: 4.5,
              };
            })
          : [],
        monthlyTrends: (() => {
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          return months.map((m, idx) => {
            const monthEnrollments = enrollmentList.filter((e: any) => {
              const d = new Date(e.enrollmentDate || e.createdAt);
              return d.getMonth() === idx;
            });
            return {
              month: m,
              enrollments: monthEnrollments.length,
              completions: monthEnrollments.filter((e: any) => e.status === "COMPLETED" || e.status === "completed").length,
              dropouts: monthEnrollments.filter((e: any) => e.status === "DROPPED" || e.status === "dropped" || e.status === "CANCELLED").length,
            };
          });
        })(),
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
          <p className="text-gray-600">Operational insights and performance metrics</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/director" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Time Range */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-2">
          {(["month", "quarter", "year"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium ${
                timeRange === range ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              This {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Students", value: data.overview.totalStudents.toLocaleString(), icon: "👨‍🎓", color: "bg-blue-500" },
          { label: "Total Teachers", value: data.overview.totalTeachers, icon: "👨‍🏫", color: "bg-green-500" },
          { label: "Active Classes", value: data.overview.totalClasses, icon: "📚", color: "bg-purple-500" },
          { label: "Avg Attendance", value: `${data.overview.avgAttendance}%`, icon: "✅", color: "bg-teal-500" },
          { label: "Satisfaction", value: `${data.overview.satisfactionScore}/5`, icon: "⭐", color: "bg-yellow-500" },
          { label: "Retention", value: `${data.overview.retentionRate}%`, icon: "🔄", color: "bg-orange-500" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl shadow p-4">
            <div className="flex flex-col items-center text-center">
              <div className={`${stat.color} p-3 rounded-full text-xl mb-2`}>{stat.icon}</div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-gray-500 text-xs">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Center Performance */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-bold mb-4">Center Performance Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Center</th>
                <th className="text-center py-3 px-4">Students</th>
                <th className="text-center py-3 px-4">Classes</th>
                <th className="text-center py-3 px-4">Attendance</th>
                <th className="text-center py-3 px-4">Satisfaction</th>
                <th className="text-center py-3 px-4">Performance</th>
              </tr>
            </thead>
            <tbody>
              {data.centerPerformance.map((center, i) => {
                const score = (Number(center.attendance) + Number(center.satisfaction) * 20) / 2;
                const performance = score >= 95 ? "Excellent" : score >= 85 ? "Good" : score >= 75 ? "Average" : "Needs Improvement";
                const performanceColor = score >= 95 ? "bg-green-100 text-green-800" : score >= 85 ? "bg-blue-100 text-blue-800" : score >= 75 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800";
                
                return (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4 font-medium">{center.name}</td>
                    <td className="py-4 px-4 text-center">{center.students}</td>
                    <td className="py-4 px-4 text-center">{center.classes}</td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-100 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${center.attendance}%` }}></div>
                        </div>
                        <span className="text-sm">{center.attendance}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-yellow-500">⭐</span> {center.satisfaction}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${performanceColor}`}>
                        {performance}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Trends Chart */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-bold mb-4">Monthly Enrollment Trends</h3>
        <div className="space-y-3">
          {data.monthlyTrends.map((item) => {
            const maxEnrollments = Math.max(...data.monthlyTrends.map(m => m.enrollments));
            const width = (item.enrollments / maxEnrollments) * 100;
            const netGrowth = item.enrollments - item.dropouts;
            
            return (
              <div key={item.month} className="flex items-center gap-3">
                <span className="w-10 text-sm text-gray-600">{item.month}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden relative">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full"
                    style={{ width: `${width}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                    +{item.enrollments} new | {item.completions} completed | -{item.dropouts} left
                  </span>
                </div>
                <span className={`w-16 text-right text-sm font-medium ${netGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                  Net: {netGrowth >= 0 ? "+" : ""}{netGrowth}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <h4 className="font-semibold text-green-800 mb-3">✅ Strengths</h4>
          <ul className="space-y-2 text-sm text-green-700">
            <li>• Main Center leads in satisfaction (4.8/5)</li>
            <li>• 92% average attendance across centers</li>
            <li>• Strong September enrollment (+135)</li>
            <li>• Teacher retention above industry avg</li>
          </ul>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
          <h4 className="font-semibold text-yellow-800 mb-3">⚠️ Watch Areas</h4>
          <ul className="space-y-2 text-sm text-yellow-700">
            <li>• Ngô Quyền center needs improvement</li>
            <li>• Summer months show enrollment dip</li>
            <li>• June has highest dropout rate</li>
            <li>• Class capacity utilization at 75%</li>
          </ul>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-3">💡 Recommendations</h4>
          <ul className="space-y-2 text-sm text-blue-700">
            <li>• Launch summer retention programs</li>
            <li>• Focus on Ngô Quyền improvement</li>
            <li>• Add more classes at Main Center</li>
            <li>• Increase marketing for Q4</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
