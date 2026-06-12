"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "../../../../lib/api";
import {
  ensureClassSession,
  loadScopedClasses,
  loadSessionAttendanceMarks,
  resolveMyTeacherId,
  saveSessionAttendance,
} from "../../../../lib/teacher-context";

interface Student {
  id: string;
  fullname: string;
  studentCode: string;
}

interface Class {
  id: string;
  className: string;
}

interface AttendanceRecord {
  studentId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  notes: string;
}

export default function TAAttendancePage() {
  const searchParams = useSearchParams();
  const classIdParam = searchParams?.get("classId");
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(classIdParam || "");
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [markComplete, setMarkComplete] = useState(false);
  const [teacherEntityId, setTeacherEntityId] = useState("");

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId && attendanceDate) {
      fetchStudents(selectedClassId, attendanceDate);
    }
  }, [selectedClassId, attendanceDate]);

  const fetchClasses = async () => {
    try {
      const entityId = await resolveMyTeacherId();
      setTeacherEntityId(entityId || "");
      if (!entityId) {
        setError("No teaching assistant profile linked to your account.");
        setClasses([]);
        return;
      }
      const mapped = await loadScopedClasses("ta", entityId);
      setClasses(
        mapped.map((c) => ({
          id: c.id,
          className: c.className,
        }))
      );
      if (!selectedClassId && mapped.length > 0) {
        setSelectedClassId(classIdParam || mapped[0].id);
      }
    } catch (err) {
      setClasses([]);
      console.error("Error fetching classes:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (classId: string, date: string) => {
    try {
      setLoading(true);
      setError("");
      const enrollments = await apiFetch(`/api/enrollments?classId=${classId}`).catch(() => []);
      const studentIds = Array.isArray(enrollments)
        ? enrollments.map((e: { studentId?: string }) => e.studentId).filter((id): id is string => Boolean(id))
        : [];
      const studentsData = await Promise.all(
        studentIds.map(async (id: string) => apiFetch(`/api/students/${id}`).catch(() => null))
      );
      const valid = studentsData.filter(Boolean) as { id: string; fullname?: string; studentCode?: string }[];
      setStudents(
        valid.map((s) => ({
          id: s.id,
          fullname: s.fullname || "Unknown",
          studentCode: s.studentCode || "",
        }))
      );

      const session = await ensureClassSession(classId, date, teacherEntityId || undefined);
      const marks = await loadSessionAttendanceMarks(
        session.id,
        valid.map((s) => s.id)
      );
      const records: Record<string, AttendanceRecord> = {};
      valid.forEach((student) => {
        records[student.id] = {
          studentId: student.id,
          status: (marks[student.id] as AttendanceRecord["status"]) || "PRESENT",
          notes: "",
        };
      });
      setAttendanceRecords(records);
      setMarkComplete(session.status === "COMPLETED");
    } catch (err) {
      setError("Error loading students");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateAttendance = (studentId: string, status: AttendanceRecord["status"]) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const updateNotes = (studentId: string, notes: string) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) {
      setError("Please select a class");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const session = await ensureClassSession(
        selectedClassId,
        attendanceDate,
        teacherEntityId || undefined
      );
      await saveSessionAttendance(
        session,
        selectedClassId,
        Object.values(attendanceRecords).map((r) => ({
          studentId: r.studentId,
          status: r.status,
        })),
        markComplete
      );
      setSuccess(
        markComplete
          ? "Attendance saved and session marked complete."
          : "Attendance saved successfully!"
      );
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Error saving attendance");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const markAllPresent = () => {
    const updated: Record<string, AttendanceRecord> = {};
    students.forEach((student) => {
      updated[student.id] = {
        studentId: student.id,
        status: "PRESENT",
        notes: attendanceRecords[student.id]?.notes || "",
      };
    });
    setAttendanceRecords(updated);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PRESENT: "bg-green-500",
      ABSENT: "bg-red-500",
      LATE: "bg-yellow-500",
      EXCUSED: "bg-blue-500",
    };
    return colors[status] || "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/ta" className="hover:text-blue-600">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-gray-900">Mark Attendance</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">✅ Mark Attendance</h1>
          <p className="text-gray-500 mt-1">Record student attendance for your assigned classes</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Class Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Class *
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a class...</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.className}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date *
            </label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Attendance List */}
      {selectedClassId && students.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Student Attendance ({students.length} students)
              </h2>
              <button
                type="button"
                onClick={markAllPresent}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
              >
                Mark All Present
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="divide-y divide-gray-200">
              {students.map((student) => (
                <div key={student.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{student.fullname}</div>
                      <div className="text-sm text-gray-500">{student.studentCode}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      {(["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => updateAttendance(student.id, status)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            attendanceRecords[student.id]?.status === status
                              ? `${getStatusColor(status)} text-white`
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {attendanceRecords[student.id]?.status !== "PRESENT" && (
                    <div className="mt-3">
                      <input
                        type="text"
                        placeholder="Add notes (optional)..."
                        value={attendanceRecords[student.id]?.notes || ""}
                        onChange={(e) => updateNotes(student.id, e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 space-y-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={markComplete}
                  onChange={(e) => setMarkComplete(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Mark session complete (syncs to payroll when enabled)
              </label>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Summary:</span>{" "}
                  {Object.values(attendanceRecords).filter((r) => r.status === "PRESENT").length} Present,{" "}
                  {Object.values(attendanceRecords).filter((r) => r.status === "ABSENT").length} Absent,{" "}
                  {Object.values(attendanceRecords).filter((r) => r.status === "LATE").length} Late,{" "}
                  {Object.values(attendanceRecords).filter((r) => r.status === "EXCUSED").length} Excused
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {saving ? "Saving..." : "Save Attendance"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {selectedClassId && students.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Students Enrolled</h3>
          <p className="text-gray-500">This class doesn't have any enrolled students yet.</p>
        </div>
      )}

      {!selectedClassId && !loading && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Class</h3>
          <p className="text-gray-500">Choose a class above to start marking attendance.</p>
        </div>
      )}
    </div>
  );
}
