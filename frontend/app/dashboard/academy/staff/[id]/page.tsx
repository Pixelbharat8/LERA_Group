"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";

interface StaffMember {
  id: string;
  staffCode: string;
  userId: string;
  centerId: string;
  centerName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role: string;
  department?: string;
  departmentName?: string;
  position?: string;
  joiningDate?: string;
  employmentType?: string;
  status: string;
  createdAt?: string;
  profilePicture?: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  checkIn?: string;
  checkOut?: string;
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
}

interface PayrollRecord {
  id: string;
  month?: string;
  payPeriodStart?: string;
  payPeriodEnd?: string;
  baseSalary: number;
  grossSalary?: number;
  bonus?: number;
  totalBonus?: number;
  deductions?: number;
  totalDeductions?: number;
  netSalary?: number;
  netPay?: number;
  status: string;
}

interface LeaveBalance {
  totalAllowed: number;
  used: number;
  remaining: number;
  pending: number;
}

interface Document {
  id: string;
  name: string;
  fileName?: string;
  type: string;
  documentType?: string;
  uploadedAt?: string;
  createdAt?: string;
  url?: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  dueDate?: string;
  priority?: string;
}

export default function StaffProfilePage() {
  const params = useParams();
  const staffId = params.id as string;
  
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [dateFilter, setDateFilter] = useState("monthly");

  // Real data from APIs
  const [stats, setStats] = useState({
    attendanceRate: 0,
    totalWorkDays: 0,
    presentDays: 0,
    leaveDays: 0,
    overtimeHours: 0,
    tasksCompleted: 0,
    pendingTasks: 0
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance>({ totalAllowed: 15, used: 0, remaining: 15, pending: 0 });
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetchAllData();
  }, [staffId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch staff profile
      const staffData = await apiFetch(`/api/staff/${staffId}`).catch(() => null);
      
      let staffWithUser = staffData;
      if (staffData?.userId) {
        // Fetch user details to get name, email, phone
        const userData = await apiFetch(`/api/users/${staffData.userId}`).catch(() => null);
        if (userData) {
          staffWithUser = {
            ...staffData,
            fullName: userData.fullname || userData.name,
            email: userData.email,
            phone: userData.phone,
            profilePicture: userData.profilePicture
          };
        }
        
        // Fetch center name
        if (staffData.centerId) {
          const centerData = await apiFetch(`/api/centers/${staffData.centerId}`).catch(() => null);
          if (centerData) {
            staffWithUser.centerName = centerData.name;
          }
        }
        
        // Fetch department name
        if (staffData.departmentId) {
          const deptData = await apiFetch(`/api/departments/${staffData.departmentId}`).catch(() => null);
          if (deptData) {
            staffWithUser.departmentName = deptData.name;
          }
        }
      }
      
      setStaff(staffWithUser);

      // Fetch attendance records
      const userId = staffData?.userId || staffId;
      const attendanceData = await apiFetch(`/api/attendance?userId=${userId}`).catch(() => []);
      const sortedAttendance = Array.isArray(attendanceData) 
        ? attendanceData.sort((a: AttendanceRecord, b: AttendanceRecord) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 30)
        : [];
      setAttendance(sortedAttendance);

      // Calculate attendance stats
      const presentCount = sortedAttendance.filter((a: AttendanceRecord) => a.status === "PRESENT").length;
      const leaveCount = sortedAttendance.filter((a: AttendanceRecord) => a.status === "LEAVE" || a.status === "APPROVED").length;
      const totalDays = sortedAttendance.length || 1;
      
      // Fetch payroll records
      const payrollData = await apiFetch(`/api/payroll/user/${userId}`).catch(() => []);
      setPayroll(Array.isArray(payrollData) ? payrollData : []);

      // Fetch leave balance
      const leaveData = await apiFetch(`/api/leave-balance?userId=${userId}`).catch(() => null);
      if (leaveData) {
        setLeaveBalance({
          totalAllowed: leaveData.totalAllowed || leaveData.annualLeave || 15,
          used: leaveData.used || leaveData.usedLeave || 0,
          remaining: leaveData.remaining || leaveData.remainingLeave || 15,
          pending: leaveData.pending || 0
        });
      }

      // Fetch pending leave requests count
      const leaveRequests = await apiFetch(`/api/teacher-staff-leave?userId=${userId}&status=PENDING`).catch(() => []);
      const pendingLeaves = Array.isArray(leaveRequests) ? leaveRequests.length : 0;

      // Fetch tasks
      const tasksData = await apiFetch(`/api/tasks?assigneeId=${userId}`).catch(() => []);
      const tasksList = Array.isArray(tasksData) ? tasksData : [];
      setTasks(tasksList);
      
      const completedTasks = tasksList.filter((t: Task) => t.status === "COMPLETED" || t.status === "DONE").length;
      const pendingTasks = tasksList.filter((t: Task) => t.status === "PENDING" || t.status === "IN_PROGRESS").length;

      // Fetch documents
      const docsData = await apiFetch(`/api/documents?userId=${userId}`).catch(() => []);
      setDocuments(Array.isArray(docsData) ? docsData : []);

      // Update stats
      setStats({
        attendanceRate: totalDays > 0 ? Math.round((presentCount / totalDays) * 100 * 10) / 10 : 0,
        totalWorkDays: totalDays,
        presentDays: presentCount,
        leaveDays: leaveCount,
        overtimeHours: 0, // Would need overtime tracking
        tasksCompleted: completedTasks,
        pendingTasks: pendingTasks
      });

      setLeaveBalance(prev => ({ ...prev, pending: pendingLeaves }));

    } catch (error) {
      console.error("Error fetching staff data:", error);
    } finally {
      setLoading(false);
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
    { id: "attendance", label: "Attendance", icon: "📅" },
    { id: "payroll", label: "Payroll", icon: "💰" },
    { id: "tasks", label: "Tasks", icon: "✅" },
    { id: "documents", label: "Documents", icon: "📁" },
    { id: "leaves", label: "Leaves", icon: "🏖️" },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/superadmin" className="hover:text-blue-600">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/academy/staff" className="hover:text-blue-600">Staff</Link>
        <span>/</span>
        <span className="text-gray-900">{staff?.fullName || "Staff Profile"}</span>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-4xl">
              👤
            </div>
            <div>
              <h1 className="text-2xl font-bold">{staff?.fullName || "Staff Member"}</h1>
              <p className="text-teal-200">Code: {staff?.staffCode || "N/A"}</p>
              <p className="text-teal-200">{staff?.position} • {staff?.department}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm ${staff?.status === "ACTIVE" ? "bg-green-500" : "bg-gray-500"}`}>
                  {staff?.status || "ACTIVE"}
                </span>
                <span className="text-sm">📧 {staff?.email}</span>
                <span className="text-sm">📞 {staff?.phone}</span>
              </div>
            </div>
          </div>
          <button className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition">
            ✏️ Edit Profile
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">📈</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.attendanceRate}%</p>
              <p className="text-xs text-gray-500">Attendance Rate</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">📅</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.presentDays}/{stats.totalWorkDays}</p>
              <p className="text-xs text-gray-500">Days Present</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-xl">⏰</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.overtimeHours}h</p>
              <p className="text-xs text-gray-500">Overtime</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-xl">✅</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.tasksCompleted}</p>
              <p className="text-xs text-gray-500">Tasks Completed</p>
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
                    ? "text-teal-600 border-b-2 border-teal-600" 
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
                    ? "bg-teal-600 text-white" 
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
              {/* Personal Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-4">👤 Personal Information</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Full Name:</span><span>{staff?.fullName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Email:</span><span>{staff?.email}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Phone:</span><span>{staff?.phone}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Staff Code:</span><span className="font-mono">{staff?.staffCode}</span></div>
                </div>
              </div>

              {/* Employment Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-4">💼 Employment Details</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Position:</span><span>{staff?.position || staff?.role}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Department:</span><span>{staff?.departmentName || staff?.department}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Center:</span><span>{staff?.centerName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Employment Type:</span><span>{staff?.employmentType || "Full-time"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Joining Date:</span><span>{staff?.joiningDate ? new Date(staff.joiningDate).toLocaleDateString() : "N/A"}</span></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "attendance" && (
            <div className="space-y-4">
              {attendance.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No attendance records found</div>
              ) : (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attendance.map((a, idx) => (
                    <tr key={a.id || idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{new Date(a.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          a.status === "PRESENT" ? "bg-green-100 text-green-800" : 
                          a.status === "LEAVE" || a.status === "APPROVED" ? "bg-yellow-100 text-yellow-800" : 
                          a.status === "ABSENT" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>{a.status}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{a.checkInTime || a.checkIn || "-"}</td>
                      <td className="px-4 py-3 text-gray-500">{a.checkOutTime || a.checkOut || "-"}</td>
                      <td className="px-4 py-3 text-gray-500 text-sm">{a.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          )}

          {activeTab === "payroll" && (
            <div className="space-y-4">
              {payroll.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No payroll records found</div>
              ) : (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Salary</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bonus</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Pay</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payroll.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        {p.month || (p.payPeriodStart ? `${new Date(p.payPeriodStart).toLocaleDateString()} - ${new Date(p.payPeriodEnd || '').toLocaleDateString()}` : 'N/A')}
                      </td>
                      <td className="px-4 py-3">${(p.baseSalary || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-green-600">+${(p.totalBonus || p.bonus || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-red-600">-${(p.totalDeductions || p.deductions || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 font-bold">${(p.netSalary || p.netPay || 0).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          p.status === "PAID" ? "bg-green-100 text-green-800" :
                          p.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-4">
              {documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No documents uploaded yet</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {documents.map(doc => (
                    <div key={doc.id} className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">📄</div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{doc.fileName || doc.name}</p>
                        <p className="text-xs text-gray-500">{doc.documentType || doc.type} • {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : doc.uploadedAt}</p>
                      </div>
                      {doc.url && <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">View</a>}
                    </div>
                  ))}
                </div>
              )}
              <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                📤 Upload Document
              </button>
            </div>
          )}

          {activeTab === "tasks" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{stats.tasksCompleted}</p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-600">{stats.pendingTasks}</p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">{stats.tasksCompleted + stats.pendingTasks}</p>
                  <p className="text-sm text-gray-600">Total Assigned</p>
                </div>
              </div>
              {tasks.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Recent Tasks</h4>
                  <div className="space-y-2">
                    {tasks.slice(0, 5).map(task => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          {task.dueDate && <p className="text-xs text-gray-500">Due: {new Date(task.dueDate).toLocaleDateString()}</p>}
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          task.status === "COMPLETED" || task.status === "DONE" ? "bg-green-100 text-green-800" :
                          task.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800" :
                          "bg-yellow-100 text-yellow-800"
                        }`}>{task.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "leaves" && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{leaveBalance.totalAllowed}</p>
                  <p className="text-sm text-gray-600">Total Leave Days</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{leaveBalance.used}</p>
                  <p className="text-sm text-gray-600">Used</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{leaveBalance.remaining}</p>
                  <p className="text-sm text-gray-600">Remaining</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{leaveBalance.pending}</p>
                  <p className="text-sm text-gray-600">Pending Requests</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
