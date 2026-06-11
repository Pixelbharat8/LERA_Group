"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { loadMyChildren } from "../../../../lib/parent-context";
import {
  computeAttendanceRate,
  loadAttendanceRecordsForStudent,
} from "../../../../lib/student-context";

interface Child {
  id: string;
  fullname: string;
  firstName?: string;
  lastName?: string;
  studentCode: string;
  className: string;
  grade?: string;
  attendanceRate: number;
  recentGrade: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  profileImage?: string;
}

interface ChildGrade {
  subject: string;
  score: number;
  maxScore: number;
  date: string;
  type: string;
}

interface ChildAttendance {
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE";
  className: string;
}

export default function ParentChildrenPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [childGrades, setChildGrades] = useState<ChildGrade[]>([]);
  const [childAttendance, setChildAttendance] = useState<ChildAttendance[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "grades" | "attendance" | "schedule">("overview");

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const rows = await loadMyChildren();
      if (rows.length > 0) {
        const mappedChildren: Child[] = await Promise.all(
          rows.map(async (s) => ({
            id: s.id,
            fullname: s.fullname || "Unknown",
            studentCode: s.studentCode || "",
            className: s.className || "Not Assigned",
            grade: "N/A",
            attendanceRate: await computeAttendanceRate(s.id),
            recentGrade: "N/A",
          }))
        );
        setChildren(mappedChildren);
        setSelectedChild(mappedChildren[0]);
        fetchChildDetails(mappedChildren[0].id);
      } else {
        setChildren([]);
      }
    } catch (err) {
      console.error(err);
      setChildren([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildDetails = async (childId: string) => {
    try {
      // Fetch grades
      const gradesData = await apiFetch(`/api/grades?studentId=${childId}`).catch(() => []);
      const gradesArray = Array.isArray(gradesData) ? gradesData : [];
      
      if (gradesArray.length > 0) {
        setChildGrades(gradesArray.map((g: any) => ({
          subject: g.subject || g.courseName || "General",
          score: Number(g.score) || 0,
          maxScore: Number(g.maxScore) || 100,
          date: g.date || g.gradedDate || new Date().toISOString(),
          type: g.type || g.assessmentType || "Quiz"
        })));
      } else {
        setChildGrades([]);
      }

      const records = await loadAttendanceRecordsForStudent(childId);
      setChildAttendance(
        records.map((r) => ({
          date: r.date,
          status: r.status as ChildAttendance["status"],
          className: r.className,
        }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectChild = (child: Child) => {
    setSelectedChild(child);
    fetchChildDetails(child.id);
    setActiveTab("overview");
  };

  const getGradeColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-100";
    if (score >= 80) return "text-blue-600 bg-blue-100";
    if (score >= 70) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getAttendanceColor = (status: string) => {
    switch (status) {
      case "PRESENT": return "bg-green-100 text-green-700";
      case "LATE": return "bg-yellow-100 text-yellow-700";
      case "ABSENT": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
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
          <div className="flex items-center gap-4">
            <Link href="/dashboard/parent" className="text-gray-500 hover:text-gray-700">
              ← Back
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">👨‍👧‍👦 Children Progress</h1>
              <p className="text-sm text-gray-500">Monitor your children's academic performance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {children.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <div className="text-6xl mb-4">👨‍👧‍👦</div>
            <h3 className="text-xl font-semibold mb-2">No Children Found</h3>
            <p className="text-gray-500">No students are linked to your parent account.</p>
            <p className="text-sm text-gray-400 mt-2">Please contact the school administration.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Children List Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="font-bold text-gray-900">My Children</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => handleSelectChild(child)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition ${
                        selectedChild?.id === child.id ? "bg-blue-50 border-l-4 border-blue-600" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                          {child.fullname?.charAt(0) || "S"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{child.fullname}</div>
                          <div className="text-xs text-gray-500">{child.studentCode}</div>
                          <div className="text-xs text-blue-600">{child.className}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Child Details */}
            {selectedChild && (
              <div className="lg:col-span-3 space-y-6">
                {/* Child Profile Card */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-start gap-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
                      {selectedChild.fullname?.charAt(0) || "S"}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900">{selectedChild.fullname}</h2>
                      <p className="text-gray-500">{selectedChild.studentCode}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {selectedChild.className}
                        </span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                          {selectedChild.grade || "Level 1"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-green-600">{selectedChild.attendanceRate}%</div>
                      <div className="text-sm text-gray-500">Attendance Rate</div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="flex border-b border-gray-200">
                    {[
                      { id: "overview", label: "Overview", icon: "📊" },
                      { id: "grades", label: "Grades", icon: "📝" },
                      { id: "attendance", label: "Attendance", icon: "✅" },
                      { id: "schedule", label: "Schedule", icon: "📅" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                          activeTab === tab.id
                            ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {tab.icon} {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="p-6">
                    {activeTab === "overview" && (
                      <div className="space-y-6">
                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-blue-50 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">{selectedChild.recentGrade || "A"}</div>
                            <div className="text-sm text-gray-600">Latest Grade</div>
                          </div>
                          <div className="bg-green-50 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">{selectedChild.attendanceRate}%</div>
                            <div className="text-sm text-gray-600">Attendance</div>
                          </div>
                          <div className="bg-purple-50 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-purple-600">4</div>
                            <div className="text-sm text-gray-600">Subjects</div>
                          </div>
                          <div className="bg-orange-50 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-orange-600">2</div>
                            <div className="text-sm text-gray-600">Pending Tasks</div>
                          </div>
                        </div>

                        {/* Recent Grades Preview */}
                        <div>
                          <h3 className="font-bold text-gray-900 mb-3">Recent Grades</h3>
                          <div className="space-y-2">
                            {childGrades.slice(0, 3).map((grade, i) => (
                              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <div className="font-medium">{grade.subject}</div>
                                  <div className="text-xs text-gray-500">{grade.type} • {grade.date}</div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(grade.score)}`}>
                                  {grade.score}/{grade.maxScore}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Recent Attendance Preview */}
                        <div>
                          <h3 className="font-bold text-gray-900 mb-3">Recent Attendance</h3>
                          <div className="flex gap-2">
                            {childAttendance.slice(0, 7).map((att, i) => (
                              <div key={i} className="flex-1 text-center">
                                <div className={`w-full h-10 rounded-lg flex items-center justify-center text-xs font-medium ${getAttendanceColor(att.status)}`}>
                                  {att.status.charAt(0)}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {new Date(att.date).toLocaleDateString("en-US", { weekday: "short" })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "grades" && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold text-gray-900">All Grades</h3>
                          <div className="text-sm text-gray-500">
                            Average: <span className="font-bold text-blue-600">
                              {(childGrades.reduce((sum, g) => sum + g.score, 0) / childGrades.length || 0).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Score</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {childGrades.map((grade, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 font-medium text-gray-900">{grade.subject}</td>
                                  <td className="px-4 py-3 text-gray-600">{grade.type}</td>
                                  <td className="px-4 py-3 text-gray-600">{grade.date}</td>
                                  <td className="px-4 py-3 text-right">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(grade.score)}`}>
                                      {grade.score}/{grade.maxScore}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {activeTab === "attendance" && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold text-gray-900">Attendance History</h3>
                          <div className="flex gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <span className="w-3 h-3 bg-green-500 rounded-full"></span> Present
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span> Late
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-3 h-3 bg-red-500 rounded-full"></span> Absent
                            </span>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {childAttendance.map((att, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 font-medium text-gray-900">
                                    {new Date(att.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                                  </td>
                                  <td className="px-4 py-3 text-gray-600">{att.className}</td>
                                  <td className="px-4 py-3 text-right">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAttendanceColor(att.status)}`}>
                                      {att.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {activeTab === "schedule" && (
                      <div className="space-y-4">
                        <h3 className="font-bold text-gray-900">Weekly Schedule</h3>
                        <div className="grid gap-3">
                          {[
                            { day: "Monday", time: "09:00 - 10:30", subject: "English Speaking", teacher: "Ms. Sarah" },
                            { day: "Wednesday", time: "14:00 - 15:30", subject: "English Listening", teacher: "Mr. John" },
                            { day: "Friday", time: "09:00 - 10:30", subject: "English Grammar", teacher: "Ms. Sarah" },
                            { day: "Saturday", time: "09:00 - 11:00", subject: "IELTS Preparation", teacher: "Mr. David" },
                          ].map((schedule, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                              <div className="w-24 text-center">
                                <div className="font-bold text-blue-600">{schedule.day}</div>
                                <div className="text-xs text-gray-500">{schedule.time}</div>
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{schedule.subject}</div>
                                <div className="text-sm text-gray-500">Teacher: {schedule.teacher}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link
                    href={`/dashboard/report-card/${selectedChild.id}`}
                    className="bg-blue-600 text-white p-4 rounded-xl text-center hover:bg-blue-700 transition"
                  >
                    <div className="text-2xl mb-1">📄</div>
                    <div className="text-sm font-medium">Report Card</div>
                  </Link>
                  <Link
                    href={`/dashboard/parent/attendance?studentId=${selectedChild.id}`}
                    className="bg-green-600 text-white p-4 rounded-xl text-center hover:bg-green-700 transition"
                  >
                    <div className="text-2xl mb-1">✅</div>
                    <div className="text-sm font-medium">Full Attendance</div>
                  </Link>
                  <Link
                    href={`/dashboard/parent/payments?studentId=${selectedChild.id}`}
                    className="bg-orange-600 text-white p-4 rounded-xl text-center hover:bg-orange-700 transition"
                  >
                    <div className="text-2xl mb-1">💰</div>
                    <div className="text-sm font-medium">View Payments</div>
                  </Link>
                  <Link
                    href="/dashboard/parent/messages"
                    className="bg-purple-600 text-white p-4 rounded-xl text-center hover:bg-purple-700 transition"
                  >
                    <div className="text-2xl mb-1">💬</div>
                    <div className="text-sm font-medium">Message Teacher</div>
                  </Link>
                  <button className="bg-blue-600 text-white p-4 rounded-xl text-center hover:bg-blue-700 transition">
                    <div className="text-2xl mb-1">📄</div>
                    <div className="text-sm font-medium">Download Report</div>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
