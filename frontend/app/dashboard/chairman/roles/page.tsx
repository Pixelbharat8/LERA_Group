"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../../../lib/api";

export default function ChairmanRolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<string[]>([]);
  const [roleUsers, setRoleUsers] = useState<any[]>([]); // Users with this role
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });
  
  // New states for multi-user selection
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [savingUserPermissions, setSavingUserPermissions] = useState(false);

  const availablePermissions = [
    { key: "dashboard", name: "Dashboard Access", category: "General" },
    { key: "users", name: "User Management", category: "Users" },
    { key: "roles", name: "Role Management", category: "Users" },
    { key: "centers", name: "Center Management", category: "Organization" },
    { key: "departments", name: "Department Management", category: "Organization" },
    { key: "students", name: "Student Management", category: "Academy" },
    { key: "teachers", name: "Teacher Management", category: "Academy" },
    { key: "courses", name: "Course Management", category: "Academy" },
    { key: "classes", name: "Class Management", category: "Academy" },
    { key: "classrooms", name: "Classroom Management", category: "Academy" },
    { key: "enrollments", name: "Enrollment Management", category: "Academy" },
    { key: "attendance", name: "Attendance Management", category: "Attendance" },
    { key: "leave", name: "Leave Management", category: "Attendance" },
    { key: "payments", name: "Payment Management", category: "Finance" },
    { key: "payroll", name: "Payroll Management", category: "Finance" },
    { key: "invoices", name: "Invoice Management", category: "Finance" },
    { key: "marketing", name: "Marketing Access", category: "Marketing" },
    { key: "marketing_campaigns", name: "Campaign Management", category: "Marketing" },
    { key: "social_media", name: "Social Media Management", category: "Marketing" },
    { key: "ad_accounts", name: "Ad Account Management", category: "Marketing" },
    { key: "content_calendar", name: "Content Calendar", category: "Marketing" },
    { key: "analytics_marketing", name: "Marketing Analytics", category: "Marketing" },
    { key: "reports", name: "Report Access", category: "Reports" },
    { key: "analytics", name: "Analytics Access", category: "Reports" },
    { key: "website_content", name: "Website Content Management", category: "CMS" },
    { key: "seo_settings", name: "SEO Settings", category: "CMS" },
    { key: "public_pages", name: "Public Pages Editor", category: "CMS" },
    { key: "settings", name: "System Settings", category: "System" },
    { key: "audit", name: "Audit Logs", category: "System" },
    { key: "ai_assistant", name: "AI Assistant", category: "AI" },
    { key: "approvals", name: "Approval Authority", category: "Admin" },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesData, permsData] = await Promise.all([
        apiFetch("/api/roles").catch(() => []),
        apiFetch("/api/permissions").catch(() => []),
      ]);

      setRoles(Array.isArray(rolesData) ? rolesData : rolesData?.data || []);
      setPermissions(Array.isArray(permsData) ? permsData : permsData?.data || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRole = async () => {
    try {
      await apiFetch("/api/roles", {
        method: "POST",
        body: JSON.stringify(newRole),
      });
      alert("Role created successfully!");
      setShowAddModal(false);
      setNewRole({ name: "", description: "", permissions: [] });
      fetchData();
    } catch (error: any) {
      console.error("Error creating role:", error);
      alert(error.message || "Error creating role");
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;
    try {
      await apiFetch(`/api/roles/${editingRole.id}`, {
        method: "PUT",
        body: JSON.stringify(editingRole),
      });
      alert("Role updated successfully!");
      setShowEditModal(false);
      setEditingRole(null);
      fetchData();
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update role");
    }
  };

  const handleDeleteRole = async (id: string, name: string) => {
    if (["CHAIRMAN", "CEO", "SUPERADMIN", "DIRECTOR"].includes(name.toUpperCase())) {
      alert("Cannot delete system roles!");
      return;
    }
    if (!confirm("Are you sure you want to delete this role?")) return;
    try {
      await apiFetch(`/api/roles/${id}`, { method: "DELETE" });
      alert("Role deleted successfully!");
      fetchData();
    } catch (error) {
      console.error("Error deleting role:", error);
    }
  };

  const handleSavePermissions = async () => {
    if (!editingRole) return;
    try {
      await apiFetch(`/api/roles/${editingRole.id}/permissions`, {
        method: "PUT",
        body: JSON.stringify({ permissions: selectedRolePermissions }),
      });
      alert("Permissions updated successfully!");
      setShowPermissionsModal(false);
      setEditingRole(null);
      fetchData();
    } catch (error) {
      console.error("Error updating permissions:", error);
      alert("Failed to update permissions");
    }
  };

  const openPermissionsModal = async (role: any) => {
    setEditingRole(role);
    setSelectedRolePermissions(role.permissions || []);
    setShowPermissionsModal(true);
    
    // Fetch users with this role
    setLoadingUsers(true);
    try {
      let users: any[] = [];
      try {
        const data = await apiFetch(`/api/users?roleName=${role.name}`);
        users = Array.isArray(data) ? data : data?.data || [];
      } catch {
        // Try fetching all users and filter by role
        const allData = await apiFetch("/api/users");
        const allUsers = Array.isArray(allData) ? allData : allData?.data || [];
        users = allUsers.filter((u: any) => 
          u.roleName?.toUpperCase() === role.name?.toUpperCase() ||
          u.role?.toUpperCase() === role.name?.toUpperCase()
        );
      }
      setRoleUsers(users);
    } catch (error) {
      console.error("Error fetching users for role:", error);
      setRoleUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const togglePermission = (permKey: string) => {
    setSelectedRolePermissions((prev) =>
      prev.includes(permKey)
        ? prev.filter((p) => p !== permKey)
        : [...prev, permKey]
    );
  };

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Select all users
  const selectAllUsers = () => {
    if (selectedUserIds.length === roleUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(roleUsers.map(u => u.id));
    }
  };

  // Save permissions for selected users
  const handleSaveSelectedUsersPermissions = async () => {
    if (selectedUserIds.length === 0) {
      alert("Please select at least one user");
      return;
    }
    
    setSavingUserPermissions(true);
    try {
      // Convert selectedRolePermissions array to permission object
      const permissionObject: Record<string, boolean> = {};
      availablePermissions.forEach(p => {
        permissionObject[p.key] = selectedRolePermissions.includes(p.key);
      });

      const promises = selectedUserIds.map(async (userId) => {
        await apiFetch(`/api/user-permissions/user/${userId}`, {
          method: "POST",
          body: JSON.stringify({
            userId: userId,
            dashboard: permissionObject.dashboard || false,
            centers: permissionObject.centers || false,
            users: permissionObject.users || false,
            students: permissionObject.students || false,
            teachers: permissionObject.teachers || false,
            classes: permissionObject.classes || false,
            courses: permissionObject.courses || false,
            attendance: permissionObject.attendance || false,
            payments: permissionObject.payments || false,
            payroll: permissionObject.payroll || false,
            reports: permissionObject.reports || false,
            settings: permissionObject.settings || false,
            aiAssistant: permissionObject.ai_assistant || false,
            communication: permissionObject.marketing || permissionObject.social_media || false,
            documents: permissionObject.website_content || false,
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
      alert(`Permissions saved for ${selectedUserIds.length} user(s) successfully!`);
      setSelectedUserIds([]);
    } catch (error) {
      console.error("Error saving user permissions:", error);
      alert("Failed to save permissions for some users");
    } finally {
      setSavingUserPermissions(false);
    }
  };

  const groupedPermissions = availablePermissions.reduce((acc: any, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {});

  const getRoleBadgeColor = (roleName: string) => {
    const colors: Record<string, string> = {
      CHAIRMAN: "bg-yellow-100 text-yellow-800 border-yellow-300",
      CEO: "bg-purple-100 text-purple-800 border-purple-300",
      DIRECTOR: "bg-blue-100 text-blue-800 border-blue-300",
      SUPERADMIN: "bg-red-100 text-red-800 border-red-300",
      CENTER_ADMIN: "bg-green-100 text-green-800 border-green-300",
      TEACHER: "bg-indigo-100 text-indigo-800 border-indigo-300",
      STAFF: "bg-gray-100 text-gray-800 border-gray-300",
      STUDENT: "bg-cyan-100 text-cyan-800 border-cyan-300",
      PARENT: "bg-pink-100 text-pink-800 border-pink-300",
    };
    return colors[roleName?.toUpperCase()] || "bg-gray-100 text-gray-800 border-gray-300";
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
          <h1 className="text-3xl font-bold text-gray-800">🔐 Roles & Permissions</h1>
          <p className="text-gray-600">Manage system roles and their permissions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>➕</span> Add New Role
        </button>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className={`h-2 ${getRoleBadgeColor(role.name).split(" ")[0]}`}></div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{role.name}</h3>
                  <p className="text-gray-500 text-sm">{role.description || "No description"}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(role.name)}`}>
                  {role.name}
                </span>
              </div>

              {/* Permission Count */}
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{role.permissions?.length || 0}</span> permissions assigned
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(role.permissions || []).slice(0, 5).map((perm: string) => (
                    <span key={perm} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {perm}
                    </span>
                  ))}
                  {(role.permissions?.length || 0) > 5 && (
                    <span className="text-xs text-blue-600">+{role.permissions.length - 5} more</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => openPermissionsModal(role)}
                  className="flex-1 bg-blue-100 text-blue-600 px-3 py-2 rounded hover:bg-blue-200 text-sm"
                >
                  🔑 Permissions
                </button>
                <button
                  onClick={() => { setEditingRole(role); setShowEditModal(true); }}
                  className="flex-1 bg-gray-100 text-gray-600 px-3 py-2 rounded hover:bg-gray-200 text-sm"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDeleteRole(role.id, role.name)}
                  className="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm"
                  disabled={["CHAIRMAN", "CEO", "SUPERADMIN", "DIRECTOR"].includes(role.name?.toUpperCase())}
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Role Hierarchy */}
      <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">📊 Role Hierarchy</h3>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center text-2xl">👑</div>
            <span className="mt-2 text-sm font-medium">Chairman</span>
            <span className="text-xs text-gray-500">Full Access</span>
          </div>
          <span className="text-2xl text-gray-300">→</span>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-2xl">🎯</div>
            <span className="mt-2 text-sm font-medium">CEO</span>
            <span className="text-xs text-gray-500">Executive</span>
          </div>
          <span className="text-2xl text-gray-300">→</span>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">📋</div>
            <span className="mt-2 text-sm font-medium">Director</span>
            <span className="text-xs text-gray-500">Management</span>
          </div>
          <span className="text-2xl text-gray-300">→</span>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-2xl">🏢</div>
            <span className="mt-2 text-sm font-medium">Center Admin</span>
            <span className="text-xs text-gray-500">Center Level</span>
          </div>
          <span className="text-2xl text-gray-300">→</span>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-2xl">👨‍🏫</div>
            <span className="mt-2 text-sm font-medium">Staff</span>
            <span className="text-xs text-gray-500">Operations</span>
          </div>
        </div>
      </div>

      {/* Add Role Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">➕ Add New Role</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <input
                  type="text"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., MANAGER, ACCOUNTANT"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of this role"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRole}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && editingRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">✏️ Edit Role</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <input
                  type="text"
                  value={editingRole.name || ""}
                  onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={["CHAIRMAN", "CEO", "SUPERADMIN", "DIRECTOR"].includes(editingRole.name?.toUpperCase())}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingRole.description || ""}
                  onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => { setShowEditModal(false); setEditingRole(null); }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRole}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && editingRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <h3 className="text-xl font-bold">
                🔑 Permissions for <span className="text-yellow-300">{editingRole.name}</span>
              </h3>
              <p className="text-sm text-white/80 mt-1">
                Select users and set permissions
              </p>
            </div>
            
            {/* Users with this role - with selection */}
            <div className="p-4 bg-blue-50 border-b">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                  👥 Users with this role ({roleUsers.length})
                </h4>
                {roleUsers.length > 0 && (
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.length === roleUsers.length && roleUsers.length > 0}
                        onChange={selectAllUsers}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      Select All
                    </label>
                    {selectedUserIds.length > 0 && (
                      <span className="text-sm text-green-600 font-medium">
                        ✓ {selectedUserIds.length} selected
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {loadingUsers ? (
                <div className="flex items-center gap-2 text-blue-600 py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  Loading users...
                </div>
              ) : roleUsers.length === 0 ? (
                <p className="text-sm text-blue-600 py-2">No users currently have this role</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {roleUsers.map((user: any) => (
                    <label 
                      key={user.id} 
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedUserIds.includes(user.id)
                          ? "bg-green-50 border-green-400"
                          : "bg-white border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {(user.fullname || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{user.fullname || user.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <div className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">
                        {user.id?.slice(0, 8)}...
                      </div>
                    </label>
                  ))}
                </div>
              )}
              
              {selectedUserIds.length > 0 && (
                <div className="mt-3 p-3 bg-green-100 rounded-lg border border-green-300">
                  <p className="text-sm text-green-800">
                    ✅ <strong>{selectedUserIds.length}</strong> user(s) selected. 
                    Permissions below will be saved for these users individually.
                  </p>
                </div>
              )}
            </div>
            
            {/* Permissions */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {Object.entries(groupedPermissions).map(([category, perms]: [string, any]) => (
                  <div key={category} className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-700 mb-3">{category}</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {perms.map((perm: any) => (
                        <label key={perm.key} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={selectedRolePermissions.includes(perm.key)}
                            onChange={() => togglePermission(perm.key)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm">{perm.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {selectedRolePermissions.length} permissions selected
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { 
                    setShowPermissionsModal(false); 
                    setEditingRole(null); 
                    setRoleUsers([]); 
                    setSelectedUserIds([]);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                {selectedUserIds.length > 0 ? (
                  <button
                    onClick={handleSaveSelectedUsersPermissions}
                    disabled={savingUserPermissions}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {savingUserPermissions ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Saving...
                      </>
                    ) : (
                      <>💾 Save for {selectedUserIds.length} User(s)</>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleSavePermissions}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Role Permissions
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
