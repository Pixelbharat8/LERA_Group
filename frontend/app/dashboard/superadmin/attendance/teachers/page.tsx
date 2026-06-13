"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";

interface TeacherAttendance {
  id: string;
  teacherId: string;
  teacherName: string;
  date: string;
  checkInTime: string;
  checkOutTime: string;
  status: string;
  notes: string;
}

export default function TeacherAttendancePage() {
  const [attendance, setAttendance] = useState<TeacherAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      // Fetch all users first to get teachers
      let teachers: any[] = [];
      let usersMap: { [key: string]: any } = {};
      
      try {
        const users = await apiFetch("/api/users");
        const userList = Array.isArray(users) ? users : [];
        userList.forEach((u: any) => {
          usersMap[u.id] = u;
        });
        // Filter only teachers
        teachers = userList.filter((u: any) => u.roleName === "TEACHER");
      } catch (err) {
        console.error("Error fetching users:", err);
      }

      // Fetch attendance records from the attendance service
      let attendanceMap: { [key: string]: any } = {};
      
      try {
        const attendanceData = await apiFetch(`/api/attendance?date=${selectedDate}`);
        (Array.isArray(attendanceData) ? attendanceData : []).forEach((a: any) => {
          const date = a.date ? a.date.toString().substring(0, 10) : null;
          if (date === selectedDate) {
            attendanceMap[a.userId] = a;
          }
        });
      } catch (err) {
        console.error("Error fetching attendance:", err);
      }

      // Create attendance records for all teachers
      const attendanceRecords = teachers.map((teacher: any) => {
        const record = attendanceMap[teacher.id];
        return {
          id: record?.id || teacher.id,
          teacherId: teacher.id,
          teacherName: teacher.fullname || teacher.email,
          date: selectedDate,
          checkInTime: record?.checkInTime || null,
          checkOutTime: record?.checkOutTime || null,
          status: record?.status || "NOT_MARKED",
          notes: record?.notes || ""
        };
      });
      
      setAttendance(attendanceRecords);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (teacherId: string, status: string) => {
    try {
      await apiFetch("/api/attendance", {
        method: "POST",
        body: JSON.stringify({
          userId: teacherId,
          date: selectedDate,
          status: status,
          checkInTime: status === "PRESENT" || status === "LATE" ? new Date().toISOString() : null,
          notes: status === "LATE" ? "Marked late" : ""
        })
      });
      fetchAttendance();
    } catch (err) {
      console.error("Error marking attendance:", err);
      alert("Error marking attendance");
    }
  };

  const markAllPresent = async () => {
    try {
      const unmarked = attendance.filter(a => a.status === "NOT_MARKED");
      for (const record of unmarked) {
        await apiFetch("/api/attendance", {
          method: "POST",
          body: JSON.stringify({
            userId: record.teacherId,
            date: selectedDate,
            status: "PRESENT",
            checkInTime: new Date().toISOString()
          })
        });
      }
      fetchAttendance();
    } catch (err) {
      console.error("Error marking all present:", err);
    }
  };

  const filteredAttendance = attendance.filter(a => 
    filterStatus === "all" || a.status === filterStatus
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "PRESENT":
        return "bg-green-100 text-green-800";
      case "ABSENT":
        return "bg-red-100 text-red-800";
      case "LATE":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      case "NOT_MARKED":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/superadmin" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span>Attendance</span>
            <span>/</span>
            <span className="text-gray-900">Teacher Attendance</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">👨‍🏫 Teacher Attendance</h1>
          <p className="text-gray-500">Track daily teacher attendance and punctuality</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="LATE">Late</option>
              <option value="COMPLETED">Completed Session</option>
            </select>
          </div>

          <div className="flex-1"></div>

          <button
            onClick={markAllPresent}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            ✅ Mark All Present
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">👥</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{attendance.length}</p>
              <p className="text-sm text-gray-500">Total Records</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">✅</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {attendance.filter(a => a.status === "COMPLETED" || a.status === "PRESENT").length}
              </p>
              <p className="text-sm text-gray-500">Present</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-2xl">❌</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {attendance.filter(a => a.status === "ABSENT").length}
              </p>
              <p className="text-sm text-gray-500">Absent</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-2xl">⏰</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {attendance.filter(a => a.status === "LATE").length}
              </p>
              <p className="text-sm text-gray-500">Late</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Attendance Records - {selectedDate}</h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No attendance records found for {selectedDate}
                      <div className="mt-4">
                        <button
                          onClick={() => alert("Would open bulk attendance marking modal")}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          + Add Attendance Records
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                            {record.teacherName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{record.teacherName}</p>
                            <p className="text-xs text-gray-500">{record.teacherId.substring(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{record.date}</td>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.status === "NOT_MARKED" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => markAttendance(record.teacherId, "PRESENT")}
                              className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                            >
                              Present
                            </button>
                            <button
                              onClick={() => markAttendance(record.teacherId, "ABSENT")}
                              className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                            >
                              Absent
                            </button>
                            <button
                              onClick={() => markAttendance(record.teacherId, "LATE")}
                              className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs hover:bg-yellow-200"
                            >
                              Late
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => alert(`Edit attendance for ${record.teacherName}`)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-yellow-900 mb-3">📝 About Teacher Attendance</h3>
        <div className="text-sm text-yellow-800 space-y-2">
          <p>
            <strong>Teacher Attendance</strong> tracks daily attendance (check-in/check-out) for all teaching staff.
          </p>
          <p>
            This is different from <strong>Teaching Sessions</strong> which track actual class sessions taught.
          </p>
          <p className="mt-4">
            <strong>Features:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Mark daily attendance (Present/Absent/Late)</li>
            <li>Track check-in and check-out times</li>
            <li>Generate monthly attendance reports</li>
            <li>Calculate punctuality metrics</li>
            <li>Link to payroll deductions for absences</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
