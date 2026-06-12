"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../lib/api";
import { useUserCenter, buildCenterFilterUrl } from "../../hooks/useUserCenter";
import { useLanguage } from "../../context/LanguageContext";

interface AttendanceRecord {
  id: string;
  studentId: string;
  sessionId?: string;
  centerId?: string;
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
  markedBy?: string;
  createdAt?: string;
  // Enriched data
  studentName?: string;
  centerName?: string;
}

interface Student {
  id: string;
  fullname?: string;
  name?: string;
  centerId?: string;
}

interface Center {
  id: string;
  name: string;
}

interface ClassSession {
  id: string;
  name?: string;
  className?: string;
}

export default function AttendancePage() {
  const { centerId: userCenterId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const { t } = useLanguage();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<{[key: string]: Student}>({});
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedCenter, setSelectedCenter] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [markingForm, setMarkingForm] = useState({
    studentId: "",
    status: "PRESENT",
    notes: ""
  });

  useEffect(() => {
    if (!userLoading) {
      fetchData();
    }
  }, [selectedDate, userLoading, userCenterId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch attendance, students, and centers in parallel
      const attendanceUrl = shouldFilterByCenter 
        ? buildCenterFilterUrl("/api/attendance", userCenterId)
        : "/api/attendance";
      const studentsUrl = shouldFilterByCenter 
        ? buildCenterFilterUrl("/api/students", userCenterId)
        : "/api/students";
      
      const [attendanceData, studentsData, centersData] = await Promise.all([
        apiFetch(attendanceUrl).catch(() => []),
        apiFetch(studentsUrl).catch(() => []),
        apiFetch("/api/centers").catch(() => [])
      ]);
      
      // Build students map
      const studentsArr = Array.isArray(studentsData) ? studentsData : [];
      const studentsMap: {[key: string]: Student} = {};
      studentsArr.forEach((s: Student) => { studentsMap[s.id] = s; });
      setStudents(studentsMap);
      setStudentList(studentsArr);
      
      // Build centers array
      const centersArr = Array.isArray(centersData) ? centersData : [];
      setCenters(centersArr);
      
      // Enrich attendance records with names
      const recordsArr = Array.isArray(attendanceData) ? attendanceData : [];
      const enrichedRecords = recordsArr.map((r: any) => ({
        ...r,
        studentName: studentsMap[r.studentId]?.fullname || studentsMap[r.studentId]?.name || r.studentId?.substring(0, 8) + "...",
        centerName: centersArr.find((c: Center) => c.id === r.centerId)?.name || 
                    (studentsMap[r.studentId]?.centerId ? centersArr.find((c: Center) => c.id === studentsMap[r.studentId]?.centerId)?.name : null) || "N/A"
      }));
      
      setRecords(enrichedRecords);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load attendance");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async () => {
    if (!markingForm.studentId) {
      alert("Please select a student");
      return;
    }
    
    try {
      const payload = {
        studentId: markingForm.studentId,
        centerId: shouldFilterByCenter ? userCenterId : (students[markingForm.studentId]?.centerId || null),
        status: markingForm.status,
        notes: markingForm.notes || null,
        checkInTime: markingForm.status === "PRESENT" ? new Date().toISOString() : null
      };
      
      await apiFetch("/api/attendance", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      
      setShowMarkModal(false);
      setMarkingForm({ studentId: "", status: "PRESENT", notes: "" });
      await fetchData();
      alert("Attendance marked successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to mark attendance");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await apiFetch(`/api/attendance/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus })
      });
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to update attendance");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT": return "bg-green-100 text-green-800";
      case "ABSENT": return "bg-red-100 text-red-800";
      case "LATE": return "bg-yellow-100 text-yellow-800";
      case "EXCUSED": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Filter records by center and status
  const filteredRecords = records.filter(r => {
    if (selectedCenter !== "all" && r.centerId !== selectedCenter) return false;
    if (selectedStatus !== "all" && r.status !== selectedStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/superadmin" className="hover:text-blue-600">{t("dashboard")}</Link>
            <span>/</span>
            <span className="text-gray-900">{t("attendance")}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">📅 {t("attendanceDashboard")}</h1>
          <p className="text-gray-500">{t("attendanceOverview")}</p>
        </div>
        <button 
          onClick={() => setShowMarkModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          ➕ {t("markAttendance")}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">✅</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{filteredRecords.filter(r => r.status === "PRESENT").length}</p>
              <p className="text-sm text-gray-500">{t("presentToday")}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-2xl">❌</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{filteredRecords.filter(r => r.status === "ABSENT").length}</p>
              <p className="text-sm text-gray-500">{t("absentToday")}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-2xl">⏰</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{filteredRecords.filter(r => r.status === "LATE").length}</p>
              <p className="text-sm text-gray-500">{t("lateToday")}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">📋</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{filteredRecords.length}</p>
              <p className="text-sm text-gray-500">Total Records</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          {error} - The attendance service may not be running or have data yet.
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          {!shouldFilterByCenter && centers.length > 0 && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Center</label>
              <select
                value={selectedCenter}
                onChange={(e) => setSelectedCenter(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="all">All Centers</option>
                {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="LATE">Late</option>
              <option value="EXCUSED">Excused</option>
            </select>
          </div>
          <div className="flex-1"></div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Attendance Rate</p>
            <p className="text-lg font-bold text-green-600">
              {filteredRecords.length > 0 
                ? Math.round((filteredRecords.filter(r => r.status === "PRESENT" || r.status === "LATE").length / filteredRecords.length) * 100)
                : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Center</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No attendance records found. Click "Mark Attendance" to start!
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{record.studentName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{record.centerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 max-w-xs truncate">{record.notes || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={record.status}
                        onChange={(e) => handleUpdateStatus(record.id, e.target.value)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="PRESENT">Present</option>
                        <option value="ABSENT">Absent</option>
                        <option value="LATE">Late</option>
                        <option value="EXCUSED">Excused</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Mark Attendance Modal */}
      {showMarkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">{t("markAttendance")}</h2>
              <button onClick={() => setShowMarkModal(false)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>
            <div className="space-y-4 px-5 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t("student")} *</label>
                <select
                  value={markingForm.studentId}
                  onChange={(e) => setMarkingForm(prev => ({ ...prev, studentId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                >
                  <option value="">{t("selectStudent")}</option>
                  {studentList.map(s => (
                    <option key={s.id} value={s.id}>{s.fullname || s.name || s.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t("status")} *</label>
                <select
                  value={markingForm.status}
                  onChange={(e) => setMarkingForm(prev => ({ ...prev, status: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                >
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="LATE">Late</option>
                  <option value="EXCUSED">Excused</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t("notes")}</label>
                <textarea
                  value={markingForm.notes}
                  onChange={(e) => setMarkingForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  rows={2}
                  placeholder={t("optionalNotes")}
                />
              </div>
              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  onClick={() => setShowMarkModal(false)}
                  className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleMarkAttendance}
                  className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  {t("markAttendance")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
