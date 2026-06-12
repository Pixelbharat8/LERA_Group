"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

type User = {
  id: string;
  fullname?: string;
  name?: string;
  email: string;
  phone?: string;
  roleName?: string;
  role?: { name: string; id: string };
  centerId?: string;
  departmentId?: string;
  isActive?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  avatarUrl?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  // Teacher specific
  qualification?: string;
  specialization?: string;
  experienceYears?: number;
  // Parent specific
  childrenIds?: string[];
};

// Add academy_service teacher representation so Chairman "Teachers" tab matches academy teachers list
type AcademyTeacher = {
  id: string;
  userId?: string;
  teacherCode?: string;
  centerId?: string;
  specialization?: string;
  qualification?: string;
  yearsOfExperience?: number;
  isActive?: boolean;
};

type Center = { id: string; name: string };
type Department = { id: string; name?: string; departmentName?: string; departmentCode?: string };
type Student = { id: string; fullname?: string; name?: string; email?: string };

type TabType = "teachers" | "parents" | "admins";

export default function StaffManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("teachers");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCenter, setFilterCenter] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form
  const [form, setForm] = useState({
    fullname: "",
    email: "",
    password: "",
    phone: "",
    roleName: "",
    centerId: "",
    departmentId: "",
    gender: "",
    dateOfBirth: "",
    address: "",
    qualification: "",
    specialization: "",
    experienceYears: 0,
    childrenIds: [] as string[],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, centersData, departmentsData, studentsData, teachersData] = await Promise.all([
        apiFetch("/api/users").catch(() => []),
        apiFetch("/api/centers").catch(() => []),
        apiFetch("/api/departments").catch(() => []),
        apiFetch("/api/students").catch(() => []),
        // academy_service teachers table (source of truth for "real" teachers)
        apiFetch("/api/teachers").catch(() => []),
      ]);

      const usersList: User[] = Array.isArray(usersData) ? usersData : usersData?.data || [];
      const teachersList: AcademyTeacher[] = Array.isArray(teachersData) ? teachersData : teachersData?.data || [];

      // Enrich academy teachers with identity user profile so UI can show name/email/phone
      const enrichedTeachers: User[] = await Promise.all(
        (teachersList || []).map(async (t) => {
          if (!t.userId) {
            return {
              id: t.id,
              email: "",
              fullname: "(No linked user)",
              centerId: t.centerId,
              roleName: "TEACHER",
              qualification: t.qualification,
              specialization: t.specialization,
              experienceYears: t.yearsOfExperience,
              isActive: t.isActive,
            } as User;
          }

          const u = await apiFetch(`/api/users/${t.userId}`).catch(() => null);
          const user: any = (u && (u.data ?? u)) || null;

          return {
            id: user?.id || t.userId,
            fullname: user?.fullname || user?.fullName || user?.name || "",
            email: user?.email || "",
            phone: user?.phone || "",
            roleName: user?.roleName || user?.role?.name || "TEACHER",
            centerId: user?.centerId || t.centerId,
            departmentId: user?.departmentId,
            isActive: user?.isActive ?? t.isActive ?? true,
            createdAt: user?.createdAt,
            lastLoginAt: user?.lastLoginAt,
            avatarUrl: user?.avatarUrl,
            address: user?.address,
            dateOfBirth: user?.dateOfBirth,
            gender: user?.gender,
            qualification: t.qualification,
            specialization: t.specialization,
            experienceYears: t.yearsOfExperience,
          } as User;
        })
      );

      setUsers(usersList);
      setTeachers(enrichedTeachers);
      setCenters(Array.isArray(centersData) ? centersData : centersData?.data || []);
      setDepartments(Array.isArray(departmentsData) ? departmentsData : departmentsData?.data || []);
      setStudents(Array.isArray(studentsData) ? studentsData : studentsData?.data || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getRoleName = (user: User) => user.roleName || user.role?.name || "USER";
  const getCenterName = (centerId?: string) => centers.find(c => c.id === centerId)?.name || "-";
  const getDepartmentName = (departmentId?: string) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept?.departmentName || dept?.name || "-";
  };

  // Filter users by tab
  const getFilteredUsersByTab = () => {
    let tabUsers = users;

    switch (activeTab) {
      case "teachers":
        // IMPORTANT: Use academy teachers list, not just role-based filtering on /api/users
        tabUsers = teachers;
        break;
      case "parents":
        tabUsers = users.filter(u => getRoleName(u) === "PARENT");
        break;
      case "admins":
        tabUsers = users.filter(u =>
          getRoleName(u) === "ADMIN" ||
          getRoleName(u) === "SUPER_ADMIN" ||
          getRoleName(u) === "CENTER_MANAGER" ||
          getRoleName(u) === "ACCOUNTANT" ||
          getRoleName(u) === "RECEPTIONIST"
        );
        break;
    }

    return tabUsers.filter(user => {
      const matchesSearch =
        user.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm);
      const matchesCenter = !filterCenter || user.centerId === filterCenter;
      const matchesDepartment = !filterDepartment || user.departmentId === filterDepartment;
      const matchesStatus =
        !filterStatus ||
        (filterStatus === "active" && user.isActive !== false) ||
        (filterStatus === "inactive" && user.isActive === false);
      return matchesSearch && matchesCenter && matchesDepartment && matchesStatus;
    });
  };

  const openCreateModal = () => {
    const defaultRole = activeTab === "teachers" ? "TEACHER" : activeTab === "parents" ? "PARENT" : "ADMIN";
    setForm({
      fullname: "",
      email: "",
      password: "",
      phone: "",
      roleName: defaultRole,
      centerId: "",
      departmentId: "",
      gender: "",
      dateOfBirth: "",
      address: "",
      qualification: "",
      specialization: "",
      experienceYears: 0,
      childrenIds: [],
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setForm({
      fullname: user.fullname || "",
      email: user.email || "",
      password: "",
      phone: user.phone || "",
      roleName: getRoleName(user),
      centerId: user.centerId || "",
      departmentId: user.departmentId || "",
      gender: user.gender || "",
      dateOfBirth: user.dateOfBirth || "",
      address: user.address || "",
      qualification: user.qualification || "",
      specialization: user.specialization || "",
      experienceYears: user.experienceYears || 0,
      childrenIds: user.childrenIds || [],
    });
    setSelectedUser(user);
    setIsEditing(true);
    setShowModal(true);
  };

  const openViewModal = (user: User) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const handleSave = async () => {
    if (!form.fullname || !form.email) {
      alert("Please fill in required fields (Name, Email)");
      return;
    }
    if (!isEditing && !form.password) {
      alert("Password is required for new users");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        fullname: form.fullname,
        email: form.email,
        phone: form.phone,
        roleName: form.roleName,
        centerId: form.centerId || null,
        departmentId: form.departmentId || null,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        address: form.address,
      };

      if (!isEditing) {
        payload.password = form.password;
        await apiFetch("/api/auth/register", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        alert("User created successfully!");
      } else if (selectedUser) {
        await apiFetch(`/api/users/${selectedUser.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        alert("User updated successfully!");
      }

      setShowModal(false);
      fetchData();
    } catch (error: any) {
      alert(error.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await apiFetch(`/api/users/${id}`, { method: "DELETE" });
      alert("User deleted successfully!");
      fetchData();
    } catch (error: any) {
      alert(error.message || "Failed to delete user");
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await apiFetch(`/api/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...user,
          status: user.isActive === false ? "ACTIVE" : "INACTIVE",
        }),
      });
      fetchData();
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const filteredUsers = getFilteredUsersByTab();

  const stats = {
    teachers: teachers.length,
    parents: users.filter(u => getRoleName(u) === "PARENT").length,
    admins: users.filter(u => ["ADMIN", "SUPER_ADMIN", "CENTER_MANAGER", "ACCOUNTANT", "RECEPTIONIST"].includes(getRoleName(u))).length,
    active: users.filter(u => u.isActive !== false).length,
  };

  const rolesByTab: { [key in TabType]: string[] } = {
    teachers: ["TEACHER", "ASSISTANT_TEACHER", "HEAD_TEACHER"],
    parents: ["PARENT"],
    admins: ["ADMIN", "SUPER_ADMIN", "CENTER_MANAGER", "ACCOUNTANT", "RECEPTIONIST"],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/chairman" className="hover:text-blue-600">Chairman</Link>
            <span>/</span>
            <span className="text-gray-900">Staff Management</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">👥 Staff Management</h1>
          <p className="text-gray-600">Manage teachers, parents, and administrative staff</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>➕</span> Add {activeTab === "teachers" ? "Teacher" : activeTab === "parents" ? "Parent" : "Admin"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">👨‍🏫 Teachers</p>
          <p className="text-2xl font-bold text-blue-600">{stats.teachers}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">👨‍👩‍👧 Parents</p>
          <p className="text-2xl font-bold text-green-600">{stats.parents}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">👔 Admins</p>
          <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">✅ Active Users</p>
          <p className="text-2xl font-bold text-orange-600">{stats.active}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow mb-6">
        <div className="border-b flex">
          <button
            onClick={() => setActiveTab("teachers")}
            className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 ${
              activeTab === "teachers" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            👨‍🏫 Teachers ({stats.teachers})
          </button>
          <button
            onClick={() => setActiveTab("parents")}
            className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 ${
              activeTab === "parents" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            👨‍👩‍👧 Parents ({stats.parents})
          </button>
          <button
            onClick={() => setActiveTab("admins")}
            className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 ${
              activeTab === "admins" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            👔 Admins ({stats.admins})
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="col-span-2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterCenter}
              onChange={(e) => setFilterCenter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Centers</option>
              {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.departmentName || d.name}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Center</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <div className="text-5xl mb-4">👤</div>
                    <p>No {activeTab} found</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                          {(user.fullname || user.email || "U")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.fullname || "N/A"}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{user.phone || "-"}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {getRoleName(user)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{getCenterName(user.centerId)}</td>
                    <td className="px-6 py-4 text-gray-600">{getDepartmentName(user.departmentId)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.isActive !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {user.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openViewModal(user)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="View"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                          title="Toggle Status"
                        >
                          {user.isActive !== false ? "🔴" : "🟢"}
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-xl font-bold">
                {isEditing ? "✏️ Edit" : "➕ Add"} {activeTab === "teachers" ? "Teacher" : activeTab === "parents" ? "Parent" : "Admin"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-800 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={form.fullname}
                    onChange={(e) => setForm({ ...form, fullname: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter phone"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password {isEditing ? "(leave blank to keep)" : "*"}
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={isEditing ? "••••••••" : "Enter password"}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={form.roleName}
                    onChange={(e) => setForm({ ...form, roleName: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {rolesByTab[activeTab].map(role => (
                      <option key={role} value={role}>{role.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Center</label>
                  <select
                    value={form.centerId}
                    onChange={(e) => setForm({ ...form, centerId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Center</option>
                    {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={form.departmentId}
                    onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.departmentName || d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter address"
                  />
                </div>
              </div>

              {/* Teacher specific fields */}
              {activeTab === "teachers" && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                    <input
                      type="text"
                      value={form.qualification}
                      onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. TESOL Certificate"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                    <input
                      type="text"
                      value={form.specialization}
                      onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. IELTS, Business English"
                    />
                  </div>
                </div>
              )}

              {/* Parent specific fields */}
              {activeTab === "parents" && (
                <div className="pt-4 border-t">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link Children (Students)</label>
                  <select
                    multiple
                    value={form.childrenIds}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setForm({ ...form, childrenIds: selected });
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 h-32"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.fullname || s.name || s.email}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                </div>
              )}

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? "Saving..." : (isEditing ? "Update" : "Create")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-xl font-bold">📋 User Details</h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-gray-800 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
                  {(selectedUser.fullname || selectedUser.email || "U")[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedUser.fullname || "N/A"}</h2>
                  <p className="text-gray-500">{selectedUser.email}</p>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    selectedUser.isActive !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {selectedUser.isActive !== false ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="font-medium">{getRoleName(selectedUser)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{selectedUser.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Center</p>
                  <p className="font-medium">{getCenterName(selectedUser.centerId)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="font-medium">{getDepartmentName(selectedUser.departmentId)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-medium">{selectedUser.gender || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium">{formatDate(selectedUser.dateOfBirth)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{selectedUser.address || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created At</p>
                  <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Login</p>
                  <p className="font-medium">{formatDate(selectedUser.lastLoginAt)}</p>
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
