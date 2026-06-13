"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { getAuthUserIdFromCookie } from "../../../../lib/auth-context";

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE" | "PENDING";
  leaveType?: string;
  leaveReason?: string;
  approvedBy?: string;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  notes?: string;
}

interface LeaveRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  appliedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  remarks?: string;
}

interface UserData {
  id: string;
  fullname: string;
  email: string;
  role: string;
}

export default function StaffAttendancePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  
  // Modals
  const [showMarkAttendanceModal, setShowMarkAttendanceModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showLeaveHistoryModal, setShowLeaveHistoryModal] = useState(false);
  
  // Form states
  const [attendanceForm, setAttendanceForm] = useState({
    checkIn: "09:00",
    checkOut: "18:00",
    status: "PRESENT" as "PRESENT" | "HALF_DAY",
    notes: ""
  });
  
  const [leaveForm, setLeaveForm] = useState({
    startDate: "",
    endDate: "",
    leaveType: "CASUAL",
    reason: "",
    isAdvanceLeave: false
  });
  
  // Leave balance state
  const [leaveBalance, setLeaveBalance] = useState<{
    totalAvailable: number;
    totalUsedThisYear: number;
    monthlyAccrualRate: number;
    isPermanent: boolean;
  } | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Get user data from cookies
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userDataCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("userData="));
      if (userDataCookie) {
        try {
          const decoded = decodeURIComponent(userDataCookie.split("=")[1]);
          setUserData(JSON.parse(decoded));
        } catch (e) {
          console.error("Error parsing user data:", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
    fetchLeaveRequests();
    fetchLeaveBalance();
  }, [currentDate]);

  const fetchLeaveBalance = async () => {
    try {
      if (!userData?.id) return;
      // Uses /api/leaves/balance/{userId} endpoint
      const data = await apiFetch(`/api/leaves/balance/${userData.id}`).catch(() => null);
      if (data) {
        setLeaveBalance({
          totalAvailable: data.totalAvailable || 0,
          totalUsedThisYear: data.totalUsedThisYear || 0,
          monthlyAccrualRate: data.monthlyAccrualRate || 1,
          isPermanent: data.isPermanent !== false // Default to true if not specified
        });
      }
    } catch (err) {
      console.error("Error fetching leave balance:", err);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const userId = userData?.id || getAuthUserIdFromCookie();
      if (!userId) {
        setAttendance([]);
        return;
      }

      const data = await apiFetch(
        `/api/attendance?markedBy=${encodeURIComponent(userId)}`
      ).catch(() => []);
      const rows = Array.isArray(data) ? data : [];
      const userAttendance = rows.filter((a: { createdAt?: string; checkInTime?: string }) => {
        const raw = a.checkInTime || a.createdAt;
        if (!raw) return true;
        const d = new Date(raw);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });
      setAttendance(
        userAttendance.map((a: Record<string, unknown>) => ({
          id: String(a.id),
          userId: String(a.markedBy ?? a.studentId ?? userId),
          date: String(
            a.date ??
              (a.checkInTime ? String(a.checkInTime).slice(0, 10) : new Date().toISOString().split("T")[0])
          ),
          checkInTime: a.checkInTime ? String(a.checkInTime).slice(11, 16) : undefined,
          checkOutTime: a.checkOutTime ? String(a.checkOutTime).slice(11, 16) : undefined,
          status: (String(a.status ?? "PRESENT") as AttendanceRecord["status"]),
          approvalStatus: "APPROVED" as const,
          notes: String(a.notes ?? ""),
        }))
      );
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const data = await apiFetch("/api/leaves/all").catch(() => []);
      const userLeaves = Array.isArray(data) 
        ? data.filter((l: any) => l.userId === userData?.id)
        : [];
      setLeaveRequests(userLeaves);
    } catch (err) {
      console.error("Error fetching leave requests:", err);
      setLeaveRequests([]);
    }
  };

  // Calendar helpers
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month + 1, 0).getDate();
  }, [currentDate]);

  const firstDayOfMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month, 1).getDay();
  }, [currentDate]);

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    
    // Add empty slots for days before first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  }, [daysInMonth, firstDayOfMonth]);

  const getAttendanceForDate = (day: number): AttendanceRecord | undefined => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return attendance.find(a => a.date === dateStr);
  };

  const getStatusColor = (status: string, approvalStatus?: string) => {
    if (approvalStatus === "PENDING") {
      return "bg-yellow-100 border-yellow-400 text-yellow-800";
    }
    if (approvalStatus === "REJECTED") {
      return "bg-red-100 border-red-400 text-red-800";
    }
    
    switch (status) {
      case "PRESENT":
        return "bg-green-100 border-green-400 text-green-800";
      case "ABSENT":
        return "bg-red-100 border-red-400 text-red-800";
      case "HALF_DAY":
        return "bg-orange-100 border-orange-400 text-orange-800";
      case "LEAVE":
        return "bg-blue-100 border-blue-400 text-blue-800";
      case "PENDING":
        return "bg-yellow-100 border-yellow-400 text-yellow-800";
      default:
        return "bg-gray-100 border-gray-300 text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PRESENT": return "✅";
      case "ABSENT": return "❌";
      case "HALF_DAY": return "🌓";
      case "LEAVE": return "🏖️";
      case "PENDING": return "⏳";
      default: return "📅";
    }
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Can only mark attendance for today or past dates
    if (clickedDate <= today) {
      setSelectedDate(clickedDate);
      const existing = getAttendanceForDate(day);
      if (!existing || existing.approvalStatus === "REJECTED") {
        setShowMarkAttendanceModal(true);
      }
    }
  };

  const handleMarkAttendance = async () => {
    if (!selectedDate) return;
    
    setSubmitting(true);
    setMessage({ type: "", text: "" });
    
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      await apiFetch("/api/attendance/mark", {
        method: "POST",
        body: JSON.stringify({
          date: dateStr,
          checkInTime: attendanceForm.checkIn,
          checkOutTime: attendanceForm.checkOut,
          status: attendanceForm.status,
          notes: attendanceForm.notes
        })
      });
      
      setMessage({ type: "success", text: "Attendance marked successfully! Pending approval." });
      
      // Add to local state
      const newRecord: AttendanceRecord = {
        id: `att-${dateStr}-new`,
        userId: userData?.id || "",
        date: dateStr,
        checkInTime: attendanceForm.checkIn,
        checkOutTime: attendanceForm.checkOut,
        status: attendanceForm.status,
        approvalStatus: "PENDING",
        notes: attendanceForm.notes
      };
      setAttendance(prev => [...prev, newRecord]);
      
      setTimeout(() => {
        setShowMarkAttendanceModal(false);
        setMessage({ type: "", text: "" });
      }, 1500);
    } catch (err) {
      setMessage({ type: "error", text: "Failed to mark attendance. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyLeave = async () => {
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      setMessage({ type: "error", text: "Please fill all required fields" });
      return;
    }
    
    setSubmitting(true);
    setMessage({ type: "", text: "" });
    
    try {
      await apiFetch("/api/leave/apply", {
        method: "POST",
        body: JSON.stringify(leaveForm)
      });
      
      setMessage({ type: "success", text: "Leave application submitted successfully!" });
      
      // Add to local state
      const newLeave: LeaveRequest = {
        id: `leave-${Date.now()}`,
        userId: userData?.id || "",
        ...leaveForm,
        status: "PENDING",
        appliedAt: new Date().toISOString()
      };
      setLeaveRequests(prev => [...prev, newLeave]);
      
      setTimeout(() => {
        setShowLeaveModal(false);
        setLeaveForm({ startDate: "", endDate: "", leaveType: "CASUAL", reason: "", isAdvanceLeave: false });
        setMessage({ type: "", text: "" });
      }, 1500);
    } catch (err) {
      setMessage({ type: "error", text: "Failed to submit leave application." });
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const present = attendance.filter(a => a.status === "PRESENT" && a.approvalStatus !== "REJECTED").length;
    const absent = attendance.filter(a => a.status === "ABSENT").length;
    const halfDays = attendance.filter(a => a.status === "HALF_DAY").length;
    const leaves = attendance.filter(a => a.status === "LEAVE").length;
    const pending = attendance.filter(a => a.approvalStatus === "PENDING").length;
    
    return { present, absent, halfDays, leaves, pending };
  }, [attendance]);

  const isWeekend = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return date.getDay() === 0 || date.getDay() === 6;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isFuture = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">My Attendance</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">📅 My Attendance</h1>
          <p className="text-gray-500">View your attendance and apply for leave</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowLeaveHistoryModal(true)}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            📋 Leave History
          </button>
          <button
            onClick={() => setShowLeaveModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            ✈️ Apply Leave
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">✅</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.present}</p>
              <p className="text-xs text-gray-500">Present</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-red-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-xl">❌</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.absent}</p>
              <p className="text-xs text-gray-500">Absent</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-orange-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-xl">🌓</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.halfDays}</p>
              <p className="text-xs text-gray-500">Half Days</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">🏖️</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.leaves}</p>
              <p className="text-xs text-gray-500">Leaves</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-yellow-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-xl">⏳</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateMonth("prev")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ◀️
          </button>
          <h2 className="text-xl font-bold text-gray-900">
            {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
          </h2>
          <button
            onClick={() => navigateMonth("next")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ▶️
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square"></div>;
              }

              const record = getAttendanceForDate(day);
              const weekend = isWeekend(day);
              const today = isToday(day);
              const future = isFuture(day);

              return (
                <div
                  key={day}
                  onClick={() => !weekend && !future && handleDateClick(day)}
                  className={`
                    aspect-square p-2 rounded-lg border-2 transition-all cursor-pointer
                    ${weekend ? "bg-gray-50 border-gray-200 cursor-not-allowed" : "hover:border-blue-400"}
                    ${today ? "ring-2 ring-blue-500 ring-offset-2" : ""}
                    ${future ? "opacity-50 cursor-not-allowed" : ""}
                    ${record ? getStatusColor(record.status, record.approvalStatus) : "border-gray-200 bg-white"}
                  `}
                >
                  <div className="flex flex-col h-full">
                    <span className={`text-sm font-medium ${weekend ? "text-gray-400" : today ? "text-blue-600" : "text-gray-700"}`}>
                      {day}
                    </span>
                    {record && (
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <span className="text-lg">{getStatusIcon(record.status)}</span>
                        {record.approvalStatus === "PENDING" && (
                          <span className="text-[10px] text-yellow-600 font-medium">Pending</span>
                        )}
                      </div>
                    )}
                    {weekend && (
                      <div className="flex-1 flex items-center justify-center">
                        <span className="text-xs text-gray-400">Weekend</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 border border-green-400"></div>
            <span className="text-sm text-gray-600">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-100 border border-red-400"></div>
            <span className="text-sm text-gray-600">Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-100 border border-orange-400"></div>
            <span className="text-sm text-gray-600">Half Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-100 border border-blue-400"></div>
            <span className="text-sm text-gray-600">Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-400"></div>
            <span className="text-sm text-gray-600">Pending Approval</span>
          </div>
        </div>
      </div>

      {/* Mark Attendance Modal */}
      {showMarkAttendanceModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Mark Attendance</h3>
              <button
                onClick={() => setShowMarkAttendanceModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-blue-800 font-medium">
                📅 {selectedDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>

            {message.text && (
              <div className={`mb-4 p-3 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {message.text}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={attendanceForm.status}
                  onChange={(e) => setAttendanceForm(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PRESENT">Present (Full Day)</option>
                  <option value="HALF_DAY">Half Day</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check In</label>
                  <input
                    type="time"
                    value={attendanceForm.checkIn}
                    onChange={(e) => setAttendanceForm(prev => ({ ...prev, checkIn: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check Out</label>
                  <input
                    type="time"
                    value={attendanceForm.checkOut}
                    onChange={(e) => setAttendanceForm(prev => ({ ...prev, checkOut: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={attendanceForm.notes}
                  onChange={(e) => setAttendanceForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowMarkAttendanceModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAttendance}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit for Approval"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">✈️ Apply for Leave</h3>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Leave Balance Info */}
            {leaveBalance && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">Available Leave Balance:</span>
                  <span className="font-bold text-blue-800">{leaveBalance.totalAvailable} days</span>
                </div>
                <div className="flex justify-between items-center text-xs text-blue-600 mt-1">
                  <span>Used this year: {leaveBalance.totalUsedThisYear} days</span>
                  <span>Monthly accrual: {leaveBalance.monthlyAccrualRate} day/month</span>
                </div>
                {!leaveBalance.isPermanent && (
                  <div className="mt-2 p-2 bg-yellow-100 rounded text-xs text-yellow-800">
                    ⚠️ Leave benefits are only for permanent employees
                  </div>
                )}
              </div>
            )}

            {message.text && (
              <div className={`mb-4 p-3 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {message.text}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm(prev => ({ ...prev, leaveType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CASUAL">Casual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="EARNED">Earned Leave</option>
                  <option value="MATERNITY">Maternity Leave</option>
                  <option value="PATERNITY">Paternity Leave</option>
                  <option value="UNPAID">Unpaid Leave</option>
                  <option value="COMPENSATORY">Compensatory Off</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm(prev => ({ ...prev, startDate: e.target.value }))}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm(prev => ({ ...prev, endDate: e.target.value }))}
                    min={leaveForm.startDate || new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <textarea
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Please provide the reason for your leave..."
                />
              </div>

              {/* Advance Leave Option - Only show if balance is low */}
              {leaveBalance && leaveBalance.totalAvailable < 3 && leaveBalance.isPermanent && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={leaveForm.isAdvanceLeave}
                      onChange={(e) => setLeaveForm(prev => ({ ...prev, isAdvanceLeave: e.target.checked }))}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-orange-800">
                      Apply as Advance Leave (borrow from future balance)
                    </span>
                  </label>
                  <p className="text-xs text-orange-600 mt-1 ml-6">
                    Maximum 3 days advance leave per year. Will be deducted from future accruals.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyLeave}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave History Modal */}
      {showLeaveHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">📋 Leave History</h3>
              <button
                onClick={() => setShowLeaveHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {leaveRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-4xl mb-2">📭</p>
                <p>No leave applications yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {leaveRequests.map(leave => (
                  <div key={leave.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          leave.status === "APPROVED" ? "bg-green-100 text-green-700" :
                          leave.status === "REJECTED" ? "bg-red-100 text-red-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {leave.status}
                        </span>
                        <p className="font-medium text-gray-900 mt-2">{leave.leaveType} Leave</p>
                        <p className="text-sm text-gray-500">
                          {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        Applied: {new Date(leave.appliedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{leave.reason}</p>
                    {leave.remarks && (
                      <p className="text-sm text-gray-500 mt-2 italic">Remarks: {leave.remarks}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={() => setShowLeaveHistoryModal(false)}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
