"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loadMyChildren } from "../../../../lib/parent-context";
import { loadAttendanceRecordsForStudent } from "../../../../lib/student-context";

interface Child {
  id: string;
  fullname: string;
  studentCode: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  className: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  notes: string;
}

export default function ParentAttendancePage() {
  const searchParams = useSearchParams();
  const studentIdParam = searchParams?.get("studentId");

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState(studentIdParam || "");
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChildId) fetchAttendance(selectedChildId);
  }, [selectedChildId]);

  const fetchChildren = async () => {
    try {
      const rows = await loadMyChildren();
      const mappedChildren = rows.map((s) => ({
        id: s.id,
        fullname: s.fullname || "Unknown",
        studentCode: s.studentCode || "",
      }));
      setChildren(mappedChildren);
      if (!selectedChildId && mappedChildren.length > 0) {
        setSelectedChildId(mappedChildren[0].id);
      }
    } catch (err) {
      console.error(err);
      setChildren([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async (studentId: string) => {
    try {
      setLoading(true);
      setAttendance(await loadAttendanceRecordsForStudent(studentId));
    } catch (err) {
      console.error(err);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PRESENT: "bg-green-100 text-green-800",
      ABSENT: "bg-red-100 text-red-800",
      LATE: "bg-yellow-100 text-yellow-800",
      EXCUSED: "bg-blue-100 text-blue-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const totalDays = attendance.length;
  const presentDays = attendance.filter((a) => a.status === "PRESENT").length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/parent" className="hover:text-blue-600">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-900">Attendance</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">✅ Child Attendance</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Child</label>
        <select value={selectedChildId} onChange={(e) => setSelectedChildId(e.target.value)} className="w-full md:w-1/2 px-4 py-2 border rounded-lg">
          <option value="">Choose a child...</option>
          {children.map((child) => (<option key={child.id} value={child.id}>{child.fullname} ({child.studentCode})</option>))}
        </select>
      </div>

      {selectedChildId && attendance.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500 mb-1">Attendance Rate</div>
              <div className="text-2xl font-bold text-green-600">{attendanceRate}%</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500 mb-1">Present</div>
              <div className="text-2xl font-bold text-green-600">{presentDays}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500 mb-1">Absent</div>
              <div className="text-2xl font-bold text-red-600">{attendance.filter((a) => a.status === "ABSENT").length}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500 mb-1">Late</div>
              <div className="text-2xl font-bold text-yellow-600">{attendance.filter((a) => a.status === "LATE").length}</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {attendance.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(record.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{record.className}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(record.status)}`}>{record.status}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selectedChildId && attendance.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold mb-2">No Attendance Records</h3>
          <p className="text-gray-500">No attendance data found for this child.</p>
        </div>
      )}
    </div>
  );
}
