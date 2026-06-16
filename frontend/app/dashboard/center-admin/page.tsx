"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { apiFetch } from "../../../lib/api";
import { useLanguage } from "../../context/LanguageContext";

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  pendingAttendance: number;
  pendingLeaves: number;
  todayClasses: number;
}

function scheduleStatusBadge(status: string): { label: string; cls: string } {
  switch (status.toUpperCase()) {
    case "COMPLETED":
      return { label: "Completed", cls: "bg-green-100 text-green-800" };
    case "IN_PROGRESS":
    case "ONGOING":
      return { label: "In Progress", cls: "bg-blue-100 text-blue-800" };
    case "CANCELLED":
      return { label: "Cancelled", cls: "bg-red-100 text-red-800" };
    default:
      return { label: "Upcoming", cls: "bg-gray-100 text-gray-800" };
  }
}

export default function CenterAdminDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    pendingAttendance: 0,
    pendingLeaves: 0,
    todayClasses: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  type ScheduleRow = {
    id: string;
    time: string;
    className: string;
    teacher: string;
    students: number | string;
    status: string;
  };
  const [todaySchedule, setTodaySchedule] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const userDataStr = Cookies.get("userData");

    try {
      const centerId = userDataStr
        ? (() => {
            try {
              const id = JSON.parse(userDataStr).centerId;
              return id != null && String(id).trim() !== "" ? String(id) : null;
            } catch {
              return null;
            }
          })()
        : null;

      if (!centerId) {
        setStats((s) => ({
          ...s,
          totalStudents: 0,
          totalTeachers: 0,
          totalClasses: 0,
          pendingAttendance: 0,
          pendingLeaves: 0,
          todayClasses: 0,
        }));
        return;
      }

      const q = encodeURIComponent(centerId);

      const [students, teachers, classes, leaveCountRes, attendanceRes] = await Promise.all([
        apiFetch(`/api/students?centerId=${q}`).catch(() => []),
        apiFetch(`/api/teachers?centerId=${q}`).catch(() => []),
        apiFetch(`/api/classes?centerId=${q}`).catch(() => []),
        apiFetch(`/api/leaves/pending/count?centerId=${q}`).catch(() => ({})),
        apiFetch(`/api/attendance?centerId=${q}`).catch(() => []),
      ]);

      const pendingLeaves =
        typeof leaveCountRes === "object" && leaveCountRes !== null && "pendingCount" in leaveCountRes
          ? Number((leaveCountRes as { pendingCount?: number }).pendingCount) || 0
          : 0;

      const attRows = Array.isArray(attendanceRes)
        ? attendanceRes
        : Array.isArray((attendanceRes as { content?: unknown[] })?.content)
          ? (attendanceRes as { content: unknown[] }).content
          : [];
      const pendingAttendance = attRows.filter((r: any) => {
        const st = r?.approvalStatus ?? r?.approval_status;
        return typeof st === "string" && st.toUpperCase() === "PENDING";
      }).length;

      const classesArr = Array.isArray(classes) ? classes : [];
      const teachersArr = Array.isArray(teachers) ? teachers : [];

      setStats({
        totalStudents: Array.isArray(students) ? students.length : 0,
        totalTeachers: teachersArr.length,
        totalClasses: classesArr.length,
        pendingAttendance,
        pendingLeaves,
        todayClasses: classesArr.length,
      });

      // Recent activity from REAL data: newest enrolled students for this center.
      const studentsArr = Array.isArray(students) ? students : [];
      const recent = [...studentsArr]
        .filter((s: any) => s?.createdAt)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map((s: any) => ({
          type: "enrollment",
          message: `New student enrolled: ${s.fullname || s.fullName || s.name || s.studentCode || "Student"}`,
          time: new Date(s.createdAt).toLocaleDateString(),
        }));
      setRecentActivities(recent);

      // Today's Schedule from REAL class sessions for this center's classes.
      const teacherById = new Map(
        teachersArr.map((tt: any) => [
          String(tt.id),
          tt.fullName || tt.fullname || tt.name ||
            `${tt.firstName || ""} ${tt.lastName || ""}`.trim() || "—",
        ])
      );
      const classById = new Map(classesArr.map((c: any) => [String(c.id), c]));
      const today = new Date().toISOString().split("T")[0];
      const sessionLists = await Promise.all(
        classesArr.map((c: any) => apiFetch(`/api/class-sessions?classId=${c.id}`).catch(() => []))
      );
      const schedule: ScheduleRow[] = sessionLists
        .flat()
        .filter((s: any) => s && typeof s === "object" && String(s.sessionDate || "").startsWith(today))
        .map((s: any) => {
          const cls: any = classById.get(String(s.classId));
          const tName = cls?.teacherId ? teacherById.get(String(cls.teacherId)) : undefined;
          const start = String(s.startTime || "").slice(0, 5);
          const end = String(s.endTime || "").slice(0, 5);
          return {
            id: String(s.id ?? `${s.classId}-${start}`),
            time: start && end ? `${start} - ${end}` : start || "—",
            className: cls?.name || cls?.className || "Class",
            teacher: tName || "—",
            students: cls?.currentEnrollment ?? cls?.enrolledCount ?? "—",
            status: String(s.status || "SCHEDULED"),
          };
        })
        .sort((a, b) => a.time.localeCompare(b.time));
      setTodaySchedule(schedule);
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
        <h1 className="text-2xl font-bold text-gray-900">🏫 {t("centerAdminDashboard")}</h1>
        <p className="text-gray-500">{t("manageCenter")}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm">{t("totalStudents")}</h3>
          <p className="text-2xl font-bold">{stats.totalStudents}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm">{t("totalTeachers")}</h3>
          <p className="text-2xl font-bold">{stats.totalTeachers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <h3 className="text-gray-500 text-sm">{t("activeClasses")}</h3>
          <p className="text-2xl font-bold">{stats.totalClasses}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <h3 className="text-gray-500 text-sm">{t("todaySessions")}</h3>
          <p className="text-2xl font-bold">{stats.todayClasses}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <h3 className="text-gray-500 text-sm">{t("pendingAttendance")}</h3>
          <p className="text-2xl font-bold">{stats.pendingAttendance}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <h3 className="text-gray-500 text-sm">Pending Leaves</h3>
          <p className="text-2xl font-bold">{stats.pendingLeaves}</p>
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">⚡ {t("quickActions")}</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/dashboard/center-admin/attendance/approvals"
              className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center"
            >
              <span className="text-2xl">✅</span>
              <p className="font-medium mt-2">Attendance Approvals</p>
            </Link>
            <Link
              href="/dashboard/attendance/leave-approvals"
              className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center"
            >
              <span className="text-2xl">📋</span>
              <p className="font-medium mt-2">Leave Approvals</p>
            </Link>
            <Link
              href="/dashboard/academy/students"
              className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center"
            >
              <span className="text-2xl">👨‍🎓</span>
              <p className="font-medium mt-2">Manage Students</p>
            </Link>
            <Link
              href="/dashboard/academy/classrooms"
              className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-center"
            >
              <span className="text-2xl">📚</span>
              <p className="font-medium mt-2">View Classes</p>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">📝 {t("recentActivity")}</h2>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-xl">
                  {activity.type === "enrollment" ? "👨‍🎓" : activity.type === "attendance" ? "📅" : "🏖️"}
                </span>
                <div className="flex-1">
                  <p className="text-gray-700">{activity.message}</p>
                  <p className="text-xs text-gray-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Schedule Preview */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">📅 {t("todaysSchedule")}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-gray-500 text-sm">
                <th className="pb-3">Time</th>
                <th className="pb-3">Class</th>
                <th className="pb-3">Teacher</th>
                <th className="pb-3">Students</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {todaySchedule.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-400 text-sm">
                    No sessions scheduled today.
                  </td>
                </tr>
              ) : (
                todaySchedule.map((row) => {
                  const badge = scheduleStatusBadge(row.status);
                  return (
                    <tr key={row.id}>
                      <td className="py-3">{row.time}</td>
                      <td className="py-3">{row.className}</td>
                      <td className="py-3">{row.teacher}</td>
                      <td className="py-3">{row.students}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${badge.cls}`}>{badge.label}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
