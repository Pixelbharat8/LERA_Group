"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";

interface ClassInfo {
  id: string;
  name: string;
  centerId: string;
  centerName?: string;
  programId?: string;
  programName?: string;
  teacherId: string;
  teacherName?: string;
  assistantTeacherId?: string;
  assistantTeacherName?: string;
  room?: string;
  scheduleDays?: string;
  scheduleTimeStart?: string;
  scheduleTimeEnd?: string;
  startDate?: string;
  endDate?: string;
  maxStudents: number;
  currentEnrollment?: number;
  status: string;
  createdAt?: string;
}

interface Student {
  id: string;
  fullname: string;
  studentCode: string;
  enrollmentDate: string;
  status: string;
  attendanceRate: number;
  email?: string;
}

interface Session {
  id: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  topic?: string;
  status: string;
  presentCount: number;
  totalCount: number;
}

interface Assignment {
  id: string;
  title: string;
  dueDate?: string;
  status: string;
  type?: string;
}

export default function ClassProfilePage() {
  const params = useParams();
  const classId = params.id as string;
  
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [dateFilter, setDateFilter] = useState("monthly");

  // Real data from APIs
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    completedSessions: 0,
    upcomingSessions: 0,
    averageAttendance: 0,
    completionRate: 0,
    lowAttendanceDays: 0,
    studentsAtRisk: 0,
    assignmentCount: 0,
    homeworkCount: 0,
    examCount: 0,
  });
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    sessionDate: "",
    startTime: "09:00",
    endTime: "10:30",
    topic: "",
  });
  const [savingSession, setSavingSession] = useState(false);
  const [markSession, setMarkSession] = useState<Session | null>(null);
  const [attendanceMarks, setAttendanceMarks] = useState<Record<string, string>>({});
  const [markSessionComplete, setMarkSessionComplete] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, [classId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [classData, profileData] = await Promise.all([
        apiFetch(`/api/classes/${classId}`).catch(() => null),
        apiFetch(`/api/classes/${classId}/profile`).catch(() => null),
      ]);

      const studentAttendanceMap = new Map<string, { present: number; total: number }>();

      let enrichedClass: ClassInfo | null = classData;
      if (classData) {
        const lookups: Promise<void>[] = [];

        if (classData.teacherId) {
          lookups.push(
            apiFetch(`/api/teachers/${classData.teacherId}`)
              .then((teacherData: { userId?: string }) =>
                teacherData?.userId
                  ? apiFetch(`/api/users/${teacherData.userId}`)
                  : null
              )
              .then((userData: { fullname?: string; name?: string } | null) => {
                if (userData) {
                  enrichedClass = {
                    ...enrichedClass!,
                    teacherName: userData.fullname || userData.name,
                  };
                }
              })
              .catch(() => undefined)
          );
        }

        if (classData.assistantTeacherId) {
          lookups.push(
            apiFetch(`/api/teachers/${classData.assistantTeacherId}`)
              .then((taData: { userId?: string }) =>
                taData?.userId ? apiFetch(`/api/users/${taData.userId}`) : null
              )
              .then((userData: { fullname?: string; name?: string } | null) => {
                if (userData) {
                  enrichedClass = {
                    ...enrichedClass!,
                    assistantTeacherName: userData.fullname || userData.name,
                  };
                }
              })
              .catch(() => undefined)
          );
        }

        if (classData.centerId) {
          lookups.push(
            apiFetch(`/api/centers/${classData.centerId}`)
              .then((centerData: { name?: string }) => {
                if (centerData?.name) {
                  enrichedClass = { ...enrichedClass!, centerName: centerData.name };
                }
              })
              .catch(() => undefined)
          );
        }

        if (classData.programId) {
          lookups.push(
            apiFetch(`/api/programs/${classData.programId}`)
              .then((programData: { programName?: string; name?: string }) => {
                if (programData) {
                  enrichedClass = {
                    ...enrichedClass!,
                    programName: programData.programName || programData.name,
                  };
                }
              })
              .catch(() => undefined)
          );
        }

        await Promise.all(lookups);

        if (profileData?.activeEnrollments != null) {
          enrichedClass = {
            ...enrichedClass!,
            currentEnrollment: profileData.activeEnrollments,
          };
        }
      }

      setClassInfo(enrichedClass);

      const enrollmentsData = await apiFetch(`/api/enrollments?classId=${classId}`).catch(() => []);
      const enrollments = Array.isArray(enrollmentsData) ? enrollmentsData : [];

      const studentsBase = (
        await Promise.all(
          enrollments.map(
            async (enrollment: { studentId: string; enrollmentDate?: string; status: string }) => {
              const studentData = await apiFetch(`/api/students/${enrollment.studentId}`).catch(() => null);
              if (!studentData) return null;

              let fullname = studentData.fullname || "Unknown";
              if (studentData.userId) {
                const userData = await apiFetch(`/api/users/${studentData.userId}`).catch(() => null);
                if (userData) {
                  fullname = userData.fullname || userData.name || fullname;
                }
              }

              return {
                id: studentData.id,
                fullname,
                studentCode: studentData.studentCode || `STU${String(studentData.id).slice(-4)}`,
                enrollmentDate: enrollment.enrollmentDate || studentData.createdAt,
                status: enrollment.status || studentData.status || "ACTIVE",
                email: studentData.email,
              };
            }
          )
        )
      ).filter(Boolean) as Omit<Student, "attendanceRate">[];

      const sessionsData = await apiFetch(`/api/class-sessions?classId=${classId}`).catch(() => []);
      const sessionsList = Array.isArray(sessionsData) ? sessionsData : [];

      const enrichedSessions = await Promise.all(
        sessionsList.map(async (raw: Record<string, unknown>) => {
          const sessionId = String(raw.id);
          const sessionAttendance = await apiFetch(`/api/session-attendance/session/${sessionId}`).catch(
            () => []
          );
          const attendanceList = Array.isArray(sessionAttendance) ? sessionAttendance : [];
          const presentCount = attendanceList.filter(
            (a: { status: string }) => a.status === "PRESENT" || a.status === "LATE"
          ).length;

          for (const row of attendanceList as { studentId?: string; status?: string }[]) {
            if (!row.studentId) continue;
            const sid = String(row.studentId);
            const cur = studentAttendanceMap.get(sid) || { present: 0, total: 0 };
            cur.total += 1;
            if (row.status === "PRESENT" || row.status === "LATE") {
              cur.present += 1;
            }
            studentAttendanceMap.set(sid, cur);
          }

          return {
            id: sessionId,
            sessionDate: String(raw.sessionDate ?? ""),
            startTime: String(raw.startTime ?? ""),
            endTime: String(raw.endTime ?? ""),
            topic: raw.topic as string | undefined,
            status: String(raw.status ?? "SCHEDULED"),
            presentCount,
            totalCount: studentsBase.length,
          } satisfies Session;
        })
      );

      const studentsData: Student[] = studentsBase.map((s) => {
        const att = studentAttendanceMap.get(String(s.id));
        const attendanceRate =
          att && att.total > 0 ? Math.round((att.present / att.total) * 100) : 0;
        return { ...s, attendanceRate };
      });

      setStudents(studentsData);
      setSessions(enrichedSessions);

      const assignmentsData = await apiFetch(`/api/assignments?classId=${classId}`).catch(() => []);
      setAssignments(
        (Array.isArray(assignmentsData) ? assignmentsData : []).map(
          (a: { id: string | number; title: string; dueDate?: string; assignmentType?: string; isPublished?: boolean }) => ({
            id: String(a.id),
            title: a.title,
            dueDate: a.dueDate,
            type: a.assignmentType,
            status: a.isPublished ? "PUBLISHED" : "DRAFT",
          })
        )
      );

      const activeStudents = studentsData.filter((s) => s.status === "ACTIVE").length;
      const completedSessions = enrichedSessions.filter((s) => s.status === "COMPLETED").length;
      const upcomingSessions = enrichedSessions.filter((s) => s.status === "SCHEDULED").length;
      const avgAttendance =
        studentsData.length > 0
          ? Math.round(studentsData.reduce((acc, s) => acc + s.attendanceRate, 0) / studentsData.length)
          : 0;
      const totalSessions = enrichedSessions.length || 1;
      const computedLowDays = enrichedSessions.filter(
        (s) => s.totalCount > 0 && s.presentCount / s.totalCount < 0.8
      ).length;
      const computedAtRisk = studentsData.filter((s) => s.attendanceRate < 80).length;

      setStats({
        totalStudents: studentsData.length,
        activeStudents,
        completedSessions: profileData?.completedSessions ?? completedSessions,
        upcomingSessions: profileData?.scheduledSessions ?? upcomingSessions,
        averageAttendance: profileData?.averageAttendance ?? avgAttendance,
        completionRate: Math.round((completedSessions / totalSessions) * 100),
        lowAttendanceDays: profileData?.lowAttendanceDays ?? computedLowDays,
        studentsAtRisk: profileData?.studentsAtRisk ?? computedAtRisk,
        assignmentCount: profileData?.assignmentCount ?? 0,
        homeworkCount: profileData?.homeworkCount ?? 0,
        examCount: profileData?.examCount ?? 0,
      });
    } catch (error) {
      console.error("Error fetching class data:", error);
    } finally {
      setLoading(false);
    }
  };

  const openMarkAttendance = async (session: Session) => {
    setMarkSession(session);
    setMarkSessionComplete(session.status === "COMPLETED");
    const existing = await apiFetch(`/api/session-attendance/session/${session.id}`).catch(() => []);
    const marks: Record<string, string> = {};
    for (const s of students) {
      marks[s.id] = "ABSENT";
    }
    if (Array.isArray(existing)) {
      for (const row of existing as { studentId: string; status: string }[]) {
        if (row.studentId) {
          marks[row.studentId] = row.status || "PRESENT";
        }
      }
    }
    setAttendanceMarks(marks);
  };

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!markSession) return;
    setSavingAttendance(true);
    try {
      const payload = students.map((s) => ({
        sessionId: markSession.id,
        studentId: s.id,
        status: attendanceMarks[s.id] || "ABSENT",
      }));
      await apiFetch("/api/session-attendance/bulk", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (markSessionComplete) {
        await apiFetch(`/api/class-sessions/${markSession.id}`, {
          method: "PUT",
          body: JSON.stringify({
            classId,
            sessionDate: markSession.sessionDate,
            startTime: markSession.startTime,
            endTime: markSession.endTime,
            topic: markSession.topic || "Class session",
            status: "COMPLETED",
          }),
        });
      }
      setMarkSession(null);
      await fetchAllData();
    } catch (error) {
      console.error("Failed to save attendance:", error);
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionForm.sessionDate || !sessionForm.topic.trim()) return;
    setSavingSession(true);
    try {
      await apiFetch("/api/class-sessions", {
        method: "POST",
        body: JSON.stringify({
          classId,
          sessionDate: sessionForm.sessionDate,
          startTime: sessionForm.startTime,
          endTime: sessionForm.endTime,
          topic: sessionForm.topic.trim(),
          status: "SCHEDULED",
          teacherId: classInfo?.teacherId || undefined,
        }),
      });
      setShowSessionModal(false);
      setSessionForm({ sessionDate: "", startTime: "09:00", endTime: "10:30", topic: "" });
      await fetchAllData();
    } catch (error) {
      console.error("Failed to create session:", error);
    } finally {
      setSavingSession(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "students", label: "Students", icon: "👨‍🎓" },
    { id: "sessions", label: "Sessions", icon: "📅" },
    { id: "attendance", label: "Attendance", icon: "✅" },
    { id: "curriculum", label: "Curriculum", icon: "📚" },
    { id: "assignments", label: "Assignments", icon: "📝" },
    { id: "grades", label: "Grades", icon: "📈" },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/superadmin" className="hover:text-blue-600">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/academy/classrooms" className="hover:text-blue-600">Classrooms</Link>
        <span>/</span>
        <span className="text-gray-900">{classInfo?.name || "Class Profile"}</span>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-xl flex items-center justify-center text-4xl">
              📚
            </div>
            <div>
              <h1 className="text-2xl font-bold">{classInfo?.name || "Class Name"}</h1>
              {classInfo?.programName && (
                <p className="text-blue-200">Program: {classInfo.programName}</p>
              )}
              <p className="text-blue-200">👨‍🏫 {classInfo?.teacherName || "—"} • 📍 {classInfo?.room || "—"}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm ${classInfo?.status === "ACTIVE" ? "bg-green-500" : "bg-gray-500"}`}>
                  {classInfo?.status || "ACTIVE"}
                </span>
                <span className="text-sm">📅 {classInfo?.scheduleDays}</span>
                <span className="text-sm">⏰ {classInfo?.scheduleTimeStart}{classInfo?.scheduleTimeEnd ? ` – ${classInfo.scheduleTimeEnd}` : ""}</span>
              </div>
            </div>
          </div>
          <Link
            href="/dashboard/academy/classrooms"
            className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
          >
            ✏️ Manage in Classrooms
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">👨‍🎓</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}/{classInfo?.maxStudents}</p>
              <p className="text-xs text-gray-500">Students</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">✅</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.completedSessions}</p>
              <p className="text-xs text-gray-500">Sessions Done</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-xl">📅</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.upcomingSessions}</p>
              <p className="text-xs text-gray-500">Upcoming</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-xl">📈</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.averageAttendance}%</p>
              <p className="text-xs text-gray-500">Attendance</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-xl">🎯</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
              <p className="text-xs text-gray-500">Progress</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-xl">📆</div>
            <div>
              <p className="text-lg font-bold text-gray-900">{classInfo?.endDate}</p>
              <p className="text-xs text-gray-500">End Date</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b overflow-x-auto">
          <div className="flex">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition ${
                  activeTab === tab.id 
                    ? "text-indigo-600 border-b-2 border-indigo-600" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Filter */}
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">
            {tabs.find(t => t.id === activeTab)?.icon} {tabs.find(t => t.id === activeTab)?.label}
          </h3>
          <div className="flex gap-2">
            {["daily", "weekly", "monthly", "yearly"].map(period => (
              <button
                key={period}
                onClick={() => setDateFilter(period)}
                className={`px-3 py-1 text-sm rounded-lg ${
                  dateFilter === period 
                    ? "bg-indigo-600 text-white" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Class Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-4">📚 Class Details</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Program:</span><span>{classInfo?.programName || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Center:</span><span>{classInfo?.centerName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Teacher:</span><span>{classInfo?.teacherName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Assistant:</span><span>{classInfo?.assistantTeacherName || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Room:</span><span>{classInfo?.room}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Schedule:</span><span>{classInfo?.scheduleDays} • {classInfo?.scheduleTimeStart}{classInfo?.scheduleTimeEnd ? ` – ${classInfo.scheduleTimeEnd}` : ""}</span></div>
                </div>
              </div>

              {/* Duration */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-4">📅 Duration & Progress</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Start Date:</span><span>{classInfo?.startDate}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">End Date:</span><span>{classInfo?.endDate}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Total Sessions:</span><span>{stats.completedSessions + stats.upcomingSessions}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Completed:</span><span className="text-green-600">{stats.completedSessions}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Remaining:</span><span className="text-yellow-600">{stats.upcomingSessions}</span></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "students" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-gray-600">{stats.totalStudents} students enrolled</p>
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = `/dashboard/academy/enrollments?classId=${classId}`;
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  ➕ Add Student
                </button>
              </div>
              {students.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No students enrolled in this class yet</div>
              ) : (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrolled</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm">
                            {s.fullname.charAt(0)}
                          </div>
                          <div>
                            <span className="font-medium">{s.fullname}</span>
                            {s.email && <p className="text-xs text-gray-500">{s.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">{s.studentCode}</td>
                      <td className="px-4 py-3 text-gray-500">{s.enrollmentDate ? new Date(s.enrollmentDate).toLocaleDateString() : "N/A"}</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${s.attendanceRate >= 95 ? "text-green-600" : s.attendanceRate >= 80 ? "text-yellow-600" : "text-red-600"}`}>
                          {s.attendanceRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          s.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                          s.status === "INACTIVE" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>{s.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/academy/students/${s.id}`} className="text-indigo-600 hover:underline">
                          View Profile
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          )}

          {activeTab === "sessions" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-gray-600">{sessions.length} sessions</p>
                <button
                  type="button"
                  onClick={() => setShowSessionModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  ➕ Add Session
                </button>
              </div>
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No sessions scheduled yet</div>
              ) : (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Topic</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sessions.map(session => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{session.sessionDate ? new Date(session.sessionDate).toLocaleDateString() : "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{session.startTime} - {session.endTime}</td>
                      <td className="px-4 py-3">{session.topic || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={session.status === "COMPLETED" || session.status === "DONE" ? "text-green-600" : "text-gray-400"}>
                          {session.presentCount}/{session.totalCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          session.status === "COMPLETED" || session.status === "DONE" ? "bg-green-100 text-green-800" : 
                          session.status === "SCHEDULED" || session.status === "UPCOMING" ? "bg-blue-100 text-blue-800" : 
                          session.status === "IN_PROGRESS" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>{session.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openMarkAttendance(session)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                          Mark attendance
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          )}

          {activeTab === "attendance" && (
            <div className="space-y-6">
              <p className="text-sm text-gray-500">
                Session attendance (LMS). Mark sessions on the Sessions tab; completed sessions can sync to
                payroll when enabled.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{stats.averageAttendance}%</p>
                  <p className="text-sm text-gray-600">Average Rate</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">{sessions.length}</p>
                  <p className="text-sm text-gray-600">Sessions Logged</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-600">{stats.lowAttendanceDays}</p>
                  <p className="text-sm text-gray-600">Low Attendance Sessions</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-purple-600">{stats.studentsAtRisk}</p>
                  <p className="text-sm text-gray-600">Students at Risk (&lt;80%)</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Session attendance log</h3>
                {sessions.length === 0 ? (
                  <p className="text-gray-500 text-sm">No sessions yet.</p>
                ) : (
                  <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Topic</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sessions
                        .slice()
                        .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))
                        .map((session) => (
                          <tr key={session.id}>
                            <td className="px-4 py-2 text-sm">{session.sessionDate}</td>
                            <td className="px-4 py-2 text-sm">{session.topic || "—"}</td>
                            <td className="px-4 py-2 text-sm">
                              {session.presentCount}/{session.totalCount}
                            </td>
                            <td className="px-4 py-2 text-sm">{session.status}</td>
                            <td className="px-4 py-2">
                              <button
                                type="button"
                                onClick={() => openMarkAttendance(session)}
                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Per-student rates</h3>
                <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map((s) => (
                      <tr key={s.id}>
                        <td className="px-4 py-2 text-sm font-medium">{s.fullname}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{s.studentCode}</td>
                        <td className="px-4 py-2 text-sm">
                          <span
                            className={
                              s.attendanceRate >= 90
                                ? "text-green-600 font-medium"
                                : s.attendanceRate >= 80
                                  ? "text-yellow-600 font-medium"
                                  : "text-red-600 font-medium"
                            }
                          >
                            {s.attendanceRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "curriculum" && (
            <div className="space-y-4">
              <p className="text-gray-600">Curriculum and lesson plans for this class.</p>
              {classInfo?.programId ? (
                <Link
                  href={`/dashboard/academy/courses?programId=${classInfo.programId}`}
                  className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  View program curriculum
                </Link>
              ) : (
                <p className="text-gray-500">No program linked to this class yet.</p>
              )}
            </div>
          )}

          {activeTab === "assignments" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-gray-600">{stats.assignmentCount} assignments ({stats.homeworkCount} homework)</p>
                <Link
                  href={`/dashboard/superadmin/assignments?classId=${classId}`}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  ➕ Create Assignment
                </Link>
              </div>
              {assignments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No assignments for this class yet.</p>
              ) : (
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {assignments.map((a) => (
                      <tr key={a.id}>
                        <td className="px-4 py-3">{a.title}</td>
                        <td className="px-4 py-3 text-gray-500">{a.type || "—"}</td>
                        <td className="px-4 py-3 text-gray-500">
                          {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "grades" && (
            <div className="space-y-4">
              <p className="text-gray-600">Exams and class performance.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.examCount}</p>
                  <p className="text-sm text-gray-600">Exams</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.averageAttendance}%</p>
                  <p className="text-sm text-gray-600">Avg Attendance</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{stats.studentsAtRisk}</p>
                  <p className="text-sm text-gray-600">Needs Attention</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">{stats.completionRate}%</p>
                  <p className="text-sm text-gray-600">Session Progress</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {markSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-1">Mark attendance</h2>
            <p className="text-sm text-gray-500 mb-4">
              {markSession.topic || "Session"} ·{" "}
              {markSession.sessionDate
                ? new Date(markSession.sessionDate).toLocaleDateString()
                : "—"}
            </p>
            <form onSubmit={handleSaveAttendance} className="space-y-4">
              <div className="divide-y border rounded-lg max-h-64 overflow-y-auto">
                {students.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <span className="text-sm font-medium truncate">{s.fullname}</span>
                    <select
                      value={attendanceMarks[s.id] || "ABSENT"}
                      onChange={(e) =>
                        setAttendanceMarks({ ...attendanceMarks, [s.id]: e.target.value })
                      }
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="PRESENT">Present</option>
                      <option value="LATE">Late</option>
                      <option value="EXCUSED">Excused</option>
                      <option value="ABSENT">Absent</option>
                    </select>
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={markSessionComplete}
                  onChange={(e) => setMarkSessionComplete(e.target.checked)}
                />
                Mark session as completed (syncs to payroll attendance)
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMarkSession(null)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAttendance || students.length === 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
                >
                  {savingAttendance ? "Saving…" : "Save attendance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSessionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add class session</h2>
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={sessionForm.sessionDate}
                  onChange={(e) => setSessionForm({ ...sessionForm, sessionDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
                  <input
                    type="time"
                    required
                    value={sessionForm.startTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
                  <input
                    type="time"
                    required
                    value={sessionForm.endTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                <input
                  type="text"
                  required
                  value={sessionForm.topic}
                  onChange={(e) => setSessionForm({ ...sessionForm, topic: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Lesson topic"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSession}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
                >
                  {savingSession ? "Saving…" : "Create session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
