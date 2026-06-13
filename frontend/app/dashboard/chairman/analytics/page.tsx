"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

interface AnalyticsData {
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalRevenue: number;
  monthlyRevenue: number;
  enrollmentGrowth: number;
  attendanceRate: number;
  completionRate: number;
  satisfactionScore: number;
}

interface ChartData {
  label: string;
  value: number;
  change?: number;
}

export default function ChairmanAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("this_month");
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalStudents: 0,
    activeStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    enrollmentGrowth: 0,
    attendanceRate: 0,
    completionRate: 0,
    satisfactionScore: 0,
  });

  const [enrollmentTrend, setEnrollmentTrend] = useState<ChartData[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<ChartData[]>([]);
  const [coursePerformance, setCoursePerformance] = useState<ChartData[]>([]);
  const [centerPerformance, setCenterPerformance] = useState<ChartData[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);

      // Fetch multiple data points
      const [studentsRes, teachersRes, coursesRes, paymentsRes, centersRes, enrollmentsRes] = await Promise.all([
        apiFetch("/api/students").catch(() => []),
        apiFetch("/api/teachers").catch(() => []),
        apiFetch("/api/courses").catch(() => []),
        apiFetch("/api/payments").catch(() => []),
        apiFetch("/api/centers").catch(() => []),
        apiFetch("/api/enrollments").catch(() => []),
      ]);

      const studentList = Array.isArray(studentsRes) ? studentsRes : [];
      const teachers = Array.isArray(teachersRes) ? teachersRes : [];
      const courses = Array.isArray(coursesRes) ? coursesRes : [];
      const paymentList = Array.isArray(paymentsRes) ? paymentsRes : [];
      const centerList = Array.isArray(centersRes) ? centersRes : [];
      const enrollmentList = Array.isArray(enrollmentsRes) ? enrollmentsRes : [];

      const paidPayments = paymentList.filter((p: any) => p.status === "COMPLETED" || p.status === "PAID");
      const totalRevenueNum: number = paidPayments
        .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

      setAnalytics({
        totalStudents: studentList.length,
        activeStudents: studentList.filter((s: any) => s.status === "ACTIVE" || s.isActive !== false).length,
        totalTeachers: Array.isArray(teachers) ? teachers.length : 0,
        totalCourses: Array.isArray(courses) ? courses.length : 0,
        totalRevenue: totalRevenueNum,
        monthlyRevenue: totalRevenueNum ? Math.round(totalRevenueNum / 12) : 0,
        enrollmentGrowth: 0,
        attendanceRate: 0,
        completionRate: 0,
        satisfactionScore: 0,
      });

      // Build enrollment trend from real enrollment data
      const monthlyEnrollments: Record<string, number> = {};
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      months.forEach(m => monthlyEnrollments[m] = 0);
      enrollmentList.forEach((e: any) => {
        const d = new Date(e.enrollmentDate || e.createdAt);
        if (!isNaN(d.getTime())) {
          monthlyEnrollments[months[d.getMonth()]] = (monthlyEnrollments[months[d.getMonth()]] || 0) + 1;
        }
      });
      setEnrollmentTrend(months.map((m, i) => ({
        label: m,
        value: monthlyEnrollments[m],
        change: i > 0 && monthlyEnrollments[months[i - 1]] > 0
          ? Math.round(((monthlyEnrollments[m] - monthlyEnrollments[months[i - 1]]) / monthlyEnrollments[months[i - 1]]) * 100)
          : 0,
      })));

      // Build revenue trend from real payment data
      const monthlyRevenues: Record<string, number> = {};
      months.forEach(m => monthlyRevenues[m] = 0);
      paidPayments.forEach((p: any) => {
        const d = new Date(p.paidAt || p.paymentDate || p.createdAt);
        if (!isNaN(d.getTime())) {
          monthlyRevenues[months[d.getMonth()]] = (monthlyRevenues[months[d.getMonth()]] || 0) + Number(p.amount || 0);
        }
      });
      setRevenueTrend(months.map(m => ({
        label: m,
        value: Math.round(monthlyRevenues[m] / 1000000) || 0,
      })));

      // Build course performance from enrollments
      const courseEnrollCounts: Record<string, number> = {};
      enrollmentList.forEach((e: any) => {
        const name = e.courseName || e.className || "Course";
        courseEnrollCounts[name] = (courseEnrollCounts[name] || 0) + 1;
      });
      const topCourses = Object.entries(courseEnrollCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);
      setCoursePerformance(topCourses.map(([label, value]) => ({ label, value })));

      if (centerList.length > 0 && !centerPerformance?.length) {
        setCenterPerformance(centerList.map((c: any) => {
          const centerStudents = studentList.filter((s: any) => s.centerId === c.id);
          return {
            label: c.name || "Center",
            value: centerStudents.length,
            change: 0,
          };
        }));
      }

    } catch (error) {
      console.error("Error fetching analytics:", error);
      // Reset to empty state on error
      setAnalytics({
        totalStudents: 0,
        activeStudents: 0,
        totalTeachers: 0,
        totalCourses: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        enrollmentGrowth: 0,
        attendanceRate: 0,
        completionRate: 0,
        satisfactionScore: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) return `₫${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `₫${(amount / 1000000).toFixed(1)}M`;
    return `₫${amount.toLocaleString()}`;
  };

  const getMaxValue = (data: ChartData[]) => Math.max(...data.map(d => d.value));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/chairman" className="text-gray-500 hover:text-gray-700">
                ← Back
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">📊 Analytics & Insights</h1>
                <p className="text-sm text-gray-500">Comprehensive business intelligence dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="this_quarter">This Quarter</option>
                <option value="this_year">This Year</option>
                <option value="all_time">All Time</option>
              </select>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                📥 Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">👨‍🎓</span>
              <span className="text-xs text-green-600 font-medium">+{analytics.enrollmentGrowth}%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{analytics.totalStudents.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Total Students</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">👨‍🏫</span>
              <span className="text-xs text-blue-600 font-medium">+3</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{analytics.totalTeachers}</div>
            <div className="text-sm text-gray-500">Teachers</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">📚</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{analytics.totalCourses}</div>
            <div className="text-sm text-gray-500">Active Courses</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">💰</span>
              <span className="text-xs text-green-600 font-medium">+18.5%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.monthlyRevenue)}</div>
            <div className="text-sm text-gray-500">Monthly Revenue</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">⭐</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{analytics.satisfactionScore}/5</div>
            <div className="text-sm text-gray-500">Satisfaction</div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Attendance Rate</h3>
              <span className="text-green-600 text-sm">+2.1%</span>
            </div>
            <div className="relative pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl font-bold text-green-600">{analytics.attendanceRate}%</span>
              </div>
              <div className="overflow-hidden h-3 text-xs flex rounded-full bg-gray-100">
                <div
                  style={{ width: `${analytics.attendanceRate}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 rounded-full"
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Course Completion</h3>
              <span className="text-blue-600 text-sm">+5.3%</span>
            </div>
            <div className="relative pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl font-bold text-blue-600">{analytics.completionRate}%</span>
              </div>
              <div className="overflow-hidden h-3 text-xs flex rounded-full bg-gray-100">
                <div
                  style={{ width: `${analytics.completionRate}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 rounded-full"
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Student Retention</h3>
              <span className="text-purple-600 text-sm">+1.8%</span>
            </div>
            <div className="relative pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl font-bold text-purple-600">92.3%</span>
              </div>
              <div className="overflow-hidden h-3 text-xs flex rounded-full bg-gray-100">
                <div
                  style={{ width: "92.3%" }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500 rounded-full"
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enrollment Trend */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">📈 Enrollment Trend (2025)</h3>
            <div className="h-48 flex items-end gap-2">
              {enrollmentTrend.map((data, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all hover:from-blue-600 hover:to-blue-500"
                    style={{ height: `${(data.value / getMaxValue(enrollmentTrend)) * 100}%` }}
                    title={`${data.label}: ${data.value} enrollments`}
                  ></div>
                  <span className="text-xs text-gray-500 mt-2">{data.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Trend */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">💰 Revenue Trend (₫ Millions)</h3>
            <div className="h-48 flex items-end gap-2">
              {revenueTrend.map((data, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t transition-all hover:from-green-600 hover:to-green-500"
                    style={{ height: `${(data.value / getMaxValue(revenueTrend)) * 100}%` }}
                    title={`${data.label}: ₫${data.value}M`}
                  ></div>
                  <span className="text-xs text-gray-500 mt-2">{data.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Course Performance */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">📚 Course Performance</h3>
            <div className="space-y-4">
              {coursePerformance.map((course, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{course.label}</span>
                    <span className="text-gray-500">{course.value}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        course.value >= 90 ? "bg-green-500" :
                        course.value >= 80 ? "bg-blue-500" :
                        course.value >= 70 ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{ width: `${course.value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Center Performance */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">🏫 Center Performance</h3>
            <div className="space-y-4">
              {centerPerformance.map((center, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                      i === 0 ? "bg-blue-500" :
                      i === 1 ? "bg-purple-500" :
                      i === 2 ? "bg-green-500" : "bg-orange-500"
                    }`}>
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-medium">{center.label}</div>
                      <div className="text-xs text-gray-500">{center.value} students</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-green-600 text-sm font-medium">+{center.change}%</span>
                    <div className="text-xs text-gray-500">growth</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg mb-1">Need Deeper Analysis?</h2>
              <p className="text-blue-100">Generate custom reports with detailed breakdowns by center, course, or time period.</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition">
                📊 Custom Report
              </button>
              <button className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition">
                📥 Export All Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
