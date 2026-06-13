"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface Center {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  status: string;
  createdAt?: string;
}

interface Staff {
  id: string;
  name: string;
  role: string;
  email?: string;
  status: string;
}

interface ClassInfo {
  id: string;
  name: string;
  teacherName?: string;
  studentCount: number;
  status: string;
}

export default function CenterProfilePage() {
  const params = useParams();
  const centerId = params.id as string;
  
  const [center, setCenter] = useState<Center | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [dateFilter, setDateFilter] = useState("monthly");

  // Real stats from API
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalTeachers: 0,
    totalStaff: 0,
    totalClasses: 0,
    activeClasses: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    attendanceRate: 0,
    totalEnrollments: 0
  });

  const [staff, setStaff] = useState<Staff[]>([]);

  const [classes, setClasses] = useState<ClassInfo[]>([]);

  useEffect(() => {
    fetchCenterProfile();
  }, [centerId]);

  const fetchCenterProfile = async () => {
    try {
      // Fetch center details and all related data in parallel
      const [centerRes, studentsData, teachersData, classesData, enrollmentsData, staffData, paymentsData] = await Promise.all([
        apiFetch(`/api/centers/${centerId}`).catch(() => null),
        apiFetch(`/api/students?centerId=${centerId}`).catch(() => []),
        apiFetch(`/api/teachers?centerId=${centerId}`).catch(() => []),
        apiFetch(`/api/classes?centerId=${centerId}`).catch(() => []),
        apiFetch(`/api/enrollments?centerId=${centerId}`).catch(() => []),
        apiFetch(`/api/users?centerId=${centerId}`).catch(() => []),
        apiFetch(`/api/payments?centerId=${centerId}`).catch(() => []),
      ]);

      // Parse center
      if (centerRes) {
        const data = centerRes?.ok ? await centerRes.json() : centerRes;
        if (data && data.id) setCenter(data);
      }

      // Parse students
      const studentList = Array.isArray(studentsData) ? studentsData : [];
      const activeStudentCount = studentList.filter((s: any) => s.status === "ACTIVE" || s.isActive !== false).length;

      // Parse teachers
      const teacherList = Array.isArray(teachersData) ? teachersData : [];

      // Parse classes
      const classList = Array.isArray(classesData) ? classesData : [];
      const activeClassCount = classList.filter((c: any) => c.status === "ACTIVE" || c.isActive !== false).length;
      setClasses(classList.map((c: any) => ({
        id: c.id,
        name: c.name || c.className || "-",
        teacherName: c.teacherName || c.teacher?.name || "-",
        studentCount: c.studentCount || c.enrolledStudents || 0,
        status: c.status || "ACTIVE",
      })));

      // Parse staff
      const staffList = Array.isArray(staffData) ? staffData : [];
      setStaff(staffList.map((s: any) => ({
        id: s.id,
        name: s.fullname || s.name || "-",
        role: s.roleName || s.role?.name || s.role || "-",
        email: s.email || "-",
        status: s.isActive !== false ? "ACTIVE" : "INACTIVE",
      })));

      // Parse payments for revenue
      const paymentList = Array.isArray(paymentsData) ? paymentsData : [];
      const completedPayments = paymentList.filter((p: any) => p.status === "COMPLETED");
      const totalRevenue = completedPayments.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);
      const pendingAmount = paymentList
        .filter((p: any) => p.status === "PENDING")
        .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

      // Parse enrollments
      const enrollmentList = Array.isArray(enrollmentsData) ? enrollmentsData : [];

      setStats({
        totalStudents: studentList.length,
        activeStudents: activeStudentCount,
        totalTeachers: teacherList.length,
        totalStaff: staffList.length,
        totalClasses: classList.length,
        activeClasses: activeClassCount,
        monthlyRevenue: totalRevenue,
        pendingPayments: pendingAmount,
        attendanceRate: 0,
        totalEnrollments: enrollmentList.length,
      });
    } catch (error) {
      console.error("Error fetching center profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "students", label: "Students", icon: "👨‍🎓" },
    { id: "teachers", label: "Teachers", icon: "👨‍🏫" },
    { id: "staff", label: "Staff", icon: "👥" },
    { id: "classes", label: "Classes", icon: "📚" },
    { id: "finance", label: "Finance", icon: "💰" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/superadmin" className="hover:text-blue-600">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/academy/centers" className="hover:text-blue-600">Centers</Link>
        <span>/</span>
        <span className="text-gray-900">{center?.name || "Center Profile"}</span>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-xl flex items-center justify-center text-4xl">
              🏫
            </div>
            <div>
              <h1 className="text-2xl font-bold">{center?.name || "Center Name"}</h1>
              <p className="text-purple-200">Code: {center?.code || "N/A"}</p>
              <p className="text-purple-200">{center?.address}, {center?.city}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm ${center?.status === "ACTIVE" ? "bg-green-500" : "bg-gray-500"}`}>
                  {center?.status || "ACTIVE"}
                </span>
                <span className="text-sm">📞 {center?.phone || "N/A"}</span>
                <span className="text-sm">✉️ {center?.email || "N/A"}</span>
              </div>
            </div>
          </div>
          <button className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition">
            ✏️ Edit Center
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">👨‍🎓</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
              <p className="text-xs text-gray-500">Total Students</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-xl">👨‍🏫</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTeachers}</p>
              <p className="text-xs text-gray-500">Teachers</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">📚</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.activeClasses}</p>
              <p className="text-xs text-gray-500">Active Classes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-xl">📈</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.attendanceRate}%</p>
              <p className="text-xs text-gray-500">Attendance</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-xl">💰</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">${stats.monthlyRevenue.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Monthly Revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b overflow-x-auto">
          <div className="flex">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition ${
                  activeTab === tab.id 
                    ? "text-purple-600 border-b-2 border-purple-600" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Filter */}
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">
            {tabs.find(t => t.id === activeTab)?.icon} {tabs.find(t => t.id === activeTab)?.label}
          </h3>
          <div className="flex gap-2">
            {["daily", "weekly", "monthly", "yearly"].map(period => (
              <button
                key={period}
                onClick={() => setDateFilter(period)}
                className={`px-3 py-1 text-sm rounded-lg ${
                  dateFilter === period 
                    ? "bg-purple-600 text-white" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Center Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-4">📍 Center Information</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Address:</span><span>{center?.address || "N/A"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">City:</span><span>{center?.city || "N/A"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Country:</span><span>{center?.country || "N/A"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Phone:</span><span>{center?.phone || "N/A"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Email:</span><span>{center?.email || "N/A"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Website:</span><span>{center?.website || "N/A"}</span></div>
                </div>
              </div>

              {/* Performance Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-4">📊 Performance Summary</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Total Enrollments:</span><span className="font-medium">{stats.totalEnrollments}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Active Students:</span><span className="font-medium text-green-600">{stats.activeStudents}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Attendance Rate:</span><span className="font-medium">{stats.attendanceRate}%</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Staff Members:</span><span className="font-medium">{stats.totalStaff}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Pending Payments:</span><span className="font-medium text-red-600">${stats.pendingPayments.toLocaleString()}</span></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "students" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-gray-600">Total: {stats.totalStudents} students</p>
                <Link href={`/dashboard/academy/students?centerId=${centerId}`} className="text-purple-600 hover:underline">
                  View All Students →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{stats.activeStudents}</p>
                  <p className="text-sm text-gray-600">Active</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-600">{stats.totalStudents - stats.activeStudents}</p>
                  <p className="text-sm text-gray-600">Inactive</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">{stats.totalEnrollments}</p>
                  <p className="text-sm text-gray-600">Total Enrollments</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "teachers" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-gray-600">Total: {stats.totalTeachers} teachers</p>
                <Link href={`/dashboard/academy/teachers?centerId=${centerId}`} className="text-purple-600 hover:underline">
                  View All Teachers →
                </Link>
              </div>
            </div>
          )}

          {activeTab === "staff" && (
            <div className="space-y-4">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(Array.isArray(staff) ? staff : []).map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{s.name}</td>
                      <td className="px-4 py-3 text-gray-500">{s.role}</td>
                      <td className="px-4 py-3 text-gray-500">{s.email}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">{s.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/academy/staff/${s.id}`} className="text-purple-600 hover:underline">View Profile</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "classes" && (
            <div className="space-y-4">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(Array.isArray(classes) ? classes : []).map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-gray-500">{c.teacherName}</td>
                      <td className="px-4 py-3">{c.studentCount}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">{c.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/academy/classes/${c.id}`} className="text-purple-600 hover:underline">View Profile</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "finance" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-green-600">${stats.monthlyRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-red-600">${stats.pendingPayments.toLocaleString()}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Collection Rate</p>
                <p className="text-2xl font-bold text-blue-600">89%</p>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-4">⚙️ Center Settings</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Operating Hours</label>
                    <input type="text" defaultValue="8:00 AM - 8:00 PM" className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Capacity</label>
                    <input type="number" defaultValue="500" className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
