"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";
import Cookies from "js-cookie";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface Center {
  id: string;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  district?: string;
  phone?: string;
  email?: string;
  managerId?: string;
  managerName?: string;
  status?: string;
  isActive?: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  maxStudents?: number;
  currentStudents?: number;
  totalStaff?: number;
  totalClasses?: number;
  totalRevenue?: number;
}

interface User {
  id: string;
  fullname: string;
  email: string;
  roleName?: string;
  status?: string;
  phone?: string;
}

interface Class {
  id: string;
  className?: string;
  name?: string;
  courseName?: string;
  teacherName?: string;
  studentCount?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}

interface Course {
  id: string;
  courseName?: string;
  name?: string;
  level?: string;
  duration?: number;
  status?: string;
}

interface Revenue {
  month: string;
  amount: number;
  transactions: number;
}

export default function CenterProfilePage() {
  const params = useParams();
  const router = useRouter();
  const centerId = params.id as string;

  const [center, setCenter] = useState<Center | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [revenueData, setRevenueData] = useState<Revenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [managers, setManagers] = useState<User[]>([]);

  const fetchCenterData = async () => {
    setLoading(true);
    try {
      // Fetch center details
      const centerData = await apiFetch(`/api/centers/${centerId}`);
      const center = centerData.data || centerData;
      setCenter(center);
      setEditData(center);

      // Fetch users at this center
      const usersData = await apiFetch(`/api/users?centerId=${centerId}`).catch(() => []);
      const allUsers = Array.isArray(usersData) ? usersData : usersData?.data?.content || usersData?.data || [];
      setUsers(allUsers);
      setStudents(allUsers.filter((u: User) => u.roleName === "STUDENT"));
      setTeachers(allUsers.filter((u: User) => 
        ["TEACHER", "TA", "INSTRUCTOR"].includes(u.roleName || "")
      ));

      // Fetch classes at this center
      const classesData = await apiFetch(`/api/classes?centerId=${centerId}`).catch(() => []);
      setClasses(Array.isArray(classesData) ? classesData : classesData?.data?.content || classesData?.data || []);

      // Fetch courses offered at this center
      const coursesData = await apiFetch(`/api/courses?centerId=${centerId}`).catch(() => []);
      setCourses(Array.isArray(coursesData) ? coursesData : coursesData?.data?.content || coursesData?.data || []);

      // Fetch revenue data
      const revenueResult = await apiFetch(`/api/payments/center/${centerId}/summary`).catch(() => []);
      setRevenueData(Array.isArray(revenueResult) ? revenueResult : revenueResult?.data || []);

      // Fetch potential managers for dropdown
      const managersData = await apiFetch("/api/users?role=CENTER_MANAGER").catch(() => []);
      setManagers(Array.isArray(managersData) ? managersData : managersData?.data?.content || managersData?.data || []);

    } catch (error) {
      console.error("Error fetching center data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (centerId) {
      fetchCenterData();
    }
  }, [centerId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await apiFetch(`/api/centers/${centerId}`, {
        method: "PUT",
        body: JSON.stringify(editData),
      });
      setCenter(updated.data || updated);
      setIsEditing(false);
      alert("Center updated successfully!");
    } catch (error: any) {
      console.error("Error saving:", error);
      alert(error.message || "Error saving changes");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString();
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "0 VND";
    return amount.toLocaleString() + " VND";
  };

  const totalRevenue = revenueData.reduce((sum, r) => sum + (r.amount || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!center) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Center Not Found</h2>
          <Link href="/dashboard/chairman/centers" className="text-blue-600 hover:underline mt-4 block">
            ← Back to Centers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/chairman/centers" className="text-blue-600 hover:underline mb-2 inline-block">
          ← Back to Centers
        </Link>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center text-white text-3xl font-bold">
              🏫
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{center.name}</h1>
              <p className="text-gray-600">{center.code}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 rounded text-sm ${
                  center.status === "ACTIVE" || center.isActive !== false
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {center.status || (center.isActive !== false ? "Active" : "Inactive")}
                </span>
                <span className="text-gray-500">|</span>
                <span className="text-gray-600">{center.city}, {center.district}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {isEditing ? "Cancel Edit" : "✏️ Edit Center"}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-sm text-gray-500">Total Users</div>
          <div className="text-2xl font-bold text-blue-600">{users.length}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-sm text-gray-500">Students</div>
          <div className="text-2xl font-bold text-green-600">{students.length}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-sm text-gray-500">Teachers</div>
          <div className="text-2xl font-bold text-purple-600">{teachers.length}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-sm text-gray-500">Classes</div>
          <div className="text-2xl font-bold text-orange-600">{classes.length}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-sm text-gray-500">Total Revenue</div>
          <div className="text-2xl font-bold text-teal-600">{formatCurrency(totalRevenue)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg mb-6">
        <div className="flex border-b overflow-x-auto">
          {[
            { id: "overview", name: "Overview", icon: "📋" },
            { id: "edit", name: "Edit Details", icon: "✏️" },
            { id: "users", name: "All Users", icon: "👥" },
            { id: "students", name: "Students", icon: "🎓" },
            { id: "teachers", name: "Teachers", icon: "👨‍🏫" },
            { id: "classes", name: "Classes", icon: "📚" },
            { id: "courses", name: "Courses", icon: "📖" },
            { id: "revenue", name: "Revenue", icon: "💰" },
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
            <h2 className="text-xl font-bold">Center Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">Location & Contact</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Address</span>
                    <span className="font-medium text-right max-w-xs">{center.address || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">City</span>
                    <span className="font-medium">{center.city || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">District</span>
                    <span className="font-medium">{center.district || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Phone</span>
                    <span className="font-medium">{center.phone || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Email</span>
                    <span className="font-medium">{center.email || "N/A"}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">Management</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Manager</span>
                    {center.managerId ? (
                      <Link href={`/dashboard/chairman/users/${center.managerId}`} className="text-blue-600 hover:underline">
                        {center.managerName || "View Manager"}
                      </Link>
                    ) : (
                      <span className="text-gray-400">Not Assigned</span>
                    )}
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Max Capacity</span>
                    <span className="font-medium">{center.maxStudents || "Unlimited"} students</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Current Students</span>
                    <span className="font-medium">{students.length}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Total Staff</span>
                    <span className="font-medium">{users.length - students.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {center.description && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
                <p className="text-gray-600">{center.description}</p>
              </div>
            )}

            {/* Timestamps */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-3">Timestamps</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-2">{formatDate(center.createdAt)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Updated:</span>
                  <span className="ml-2">{formatDate(center.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Tab */}
        {activeTab === "edit" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Edit Center Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Center Name</label>
                <input
                  type="text"
                  value={editData.name || ""}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Center Code</label>
                <input
                  type="text"
                  value={editData.code || ""}
                  onChange={(e) => setEditData({ ...editData, code: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={editData.address || ""}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={editData.city || ""}
                  onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <input
                  type="text"
                  value={editData.district || ""}
                  onChange={(e) => setEditData({ ...editData, district: e.target.value })}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editData.email || ""}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
                <select
                  value={editData.managerId || ""}
                  onChange={(e) => setEditData({ ...editData, managerId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Manager</option>
                  {managers.map((mgr) => (
                    <option key={mgr.id} value={mgr.id}>
                      {mgr.fullname} ({mgr.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
                <input
                  type="number"
                  value={editData.maxStudents || ""}
                  onChange={(e) => setEditData({ ...editData, maxStudents: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
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
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editData.description || ""}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setEditData(center);
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

        {/* All Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">All Users at {center.name}</h2>
              <Link 
                href={`/dashboard/chairman/users?centerId=${centerId}`}
                className="text-blue-600 hover:underline"
              >
                Manage Users →
              </Link>
            </div>
            {users.length === 0 ? (
              <p className="text-gray-500">No users at this center.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.slice(0, 20).map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{user.fullname}</td>
                        <td className="px-4 py-3 text-gray-600">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {user.roleName}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {user.status || "Active"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/dashboard/chairman/users/${user.id}`} className="text-blue-600 hover:underline text-sm">
                            View Profile
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length > 20 && (
                  <div className="text-center py-4">
                    <Link href={`/dashboard/chairman/users?centerId=${centerId}`} className="text-blue-600 hover:underline">
                      View All {users.length} Users →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Students Tab */}
        {activeTab === "students" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Students ({students.length})</h2>
              <Link 
                href={`/dashboard/chairman/users?centerId=${centerId}&role=STUDENT`}
                className="text-blue-600 hover:underline"
              >
                Manage Students →
              </Link>
            </div>
            {students.length === 0 ? (
              <p className="text-gray-500">No students at this center.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.slice(0, 15).map((student) => (
                  <Link 
                    key={student.id}
                    href={`/dashboard/chairman/users/${student.id}`}
                    className="block p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold">
                        {student.fullname?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{student.fullname}</p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Teachers Tab */}
        {activeTab === "teachers" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Teachers ({teachers.length})</h2>
              <Link 
                href={`/dashboard/chairman/users?centerId=${centerId}&role=TEACHER`}
                className="text-blue-600 hover:underline"
              >
                Manage Teachers →
              </Link>
            </div>
            {teachers.length === 0 ? (
              <p className="text-gray-500">No teachers at this center.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teachers.map((teacher) => (
                  <Link 
                    key={teacher.id}
                    href={`/dashboard/chairman/users/${teacher.id}`}
                    className="block p-4 border rounded-lg hover:border-purple-500 hover:bg-purple-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">
                        {teacher.fullname?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{teacher.fullname}</p>
                        <p className="text-sm text-gray-500">{teacher.roleName}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Classes Tab */}
        {activeTab === "classes" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Classes ({classes.length})</h2>
              <Link 
                href={`/dashboard/chairman/classes?centerId=${centerId}`}
                className="text-blue-600 hover:underline"
              >
                Manage Classes →
              </Link>
            </div>
            {classes.length === 0 ? (
              <p className="text-gray-500">No classes at this center.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map((cls) => (
                  <Link 
                    key={cls.id}
                    href={`/dashboard/chairman/classes/${cls.id}`}
                    className="block p-4 border rounded-lg hover:border-orange-500 hover:bg-orange-50"
                  >
                    <h3 className="font-semibold">{cls.className || cls.name}</h3>
                    <p className="text-sm text-gray-600">{cls.courseName}</p>
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span className="text-gray-500">
                        👨‍🏫 {cls.teacherName || "TBA"}
                      </span>
                      <span className="text-gray-500">
                        👥 {cls.studentCount || 0}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        cls.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                        cls.status === "COMPLETED" ? "bg-blue-100 text-blue-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {cls.status || "Active"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === "courses" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Courses Offered ({courses.length})</h2>
              <Link 
                href={`/dashboard/chairman/courses?centerId=${centerId}`}
                className="text-blue-600 hover:underline"
              >
                Manage Courses →
              </Link>
            </div>
            {courses.length === 0 ? (
              <p className="text-gray-500">No courses offered at this center.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((course) => (
                  <Link 
                    key={course.id}
                    href={`/dashboard/chairman/courses/${course.id}`}
                    className="block p-4 border rounded-lg hover:border-teal-500 hover:bg-teal-50"
                  >
                    <h3 className="font-semibold">{course.courseName || course.name}</h3>
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span className="text-gray-500">
                        Level: {course.level || "N/A"}
                      </span>
                      <span className="text-gray-500">
                        {course.duration || "N/A"} hours
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        course.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {course.status || "Active"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === "revenue" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Revenue Overview</h2>
              <Link 
                href={`/dashboard/chairman/reports?centerId=${centerId}&type=revenue`}
                className="text-blue-600 hover:underline"
              >
                Detailed Report →
              </Link>
            </div>

            {/* Revenue Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-blue-600">
                  {revenueData.reduce((sum, r) => sum + (r.transactions || 0), 0)}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Avg Monthly</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(revenueData.length ? totalRevenue / revenueData.length : 0)}
                </p>
              </div>
            </div>

            {/* Monthly Breakdown */}
            {revenueData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Month</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Revenue</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Transactions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {revenueData.map((rev, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{rev.month}</td>
                        <td className="px-4 py-3 text-green-600">{formatCurrency(rev.amount)}</td>
                        <td className="px-4 py-3">{rev.transactions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No revenue data available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
