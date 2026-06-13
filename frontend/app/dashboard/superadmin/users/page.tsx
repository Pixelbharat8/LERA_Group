"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { useUserCenter, buildCenterFilterUrl } from "../../../hooks/useUserCenter";

interface User {
  id: string;
  email: string;
  fullname: string;
  roleName: string;
  status: string;
  createdAt: string;
  lastLogin?: string;
  departmentName?: string;
  officeType?: string;
  employeeCode?: string;
  jobTitle?: string;
  phone?: string;
  salary?: number;
  hourlyRate?: number;
  level?: number;
  employmentType?: string;
  reportsTo?: string;
  avatarUrl?: string;
}

interface Department {
  id: string;
  departmentCode: string;
  departmentName: string;
  departmentType: string;
  officeType: string;
}

interface Center {
  id: string;
  name: string;
  code: string;
}

export default function UsersPage() {
  const { centerId: userCenterId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullname: "",
    roleName: "TEACHER",
    officeType: "MAIN_OFFICE",
    departmentId: "",
    centerId: "",
    jobTitle: "",
    phone: "",
    salary: "",
    hourlyRate: "",
    employmentType: "FULL_TIME",
    reportsTo: ""
  });
  const [levelData, setLevelData] = useState({
    newRole: "",
    newSalary: "",
    newHourlyRate: "",
    effectiveDate: new Date().toISOString().substring(0, 10),
    reason: "",
    offerLetterNote: ""
  });

  // View user profile - fetch salary config from payroll service
  const onViewProfile = async (user: User) => {
    console.log("Opening profile for user:", user);
    // Fetch salary config from payroll service
    let userWithSalary = { ...user };
    try {
      const salaryData = await apiFetch(`/api/salary-config/teacher/${user.id}`);
      userWithSalary.salary = salaryData.baseSalary || undefined;
      userWithSalary.hourlyRate = salaryData.hourlyRate || undefined;
    } catch (err) {
      console.log('No salary config found for user');
    }
    console.log("Setting viewingUser and showProfileModal");
    setViewingUser(userWithSalary);
    setShowProfileModal(true);
  };

  useEffect(() => {
    if (!userLoading) {
      fetchUsers();
      fetchDepartments();
      fetchCenters();
    }
  }, [userLoading, userCenterId]);

  const fetchDepartments = async () => {
    try {
      const data = await apiFetch("/api/departments");
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  const fetchCenters = async () => {
    try {
      const data = await apiFetch("/api/centers");
      setCenters(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching centers:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const url = shouldFilterByCenter 
        ? buildCenterFilterUrl("/api/users", userCenterId)
        : "/api/users";
      const data = await apiFetch(url);
      setUsers(Array.isArray(data) ? data : []);
      setError("");
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError("Failed to fetch users - backend service may not be running");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-purple-100 text-purple-800";
      case "CENTER_ADMIN":
        return "bg-blue-100 text-blue-800";
      case "TEACHER":
        return "bg-green-100 text-green-800";
      case "STUDENT":
        return "bg-yellow-100 text-yellow-800";
      case "PARENT":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const onAddUser = () => {
    setShowAddModal(true);
    setFormData({
      email: "",
      password: "",
      fullname: "",
      roleName: "TEACHER",
      officeType: "MAIN_OFFICE",
      departmentId: "",
      centerId: "",
      jobTitle: "",
      phone: "",
      salary: "",
      hourlyRate: "",
      employmentType: "FULL_TIME",
      reportsTo: ""
    });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const data = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(formData)
      });

      if (!data.success) {
        throw new Error(data.message || "Failed to create user");
      }

      setShowAddModal(false);
      fetchUsers(); // Refresh the list
      alert("User created successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  const onEditUser = async (user: User) => {
    const permissions = canManageUser(user.roleName);
    
    if (!permissions.canEdit) {
      alert(permissions.reason || "You cannot edit this user!");
      return;
    }
    
    // Fetch salary config from payroll service
    let salary = user.salary?.toString() || "";
    let hourlyRate = user.hourlyRate?.toString() || "";
    
    try {
      const salaryData = await apiFetch(`/api/salary-config/teacher/${user.id}`);
      salary = salaryData.baseSalary?.toString() || "";
      hourlyRate = salaryData.hourlyRate?.toString() || "";
    } catch (err) {
      console.log('No salary config found for user');
    }
    
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: "",
      fullname: user.fullname,
      roleName: user.roleName,
      officeType: user.officeType || "MAIN_OFFICE",
      departmentId: "",
      centerId: "",
      jobTitle: user.jobTitle || "",
      phone: user.phone || "",
      salary: salary,
      hourlyRate: hourlyRate,
      employmentType: user.employmentType || "FULL_TIME",
      reportsTo: user.reportsTo || ""
    });
    setShowEditModal(true);
  };

  // Open Level Management Modal (Promotion/Demotion) - Only for L0 and L1
  const onManageLevel = async (user: User) => {
    const currentUserRole = getCurrentUserRole();
    const currentLevel = getRoleLevel(currentUserRole);
    
    if (currentLevel > 1) {
      alert("🚫 Only Chairman (L0) and CEO (L1) can manage levels and salaries!");
      return;
    }
    
    // Fetch salary config from payroll service
    let salary2 = user.salary?.toString() || "";
    let hourlyRate2 = user.hourlyRate?.toString() || "";
    
    try {
      const salaryData = await apiFetch(`/api/salary-config/teacher/${user.id}`);
      salary2 = salaryData.baseSalary?.toString() || "";
      hourlyRate2 = salaryData.hourlyRate?.toString() || "";
    } catch (err) {
      console.log('No salary config found for user');
    }
    
    setEditingUser(user);
    setLevelData({
      newRole: user.roleName,
      newSalary: salary2,
      newHourlyRate: hourlyRate2,
      effectiveDate: new Date().toISOString().substring(0, 10),
      reason: "",
      offerLetterNote: ""
    });
    setShowLevelModal(true);
  };

  // Role hierarchy levels - L0 is God of Gods
  const getRoleLevel = (roleName: string): number => {
    switch (roleName) {
      case "CHAIRMAN": return 0;      // L0 - God of Gods
      case "CEO": return 1;           // L1 - Second highest
      case "SUPER_ADMIN": return 2;   // L2 - System admin
      case "DIRECTOR": return 3;      // L3
      case "ADMIN": return 4;         // L4
      case "CENTER_MANAGER": return 5;
      case "ACADEMIC_MANAGER": return 6;
      case "TEACHER": return 7;
      case "TA": return 8;
      case "STAFF": return 8;
      case "STUDENT": return 9;
      case "PARENT": return 10;
      default: return 99;
    }
  };

  // Get current user's role from cookie
  const getCurrentUserRole = (): string => {
    if (typeof window !== 'undefined') {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        if (key === 'actualRole') return value || 'SUPER_ADMIN';
      }
    }
    return 'SUPER_ADMIN'; // Default assumption
  };

  // Check if current user can manage target user
  const canManageUser = (targetRole: string): { canEdit: boolean; canDisable: boolean; canDelete: boolean; reason?: string } => {
    const currentUserRole = getCurrentUserRole();
    const currentLevel = getRoleLevel(currentUserRole);
    const targetLevel = getRoleLevel(targetRole);
    
    // L0 (Chairman) can manage EVERYONE including L1 and L2
    if (currentLevel === 0) {
      // Chairman cannot delete themselves
      if (targetLevel === 0) {
        return { 
          canEdit: true, 
          canDisable: false, 
          canDelete: false, 
          reason: "👑 You cannot disable/delete yourself!" 
        };
      }
      // Chairman can do anything to everyone else
      return { canEdit: true, canDisable: true, canDelete: true };
    }
    
    // L1 (CEO) can manage L2 and below
    if (currentLevel === 1) {
      if (targetLevel === 0) {
        return { 
          canEdit: false, 
          canDisable: false, 
          canDelete: false, 
          reason: "👑 Chairman (L0) is the God of Gods and cannot be modified!" 
        };
      }
      if (targetLevel === 1) {
        return { 
          canEdit: true, 
          canDisable: false, 
          canDelete: false, 
          reason: "🎯 You cannot disable/delete yourself or other CEOs" 
        };
      }
      return { canEdit: true, canDisable: true, canDelete: true };
    }
    
    // L2 (Super Admin) can manage L3 and below only
    if (currentLevel === 2) {
      if (targetLevel === 0) {
        return { 
          canEdit: false, 
          canDisable: false, 
          canDelete: false, 
          reason: "👑 Chairman (L0) is the God of Gods and cannot be modified!" 
        };
      }
      if (targetLevel === 1) {
        return { 
          canEdit: false, 
          canDisable: false, 
          canDelete: false, 
          reason: "🎯 CEO (L1) can only be managed by Chairman (L0)" 
        };
      }
      if (targetLevel === 2) {
        return { 
          canEdit: true, 
          canDisable: false, 
          canDelete: false, 
          reason: "⚡ Super Admins cannot disable/delete other Super Admins" 
        };
      }
      return { canEdit: true, canDisable: true, canDelete: true };
    }
    
    // Lower level users can only manage those below them
    if (targetLevel <= currentLevel) {
      return { 
        canEdit: false, 
        canDisable: false, 
        canDelete: false, 
        reason: `You can only manage users below your level (L${currentLevel})` 
      };
    }
    
    return { canEdit: true, canDisable: true, canDelete: true };
  };

  const onDisableUser = async (user: User) => {
    const permissions = canManageUser(user.roleName);
    
    if (!permissions.canDisable) {
      alert(permissions.reason || "You cannot disable this user!");
      return;
    }

    // Warning for high-level accounts
    if (getRoleLevel(user.roleName) <= 2) {
      const confirmDisable = confirm(
        `⚠️ WARNING: You are about to disable a Super Admin account!\n\n` +
        `Make sure there's another active Super Admin before proceeding.\n\n` +
        `Continue?`
      );
      if (!confirmDisable) return;
    }

    if (!confirm(`Are you sure you want to disable ${user.fullname || user.email}?\n\nThey will not be able to login until re-enabled.`)) {
      return;
    }

    try {
      const data = await apiFetch(`/api/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          fullname: user.fullname,
          roleName: user.roleName,
          status: "INACTIVE"
        })
      });

      if (!data.success) {
        throw new Error(data.message || "Failed to disable user");
      }

      alert("✅ User disabled successfully! They cannot login anymore.");
      fetchUsers(); // Refresh the list
    } catch (err: any) {
      alert("❌ Error: " + (err.message || "Failed to disable user"));
      console.error("Disable error:", err);
    }
  };

  const onEnableUser = async (user: User) => {
    if (!confirm(`Are you sure you want to enable ${user.fullname || user.email}?\n\nThey will be able to login again.`)) {
      return;
    }

    try {
      const data = await apiFetch(`/api/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          fullname: user.fullname,
          roleName: user.roleName,
          status: "ACTIVE"
        })
      });

      if (!data.success) {
        throw new Error(data.message || "Failed to enable user");
      }

      alert("✅ User enabled successfully! They can login now.");
      fetchUsers(); // Refresh the list
    } catch (err: any) {
      alert("❌ Error: " + (err.message || "Failed to enable user"));
      console.error("Enable error:", err);
    }
  };

  const onDeleteUser = async (user: User) => {
    const permissions = canManageUser(user.roleName);
    
    if (!permissions.canDelete) {
      alert(permissions.reason || "You cannot delete this user!");
      return;
    }

    if (!confirm(`⚠️ WARNING: Are you sure you want to PERMANENTLY DELETE ${user.fullname || user.email}?\n\nThis action CANNOT be undone!\n\nNote: If this user has related records (teachers, students, etc.), deletion will fail. In that case, use DISABLE instead.`)) {
      return;
    }

    // Double confirmation for delete
    if (!confirm(`This is your FINAL WARNING!\n\nDelete user: ${user.email}?\n\nClick OK to proceed.`)) {
      return;
    }

    try {
      const data = await apiFetch(`/api/users/${user.id}`, {
        method: "DELETE"
      });

      if (!data.success) {
        // Check for foreign key constraint error
        const errorMsg = data.message || "";
        if (errorMsg.includes("foreign key") || errorMsg.includes("constraint") || errorMsg.includes("referenced")) {
          throw new Error(
            "❌ Cannot delete this user because they have related records (teacher profile, attendance, payroll, etc.).\n\n" +
            "✅ SOLUTION: Use the DISABLE button instead to deactivate the account while preserving data integrity."
          );
        }
        throw new Error(data.message || "Failed to delete user");
      }

      alert("✅ User deleted successfully!");
      fetchUsers(); // Refresh the list
    } catch (err: any) {
      // Show detailed error message
      const errorMessage = err.message || "Failed to delete user";
      alert(errorMessage);
      
      // If foreign key error, suggest disable instead
      if (errorMessage.includes("foreign key") || errorMessage.includes("constraint") || errorMessage.includes("Cannot delete")) {
        alert("💡 TIP: Click the DISABLE button instead to deactivate this user's account.");
      }
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const actionLabel = user.status === "PENDING" ? "Approve (activate)" : `Change status to ${newStatus}`;
    if (!confirm(`${actionLabel} for ${user.fullname || user.email}?`)) return;
    try {
      await apiFetch(`/api/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...user, status: newStatus }),
      });
      fetchUsers();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSaving(true);
    setError("");

    try {
      const updateData: any = {
        email: formData.email,
        fullname: formData.fullname,
        roleName: formData.roleName,
        status: editingUser.status,
        officeType: formData.officeType,
        jobTitle: formData.jobTitle,
        phone: formData.phone,
        employmentType: formData.employmentType,
        reportsTo: formData.reportsTo
      };

      // Only include password if it's been changed
      if (formData.password) {
        updateData.password = formData.password;
      }

      const data = await apiFetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        body: JSON.stringify(updateData)
      });

      if (!data.success) {
        throw new Error(data.message || "Failed to update user");
      }

      // Update salary config in payroll service if salary or hourlyRate is provided
      if (formData.salary || formData.hourlyRate) {
        try {
          await apiFetch(`/api/salary-config/teacher/${editingUser.id}`, {
            method: "PUT",
            body: JSON.stringify({
              baseSalary: formData.salary ? parseFloat(formData.salary) : 0,
              hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : 0,
              salaryType: formData.employmentType === 'FULL_TIME' ? 'MONTHLY' : 'HOURLY'
            })
          });
        } catch (salaryErr) {
          console.error('Failed to update salary config:', salaryErr);
          // Don't throw - user was still updated
        }
      }

      // Create updated user object for profile view
      const updatedUser: User = {
        ...editingUser,
        email: formData.email,
        fullname: formData.fullname,
        roleName: formData.roleName,
        officeType: formData.officeType,
        jobTitle: formData.jobTitle,
        phone: formData.phone,
        salary: formData.salary ? parseFloat(formData.salary) : undefined,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
        employmentType: formData.employmentType,
        reportsTo: formData.reportsTo
      };

      // Update viewingUser if profile modal is open for this user
      if (viewingUser && viewingUser.id === editingUser.id) {
        setViewingUser(updatedUser);
      }

      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers(); // Refresh the list
      alert("User updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/superadmin" className="hover:text-blue-600">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-gray-900">Users</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
             User Management
          </h1>
          <p className="text-gray-500">Manage all system users and roles</p>
        </div>
        <button
          onClick={onAddUser}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
           Add User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
              
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              <p className="text-sm text-gray-500">Total Users</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
              
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{users.filter((u) => u.status === "ACTIVE").length}</p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-2xl">
              ⏳
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{users.filter((u) => u.status === "PENDING").length}</p>
              <p className="text-sm text-gray-500">Pending Approval</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">{error}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No users found or authentication required.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const permissions = canManageUser(user.roleName);
                  const roleLevel = getRoleLevel(user.roleName);
                  
                  return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            console.log("Clicked on name:", user.fullname);
                            onViewProfile(user);
                          }}
                          className="hover:text-blue-600 hover:underline cursor-pointer"
                        >
                          {user.fullname || "-"}
                        </button>
                        {roleLevel === 0 && <span title="L0 - God of Gods">👑</span>}
                        {roleLevel === 1 && <span title="L1 - CEO">🎯</span>}
                        {roleLevel === 2 && <span title="L2 - Super Admin">⚡</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.roleName)}`}>{user.roleName}</span>
                        <span className="text-xs text-gray-400">L{roleLevel}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          user.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                          user.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {permissions.canEdit ? (
                          <button
                            onClick={() => onEditUser(user)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                            title="Edit user"
                          >
                            Edit
                          </button>
                        ) : (
                          <span className="text-gray-300 cursor-not-allowed" title={permissions.reason}>Edit</span>
                        )}
                        
                        {user.status === "ACTIVE" ? (
                          permissions.canDisable ? (
                            <button
                              onClick={() => onDisableUser(user)}
                              className="text-orange-600 hover:text-orange-800 font-medium"
                              title="Disable user"
                            >
                              Disable
                            </button>
                          ) : (
                            <span className="text-gray-300 cursor-not-allowed" title={permissions.reason}>Disable</span>
                          )
                        ) : user.status === "PENDING" ? (
                          <button
                            onClick={() => onEnableUser(user)}
                            className="text-emerald-600 hover:text-emerald-800 font-semibold bg-emerald-50 px-2 py-1 rounded"
                            title="Approve and activate this user"
                          >
                            ✅ Approve
                          </button>
                        ) : (
                          <button
                            onClick={() => onEnableUser(user)}
                            className="text-green-600 hover:text-green-800 font-medium"
                            title="Enable user"
                          >
                            Enable
                          </button>
                        )}
                        
                        {permissions.canDelete ? (
                          <button
                            onClick={() => onDeleteUser(user)}
                            className="text-red-600 hover:text-red-800 font-medium"
                            title="Delete user permanently"
                          >
                            Delete
                          </button>
                        ) : (
                          <span className="text-gray-300 cursor-not-allowed" title={permissions.reason}>Delete</span>
                        )}
                        
                        {/* Level Management - Only for L0 and L1 */}
                        {getRoleLevel(getCurrentUserRole()) <= 1 && roleLevel > 1 && (
                          <button
                            onClick={() => onManageLevel(user)}
                            className="text-purple-600 hover:text-purple-800 font-medium"
                            title="Manage Level & Promotion (L0/L1 Only)"
                          >
                            📈 Level
                          </button>
                        )}
                        
                        {/* View Profile Button */}
                        <button
                          onClick={() => {
                            console.log("Profile button clicked for:", user.fullname);
                            onViewProfile(user);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                          title="View full profile"
                        >
                          👤 Profile
                        </button>
                      </div>
                    </td>
                  </tr>
                );})
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Add New User</h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              {/* Basic Info Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">👤 Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.fullname}
                      onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+84 xxx xxx xxx"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              {/* Role & Organization Section */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">🏢 Role & Organization</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role * (Level: L{getRoleLevel(formData.roleName)})
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.roleName}
                      onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                    >
                      {/* Only L0/L1 can assign Executive roles */}
                      {getRoleLevel(getCurrentUserRole()) <= 1 && (
                        <optgroup label="🏆 Executive (L0-L1) - Chairman/CEO Only">
                          <option value="CHAIRMAN">👑 L0 - Chairman (God of Gods)</option>
                          <option value="CEO">🎯 L1 - CEO</option>
                        </optgroup>
                      )}
                      <optgroup label="⚡ Leadership (L2-L3)">
                        <option value="SUPER_ADMIN">⚡ L2 - Super Admin</option>
                        <option value="DIRECTOR">📊 L3 - Director</option>
                      </optgroup>
                      <optgroup label="🔧 Management (L4-L6)">
                        <option value="ADMIN">⚙️ L4 - Admin</option>
                        <option value="CENTER_MANAGER">🏫 L5 - Center Manager</option>
                        <option value="ACADEMIC_MANAGER">📋 L6 - Academic Manager</option>
                      </optgroup>
                      <optgroup label="👨‍🏫 Staff (L7-L8)">
                        <option value="TEACHER">👨‍🏫 L7 - Teacher</option>
                        <option value="TA">👩‍🎓 L8 - Teaching Assistant</option>
                        <option value="STAFF">👔 L8 - Staff</option>
                      </optgroup>
                      <optgroup label="👤 Users (L9-L10)">
                        <option value="STUDENT">🎓 L9 - Student</option>
                        <option value="PARENT">👪 L10 - Parent</option>
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      placeholder="e.g., Senior Teacher, HR Manager"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Office Type *
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.officeType}
                      onChange={(e) => setFormData({ ...formData, officeType: e.target.value })}
                    >
                      <option value="HEAD_OFFICE">👑 Head Office (CEO/Chairman)</option>
                      <option value="MAIN_OFFICE">🏢 Main Office</option>
                      <option value="BRANCH">🏪 Branch</option>
                      <option value="SATELLITE">📍 Satellite Office</option>
                      <option value="REMOTE">🏠 Remote</option>
                    </select>
                  </div>

                  {formData.officeType === "BRANCH" && centers.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Branch/Center
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.centerId}
                        onChange={(e) => setFormData({ ...formData, centerId: e.target.value })}
                      >
                        <option value="">Select Branch...</option>
                        {centers.map((center) => (
                          <option key={center.id} value={center.id}>
                            {center.name} ({center.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className={formData.officeType !== "BRANCH" ? "md:col-span-2" : ""}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    >
                      <option value="">Select Department...</option>
                      {departments
                        .filter(d => {
                          if (formData.officeType === "HEAD_OFFICE") return d.officeType === "HEAD_OFFICE";
                          if (formData.officeType === "MAIN_OFFICE") return d.officeType === "MAIN_OFFICE";
                          return true;
                        })
                        .map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.departmentName} ({dept.departmentType})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employment Type
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.employmentType}
                      onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                    >
                      <option value="FULL_TIME">Full Time</option>
                      <option value="PART_TIME">Part Time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="INTERN">Intern</option>
                      <option value="FREELANCE">Freelance</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Salary Section - Only for L0 and L1 */}
              {getRoleLevel(getCurrentUserRole()) <= 1 && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-gray-700 mb-3">💰 Salary & Compensation (L0/L1 Only)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Starting Salary (VND/month)
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                        placeholder="e.g., 15000000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hourly Rate (VND/hour)
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        value={formData.hourlyRate}
                        onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                        placeholder="e.g., 150000"
                      />
                      <p className="text-xs text-gray-500 mt-1">For part-time/hourly</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reports To
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        value={formData.reportsTo}
                        onChange={(e) => setFormData({ ...formData, reportsTo: e.target.value })}
                      >
                        <option value="">Select Manager...</option>
                        {users
                          .filter(u => getRoleLevel(u.roleName) < getRoleLevel(formData.roleName))
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.fullname} ({u.roleName})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm">
                <p className="text-yellow-800">
                  💡 <strong>Note:</strong> Employee code will be generated automatically based on role (e.g., TCH-2025-001 for Teachers).
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal - Comprehensive */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Edit User</h2>
              <span className="text-sm text-gray-500">
                {editingUser.employeeCode || "No Employee Code"}
              </span>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-4">
              {/* Basic Info Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">👤 Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.fullname}
                      onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+84 xxx xxx xxx"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password (leave blank to keep current)
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      minLength={6}
                      placeholder="Enter new password or leave blank"
                    />
                  </div>
                </div>
              </div>

              {/* Role & Organization Section */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">🏢 Role & Organization</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role (Level: L{getRoleLevel(formData.roleName)})
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.roleName}
                      onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                    >
                      <optgroup label="🏆 Executive (L0-L1) - Chairman/CEO Only">
                        <option value="CHAIRMAN">👑 L0 - Chairman</option>
                        <option value="CEO">🎯 L1 - CEO</option>
                      </optgroup>
                      <optgroup label="⚡ Leadership (L2-L3)">
                        <option value="SUPER_ADMIN">⚡ L2 - Super Admin</option>
                        <option value="DIRECTOR">📊 L3 - Director</option>
                      </optgroup>
                      <optgroup label="🔧 Management (L4-L6)">
                        <option value="ADMIN">⚙️ L4 - Admin</option>
                        <option value="CENTER_MANAGER">🏫 L5 - Center Manager</option>
                        <option value="ACADEMIC_MANAGER">📋 L6 - Academic Manager</option>
                      </optgroup>
                      <optgroup label="👨‍🏫 Staff (L7-L8)">
                        <option value="TEACHER">👨‍🏫 L7 - Teacher</option>
                        <option value="TA">👩‍🎓 L8 - Teaching Assistant</option>
                        <option value="STAFF">👔 L8 - Staff</option>
                      </optgroup>
                      <optgroup label="👤 Users (L9-L10)">
                        <option value="STUDENT">🎓 L9 - Student</option>
                        <option value="PARENT">👪 L10 - Parent</option>
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      placeholder="e.g., Senior Teacher, HR Manager"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Office Type
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.officeType}
                      onChange={(e) => setFormData({ ...formData, officeType: e.target.value })}
                    >
                      <option value="HEAD_OFFICE">👑 Head Office (CEO/Chairman)</option>
                      <option value="MAIN_OFFICE">🏢 Main Office</option>
                      <option value="BRANCH">🏪 Branch</option>
                      <option value="SATELLITE">📍 Satellite Office</option>
                      <option value="REMOTE">🏠 Remote</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employment Type
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.employmentType}
                      onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                    >
                      <option value="FULL_TIME">Full Time</option>
                      <option value="PART_TIME">Part Time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="INTERN">Intern</option>
                      <option value="FREELANCE">Freelance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    >
                      <option value="">Select Department...</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.departmentName} ({dept.officeType})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reports To
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.reportsTo}
                      onChange={(e) => setFormData({ ...formData, reportsTo: e.target.value })}
                    >
                      <option value="">Select Manager...</option>
                      {users
                        .filter(u => getRoleLevel(u.roleName) < getRoleLevel(formData.roleName))
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.fullname} ({u.roleName})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Salary Section - Only visible to L0 and L1 */}
              {getCurrentUserRole() && getRoleLevel(getCurrentUserRole()) <= 1 && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-gray-700 mb-3">💰 Salary & Compensation (L0/L1 Only)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Salary (VND)
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                        placeholder="e.g., 15000000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hourly Rate (VND/hour)
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        value={formData.hourlyRate}
                        onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                        placeholder="e.g., 150000"
                      />
                      <p className="text-xs text-gray-500 mt-1">For part-time/hourly employees</p>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => onManageLevel(editingUser)}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        📈 Manage Level & Promotion
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm">
                <p className="text-yellow-800">
                  💡 <strong>Note:</strong> Changing roles may affect permissions. Use "Manage Level & Promotion" for formal promotions with offer letters.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    setError("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? "Updating..." : "Update User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Level Management Modal - Only for Chairman (L0) and CEO (L1) */}
      {showLevelModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">📈</span>
              <div>
                <h2 className="text-2xl font-bold text-purple-900">Level & Promotion Management</h2>
                <p className="text-sm text-gray-500">👑 Only Chairman (L0) and CEO (L1) can access this</p>
              </div>
            </div>

            {/* Current Status */}
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">📋 Current Employee Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Employee</p>
                  <p className="font-bold">{editingUser.fullname}</p>
                </div>
                <div>
                  <p className="text-gray-500">Current Role</p>
                  <p className="font-bold">{editingUser.roleName} (L{getRoleLevel(editingUser.roleName)})</p>
                </div>
                <div>
                  <p className="text-gray-500">Employee Code</p>
                  <p className="font-bold">{editingUser.employeeCode || "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Current Salary</p>
                  <p className="font-bold">{editingUser.salary ? `${editingUser.salary.toLocaleString()} VND` : "Not Set"}</p>
                </div>
              </div>
            </div>

            {/* Promotion/Demotion Form */}
            <div className="space-y-4">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-3">🚀 New Position</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Role/Level
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={levelData.newRole}
                      onChange={(e) => setLevelData({ ...levelData, newRole: e.target.value })}
                    >
                      <optgroup label="🏆 Executive (L0-L1)">
                        <option value="CHAIRMAN">👑 L0 - Chairman (God of Gods)</option>
                        <option value="CEO">🎯 L1 - CEO</option>
                      </optgroup>
                      <optgroup label="⚡ Leadership (L2-L3)">
                        <option value="SUPER_ADMIN">⚡ L2 - Super Admin</option>
                        <option value="DIRECTOR">📊 L3 - Director</option>
                      </optgroup>
                      <optgroup label="🔧 Management (L4-L6)">
                        <option value="ADMIN">⚙️ L4 - Admin</option>
                        <option value="CENTER_MANAGER">🏫 L5 - Center Manager</option>
                        <option value="ACADEMIC_MANAGER">📋 L6 - Academic Manager</option>
                      </optgroup>
                      <optgroup label="👨‍🏫 Staff (L7-L8)">
                        <option value="TEACHER">👨‍🏫 L7 - Teacher</option>
                        <option value="TA">👩‍🎓 L8 - Teaching Assistant</option>
                        <option value="STAFF">👔 L8 - Staff</option>
                      </optgroup>
                    </select>
                    {getRoleLevel(levelData.newRole) < getRoleLevel(editingUser.roleName) && (
                      <p className="text-green-600 text-sm mt-1">⬆️ Promotion</p>
                    )}
                    {getRoleLevel(levelData.newRole) > getRoleLevel(editingUser.roleName) && (
                      <p className="text-red-600 text-sm mt-1">⬇️ Demotion</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Salary (VND/month)
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={levelData.newSalary}
                      onChange={(e) => setLevelData({ ...levelData, newSalary: e.target.value })}
                      placeholder="e.g., 25000000"
                    />
                    {editingUser.salary && levelData.newSalary && (
                      <p className={`text-sm mt-1 ${parseInt(levelData.newSalary) > editingUser.salary ? 'text-green-600' : 'text-red-600'}`}>
                        {parseInt(levelData.newSalary) > editingUser.salary 
                          ? `⬆️ +${(parseInt(levelData.newSalary) - editingUser.salary).toLocaleString()} VND increase`
                          : `⬇️ ${(editingUser.salary - parseInt(levelData.newSalary)).toLocaleString()} VND decrease`
                        }
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Hourly Rate (VND/hour)
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={levelData.newHourlyRate}
                      onChange={(e) => setLevelData({ ...levelData, newHourlyRate: e.target.value })}
                      placeholder="e.g., 200000"
                    />
                    <p className="text-xs text-gray-500 mt-1">For part-time/hourly staff</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Effective Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={levelData.effectiveDate}
                      onChange={(e) => setLevelData({ ...levelData, effectiveDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Change
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={levelData.reason}
                      onChange={(e) => setLevelData({ ...levelData, reason: e.target.value })}
                    >
                      <option value="">Select reason...</option>
                      <option value="PROMOTION">Promotion - Performance Excellence</option>
                      <option value="ANNUAL_REVIEW">Annual Performance Review</option>
                      <option value="ROLE_CHANGE">Role/Position Change</option>
                      <option value="SALARY_ADJUSTMENT">Salary Adjustment</option>
                      <option value="DEMOTION">Demotion - Performance Issue</option>
                      <option value="RESTRUCTURING">Company Restructuring</option>
                      <option value="NEW_HIRE">New Hire Package</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Offer Letter Notes */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="font-semibold text-yellow-900 mb-3">📝 Offer Letter Notes</h3>
                <textarea
                  className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  rows={4}
                  value={levelData.offerLetterNote}
                  onChange={(e) => setLevelData({ ...levelData, offerLetterNote: e.target.value })}
                  placeholder="Enter any special notes, benefits, or conditions for the offer letter...

Example:
- Welcome bonus: 2,000,000 VND
- Extra annual leave: 5 days
- Company laptop provided
- Remote work: 2 days/week allowed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowLevelModal(false);
                    setEditingUser(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Generate offer letter preview
                    const preview = `
═══════════════════════════════════════════
           LERA ACADEMY
         OFFER LETTER / PROMOTION LETTER
═══════════════════════════════════════════

Date: ${new Date().toLocaleDateString()}
Effective Date: ${levelData.effectiveDate}

Dear ${editingUser.fullname},

We are pleased to ${getRoleLevel(levelData.newRole) < getRoleLevel(editingUser.roleName) ? 'promote you to' : 'offer you the position of'}:

📋 NEW POSITION: ${levelData.newRole} (Level L${getRoleLevel(levelData.newRole)})
💰 NEW SALARY: ${parseInt(levelData.newSalary || '0').toLocaleString()} VND/month
📅 EFFECTIVE: ${levelData.effectiveDate}

Reason: ${levelData.reason || 'N/A'}

${levelData.offerLetterNote ? `\nAdditional Notes:\n${levelData.offerLetterNote}` : ''}

═══════════════════════════════════════════
Approved by: ${getCurrentUserRole()} - ${new Date().toLocaleString()}
═══════════════════════════════════════════
                    `;
                    alert(preview);
                  }}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  👁️ Preview Offer Letter
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!levelData.newRole || !levelData.newSalary || !levelData.reason) {
                      alert("Please fill in all required fields!");
                      return;
                    }
                    
                    if (!confirm(`
⚠️ CONFIRM LEVEL CHANGE

Employee: ${editingUser.fullname}
From: ${editingUser.roleName} → To: ${levelData.newRole}
New Salary: ${parseInt(levelData.newSalary).toLocaleString()} VND
Effective: ${levelData.effectiveDate}

This action will update the employee's role and salary.
Continue?
                    `)) return;

                    try {
                      setSaving(true);
                      // Update user role in identity service
                      const data = await apiFetch(`/api/users/${editingUser.id}`, {
                        method: "PUT",
                        body: JSON.stringify({
                          email: editingUser.email,
                          fullname: editingUser.fullname,
                          roleName: levelData.newRole,
                          status: editingUser.status
                        })
                      });

                      if (!data.success) {
                        throw new Error(data.message || "Failed to update level");
                      }

                      // Update salary config in payroll service
                      try {
                        await apiFetch(`/api/salary-config/teacher/${editingUser.id}`, {
                          method: "PUT",
                          body: JSON.stringify({
                            baseSalary: parseFloat(levelData.newSalary) || 0,
                            hourlyRate: parseFloat(levelData.newHourlyRate) || 0,
                            salaryType: "MONTHLY"
                          })
                        });
                      } catch (salaryErr) {
                        console.error('Failed to update salary config:', salaryErr);
                      }

                      alert(`✅ Success! ${editingUser.fullname} has been ${getRoleLevel(levelData.newRole) < getRoleLevel(editingUser.roleName) ? 'promoted' : 'updated'} to ${levelData.newRole}!`);
                      setShowLevelModal(false);
                      setEditingUser(null);
                      fetchUsers();
                    } catch (err: any) {
                      alert("❌ Error: " + (err.message || "Failed to update level"));
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? "Processing..." : "✅ Confirm & Apply Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showProfileModal && viewingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Profile Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-3xl text-white font-bold">
                  {viewingUser.fullname?.charAt(0) || "U"}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    {viewingUser.fullname}
                    {getRoleLevel(viewingUser.roleName) === 0 && <span>👑</span>}
                    {getRoleLevel(viewingUser.roleName) === 1 && <span>🎯</span>}
                    {getRoleLevel(viewingUser.roleName) === 2 && <span>⚡</span>}
                  </h2>
                  <p className="text-gray-500">{viewingUser.jobTitle || viewingUser.roleName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => handleToggleStatus(viewingUser)}
                      className={`px-2 py-1 text-xs rounded-full cursor-pointer hover:opacity-80 ${viewingUser.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {viewingUser.status}
                    </button>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      L{getRoleLevel(viewingUser.roleName)} - {viewingUser.roleName}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  setViewingUser(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Profile Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span>👤</span> Basic Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Employee Code</span>
                    <span className="font-medium">{viewingUser.employeeCode || "Not Assigned"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium">{viewingUser.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone</span>
                    <span className="font-medium">{viewingUser.phone || "Not Set"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Office Type</span>
                    <span className="font-medium">{viewingUser.officeType || "Not Set"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Department</span>
                    <span className="font-medium">{viewingUser.departmentName || "Not Assigned"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Employment Type</span>
                    <span className="font-medium">{viewingUser.employmentType || "FULL_TIME"}</span>
                  </div>
                </div>
              </div>

              {/* Role & Level */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span>🏆</span> Role & Level
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Current Role</span>
                    <span className="font-medium">{viewingUser.roleName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Level</span>
                    <span className="font-medium text-blue-600">L{getRoleLevel(viewingUser.roleName)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Job Title</span>
                    <span className="font-medium">{viewingUser.jobTitle || "Not Set"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Reports To</span>
                    <span className="font-medium">{viewingUser.reportsTo ? users.find(u => u.id === viewingUser.reportsTo)?.fullname || "Unknown" : "No Manager"}</span>
                  </div>
                </div>
              </div>

              {/* Compensation (L0/L1 Only) */}
              {getRoleLevel(getCurrentUserRole()) <= 1 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span>💰</span> Compensation (Confidential)
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Monthly Salary</span>
                      <span className="font-medium text-green-600">
                        {viewingUser.salary ? `${viewingUser.salary.toLocaleString()} VND` : "Not Set"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Hourly Rate</span>
                      <span className="font-medium text-green-600">
                        {viewingUser.hourlyRate ? `${viewingUser.hourlyRate.toLocaleString()} VND/hour` : "Not Set"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Annual Salary (Est.)</span>
                      <span className="font-medium text-green-600">
                        {viewingUser.salary ? `${(viewingUser.salary * 12).toLocaleString()} VND` : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Tracking */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span>📊</span> Activity Tracking
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Account Created</span>
                    <span className="font-medium">{viewingUser.createdAt ? new Date(viewingUser.createdAt).toLocaleDateString() : "Unknown"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Login</span>
                    <span className="font-medium">{viewingUser.lastLogin ? new Date(viewingUser.lastLogin).toLocaleString() : "Never"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Account Status</span>
                    <span className={`font-medium ${viewingUser.status === "ACTIVE" ? "text-green-600" : "text-red-600"}`}>
                      {viewingUser.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-4">⚡ Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    setViewingUser(null);
                    onEditUser(viewingUser);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ✏️ Edit User
                </button>
                
                {getRoleLevel(getCurrentUserRole()) <= 1 && getRoleLevel(viewingUser.roleName) > 1 && (
                  <button
                    onClick={() => {
                      setShowProfileModal(false);
                      setViewingUser(null);
                      onManageLevel(viewingUser);
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    📈 Manage Level & Promotion
                  </button>
                )}
                
                <Link
                  href={`/dashboard/superadmin/attendance?userId=${viewingUser.id}`}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  📅 View Attendance
                </Link>
                
                <Link
                  href={`/dashboard/superadmin/payroll?userId=${viewingUser.id}`}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  💵 View Payroll
                </Link>
                
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    setViewingUser(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Role History (Placeholder) */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-4">📜 Role History</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="font-medium">Joined as {viewingUser.roleName}</p>
                      <p className="text-gray-500">{viewingUser.createdAt ? new Date(viewingUser.createdAt).toLocaleDateString() : "Unknown date"}</p>
                    </div>
                  </div>
                  {/* More history items would come from an API */}
                  <p className="text-xs text-gray-400 mt-2">
                    💡 Full promotion/demotion history will be tracked here once role changes are made.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
