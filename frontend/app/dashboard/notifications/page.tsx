"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import { useLanguage } from "../../context/LanguageContext";
import Cookies from "js-cookie";

interface Notification {
  id: string;
  title: string;
  titleVi?: string;
  message: string;
  messageVi?: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
  category?: string;
  conversationId?: string;
  senderId?: string;
  referenceType?: string;
  referenceId?: string;
}

export default function NotificationsPage() {
  const { language } = useLanguage();
  const router = useRouter();
  const isVietnamese = language === "VI";
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID from cookies
  useEffect(() => {
    const userDataStr = Cookies.get("userData");
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        setUserId(userData.id);
      } catch (e) {
        console.error("Failed to parse user data");
      }
    }
  }, []);

  const t = {
    title: isVietnamese ? "Thông Báo" : "Notifications",
    all: isVietnamese ? "Tất cả" : "All",
    unread: isVietnamese ? "Chưa đọc" : "Unread",
    markAllRead: isVietnamese ? "Đánh dấu tất cả đã đọc" : "Mark all as read",
    noNotifications: isVietnamese ? "Không có thông báo" : "No notifications",
    noNotificationsDesc: isVietnamese 
      ? "Bạn đã đọc hết tất cả thông báo" 
      : "You're all caught up!",
    justNow: isVietnamese ? "Vừa xong" : "Just now",
    minutesAgo: isVietnamese ? "phút trước" : "minutes ago",
    hoursAgo: isVietnamese ? "giờ trước" : "hours ago",
    daysAgo: isVietnamese ? "ngày trước" : "days ago",
    delete: isVietnamese ? "Xóa" : "Delete",
    deleted: isVietnamese ? "Đã xóa" : "Deleted",
    viewDetails: isVietnamese ? "Xem chi tiết →" : "View details →",
  };

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      if (!userId) {
        setNotifications([]);
        return;
      }
      const data = await apiFetch(`/api/notifications/user/${userId}`);
      setNotifications(Array.isArray(data) ? data : data.content || []);
    } catch (error) {
      // Don't fabricate notifications on failure — show the real (empty) state.
      console.error("Failed to load notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: "PUT" });
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ));
    } catch (error) {
      // Update locally anyway
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ));
    }
  };

  // Handle notification click - navigate to appropriate page
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read first
    await markAsRead(notification.id);
    
    // Navigate based on referenceType first (most specific)
    if (notification.referenceType) {
      const refRoutes: Record<string, string> = {
        student: `/dashboard/superadmin/students/${notification.referenceId || ""}`,
        teacher: `/dashboard/superadmin/teachers/${notification.referenceId || ""}`,
        payment: `/dashboard/finance/payments${notification.referenceId ? "?id=" + notification.referenceId : ""}`,
        fee: `/dashboard/finance/payments${notification.referenceId ? "?id=" + notification.referenceId : ""}`,
        enrollment: `/dashboard/superadmin/approvals${notification.referenceId ? "?id=" + notification.referenceId : ""}`,
        leave: "/dashboard/staff/leave",
        lesson_plan: "/dashboard/staff/lesson-plans",
        assignment: "/dashboard/student/assignments",
        assignment_submission: "/dashboard/student/assignments",
        exam: "/dashboard/student/exams",
        attendance: "/dashboard/student/attendance",
        grade_report: "/dashboard/student/grades",
        certificate: "/dashboard/student/certificates",
        class: "/dashboard/student/schedule",
        transport: "/dashboard/student/transport",
        curriculum: "/dashboard/staff/curriculum",
        message: "/dashboard/connect",
        task: "/dashboard/staff/tasks",
      };
      if (refRoutes[notification.referenceType]) {
        router.push(refRoutes[notification.referenceType]);
        return;
      }
    }

    // Navigate based on notification type
    if (notification.type === "MESSAGE" || notification.type === "message" || notification.category === "Message" || notification.title?.includes("message")) {
      if (notification.conversationId) {
        router.push(`/dashboard/connect?conversation=${notification.conversationId}`);
      } else {
        router.push("/dashboard/connect");
      }
    } else if (notification.link) {
      router.push(notification.link);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    try {
      await apiFetch(`/api/notifications/user/${userId}/read-all`, { method: "PATCH" });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t.justNow;
    if (diffMins < 60) return `${diffMins} ${t.minutesAgo}`;
    if (diffHours < 24) return `${diffHours} ${t.hoursAgo}`;
    return `${diffDays} ${t.daysAgo}`;
  };

  const getIcon = (type: string, title?: string) => {
    // Check if it's a message notification
    if (type === "MESSAGE" || type === "message" || title?.toLowerCase().includes("message")) {
      return "💬";
    }
    switch (type) {
      case "success": return "✅";
      case "warning": return "⚠️";
      case "error": return "❌";
      case "approval": return "📋";
      case "payment": return "💰";
      default: return "ℹ️";
    }
  };

  const getBgColor = (type: string, isRead: boolean, title?: string) => {
    if (isRead) return "bg-gray-50";
    // Check if it's a message notification
    if (type === "MESSAGE" || type === "message" || title?.toLowerCase().includes("message")) {
      return "bg-purple-50";
    }
    switch (type) {
      case "success": return "bg-green-50";
      case "warning": return "bg-yellow-50";
      case "error": return "bg-red-50";
      case "approval": return "bg-orange-50";
      case "payment": return "bg-emerald-50";
      default: return "bg-blue-50";
    }
  };

  // Delete notification
  const deleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await apiFetch(`/api/notifications/${id}`, { method: "DELETE" });
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      // Remove locally anyway
      setNotifications(notifications.filter(n => n.id !== id));
    }
  };

  // Get display title and message based on language
  const getDisplayTitle = (notification: Notification) => {
    return isVietnamese && notification.titleVi ? notification.titleVi : notification.title;
  };

  const getDisplayMessage = (notification: Notification) => {
    return isVietnamese && notification.messageVi ? notification.messageVi : notification.message;
  };

  const filteredNotifications = filter === "unread" 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <nav className="text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{t.title}</span>
        </nav>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
            {unreadCount > 0 && (
              <p className="text-gray-600 mt-1">{unreadCount} {t.unread.toLowerCase()}</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              {t.markAllRead}
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm p-2 mb-6 inline-flex">
        <button
          onClick={() => setFilter("all")}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            filter === "all" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {t.all}
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            filter === "unread" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {t.unread}
          {unreadCount > 0 && (
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              filter === "unread" ? "bg-white text-blue-600" : "bg-blue-600 text-white"
            }`}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">🔔</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.noNotifications}</h3>
          <p className="text-gray-500">{t.noNotificationsDesc}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`${getBgColor(notification.type, notification.isRead, getDisplayTitle(notification))} rounded-xl p-4 cursor-pointer hover:shadow-md transition-all border border-gray-100 ${
                !notification.isRead ? "border-l-4 border-l-blue-500" : ""
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-2xl flex-shrink-0">{getIcon(notification.type, getDisplayTitle(notification))}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className={`font-semibold ${notification.isRead ? "text-gray-700" : "text-gray-900"}`}>
                      {getDisplayTitle(notification)}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm text-gray-500">
                        {formatTime(notification.createdAt)}
                      </span>
                      <button
                        onClick={(e) => deleteNotification(e, notification.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
                        title={t.delete}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <p className={`mt-1 ${notification.isRead ? "text-gray-500" : "text-gray-700"}`}>
                    {getDisplayMessage(notification)}
                  </p>
                  {notification.referenceType && (
                    <span className="inline-block mt-2 px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full capitalize">
                      {notification.referenceType.replace(/_/g, " ")}
                    </span>
                  )}
                  {notification.category && !notification.referenceType && (
                    <span className="inline-block mt-2 px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                      {notification.category}
                    </span>
                  )}
                  {/* Show link/action hint */}
                  {(notification.type === "MESSAGE" || notification.type === "message" || notification.title?.includes("message")) && (
                    <span className="block mt-2 text-blue-600 text-sm font-medium">
                      {isVietnamese ? "Xem tin nhắn trong LERA Connect →" : "View message in LERA Connect →"}
                    </span>
                  )}
                  {notification.referenceType && notification.type !== "MESSAGE" && notification.type !== "message" && !notification.title?.includes("message") && (
                    <span className="block mt-2 text-blue-600 text-sm font-medium">
                      {t.viewDetails}
                    </span>
                  )}
                </div>
                {!notification.isRead && (
                  <div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
