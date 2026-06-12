"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { apiFetch } from "../../../../lib/api";

interface AttendanceRecord {
  id: string;
  studentName: string;
  class: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
}

export default function CenterAdminAttendance() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, selectedClass]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      let centerId = "";
      const userData = Cookies.get("userData");
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          if (parsed?.centerId) centerId = String(parsed.centerId);
        } catch {
          /* ignore */
        }
      }
      if (!centerId) {
        setAttendance([]);
        return;
      }
      const data = await apiFetch(
        `/api/attendance?centerId=${encodeURIComponent(centerId)}&date=${encodeURIComponent(selectedDate)}&class=${encodeURIComponent(selectedClass)}`
      );
      setAttendance(data.content || data || []);
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: AttendanceRecord["status"]) => {
    setAttendance(prev => 
      prev.map(record => 
        record.id === id ? { ...record, status: newStatus } : record
      )
    );
    // API call would go here
  };

  const filteredAttendance = attendance.filter(record =>
    record.studentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    present: attendance.filter(r => r.status === "present").length,
    absent: attendance.filter(r => r.status === "absent").length,
    late: attendance.filter(r => r.status === "late").length,
    excused: attendance.filter(r => r.status === "excused").length,
  };

  const getStatusBadge = (status: AttendanceRecord["status"]) => {
    const styles = {
      present: "bg-green-100 text-green-800",
      absent: "bg-red-100 text-red-800",
      late: "bg-yellow-100 text-yellow-800",
      excused: "bg-blue-100 text-blue-800",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
        <p className="text-gray-600 mt-2">Track and manage student attendance for your center</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-2xl font-bold text-green-600">{stats.present}</div>
          <div className="text-sm text-green-700">Present</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
          <div className="text-sm text-red-700">Absent</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
          <div className="text-sm text-yellow-700">Late</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{stats.excused}</div>
          <div className="text-sm text-blue-700">Excused</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Classes</option>
              <option value="english-101">English 101</option>
              <option value="english-102">English 102</option>
              <option value="english-103">English 103</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by student name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchAttendance}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">Loading...</td>
              </tr>
            ) : filteredAttendance.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">No attendance records found</td>
              </tr>
            ) : (
              filteredAttendance.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{record.studentName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{record.class}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(record.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{record.checkInTime || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{record.checkOutTime || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{record.notes || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={record.status}
                      onChange={(e) => updateStatus(record.id, e.target.value as AttendanceRecord["status"])}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                      <option value="excused">Excused</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
