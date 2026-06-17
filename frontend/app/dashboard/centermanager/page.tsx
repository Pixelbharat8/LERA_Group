"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { apiFetch, hasAuthSession } from "../../../lib/api";
import { useLanguage } from "../../context/LanguageContext";

export default function CenterManagerDashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [centerInfo, setCenterInfo] = useState<{ id: string; name: string } | null>(null);
  const [statsData, setStatsData] = useState({
    students: 0,
    teachers: 0,
    classesToday: 0,
    monthlyRevenue: 0,
    courses: 0,
    enrollments: 0,
    attendance: 0,
    leaves: 0,
  });

  // Dynamic quick actions based on permissions
  const allQuickActions = [
    { label: "Students", href: "/dashboard/centermanager/students", icon: "👨‍🎓", color: "bg-blue-600", permission: "students" },
    { label: "Teachers", href: "/dashboard/centermanager/teachers", icon: "👨‍🏫", color: "bg-green-600", permission: "teachers" },
    { label: "Classes", href: "/dashboard/centermanager/classes", icon: "📚", color: "bg-purple-600", permission: "classes" },
    { label: "Courses", href: "/dashboard/academy/courses", icon: "📖", color: "bg-indigo-600", permission: "courses" },
    { label: "Classrooms", href: "/dashboard/academy/classrooms", icon: "🏫", color: "bg-teal-600", permission: "classrooms" },
    { label: "Enrollments", href: "/dashboard/academy/enrollments", icon: "📝", color: "bg-cyan-600", permission: "enrollments" },
    { label: "Payments", href: "/dashboard/payments", icon: "💰", color: "bg-yellow-600", permission: "payments" },
    { label: "Attendance", href: "/dashboard/attendance", icon: "📋", color: "bg-orange-600", permission: "attendance" },
    { label: "Leave Requests", href: "/dashboard/attendance/leave-approvals", icon: "🏖️", color: "bg-pink-600", permission: "leave" },
    { label: "Users", href: "/dashboard/superadmin/users", icon: "👥", color: "bg-gray-600", permission: "users" },
    { label: "Centers", href: "/dashboard/superadmin/centers", icon: "🏢", color: "bg-emerald-600", permission: "centers" },
    { label: "Reports", href: "/dashboard/reports", icon: "📊", color: "bg-red-600", permission: "reports" },
  ];

  useEffect(() => {
    if (!hasAuthSession()) { router.push("/auth/login"); return; }
    try {
      const userData = Cookies.get("userData");
      if (userData) {
        const parsed = JSON.parse(decodeURIComponent(userData));
        setUser(parsed);
        // Get permissions from user data or fetch from role
        if (parsed.permissions) {
          setPermissions(parsed.permissions);
        }
      }
    } catch (e) { console.error(e); }
    fetchDashboardData();
    fetchUserPermissions();
  }, [router]);

  const fetchUserPermissions = async () => {
    try {
      const userData = Cookies.get("userData");
      if (userData) {
        const parsed = JSON.parse(decodeURIComponent(userData));
        const userId = parsed.id;
        const roleName = parsed.roleName || parsed.role;
        
        // First try to get user-specific permissions
        if (userId) {
          try {
            const userPerms = await apiFetch(`/api/user-permissions/user/${userId}`);
            if (userPerms && typeof userPerms === 'object') {
              // Convert UserPermission object to string array
              const permArray: string[] = [];
              const permMap: Record<string, boolean> = userPerms;
              
              // Map permission fields to string keys
              const fieldMap: Record<string, string> = {
                dashboard: 'dashboard',
                centers: 'centers',
                users: 'users',
                students: 'students',
                teachers: 'teachers',
                classes: 'classes',
                courses: 'courses',
                attendance: 'attendance',
                payments: 'payments',
                payroll: 'payroll',
                reports: 'reports',
                settings: 'settings',
                aiAssistant: 'ai_assistant',
                ai_assistant: 'ai_assistant',
                communication: 'communication',
                documents: 'documents',
                classrooms: 'classrooms',
                enrollments: 'enrollments',
                leave: 'leave',
              };
              
              Object.entries(permMap).forEach(([key, value]) => {
                if (value === true) {
                  const mappedKey = fieldMap[key] || key;
                  if (!permArray.includes(mappedKey)) {
                    permArray.push(mappedKey);
                  }
                }
              });
              
              if (permArray.length > 0) {
                setPermissions(permArray);
                return;
              }
            }
          } catch (e) {
            console.log("No user-specific permissions found, falling back to role");
          }
        }
        
        // Fallback: Get role-based permissions
        if (roleName) {
          const rolesData = await apiFetch("/api/roles").catch(() => []);
          const roles = Array.isArray(rolesData) ? rolesData : rolesData.data || [];
          const myRole = roles.find((r: any) => r.name?.toUpperCase() === roleName?.toUpperCase());
          
          if (myRole?.permissions && Array.isArray(myRole.permissions)) {
            setPermissions(myRole.permissions);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Get user's assigned center
      let centerId = null;
      const userData = Cookies.get("userData");
      if (userData) {
        const parsed = JSON.parse(decodeURIComponent(userData));
        centerId = parsed.centerId;
      }
      
      // Filter all data by center if centerId is assigned
      const centerFilter = centerId ? `?centerId=${centerId}` : "";
      
      // Fetch center info if assigned
      if (centerId) {
        try {
          const center = await apiFetch(`/api/centers/${centerId}`);
          if (center) {
            setCenterInfo({ id: centerId, name: center.name || center.centerName || "My Center" });
          }
        } catch (e) {
          console.log("Could not fetch center info");
        }
      }
      
      const [students, teachers, classes, courses, enrollments, payments] = await Promise.all([
        apiFetch(`/api/students${centerFilter}`).catch(() => []),
        apiFetch(`/api/teachers${centerFilter}`).catch(() => []),
        apiFetch(`/api/classes${centerFilter}`).catch(() => []),
        apiFetch(`/api/courses${centerFilter}`).catch(() => []),
        apiFetch(`/api/enrollments${centerFilter}`).catch(() => []),
        apiFetch(`/api/payments${centerFilter}`).catch(() => []),
      ]);

      const studentCount = Array.isArray(students) ? students.length : 0;
      const teacherCount = Array.isArray(teachers) ? teachers.length : 0;
      const classCount = Array.isArray(classes) ? classes.length : 0;
      const courseCount = Array.isArray(courses) ? courses.length : 0;
      const enrollmentCount = Array.isArray(enrollments) ? enrollments.length : 0;
      const paymentList = Array.isArray(payments) ? payments : [];
      const centerRevenue = paymentList
        .filter((p: any) => p.status === "COMPLETED")
        .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

      setStatsData({
        students: studentCount,
        teachers: teacherCount,
        classesToday: Math.min(classCount, 12),
        monthlyRevenue: centerRevenue,
        courses: courseCount,
        enrollments: enrollmentCount,
        attendance: 0,
        leaves: 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) return `₫${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `₫${(amount / 1000000).toFixed(0)}M`;
    return `₫${amount.toLocaleString()}`;
  };

  // Filter quick actions based on permissions
  const quickActions = allQuickActions.filter(action => 
    permissions.length === 0 || permissions.includes(action.permission)
  );

  // Dynamic stats based on permissions
  const allStats = [
    { label: "Students", value: statsData.students.toLocaleString(), icon: "👨‍🎓", color: "bg-blue-500", permission: "students" },
    { label: "Teachers", value: statsData.teachers.toString(), icon: "👨‍🏫", color: "bg-green-500", permission: "teachers" },
    { label: "Classes Today", value: statsData.classesToday.toString(), icon: "📚", color: "bg-purple-500", permission: "classes" },
    { label: "Courses", value: statsData.courses.toString(), icon: "📖", color: "bg-indigo-500", permission: "courses" },
    { label: "Enrollments", value: statsData.enrollments.toString(), icon: "📝", color: "bg-cyan-500", permission: "enrollments" },
    { label: "Monthly Revenue", value: formatCurrency(statsData.monthlyRevenue), icon: "💰", color: "bg-yellow-500", permission: "payments" },
  ];

  const stats = allStats.filter(stat => 
    permissions.length === 0 || permissions.includes(stat.permission)
  ).slice(0, 4); // Show max 4 stats

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">{t("centerManagerDashboard")}</h1>
        <p className="text-gray-600">{t("manageCenter")}</p>
        <div className="flex flex-wrap gap-3 mt-2">
          {centerInfo && (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              🏢 {centerInfo.name}
            </span>
          )}
          {!centerInfo && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
              ⚠️ No center assigned - Viewing all data
            </span>
          )}
          {permissions.length > 0 && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              🔑 {permissions.length} permissions active
            </span>
          )}
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} onClick={() => (s as any).href && (window.location.href = (s as any).href)} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">{s.label}</p><p className="text-3xl font-bold">{s.value}</p></div>
              <div className={`${s.color} p-4 rounded-full text-2xl`}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">{t("quickActions")}</h2>
        {quickActions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-4xl mb-2">🔒</p>
            <p>No permissions assigned yet.</p>
            <p className="text-sm">Contact your administrator to get access.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {quickActions.map((a, i) => (
              <Link key={i} href={a.href}>
                <div className={`${a.color} text-white p-4 rounded-xl text-center hover:opacity-90 transition-opacity cursor-pointer`}>
                  <div className="text-3xl mb-2">{a.icon}</div>
                  <p className="font-medium">{a.label}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* My Permissions */}
      {permissions.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">My Permissions</h2>
          <div className="flex flex-wrap gap-2">
            {permissions.map((perm, i) => (
              <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                ✓ {perm}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
