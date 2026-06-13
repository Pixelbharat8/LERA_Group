"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { apiFetch } from "@/lib/api";

interface TabConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export default function ChairmanDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  const TABS: TabConfig[] = [
    { id: "overview", name: t("systemOverview"), icon: "📊", description: t("systemOverview") },
    { id: "users", name: t("usersAndRoles"), icon: "👥", description: t("usersRolesManagement") },
    { id: "students", name: t("students"), icon: "👨‍🎓", description: t("totalStudents") },
    { id: "approvals", name: t("pendingApprovalsTab"), icon: "✅", description: t("pendingApprovalsTab") },
    { id: "centers", name: t("centersTab"), icon: "🏢", description: t("centersManagement") },
    { id: "departments", name: t("departmentsTab"), icon: "🏛️", description: t("departmentsManagement") },
    { id: "courses", name: t("coursesAndPrograms"), icon: "📚", description: t("coursesAndPrograms") },
    { id: "marketing", name: t("marketingTab"), icon: "📣", description: t("marketingTab") },
    { id: "website", name: t("websiteContent"), icon: "🌐", description: t("websiteContentManagement") },
    { id: "settings", name: t("systemSettings"), icon: "⚙️", description: t("systemSettings") },
    { id: "audit", name: t("auditLogs"), icon: "📋", description: t("auditLogs") },
  ];
  const [stats, setStats] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  
  // Edit modals
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editType, setEditType] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [usersRes, centersRes, deptsRes, coursesRes, settingsRes, rolesRes, studentsRes, enrollmentsRes, paymentsRes, activityRes] = await Promise.all([
        apiFetch("/api/users").catch(() => null),
        apiFetch("/api/centers").catch(() => null),
        apiFetch("/api/departments").catch(() => null),
        apiFetch("/api/courses").catch(() => null),
        apiFetch("/api/system-settings").catch(() => null),
        apiFetch("/api/roles").catch(() => null),
        apiFetch("/api/students").catch(() => null),
        apiFetch("/api/enrollments").catch(() => null),
        apiFetch("/api/payments").catch(() => null),
        apiFetch("/api/activity-logs/date-range?start=" + new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() + "&end=" + new Date().toISOString()).catch(() => null),
      ]);

      let usersData: any[] = [];
      let centersData: any[] = [];
      let deptsData: any[] = [];
      let coursesData: any[] = [];
      let settingsData: any[] = [];
      let rolesData: any[] = [];

      if (usersRes?.ok) {
        const data = await usersRes.json();
        usersData = Array.isArray(data) ? data : data.data || [];
        setUsers(usersData);
      }
      if (centersRes?.ok) {
        const data = await centersRes.json();
        centersData = Array.isArray(data) ? data : data.data || [];
        setCenters(centersData);
      }
      if (deptsRes?.ok) {
        const data = await deptsRes.json();
        deptsData = Array.isArray(data) ? data : data.data || [];
        setDepartments(deptsData);
      }
      if (coursesRes?.ok) {
        const data = await coursesRes.json();
        coursesData = Array.isArray(data) ? data : data.data || [];
        setCourses(coursesData);
      }
      if (settingsRes?.ok) {
        const data = await settingsRes.json();
        settingsData = Array.isArray(data) ? data : data.data || [];
        setSettings(settingsData);
      }
      if (rolesRes?.ok) {
        const data = await rolesRes.json();
        rolesData = Array.isArray(data) ? data : data.data || [];
        setRoles(rolesData);
      }

      // Parse students
      let studentsData: any[] = [];
      if (studentsRes?.ok) {
        const data = await studentsRes.json();
        studentsData = Array.isArray(data) ? data : data.content || data.data || [];
        setStudents(studentsData);
      } else if (Array.isArray(studentsRes)) {
        studentsData = studentsRes;
        setStudents(studentsData);
      }

      // Parse enrollments
      let enrollmentsData: any[] = [];
      if (enrollmentsRes?.ok) {
        const data = await enrollmentsRes.json();
        enrollmentsData = Array.isArray(data) ? data : data.data || [];
        setEnrollments(enrollmentsData);
      } else if (Array.isArray(enrollmentsRes)) {
        enrollmentsData = enrollmentsRes;
        setEnrollments(enrollmentsData);
      }

      // Parse payments
      let paymentsData: any[] = [];
      if (paymentsRes?.ok) {
        const data = await paymentsRes.json();
        paymentsData = Array.isArray(data) ? data : data.data || [];
        setPayments(paymentsData);
      } else if (Array.isArray(paymentsRes)) {
        paymentsData = paymentsRes;
        setPayments(paymentsData);
      }

      // Parse activity logs
      let activityData: any[] = [];
      if (activityRes?.ok) {
        const data = await activityRes.json();
        activityData = Array.isArray(data) ? data : data.data || data.content || [];
        setActivityLogs(activityData);
      } else if (Array.isArray(activityRes)) {
        activityData = activityRes;
        setActivityLogs(activityData);
      }

      // Calculate stats from fetched data (not from state)
      const totalRevenue = paymentsData
        .filter((p: any) => p.status === "COMPLETED")
        .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

      setStats({
        totalUsers: usersData.length,
        totalCenters: centersData.length,
        totalDepartments: deptsData.length,
        totalCourses: coursesData.length,
        totalStudents: studentsData.length,
        totalEnrollments: enrollmentsData.length,
        totalRevenue,
        pendingApprovals: pendingApprovals.length,
      });

    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (item: any, type: string) => {
    setEditingItem({ ...item });
    setEditType(type);
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!editingItem) return;

    let endpoint = "";
    
    switch (editType) {
      case "user": endpoint = `/api/users/${editingItem.id}`; break;
      case "center": endpoint = `/api/centers/${editingItem.id}`; break;
      case "department": endpoint = `/api/departments/${editingItem.id}`; break;
      case "course": endpoint = `/api/courses/${editingItem.id}`; break;
      case "setting": endpoint = `/api/system-settings/${editingItem.id}`; break;
      case "role": endpoint = `/api/roles/${editingItem.id}`; break;
    }

    try {
      const res = await apiFetch(endpoint, {
        method: "PUT",
        body: JSON.stringify(editingItem),
      });

      if (res.ok) {
        setShowEditModal(false);
        setEditingItem(null);
        fetchData();
        alert(t("updatedSuccessfully"));
      } else {
        alert(t("failedToUpdate"));
      }
    } catch (error) {
      console.error("Save error:", error);
      alert(t("errorSaving"));
    }
  };

  const handleDelete = async (id: string, type: string) => {
    if (!confirm(t("confirmDelete"))) return;

    let endpoint = "";
    
    switch (type) {
      case "user": endpoint = `/api/users/${id}`; break;
      case "center": endpoint = `/api/centers/${id}`; break;
      case "department": endpoint = `/api/departments/${id}`; break;
      case "course": endpoint = `/api/courses/${id}`; break;
      case "setting": endpoint = `/api/system-settings/${id}`; break;
    }

    try {
      const res = await apiFetch(endpoint, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchData();
        alert(t("deletedSuccessfully"));
      } else {
        alert(t("failedToDelete"));
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleApprove = async (id: string) => {
    // Implement approval logic
    alert("Approved!");
    fetchData();
  };

  const handleReject = async (id: string) => {
    // Implement rejection logic
    alert("Rejected!");
    fetchData();
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) return `₫${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `₫${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `₫${(amount / 1000).toFixed(0)}K`;
    return `₫${amount.toLocaleString()}`;
  };

  // Build real recent activity from all data sources
  const getRecentActivities = () => {
    const activities: { action: string; user: string; time: string; icon: string }[] = [];

    // Recent students (last created)
    const sortedStudents = [...students]
      .filter((s: any) => s.createdAt)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
    sortedStudents.forEach((s: any) => {
      activities.push({
        action: t("newStudentRegistered"),
        user: s.fullname || s.name || s.studentCode || "Student",
        time: new Date(s.createdAt).toLocaleDateString(),
        icon: "👨‍🎓",
      });
    });

    // Recent payments
    const sortedPayments = [...payments]
      .filter((p: any) => p.createdAt || p.paymentDate)
      .sort((a: any, b: any) => new Date(b.createdAt || b.paymentDate).getTime() - new Date(a.createdAt || a.paymentDate).getTime())
      .slice(0, 3);
    sortedPayments.forEach((p: any) => {
      activities.push({
        action: t("paymentReceived"),
        user: `₫${(parseFloat(p.amount) || 0).toLocaleString()} - ${p.paymentMethod || "N/A"}`,
        time: new Date(p.createdAt || p.paymentDate).toLocaleDateString(),
        icon: "💰",
      });
    });

    // Recent users
    const sortedUsers = [...users]
      .filter((u: any) => u.createdAt)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
    sortedUsers.forEach((u: any) => {
      activities.push({
        action: t("newUserRegistered"),
        user: u.fullname || u.name || u.email || "User",
        time: new Date(u.createdAt).toLocaleDateString(),
        icon: "👤",
      });
    });

    // Recent enrollments
    const sortedEnrollments = [...enrollments]
      .filter((e: any) => e.createdAt)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2);
    sortedEnrollments.forEach((e: any) => {
      activities.push({
        action: t("newEnrollment"),
        user: e.studentName || e.className || "Enrollment",
        time: new Date(e.createdAt).toLocaleDateString(),
        icon: "📝",
      });
    });

    // Activity logs from backend
    activityLogs.slice(0, 3).forEach((log: any) => {
      activities.push({
        action: log.activityType || log.action || "Activity",
        user: log.description || log.details || "",
        time: log.createdAt ? new Date(log.createdAt).toLocaleDateString() : "",
        icon: "📋",
      });
    });

    // Sort all by time (most recent first) and take top 8
    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 8);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">👑 {t("chairmanControlPanel")} - {t("systemOverview")}</h2>
      
      {/* Quick Stats - expanded with Students, Enrollments, Revenue */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t("totalUsers")} value={users.length} icon="👥" color="blue" />
        <StatCard title={t("totalStudents")} value={students.length} icon="👨‍🎓" color="green" />
        <StatCard title={t("centersTab")} value={centers.length} icon="🏢" color="purple" />
        <StatCard title={t("courses")} value={courses.length} icon="📚" color="orange" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t("departmentsTab")} value={departments.length} icon="🏛️" color="purple" />
        <StatCard title={t("enrollments")} value={enrollments.length} icon="�" color="blue" />
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-2xl">💰</div>
            <div>
              <p className="text-gray-500 text-sm">{t("totalRevenue")}</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue || 0)}</p>
            </div>
          </div>
        </div>
        <StatCard title={t("pendingApprovalsCount")} value={pendingApprovals.length} icon="⏳" color="red" />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">🚀 {t("quickActions")}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction title={t("addUser")} icon="👤➕" onClick={() => setActiveTab("users")} />
          <QuickAction title={t("addCenter")} icon="🏢➕" onClick={() => setActiveTab("centers")} />
          <QuickAction title={t("viewStudents")} icon="👨‍🎓" onClick={() => setActiveTab("students")} />
          <QuickAction title={t("reviewApprovals")} icon="✅" onClick={() => setActiveTab("approvals")} />
        </div>
      </div>

      {/* Recent Activity - REAL DATA from all sources */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">📋 {t("recentActivity")}</h3>
        <div className="space-y-3">
          {getRecentActivities().length > 0 ? (
            getRecentActivities().map((activity, idx) => (
              <ActivityItem key={idx} action={`${activity.icon} ${activity.action}`} user={activity.user} time={activity.time} />
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">{t("noRecentActivity")}</p>
          )}
        </div>
      </div>

      {/* Recent Students Table - shows latest 5 students added across ALL centers */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">👨‍🎓 {t("recentStudents")}</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">{t("name")}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">{t("code")}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">{t("email")}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">{t("status")}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">{t("date")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[...students]
                .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                .slice(0, 5)
                .map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{s.fullname || s.name || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{s.studentCode || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{s.email || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        s.status === "ACTIVE" || s.isActive !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {s.status === "ACTIVE" || s.isActive !== false ? t("active") : t("inactive")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "-"}</td>
                  </tr>
                ))}
              {students.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">{t("noStudentsFound")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">👥 {t("usersRolesManagement")}</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          {t("addNewUser")}
        </button>
      </div>

      {/* Roles Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">🔐 {t("systemRoles")}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {roles.map((role: any) => (
            <div key={role.id} className="p-3 border rounded-lg hover:border-blue-500 cursor-pointer"
              onClick={() => handleEdit(role, "role")}>
              <div className="font-medium">{role.name}</div>
              <div className="text-sm text-gray-500">{role.description || t("noDescription")}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder={t("searchUsers")}
            className="w-full md:w-64 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">{t("name")}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">{t("email")}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">{t("role")}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">{t("status")}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.slice(0, 20).map((user: any) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{user.fullname || user.name}</td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {user.roleName || user.role?.name || "User"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-sm ${
                      user.isActive !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {user.isActive !== false ? t("active") : t("inactive")}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <button onClick={() => handleEdit(user, "user")} 
                      className="text-blue-600 hover:underline">{t("edit")}</button>
                    <button onClick={() => handleDelete(user.id, "user")}
                      className="text-red-600 hover:underline">{t("delete")}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderApprovals = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">✅ {t("pendingApprovalsTab")}</h2>
      
      {pendingApprovals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">✨</div>
          <h3 className="text-xl font-semibold text-gray-700">{t("allCaughtUp")}</h3>
          <p className="text-gray-500">{t("noPendingApprovals")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingApprovals.map((item: any) => (
            <div key={item.id} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                  <p className="text-gray-400 text-xs mt-2">{t("submittedBy")}: {item.submittedBy}</p>
                </div>
                <div className="space-x-2">
                  <button onClick={() => handleApprove(item.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    {t("approve")}
                  </button>
                  <button onClick={() => handleReject(item.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                    {t("reject")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCenters = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">🏢 {t("centersManagement")}</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          {t("addNewCenter")}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {centers.map((center: any) => (
          <div key={center.id} className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-lg">{center.name}</h3>
              <span className={`px-2 py-1 rounded text-xs ${
                center.isActive !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}>
                {center.isActive !== false ? t("active") : t("inactive")}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-2">📍 {center.address || t("noAddress")}</p>
            <p className="text-gray-600 text-sm mb-4">📞 {center.phone || t("noPhone")}</p>
            <div className="flex space-x-2">
              <button onClick={() => handleEdit(center, "center")}
                className="flex-1 bg-blue-100 text-blue-600 px-3 py-2 rounded hover:bg-blue-200">
                {t("edit")}
              </button>
              <button onClick={() => handleDelete(center.id, "center")}
                className="flex-1 bg-red-100 text-red-600 px-3 py-2 rounded hover:bg-red-200">
                {t("delete")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDepartments = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">🏛️ {t("departmentsManagement")}</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          {t("addDepartment")}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">{t("department")}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">{t("code")}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">{t("type")}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">{t("status")}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {departments.map((dept: any) => (
              <tr key={dept.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{dept.departmentName || dept.name}</td>
                <td className="px-4 py-3 text-gray-600">{dept.departmentCode || dept.code}</td>
                <td className="px-4 py-3">{dept.departmentType || dept.type || t("general")}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">{t("active")}</span>
                </td>
                <td className="px-4 py-3 space-x-2">
                  <button onClick={() => handleEdit(dept, "department")}
                    className="text-blue-600 hover:underline">{t("edit")}</button>
                  <button onClick={() => handleDelete(dept.id, "department")}
                    className="text-red-600 hover:underline">{t("delete")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCourses = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">📚 {t("coursesAndPrograms")}</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          {t("addCourse")}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course: any) => (
          <div key={course.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            <div className="p-6">
              <h3 className="font-semibold text-lg mb-2">{course.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{course.description?.substring(0, 100) || t("noDescription")}...</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{course.category || t("general")}</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">{course.level || t("allLevels")}</span>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => handleEdit(course, "course")}
                  className="flex-1 bg-blue-100 text-blue-600 px-3 py-2 rounded hover:bg-blue-200">
                  {t("edit")}
                </button>
                <button onClick={() => handleDelete(course.id, "course")}
                  className="flex-1 bg-red-100 text-red-600 px-3 py-2 rounded hover:bg-red-200">
                  {t("delete")}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">⚙️ {t("systemSettings")}</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          {t("addSetting")}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">{t("key")}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">{t("value")}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">{t("category")}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">{t("public")}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {settings.map((setting: any) => (
              <tr key={setting.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-sm">{setting.settingKey}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{setting.settingValue}</td>
                <td className="px-4 py-3">{setting.category || t("general")}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    setting.isPublic ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}>
                    {setting.isPublic ? t("yes") : t("no")}
                  </span>
                </td>
                <td className="px-4 py-3 space-x-2">
                  <button onClick={() => handleEdit(setting, "setting")}
                    className="text-blue-600 hover:underline">{t("edit")}</button>
                  <button onClick={() => handleDelete(setting.id, "setting")}
                    className="text-red-600 hover:underline">{t("delete")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAudit = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">📋 {t("auditLogs")}</h2>
      
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="space-y-4">
          {activityLogs.length > 0 ? (
            activityLogs.slice(0, 20).map((log: any, idx: number) => (
              <AuditLogItem
                key={log.id || idx}
                action={log.activityType || log.action || "Activity"}
                user={log.userEmail || log.userId || "-"}
                details={log.description || log.details || "-"}
                timestamp={log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}
              />
            ))
          ) : (
            <>
              {/* Synthesize audit from real data if no activity-log endpoint data */}
              {[...users]
                .filter((u: any) => u.createdAt)
                .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((u: any, idx: number) => (
                  <AuditLogItem
                    key={`user-${idx}`}
                    action={t("newUserRegistered")}
                    user={u.email || "-"}
                    details={`${t("created")}: ${u.fullname || u.name || u.email}`}
                    timestamp={new Date(u.createdAt).toLocaleString()}
                  />
                ))}
              {[...students]
                .filter((s: any) => s.createdAt)
                .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((s: any, idx: number) => (
                  <AuditLogItem
                    key={`student-${idx}`}
                    action={t("newStudentRegistered")}
                    user={s.email || "-"}
                    details={`${t("created")}: ${s.fullname || s.name || s.studentCode}`}
                    timestamp={new Date(s.createdAt).toLocaleString()}
                  />
                ))}
              {[...payments]
                .filter((p: any) => p.createdAt || p.paymentDate)
                .sort((a: any, b: any) => new Date(b.createdAt || b.paymentDate).getTime() - new Date(a.createdAt || a.paymentDate).getTime())
                .slice(0, 5)
                .map((p: any, idx: number) => (
                  <AuditLogItem
                    key={`payment-${idx}`}
                    action={t("paymentReceived")}
                    user={p.studentId || "-"}
                    details={`₫${(parseFloat(p.amount) || 0).toLocaleString()} - ${p.paymentMethod || "N/A"}`}
                    timestamp={new Date(p.createdAt || p.paymentDate).toLocaleString()}
                  />
                ))}
              {users.length === 0 && students.length === 0 && payments.length === 0 && (
                <p className="text-gray-500 text-center py-4">{t("noRecentActivity")}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderWebsiteContent = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">🌐 {t("websiteContentManagement")}</h2>
          <p className="text-gray-600">{t("managePublicContent")}</p>
        </div>
        <a
          href="/dashboard/chairman/website-content"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          {t("openContentManager")}
        </a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { id: "home", title: "Home Page", icon: "🏠", desc: "Hero, features, highlights" },
          { id: "about", title: "About Page", icon: "ℹ️", desc: "Mission, vision, values" },
          { id: "courses", title: "Courses", icon: "📚", desc: "Course content & details" },
          { id: "contact", title: "Contact", icon: "📞", desc: "Contact info & FAQ" },
          { id: "privacy", title: "Privacy Policy", icon: "🔒", desc: "Privacy terms" },
          { id: "terms", title: "Terms of Service", icon: "📜", desc: "Terms & conditions" },
          { id: "testimonials", title: "Testimonials", icon: "⭐", desc: "Customer reviews" },
          { id: "leadership", title: "Leadership", icon: "👔", desc: "Team members" },
        ].map((item) => (
          <a
            key={item.id}
            href={`/dashboard/chairman/website-content/${item.id}`}
            className="block p-4 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-300 border border-gray-200 transition-colors"
          >
            <div className="text-2xl mb-2">{item.icon}</div>
            <h3 className="font-bold text-gray-900">{item.title}</h3>
            <p className="text-sm text-gray-500">{item.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );

  const renderStudents = () => {
    const filteredStudents = students.filter((s: any) => {
      if (!studentSearch) return true;
      const q = studentSearch.toLowerCase();
      return (
        (s.fullname || s.name || "").toLowerCase().includes(q) ||
        (s.studentCode || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q)
      );
    });

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">👨‍🎓 {t("totalStudents")} ({students.length})</h2>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title={t("totalStudents")} value={students.length} icon="👨‍🎓" color="green" />
          <StatCard title={t("enrollments")} value={enrollments.length} icon="📝" color="blue" />
          <StatCard title={t("centersTab")} value={centers.length} icon="🏢" color="purple" />
          <StatCard title={t("courses")} value={courses.length} icon="📚" color="orange" />
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b">
            <input
              type="text"
              placeholder={t("searchStudents")}
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full md:w-64 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">{t("name")}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">{t("code")}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">{t("email")}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">{t("center")}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">{t("status")}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">{t("date")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStudents.slice(0, 50).map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{s.fullname || s.name || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{s.studentCode || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{s.email || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {centers.find((c: any) => c.id === s.centerId)?.name || s.centerName || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        s.status === "ACTIVE" || s.isActive !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {s.status === "ACTIVE" || s.isActive !== false ? t("active") : t("inactive")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-sm">
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">{t("noStudentsFound")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredStudents.length > 50 && (
            <div className="p-4 text-center text-gray-500 text-sm border-t">
              {t("showing")} 50 / {filteredStudents.length} {t("students")}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview": return renderOverview();
      case "users": return renderUsers();
      case "students": return renderStudents();
      case "approvals": return renderApprovals();
      case "centers": return renderCenters();
      case "departments": return renderDepartments();
      case "courses": return renderCourses();
      case "marketing":
        if (typeof window !== "undefined") {
          window.location.href = "/dashboard/chairman/marketing";
        }
        return null;
      case "website": return renderWebsiteContent();
      case "settings": return renderSettings();
      case "audit": return renderAudit();
      default: return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">👑 {t("chairmanControlPanel")}</h1>
        <p className="text-gray-600">{t("fullAdminAccess")}</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-lg mb-6 overflow-x-auto">
        <div className="flex p-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>{tab.icon}</span>
              <span className="font-medium">{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        renderContent()
      )}

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{t("edit")} {editType}</h3>
            <div className="space-y-4">
              {Object.keys(editingItem).filter(k => k !== "id" && !k.includes("At")).map((key) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </label>
                  <input
                    type="text"
                    value={editingItem[key] || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, [key]: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                {t("cancel")}
              </button>
              <button onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {t("saveChanges")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function StatCard({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
    red: "bg-red-500",
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${colors[color]} rounded-xl flex items-center justify-center text-2xl`}>
          {icon}
        </div>
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ title, icon, onClick }: { title: string; icon: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors"
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-sm font-medium">{title}</div>
    </button>
  );
}

function ActivityItem({ action, user, time }: { action: string; user: string; time: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div>
        <p className="font-medium">{action}</p>
        <p className="text-sm text-gray-500">by {user}</p>
      </div>
      <p className="text-xs text-gray-400">{time}</p>
    </div>
  );
}

function AuditLogItem({ action, user, details, timestamp }: { action: string; user: string; details: string; timestamp: string }) {
  return (
    <div className="flex items-start gap-4 p-4 border rounded-lg">
      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
        📝
      </div>
      <div className="flex-1">
        <div className="flex justify-between">
          <p className="font-semibold">{action}</p>
          <p className="text-xs text-gray-400">{timestamp}</p>
        </div>
        <p className="text-sm text-gray-600">{details}</p>
        <p className="text-xs text-gray-400">by {user}</p>
      </div>
    </div>
  );
}
