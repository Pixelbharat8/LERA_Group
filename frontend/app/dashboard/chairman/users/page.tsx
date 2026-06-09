"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../../../lib/api";

type User = {
  id: string;
  fullname?: string;
  name?: string;
  email: string;
  phone?: string;
  roleName?: string;
  role?: { name: string; id: string };
  roleId?: string;
  centerId?: string;
  centerName?: string;
  departmentId?: string;
  departmentName?: string;
  isActive?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  avatarUrl?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  // Student-specific fields
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  enrollmentNumber?: string;
  classGrade?: string;
  programId?: string;
  courseId?: string;
  classId?: string;
};

type Center = { id: string; name: string };
type Department = { id: string; name?: string; departmentName?: string; departmentCode?: string; departmentType?: string };
type Role = { id: string; name: string };
type Program = { id: string; name?: string; programName?: string; courseName?: string; title?: string };
type ClassEntity = { id: string; name?: string; className?: string; classCode?: string; courseId?: string; programId?: string };

export default function ChairmanUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterCenter, setFilterCenter] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<any>(null);

  // New user form
  const [newUser, setNewUser] = useState({
    fullname: "",
    email: "",
    password: "",
    phone: "",
    roleId: "",
    centerId: "",
    departmentId: "",
    isActive: true,
    address: "",
    dateOfBirth: "",
    gender: "",
    // Student-specific fields
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    enrollmentNumber: "",
    classGrade: "",
    programId: "",
    classId: "",
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, rolesData, centersData, departmentsData, programsData, classesData] = await Promise.all([
        apiFetch("/api/users").catch(() => []),
        apiFetch("/api/roles").catch(() => []),
        apiFetch("/api/centers").catch(() => []),
        apiFetch("/api/departments").catch(() => []),
        apiFetch("/api/programs").catch(() => apiFetch("/api/courses").catch(() => [])),
        apiFetch("/api/classes").catch(() => []),
      ]);

      setUsers(Array.isArray(usersData) ? usersData : usersData?.data || []);
      setRoles(Array.isArray(rolesData) ? rolesData : rolesData?.data || []);
      setCenters(Array.isArray(centersData) ? centersData : centersData?.data || []);
      setDepartments(Array.isArray(departmentsData) ? departmentsData : departmentsData?.data || []);
      setPrograms(Array.isArray(programsData) ? programsData : programsData?.content || programsData?.data || []);
      setClasses(Array.isArray(classesData) ? classesData : classesData?.content || classesData?.data || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.fullname) {
      alert("Please fill in all required fields (Name, Email, Password)");
      return;
    }
    try {
      // Convert roleId to roleName for backend
      let roleName = "";
      if (newUser.roleId) {
        const selectedRole = roles.find(r => r.id === newUser.roleId);
        if (selectedRole) {
          roleName = selectedRole.name;
        }
      }
      
      const registerPayload = {
        fullname: newUser.fullname,
        email: newUser.email,
        password: newUser.password,
        phone: newUser.phone || null,
        roleName: roleName || "STUDENT",
        centerId: newUser.centerId || null,
        departmentId: roleName !== "STUDENT" ? (newUser.departmentId || null) : null,
        gender: newUser.gender || null,
        dateOfBirth: newUser.dateOfBirth || null,
        address: newUser.address || null,
        status: newUser.isActive ? "ACTIVE" : "INACTIVE",
        // Student-specific fields (only if role is STUDENT)
        ...(roleName === "STUDENT" && {
          parentName: newUser.parentName || null,
          parentPhone: newUser.parentPhone || null,
          parentEmail: newUser.parentEmail || null,
          enrollmentNumber: newUser.enrollmentNumber || null,
          classGrade: newUser.classGrade || null,
          programId: newUser.programId || null,
          courseId: newUser.programId || null,
          classId: newUser.classId || null,
        }),
      };
      
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(registerPayload),
      });
      alert("User created successfully!");
      setShowAddModal(false);
      setNewUser({ fullname: "", email: "", password: "", phone: "", roleId: "", centerId: "", departmentId: "", isActive: true, address: "", dateOfBirth: "", gender: "", parentName: "", parentPhone: "", parentEmail: "", enrollmentNumber: "", classGrade: "", programId: "", classId: "" });
      fetchData();
    } catch (error: any) {
      alert(error.message || "Failed to create user");
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      // Find the role name from roleId or use existing roleName
      let roleName = editingUser.roleName;
      if (editingUser.roleId) {
        const selectedRole = roles.find(r => r.id === editingUser.roleId);
        if (selectedRole) {
          roleName = selectedRole.name;
        }
      }
      
      const payload = {
        fullname: editingUser.fullname,
        email: editingUser.email,
        phone: editingUser.phone,
        roleName: roleName,
        centerId: editingUser.centerId || null,
        departmentId: roleName !== "STUDENT" ? (editingUser.departmentId || null) : null,
        gender: editingUser.gender,
        dateOfBirth: editingUser.dateOfBirth,
        address: editingUser.address,
        status: editingUser.isActive === false ? "INACTIVE" : "ACTIVE",
        // Student-specific fields (only if role is STUDENT)
        ...(roleName === "STUDENT" && {
          parentName: editingUser.parentName || null,
          parentPhone: editingUser.parentPhone || null,
          parentEmail: editingUser.parentEmail || null,
          enrollmentNumber: editingUser.enrollmentNumber || null,
          classGrade: editingUser.classGrade || null,
          programId: editingUser.programId || editingUser.courseId || null,
          courseId: editingUser.programId || editingUser.courseId || null,
          classId: editingUser.classId || null,
        }),
      };
      
      await apiFetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      alert("User updated successfully!");
      setShowEditModal(false);
      setEditingUser(null);
      fetchData();
    } catch (error: any) {
      alert(error.message || "Failed to update user");
    }
  };

  const handleUpdatePassword = async () => {
    if (!selectedUser) return;
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setSavingPassword(true);
    try {
      await apiFetch(`/api/users/${selectedUser.id}/password`, {
        method: "PUT",
        body: JSON.stringify({ password: passwordForm.newPassword }),
      });
      alert("Password updated successfully!");
      setShowPasswordModal(false);
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      // Try alternative endpoint
      try {
        await apiFetch(`/api/users/${selectedUser.id}`, {
          method: "PUT",
          body: JSON.stringify({ ...selectedUser, password: passwordForm.newPassword }),
        });
        alert("Password updated successfully!");
        setShowPasswordModal(false);
        setPasswordForm({ newPassword: "", confirmPassword: "" });
      } catch (err: any) {
        alert(err.message || "Failed to update password");
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
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
      const nowActive = user.isActive === false; // toggling to active
      await apiFetch(`/api/users/${user.id}`, {
        method: "PUT",
        // Backend keys status off `status` (ACTIVE/INACTIVE), not `isActive`.
        body: JSON.stringify({
          fullname: user.fullname,
          email: user.email,
          roleName: (user as any).roleName,
          status: nowActive ? "ACTIVE" : "INACTIVE",
          isActive: nowActive,
        }),
      });
      fetchData();
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const openViewModal = (user: User) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser({ ...user });
    setShowEditModal(true);
  };

  const openPasswordModal = (user: User) => {
    setSelectedUser(user);
    setPasswordForm({ newPassword: "", confirmPassword: "" });
    setShowPasswordModal(true);
  };

  // Get center/department names
  const getCenterName = (centerId?: string) => centers.find(c => c.id === centerId)?.name || "-";
  const getDepartmentName = (departmentId?: string) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept?.departmentName || dept?.name || "-";
  };
  const getRoleName = (user: User) => user.roleName || user.role?.name || "User";
  
  const getSelectedRoleName = (roleId: string): string => {
    const role = roles.find(r => r.id === roleId);
    return role?.name?.toUpperCase() || "";
  };
  
  const isStudentRole = (roleId: string): boolean => getSelectedRoleName(roleId) === "STUDENT";

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);
    const matchesRole = !filterRole || getRoleName(user) === filterRole;
    const matchesCenter = !filterCenter || user.centerId === filterCenter;
    const matchesDepartment = !filterDepartment || user.departmentId === filterDepartment;
    const matchesStatus = !filterStatus || 
      (filterStatus === "active" && user.isActive !== false) ||
      (filterStatus === "inactive" && user.isActive === false);
    return matchesSearch && matchesRole && matchesCenter && matchesDepartment && matchesStatus;
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">👥 User Management</h1>
          <p className="text-gray-600">Manage all system users, roles, centers, and departments</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>➕</span> Add New User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Total Users</p>
          <p className="text-2xl font-bold text-blue-600">{users.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Active Users</p>
          <p className="text-2xl font-bold text-green-600">
            {users.filter(u => u.isActive !== false).length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Inactive Users</p>
          <p className="text-2xl font-bold text-red-600">
            {users.filter(u => u.isActive === false).length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Total Roles</p>
          <p className="text-2xl font-bold text-purple-600">{roles.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Centers</p>
          <p className="text-2xl font-bold text-orange-600">{centers.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="col-span-2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.name}>{role.name}</option>
            ))}
          </select>
          <select
            value={filterCenter}
            onChange={(e) => setFilterCenter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Centers</option>
            {centers.map((center) => (
              <option key={center.id} value={center.id}>{center.name}</option>
            ))}
          </select>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>{dept.departmentName || dept.name}</option>
            ))}
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

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">#</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">User</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Email</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Phone</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Role</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Center</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Department</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Created</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">No users found</td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr key={user.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openViewModal(user)}>
                    <td className="px-3 py-3 text-gray-500 text-sm">{index + 1}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                          {user.fullname?.charAt(0) || user.email?.charAt(0) || "U"}
                        </div>
                        <span className="font-medium text-sm">{user.fullname || user.name || "-"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-600 text-sm">{user.email}</td>
                    <td className="px-3 py-3 text-gray-600 text-sm">{user.phone || "-"}</td>
                    <td className="px-3 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {getRoleName(user)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-600 text-sm">{user.centerName || getCenterName(user.centerId)}</td>
                    <td className="px-3 py-3 text-gray-600 text-sm">{user.departmentName || getDepartmentName(user.departmentId)}</td>
                    <td className="px-3 py-3 text-gray-500 text-sm">{formatDate(user.createdAt)}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${user.isActive !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {user.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openViewModal(user)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded text-sm"
                          title="View Details"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded text-sm"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => openPasswordModal(user)}
                          className="p-1.5 text-yellow-600 hover:bg-yellow-100 rounded text-sm"
                          title="Change Password"
                        >
                          🔑
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded text-sm"
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

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-xl font-bold">👤 User Details</h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-gray-800 text-xl">✕</button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold">
                  {selectedUser.fullname?.charAt(0) || selectedUser.email?.charAt(0) || "U"}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedUser.fullname || selectedUser.name || "No Name"}</h2>
                  <p className="text-gray-500">{selectedUser.email}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${selectedUser.isActive !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {selectedUser.isActive !== false ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase mb-1">Role</p>
                  <p className="font-medium">{getRoleName(selectedUser)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase mb-1">Phone</p>
                  <p className="font-medium">{selectedUser.phone || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase mb-1">Center</p>
                  <p className="font-medium">{selectedUser.centerName || getCenterName(selectedUser.centerId)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase mb-1">Department</p>
                  <p className="font-medium">{selectedUser.departmentName || getDepartmentName(selectedUser.departmentId)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase mb-1">Date of Birth</p>
                  <p className="font-medium">{formatDate(selectedUser.dateOfBirth)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase mb-1">Gender</p>
                  <p className="font-medium">{selectedUser.gender || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 col-span-2">
                  <p className="text-xs text-gray-500 uppercase mb-1">Address</p>
                  <p className="font-medium">{selectedUser.address || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase mb-1">Created At</p>
                  <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase mb-1">Last Login</p>
                  <p className="font-medium">{formatDate(selectedUser.lastLoginAt)}</p>
                </div>
              </div>

              {/* View Full Profile Link */}
              <div className="mt-6 pt-4 border-t">
                <a
                  href={`/dashboard/chairman/users/${selectedUser.id}`}
                  className="block w-full text-center px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 font-medium mb-4"
                >
                  📋 View Full Profile (Login History, Activity, Payments, Attendance)
                </a>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowViewModal(false); openEditModal(selectedUser); }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  ✏️ Edit User
                </button>
                <button
                  onClick={() => { setShowViewModal(false); openPasswordModal(selectedUser); }}
                  className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                >
                  🔑 Change Password
                </button>
                <button
                  onClick={() => { handleToggleStatus(selectedUser); setShowViewModal(false); }}
                  className={`flex-1 px-4 py-2 rounded-lg ${selectedUser.isActive !== false ? "bg-red-600 text-white hover:bg-red-700" : "bg-green-600 text-white hover:bg-green-700"}`}
                >
                  {selectedUser.isActive !== false ? "🚫 Deactivate" : "✅ Activate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-xl font-bold">➕ Add New User</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-800 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={newUser.fullname}
                    onChange={(e) => setNewUser({ ...newUser, fullname: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={newUser.roleId}
                    onChange={(e) => setNewUser({ ...newUser, roleId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Center</label>
                  <select
                    value={newUser.centerId}
                    onChange={(e) => setNewUser({ ...newUser, centerId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Center</option>
                    {centers.map((center) => (
                      <option key={center.id} value={center.id}>{center.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Show non-ACADEMIC Departments for Staff/Teachers */}
                {!isStudentRole(newUser.roleId) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select
                      value={newUser.departmentId}
                      onChange={(e) => setNewUser({ ...newUser, departmentId: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Department</option>
                      {departments
                        .filter(dept => dept.departmentType !== 'ACADEMIC')
                        .map((dept) => (
                          <option key={dept.id} value={dept.id}>{dept.departmentName || dept.name}</option>
                        ))}
                    </select>
                  </div>
                )}
                {/* Show ACADEMIC Department for STUDENT role */}
                {isStudentRole(newUser.roleId) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Academic Department</label>
                    <select
                      value={newUser.departmentId}
                      onChange={(e) => setNewUser({ ...newUser, departmentId: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Academic Department</option>
                      {departments
                        .filter(dept => dept.departmentType === 'ACADEMIC')
                        .map((dept) => (
                          <option key={dept.id} value={dept.id}>{dept.departmentName || dept.name}</option>
                        ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={newUser.gender}
                    onChange={(e) => setNewUser({ ...newUser, gender: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              {/* Show Course and Class for STUDENT role */}
              {isStudentRole(newUser.roleId) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                    <select
                      value={newUser.programId}
                      onChange={(e) => setNewUser({ ...newUser, programId: e.target.value, classId: "" })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select program</option>
                      {programs.map((program) => (
                        <option key={program.id} value={program.id}>{program.programName || program.name || program.courseName || program.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class/Section</label>
                    <select
                      value={newUser.classId}
                      onChange={(e) => setNewUser({ ...newUser, classId: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Class</option>
                      {classes
                        .filter(cls => !newUser.programId || cls.programId === newUser.programId || cls.courseId === newUser.programId)
                        .map((cls) => (
                          <option key={cls.id} value={cls.id}>{cls.className || cls.name}</option>
                        ))}
                    </select>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={newUser.dateOfBirth}
                    onChange={(e) => setNewUser({ ...newUser, dateOfBirth: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={newUser.isActive ? "active" : "inactive"}
                    onChange={(e) => setNewUser({ ...newUser, isActive: e.target.value === "active" })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={newUser.address}
                  onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Enter address"
                />
              </div>

              {/* Student-Specific Fields (shown only when STUDENT role is selected) */}
              {isStudentRole(newUser.roleId) && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    👨‍👩‍👧 Parent/Guardian Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Parent Name</label>
                      <input
                        type="text"
                        value={newUser.parentName}
                        onChange={(e) => setNewUser({ ...newUser, parentName: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter parent/guardian name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Parent Phone</label>
                      <input
                        type="tel"
                        value={newUser.parentPhone}
                        onChange={(e) => setNewUser({ ...newUser, parentPhone: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter parent phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Parent Email</label>
                      <input
                        type="email"
                        value={newUser.parentEmail}
                        onChange={(e) => setNewUser({ ...newUser, parentEmail: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter parent email"
                      />
                    </div>
                  </div>
                  
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 mt-4 flex items-center gap-2">
                    🎓 Academic Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment/Roll Number</label>
                      <input
                        type="text"
                        value={newUser.enrollmentNumber}
                        onChange={(e) => setNewUser({ ...newUser, enrollmentNumber: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter enrollment number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Class/Grade</label>
                      <input
                        type="text"
                        value={newUser.classGrade}
                        onChange={(e) => setNewUser({ ...newUser, classGrade: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Grade 10, Class 12"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateUser}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-xl font-bold">✏️ Edit User</h3>
              <button onClick={() => { setShowEditModal(false); setEditingUser(null); }} className="text-gray-500 hover:text-gray-800 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editingUser.fullname || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, fullname: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingUser.email || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editingUser.phone || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={editingUser.roleId || editingUser.role?.id || roles.find(r => r.name === editingUser.roleName)?.id || ""}
                    onChange={(e) => {
                      const selectedRole = roles.find(r => r.id === e.target.value);
                      setEditingUser({ 
                        ...editingUser, 
                        roleId: e.target.value,
                        roleName: selectedRole?.name || editingUser.roleName
                      });
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Center</label>
                  <select
                    value={editingUser.centerId || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, centerId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Center</option>
                    {centers.map((center) => (
                      <option key={center.id} value={center.id}>{center.name}</option>
                    ))}
                  </select>
                </div>
                {/* Show non-ACADEMIC Departments for Staff/Teachers */}
                {!(editingUser.roleName === "STUDENT" || isStudentRole(editingUser.roleId || roles.find(r => r.name === editingUser.roleName)?.id || "")) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select
                      value={editingUser.departmentId || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, departmentId: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Department</option>
                      {departments
                        .filter(dept => dept.departmentType !== 'ACADEMIC')
                        .map((dept) => (
                          <option key={dept.id} value={dept.id}>{dept.departmentName || dept.name}</option>
                        ))}
                    </select>
                  </div>
                )}
                {/* Show ACADEMIC Department for STUDENT role */}
                {(editingUser.roleName === "STUDENT" || isStudentRole(editingUser.roleId || roles.find(r => r.name === editingUser.roleName)?.id || "")) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Academic Department</label>
                    <select
                      value={editingUser.departmentId || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, departmentId: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Academic Department</option>
                      {departments
                        .filter(dept => dept.departmentType === 'ACADEMIC')
                        .map((dept) => (
                          <option key={dept.id} value={dept.id}>{dept.departmentName || dept.name}</option>
                        ))}
                    </select>
                  </div>
                )}
              </div>
              {/* Show Course and Class for STUDENT role */}
              {(editingUser.roleName === "STUDENT" || isStudentRole(editingUser.roleId || roles.find(r => r.name === editingUser.roleName)?.id || "")) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course/Program</label>
                    <select
                      value={editingUser.programId || editingUser.courseId || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, programId: e.target.value, courseId: e.target.value, classId: "" })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select program</option>
                      {programs.map((program) => (
                        <option key={program.id} value={program.id}>{program.programName || program.name || program.courseName || program.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class/Section</label>
                    <select
                      value={editingUser.classId || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, classId: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Class</option>
                      {classes
                        .filter(cls => {
                          const pid = editingUser.programId || editingUser.courseId;
                          return !pid || cls.programId === pid || cls.courseId === pid;
                        })
                        .map((cls) => (
                          <option key={cls.id} value={cls.id}>{cls.className || cls.name}</option>
                        ))}
                    </select>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={editingUser.gender || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, gender: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editingUser.dateOfBirth?.split("T")[0] || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, dateOfBirth: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editingUser.isActive !== false ? "active" : "inactive"}
                    onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.value === "active" })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={editingUser.address || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, address: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>

              {/* Student-Specific Fields (shown only when STUDENT role is selected) */}
              {(editingUser.roleName === "STUDENT" || isStudentRole(editingUser.roleId || roles.find(r => r.name === editingUser.roleName)?.id || "")) && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    👨‍👩‍👧 Parent/Guardian Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Parent Name</label>
                      <input
                        type="text"
                        value={editingUser.parentName || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, parentName: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter parent/guardian name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Parent Phone</label>
                      <input
                        type="tel"
                        value={editingUser.parentPhone || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, parentPhone: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter parent phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Parent Email</label>
                      <input
                        type="email"
                        value={editingUser.parentEmail || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, parentEmail: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter parent email"
                      />
                    </div>
                  </div>
                  
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 mt-4 flex items-center gap-2">
                    🎓 Academic Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment/Roll Number</label>
                      <input
                        type="text"
                        value={editingUser.enrollmentNumber || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, enrollmentNumber: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter enrollment number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Class/Grade</label>
                      <input
                        type="text"
                        value={editingUser.classGrade || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, classGrade: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Grade 10, Class 12"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
                <button
                  onClick={() => { setShowEditModal(false); setEditingUser(null); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateUser}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-xl font-bold">🔑 Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-500 hover:text-gray-800 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">Changing password for: <strong>{selectedUser.fullname || selectedUser.email}</strong></p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm new password"
                />
              </div>
              {passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                <p className="text-red-500 text-sm">Passwords do not match</p>
              )}
              <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  disabled={savingPassword}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePassword}
                  className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                  disabled={savingPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                >
                  {savingPassword ? "Saving..." : "Update Password"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
