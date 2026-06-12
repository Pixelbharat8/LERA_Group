"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

interface Role {
  id: string;
  name: string;
  displayName?: string;
  displayNameVi?: string;
  description?: string;
  level?: number;
  isSystemRole?: boolean;
  usersCount?: number;
  permissions?: string[];
}

interface Permission {
  id: string;
  code: string;
  name: string;
  module: string;
  description?: string;
}

interface User {
  id: string;
  fullname: string;
  email: string;
  phone?: string;
  status: string;
  roleId?: string;
  role?: Role;
  avatarUrl?: string;
  centerId?: string;
  permissions?: UserPermission;
}

interface UserPermission {
  dashboard: boolean;
  centers: boolean;
  users: boolean;
  students: boolean;
  teachers: boolean;
  classes: boolean;
  courses: boolean;
  attendance: boolean;
  payments: boolean;
  payroll: boolean;
  reports: boolean;
  settings: boolean;
  ai_assistant: boolean;
  communication: boolean;
  documents: boolean;
}

const DEFAULT_PERMISSIONS: UserPermission = {
  dashboard: true,
  centers: false,
  users: false,
  students: false,
  teachers: false,
  classes: false,
  courses: false,
  attendance: false,
  payments: false,
  payroll: false,
  reports: false,
  settings: false,
  ai_assistant: false,
  communication: false,
  documents: false,
};

const PERMISSION_LABELS: Record<keyof UserPermission, { name: string; icon: string; description: string }> = {
  dashboard: { name: "Dashboard", icon: "📊", description: "Access to main dashboard" },
  centers: { name: "Centers", icon: "🏢", description: "Manage learning centers" },
  users: { name: "Users", icon: "👥", description: "Manage user accounts" },
  students: { name: "Students", icon: "👨‍🎓", description: "Manage students" },
  teachers: { name: "Teachers", icon: "👨‍🏫", description: "Manage teachers" },
  classes: { name: "Classes", icon: "📚", description: "Manage classes" },
  courses: { name: "Courses", icon: "📖", description: "Manage courses" },
  attendance: { name: "Attendance", icon: "✅", description: "View/manage attendance" },
  payments: { name: "Payments", icon: "💳", description: "Payment management" },
  payroll: { name: "Payroll", icon: "💰", description: "Salary management" },
  reports: { name: "Reports", icon: "📈", description: "View reports & analytics" },
  settings: { name: "Settings", icon: "⚙️", description: "System settings" },
  ai_assistant: { name: "AI Assistant", icon: "🤖", description: "Access AI features" },
  communication: { name: "Communication", icon: "💬", description: "Messages & notifications" },
  documents: { name: "Documents", icon: "📄", description: "Document management" },
};

// Default permissions per role
const ROLE_DEFAULT_PERMISSIONS: Record<string, UserPermission> = {
  CHAIRMAN: { ...DEFAULT_PERMISSIONS, dashboard: true, centers: true, users: true, students: true, teachers: true, classes: true, courses: true, attendance: true, payments: true, payroll: true, reports: true, settings: true, ai_assistant: true, communication: true, documents: true },
  CEO: { ...DEFAULT_PERMISSIONS, dashboard: true, centers: true, users: true, students: true, teachers: true, classes: true, courses: true, attendance: true, payments: true, payroll: true, reports: true, settings: true, ai_assistant: true, communication: true, documents: true },
  SUPER_ADMIN: { ...DEFAULT_PERMISSIONS, dashboard: true, centers: true, users: true, students: true, teachers: true, classes: true, courses: true, attendance: true, payments: true, payroll: true, reports: true, settings: true, ai_assistant: true, communication: true, documents: true },
  DIRECTOR: { ...DEFAULT_PERMISSIONS, dashboard: true, centers: true, users: true, students: true, teachers: true, classes: true, courses: true, attendance: true, payments: true, reports: true, communication: true, documents: true },
  CENTER_ADMIN: { ...DEFAULT_PERMISSIONS, dashboard: true, users: true, students: true, teachers: true, classes: true, courses: true, attendance: true, payments: true, reports: true, communication: true, documents: true },
  CENTER_MANAGER: { ...DEFAULT_PERMISSIONS, dashboard: true, centers: true, users: true, students: true, teachers: true, classes: true, courses: true, attendance: true, payments: true, payroll: true, reports: true, settings: true, ai_assistant: true, communication: true, documents: true },
  TEACHER: { ...DEFAULT_PERMISSIONS, dashboard: true, students: true, classes: true, attendance: true, communication: true, documents: true },
  STUDENT: { ...DEFAULT_PERMISSIONS, dashboard: true, attendance: true, communication: true, documents: true },
  PARENT: { ...DEFAULT_PERMISSIONS, dashboard: true, attendance: true, communication: true },
  STAFF: { ...DEFAULT_PERMISSIONS, dashboard: true, attendance: true, communication: true, documents: true },
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"roles" | "users">("users");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [userPermissions, setUserPermissions] = useState<Record<string, UserPermission>>({});
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [successMessage, setSuccessMessage] = useState("");
  
  // New states for role users modal
  const [showRoleUsersModal, setShowRoleUsersModal] = useState(false);
  const [selectedRoleForUsers, setSelectedRoleForUsers] = useState<Role | null>(null);
  const [roleUsers, setRoleUsers] = useState<User[]>([]);
  
  // States for multi-user selection and bulk permission update
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showBulkPermissionModal, setShowBulkPermissionModal] = useState(false);
  const [bulkPermissions, setBulkPermissions] = useState<UserPermission>({ ...DEFAULT_PERMISSIONS });

  const loadSavedPermissions = useCallback(async () => {
    // Load all user permissions from backend API
    try {
      const permissions = await apiFetch("/api/user-permissions/all");
      if (Array.isArray(permissions)) {
        const permMap: Record<string, UserPermission> = {};
        permissions.forEach((perm: {
          userId?: string;
          dashboard?: boolean;
          centers?: boolean;
          users?: boolean;
          students?: boolean;
          teachers?: boolean;
          classes?: boolean;
          courses?: boolean;
          attendance?: boolean;
          payments?: boolean;
          payroll?: boolean;
          reports?: boolean;
          settings?: boolean;
          aiAssistant?: boolean;
          communication?: boolean;
          documents?: boolean;
        }) => {
          if (perm.userId) {
            permMap[perm.userId] = {
              dashboard: perm.dashboard ?? true,
              centers: perm.centers ?? false,
              users: perm.users ?? false,
              students: perm.students ?? false,
              teachers: perm.teachers ?? false,
              classes: perm.classes ?? false,
              courses: perm.courses ?? false,
              attendance: perm.attendance ?? false,
              payments: perm.payments ?? false,
              payroll: perm.payroll ?? false,
              reports: perm.reports ?? false,
              settings: perm.settings ?? false,
              ai_assistant: perm.aiAssistant ?? false,
              communication: perm.communication ?? false,
              documents: perm.documents ?? false,
            };
          }
        });
        setUserPermissions(permMap);
        // Also cache in localStorage
        localStorage.setItem("user_permissions", JSON.stringify(permMap));
      }
    } catch (e) {
      console.error("Error loading permissions from API:", e);
      // Fallback to localStorage
      const saved = localStorage.getItem("user_permissions");
      if (saved) {
        try {
          setUserPermissions(JSON.parse(saved));
        } catch (err) {
          console.error("Error loading permissions from localStorage:", err);
        }
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
    loadSavedPermissions();
  }, [loadSavedPermissions]);

  const savePermissions = (permissions: Record<string, UserPermission>) => {
    // Save to localStorage as cache
    localStorage.setItem("user_permissions", JSON.stringify(permissions));
    setUserPermissions(permissions);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch roles
      let rolesData: Role[] = [];
      try {
        rolesData = await apiFetch("/api/roles");
        setRoles(Array.isArray(rolesData) ? rolesData : []);
      } catch (e) {
        console.error("Error fetching roles:", e);
      }

      // Fetch users
      try {
        const usersData = await apiFetch("/api/users");
        const usersArray = Array.isArray(usersData) ? usersData : [];
        
        // Map role data to users
        const usersWithRoles = usersArray.map((user: User) => {
          const role = rolesData.find((r: Role) => r.id === user.roleId);
          return { ...user, role };
        });
        
        setUsers(usersWithRoles);
      } catch (e) {
        console.error("Error fetching users:", e);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getUserPermissions = (user: User): UserPermission => {
    // Check if user has custom permissions saved
    if (userPermissions[user.id]) {
      return userPermissions[user.id];
    }
    
    // Otherwise use role default
    const roleName = user.role?.name || "STAFF";
    return ROLE_DEFAULT_PERMISSIONS[roleName] || DEFAULT_PERMISSIONS;
  };

  const handlePermissionToggle = (permission: keyof UserPermission) => {
    if (!selectedUser) return;
    
    const currentPerms = getUserPermissions(selectedUser);
    const updatedPerms = { ...currentPerms, [permission]: !currentPerms[permission] };
    
    const newUserPermissions = { ...userPermissions, [selectedUser.id]: updatedPerms };
    savePermissions(newUserPermissions);
    setSelectedUser({ ...selectedUser, permissions: updatedPerms });
  };

  const handleResetToDefault = async () => {
    if (!selectedUser) return;
    
    try {
      // Delete user's custom permissions from backend using the reset endpoint
      await apiFetch(`/api/user-permissions/user/${selectedUser.id}/reset`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error deleting permissions from API:", error);
    }
    
    const { [selectedUser.id]: _, ...rest } = userPermissions;
    savePermissions(rest);
    setSelectedUser({ ...selectedUser, permissions: undefined });
    setSuccessMessage("Permissions reset to role defaults");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    
    setSaving(true);
    try {
      // Get current permissions for this user
      const currentPerms = getUserPermissions(selectedUser);
      
      // Save to backend API using the UserPermissionDTO format
      await apiFetch(`/api/user-permissions/user/${selectedUser.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          dashboard: currentPerms.dashboard,
          centers: currentPerms.centers,
          users: currentPerms.users,
          students: currentPerms.students,
          teachers: currentPerms.teachers,
          classes: currentPerms.classes,
          courses: currentPerms.courses,
          attendance: currentPerms.attendance,
          payments: currentPerms.payments,
          payroll: currentPerms.payroll,
          reports: currentPerms.reports,
          settings: currentPerms.settings,
          aiAssistant: currentPerms.ai_assistant,
          communication: currentPerms.communication,
          documents: currentPerms.documents,
          academyServiceEnabled: true,
          paymentServiceEnabled: true,
          attendanceServiceEnabled: true,
          payrollServiceEnabled: true,
          connectServiceEnabled: true,
          aiGatewayEnabled: true,
        }),
      });
      
      setSuccessMessage("Permissions saved to server successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error saving permissions to API:", error);
      // Still save locally as fallback
      setSuccessMessage("Permissions saved locally (server sync failed)");
      setTimeout(() => setSuccessMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Function to show users with a specific role
  const handleShowRoleUsers = (role: Role) => {
    setSelectedRoleForUsers(role);
    // Filter users by this role
    const usersWithRole = users.filter(
      (u) => u.role?.name?.toUpperCase() === role.name?.toUpperCase()
    );
    setRoleUsers(usersWithRole);
    setSelectedUserIds([]); // Reset selection
    setShowRoleUsersModal(true);
  };

  // Function to manage permissions for a user from role users modal
  const handleManageUserFromRoleModal = (user: User) => {
    setShowRoleUsersModal(false);
    setSelectedUser(user);
    setShowPermissionModal(true);
  };

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Select all users in current role
  const selectAllUsers = () => {
    if (selectedUserIds.length === roleUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(roleUsers.map(u => u.id));
    }
  };

  // Open bulk permission modal
  const openBulkPermissionModal = () => {
    if (selectedUserIds.length === 0) {
      alert("Please select at least one user");
      return;
    }
    // Initialize with role defaults if available
    if (selectedRoleForUsers) {
      const roleDefaults = ROLE_DEFAULT_PERMISSIONS[selectedRoleForUsers.name] || DEFAULT_PERMISSIONS;
      setBulkPermissions({ ...roleDefaults });
    }
    setShowBulkPermissionModal(true);
  };

  // Toggle bulk permission
  const toggleBulkPermission = (key: keyof UserPermission) => {
    setBulkPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Save bulk permissions for selected users
  const handleSaveBulkPermissions = async () => {
    setSaving(true);
    try {
      const promises = selectedUserIds.map(async (userId) => {
        await apiFetch(`/api/user-permissions/user/${userId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userId,
            dashboard: bulkPermissions.dashboard,
            centers: bulkPermissions.centers,
            users: bulkPermissions.users,
            students: bulkPermissions.students,
            teachers: bulkPermissions.teachers,
            classes: bulkPermissions.classes,
            courses: bulkPermissions.courses,
            attendance: bulkPermissions.attendance,
            payments: bulkPermissions.payments,
            payroll: bulkPermissions.payroll,
            reports: bulkPermissions.reports,
            settings: bulkPermissions.settings,
            aiAssistant: bulkPermissions.ai_assistant,
            communication: bulkPermissions.communication,
            documents: bulkPermissions.documents,
            academyServiceEnabled: true,
            paymentServiceEnabled: true,
            attendanceServiceEnabled: true,
            payrollServiceEnabled: true,
            connectServiceEnabled: true,
            aiGatewayEnabled: true,
          }),
        });
      });

      await Promise.all(promises);
      
      setSuccessMessage(`Permissions updated for ${selectedUserIds.length} user(s)!`);
      setTimeout(() => setSuccessMessage(""), 3000);
      setShowBulkPermissionModal(false);
      setSelectedUserIds([]);
      loadSavedPermissions(); // Reload permissions
    } catch (error) {
      console.error("Error saving bulk permissions:", error);
      alert("Failed to save permissions for some users");
    } finally {
      setSaving(false);
    }
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case "CHAIRMAN": return "bg-purple-100 text-purple-800 border-purple-300";
      case "CEO": return "bg-indigo-100 text-indigo-800 border-indigo-300";
      case "SUPER_ADMIN": return "bg-red-100 text-red-800 border-red-300";
      case "DIRECTOR": return "bg-blue-100 text-blue-800 border-blue-300";
      case "CENTER_ADMIN": return "bg-cyan-100 text-cyan-800 border-cyan-300";
      case "TEACHER": return "bg-green-100 text-green-800 border-green-300";
      case "STUDENT": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "PARENT": return "bg-orange-100 text-orange-800 border-orange-300";
      case "STAFF": return "bg-gray-100 text-gray-800 border-gray-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case "CHAIRMAN": return "👑";
      case "CEO": return "🎯";
      case "SUPER_ADMIN": return "🔐";
      case "DIRECTOR": return "🎓";
      case "CENTER_ADMIN": return "🏢";
      case "TEACHER": return "👨‍🏫";
      case "STUDENT": return "👨‍🎓";
      case "PARENT": return "👪";
      case "STAFF": return "👤";
      default: return "👤";
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role?.name === selectedRole;
    return matchesSearch && matchesRole;
  });

  const countEnabledPermissions = (user: User): number => {
    const perms = getUserPermissions(user);
    return Object.values(perms).filter(Boolean).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/superadmin" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">Roles & Permissions</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">🔐 Roles & Permissions</h1>
          <p className="text-gray-500">Manage user access and feature permissions</p>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <span>✅</span>
          {successMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "users"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          👥 User Permissions ({users.length})
        </button>
        <button
          onClick={() => setActiveTab("roles")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "roles"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          🎭 Roles Overview ({roles.length})
        </button>
      </div>

      {/* User Permissions Tab */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              {roles.map(role => (
                <option key={role.id} value={role.name}>{role.displayName || role.name}</option>
              ))}
            </select>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Enabled Features</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <div className="text-4xl mb-2">👥</div>
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {user.fullname?.charAt(0) || "?"}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.fullname}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role?.name || "")}`}>
                          {getRoleIcon(user.role?.name || "")} {user.role?.displayName || user.role?.name || "No Role"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-medium text-blue-600">
                          {countEnabledPermissions(user)}/{Object.keys(PERMISSION_LABELS).length}
                        </span>
                        {userPermissions[user.id] && (
                          <span className="ml-2 text-xs text-purple-600">(Custom)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowPermissionModal(true);
                          }}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          ⚙️ Manage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Roles Overview Tab */}
      {activeTab === "roles" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles
              .sort((a, b) => (b.level || 0) - (a.level || 0))
              .map((role) => (
                <div key={role.id} className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${getRoleColor(role.name)}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{role.displayName || role.name}</h3>
                      <p className="text-sm text-gray-500">{role.description || `Role level: ${role.level}`}</p>
                    </div>
                    <span className="text-2xl">{getRoleIcon(role.name)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="text-sm text-gray-500">
                      <span className="font-bold text-gray-900">{role.usersCount || users.filter(u => u.role?.name?.toUpperCase() === role.name?.toUpperCase()).length}</span> users
                    </span>
                    <span className="text-xs text-gray-400">Level {role.level}</span>
                  </div>
                  <button
                    onClick={() => handleShowRoleUsers(role)}
                    className="mt-4 w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    👥 View Users & Permissions
                  </button>
                </div>
              ))}
          </div>

          {/* Default Permissions Matrix */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Default Permissions by Role</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Feature</th>
                    {["CHAIRMAN", "CEO", "DIRECTOR", "CENTER_ADMIN", "TEACHER", "STAFF", "STUDENT"].map(role => (
                      <th key={role} className="px-3 py-3 text-center font-medium text-gray-500 text-xs">
                        {getRoleIcon(role)}<br/>{role.replace("_", " ")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {Object.entries(PERMISSION_LABELS).map(([key, { name, icon }]) => (
                    <tr key={key} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        {icon} {name}
                      </td>
                      {["CHAIRMAN", "CEO", "DIRECTOR", "CENTER_ADMIN", "TEACHER", "STAFF", "STUDENT"].map(role => {
                        const perms = ROLE_DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS;
                        const hasPermission = perms[key as keyof UserPermission];
                        return (
                          <td key={role} className="px-3 py-3 text-center">
                            {hasPermission ? (
                              <span className="text-green-600">✅</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Permission Modal */}
      {showPermissionModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                    {selectedUser.fullname?.charAt(0) || "?"}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedUser.fullname}</h2>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      {selectedUser.email}
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getRoleColor(selectedUser.role?.name || "")}`}>
                        {selectedUser.role?.displayName || selectedUser.role?.name}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPermissionModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Feature Permissions</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleResetToDefault}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    🔄 Reset to Default
                  </button>
                </div>
              </div>

              {userPermissions[selectedUser.id] && (
                <div className="bg-purple-50 border border-purple-200 text-purple-700 px-4 py-2 rounded-lg mb-4 text-sm">
                  ⚡ This user has custom permissions (overriding role defaults)
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(PERMISSION_LABELS).map(([key, { name, icon, description }]) => {
                  const perms = getUserPermissions(selectedUser);
                  const isEnabled = perms[key as keyof UserPermission];
                  
                  return (
                    <div
                      key={key}
                      onClick={() => handlePermissionToggle(key as keyof UserPermission)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isEnabled
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{icon}</span>
                          <div>
                            <div className="font-medium text-gray-900">{name}</div>
                            <div className="text-xs text-gray-500">{description}</div>
                          </div>
                        </div>
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${
                          isEnabled ? "bg-green-500" : "bg-gray-300"
                        }`}>
                          <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${
                            isEnabled ? "translate-x-6" : "translate-x-0"
                          }`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 sticky bottom-0 flex justify-end gap-3">
              <button
                onClick={() => setShowPermissionModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleSavePermissions();
                  setShowPermissionModal(false);
                }}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "💾 Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Users Modal - Shows users with a specific role */}
      {showRoleUsersModal && selectedRoleForUsers && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{getRoleIcon(selectedRoleForUsers.name)}</span>
                  <div>
                    <h2 className="text-xl font-bold">{selectedRoleForUsers.displayName || selectedRoleForUsers.name}</h2>
                    <p className="text-sm text-white/80">
                      {roleUsers.length} user(s) with this role
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowRoleUsersModal(false); setSelectedUserIds([]); }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Selection toolbar */}
            {roleUsers.length > 0 && (
              <div className="p-4 bg-blue-50 border-b flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.length === roleUsers.length && roleUsers.length > 0}
                      onChange={selectAllUsers}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Select All ({roleUsers.length})
                    </span>
                  </label>
                  {selectedUserIds.length > 0 && (
                    <span className="text-sm text-blue-600 font-medium">
                      ✓ {selectedUserIds.length} user(s) selected
                    </span>
                  )}
                </div>
                {selectedUserIds.length > 0 && (
                  <button
                    onClick={openBulkPermissionModal}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    🔑 Update Permissions for Selected ({selectedUserIds.length})
                  </button>
                )}
              </div>
            )}

            <div className="p-6 overflow-y-auto flex-1">
              {roleUsers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">👤</div>
                  <p className="text-lg font-medium">No users with this role</p>
                  <p className="text-sm">Assign this role to users in the User Management section</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-4">
                    💡 Select users by checkbox to update permissions for multiple users at once, or click "Manage" to update individually.
                  </p>
                  {roleUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between p-4 rounded-xl transition-colors border-2 ${
                        selectedUserIds.includes(user.id)
                          ? "bg-blue-50 border-blue-300"
                          : "bg-gray-50 border-transparent hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg font-bold">
                          {user.fullname?.charAt(0) || "?"}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.fullname}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            ID: <span className="font-mono bg-gray-200 px-1 rounded select-all">{user.id}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {user.status}
                        </span>
                        <span className="text-sm text-blue-600 font-medium">
                          {countEnabledPermissions(user)}/{Object.keys(PERMISSION_LABELS).length} permissions
                        </span>
                        {userPermissions[user.id] && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Custom</span>
                        )}
                        <button
                          onClick={() => handleManageUserFromRoleModal(user)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          ⚙️ Manage
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Role: <span className="font-medium">{selectedRoleForUsers.name}</span> | 
                Level: <span className="font-medium">{selectedRoleForUsers.level}</span>
              </div>
              <div className="flex gap-2">
                {selectedUserIds.length > 0 && (
                  <button
                    onClick={() => setSelectedUserIds([])}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Clear Selection
                  </button>
                )}
                <button
                  onClick={() => { setShowRoleUsersModal(false); setSelectedUserIds([]); }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Permission Modal - Update permissions for multiple users */}
      {showBulkPermissionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b bg-gradient-to-r from-green-500 to-teal-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">🔑 Bulk Permission Update</h2>
                  <p className="text-sm text-white/80">
                    Updating permissions for {selectedUserIds.length} selected user(s)
                  </p>
                </div>
                <button
                  onClick={() => setShowBulkPermissionModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {/* Selected Users Preview */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Selected Users (ID):</h4>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {selectedUserIds.map(id => {
                    const user = roleUsers.find(u => u.id === id);
                    return (
                      <span key={id} className="text-xs bg-white px-2 py-1 rounded border border-blue-200">
                        {user?.fullname || id}
                        <span className="text-gray-400 ml-1">({id.slice(0, 8)}...)</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Permission Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(PERMISSION_LABELS).map(([key, { name, icon, description }]) => {
                  const isEnabled = bulkPermissions[key as keyof UserPermission];
                  
                  return (
                    <div
                      key={key}
                      onClick={() => toggleBulkPermission(key as keyof UserPermission)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isEnabled
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{icon}</span>
                          <div>
                            <div className="font-medium text-gray-900">{name}</div>
                            <div className="text-xs text-gray-500">{description}</div>
                          </div>
                        </div>
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${
                          isEnabled ? "bg-green-500" : "bg-gray-300"
                        }`}>
                          <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${
                            isEnabled ? "translate-x-6" : "translate-x-0"
                          }`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {Object.values(bulkPermissions).filter(Boolean).length}/{Object.keys(PERMISSION_LABELS).length} permissions enabled
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBulkPermissionModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBulkPermissions}
                  disabled={saving}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Saving...
                    </>
                  ) : (
                    <>💾 Save for {selectedUserIds.length} User(s)</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
