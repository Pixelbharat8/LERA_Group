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

interface Session {
  id: string;
  sessionDate: string;
  startTime?: string;
  endTime?: string;
  status: string;
  topic?: string;
}

interface Material {
  key: string;
  label: string;
  url: string;
  type: "ppt" | "worksheet" | "video" | "audio" | "link";
  context: string; // lesson plan title + date
}

interface GradeRow {
  studentId: string;
  fullname: string;
  count: number;
  average: number | null;
  passed: number;
}

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"students" | "sessions" | "materials" | "grades">("students");

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
      const today = new Date().toISOString().split("T")[0];
      // Pull today's sessions per class so "attendance pending" is REAL, not static.
      const sessionLists = await Promise.all(
        mapped.map((c) =>
          apiFetch(`/api/class-sessions?classId=${c.id}`, {}, { silent: true }).catch(() => [])
        )
      );
      const mappedClasses: Class[] = mapped.map((c, i) => {
        const list = Array.isArray(sessionLists[i]) ? sessionLists[i] : [];
        const todays = list.filter((s: any) => String(s?.sessionDate || "").startsWith(today));
        const done = todays.length > 0 && todays.every((s: any) => s.status === "COMPLETED");
        const nextSession = [...list]
          .filter((s: any) => s?.sessionDate && new Date(s.sessionDate).getTime() >= Date.now() - 86400000)
          .sort((a: any, b: any) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime())[0];
        return {
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
          attendanceToday: todays.length > 0 ? done : true, // no session today => nothing pending
          nextSession: nextSession?.sessionDate,
        };
      });
      setClasses(mappedClasses);
      if (mappedClasses.length > 0) {
        setSelectedClass(mappedClasses[0]);
        fetchClassDetail(mappedClasses[0].id, mappedClasses[0]);
      }
    } catch (err) {
      console.error(err);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassDetail = async (classId: string, _cls: Class) => {
    setDetailLoading(true);
    setClassStudents([]);
    setSessions([]);
    setMaterials([]);
    setGrades([]);
    try {
      const [enrollments, sessionList, lessonPlans] = await Promise.all([
        apiFetch(`/api/enrollments?classId=${classId}`, {}, { silent: true }).catch(() => []),
        apiFetch(`/api/class-sessions?classId=${classId}`, {}, { silent: true }).catch(() => []),
        apiFetch(`/api/lesson-plans?classId=${classId}`, {}, { silent: true }).catch(() => []),
      ]);

      // --- Sessions (real) ---
      const sList: Session[] = (Array.isArray(sessionList) ? sessionList : [])
        .map((s: any) => ({
          id: String(s.id),
          sessionDate: s.sessionDate,
          startTime: s.startTime,
          endTime: s.endTime,
          status: String(s.status || "SCHEDULED"),
          topic: s.topic,
        }))
        .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
      setSessions(sList);

      // --- Materials from per-class lesson plans (real files) ---
      const mats: Material[] = [];
      (Array.isArray(lessonPlans) ? lessonPlans : []).forEach((lp: any) => {
        const ctx = [lp.title, lp.planDate ? new Date(lp.planDate).toLocaleDateString() : ""]
          .filter(Boolean).join(" • ") || "Lesson plan";
        const add = (url: string | undefined, label: string, type: Material["type"]) => {
          if (url && String(url).trim()) mats.push({ key: `${lp.id}-${type}`, label, url: String(url), type, context: ctx });
        };
        add(lp.powerpointUrl, lp.powerpointName || "PowerPoint", "ppt");
        add(lp.worksheetUrl, lp.worksheetName || "Worksheet", "worksheet");
        add(lp.videoUrl, "Video", "video");
        add(lp.audioUrl, "Audio", "audio");
        // additionalResources may hold a URL or free text; surface only if it looks like a link
        if (lp.additionalResources && /^https?:\/\//i.test(String(lp.additionalResources).trim())) {
          add(lp.additionalResources, "Additional resource", "link");
        }
      });
      setMaterials(mats);

      // --- Students (real) ---
      const enrollmentsArray = Array.isArray(enrollments) ? enrollments : [];
      const studentIds = enrollmentsArray.map((e: any) => e.studentId).filter(Boolean);
      const studentsData = await Promise.all(
        studentIds.map((id: string) => apiFetch(`/api/students/${id}`, {}, { silent: true }).catch(() => null))
      );
      const validStudents: Student[] = studentsData.filter(Boolean).map((s: any) => ({
        id: s.id,
        fullname: s.fullname || s.fullName || "Unknown",
        studentCode: s.studentCode || s.student_code || "",
        email: s.email || "",
        attendanceRate: s.attendanceRate || 0,
        currentGrade: s.currentGrade || s.grade || "N/A",
      }));
      setClassStudents(validStudents);

      // --- Grades (real, per student for this class) ---
      const gradeRows: GradeRow[] = await Promise.all(
        validStudents.map(async (st) => {
          const res = await apiFetch(`/api/grades?studentId=${st.id}&classId=${classId}`, {}, { silent: true }).catch(() => []);
          const arr = Array.isArray(res) ? res : [];
          const pcts = arr
            .map((g: any) => Number(g.percentage ?? g.score))
            .filter((n: number) => !isNaN(n));
          const passed = arr.filter((g: any) => g.passed === true || g.isPassed === true).length;
          return {
            studentId: st.id,
            fullname: st.fullname,
            count: arr.length,
            average: pcts.length ? Math.round((pcts.reduce((a, b) => a + b, 0) / pcts.length) * 10) / 10 : null,
            passed,
          };
        })
      );
      setGrades(gradeRows);
    } catch (error) {
      console.error(error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSelectClass = (cls: Class) => {
    setSelectedClass(cls);
    fetchClassDetail(cls.id, cls);
    setActiveTab("students");
  };

  const messageAll = () => {
    if (!selectedClass) return;
    // Open the messaging surface scoped to this class so the teacher can broadcast.
    window.location.href = `/dashboard/connect?classId=${selectedClass.id}&className=${encodeURIComponent(selectedClass.className)}`;
  };

  const materialIcon = (type: Material["type"]) =>
    type === "ppt" ? "📊" : type === "worksheet" ? "📝" : type === "video" ? "🎬" : type === "audio" ? "🎧" : "🔗";

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
                    <button onClick={messageAll} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
                      💬 Message All
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="flex border-b border-gray-200">
                    {[
                      { id: "students", label: `Students (${classStudents.length})`, icon: "👥" },
                      { id: "sessions", label: `Sessions (${sessions.length})`, icon: "📅" },
                      { id: "materials", label: `Materials (${materials.length})`, icon: "📂" },
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

                    {activeTab === "sessions" && (
                      detailLoading ? (
                        <p className="text-center text-gray-400 py-8">Loading sessions…</p>
                      ) : sessions.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-4">📅</div>
                          <p className="text-gray-500 mb-4">No sessions scheduled for this class yet.</p>
                          <Link href={`/dashboard/teacher/attendance?classId=${selectedClass.id}`} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-block">
                            Take Attendance
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {sessions.map((s) => {
                            const badge = getStatusColor(s.status === "COMPLETED" ? "COMPLETED" : s.status === "IN_PROGRESS" ? "ACTIVE" : "UPCOMING");
                            const time = [s.startTime, s.endTime].filter(Boolean).map((t) => String(t).slice(0, 5)).join(" – ");
                            return (
                              <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {new Date(s.sessionDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                                    {time && <span className="text-gray-500 font-normal"> · {time}</span>}
                                  </div>
                                  {s.topic && <div className="text-xs text-gray-500">{s.topic}</div>}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge}`}>{s.status}</span>
                                  <Link href={`/dashboard/teacher/attendance?classId=${selectedClass.id}`} className="text-green-600 hover:text-green-700 text-sm">Attendance →</Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )
                    )}

                    {activeTab === "materials" && (
                      detailLoading ? (
                        <p className="text-center text-gray-400 py-8">Loading materials…</p>
                      ) : materials.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-4">📂</div>
                          <h3 className="text-lg font-semibold mb-1">No materials yet</h3>
                          <p className="text-gray-500">Teaching materials attached to this class's lesson plans (PowerPoint, worksheets, video, audio) will appear here.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {materials.map((m) => (
                            <a
                              key={m.key}
                              href={m.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition group"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{materialIcon(m.type)}</span>
                                <div>
                                  <div className="font-medium text-gray-900 group-hover:text-blue-700">{m.label}</div>
                                  <div className="text-xs text-gray-500">{m.context}</div>
                                </div>
                              </div>
                              <span className="text-blue-600 text-sm opacity-0 group-hover:opacity-100">Open / Download →</span>
                            </a>
                          ))}
                        </div>
                      )
                    )}

                    {activeTab === "grades" && (
                      detailLoading ? (
                        <p className="text-center text-gray-400 py-8">Loading grades…</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <div className="flex justify-end mb-3">
                            <Link href="/dashboard/teacher/gradebook" className="text-sm text-blue-600 hover:text-blue-700">Open gradebook →</Link>
                          </div>
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Assessments</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Average</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Passed</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {grades.map((g) => (
                                <tr key={g.studentId} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 font-medium text-gray-900">{g.fullname}</td>
                                  <td className="px-4 py-3 text-center text-gray-600">{g.count}</td>
                                  <td className="px-4 py-3 text-center">
                                    {g.average === null ? (
                                      <span className="text-gray-400">—</span>
                                    ) : (
                                      <span className={`font-medium ${g.average >= 80 ? "text-green-600" : g.average >= 50 ? "text-yellow-600" : "text-red-600"}`}>{g.average}%</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-center text-gray-600">{g.count > 0 ? `${g.passed}/${g.count}` : "—"}</td>
                                </tr>
                              ))}
                              {grades.length === 0 && (
                                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">No students enrolled.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )
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
