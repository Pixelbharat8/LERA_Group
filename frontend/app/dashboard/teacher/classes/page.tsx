"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import {
  isClassActive,
  loadScopedClasses,
  resolveMyTeacherId,
} from "../../../../lib/teacher-context";

interface Class {
  id: string;
  className: string;
  courseId: string;
  courseName: string;
  courseCode?: string;
  schedule: string;
  room?: string;
  capacity: number;
  enrolledCount: number;
  status: string;
  nextSession?: string;
  attendanceToday?: boolean;
}

interface Student {
  id: string;
  fullname: string;
  studentCode: string;
  email?: string;
  attendanceRate?: number;
  currentGrade?: string;
}

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [activeTab, setActiveTab] = useState<"students" | "attendance" | "grades">("students");

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const teacherEntityId = await resolveMyTeacherId();
      if (!teacherEntityId) {
        setClasses([]);
        return;
      }
      const mapped = await loadScopedClasses("teacher", teacherEntityId);
      const mappedClasses: Class[] = mapped.map((c) => ({
        id: c.id,
        className: c.className,
        courseId: c.programId,
        courseName: c.programName,
        courseCode: "",
        schedule: c.schedule,
        room: c.room,
        capacity: c.capacity,
        enrolledCount: c.enrolledCount,
        status: c.status,
        attendanceToday: false,
      }));
      setClasses(mappedClasses);
      if (mappedClasses.length > 0) {
        setSelectedClass(mappedClasses[0]);
        fetchClassStudents(mappedClasses[0].id);
      }
    } catch (err) {
      console.error(err);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassStudents = async (classId: string) => {
    try {
      const enrollments = await apiFetch(`/api/enrollments?classId=${classId}`);
      const enrollmentsArray = Array.isArray(enrollments) ? enrollments : [];
      
      if (enrollmentsArray.length > 0) {
        const studentIds = enrollmentsArray.map((e: any) => e.studentId).filter(Boolean);
        const studentsData = await Promise.all(
          studentIds.map(async (id: string) => {
            try {
              return await apiFetch(`/api/students/${id}`);
            } catch {
              return null;
            }
          })
        );
        const validStudents: Student[] = studentsData.filter(Boolean).map((s: any) => ({
          id: s.id,
          fullname: s.fullname || s.fullName || "Unknown",
          studentCode: s.studentCode || s.student_code || "",
          email: s.email || "",
          attendanceRate: s.attendanceRate || 0,
          currentGrade: s.currentGrade || s.grade || "N/A"
        }));
        setClassStudents(validStudents);
      } else {
        setClassStudents([]);
      }
    } catch (error) {
      console.error(error);
      setClassStudents([]);
    }
  };

  const handleSelectClass = (cls: Class) => {
    setSelectedClass(cls);
    fetchClassStudents(cls.id);
    setActiveTab("students");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
      case "ACTIVE": return "bg-green-100 text-green-700";
      case "COMPLETED": return "bg-blue-100 text-blue-700";
      case "UPCOMING": return "bg-yellow-100 text-yellow-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "text-green-600 bg-green-100";
    if (grade.startsWith("B")) return "text-blue-600 bg-blue-100";
    if (grade.startsWith("C")) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  const handleViewStudent = (student: Student) => {
    setViewingStudent(student);
  };

  const handleMessageStudent = (student: Student) => {
    // Redirect to connect page with pre-selected user
    window.location.href = `/dashboard/connect?userId=${student.id}&userName=${encodeURIComponent(student.fullname)}`;
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
              <Link href="/dashboard/teacher" className="text-gray-500 hover:text-gray-700">
                ← Back
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">📚 My Classes</h1>
                <p className="text-sm text-gray-500">Manage your assigned classes</p>
              </div>
            </div>
            <Link
              href="/dashboard/teacher/attendance"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              ✅ Take Attendance
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-3xl font-bold text-blue-600">{classes.length}</div>
            <div className="text-sm text-gray-500">Total Classes</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-3xl font-bold text-green-600">
              {classes.reduce((sum, c) => sum + c.enrolledCount, 0)}
            </div>
            <div className="text-sm text-gray-500">Total Students</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-3xl font-bold text-purple-600">
              {classes.filter(c => !c.attendanceToday).length}
            </div>
            <div className="text-sm text-gray-500">Pending Attendance</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-3xl font-bold text-orange-600">
              {classes.filter((c) => isClassActive(c.status)).length}
            </div>
            <div className="text-sm text-gray-500">Active Classes</div>
          </div>
        </div>

        {classes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">No Classes Assigned</h3>
            <p className="text-gray-500">You don't have any classes assigned yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Classes List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="font-bold text-gray-900">My Classes</h2>
                </div>
                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                  {classes.map((cls) => (
                    <button
                      key={cls.id}
                      onClick={() => handleSelectClass(cls)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition ${
                        selectedClass?.id === cls.id ? "bg-blue-50 border-l-4 border-blue-600" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{cls.className}</div>
                          <div className="text-xs text-gray-500">{cls.courseName}</div>
                          <div className="text-xs text-gray-400 mt-1">{cls.schedule}</div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cls.status)}`}>
                            {cls.status}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {cls.enrolledCount}/{cls.capacity}
                          </div>
                        </div>
                      </div>
                      {!cls.attendanceToday && (
                        <div className="mt-2 text-xs text-orange-600 flex items-center gap-1">
                          ⚠️ Attendance pending
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Class Details */}
            {selectedClass && (
              <div className="lg:col-span-2 space-y-6">
                {/* Class Info Card */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedClass.className}</h2>
                      <p className="text-gray-500">{selectedClass.courseName}</p>
                      {selectedClass.courseCode && (
                        <span className="text-xs text-gray-400">{selectedClass.courseCode}</span>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedClass.status)}`}>
                      {selectedClass.status}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500">Schedule</div>
                      <div className="font-medium text-sm">{selectedClass.schedule}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500">Room</div>
                      <div className="font-medium text-sm">{selectedClass.room || "TBD"}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500">Students</div>
                      <div className="font-medium text-sm">{selectedClass.enrolledCount} / {selectedClass.capacity}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500">Next Session</div>
                      <div className="font-medium text-sm text-blue-600">
                        {selectedClass.nextSession
                          ? new Date(selectedClass.nextSession).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                          : "TBD"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/dashboard/teacher/attendance?classId=${selectedClass.id}`}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                    >
                      ✅ Take Attendance
                    </Link>
                    <Link
                      href={`/dashboard/academy/classes/${selectedClass.id}`}
                      className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm hover:bg-slate-700"
                    >
                      📋 Class Profile
                    </Link>
                    <Link
                      href="/dashboard/teacher/grades"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                    >
                      📝 Add Grades
                    </Link>
                    <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
                      💬 Message All
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="flex border-b border-gray-200">
                    {[
                      { id: "students", label: "Students", icon: "👥" },
                      { id: "attendance", label: "Attendance", icon: "✅" },
                      { id: "grades", label: "Grades", icon: "📝" },
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
                    {activeTab === "students" && (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {classStudents.map((student) => (
                              <tr key={student.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                                      {student.fullname.charAt(0)}
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-900">{student.fullname}</div>
                                      <div className="text-xs text-gray-500">{student.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-gray-600">{student.studentCode}</td>
                                <td className="px-4 py-3">
                                  <span className={`text-sm font-medium ${
                                    (student.attendanceRate || 0) >= 90 ? "text-green-600" : 
                                    (student.attendanceRate || 0) >= 80 ? "text-yellow-600" : "text-red-600"
                                  }`}>
                                    {student.attendanceRate || 0}%
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(student.currentGrade || "N/A")}`}>
                                    {student.currentGrade || "N/A"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button onClick={() => handleViewStudent(student)} className="text-blue-600 hover:text-blue-700 text-sm mr-2">View</button>
                                  <button onClick={() => handleMessageStudent(student)} className="text-purple-600 hover:text-purple-700 text-sm">Message</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {activeTab === "attendance" && (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-4">✅</div>
                        <h3 className="text-lg font-semibold mb-2">Attendance Management</h3>
                        <p className="text-gray-500 mb-4">Take and manage attendance for this class</p>
                        <Link
                          href={`/dashboard/teacher/attendance?classId=${selectedClass.id}`}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-block"
                        >
                          Go to Attendance
                        </Link>
                      </div>
                    )}

                    {activeTab === "grades" && (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quiz 1</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quiz 2</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Midterm</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Final</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Overall</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {classStudents.map((student) => (
                              <tr key={student.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{student.fullname}</td>
                                <td className="px-4 py-3 text-center">85</td>
                                <td className="px-4 py-3 text-center">90</td>
                                <td className="px-4 py-3 text-center">88</td>
                                <td className="px-4 py-3 text-center">-</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(student.currentGrade || "N/A")}`}>
                                    {student.currentGrade || "N/A"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Student View Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">👤 Student Details</h2>
              <button onClick={() => setViewingStudent(null)} className="text-gray-500 hover:text-gray-800 text-xl">&times;</button>
            </div>
            
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">👤</span>
                </div>
                <h3 className="text-xl font-bold">{viewingStudent.fullname}</h3>
                <p className="text-gray-500">{viewingStudent.studentCode}</p>
              </div>

              <div className="border rounded-lg divide-y">
                <div className="flex justify-between p-3">
                  <span className="text-gray-500">Email</span>
                  <span>{viewingStudent.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-gray-500">Attendance Rate</span>
                  <span className={`font-medium ${
                    (viewingStudent.attendanceRate || 0) >= 90 ? "text-green-600" : 
                    (viewingStudent.attendanceRate || 0) >= 80 ? "text-yellow-600" : "text-red-600"
                  }`}>
                    {viewingStudent.attendanceRate || 0}%
                  </span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-gray-500">Current Grade</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(viewingStudent.currentGrade || "N/A")}`}>
                    {viewingStudent.currentGrade || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setViewingStudent(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Close</button>
              <button onClick={() => { setViewingStudent(null); handleMessageStudent(viewingStudent); }} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">💬 Message</button>
              <Link href={`/dashboard/academy/students/${viewingStudent.id}`} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">View Full Profile</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
