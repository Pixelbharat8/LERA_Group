"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface User {
  id: string;
  fullname: string;
  email: string;
  phone?: string;
  roleName?: string;
  roleId?: string;
  centerId?: string;
  centerName?: string;
  departmentId?: string;
  departmentName?: string;
  jobTitle?: string;
  status?: string;
  isActive?: boolean;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
  emailVerified?: boolean;
  orgLevel?: number;
  employmentType?: string;
}

interface LoginHistory {
  id: string;
  userId: string;
  loginTime: string;
  ipAddress?: string;
  userAgent?: string;
  status: string;
  location?: string;
}

interface ActivityLog {
  id: string;
  userId: string;
  activityType: string;
  description: string;
  createdAt: string;
  ipAddress?: string;
  metadata?: string;
}

interface Role {
  id: string;
  name: string;
  displayName?: string;
  level?: number;
}

interface Center {
  id: string;
  name: string;
  code?: string;
}

interface Department {
  id: string;
  departmentName?: string;
  name?: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // Related data
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [leaveHistory, setLeaveHistory] = useState<any[]>([]);
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Fetch user details
      const userData = await apiFetch(`/api/users/${userId}`);
      setUser(userData.data || userData);
      setEditData(userData.data || userData);

      // Fetch login history
      const loginData = await apiFetch(`/api/login-history/user/${userId}`).catch(() => []);
      setLoginHistory(Array.isArray(loginData) ? loginData : loginData?.data || []);

      // Fetch activity logs
      const activityData = await apiFetch(`/api/activity-logs/user/${userId}?page=0&size=20`).catch(() => ({ content: [] }));
      setActivityLogs(activityData?.data?.content || activityData?.content || []);

      // Fetch roles, centers, departments for editing
      const [rolesData, centersData, deptsData] = await Promise.all([
        apiFetch("/api/roles").catch(() => []),
        apiFetch("/api/centers").catch(() => []),
        apiFetch("/api/departments").catch(() => []),
      ]);
      setRoles(Array.isArray(rolesData) ? rolesData : rolesData?.data || []);
      setCenters(Array.isArray(centersData) ? centersData : centersData?.data || []);
      setDepartments(Array.isArray(deptsData) ? deptsData : deptsData?.data || []);

      // Fetch related data from other services
      const attendanceData = await apiFetch(`/api/attendance/user/${userId}/stats`).catch(() => null);
      if (attendanceData) setAttendanceStats(attendanceData);

      const paymentsData = await apiFetch(`/api/payments/user/${userId}`).catch(() => []);
      setPaymentHistory(Array.isArray(paymentsData) ? paymentsData : paymentsData?.data || []);

      const leaveData = await apiFetch(`/api/leaves/user/${userId}`).catch(() => []);
      setLeaveHistory(Array.isArray(leaveData) ? leaveData : leaveData?.data || []);

      const classesData = await apiFetch(`/api/classes/user/${userId}`).catch(() => []);
      setAssignedClasses(Array.isArray(classesData) ? classesData : classesData?.data || []);

    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await apiFetch(`/api/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(editData),
      });
      setUser(updated.data || updated);
      setIsEditing(false);
      alert("User updated successfully!");
    } catch (error: any) {
      console.error("Error saving:", error);
      alert(error.message || "Error saving changes");
    } finally {
      setSaving(false);
    }
  };

  const handleChangeRole = async (newRoleId: string) => {
    if (!confirm("Are you sure you want to change this user's role?")) return;
    try {
      await apiFetch(`/api/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ ...editData, roleId: newRoleId }),
      });
      fetchUserData();
      alert("Role changed successfully!");
    } catch (error) {
      alert("Error changing role");
    }
  };

  const handleImpersonate = async () => {
    if (!confirm(`Login as ${user?.fullname}? You will be logged out.`)) return;
    try {
      await apiFetch(`/api/impersonation/${userId}`, { method: "POST" });
      // The backend now sets the access token as an HttpOnly cookie, so we no longer
      // write a JS-readable `token` cookie (XSS-resistant). Keep the non-sensitive hints.
      Cookies.set("impersonating", "true");
      Cookies.set("tokenSet", "1");
      window.location.href = "/dashboard";
    } catch (error) {
      alert("Error impersonating user");
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">User Not Found</h2>
          <Link href="/dashboard/chairman/users" className="text-blue-600 hover:underline mt-4 block">
            ← Back to Users
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/chairman/users" className="text-blue-600 hover:underline mb-2 inline-block">
          ← Back to Users
        </Link>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {user.fullname?.charAt(0) || "U"}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{user.fullname}</h1>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 rounded text-sm ${
                  user.status === "ACTIVE" || user.isActive !== false 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {user.status || (user.isActive !== false ? "Active" : "Inactive")}
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  {user.roleName || "User"}
                </span>
                {user.orgLevel && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                    Level {user.orgLevel}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {isEditing ? "Cancel Edit" : "✏️ Edit User"}
            </button>
            <button
              onClick={handleImpersonate}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              🎭 Login as User
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg mb-6">
        <div className="flex border-b overflow-x-auto">
          {[
            { id: "overview", name: "Overview", icon: "📋" },
            { id: "edit", name: "Edit Details", icon: "✏️" },
            { id: "login", name: "Login History", icon: "🔐" },
            { id: "activity", name: "Activity Log", icon: "📝" },
            { id: "attendance", name: "Attendance", icon: "📅" },
            { id: "payments", name: "Payments", icon: "💳" },
            { id: "leaves", name: "Leaves", icon: "🏖️" },
            { id: "classes", name: "Classes", icon: "📚" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 whitespace-nowrap font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              {tab.icon} {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">User Overview</h2>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Logins</p>
                <p className="text-2xl font-bold text-blue-600">{loginHistory.length}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Activities</p>
                <p className="text-2xl font-bold text-green-600">{activityLogs.length}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Leave Taken</p>
                <p className="text-2xl font-bold text-purple-600">{leaveHistory.length}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Classes</p>
                <p className="text-2xl font-bold text-orange-600">{assignedClasses.length}</p>
              </div>
            </div>

            {/* User Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">Personal Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Full Name</span>
                    <span className="font-medium">{user.fullname}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Email</span>
                    <span className="font-medium">{user.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Phone</span>
                    <span className="font-medium">{user.phone || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Email Verified</span>
                    <span className={user.emailVerified ? "text-green-600" : "text-red-600"}>
                      {user.emailVerified ? "Yes ✓" : "No ✗"}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">Organization</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Role</span>
                    <span className="font-medium">{user.roleName}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Center</span>
                    <Link href={`/dashboard/chairman/centers/${user.centerId}`} className="text-blue-600 hover:underline">
                      {user.centerName || "N/A"}
                    </Link>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Department</span>
                    <span className="font-medium">{user.departmentName || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Job Title</span>
                    <span className="font-medium">{user.jobTitle || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Employment Type</span>
                    <span className="font-medium">{user.employmentType || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-3">Timestamps</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-2">{formatDate(user.createdAt)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Updated:</span>
                  <span className="ml-2">{formatDate(user.updatedAt)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Last Login:</span>
                  <span className="ml-2">{formatDate(user.lastLogin)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Tab */}
        {activeTab === "edit" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Edit User Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editData.fullname || ""}
                  onChange={(e) => setEditData({ ...editData, fullname: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editData.email || ""}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={editData.phone || ""}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <input
                  type="text"
                  value={editData.jobTitle || ""}
                  onChange={(e) => setEditData({ ...editData, jobTitle: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={editData.roleId || ""}
                  onChange={(e) => handleChangeRole(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.displayName || role.name} (Level {role.level})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Center</label>
                <select
                  value={editData.centerId || ""}
                  onChange={(e) => setEditData({ ...editData, centerId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Center</option>
                  {centers.map((center) => (
                    <option key={center.id} value={center.id}>
                      {center.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={editData.departmentId || ""}
                  onChange={(e) => setEditData({ ...editData, departmentId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.departmentName || dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editData.status || "ACTIVE"}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setEditData(user);
                  setActiveTab("overview");
                }}
                className="px-6 py-2 border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {/* Login History Tab */}
        {activeTab === "login" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Login History</h2>
            {loginHistory.length === 0 ? (
              <p className="text-gray-500">No login history found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Time</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">IP Address</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Browser/Device</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loginHistory.map((login) => (
                      <tr key={login.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{formatDate(login.loginTime)}</td>
                        <td className="px-4 py-3 text-gray-600">{login.ipAddress || "N/A"}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{login.userAgent || "N/A"}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            login.status === "SUCCESS" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {login.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Activity Log Tab */}
        {activeTab === "activity" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Activity Log</h2>
            {activityLogs.length === 0 ? (
              <p className="text-gray-500">No activity logs found.</p>
            ) : (
              <div className="space-y-3">
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg">
                      📝
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-semibold">{log.activityType}</span>
                        <span className="text-sm text-gray-400">{formatDate(log.createdAt)}</span>
                      </div>
                      <p className="text-gray-600">{log.description}</p>
                      {log.ipAddress && (
                        <p className="text-xs text-gray-400 mt-1">IP: {log.ipAddress}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === "attendance" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Attendance Records</h2>
              <Link 
                href={`/dashboard/chairman/attendance?userId=${userId}`}
                className="text-blue-600 hover:underline"
              >
                View Full Attendance →
              </Link>
            </div>
            {attendanceStats ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Present</p>
                  <p className="text-2xl font-bold text-green-600">{attendanceStats.present || 0}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Absent</p>
                  <p className="text-2xl font-bold text-red-600">{attendanceStats.absent || 0}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Late</p>
                  <p className="text-2xl font-bold text-yellow-600">{attendanceStats.late || 0}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Attendance Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{attendanceStats.rate || "N/A"}%</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No attendance data available.</p>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Payment History</h2>
              <Link 
                href={`/dashboard/chairman/payments?userId=${userId}`}
                className="text-blue-600 hover:underline"
              >
                View All Payments →
              </Link>
            </div>
            {paymentHistory.length === 0 ? (
              <p className="text-gray-500">No payment records found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paymentHistory.slice(0, 10).map((payment: any) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{formatDate(payment.createdAt)}</td>
                        <td className="px-4 py-3">{payment.description || "Payment"}</td>
                        <td className="px-4 py-3 font-medium">{payment.amount?.toLocaleString()} VND</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            payment.status === "PAID" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Leaves Tab */}
        {activeTab === "leaves" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Leave History</h2>
              <Link 
                href={`/dashboard/chairman/leaves?userId=${userId}`}
                className="text-blue-600 hover:underline"
              >
                View All Leaves →
              </Link>
            </div>
            {leaveHistory.length === 0 ? (
              <p className="text-gray-500">No leave records found.</p>
            ) : (
              <div className="space-y-3">
                {leaveHistory.slice(0, 10).map((leave: any) => (
                  <div key={leave.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{leave.leaveType || "Leave"}</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm ${
                      leave.status === "APPROVED" ? "bg-green-100 text-green-800" :
                      leave.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {leave.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Classes Tab */}
        {activeTab === "classes" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Assigned Classes</h2>
            {assignedClasses.length === 0 ? (
              <p className="text-gray-500">No classes assigned.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignedClasses.map((cls: any) => (
                  <Link 
                    key={cls.id}
                    href={`/dashboard/chairman/classes/${cls.id}`}
                    className="block p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50"
                  >
                    <h3 className="font-semibold">{cls.className || cls.name}</h3>
                    <p className="text-sm text-gray-600">{cls.courseName || "N/A"}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Students: {cls.studentCount || 0}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
