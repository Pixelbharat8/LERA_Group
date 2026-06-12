"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { apiFetch } from "../../../../lib/api";

interface PendingUser {
  id: string;
  email: string;
  fullname: string;
  phone: string;
  requestedRole: string;
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  centerId: string;
  centerName: string;
  status: string;
}

export default function ApprovalsPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [assignedRole, setAssignedRole] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const roles = [
    { id: "CEO", name: "CEO", level: 1, description: "Chief Executive Officer - Full platform access" },
    { id: "DIRECTOR", name: "Director", level: 2, description: "Director - Manage operations" },
    { id: "CENTER_ADMIN", name: "Center Admin", level: 3, description: "Center Administrator - Manage single center" },
    { id: "TEACHER", name: "Teacher", level: 4, description: "Teacher - Manage classes and students" },
    { id: "TEACHING_ASSISTANT", name: "Teaching Assistant", level: 5, description: "TA - Assist teachers" },
    { id: "STAFF", name: "Staff", level: 6, description: "Staff - Administrative duties" },
    { id: "STUDENT", name: "Student", level: 7, description: "Student - Learning access" },
    { id: "PARENT", name: "Parent", level: 8, description: "Parent - View child progress" },
  ];

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/users?approval_status=PENDING");
      // Filter users with PENDING approval status
      const pending = (Array.isArray(data) ? data : data.content || [])
        .filter((u: any) => u.approvalStatus === "PENDING" || u.status === "PENDING_APPROVAL");
      setPendingUsers(pending);
    } catch (err) {
      console.error("Error fetching pending users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (user: PendingUser) => {
    setSelectedUser(user);
    setAssignedRole(user.requestedRole || "TEACHER");
    setShowModal(true);
  };

  const handleReject = async (user: PendingUser) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    try {
      await apiFetch(`/api/users/${user.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason })
      });

      alert("User registration rejected");
      fetchPendingUsers();
    } catch (err) {
      console.error("Error rejecting user:", err);
      alert("Failed to reject user");
    }
  };

  const confirmApproval = async () => {
    if (!selectedUser || !assignedRole) return;

    try {
      await apiFetch(`/api/users/${selectedUser.id}/approve`, {
        method: "POST",
        body: JSON.stringify({ 
          roleId: assignedRole,
          roleName: assignedRole 
        })
      });

      alert(`User approved as ${assignedRole}`);
      setShowModal(false);
      setSelectedUser(null);
      fetchPendingUsers();
    } catch (err) {
      console.error("Error approving user:", err);
      alert("Failed to approve user");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">👑 Pending Approvals</h1>
          <p className="text-gray-500">Review and approve user registration requests</p>
        </div>
        <button
          onClick={fetchPendingUsers}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-2xl">⏳</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingUsers.length}</p>
              <p className="text-sm text-gray-500">Pending Requests</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">✅</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">-</p>
              <p className="text-sm text-gray-500">Approved Today</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-2xl">❌</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">-</p>
              <p className="text-sm text-gray-500">Rejected Today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">📋 Registration Requests</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-4">🎉</p>
            <p className="text-lg font-medium">No pending approvals!</p>
            <p className="text-sm">All user registrations have been processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                          {user.fullname?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.fullname}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{user.phone || "-"}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {user.requestedRole || "TEACHER"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{user.requestedByName || "Self"}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {user.requestedAt ? new Date(user.requestedAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(user)}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleReject(user)}
                          className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3">👑 Chairman Authority</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>As Chairman, you have the highest authority in this platform:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>Approve/Reject</strong> all user registration requests</li>
            <li><strong>Assign Roles</strong> - Give users appropriate access levels</li>
            <li><strong>Modify Permissions</strong> - Increase or decrease user access anytime</li>
            <li><strong>Full Control</strong> - Access all data, settings, and features</li>
          </ul>
          <p className="mt-4 font-medium">Hierarchy: Chairman → CEO → Director → Center Admin → Staff/Teachers</p>
        </div>
      </div>

      {/* Approval Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Approve User Registration</h2>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedUser.fullname}</p>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Role
                </label>
                <select
                  value={assignedRole}
                  onChange={(e) => setAssignedRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} - {role.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmApproval}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  ✓ Approve as {assignedRole}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
