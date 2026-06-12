"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { apiFetch } from "../../../../lib/api";
import { useUserCenter, buildCenterFilterUrl } from "../../../hooks/useUserCenter";

interface ParentMessage {
  id: string;
  parentId: string;
  parentName: string;
  parentEmail: string;
  childName: string;
  childId: string;
  subject: string;
  message: string;
  type: string;
  status: "UNREAD" | "READ" | "REPLIED" | "RESOLVED";
  priority: "HIGH" | "NORMAL" | "LOW";
  createdAt: string;
  repliedAt?: string;
  reply?: string;
}

interface MeetingRequest {
  id: string;
  parentId: string;
  parentName: string;
  parentEmail: string;
  childName: string;
  teacherId: string;
  teacherName: string;
  requestedDate: string;
  requestedTime: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | "CANCELLED";
  response?: string;
  createdAt: string;
  updatedAt?: string;
}

interface Parent {
  id: string;
  fullname: string;
  email: string;
  phone?: string;
  children: { id: string; fullname: string }[];
}

interface BroadcastMessage {
  id: string;
  subject: string;
  message: string;
  type: string;
  recipientCount: number;
  sentBy: string;
  sentAt: string;
  status: "SENT" | "DELIVERED" | "FAILED";
}

export default function ParentCommunicationsPage() {
  const { centerId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [messages, setMessages] = useState<ParentMessage[]>([]);
  const [meetingRequests, setMeetingRequests] = useState<MeetingRequest[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"messages" | "meetings" | "broadcast">("messages");
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Reply modal
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ParentMessage | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);

  // Meeting response modal
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingRequest | null>(null);
  const [meetingResponse, setMeetingResponse] = useState("");
  const [meetingAction, setMeetingAction] = useState<"APPROVED" | "REJECTED">("APPROVED");

  // Broadcast modal
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastType, setBroadcastType] = useState<"all" | "class" | "selected">("all");
  const [broadcastRecipients, setBroadcastRecipients] = useState<string[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);

  useEffect(() => {
    if (!userLoading) {
      fetchData();
    }
  }, [userLoading, centerId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get current user ID
      const userData = Cookies.get("userData");
      let currentUserId = "";
      if (userData) {
        try {
          const parsed = JSON.parse(decodeURIComponent(userData));
          currentUserId = parsed.id || parsed.userId;
        } catch {}
      }

      // Fetch notifications that are parent messages
      // Backend: GET /api/notifications/center/{centerId} for center-filtered, or GET /api/notifications for all
      const notificationsUrl =
        centerId ? `/api/notifications/center/${centerId}` : null;
      const [notificationsData, usersData, studentsData, studentParentsData] = await Promise.all([
        notificationsUrl ? apiFetch(notificationsUrl).catch(() => []) : Promise.resolve([]),
        centerId
          ? apiFetch(`/api/users?centerId=${encodeURIComponent(centerId)}`).catch(() => [])
          : Promise.resolve([]),
        apiFetch(shouldFilterByCenter ? buildCenterFilterUrl('/api/students', centerId) : '/api/students').catch(() => []),
        apiFetch('/api/student-parents').catch(() => [])
      ]);

      // Build maps
      const usersMap = new Map((Array.isArray(usersData) ? usersData : []).map((u: any) => [u.id, u]));
      const studentsMap = new Map((Array.isArray(studentsData) ? studentsData : []).map((s: any) => [s.id, s]));
      const studentParents = Array.isArray(studentParentsData) ? studentParentsData : [];

      // Filter notifications that are from parents (PARENT_MESSAGE or MEETING_REQUEST type)
      const notifications = Array.isArray(notificationsData) ? notificationsData : [];
      
      const parentMessages = notifications
        .filter((n: any) => n.type === "PARENT_MESSAGE" && n.userId === currentUserId)
        .map((n: any) => {
          const parent = usersMap.get(n.referenceId);
          // Find child through student-parent relationship
          const parentStudentLink = studentParents.find((sp: any) => sp.parentId === n.referenceId);
          const child = parentStudentLink ? studentsMap.get(parentStudentLink.studentId) : null;
          
          return {
            id: n.id,
            parentId: n.referenceId || "",
            parentName: parent?.fullname || parent?.name || "Parent",
            parentEmail: parent?.email || "",
            childName: child?.fullname || "Student",
            childId: child?.id || "",
            subject: n.title || "Message",
            message: n.message || "",
            type: n.type || "MESSAGE",
            status: (n.isRead ? "READ" : "UNREAD") as "UNREAD" | "READ" | "REPLIED" | "RESOLVED",
            priority: "NORMAL" as "HIGH" | "NORMAL" | "LOW",
            createdAt: n.createdAt || new Date().toISOString()
          };
        });

      const meetingReqs = notifications
        .filter((n: any) => n.type === "MEETING_REQUEST")
        .map((n: any) => {
          const teacher = usersMap.get(n.userId);
          // Parse meeting details from message
          const dateMatch = n.message?.match(/for (\d{4}-\d{2}-\d{2})/);
          const timeMatch = n.message?.match(/at (\d{2}:\d{2})/);
          const reasonMatch = n.message?.match(/Reason: (.+)/);
          
          return {
            id: n.id,
            parentId: n.referenceId || "",
            parentName: "Parent",
            parentEmail: "",
            childName: "Student",
            teacherId: n.userId || "",
            teacherName: teacher?.fullname || teacher?.name || "Teacher",
            requestedDate: dateMatch?.[1] || new Date().toISOString().split('T')[0],
            requestedTime: timeMatch?.[1] || "09:00",
            reason: reasonMatch?.[1] || n.message || "Parent-Teacher Meeting",
            status: (n.isRead ? "APPROVED" : "PENDING") as "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | "CANCELLED",
            createdAt: n.createdAt || new Date().toISOString()
          };
        });

      // If no real data, show empty state
      if (parentMessages.length === 0 && meetingReqs.length === 0) {
        setMessages([]);
        setMeetingRequests([]);
      } else {
        setMessages(parentMessages);
        setMeetingRequests(meetingReqs);
      }

      // Build parents list for broadcast
      const parentsList = (Array.isArray(usersData) ? usersData : [])
        .filter((u: any) => u.roleName === "PARENT")
        .map((u: any) => {
          const childLinks = studentParents.filter((sp: any) => sp.parentId === u.id);
          const children = childLinks.map((cl: any) => {
            const student = studentsMap.get(cl.studentId);
            return student ? { id: student.id, fullname: student.fullname || "Student" } : null;
          }).filter(Boolean);
          
          return {
            id: u.id,
            fullname: u.fullname || u.name || u.email?.split('@')[0] || "Parent",
            email: u.email || "",
            phone: u.phone,
            children: children as { id: string; fullname: string }[]
          };
        });
      setParents(parentsList);

      // Fetch broadcast history
      try {
        const broadcastsUrl = shouldFilterByCenter 
          ? buildCenterFilterUrl("/api/broadcasts", centerId)
          : "/api/broadcasts";
        const broadcastsData = await apiFetch(broadcastsUrl).catch(() => []);
        const broadcastsArr = Array.isArray(broadcastsData) ? broadcastsData : [];
        
        if (broadcastsArr.length > 0) {
          setBroadcasts(broadcastsArr.map((b: any) => ({
            id: b.id,
            subject: b.subject || b.title || "Broadcast",
            message: b.message || b.content || "",
            type: b.type || b.broadcastType || "ALL_PARENTS",
            recipientCount: b.recipientCount || b.recipients?.length || 0,
            sentBy: b.sentBy || b.senderName || "Admin",
            sentAt: b.sentAt || b.createdAt || new Date().toISOString(),
            status: b.status || "SENT"
          })));
        } else {
          setBroadcasts([]);
        }
      } catch (err) {
        console.error("Error fetching broadcasts:", err);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const replyToMessage = async () => {
    if (!selectedMessage || !replyContent.trim()) {
      alert("Please enter a reply");
      return;
    }

    setSending(true);
    try {
      // Send notification to parent
      await apiFetch('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          userId: selectedMessage.parentId,
          title: `Re: ${selectedMessage.subject}`,
          titleVi: `Trả lời: ${selectedMessage.subject}`,
          message: replyContent,
          messageVi: replyContent,
          type: "CENTER_REPLY",
          referenceType: "message",
          referenceId: selectedMessage.id
        })
      });

      // Mark original as replied
      await apiFetch(`/api/notifications/${selectedMessage.id}/read`, { method: 'PATCH' });

      // Update local state
      setMessages(prev => prev.map(m => 
        m.id === selectedMessage.id 
          ? { ...m, status: "REPLIED", reply: replyContent, repliedAt: new Date().toISOString() }
          : m
      ));

      alert("Reply sent successfully!");
      setShowReplyModal(false);
      setSelectedMessage(null);
      setReplyContent("");
    } catch (err: any) {
      alert(err.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const respondToMeeting = async () => {
    if (!selectedMeeting) return;

    setSending(true);
    try {
      // Send notification to parent
      await apiFetch('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          userId: selectedMeeting.parentId,
          title: `Meeting Request ${meetingAction === "APPROVED" ? "Approved" : "Declined"}`,
          titleVi: `Yêu cầu họp ${meetingAction === "APPROVED" ? "Đã chấp nhận" : "Đã từ chối"}`,
          message: meetingResponse || (meetingAction === "APPROVED" 
            ? `Your meeting request for ${selectedMeeting.requestedDate} at ${selectedMeeting.requestedTime} has been approved.`
            : `Your meeting request has been declined. ${meetingResponse || "Please contact us for alternative arrangements."}`),
          messageVi: meetingResponse || (meetingAction === "APPROVED"
            ? `Yêu cầu họp ngày ${selectedMeeting.requestedDate} lúc ${selectedMeeting.requestedTime} đã được chấp nhận.`
            : `Yêu cầu họp đã bị từ chối. ${meetingResponse || "Vui lòng liên hệ để sắp xếp lại."}`),
          type: "MEETING_RESPONSE",
          referenceType: "meeting",
          referenceId: selectedMeeting.id
        })
      });

      // Update local state
      setMeetingRequests(prev => prev.map(m =>
        m.id === selectedMeeting.id
          ? { ...m, status: meetingAction, response: meetingResponse, updatedAt: new Date().toISOString() }
          : m
      ));

      alert(`Meeting request ${meetingAction.toLowerCase()}!`);
      setShowMeetingModal(false);
      setSelectedMeeting(null);
      setMeetingResponse("");
    } catch (err: any) {
      alert(err.message || "Failed to respond to meeting");
    } finally {
      setSending(false);
    }
  };

  const sendBroadcast = async () => {
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
      alert("Please fill in subject and message");
      return;
    }

    setSending(true);
    try {
      let recipientIds: string[] = [];
      
      if (broadcastType === "all") {
        recipientIds = parents.map(p => p.id);
      } else if (broadcastType === "selected") {
        recipientIds = broadcastRecipients;
      }

      if (recipientIds.length === 0) {
        alert("No recipients selected");
        setSending(false);
        return;
      }

      // Create notifications for all recipients
      const notifications = recipientIds.map(parentId => ({
        userId: parentId,
        title: broadcastSubject,
        titleVi: broadcastSubject,
        message: broadcastMessage,
        messageVi: broadcastMessage,
        type: "ANNOUNCEMENT",
        referenceType: "announcement",
        centerId: centerId || undefined
      }));

      await apiFetch('/api/notifications/bulk', {
        method: 'POST',
        body: JSON.stringify(notifications)
      });

      alert(`Broadcast sent to ${recipientIds.length} parents!`);
      setShowBroadcastModal(false);
      setBroadcastSubject("");
      setBroadcastMessage("");
      setBroadcastRecipients([]);
    } catch (err: any) {
      alert(err.message || "Failed to send broadcast");
    } finally {
      setSending(false);
    }
  };

  const filteredMessages = messages.filter(m => {
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return m.parentName.toLowerCase().includes(q) || 
             m.childName.toLowerCase().includes(q) ||
             m.subject.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredMeetings = meetingRequests.filter(m => {
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return m.parentName.toLowerCase().includes(q) ||
             m.teacherName.toLowerCase().includes(q) ||
             m.reason.toLowerCase().includes(q);
    }
    return true;
  });

  const unreadCount = messages.filter(m => m.status === "UNREAD").length;
  const pendingMeetings = meetingRequests.filter(m => m.status === "PENDING").length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "UNREAD": return "bg-red-100 text-red-800";
      case "READ": return "bg-blue-100 text-blue-800";
      case "REPLIED": return "bg-green-100 text-green-800";
      case "RESOLVED": return "bg-gray-100 text-gray-800";
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "APPROVED": return "bg-green-100 text-green-800";
      case "REJECTED": return "bg-red-100 text-red-800";
      case "COMPLETED": return "bg-blue-100 text-blue-800";
      case "CANCELLED": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH": return "bg-red-500";
      case "NORMAL": return "bg-blue-500";
      case "LOW": return "bg-gray-400";
      default: return "bg-gray-400";
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
            <span className="text-gray-900">Parent Communications</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">📬 Parent Communications</h1>
          <p className="text-gray-500">Manage messages and meeting requests from parents</p>
        </div>
        <button
          onClick={() => setShowBroadcastModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          📢 Send Broadcast
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Unread Messages</p>
              <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
            </div>
            <div className="text-3xl">📩</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Meetings</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingMeetings}</p>
            </div>
            <div className="text-3xl">📅</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Messages</p>
              <p className="text-2xl font-bold text-gray-700">{messages.length}</p>
            </div>
            <div className="text-3xl">💬</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Parents</p>
              <p className="text-2xl font-bold text-blue-600">{parents.length}</p>
            </div>
            <div className="text-3xl">👨‍👩‍👧‍👦</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm">
        {/* Tabs */}
        <div className="border-b flex">
          <button
            onClick={() => setActiveTab("messages")}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === "messages" 
                ? "text-blue-600 border-b-2 border-blue-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            📩 Messages {unreadCount > 0 && <span className="ml-1 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">{unreadCount}</span>}
          </button>
          <button
            onClick={() => setActiveTab("meetings")}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === "meetings" 
                ? "text-blue-600 border-b-2 border-blue-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            📅 Meeting Requests {pendingMeetings > 0 && <span className="ml-1 bg-yellow-500 text-white px-2 py-0.5 rounded-full text-xs">{pendingMeetings}</span>}
          </button>
          <button
            onClick={() => setActiveTab("broadcast")}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === "broadcast" 
                ? "text-blue-600 border-b-2 border-blue-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            📢 Broadcast History
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b bg-gray-50 flex flex-wrap gap-4 items-center">
          <div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, subject..."
              className="px-3 py-2 border rounded-lg text-sm w-64"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              {activeTab === "messages" ? (
                <>
                  <option value="UNREAD">Unread</option>
                  <option value="READ">Read</option>
                  <option value="REPLIED">Replied</option>
                </>
              ) : (
                <>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="COMPLETED">Completed</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : activeTab === "messages" ? (
            /* Messages Tab */
            <div className="space-y-4">
              {filteredMessages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-5xl mb-4">📭</div>
                  <p>No messages found</p>
                </div>
              ) : (
                filteredMessages.map(message => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg border ${message.status === "UNREAD" ? "bg-blue-50 border-blue-200" : "bg-white"}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 mt-2 rounded-full ${getPriorityColor(message.priority)}`}></div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{message.subject}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                              {message.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            From: <strong>{message.parentName}</strong> (Parent of {message.childName})
                          </p>
                          <p className="text-sm text-gray-500 mt-2">{message.message}</p>
                          {message.reply && (
                            <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                              <p className="text-xs text-green-700 font-medium">Your Reply:</p>
                              <p className="text-sm text-green-800">{message.reply}</p>
                            </div>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            Received: {new Date(message.createdAt).toLocaleString()}
                            {message.repliedAt && ` | Replied: ${new Date(message.repliedAt).toLocaleString()}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {message.status !== "REPLIED" && (
                          <button
                            onClick={() => {
                              setSelectedMessage(message);
                              setShowReplyModal(true);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Reply
                          </button>
                        )}
                        <a
                          href={`mailto:${message.parentEmail}`}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
                        >
                          📧 Email
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === "meetings" ? (
            /* Meetings Tab */
            <div className="space-y-4">
              {filteredMeetings.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-5xl mb-4">📅</div>
                  <p>No meeting requests</p>
                </div>
              ) : (
                filteredMeetings.map(meeting => (
                  <div key={meeting.id} className="p-4 bg-white border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">
                            Meeting with {meeting.parentName}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                            {meeting.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Parent of {meeting.childName} • Teacher: {meeting.teacherName}
                        </p>
                        <p className="text-sm text-gray-700 mt-2">
                          📅 {new Date(meeting.requestedDate).toLocaleDateString()} at {meeting.requestedTime}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Reason: {meeting.reason}</p>
                        {meeting.response && (
                          <p className="text-sm text-blue-600 mt-2">Response: {meeting.response}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Requested: {new Date(meeting.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {meeting.status === "PENDING" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedMeeting(meeting);
                              setMeetingAction("APPROVED");
                              setShowMeetingModal(true);
                            }}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedMeeting(meeting);
                              setMeetingAction("REJECTED");
                              setShowMeetingModal(true);
                            }}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            ✕ Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Broadcast History Tab */
            <div>
              <div className="p-4 border-b flex justify-between items-center">
                <span className="text-gray-600">{broadcasts.length} broadcasts sent</span>
                <button
                  onClick={() => setShowBroadcastModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  + New Broadcast
                </button>
              </div>
              {broadcasts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-5xl mb-4">📢</div>
                  <p>No broadcasts sent yet</p>
                  <button
                    onClick={() => setShowBroadcastModal(true)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Send First Broadcast
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {broadcasts.map((broadcast) => (
                    <div key={broadcast.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">📢</span>
                            <h3 className="font-medium text-gray-900">{broadcast.subject}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              broadcast.status === "DELIVERED" ? "bg-green-100 text-green-700" :
                              broadcast.status === "SENT" ? "bg-blue-100 text-blue-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {broadcast.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{broadcast.message}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>📧 {broadcast.recipientCount} recipients</span>
                            <span>👤 {broadcast.sentBy}</span>
                            <span>📅 {new Date(broadcast.sentAt).toLocaleString()}</span>
                            <span className={`px-2 py-0.5 rounded-full ${
                              broadcast.type === "ALL_PARENTS" ? "bg-purple-100 text-purple-700" :
                              broadcast.type === "CLASS_PARENTS" ? "bg-blue-100 text-blue-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                              {broadcast.type === "ALL_PARENTS" ? "All Parents" : 
                               broadcast.type === "CLASS_PARENTS" ? "Class Parents" : "Selected"}
                            </span>
                          </div>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600 ml-4">
                          <span className="text-lg">📋</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reply Modal */}
      {showReplyModal && selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-lg">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Reply to {selectedMessage.parentName}</h2>
              <button onClick={() => setShowReplyModal(false)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Original Message:</p>
                <p className="text-sm text-gray-600">{selectedMessage.message}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Your Reply *</label>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  rows={5}
                  placeholder="Type your reply..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowReplyModal(false)} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={replyToMessage} disabled={sending} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {sending ? "Sending..." : "Send Reply"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Response Modal */}
      {showMeetingModal && selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-lg">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {meetingAction === "APPROVED" ? "Approve" : "Decline"} Meeting Request
              </h2>
              <button onClick={() => setShowMeetingModal(false)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm"><strong>Parent:</strong> {selectedMeeting.parentName}</p>
                <p className="text-sm"><strong>Date:</strong> {selectedMeeting.requestedDate} at {selectedMeeting.requestedTime}</p>
                <p className="text-sm"><strong>Reason:</strong> {selectedMeeting.reason}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Response Message {meetingAction === "APPROVED" ? "(Optional)" : "*"}
                </label>
                <textarea
                  value={meetingResponse}
                  onChange={(e) => setMeetingResponse(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  rows={3}
                  placeholder={meetingAction === "APPROVED" 
                    ? "e.g., Confirmed. Please come to Room 201." 
                    : "Please explain why the meeting is declined..."}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowMeetingModal(false)} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button 
                  onClick={respondToMeeting} 
                  disabled={sending}
                  className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                    meetingAction === "APPROVED" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {sending ? "Sending..." : (meetingAction === "APPROVED" ? "Approve Meeting" : "Decline Meeting")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">📢 Send Broadcast to Parents</h2>
              <button onClick={() => setShowBroadcastModal(false)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Recipients</label>
                <select
                  value={broadcastType}
                  onChange={(e) => setBroadcastType(e.target.value as any)}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                >
                  <option value="all">All Parents ({parents.length})</option>
                  <option value="selected">Selected Parents</option>
                </select>
              </div>
              
              {broadcastType === "selected" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Parents</label>
                  <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
                    {parents.map(parent => (
                      <label key={parent.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={broadcastRecipients.includes(parent.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBroadcastRecipients(prev => [...prev, parent.id]);
                            } else {
                              setBroadcastRecipients(prev => prev.filter(id => id !== parent.id));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{parent.fullname} ({parent.children.map(c => c.fullname).join(", ")})</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{broadcastRecipients.length} selected</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Subject *</label>
                <input
                  type="text"
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  placeholder="Announcement subject"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Message *</label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  rows={5}
                  placeholder="Type your announcement message..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowBroadcastModal(false)} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={sendBroadcast} disabled={sending} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {sending ? "Sending..." : "Send Broadcast"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
