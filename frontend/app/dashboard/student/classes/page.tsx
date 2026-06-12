"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { loadMyClasses, resolveMyStudentId } from "../../../../lib/student-context";

interface Class {
  id: string;
  className: string;
  courseName: string;
  courseCode?: string;
  teacherName: string;
  teacherEmail?: string;
  schedule: string;
  room?: string;
  status: string;
  progress?: number;
  nextClass?: string;
  totalSessions?: number;
  completedSessions?: number;
}

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  status: "pending" | "submitted" | "graded";
  className: string;
}

export default function StudentClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    fetchClasses();
    fetchAssignments();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const studentId = await resolveMyStudentId();
      if (!studentId) {
        setClasses([]);
        return;
      }
      const mapped = await loadMyClasses(studentId);
      setClasses(
        mapped.map((c) => ({
          id: c.id,
          className: c.className,
          courseName: c.courseName,
          courseCode: "",
          teacherName: c.teacherName,
          teacherEmail: "",
          schedule: c.schedule,
          room: c.room,
          status: c.status === "OPEN" ? "ACTIVE" : c.status,
          progress: 0,
          totalSessions: 0,
          completedSessions: 0,
        }))
      );
    } catch (err) {
      console.error(err);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const studentId = await resolveMyStudentId();
      if (!studentId) {
        setUpcomingAssignments([]);
        return;
      }
      const data = await apiFetch(`/api/assignments?studentId=${studentId}`).catch(() => []);
      const assignmentsArray = Array.isArray(data) ? data : [];
      if (assignmentsArray.length > 0) {
        setUpcomingAssignments(assignmentsArray.map((a: any) => ({
          id: a.id,
          title: a.title || a.name || "Assignment",
          dueDate: a.dueDate || a.due_date || new Date().toISOString(),
          status: a.status || "pending",
          className: a.className || a.class?.name || "Class"
        })));
      } else {
        setUpcomingAssignments([]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-700";
      case "COMPLETED": return "bg-blue-100 text-blue-700";
      case "UPCOMING": return "bg-yellow-100 text-yellow-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getDaysUntil = (date: string) => {
    const diff = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    return `${diff} days`;
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/student" className="text-gray-500 hover:text-gray-700">
                ← Back
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">📚 My Classes</h1>
                <p className="text-sm text-gray-500">Your enrolled courses and classes</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded ${viewMode === "grid" ? "bg-blue-100 text-blue-600" : "text-gray-500"}`}
              >
                ▦
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded ${viewMode === "list" ? "bg-blue-100 text-blue-600" : "text-gray-500"}`}
              >
                ≡
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-3xl font-bold text-blue-600">{classes.length}</div>
            <div className="text-sm text-gray-500">Enrolled Classes</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-3xl font-bold text-green-600">
              {classes.filter(c => c.status === "ACTIVE").length}
            </div>
            <div className="text-sm text-gray-500">Active Classes</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-3xl font-bold text-purple-600">
              {classes.reduce((sum, c) => sum + (c.completedSessions || 0), 0)}
            </div>
            <div className="text-sm text-gray-500">Sessions Completed</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-3xl font-bold text-orange-600">{upcomingAssignments.length}</div>
            <div className="text-sm text-gray-500">Pending Assignments</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Classes List */}
          <div className="lg:col-span-2">
            {classes.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold mb-2">No Classes Enrolled</h3>
                <p className="text-gray-500">You haven't enrolled in any classes yet.</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    onClick={() => setSelectedClass(cls)}
                    className={`bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-lg transition ${
                      selectedClass?.id === cls.id ? "ring-2 ring-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-xl">
                        📖
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cls.status)}`}>
                        {cls.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{cls.className}</h3>
                    <p className="text-sm text-gray-500 mb-3">{cls.courseName}</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <span>👨‍🏫</span>
                        <span>{cls.teacherName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <span>📅</span>
                        <span>{cls.schedule}</span>
                      </div>
                      {cls.room && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <span>🏫</span>
                          <span>{cls.room}</span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {cls.progress !== undefined && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{cls.progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                            style={{ width: `${cls.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schedule</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {classes.map((cls) => (
                      <tr
                        key={cls.id}
                        onClick={() => setSelectedClass(cls)}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{cls.className}</div>
                          <div className="text-xs text-gray-500">{cls.courseName}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{cls.teacherName}</td>
                        <td className="px-4 py-3 text-gray-600">{cls.schedule}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${cls.progress || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500">{cls.progress || 0}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cls.status)}`}>
                            {cls.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Class Details */}
            {selectedClass && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">Class Details</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Course</div>
                    <div className="font-medium">{selectedClass.courseName}</div>
                    {selectedClass.courseCode && (
                      <div className="text-xs text-gray-400">{selectedClass.courseCode}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Teacher</div>
                    <div className="font-medium">{selectedClass.teacherName}</div>
                    {selectedClass.teacherEmail && (
                      <div className="text-xs text-blue-600">{selectedClass.teacherEmail}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Sessions</div>
                    <div className="font-medium">
                      {selectedClass.completedSessions || 0} / {selectedClass.totalSessions || 0} completed
                    </div>
                  </div>
                  {selectedClass.nextClass && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Next Class</div>
                      <div className="font-medium text-blue-600">
                        {new Date(selectedClass.nextClass).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t flex gap-2">
                  <Link
                    href={`/dashboard/student/attendance?classId=${selectedClass.id}`}
                    className="flex-1 text-center py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200"
                  >
                    Attendance
                  </Link>
                  <Link
                    href="/dashboard/student/messages"
                    className="flex-1 text-center py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200"
                  >
                    Message
                  </Link>
                </div>
              </div>
            )}

            {/* Upcoming Assignments */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">📝 Upcoming Assignments</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {upcomingAssignments.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No pending assignments</div>
                ) : (
                  upcomingAssignments.map((assignment) => (
                    <div key={assignment.id} className="p-4">
                      <div className="font-medium text-gray-900">{assignment.title}</div>
                      <div className="text-xs text-gray-500">{assignment.className}</div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-orange-600">
                          Due: {getDaysUntil(assignment.dueDate)}
                        </span>
                        <Link
                          href={`/dashboard/student/assignments/${assignment.id}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View →
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-gray-100">
                <Link
                  href="/dashboard/student/assignments"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View All Assignments →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
