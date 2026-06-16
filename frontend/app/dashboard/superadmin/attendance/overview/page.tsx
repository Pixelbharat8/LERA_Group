"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";

interface Center {
  id: string;
  name: string;
  location: string;
  adminName?: string;
}

interface StaffAttendanceSummary {
  centerId: string;
  centerName: string;
  totalStaff: number;
  presentToday: number;
  absentToday: number;
  onLeave: number;
  pendingApprovals: number;
}

interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  centerId: string;
  centerName: string;
  date: string;
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  approvalStatus: string;
}

interface LeaveOverview {
  pending: number;
  approved: number;
  rejected: number;
  onLeaveToday: number;
}

interface TrendData {
  date: string;
  present: number;
  absent: number;
  leave: number;
}

export default function ExecutiveAttendanceOverviewPage() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [summaries, setSummaries] = useState<StaffAttendanceSummary[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveOverview, setLeaveOverview] = useState<LeaveOverview>({ pending: 0, approved: 0, rejected: 0, onLeaveToday: 0 });
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCenter, setSelectedCenter] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month">("today");
  const [activeView, setActiveView] = useState<"overview" | "centers" | "pending">("overview");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch centers
      let centersData: Center[] = [];
      try {
        const data = await apiFetch("/api/centers");
        centersData = Array.isArray(data) ? data.map((c: any) => ({
          id: c.id,
          name: c.name,
          location: c.city || c.address,
          adminName: c.managerName || "Not Assigned"
        })) : [];
        setCenters(centersData);
      } catch (err) {
        console.error("Error fetching centers:", err);
        setCenters([]);
      }

      // Fetch all users to count staff per center
      let usersData: any[] = [];
      let usersMap: { [key: string]: any } = {};
      try {
        const data = await apiFetch("/api/users");
        usersData = Array.isArray(data) ? data : [];
        usersData.forEach(u => {
          usersMap[u.id] = u;
        });
      } catch (err) {
        console.error("Error fetching users:", err);
      }

      // Fetch attendance records
      let attendanceData: any[] = [];
      try {
        const data = await apiFetch("/api/attendance");
        attendanceData = Array.isArray(data) ? data : [];
      } catch (err) {
        console.error("Error fetching attendance:", err);
      }

      // Fetch leave records
      let leaveData: any[] = [];
      try {
        const data = await apiFetch("/api/leave/all");
        leaveData = Array.isArray(data) ? data : [];
      } catch (err) {
        console.error("Error fetching leave:", err);
      }

      // Calculate summaries per center
      const today = new Date().toISOString().split("T")[0];
      const summariesData: StaffAttendanceSummary[] = centersData.map(center => {
        const centerUsers = usersData.filter(u => u.centerId === center.id);
        const centerAttendance = attendanceData.filter(a => {
          const userId = a.userId || a.teacherId;
          const user = usersMap[userId];
          return user?.centerId === center.id && a.date === today;
        });
        const centerLeave = leaveData.filter(l => {
          const user = usersMap[l.userId];
          return user?.centerId === center.id;
        });

        return {
          centerId: center.id,
          centerName: center.name,
          totalStaff: centerUsers.length,
          presentToday: centerAttendance.filter(a => a.status === "PRESENT").length,
          absentToday: centerAttendance.filter(a => a.status === "ABSENT").length,
          onLeave: centerLeave.filter(l => l.status === "APPROVED" && new Date(l.startDate) <= new Date() && new Date(l.endDate) >= new Date()).length,
          pendingApprovals: centerAttendance.filter(a => a.approvalStatus === "PENDING").length + centerLeave.filter(l => l.status === "PENDING").length
        };
      });
      setSummaries(summariesData.length > 0 ? summariesData : [{
        centerId: centersData[0]?.id || "default",
        centerName: centersData[0]?.name || "All Centers",
        totalStaff: usersData.filter(u => ["TEACHER", "STAFF"].includes(u.roleName)).length,
        presentToday: attendanceData.filter(a => a.date === today && a.status === "PRESENT").length,
        absentToday: attendanceData.filter(a => a.date === today && a.status === "ABSENT").length,
        onLeave: leaveData.filter(l => l.status === "APPROVED").length,
        pendingApprovals: attendanceData.filter(a => a.approvalStatus === "PENDING").length + leaveData.filter(l => l.status === "PENDING").length
      }]);

      // Map attendance with user info
      const recentAtt = attendanceData.slice(0, 20).map(a => ({
        id: a.id,
        userId: a.userId || a.teacherId,
        userName: usersMap[a.userId || a.teacherId]?.fullname || "Unknown",
        userRole: usersMap[a.userId || a.teacherId]?.roleName || "STAFF",
        centerId: usersMap[a.userId || a.teacherId]?.centerId || "",
        centerName: centersData.find(c => c.id === usersMap[a.userId || a.teacherId]?.centerId)?.name || "Unknown",
        date: a.date,
        status: a.status || "PRESENT",
        checkInTime: a.checkInTime,
        checkOutTime: a.checkOutTime,
        approvalStatus: a.approvalStatus || "APPROVED"
      }));
      setRecentAttendance(recentAtt);

      // Calculate leave overview
      setLeaveOverview({
        pending: leaveData.filter(l => l.status === "PENDING").length,
        approved: leaveData.filter(l => l.status === "APPROVED").length,
        rejected: leaveData.filter(l => l.status === "REJECTED").length,
        onLeaveToday: leaveData.filter(l => l.status === "APPROVED" && new Date(l.startDate) <= new Date() && new Date(l.endDate) >= new Date()).length
      });

      // Generate trend data from real attendance
      const trendDataCalc: TrendData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const dayAttendance = attendanceData.filter(a => a.date === dateStr);
        trendDataCalc.push({
          date: date.toLocaleDateString("en-US", { weekday: "short" }),
          present: dayAttendance.filter(a => a.status === "PRESENT").length,
          absent: dayAttendance.filter(a => a.status === "ABSENT").length,
          leave: leaveData.filter(l => l.status === "APPROVED" && new Date(l.startDate) <= date && new Date(l.endDate) >= date).length
        });
      }
      setTrendData(trendDataCalc);
    } catch (err) {
      console.error("Error fetching data:", err);
      setCenters([]);
      setSummaries([]);
      setRecentAttendance([]);
      setLeaveOverview({ pending: 0, approved: 0, rejected: 0, onLeaveToday: 0 });
      setTrendData([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totals = useMemo(() => {
    const filtered = selectedCenter === "all" 
      ? summaries 
      : summaries.filter(s => s.centerId === selectedCenter);
    
    return {
      totalStaff: filtered.reduce((sum, s) => sum + s.totalStaff, 0),
      presentToday: filtered.reduce((sum, s) => sum + s.presentToday, 0),
      absentToday: filtered.reduce((sum, s) => sum + s.absentToday, 0),
      onLeave: filtered.reduce((sum, s) => sum + s.onLeave, 0),
      pendingApprovals: filtered.reduce((sum, s) => sum + s.pendingApprovals, 0)
    };
  }, [summaries, selectedCenter]);

  const attendanceRate = totals.totalStaff > 0 
    ? ((totals.presentToday / totals.totalStaff) * 100).toFixed(1) 
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT": return "bg-green-100 text-green-700";
      case "ABSENT": return "bg-red-100 text-red-700";
      case "HALF_DAY": return "bg-orange-100 text-orange-700";
      case "LEAVE": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const maxTrendValue = Math.max(...trendData.map(d => d.present + d.absent + d.leave), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/superadmin" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">Attendance Overview</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Organization Attendance Overview</h1>
          <p className="text-gray-500">Monitor staff attendance across all centers</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedCenter}
            onChange={(e) => setSelectedCenter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Centers</option>
            {centers.map(center => (
              <option key={center.id} value={center.id}>{center.name}</option>
            ))}
          </select>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-purple-500">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">👥</div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totals.totalStaff}</p>
                  <p className="text-sm text-gray-500">Total Staff</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">✅</div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totals.presentToday}</p>
                  <p className="text-sm text-gray-500">Present Today</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-red-500">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-2xl">❌</div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totals.absentToday}</p>
                  <p className="text-sm text-gray-500">Absent Today</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-500">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">🏖️</div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totals.onLeave}</p>
                  <p className="text-sm text-gray-500">On Leave</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-yellow-500">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-2xl">⏳</div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totals.pendingApprovals}</p>
                  <p className="text-sm text-gray-500">Pending</p>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Rate Card */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-medium opacity-90">Today's Attendance Rate</h3>
                <p className="text-5xl font-bold mt-2">{attendanceRate}%</p>
                <p className="opacity-75 mt-1">{totals.presentToday} out of {totals.totalStaff} staff present</p>
              </div>
              <div className="flex gap-8">
                <div className="text-center">
                  <p className="text-3xl font-bold">{leaveOverview.pending}</p>
                  <p className="text-sm opacity-75">Leave Pending</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{leaveOverview.onLeaveToday}</p>
                  <p className="text-sm opacity-75">On Leave Today</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{centers.length}</p>
                  <p className="text-sm opacity-75">Active Centers</p>
                </div>
              </div>
            </div>
          </div>

          {/* No Data Message */}
          {summaries.length === 0 && recentAttendance.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl">📊</div>
                <div>
                  <h3 className="text-lg font-bold text-yellow-900">No Attendance Data Yet</h3>
                  <p className="text-yellow-800 mt-1">
                    Attendance records will appear here once staff members start marking their attendance.
                    The data shown is fetched in real-time from the database.
                  </p>
                  <p className="text-yellow-700 text-sm mt-2">
                    Staff can mark attendance from: <strong>Dashboard → Attendance → My Attendance</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveView("overview")}
                  className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                    activeView === "overview"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  📊 Weekly Trend
                </button>
                <button
                  onClick={() => setActiveView("centers")}
                  className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                    activeView === "centers"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  🏢 Center-wise ({summaries.length})
                </button>
                <button
                  onClick={() => setActiveView("pending")}
                  className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                    activeView === "pending"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  ⏳ Pending Approvals ({totals.pendingApprovals})
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeView === "overview" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">7-Day Attendance Trend</h3>
                  <div className="space-y-4">
                    {trendData.map((day, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <span className="w-12 text-sm font-medium text-gray-600">{day.date}</span>
                        <div className="flex-1 flex gap-1 h-8">
                          <div 
                            className="bg-green-500 rounded-l transition-all"
                            style={{ width: `${(day.present / maxTrendValue) * 100}%` }}
                            title={`Present: ${day.present}`}
                          ></div>
                          <div 
                            className="bg-red-500 transition-all"
                            style={{ width: `${(day.absent / maxTrendValue) * 100}%` }}
                            title={`Absent: ${day.absent}`}
                          ></div>
                          <div 
                            className="bg-blue-500 rounded-r transition-all"
                            style={{ width: `${(day.leave / maxTrendValue) * 100}%` }}
                            title={`Leave: ${day.leave}`}
                          ></div>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span className="text-green-600">{day.present}</span>
                          <span className="text-red-600">{day.absent}</span>
                          <span className="text-blue-600">{day.leave}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-6 justify-center mt-6">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-green-500"></div>
                      <span className="text-sm text-gray-600">Present</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-red-500"></div>
                      <span className="text-sm text-gray-600">Absent</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-blue-500"></div>
                      <span className="text-sm text-gray-600">On Leave</span>
                    </div>
                  </div>
                </div>
              )}

              {activeView === "centers" && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Center</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Staff</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Present</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Absent</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">On Leave</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pending</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Attendance %</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {summaries.map(summary => {
                        const rate = ((summary.presentToday / summary.totalStaff) * 100).toFixed(1);
                        return (
                          <tr key={summary.centerId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">🏢</div>
                                <div>
                                  <p className="font-medium text-gray-900">{summary.centerName}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center font-medium">{summary.totalStaff}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">{summary.presentToday}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm">{summary.absentToday}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">{summary.onLeave}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {summary.pendingApprovals > 0 ? (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">{summary.pendingApprovals}</span>
                              ) : (
                                <span className="text-gray-400">0</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${parseFloat(rate) >= 90 ? "bg-green-500" : parseFloat(rate) >= 75 ? "bg-yellow-500" : "bg-red-500"}`}
                                    style={{ width: `${rate}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium">{rate}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {activeView === "pending" && (
                <div>
                  {recentAttendance.filter(a => a.approvalStatus === "PENDING").length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-4xl mb-2">✅</p>
                      <p>No pending approvals</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentAttendance.filter(a => a.approvalStatus === "PENDING").map(record => (
                        <div key={record.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                                {record.userName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{record.userName}</p>
                                <p className="text-sm text-gray-500">{record.userRole} • {record.centerName}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-sm text-gray-600">
                                    📅 {new Date(record.date).toLocaleDateString()}
                                  </span>
                                  {record.checkInTime && (
                                    <span className="text-sm text-gray-600">
                                      ⏰ {record.checkInTime} - {record.checkOutTime || "N/A"}
                                    </span>
                                  )}
                                  <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(record.status)}`}>
                                    {record.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                              Awaiting Center Admin
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats by Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Leave Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <span className="text-gray-700">Pending Requests</span>
                  <span className="font-bold text-yellow-600">{leaveOverview.pending}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-gray-700">Approved This Month</span>
                  <span className="font-bold text-green-600">{leaveOverview.approved}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="text-gray-700">Rejected This Month</span>
                  <span className="font-bold text-red-600">{leaveOverview.rejected}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-gray-700">On Leave Today</span>
                  <span className="font-bold text-blue-600">{leaveOverview.onLeaveToday}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top Performing Centers</h3>
              <div className="space-y-4">
                {summaries
                  .sort((a, b) => (b.presentToday / b.totalStaff) - (a.presentToday / a.totalStaff))
                  .slice(0, 4)
                  .map((summary, index) => {
                    const rate = ((summary.presentToday / summary.totalStaff) * 100).toFixed(1);
                    return (
                      <div key={summary.centerId} className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : index === 2 ? "bg-orange-400" : "bg-gray-300"
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900">{summary.centerName}</span>
                            <span className="text-sm font-bold text-green-600">{rate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${rate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
