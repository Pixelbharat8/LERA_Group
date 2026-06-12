"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../../lib/api";

interface Notification {
  id: string;
  userId: string;
  title: string;
  titleVi?: string;
  message: string;
  messageVi?: string;
  type: string;
  referenceType?: string;
  referenceId?: string;
  isRead: boolean;
  centerId?: string;
  createdAt: string;
}

export default function CommunicationsManagement() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: "", titleVi: "", message: "", messageVi: "", type: "info", recipients: "all" });
  const [activeTab, setActiveTab] = useState<"notifications" | "templates" | "announcements">("notifications");
  const [editingTemplate, setEditingTemplate] = useState<{ name: string; type: string } | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<{ title: string; date: string; status: string } | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await apiFetch("/api/notifications");
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Backend POST /api/notifications expects Notification entity fields
      // For broadcast (all users), set userId to null so all users see it
      await apiFetch("/api/notifications", {
        method: "POST",
        body: JSON.stringify({
          title: formData.title,
          titleVi: formData.titleVi || formData.title,
          message: formData.message,
          messageVi: formData.messageVi || formData.message,
          type: formData.type,
          referenceType: "announcement",
        }),
      });
      setShowModal(false);
      fetchNotifications();
      setFormData({ title: "", titleVi: "", message: "", messageVi: "", type: "info", recipients: "all" });
      alert("Notification sent successfully!");
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  const handleEditTemplate = (template: { name: string; type: string }) => {
    setEditingTemplate(template);
    alert(`Opening editor for template: ${template.name}\nType: ${template.type}\n\nNote: Template editing requires connecting to the templates API.`);
  };

  const handleEditAnnouncement = (announcement: { title: string; date: string; status: string }) => {
    setEditingAnnouncement(announcement);
    alert(`Opening editor for announcement: ${announcement.title}\nDate: ${announcement.date}\nStatus: ${announcement.status}\n\nNote: Announcement editing requires connecting to the announcements API.`);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communications Center</h1>
          <p className="text-gray-500">Manage notifications, announcements, and messaging</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Send Notification
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm">Total Sent</h3>
          <p className="text-2xl font-bold">{notifications.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm">Read</h3>
          <p className="text-2xl font-bold">{notifications.filter(n => n.isRead).length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <h3 className="text-gray-500 text-sm">Unread</h3>
          <p className="text-2xl font-bold">{notifications.filter(n => !n.isRead).length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <h3 className="text-gray-500 text-sm">Today</h3>
          <p className="text-2xl font-bold">{notifications.filter(n => new Date(n.createdAt).toDateString() === new Date().toDateString()).length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex">
            {(["notifications", "templates", "announcements"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-4 text-sm font-medium capitalize ${activeTab === tab ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === "notifications" && (
          <div className="divide-y">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No notifications sent yet.</div>
            ) : (
              notifications.slice(0, 20).map((notification) => (
                <div key={notification.id} className="p-4 hover:bg-gray-50 flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    notification.type === "warning" ? "bg-orange-100 text-orange-600" :
                    notification.type === "error" ? "bg-red-100 text-red-600" :
                    notification.type === "success" ? "bg-green-100 text-green-600" :
                    "bg-blue-100 text-blue-600"
                  }`}>
                    {notification.type === "warning" ? "⚠️" : notification.type === "error" ? "❌" : notification.type === "success" ? "✅" : "ℹ️"}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{notification.title}</h4>
                    <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                    <p className="text-gray-400 text-xs mt-2">{new Date(notification.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${notification.isRead ? "bg-gray-100 text-gray-600" : "bg-blue-100 text-blue-600"}`}>
                    {notification.isRead ? "Read" : "Unread"}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "templates" && (
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: "Welcome Email", type: "Email", uses: 245 },
                { name: "Payment Reminder", type: "SMS", uses: 189 },
                { name: "Class Cancelled", type: "Push", uses: 56 },
                { name: "Fee Due Notice", type: "Email", uses: 432 },
                { name: "Exam Schedule", type: "Email", uses: 123 },
                { name: "Holiday Notice", type: "Push", uses: 78 },
              ].map((template, i) => (
                <div key={i} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{template.name}</h4>
                    <span className={`px-2 py-1 rounded text-xs ${template.type === "Email" ? "bg-blue-100 text-blue-800" : template.type === "SMS" ? "bg-green-100 text-green-800" : "bg-purple-100 text-purple-800"}`}>
                      {template.type}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm">{template.uses} uses</p>
                  <button onClick={() => handleEditTemplate(template)} className="mt-3 text-blue-600 text-sm hover:underline">Edit Template</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "announcements" && (
          <div className="p-8">
            <div className="space-y-4">
              {[
                { title: "System Maintenance", date: "2024-01-15", status: "Scheduled" },
                { title: "New Course Launch", date: "2024-01-10", status: "Published" },
                { title: "Holiday Notice", date: "2024-01-05", status: "Published" },
              ].map((announcement, i) => (
                <div key={i} className="border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{announcement.title}</h4>
                    <p className="text-gray-500 text-sm">{announcement.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${announcement.status === "Published" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                      {announcement.status}
                    </span>
                    <button onClick={() => handleEditAnnouncement(announcement)} className="text-blue-600 text-sm hover:underline">Edit</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Send Notification</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (Vietnamese)</label>
                <input type="text" value={formData.titleVi} onChange={(e) => setFormData({ ...formData, titleVi: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="Tiêu đề tiếng Việt" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea required rows={4} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Message (Vietnamese)</label>
                <textarea rows={3} value={formData.messageVi} onChange={(e) => setFormData({ ...formData, messageVi: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="Nội dung tiếng Việt" />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
                  <select value={formData.recipients} onChange={(e) => setFormData({ ...formData, recipients: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                    <option value="all">All Users</option>
                    <option value="students">Students</option>
                    <option value="teachers">Teachers</option>
                    <option value="parents">Parents</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Send</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
