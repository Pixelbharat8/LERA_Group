"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import {
  loadMyChildren,
  loadTeachersForChild,
  resolveMyParentUserId,
} from "../../../../lib/parent-context";
import { useLanguage } from "../../../context/LanguageContext";

interface Teacher {
  id: string;
  fullname: string;
  email: string;
  phone?: string;
  subject?: string;
  className?: string;
  avatarUrl?: string;
}

interface CenterStaff {
  id: string;
  fullname: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
}

interface Notification {
  id: string;
  title: string;
  titleVi?: string;
  message: string;
  messageVi?: string;
  type: string;
  createdAt: string;
  isRead: boolean;
  referenceType?: string;
  referenceId?: string;
}

interface MeetingRequest {
  id: string;
  teacherId: string;
  teacherName: string;
  requestedDate: string;
  requestedTime: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  response?: string;
  createdAt: string;
}

interface Child {
  id: string;
  fullname: string;
  studentCode: string;
  className?: string;
  centerId?: string;
  centerName?: string;
}

export default function ParentCommunicationPage() {
  const { language } = useLanguage();
  const isVietnamese = language === "VI";
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [centerStaff, setCenterStaff] = useState<CenterStaff[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [meetingRequests, setMeetingRequests] = useState<MeetingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"announcements" | "teachers" | "meetings" | "contact">("announcements");
  
  // Message form
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageRecipient, setMessageRecipient] = useState<{ id: string; name: string; type: "teacher" | "staff" } | null>(null);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Meeting request form
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingTeacherId, setMeetingTeacherId] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingReason, setMeetingReason] = useState("");
  const [requestingMeeting, setRequestingMeeting] = useState(false);

  // Filter
  const [notificationFilter, setNotificationFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      fetchCommunicationData();
    }
  }, [selectedChildId]);

  const fetchChildren = async () => {
    try {
      const rows = await loadMyChildren();
      const mappedChildren: Child[] = rows.map((s) => ({
        id: s.id,
        fullname: s.fullname || "Student",
        studentCode: s.studentCode || "",
        className: s.className,
        centerId: s.centerId,
        centerName: s.centerName || "Center",
      }));
      setChildren(mappedChildren);
      if (mappedChildren.length > 0) {
        setSelectedChildId(mappedChildren[0].id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchCommunicationData = async () => {
    try {
      setLoading(true);
      const selectedChild = children.find((c) => c.id === selectedChildId);
      const centerId = selectedChild?.centerId;
      const parentUserId = await resolveMyParentUserId();

      const [notificationsData, teachersList] = await Promise.all([
        parentUserId
          ? apiFetch(`/api/notifications/user/${parentUserId}`).catch(() => [])
          : Promise.resolve([]),
        loadTeachersForChild(selectedChildId),
      ]);

      const notificationsArray = Array.isArray(notificationsData) ? notificationsData : [];
      setNotifications(
        notificationsArray.map((n: Record<string, unknown>) => ({
          id: String(n.id),
          title: String(n.title ?? ""),
          titleVi: n.titleVi ? String(n.titleVi) : undefined,
          message: String(n.message ?? ""),
          messageVi: n.messageVi ? String(n.messageVi) : undefined,
          type: String(n.type ?? "GENERAL"),
          createdAt: String(n.createdAt ?? ""),
          isRead: Boolean(n.isRead),
          referenceType: n.referenceType ? String(n.referenceType) : undefined,
          referenceId: n.referenceId ? String(n.referenceId) : undefined,
        }))
      );

      setTeachers(
        teachersList.map((t) => ({
          id: t.id,
          fullname: t.fullname,
          email: t.email,
          phone: t.phone,
          subject: "English",
          className: t.className,
        }))
      );

      if (centerId) {
        const center = (await apiFetch(`/api/centers/${centerId}`).catch(() => null)) as {
          name?: string;
          email?: string;
          phone?: string;
        } | null;
        setCenterStaff(
          center
            ? [
                {
                  id: centerId,
                  fullname: center.name || "Center Office",
                  email: center.email || "",
                  phone: center.phone,
                  role: "CENTER",
                  department: "Front desk",
                },
              ]
            : []
        );
      } else {
        setCenterStaff([]);
      }

      const meetingsData = parentUserId
        ? await apiFetch(`/api/meetings?parentId=${parentUserId}`).catch(() => [])
        : [];
      setMeetingRequests(Array.isArray(meetingsData) ? meetingsData : []);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await apiFetch(`/api/notifications/${notificationId}/read`, { method: "PATCH" });
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async () => {
    if (!messageRecipient || !messageSubject.trim() || !messageContent.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setSendingMessage(true);
    try {
      const senderId = (await resolveMyParentUserId()) || "";

      // Create a notification for the recipient
      await apiFetch('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          userId: messageRecipient.id,
          title: messageSubject,
          titleVi: messageSubject,
          message: messageContent,
          messageVi: messageContent,
          type: "PARENT_MESSAGE",
          referenceType: "parent",
          referenceId: senderId
        })
      });

      alert("Message sent successfully!");
      setShowMessageModal(false);
      setMessageSubject("");
      setMessageContent("");
      setMessageRecipient(null);
    } catch (err: any) {
      alert(err.message || "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const requestMeeting = async () => {
    if (!meetingTeacherId || !meetingDate || !meetingTime || !meetingReason.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setRequestingMeeting(true);
    try {
      const teacher = teachers.find(t => t.id === meetingTeacherId);
      
      // Create notification for teacher
      await apiFetch('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          userId: meetingTeacherId,
          title: "Meeting Request from Parent",
          titleVi: "Yêu cầu họp từ Phụ huynh",
          message: `Meeting requested for ${meetingDate} at ${meetingTime}. Reason: ${meetingReason}`,
          messageVi: `Yêu cầu họp ngày ${meetingDate} lúc ${meetingTime}. Lý do: ${meetingReason}`,
          type: "MEETING_REQUEST",
          referenceType: "meeting"
        })
      });

      // Add to local state
      setMeetingRequests(prev => [...prev, {
        id: Date.now().toString(),
        teacherId: meetingTeacherId,
        teacherName: teacher?.fullname || "Teacher",
        requestedDate: meetingDate,
        requestedTime: meetingTime,
        reason: meetingReason,
        status: "PENDING",
        createdAt: new Date().toISOString()
      }]);

      alert("Meeting request sent successfully!");
      setShowMeetingModal(false);
      setMeetingTeacherId("");
      setMeetingDate("");
      setMeetingTime("");
      setMeetingReason("");
    } catch (err: any) {
      alert(err.message || "Failed to request meeting");
    } finally {
      setRequestingMeeting(false);
    }
  };

  const selectedChild = children.find(c => c.id === selectedChildId);
  const filteredNotifications = notificationFilter === "unread" 
    ? notifications.filter(n => !n.isRead) 
    : notifications;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "MEETING": return "📅";
      case "PAYMENT": return "💰";
      case "ANNOUNCEMENT": return "📢";
      case "ACADEMIC": return "📚";
      case "PARENT_MESSAGE": return "💬";
      default: return "🔔";
    }
  };

  const getMeetingStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "bg-green-100 text-green-800";
      case "REJECTED": return "bg-red-100 text-red-800";
      case "COMPLETED": return "bg-blue-100 text-blue-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/parent" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">Communication</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">📞 Center Communication</h1>
          <p className="text-gray-500">Contact teachers, view announcements, and request meetings</p>
        </div>
        
        {/* Child Selector */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">For child:</label>
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white shadow-sm"
          >
            {children.map(child => (
              <option key={child.id} value={child.id}>
                {child.fullname} - {child.centerName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Center Info Card */}
      {selectedChild && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl">
              🏫
            </div>
            <div>
              <h2 className="text-xl font-bold">{selectedChild.centerName}</h2>
              <p className="text-blue-100">Student: {selectedChild.fullname} ({selectedChild.studentCode})</p>
              <p className="text-blue-100 text-sm">Class: {selectedChild.className || "Not assigned"}</p>
            </div>
            <div className="ml-auto text-right">
              {unreadCount > 0 && (
                <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {unreadCount} unread
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b flex overflow-x-auto">
          <button
            onClick={() => setActiveTab("announcements")}
            className={`px-6 py-4 font-medium whitespace-nowrap transition-colors ${
              activeTab === "announcements" 
                ? "text-blue-600 border-b-2 border-blue-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            📢 Announcements {unreadCount > 0 && <span className="ml-1 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">{unreadCount}</span>}
          </button>
          <button
            onClick={() => setActiveTab("teachers")}
            className={`px-6 py-4 font-medium whitespace-nowrap transition-colors ${
              activeTab === "teachers" 
                ? "text-blue-600 border-b-2 border-blue-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            👩‍🏫 My Child's Teachers
          </button>
          <button
            onClick={() => setActiveTab("meetings")}
            className={`px-6 py-4 font-medium whitespace-nowrap transition-colors ${
              activeTab === "meetings" 
                ? "text-blue-600 border-b-2 border-blue-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            📅 Meeting Requests
          </button>
          <button
            onClick={() => setActiveTab("contact")}
            className={`px-6 py-4 font-medium whitespace-nowrap transition-colors ${
              activeTab === "contact" 
                ? "text-blue-600 border-b-2 border-blue-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            📱 Contact Center
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : activeTab === "announcements" ? (
            /* Announcements Tab */
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => setNotificationFilter("all")}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      notificationFilter === "all" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    onClick={() => setNotificationFilter("unread")}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      notificationFilter === "unread" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    Unread ({unreadCount})
                  </button>
                </div>
              </div>

              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-5xl mb-4">📭</div>
                  <p>No announcements</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map(notification => (
                    <div
                      key={notification.id}
                      onClick={() => !notification.isRead && markNotificationAsRead(notification.id)}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        notification.isRead ? "bg-white" : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className={`font-medium ${notification.isRead ? "text-gray-700" : "text-gray-900"}`}>
                              {isVietnamese && notification.titleVi ? notification.titleVi : notification.title}
                            </h3>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{isVietnamese && notification.messageVi ? notification.messageVi : notification.message}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(notification.createdAt).toLocaleDateString('vi-VN', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === "teachers" ? (
            /* Teachers Tab */
            <div className="space-y-4">
              <p className="text-gray-600">Teachers for {selectedChild?.fullname}'s classes at {selectedChild?.centerName}</p>
              
              {teachers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-5xl mb-4">👩‍🏫</div>
                  <p>No teachers found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teachers.map(teacher => (
                    <div key={teacher.id} className="p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-xl">
                          👩‍🏫
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{teacher.fullname}</h3>
                          <p className="text-sm text-gray-500">{teacher.subject}</p>
                          {teacher.className && (
                            <p className="text-xs text-gray-400">Class: {teacher.className}</p>
                          )}
                          <div className="mt-2 text-sm text-gray-600">
                            <p>📧 {teacher.email}</p>
                            {teacher.phone && <p>📱 {teacher.phone}</p>}
                          </div>
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => {
                                setMessageRecipient({ id: teacher.id, name: teacher.fullname, type: "teacher" });
                                setShowMessageModal(true);
                              }}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              💬 Message
                            </button>
                            <button
                              onClick={() => {
                                setMeetingTeacherId(teacher.id);
                                setShowMeetingModal(true);
                              }}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                              📅 Request Meeting
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === "meetings" ? (
            /* Meetings Tab */
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-gray-600">Your meeting requests with teachers</p>
                <button
                  onClick={() => setShowMeetingModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  ➕ New Meeting Request
                </button>
              </div>

              {meetingRequests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-5xl mb-4">📅</div>
                  <p>No meeting requests</p>
                  <button
                    onClick={() => setShowMeetingModal(true)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Request a Meeting
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {meetingRequests.map(meeting => (
                    <div key={meeting.id} className="p-4 bg-white border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">Meeting with {meeting.teacherName}</h3>
                          <p className="text-sm text-gray-600">
                            📅 {new Date(meeting.requestedDate).toLocaleDateString('vi-VN')} at {meeting.requestedTime}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">Reason: {meeting.reason}</p>
                          {meeting.response && (
                            <p className="text-sm text-blue-600 mt-1">Response: {meeting.response}</p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getMeetingStatusColor(meeting.status)}`}>
                          {meeting.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Requested on {new Date(meeting.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Contact Center Tab */
            <div className="space-y-4">
              <p className="text-gray-600">Contact {selectedChild?.centerName} staff</p>

              {centerStaff.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-5xl mb-4">📱</div>
                  <p>No staff contacts available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {centerStaff.map(staff => (
                    <div key={staff.id} className="p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-xl">
                          {staff.role === "CENTER_MANAGER" ? "👔" : "👋"}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{staff.fullname}</h3>
                          <p className="text-sm text-gray-500">{staff.role.replace(/_/g, " ")}</p>
                          <p className="text-xs text-gray-400">{staff.department}</p>
                          <div className="mt-2 text-sm text-gray-600">
                            <p>📧 {staff.email}</p>
                            {staff.phone && <p>📱 {staff.phone}</p>}
                          </div>
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => {
                                setMessageRecipient({ id: staff.id, name: staff.fullname, type: "staff" });
                                setShowMessageModal(true);
                              }}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              💬 Message
                            </button>
                            {staff.phone && (
                              <a
                                href={`tel:${staff.phone}`}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                              >
                                📞 Call
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Emergency Contact */}
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-medium text-red-800 flex items-center gap-2">
                  🚨 Emergency Contact
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  For urgent matters outside office hours: <strong>1900-LERA (5372)</strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-lg">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Send Message to {messageRecipient?.name}
              </h2>
              <button onClick={() => setShowMessageModal(false)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Subject *</label>
                <input
                  type="text"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  placeholder="Message subject"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Message *</label>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  rows={5}
                  placeholder="Type your message here..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={sendMessage}
                  disabled={sendingMessage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {sendingMessage ? "Sending..." : "Send Message"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Request Modal */}
      {showMeetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-lg">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Request Parent-Teacher Meeting</h2>
              <button onClick={() => setShowMeetingModal(false)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Select Teacher *</label>
                <select
                  value={meetingTeacherId}
                  onChange={(e) => setMeetingTeacherId(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                >
                  <option value="">Choose a teacher</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.fullname} - {t.subject}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Preferred Date *</label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Preferred Time *</label>
                  <select
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  >
                    <option value="">Select time</option>
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="17:00">05:00 PM</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reason for Meeting *</label>
                <textarea
                  value={meetingReason}
                  onChange={(e) => setMeetingReason(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  rows={3}
                  placeholder="Describe the purpose of the meeting..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowMeetingModal(false)}
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={requestMeeting}
                  disabled={requestingMeeting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {requestingMeeting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
