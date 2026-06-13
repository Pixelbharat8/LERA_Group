"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../lib/api";

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  userId?: string;
  userName?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, string>;
  createdAt: string;
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchActivities();
    // Type filter is applied client-side, so we only fetch once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const humanize = (s: string) =>
    String(s).replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const fetchActivities = async () => {
    try {
      setLoading(true);
      // Real, DB-backed activity log (identity_service). Last 30 days.
      const end = new Date().toISOString();
      const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const data = await apiFetch(`/api/activity-logs/date-range?start=${start}&end=${end}`);
      // identity wraps lists in { success, message, data }; also tolerate bare arrays / Page.content.
      const rows = Array.isArray(data) ? data : data?.data ?? data?.content ?? [];
      setActivities(
        rows.map((a: any) => ({
          id: a.id,
          type: a.activityType || a.type || "ACTIVITY",
          title: humanize(a.activityType || a.type || "Activity"),
          description: a.description || "",
          userName: a.userName || a.userId || undefined,
          createdAt: a.createdAt,
        }))
      );
    } catch (error) {
      console.error("Error fetching activities:", error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      USER_LOGIN: "👤",
      USER_LOGOUT: "🚪",
      LEAD_CREATED: "🎯",
      LEAD_UPDATED: "📝",
      STUDENT_ENROLLED: "🎓",
      STUDENT_UPDATED: "📋",
      PAYMENT_RECEIVED: "💰",
      PAYMENT_PENDING: "⏳",
      CLASS_CREATED: "📚",
      CLASS_UPDATED: "✏️",
      ATTENDANCE_MARKED: "✅",
      GRADE_SUBMITTED: "📊",
      MESSAGE_SENT: "💬",
      APPOINTMENT_SCHEDULED: "📅",
      DEFAULT: "📌",
    };
    return icons[type] || icons.DEFAULT;
  };

  const getActivityColor = (type: string) => {
    if (type.includes("LOGIN") || type.includes("LOGOUT")) return "bg-blue-100 text-blue-800";
    if (type.includes("LEAD")) return "bg-purple-100 text-purple-800";
    if (type.includes("STUDENT")) return "bg-green-100 text-green-800";
    if (type.includes("PAYMENT")) return "bg-yellow-100 text-yellow-800";
    if (type.includes("CLASS")) return "bg-indigo-100 text-indigo-800";
    if (type.includes("ATTENDANCE")) return "bg-teal-100 text-teal-800";
    if (type.includes("GRADE")) return "bg-orange-100 text-orange-800";
    return "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  const filteredActivities = activities.filter((activity) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      activity.title.toLowerCase().includes(q) ||
      activity.description.toLowerCase().includes(q) ||
      (activity.userName && activity.userName.toLowerCase().includes(q));
    const matchesType = filter === "all" || activity.type.includes(filter);
    return matchesSearch && matchesType;
  });

  const activityTypes = [
    { value: "all", label: "All Activities" },
    { value: "USER", label: "User Activities" },
    { value: "LEAD", label: "Lead Activities" },
    { value: "STUDENT", label: "Student Activities" },
    { value: "PAYMENT", label: "Payment Activities" },
    { value: "CLASS", label: "Class Activities" },
    { value: "ATTENDANCE", label: "Attendance" },
    { value: "GRADE", label: "Grades" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <nav className="text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-blue-600">
            Dashboard
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Activities</span>
        </nav>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
            <p className="text-gray-600 mt-1">Track all system activities and events</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchActivities}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              🔄 Refresh
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              📥 Export
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">📊</div>
            <div>
              <p className="text-sm text-gray-500">Total Activities</p>
              <p className="text-2xl font-bold text-gray-900">{activities.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">👤</div>
            <div>
              <p className="text-sm text-gray-500">User Activities</p>
              <p className="text-2xl font-bold text-gray-900">
                {activities.filter((a) => a.type.includes("USER")).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">🎯</div>
            <div>
              <p className="text-sm text-gray-500">Lead Activities</p>
              <p className="text-2xl font-bold text-gray-900">
                {activities.filter((a) => a.type.includes("LEAD")).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-2xl">💰</div>
            <div>
              <p className="text-sm text-gray-500">Payment Activities</p>
              <p className="text-2xl font-bold text-gray-900">
                {activities.filter((a) => a.type.includes("PAYMENT")).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {activityTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setFilter(type.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === type.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading activities...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Activities Found</h3>
            <p className="text-gray-500">No activities match your current filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className="p-4 hover:bg-gray-50 transition-colors flex items-start gap-4"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                    {getActivityIcon(activity.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">{activity.title}</h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getActivityColor(
                        activity.type
                      )}`}
                    >
                      {activity.type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{activity.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {activity.userName && (
                      <span className="flex items-center gap-1">
                        <span>👤</span> {activity.userName}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <span>🕐</span> {formatDate(activity.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredActivities.length > 0 && (
        <div className="mt-6 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Showing {filteredActivities.length} of {activities.length} activities
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              Previous
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
