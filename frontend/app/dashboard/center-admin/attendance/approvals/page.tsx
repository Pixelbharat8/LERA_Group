"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { apiFetch } from "../../../../../lib/api";

interface User {
  id: string;
  fullname: string;
  email: string;
  roleName: string;
  departmentName?: string;
  centerId?: string;
}

interface AttendanceRequest {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: string;
  approvalStatus: string;
  notes?: string;
  submittedAt: string;
}

interface LeaveRequest {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  appliedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  remarks?: string;
}

export default function AttendanceApprovalsPage() {
  const [activeTab, setActiveTab] = useState<"attendance" | "leave">("attendance");
  const [attendanceRequests, setAttendanceRequests] = useState<AttendanceRequest[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [staffMembers, setStaffMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AttendanceRequest | LeaveRequest | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [currentUser, setCurrentUser] = useState<{ id: string; roleName?: string; centerId?: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    let centerId: string | null = null;
    const userDataStr = Cookies.get("userData");
    if (userDataStr) {
      try {
        const parsed = JSON.parse(userDataStr) as {
          id?: string;
          roleName?: string;
          centerId?: string;
        };
        if (parsed?.centerId) centerId = String(parsed.centerId);
        if (parsed?.id) {
          setCurrentUser({
            id: parsed.id,
            roleName: parsed.roleName,
            centerId: parsed.centerId ? String(parsed.centerId) : undefined,
          });
        }
      } catch {
        // ignore
      }
    }
    if (!centerId) {
      setMessage({
        type: "error",
        text: "Your account has no center assigned. You cannot load center-scoped approvals.",
      });
      setLoading(false);
      return;
    }
    try {
      setMessage({ type: "", text: "" });
      // Fetch users, attendance, and leaves for this center only (backend enforces JWT match).
      let usersMap: { [key: string]: User } = {};
      try {
        const data = await apiFetch(`/api/users?centerId=${encodeURIComponent(centerId)}`);
        const users = Array.isArray(data) ? data : [];
        setStaffMembers(users.filter((u: User) => ["TEACHER", "STAFF"].includes(u.roleName)));
        users.forEach((u: User) => {
          usersMap[u.id] = u;
        });
      } catch (err) {
        console.error("Error fetching users:", err);
      }

      try {
        const data = await apiFetch(`/api/attendance?centerId=${encodeURIComponent(centerId)}`);
        const records = Array.isArray(data) ? data : [];
        // Map attendance records with user info
        const mappedRecords = records.map((r: any) => ({
          id: r.id,
          userId: r.userId || r.teacherId || r.studentId,
          userName: usersMap[r.userId || r.teacherId]?.fullname || "Unknown",
          userEmail: usersMap[r.userId || r.teacherId]?.email || "",
          userRole: usersMap[r.userId || r.teacherId]?.roleName || "STAFF",
          date: r.date || r.sessionDate,
          checkInTime: r.checkInTime,
          checkOutTime: r.checkOutTime,
          status: r.status === "PRESENT" || r.hoursWorked > 4 ? "PRESENT" : "HALF_DAY",
          approvalStatus: r.approvalStatus || "APPROVED",
          notes: r.notes,
          submittedAt: r.createdAt || new Date().toISOString()
        }));
        setAttendanceRequests(mappedRecords);
      } catch (err) {
        console.error("Error fetching attendance:", err);
        setAttendanceRequests([]);
      }

      try {
        const data = await apiFetch(`/api/leaves/center/${encodeURIComponent(centerId)}`);
        const leaves = Array.isArray(data) ? data : [];
        // Map leave records with user info
        const mappedLeaves = leaves.map((l: any) => ({
          id: l.id,
          userId: l.userId,
          userName: usersMap[l.userId]?.fullname || "Unknown",
          userEmail: usersMap[l.userId]?.email || "",
          userRole: usersMap[l.userId]?.roleName || "STAFF",
          startDate: l.startDate || l.leaveDate || "",
          endDate: l.endDate || l.leaveDate || "",
          leaveType: l.leaveType || "CASUAL",
          reason: l.reason,
          status: l.status || "PENDING",
          appliedAt: l.appliedAt || l.createdAt || new Date().toISOString(),
          remarks: l.remarks
        }));
        setLeaveRequests(mappedLeaves);
      } catch (err) {
        console.error("Error fetching leave:", err);
        setLeaveRequests([]);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setAttendanceRequests([]);
      setLeaveRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (request: AttendanceRequest | LeaveRequest, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(action);
    setRemarks("");
    setShowActionModal(true);
  };

  const submitAction = async () => {
    if (!selectedRequest) return;
    
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const isAttendance = "checkInTime" in selectedRequest;
      if (isAttendance) {
        setMessage({ type: "error", text: "Attendance approval is not supported by the backend yet." });
        return;
      }

      const endpoint = `/api/leaves/${selectedRequest.id}/${actionType}`;
      const approverRole = (currentUser?.roleName || "CENTER_ADMIN").toUpperCase();

      const payload =
        actionType === "approve"
          ? {
              approvedBy: currentUser?.id,
              approverRole,
              isPaid: true,
              comments: remarks || "Approved",
            }
          : {
              rejectedBy: currentUser?.id,
              approverRole,
              rejectionReason: remarks || "Rejected",
            };

      if (!currentUser?.id) {
        setMessage({ type: "error", text: "Your session is missing user information. Please log in again." });
        return;
      }

      await apiFetch(endpoint, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setMessage({ type: "success", text: `Request ${actionType}d successfully!` });
      
      setLeaveRequests((prev) =>
        prev.map((r) =>
          r.id === selectedRequest.id
            ? { ...r, status: actionType === "approve" ? "APPROVED" : "REJECTED", remarks }
            : r
        )
      );
      
      setTimeout(() => {
        setShowActionModal(false);
        setMessage({ type: "", text: "" });
      }, 1000);
    } catch (err) {
      setMessage({ type: "error", text: "Failed to process request." });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAttendance = attendanceRequests.filter(r => 
    filterStatus === "all" || r.approvalStatus === filterStatus
  );

  const filteredLeave = leaveRequests.filter(r => 
    filterStatus === "all" || r.status === filterStatus
  );

  const stats = {
    pendingAttendance: attendanceRequests.filter(r => r.approvalStatus === "PENDING").length,
    pendingLeave: leaveRequests.filter(r => r.status === "PENDING").length,
    approvedToday: attendanceRequests.filter(r => 
      r.approvalStatus === "APPROVED" && 
      new Date(r.submittedAt).toDateString() === new Date().toDateString()
    ).length + leaveRequests.filter(r => 
      r.status === "APPROVED" && 
      new Date(r.appliedAt).toDateString() === new Date().toDateString()
    ).length,
    totalStaff: staffMembers.length || 15
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case "CASUAL": return "bg-blue-100 text-blue-700";
      case "SICK": return "bg-red-100 text-red-700";
      case "EARNED": return "bg-green-100 text-green-700";
      case "MATERNITY": return "bg-pink-100 text-pink-700";
      case "PATERNITY": return "bg-purple-100 text-purple-700";
      case "UNPAID": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-700";
      case "APPROVED": return "bg-green-100 text-green-700";
      case "REJECTED": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">Attendance Approvals</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">✅ Attendance & Leave Approvals</h1>
          <p className="text-gray-500">Review and approve staff attendance and leave requests</p>
        </div>
        <div className="flex gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-yellow-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-xl">⏳</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingAttendance}</p>
              <p className="text-xs text-gray-500">Pending Attendance</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">✈️</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingLeave}</p>
              <p className="text-xs text-gray-500">Pending Leave</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">✅</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.approvedToday}</p>
              <p className="text-xs text-gray-500">Approved Today</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-xl">👥</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStaff}</p>
              <p className="text-xs text-gray-500">Total Staff</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab("attendance")}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "attendance"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              📅 Attendance Requests ({filteredAttendance.length})
            </button>
            <button
              onClick={() => setActiveTab("leave")}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "leave"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              ✈️ Leave Requests ({filteredLeave.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : activeTab === "attendance" ? (
          <div className="p-6">
            {filteredAttendance.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-4xl mb-2">📭</p>
                <p>No {filterStatus !== "all" ? filterStatus.toLowerCase() : ""} attendance requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAttendance.map(request => (
                  <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                          {request.userName?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{request.userName}</p>
                          <p className="text-sm text-gray-500">{request.userRole} • {request.userEmail}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm text-gray-600">
                              📅 {new Date(request.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                            </span>
                            <span className="text-sm text-gray-600">
                              ⏰ {request.checkInTime} - {request.checkOutTime}
                            </span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              request.status === "PRESENT" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                            }`}>
                              {request.status === "PRESENT" ? "Full Day" : "Half Day"}
                            </span>
                          </div>
                          {request.notes && (
                            <p className="text-sm text-gray-500 mt-1 italic">Note: {request.notes}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {request.approvalStatus === "PENDING" ? (
                          <>
                            <button
                              onClick={() => handleAction(request, "reject")}
                              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              ❌ Reject
                            </button>
                            <button
                              onClick={() => handleAction(request, "approve")}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              ✅ Approve
                            </button>
                          </>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(request.approvalStatus)}`}>
                            {request.approvalStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-6">
            {filteredLeave.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-4xl mb-2">📭</p>
                <p>No {filterStatus !== "all" ? filterStatus.toLowerCase() : ""} leave requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLeave.map(request => {
                  const startDate = new Date(request.startDate);
                  const endDate = new Date(request.endDate);
                  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                  
                  return (
                    <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                            {request.userName?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{request.userName}</p>
                            <p className="text-sm text-gray-500">{request.userRole} • {request.userEmail}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className={`px-2 py-0.5 text-xs rounded-full ${getLeaveTypeColor(request.leaveType)}`}>
                                {request.leaveType}
                              </span>
                              <span className="text-sm text-gray-600">
                                📅 {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                              </span>
                              <span className="text-sm text-gray-600">
                                ({days} day{days > 1 ? "s" : ""})
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                              <strong>Reason:</strong> {request.reason}
                            </p>
                            {request.remarks && (
                              <p className="text-sm text-gray-500 mt-1 italic">Remarks: {request.remarks}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {request.status === "PENDING" ? (
                            <>
                              <button
                                onClick={() => handleAction(request, "reject")}
                                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                ❌ Reject
                              </button>
                              <button
                                onClick={() => handleAction(request, "approve")}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                              >
                                ✅ Approve
                              </button>
                            </>
                          ) : (
                            <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(request.status)}`}>
                              {request.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showActionModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {actionType === "approve" ? "✅ Approve Request" : "❌ Reject Request"}
              </h3>
              <button
                onClick={() => setShowActionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-800">
                <strong>{"userName" in selectedRequest ? (selectedRequest as any).userName : "User"}</strong>
              </p>
              {"checkInTime" in selectedRequest ? (
                <p className="text-sm text-gray-600">
                  Attendance for {new Date((selectedRequest as AttendanceRequest).date).toLocaleDateString()}
                </p>
              ) : (
                <p className="text-sm text-gray-600">
                  {(selectedRequest as LeaveRequest).leaveType} Leave: {" "}
                  {new Date((selectedRequest as LeaveRequest).startDate).toLocaleDateString()} - {" "}
                  {new Date((selectedRequest as LeaveRequest).endDate).toLocaleDateString()}
                </p>
              )}
            </div>

            {message.text && (
              <div className={`mb-4 p-3 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {message.text}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks {actionType === "reject" ? "(Required)" : "(Optional)"}
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={actionType === "reject" ? "Please provide reason for rejection..." : "Any additional remarks..."}
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowActionModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitAction}
                disabled={submitting || (actionType === "reject" && !remarks.trim())}
                className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                  actionType === "approve" 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {submitting ? "Processing..." : actionType === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
