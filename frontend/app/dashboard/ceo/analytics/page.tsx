"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

interface AnalyticsData {
  overview: {
    totalStudents: number;
    totalTeachers: number;
    totalCourses: number;
    totalRevenue: number;
    avgSatisfaction: number | null; // null = not tracked yet (no survey data)
    retentionRate: number;
  };
  enrollment: {
    month: string;
    newStudents: number;
    dropouts: number;
    netGrowth: number;
  }[];
  coursePopularity: {
    name: string;
    students: number;
  }[];
  demographics: {
    ageGroup: string;
    count: number;
    percentage: number;
  }[];
  highlights: string[];
}

export default function CEOAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // All real backend data — no fabricated metrics.
      const [students, teachers, courses, enrollments, classes, finance] = await Promise.all([
        apiFetch("/api/students").catch(() => []),
        apiFetch("/api/teachers").catch(() => []),
        apiFetch("/api/courses").catch(() => []),
        apiFetch("/api/enrollments").catch(() => []),
        apiFetch("/api/classes").catch(() => []),
        apiFetch("/api/finance/dashboard").catch(() => null),
      ]);
      const S: any[] = Array.isArray(students) ? students : [];
      const E: any[] = Array.isArray(enrollments) ? enrollments : [];
      const C: any[] = Array.isArray(classes) ? classes : [];
      const now = new Date();

      // Revenue — real, from the finance service.
      const totalRevenue = finance && finance.totalRevenue ? Number(finance.totalRevenue) : 0;

      // Retention — real: active enrolments / all enrolments.
      const activeEnr = E.filter((e) => String(e.status || "ACTIVE").toUpperCase() === "ACTIVE").length;
      const retentionRate = E.length ? Math.round((activeEnr / E.length) * 100) : 0;

      // Demographics — real, derived from student dates of birth.
      const ages = S
        .map((s) => (s.dateOfBirth ? Math.floor((now.getTime() - new Date(s.dateOfBirth).getTime()) / (365.25 * 864e5)) : null))
        .filter((a): a is number => a != null && a >= 0 && a < 120);
      const buckets = [
        { ageGroup: "3-6 years", min: 0, max: 6 },
        { ageGroup: "7-10 years", min: 7, max: 10 },
        { ageGroup: "11-14 years", min: 11, max: 14 },
        { ageGroup: "15-18 years", min: 15, max: 18 },
        { ageGroup: "Adults (18+)", min: 19, max: 200 },
      ];
      const demographics = buckets.map((b) => {
        const count = ages.filter((a) => a >= b.min && a <= b.max).length;
        return { ageGroup: b.ageGroup, count, percentage: ages.length ? Math.round((count / ages.length) * 1000) / 10 : 0 };
      });

      // Enrolment trend — real: new enrolments per month (last 6 months) by enrolment date.
      const monthsBack = 6;
      const enrollment = Array.from({ length: monthsBack }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1 - i), 1);
        const sameMonth = (raw: any) => {
          if (!raw) return false;
          const x = new Date(raw);
          return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth();
        };
        const newStudents = E.filter((e) => sameMonth(e.enrollmentDate)).length;
        const dropouts = E.filter((e) =>
          ["CANCELLED", "CANCELED", "WITHDRAWN", "COMPLETED"].includes(String(e.status || "").toUpperCase()) && sameMonth(e.endDate)
        ).length;
        return { month: d.toLocaleString("en-US", { month: "short" }), newStudents, dropouts, netGrowth: newStudents - dropouts };
      });

      // Class popularity — real: enrolments per class.
      const classNameById: Record<string, string> = {};
      C.forEach((c) => { if (c.id) classNameById[c.id] = c.name || c.code || "Class"; });
      const countByClass: Record<string, number> = {};
      E.forEach((e) => { if (e.classId) countByClass[e.classId] = (countByClass[e.classId] || 0) + 1; });
      const coursePopularity = Object.entries(countByClass)
        .map(([cid, students]) => ({ name: classNameById[cid] || "Class", students }))
        .sort((a, b) => b.students - a.students)
        .slice(0, 6);

      // Highlights — derived from the real numbers above (no invented claims).
      const peak = [...enrollment].sort((a, b) => b.newStudents - a.newStudents)[0];
      const topClass = coursePopularity[0];
      const highlights: string[] = [];
      if (peak && peak.newStudents > 0) highlights.push(`Peak enrolment month: ${peak.month} (+${peak.newStudents})`);
      highlights.push(`Retention: ${retentionRate}% of enrolments active`);
      if (topClass) highlights.push(`Largest class: ${topClass.name} (${topClass.students} students)`);
      highlights.push(`Total revenue recorded: ${formatCurrency(totalRevenue)}`);

      setAnalyticsData({
        overview: {
          totalStudents: S.length,
          totalTeachers: Array.isArray(teachers) ? teachers.length : 0,
          totalCourses: Array.isArray(courses) ? courses.length : 0,
          totalRevenue,
          avgSatisfaction: null, // honest: no survey data wired yet
          retentionRate,
        },
        enrollment,
        coursePopularity,
        demographics,
        highlights,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) return `₫${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `₫${(amount / 1000000).toFixed(0)}M`;
    return `₫${amount.toLocaleString()}`;
  };

  if (loading || !analyticsData) {
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
          <p className="text-gray-600">Comprehensive business intelligence and insights</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/ceo" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-2">
          {(["7d", "30d", "90d", "1y"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium ${
                timeRange === range ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : range === "90d" ? "90 Days" : "1 Year"}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Students", value: analyticsData.overview.totalStudents.toLocaleString(), icon: "👨‍🎓", color: "bg-blue-500" },
          { label: "Total Teachers", value: analyticsData.overview.totalTeachers.toString(), icon: "👨‍🏫", color: "bg-green-500" },
          { label: "Active Courses", value: analyticsData.overview.totalCourses.toString(), icon: "📚", color: "bg-purple-500" },
          { label: "Total Revenue", value: formatCurrency(analyticsData.overview.totalRevenue), icon: "💰", color: "bg-yellow-500" },
          { label: "Satisfaction", value: analyticsData.overview.avgSatisfaction != null ? `${analyticsData.overview.avgSatisfaction}/5` : "—", icon: "⭐", color: "bg-orange-500" },
          { label: "Retention", value: `${analyticsData.overview.retentionRate}%`, icon: "🔄", color: "bg-teal-500" },
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment Trend */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold mb-4">Enrollment Trend</h3>
          <div className="space-y-3">
            {analyticsData.enrollment.map((item) => {
              const maxNew = Math.max(...analyticsData.enrollment.map(e => e.newStudents));
              const width = (item.newStudents / maxNew) * 100;
              return (
                <div key={item.month} className="flex items-center gap-3">
                  <span className="w-10 text-sm text-gray-600">{item.month}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden relative">
                    <div
                      className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full"
                      style={{ width: `${width}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                      +{item.newStudents} / -{item.dropouts}
                    </span>
                  </div>
                  <span className={`w-12 text-right text-sm font-medium ${item.netGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {item.netGrowth >= 0 ? "+" : ""}{item.netGrowth}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Class Popularity — real enrolments per class */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold mb-4">Class Popularity <span className="text-sm font-normal text-gray-400">(by enrolment)</span></h3>
          {analyticsData.coursePopularity.length === 0 ? (
            <p className="text-gray-400 text-sm">No enrolments yet.</p>
          ) : (
            <div className="space-y-4">
              {analyticsData.coursePopularity.map((course, index) => {
                const maxStudents = Math.max(...analyticsData.coursePopularity.map(c => c.students), 1);
                const width = (course.students / maxStudents) * 100;
                const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"];
                return (
                  <div key={course.name + index}>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-sm">{course.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                        <div className={`${colors[index % colors.length]} h-full rounded-full`} style={{ width: `${width}%` }} />
                      </div>
                      <span className="text-sm text-gray-600 w-16 text-right">{course.students}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Demographics */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-bold mb-4">Student Demographics by Age Group</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {analyticsData.demographics.map((demo, index) => {
            const colors = ["bg-pink-100 text-pink-800", "bg-blue-100 text-blue-800", "bg-purple-100 text-purple-800", "bg-indigo-100 text-indigo-800", "bg-teal-100 text-teal-800"];
            return (
              <div key={demo.ageGroup} className={`rounded-xl p-4 text-center ${colors[index % colors.length]}`}>
                <p className="text-3xl font-bold">{demo.count}</p>
                <p className="text-sm font-medium">{demo.ageGroup}</p>
                <p className="text-xs opacity-75">{demo.percentage}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Highlights — derived from the real numbers above */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-bold mb-4">📈 Highlights</h3>
        <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-700">
          {analyticsData.highlights.map((h, i) => (
            <li key={i} className="flex gap-2"><span className="text-blue-500">•</span>{h}</li>
          ))}
        </ul>
        <p className="text-xs text-gray-400 mt-4">
          For growth KPIs (CAC, LTV, conversion, renewal) see{" "}
          <Link href="/dashboard/ceo/growth" className="text-blue-600 hover:underline">CEO → Growth</Link>.
          Satisfaction/NPS will appear once survey data is collected.
        </p>
      </div>
    </div>
  );
}
