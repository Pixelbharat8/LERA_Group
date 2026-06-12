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

export default function TeacherAttendancePage() {
  const searchParams = useSearchParams();
  const classIdParam = searchParams?.get("classId");
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(classIdParam || "");
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        setClasses([]);
        return;
      }
      const mapped = await loadScopedClasses("teacher", entityId);
      const list = mapped.map((c) => ({ id: c.id, className: c.className }));
      setClasses(list);
      if (list.length > 0 && !selectedClassId) {
        setSelectedClassId(classIdParam || list[0].id);
      }
    } catch (err) {
      console.error(err);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (classId: string, date: string) => {
    try {
      setLoading(true);
      const enrollments = await apiFetch(`/api/enrollments?classId=${classId}`).catch(() => []);
      const studentIds = Array.isArray(enrollments)
        ? enrollments.map((e: { studentId?: string }) => e.studentId).filter(Boolean)
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
      console.error(err);
      setStudents([]);
      setAttendanceRecords({});
    } finally {
      setLoading(false);
    }
  };

  const updateAttendance = (studentId: string, status: AttendanceRecord["status"]) => {
    setAttendanceRecords((prev) => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
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
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const markAllPresent = () => {
    const updated: Record<string, AttendanceRecord> = {};
    students.forEach((student) => {
      updated[student.id] = { studentId: student.id, status: "PRESENT", notes: attendanceRecords[student.id]?.notes || "" };
    });
    setAttendanceRecords(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/teacher" className="hover:text-blue-600">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-900">Take Attendance</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">✅ Take Attendance</h1>
      </div>

      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">{success}</div>}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Class *</label>
            <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="w-full px-4 py-2 border rounded-lg">
              <option value="">Choose a class...</option>
              {classes.map((cls) => (<option key={cls.id} value={cls.id}>{cls.className}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
            <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} max={new Date().toISOString().split("T")[0]} className="w-full px-4 py-2 border rounded-lg" />
          </div>
        </div>
      </div>

      {selectedClassId && students.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-xl font-semibold">Student Attendance ({students.length})</h2>
            <button onClick={markAllPresent} className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">Mark All Present</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="divide-y">
              {students.map((student) => (
                <div key={student.id} className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-medium">{student.fullname}</div>
                      <div className="text-sm text-gray-500">{student.studentCode}</div>
                    </div>
                    <div className="flex gap-2">
                      {(["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const).map((status) => (
                        <button key={status} type="button" onClick={() => updateAttendance(student.id, status)} className={`px-4 py-2 rounded-lg text-sm font-medium ${attendanceRecords[student.id]?.status === status ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}>{status}</button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-gray-50 border-t space-y-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={markComplete}
                  onChange={(e) => setMarkComplete(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Mark session complete (syncs to payroll when enabled)
              </label>
              <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">{saving ? "Saving..." : "Save Attendance"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
