"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { exportToCsv, datedFilename } from "@/lib/export-csv";

interface User {
  id: string;
  email: string;
  fullname: string;
  roleName: string;
  departmentName?: string;
  employeeCode?: string;
}

/**
 * There is no staff time-clock in this system. This page used to read /api/attendance, which is
 * the STUDENT register — its rows carry sessionId/studentId and have no userId, no date, no
 * hoursWorked. Since the page also excludes students from its own user list, it was looking for
 * staff in a table of students, and `new Date(record.date)` was an Invalid Date, so the month
 * filter rejected every row: the register was permanently empty and every tile read 0.
 *
 * What does exist for staff is teacher_sessions — the taught sessions payroll already bills from
 * (sessionDate, startTime, endTime, durationHours). That is what this page now shows, for the
 * teachers who have them; for everyone else it says so rather than showing an empty grid.
 */
interface AttendanceRecord {
  id: string;
  teacherId?: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: string;
  hoursWorked?: number;
  notes?: string;
}

/** What a teaching session can actually tell us: it was held, cancelled, or not shown up to. */
interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  cancelledSessions: number;
  noShowSessions: number;
  totalHours: number;
  averageCheckIn: string;
  averageCheckOut: string;
}

export default function AttendancePage() {
  // Get userId from URL using window.location instead of useSearchParams
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setUserId(params.get("userId"));
    }
  }, []);
  
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [teacherIdByUserId, setTeacherIdByUserId] = useState<Map<string, string>>(new Map());
  const [noStaffRecord, setNoStaffRecord] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    fetchUsers();
    fetchTeacherIndex();
  }, []);

  useEffect(() => {
    if (userId && users.length > 0) {
      const user = users.find(u => u.id === userId);
      if (user) {
        setSelectedUser(user);
      }
    }
  }, [userId, users]);

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser, selectedYear, selectedMonth, teacherIdByUserId]);

  const fetchUsers = async () => {
    try {
      const data = await apiFetch("/api/users");
      const allUsers = Array.isArray(data) ? data : [];
      
      // Filter to only show employees/staff who should have attendance tracked
      // Exclude CEO, CHAIRMAN, SUPER_ADMIN, PARENT, STUDENT roles from this list
      const excludedRoles = ['CEO', 'CHAIRMAN', 'SUPER_ADMIN', 'PARENT', 'STUDENT', 'DIRECTOR'];
      const filteredUsers = allUsers.filter((user: User) => {
        const roleName = (user.roleName || '').toUpperCase();
        return !excludedRoles.some(role => roleName.includes(role));
      });
      
      setUsers(filteredUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * teacher_sessions.teacherId is a teachers.id, NOT a users.id — the same distinction payroll
   * keeps with its own user-to-teacher map. This page picks a USER, so the two must be joined
   * before anything can be looked up.
   */
  const fetchTeacherIndex = async () => {
    try {
      const data = await apiFetch("/api/teachers");
      const list = Array.isArray(data) ? data : [];
      setTeacherIdByUserId(
        new Map(list.filter((t: any) => t.userId).map((t: any) => [String(t.userId), String(t.id)]))
      );
    } catch (err) {
      console.error("Error fetching teachers:", err);
      setTeacherIdByUserId(new Map());
    }
  };

  const toRecord = (session: any): AttendanceRecord => ({
    id: session.id,
    teacherId: session.teacherId,
    date: session.sessionDate,
    checkInTime: session.startTime,
    checkOutTime: session.endTime,
    status: session.status || "COMPLETED",
    hoursWorked: session.durationHours != null ? Number(session.durationHours) : undefined,
    notes: session.notes,
  });

  const loadSessions = async () => {
    if (!selectedUser) {
      setAttendance([]);
      setSummary(null);
      setNoStaffRecord(null);
      return;
    }

    const teacherEntityId = teacherIdByUserId.get(String(selectedUser.id));
    if (!teacherEntityId) {
      // Not a teaching role, so nothing is recorded: there is no staff time-clock in this system,
      // and payroll pays these roles from their contracted hours rather than from anything logged.
      setAttendance([]);
      setSummary(null);
      setNoStaffRecord(
        `${selectedUser.fullname || selectedUser.email} has no teaching sessions recorded. ` +
        `Hours are only tracked for teaching roles; there is no staff time-clock, and other ` +
        `roles are paid from their contracted hours.`
      );
      return;
    }

    setNoStaffRecord(null);
    setLoadingAttendance(true);
    try {
      const data = await apiFetch(
        `/api/teacher-sessions?teacherId=${encodeURIComponent(teacherEntityId)}`
      );
      const sessions = (Array.isArray(data) ? data : []).map(toRecord);
      const forMonth = sessions.filter((r) => {
        if (!r.date) return false;
        const d = new Date(r.date);
        if (Number.isNaN(d.getTime())) return false;
        return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
      });
      setAllAttendance(sessions);
      setAttendance(forMonth);
      calculateSummary(forMonth);
    } catch (err) {
      console.error("Error fetching teaching sessions:", err);
      setAllAttendance([]);
      setAttendance([]);
      setSummary(null);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const calculateSummary = (records: AttendanceRecord[]) => {
    // Session statuses are SCHEDULED / COMPLETED / CANCELLED / NO_SHOW. There is no "late" or
    // "early leave" for a taught session, and counting them produced three tiles permanently at 0.
    const presentDays = records.filter(r => r.status === "COMPLETED").length;
    const cancelledSessions = records.filter(r => r.status === "CANCELLED").length;
    const noShowSessions = records.filter(r => r.status === "NO_SHOW").length;
    // Teaching sessions record a duration; there is no overtime store for staff.
    const totalHours = records.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);

    // Calculate average check-in/out times
    const checkIns = records.filter(r => r.checkInTime).map(r => r.checkInTime!);
    const checkOuts = records.filter(r => r.checkOutTime).map(r => r.checkOutTime!);

    setSummary({
      totalDays: records.length,
      presentDays,
      cancelledSessions,
      noShowSessions,
      totalHours,
      averageCheckIn: checkIns.length > 0 ? checkIns[0] : "N/A",
      averageCheckOut: checkOuts.length > 0 ? checkOuts[0] : "N/A"
    });
  };

  // "Mark Attendance" used to POST {userId, date, checkInTime, checkOutTime, status, notes} to
  // /api/attendance. That is the STUDENT register and has none of those fields, but student_id is
  // nullable, so the row saved — belonging to no student and no session — and the page announced
  // "✅ Attendance marked successfully!". Those orphans then counted towards student attendance
  // figures. The backend now refuses them, and the action is gone from here because there is no
  // staff attendance store to write to: teaching sessions are recorded by the class register.

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PRESENT":
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "ABSENT":
        return "bg-red-100 text-red-800";
      case "LATE":
        return "bg-yellow-100 text-yellow-800";
      case "EARLY_LEAVE":
        return "bg-orange-100 text-orange-800";
      case "HALF_DAY":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PRESENT":
      case "COMPLETED":
        return "✅";
      case "ABSENT": return "❌";
      case "LATE": return "⏰";
      case "EARLY_LEAVE": return "🏃";
      case "HALF_DAY": return "½";
      default: return "❓";
    }
  };

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  /** Share of this month's sessions that were actually taught. */
  const calculateAttendancePercentage = () => {
    if (!summary || summary.totalDays === 0) return 0;
    return Math.round((summary.presentDays / summary.totalDays) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] overflow-y-auto pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sticky top-0 bg-gray-50 z-10 pb-4 pt-2">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/superadmin" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">Attendance Management</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">📋 Attendance Management</h1>
          <p className="text-gray-500">Track and manage employee attendance records</p>
        </div>
        <button
          onClick={loadSessions}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          🔄 Refresh Data
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Employee</label>
            <select
              value={selectedUser?.id || ""}
              onChange={(e) => {
                const user = users.find(u => u.id === e.target.value);
                setSelectedUser(user || null);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">-- Select an employee --</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullname || user.email} ({user.roleName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">View Mode</label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode("daily")}
                className={`px-4 py-2 ${viewMode === "daily" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                📅 Daily
              </button>
              <button
                onClick={() => setViewMode("weekly")}
                className={`px-4 py-2 ${viewMode === "weekly" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                📊 Weekly
              </button>
              <button
                onClick={() => setViewMode("monthly")}
                className={`px-4 py-2 ${viewMode === "monthly" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                📈 Monthly
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {months.map((month, index) => (
                <option key={index} value={index + 1}>{month}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Employee Info Card */}
      {selectedUser && (
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-4xl">
              {selectedUser.fullname?.charAt(0) || "👤"}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{selectedUser.fullname || selectedUser.email}</h2>
              <p className="opacity-90">{selectedUser.roleName} • {selectedUser.departmentName || "No Department"}</p>
              <p className="opacity-75 text-sm">Employee Code: {selectedUser.employeeCode || "N/A"}</p>
            </div>
            <div className="text-center bg-white/10 rounded-lg p-4">
              <p className="text-4xl font-bold">{calculateAttendancePercentage()}%</p>
              <p className="text-sm opacity-75">Attendance Rate</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {selectedUser && summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{summary.totalDays}</p>
            <p className="text-xs text-gray-500">Sessions</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{summary.presentDays}</p>
            <p className="text-xs text-gray-500">Taught</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{summary.noShowSessions}</p>
            <p className="text-xs text-gray-500">No Show</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-3xl font-bold text-yellow-600">{summary.cancelledSessions}</p>
            <p className="text-xs text-gray-500">Cancelled</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{summary.totalHours.toFixed(1)}h</p>
            <p className="text-xs text-gray-500">Hours Taught</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-xl font-bold text-gray-900">{summary.averageCheckIn}</p>
            <p className="text-xs text-gray-500">Avg Check-in</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-xl font-bold text-gray-900">{summary.averageCheckOut}</p>
            <p className="text-xs text-gray-500">Avg Check-out</p>
          </div>
        </div>
      )}

      {/* Attendance Records Table */}
      {selectedUser && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Attendance Records - {months[selectedMonth - 1]} {selectedYear}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    exportToCsv(
                      datedFilename(`attendance-${selectedUser?.fullname || selectedUser?.email || "report"}`),
                      attendance,
                      [
                        { key: "date", label: "Date" },
                        { key: (r) => getDayName(r.date), label: "Day" },
                        { key: (r) => r.checkInTime || "", label: "Check In" },
                        { key: (r) => r.checkOutTime || "", label: "Check Out" },
                        { key: (r) => r.hoursWorked ?? 0, label: "Hours" },
                        { key: "status", label: "Status" },
                        { key: (r) => r.notes || "", label: "Notes" },
                      ]
                    )
                  }
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
                >
                  📥 Export
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  🖨️ Print Report
                </button>
              </div>
            </div>
          </div>

          {loadingAttendance ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : attendance.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-6xl mb-4">📭</div>
              {noStaffRecord ? (
                <>
                  <h4 className="text-lg font-medium mb-2">No Hours Tracked For This Role</h4>
                  <p className="text-sm max-w-xl mx-auto">{noStaffRecord}</p>
                </>
              ) : (
                <>
                  <h4 className="text-lg font-medium mb-2">No Sessions In This Period</h4>
                  <p className="text-sm">
                    No teaching sessions were recorded for this teacher in {months[selectedMonth - 1]}{" "}
                    {selectedYear}.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overtime</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendance.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getDayName(record.date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.checkInTime || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.checkOutTime || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.hoursWorked || 0}h</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                        {record.hoursWorked ? `${record.hoursWorked}h` : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                          {getStatusIcon(record.status)} {record.status?.replace("_", " ") || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.notes || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Calendar View (Monthly) */}
      {selectedUser && viewMode === "monthly" && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📆 Calendar View</h3>
          <div className="grid grid-cols-7 gap-2 max-h-[400px] overflow-y-auto">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2 sticky top-0 bg-white">
                {day}
              </div>
            ))}
            {(() => {
              const firstDay = new Date(selectedYear, selectedMonth - 1, 1).getDay();
              const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
              const cells = [];
              
              for (let i = 0; i < firstDay; i++) {
                cells.push(<div key={`empty-${i}`} className="aspect-square"></div>);
              }
              
              for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const record = attendance.find(r => r.date === dateStr);
                const isToday = dateStr === new Date().toISOString().substring(0, 10);
                const dayOfWeek = new Date(selectedYear, selectedMonth - 1, day).getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                
                cells.push(
                  <div 
                    key={day} 
                    className={`aspect-square p-2 rounded-lg border text-center flex flex-col items-center justify-center
                      ${isToday ? "border-blue-500 border-2" : "border-gray-200"}
                      ${isWeekend ? "bg-gray-50 text-gray-400" : "bg-white"}
                      ${record ? getStatusColor(record.status) : ""}`}
                  >
                    <span className={`text-sm font-medium ${isToday ? "text-blue-600" : ""}`}>{day}</span>
                    {record && <span className="text-lg">{getStatusIcon(record.status)}</span>}
                    {isWeekend && !record && <span className="text-xs">Off</span>}
                  </div>
                );
              }
              
              return cells;
            })()}
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-green-100"></span>
              <span className="text-sm text-gray-600">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-red-100"></span>
              <span className="text-sm text-gray-600">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-yellow-100"></span>
              <span className="text-sm text-gray-600">Late</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-orange-100"></span>
              <span className="text-sm text-gray-600">Early Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-gray-50 border"></span>
              <span className="text-sm text-gray-600">Weekend</span>
            </div>
          </div>
        </div>
      )}

      {/* No User Selected */}
      {!selectedUser && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">👆</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Select an Employee</h3>
          <p className="text-gray-500">Choose an employee from the dropdown above to view their attendance records</p>
        </div>
      )}

      {/* All Attendance Records Overview */}
      {allAttendance.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">📋 All Attendance Records ({allAttendance.length})</h3>
          </div>
          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allAttendance.slice(0, 50).map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                    // sessions carry a teachers.id; map back to the user this page selects by
                    const userId = Array.from(teacherIdByUserId.entries())
                      .find(([, teacherId]) => teacherId === String(record.teacherId))?.[0];
                    const user = users.find(u => u.id === userId);
                    if (user) setSelectedUser(user);
                  }}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(record.teacherId || "N/A").substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.checkInTime || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.checkOutTime || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {getStatusIcon(record.status)} {record.status || "N/A"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
