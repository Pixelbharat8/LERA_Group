"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { PermissionProvider, usePermissions } from "../context/PermissionContext";
import { useLanguage } from "../context/LanguageContext";
import { apiFetch, hasAuthSession } from "../../lib/api";
import { logoutSession } from "../../lib/auth";
import { registerNativePushIfPossible } from "../../lib/native-push";
import { registerWebPushIfPossible } from "../../lib/web-push";

// Custom scrollbar styles for webkit browsers
const sidebarScrollbarStyles = `
  .sidebar-scroller::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .sidebar-scroller::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }
  .sidebar-scroller::-webkit-scrollbar-thumb {
    background: #94a3b8;
    border-radius: 4px;
  }
  .sidebar-scroller::-webkit-scrollbar-thumb:hover {
    background: #64748b;
  }
  .sidebar-scroller::-webkit-scrollbar-corner {
    background: #f1f5f9;
  }
`;

// Real auth - fetch user from API using token
const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    const actualRole = Cookies.get("actualRole");
    const userDataStr = Cookies.get("userData");

    // HttpOnly JWT is not visible to JS — use tokenSet / legacy token (see lib/api)
    if (!hasAuthSession()) {
      router.push("/auth/login");
      setIsLoading(false);
      return;
    }
    
    // Use stored user data from login
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        setUser({
          id: userData.id,
          name: userData.fullname || userData.name || "User",
          email: userData.email,
          role: userData.roleName || actualRole || "USER",
          centerId: userData.centerId,
          avatar: userData.avatarUrl,
        });
      } catch (e) {
        // Fallback
        setUser({
          id: null,
          name: actualRole || "User",
          email: "",
          role: actualRole || "USER",
          centerId: null,
          avatar: null,
        });
      }
    } else {
      // Fallback to role from cookie
      setUser({
        id: null,
        name: actualRole || "User",
        email: "",
        role: actualRole || "USER",
        centerId: null,
        avatar: null,
      });
    }
    
    setIsLoading(false);
  }, [router]);
  
  return { user, isLoading };
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionProvider>
      <DashboardContent>{children}</DashboardContent>
    </PermissionProvider>
  );
}

interface NotificationItem {
  id: string;
  title: string;
  titleVi?: string;
  message: string;
  messageVi?: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  referenceType?: string;
  referenceId?: string;
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { hasPermission, permissions } = usePermissions();
  const { t, language, setLanguage } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [salaryConfig, setSalaryConfig] = useState<any>(null);
  
  // Notification state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const fetchProfileData = async () => {
    if (!user?.id) return;
    
    try {
      // Fetch user details
      const userData = await apiFetch(`/api/users/${user.id}`);
      setProfileData(userData);
      
      // Fetch salary config
      try {
        const salaryData = await apiFetch(`/api/salary-config/teacher/${user.id}`);
        setSalaryConfig(salaryData);
      } catch (err) {
        console.log("No salary config found");
      }
    } catch (err) {
      console.error("Failed to fetch profile data:", err);
    }
  };

  const handleOpenProfile = () => {
    fetchProfileData();
    setShowProfileModal(true);
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user?.id) return;
    setNotificationsLoading(true);
    try {
      const data = await apiFetch(`/api/notifications/user/${user.id}`);
      setNotifications(Array.isArray(data) ? data.slice(0, 10) : []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!user?.id) return;
    try {
      const data = await apiFetch(`/api/notifications/user/${user.id}/unread/count`);
      setUnreadCount(data?.count || 0);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
      setUnreadCount(0);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await apiFetch(`/api/notifications/${notificationId}/read`, { method: "PATCH" });
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  // Handle notification click - mark as read and navigate to relevant page
  const handleNotificationClick = async (notification: NotificationItem) => {
    // Mark as read if not already
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // Close dropdown
    setShowNotifications(false);
    
    // Navigate based on notification type
    const typeRoutes: Record<string, string> = {
      approval: "/dashboard/superadmin/approvals",
      payment: "/dashboard/finance/payments",
      message: "/dashboard/connect",
      enrollment: "/dashboard/superadmin/approvals",
      teacher: "/dashboard/superadmin/users",
      success: "/dashboard/superadmin/communications",
      warning: "/dashboard/superadmin/communications",
      info: "/dashboard/superadmin/communications",
      error: "/dashboard/superadmin/communications",
    };
    
    // Check if notification has a specific reference
    if (notification.referenceType && notification.referenceId) {
      // Navigate to specific resource
      const refRoutes: Record<string, string> = {
        student: `/dashboard/superadmin/students/${notification.referenceId}`,
        teacher: `/dashboard/superadmin/teachers/${notification.referenceId}`,
        payment: `/dashboard/finance/payments?id=${notification.referenceId}`,
        fee: `/dashboard/finance/payments?id=${notification.referenceId}`,
        enrollment: `/dashboard/superadmin/approvals?id=${notification.referenceId}`,
        lead: `/dashboard/chairman/crm/leads/${notification.referenceId}`,
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
    
    // Navigate based on type
    const route = typeRoutes[notification.type] || "/dashboard/superadmin/communications";
    router.push(route);
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user?.id) return;
    try {
      await apiFetch(`/api/notifications/user/${user.id}/read-all`, { method: "PATCH" });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  // Fetch notifications on mount and periodically
  useEffect(() => {
    if (user?.id) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  // Register the device with APNs/FCM the first time the dashboard loads
  // inside the Capacitor mobile shell. No-op in regular browsers.
  // For browsers, registerWebPushIfPossible installs the service worker
  // (silent) but won't prompt for permission unless the user is past the
  // boot phase — that prompt only fires from a user gesture elsewhere in
  // the app to avoid burning the permission on cold-load.
  useEffect(() => {
    if (user?.id) {
      void registerNativePushIfPossible();
      void registerWebPushIfPossible();
    }
  }, [user?.id]);

  // Fetch full notifications when dropdown opens
  useEffect(() => {
    if (showNotifications && user?.id) {
      fetchNotifications();
    }
  }, [showNotifications, user?.id]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showNotifications && !target.closest('.notification-dropdown')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showNotifications]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isChairman = user?.role?.toUpperCase() === "CHAIRMAN";
  const isCEO = user?.role?.toUpperCase() === "CEO";
  const isDirector = user?.role?.toUpperCase() === "DIRECTOR";
  const isSuperAdmin = isChairman || isCEO || isDirector || ["SUPERADMIN", "SUPER_ADMIN"].includes(user?.role?.toUpperCase() || "");
  const isCenterAdmin = user?.role?.toUpperCase() === "CENTER_ADMIN";
  const isCenterManager = user?.role?.toUpperCase() === "CENTER_MANAGER";

  // High-level admins (Chairman, CEO, SuperAdmin, Director) always have all permissions
  // Center Manager uses their assigned permissions
  const checkPermission = (permission: keyof typeof permissions): boolean => {
    if (isSuperAdmin) return true; // Always true for high-level admins
    return hasPermission(permission);
  };

  // Navigation items based on role and permissions - Chairman has ALL access
  const navigationItems = [
    // Dashboard link - role-specific home page
    ...(isSuperAdmin ? [{ name: `📊 ${t("dashboard")}`, href: "/dashboard/superadmin", icon: "📊", roles: ["SUPERADMIN"], permission: "dashboard" as const }] : []),
    ...(isCenterAdmin ? [{ name: `📊 ${t("dashboard")}`, href: "/dashboard/center-admin", icon: "📊", roles: ["CENTER_ADMIN"], permission: "dashboard" as const }] : []),
    ...(isCenterManager && !isSuperAdmin ? [{ name: `📊 ${t("dashboard")}`, href: "/dashboard/centermanager", icon: "📊", roles: ["CENTER_MANAGER"], permission: "dashboard" as const }] : []),
    ...(user?.role?.toUpperCase() === "TEACHER" ? [{ name: `📊 ${t("dashboard")}`, href: "/dashboard/teacher", icon: "📊", roles: ["TEACHER"], permission: "dashboard" as const }] : []),
    ...(user?.role?.toUpperCase() === "STAFF" ? [{ name: `📊 ${t("dashboard")}`, href: "/dashboard/staff", icon: "📊", roles: ["STAFF"], permission: "dashboard" as const }] : []),
    
    // Chairman Only - Full Control Panel (Highest Authority)
    ...(isChairman ? [
      {
        name: `👑 ${t("chairmanPanel")}`,
        icon: "👑",
        roles: ["SUPERADMIN"],
        permission: "settings" as const,
        children: [
          { name: `📊 ${t("controlCenter")}`, href: "/dashboard/chairman" },
          { name: `👥 ${t("userManagement")}`, href: "/dashboard/chairman/users" },
          { name: `👨‍🏫 ${t("staffManagement")}`, href: "/dashboard/chairman/staff" },
          { name: `🏛️ ${t("boardOfDirectors")}`, href: "/dashboard/chairman/board" },
          { name: `👔 ${t("directors")}`, href: "/dashboard/chairman/directors" },
          { name: `🏢 ${t("orgStructure")}`, href: "/dashboard/chairman/org-structure" },
          { name: `🔐 ${t("rolesPermissions")}`, href: "/dashboard/chairman/roles" },
          { name: `🏢 ${t("centers")}`, href: "/dashboard/chairman/centers" },
          { name: `🏛️ ${t("departments")}`, href: "/dashboard/chairman/departments" },
          { name: `📚 ${t("coursesNav")}`, href: "/dashboard/chairman/courses" },
          { name: `📊 ${t("excelDataImport")}`, href: "/dashboard/superadmin/data-import" },
          { name: `⚙️ ${t("systemSettings")}`, href: "/dashboard/chairman/settings" },
          { name: `📋 ${t("dropdownOptions")}`, href: "/dashboard/chairman/dropdown-options" },
          { name: `🛠️ ${language === "VI" ? "Trường tùy chỉnh" : "Custom Fields"}`, href: "/dashboard/chairman/custom-fields" },
          { name: `🌐 ${language === "VI" ? "Nội dung Website" : "Website Content"}`, href: "/dashboard/chairman/website-content" },
          { name: `🔔 ${t("pendingApprovals")}`, href: "/dashboard/superadmin/approvals" },
          { name: `📋 ${t("auditLogs")}`, href: "/dashboard/superadmin/audit" },
        ],
      },
    ] : []),
    
    // Platform Admin - Chairman / CEO / Director / SuperAdmin
    // Pages here are powered by the reusable AdminCrudPage component and back
    // existing endpoints that previously had no UI.
    ...(isSuperAdmin ? [
      {
        name: `🛠️ ${language === "VI" ? "Quản trị nền tảng" : "Platform Admin"}`,
        icon: "🛠️",
        roles: ["SUPERADMIN"],
        permission: "settings" as const,
        children: [
          { name: `🚩 ${language === "VI" ? "Feature Flags" : "Feature Flags"}`, href: "/dashboard/superadmin/feature-flags" },
          { name: `🖼️ ${language === "VI" ? "Banners" : "Banners"}`, href: "/dashboard/superadmin/banners" },
          { name: `📑 ${language === "VI" ? "Trang CMS" : "CMS Pages"}`, href: "/dashboard/superadmin/cms-pages" },
          { name: `📋 ${language === "VI" ? "Tùy chọn dropdown" : "Dropdown Options"}`, href: "/dashboard/superadmin/dropdown-options" },
          { name: `🏷️ ${language === "VI" ? "Footer" : "Footer Settings"}`, href: "/dashboard/superadmin/footer-settings" },
          { name: `🏫 ${language === "VI" ? "Cài đặt trung tâm" : "Center Settings"}`, href: "/dashboard/superadmin/center-settings" },
          { name: `📚 ${language === "VI" ? "Kế hoạch bài giảng" : "Lesson Plans"}`, href: "/dashboard/superadmin/lesson-plans" },
          { name: `🏢 ${language === "VI" ? "Tenants" : "Tenants"}`, href: "/dashboard/superadmin/tenants" },
          { name: `🔗 ${language === "VI" ? "Phân vai trò" : "User-Role Map"}`, href: "/dashboard/superadmin/user-roles" },
          { name: `📋 ${language === "VI" ? "Nhật ký kiểm toán" : "Audit Logs"}`, href: "/dashboard/superadmin/audit-logs" },
          { name: `❤️ ${language === "VI" ? "Tình trạng dịch vụ" : "Service Health"}`, href: "/dashboard/superadmin/health" },
        ],
      },
    ] : []),

    // CEO Access - Can manage but needs Chairman approval for sensitive actions
    ...((isCEO || isChairman) ? [
      {
        name: `🏢 ${t("organization")}`,
        icon: "🏢",
        roles: ["SUPERADMIN"],
        permission: "centers" as const,
        children: [
          { name: t("allCenters"), href: "/dashboard/superadmin/centers" },
          { name: t("addNewCenter"), href: "/dashboard/superadmin/centers/add" },
          { name: t("centerAnalytics"), href: "/dashboard/superadmin/centers/analytics" },
          { name: `🏛️ ${t("departments")}`, href: "/dashboard/organization/departments" },
          { name: `${t("departments")} (Legacy)`, href: "/dashboard/superadmin/departments" },
          { name: `📊 ${t("dataImport")}`, href: "/dashboard/superadmin/data-import" },
        ],
      },
    ] : []),
    
    // Public Website Management - Chairman/CEO/Director
    ...(isSuperAdmin ? [
      {
        name: `🌐 ${t("publicWebsite")}`,
        icon: "🌐",
        roles: ["SUPERADMIN"],
        permission: "settings" as const,
        children: [
          { name: t("homePageEditor"), href: "/dashboard/superadmin/public-website/home" },
          { name: t("heroSection"), href: "/dashboard/superadmin/public-website/hero" },
          { name: `⚙️ ${t("websiteSettings")}`, href: "/dashboard/superadmin/public-website/settings" },
          { name: t("coursesSection"), href: "/dashboard/superadmin/public-website/courses" },
          { name: t("aboutPage"), href: "/dashboard/superadmin/public-website/about" },
          { name: t("contactPage"), href: "/dashboard/superadmin/public-website/contact" },
          { name: t("centersPage"), href: "/dashboard/superadmin/public-website/centers" },
          { name: t("testimonials"), href: "/dashboard/superadmin/public-website/testimonials" },
          { name: `🏆 ${language === "VI" ? "Thành tích HS" : "Achievements"}`, href: "/dashboard/superadmin/public-website/achievements" },
          { name: `👔 ${language === "VI" ? "Ban lãnh đạo" : "Leadership"}`, href: "/dashboard/superadmin/public-website/leadership" },
          { name: t("blogPosts"), href: "/dashboard/superadmin/public-website/blog" },
          { name: t("faqManagement"), href: "/dashboard/superadmin/public-website/faq" },
          { name: `📸 ${language === "VI" ? "Truyền thông" : "Media"}`, href: "/dashboard/superadmin/public-website/media" },
          { name: t("branding"), href: "/dashboard/superadmin/public-website/branding" },
          { name: t("footer"), href: "/dashboard/superadmin/public-website/footer" },
          { name: `📜 ${language === "VI" ? "Chính sách" : "Privacy"}`, href: "/dashboard/superadmin/public-website/privacy" },
          { name: `📋 ${language === "VI" ? "Điều khoản" : "Terms"}`, href: "/dashboard/superadmin/public-website/terms" },
          { name: t("seoSettings"), href: "/dashboard/superadmin/public-website/seo" },
        ],
      },
    ] : []),
    
    // Academy Management - SuperAdmin/Chairman/CEO/Director only (Center Admin/Manager/Teacher have dedicated panels)
    ...(isSuperAdmin && (checkPermission("students") || checkPermission("teachers") || checkPermission("classes") || checkPermission("courses")) ? [{
      name: `🎓 ${t("academy")}`,
      icon: "🎓",
      roles: ["SUPERADMIN"],
      permission: "students" as const,
      children: [
        ...(checkPermission("students") ? [{ name: t("studentsNav"), href: "/dashboard/academy/students" }] : []),
        ...(checkPermission("teachers") ? [{ name: t("teachersNav"), href: "/dashboard/academy/teachers" }] : []),
        ...(checkPermission("courses") ? [{ name: t("coursesNav"), href: "/dashboard/academy/courses" }] : []),
        ...(checkPermission("classes") ? [{ name: t("classes"), href: "/dashboard/academy/classrooms" }] : []),
        ...(checkPermission("classes") ? [{ name: `🏫 ${t("classrooms")}`, href: "/dashboard/academy/classrooms" }] : []),
        { name: t("enrollments"), href: "/dashboard/academy/enrollments" },
        ...(checkPermission("classes") ? [{ name: `📝 ${language === "VI" ? "Bài tập" : "Assignments"}`, href: "/dashboard/superadmin/assignments" }] : []),
        ...(checkPermission("classes") ? [{ name: `📝 ${language === "VI" ? "Kiểm tra" : "Exams"}`, href: "/dashboard/superadmin/exams" }] : []),
        ...(checkPermission("courses") ? [{ name: `📖 ${language === "VI" ? "Chương trình" : "Curriculum"}`, href: "/dashboard/superadmin/curriculum" }] : []),
        ...(checkPermission("courses") ? [{ name: `📚 ${language === "VI" ? "Mô-đun" : "Course Modules"}`, href: "/dashboard/superadmin/course-modules" }] : []),
        ...(checkPermission("courses") ? [{ name: `📝 ${language === "VI" ? "Bài học" : "Course Lessons"}`, href: "/dashboard/superadmin/course-lessons" }] : []),
        ...(checkPermission("courses") ? [{ name: `🗂️ ${language === "VI" ? "Tài liệu" : "Course Materials"}`, href: "/dashboard/superadmin/course-materials" }] : []),
        { name: `🎓 ${language === "VI" ? "Chứng chỉ" : "Certificates"}`, href: "/dashboard/superadmin/certificates" },
        { name: `🏆 ${language === "VI" ? "Gamification" : "Gamification"}`, href: "/dashboard/superadmin/gamification" },
        { name: `🏅 ${language === "VI" ? "Điểm thưởng" : "Student Points"}`, href: "/dashboard/superadmin/student-points" },
      ],
    }] : []),
    
    // Attendance - SuperAdmin/Chairman/CEO/Director only (others have dedicated panels)
    ...(isSuperAdmin && checkPermission("attendance") ? [{
      name: `📅 ${t("attendanceLeave")}`,
      icon: "📅",
      roles: ["SUPERADMIN"],
      permission: "attendance" as const,
      children: [
        { name: `✅ ${t("leaveApprovals")}`, href: "/dashboard/attendance/leave-approvals" },
        { name: t("overview"), href: "/dashboard/superadmin/attendance/overview" },
        { name: t("studentAttendance"), href: "/dashboard/attendance" },
        { name: t("teacherAttendance"), href: "/dashboard/superadmin/attendance/teachers" },
        { name: t("userAttendance"), href: "/dashboard/superadmin/attendance" },
      ],
    }] : []),
    
    // Exams & Progress - SuperAdmin/Chairman/CEO/Director
    ...(isSuperAdmin && checkPermission("classes") ? [{
      name: `📝 ${t("examsProgress")}`,
      icon: "📝",
      roles: ["SUPERADMIN"],
      permission: "classes" as const,
      children: [
        { name: t("exams"), href: "/dashboard/exams" },
        { name: t("results"), href: "/dashboard/exams/results" },
        { name: t("progressReports"), href: "/dashboard/progress" },
      ],
    }] : []),
    
    // Payment & Payroll - SuperAdmin/Chairman/CEO/Director
    ...(isSuperAdmin && (checkPermission("payments") || checkPermission("payroll")) ? [{
      name: `💰 ${t("finance")}`,
      icon: "💰",
      roles: ["SUPERADMIN"],
      permission: "payments" as const,
      children: [
        { name: `📊 ${t("financeDashboard")}`, href: "/dashboard/finance" },
        ...(checkPermission("payments") ? [
          { name: `💳 ${t("payments")}`, href: "/dashboard/payments" },
          { name: `📄 ${t("invoices")}`, href: "/dashboard/finance/invoices" },
          { name: `📋 ${t("studentFeeManagement")}`, href: "/dashboard/finance/student-plans", isHeader: true },
          { name: `   📋 ${t("feePlans")}`, href: "/dashboard/finance/student-plans" },
          { name: `   ⚙️ ${t("feeRules")}`, href: "/dashboard/finance/fee-rules" },
          { name: `   🏷️ ${t("discounts")}`, href: "/dashboard/finance/discounts" },
          { name: `   💸 ${t("refunds")}`, href: "/dashboard/finance/refunds" },
          { name: `🎓 ${language === "VI" ? "Học bổng" : "Scholarships"}`, href: "/dashboard/finance/scholarships" },
          { name: `🎓 ${language === "VI" ? "HB cho học sinh" : "Student Scholarships"}`, href: "/dashboard/finance/student-scholarships" },
          { name: `💳 ${language === "VI" ? "Phương thức TT" : "Payment Methods"}`, href: "/dashboard/finance/payment-methods" },
          { name: `⏰ ${language === "VI" ? "Quy tắc phí trễ" : "Late-fee Rules"}`, href: "/dashboard/finance/late-fee-rules" },
          { name: `📒 ${language === "VI" ? "Sổ cái" : "Ledger"}`, href: "/dashboard/finance/ledger" },
          { name: `🧾 ${language === "VI" ? "Biên lai" : "Fee Receipts"}`, href: "/dashboard/finance/fee-receipts" },
        ] : []),
        ...(checkPermission("payroll") ? [
          { name: `👥 ${t("payroll")}`, href: "/dashboard/superadmin/payroll", isHeader: true },
          { name: `   🗓️ ${language === "VI" ? "Chu kỳ" : "Cycles"}`, href: "/dashboard/superadmin/payroll/cycles" },
          { name: `   🧾 ${language === "VI" ? "Thành phần lương" : "Salary Components"}`, href: "/dashboard/superadmin/payroll/salary-components" },
          { name: `   📐 ${language === "VI" ? "Cài đặt thuế" : "Tax Settings"}`, href: "/dashboard/superadmin/payroll/tax-settings" },
          { name: `   💸 ${language === "VI" ? "Chi trả lương" : "Salary Payouts"}`, href: "/dashboard/superadmin/payroll/payouts" },
          { name: `   🎉 ${language === "VI" ? "Thưởng" : "Bonuses"}`, href: "/dashboard/superadmin/payroll/bonuses" },
          { name: `   💰 ${language === "VI" ? "Khấu trừ" : "Deductions"}`, href: "/dashboard/superadmin/payroll/deductions" },
          { name: `   ⏱️ ${language === "VI" ? "Tăng ca GV" : "Teacher Overtime"}`, href: "/dashboard/superadmin/payroll/teacher-overtime" },
          { name: `   📈 ${t("reports")}`, href: "/dashboard/superadmin/reports/payroll" },
        ] : []),
      ],
    }] : []),
    
    // CRM - SuperAdmin/Chairman/CEO/Director only
    ...(isSuperAdmin ? [{
      name: `📞 ${t("crm")}`,
      icon: "📞",
      roles: ["SUPERADMIN"],
      permission: "users" as const,
      children: [
        { name: `📊 ${t("dashboard")}`, href: "/dashboard/crm" },
        { name: `🎯 ${language === "VI" ? "Hàng đợi" : "Work Queue"}`, href: "/dashboard/crm/work-queue" },
        { name: `👥 ${t("leads")}`, href: "/dashboard/crm/leads" },
        { name: `🏷️ ${language === "VI" ? "Trạng thái Lead" : "Lead Statuses"}`, href: "/dashboard/superadmin/crm/lead-statuses" },
        { name: `📞 ${t("followUps")}`, href: "/dashboard/crm/followups" },
        { name: `🤝 ${language === "VI" ? "Giới thiệu" : "Referrals"}`, href: "/dashboard/superadmin/crm/referrals" },
        { name: `🧑‍💼 ${language === "VI" ? "Phân công Lead" : "Lead Assignments"}`, href: "/dashboard/superadmin/crm/lead-assignments" },
        { name: `📣 ${language === "VI" ? "Lead Chiến dịch" : "Campaign Leads"}`, href: "/dashboard/superadmin/crm/campaign-leads" },
        { name: `⚡ ${language === "VI" ? "Triggers" : "CRM Triggers"}`, href: "/dashboard/superadmin/crm/triggers" },
        { name: `🛡️ ${language === "VI" ? "Kiểm duyệt" : "Moderation Rules"}`, href: "/dashboard/superadmin/crm/moderation-rules" },
        { name: `📝 ${t("registrations")}`, href: "/dashboard/crm/registrations" },
        { name: `🎓 ${language === "VI" ? "Lớp học thử" : "Trial Classes"}`, href: "/dashboard/crm/trials" },
        { name: `🔁 ${language === "VI" ? "Tái ghi danh" : "Renewals"}`, href: "/dashboard/crm/renewals" },
        { name: `📅 ${language === "VI" ? "Lịch" : "Calendar"}`, href: "/dashboard/calendar" },
        { name: `📚 ${language === "VI" ? "Thời khóa biểu" : "Timetable"}`, href: "/dashboard/timetable" },
        { name: `🏷️ Tags`, href: "/dashboard/crm/tags" },
        { name: `📱 Communications`, href: "/dashboard/crm/communications" },
        { name: `⚡ Automations`, href: "/dashboard/crm/automations" },
        ...((isChairman || isCEO) ? [
          { name: `📈 ${t("analytics")}`, href: "/dashboard/crm/analytics" },
        ] : []),
      ],
    }] : []),

    // Chat & Connect Admin - SuperAdmin/Chairman/CEO/Director only
    // Backed by /api/chat/* endpoints in connect_service.
    ...(isSuperAdmin ? [{
      name: `💬 ${language === "VI" ? "Quản trị Chat" : "Chat Admin"}`,
      icon: "💬",
      roles: ["SUPERADMIN"],
      permission: "settings" as const,
      children: [
        { name: `📊 ${language === "VI" ? "Bình chọn" : "Polls"}`, href: "/dashboard/superadmin/chat/polls" },
        { name: `🛡️ ${language === "VI" ? "Hàng đợi kiểm duyệt" : "Moderation Queue"}`, href: "/dashboard/superadmin/chat/moderation" },
        { name: `🏫 ${language === "VI" ? "Nhóm lớp" : "Class Groups"}`, href: "/dashboard/superadmin/chat/class-groups" },
        { name: `📝 ${language === "VI" ? "Bài tập (chat)" : "Shared Assignments"}`, href: "/dashboard/superadmin/chat/assignments" },
        { name: `📅 ${language === "VI" ? "Họp PHHS" : "Parent-Teacher Meetings"}`, href: "/dashboard/superadmin/chat/meetings" },
        { name: `🤖 ${language === "VI" ? "Phiên AI Tutor" : "AI Tutor Sessions"}`, href: "/dashboard/superadmin/chat/ai-tutor" },
      ],
    }] : []),

    // LERA Connect - Available to all authenticated users
    {
      name: `💬 ${t("leraConnect")}`,
      icon: "💬",
      href: "/dashboard/connect",
      roles: ["SUPERADMIN", "CENTER_ADMIN", "CENTER_MANAGER", "TEACHER", "STAFF", "STUDENT", "PARENT", "CHAIRMAN", "CEO", "DIRECTOR"],
      permission: "dashboard" as const,
    },
    
    // Tools & Utilities - Available to all authenticated users
    {
      name: `🛠️ ${language === "VI" ? "Tiện ích" : "Tools"}`,
      icon: "🛠️",
      roles: ["SUPERADMIN", "CENTER_ADMIN", "CENTER_MANAGER", "TEACHER", "STAFF", "STUDENT", "PARENT", "CHAIRMAN", "CEO", "DIRECTOR", "TEACHING_ASSISTANT", "TA"],
      permission: "dashboard" as const,
      children: [
        { name: ` ${language === "VI" ? "Thông báo" : "Notifications"}`, href: "/dashboard/notifications" },
        { name: `🤖 ${language === "VI" ? "Trợ lý AI" : "AI Tutor"}`, href: "/dashboard/ai-tutor" },
        { name: `🌐 ${language === "VI" ? "Cộng đồng" : "Social"}`, href: "/dashboard/social" },
        { name: `📊 ${language === "VI" ? "Báo cáo" : "Reports"}`, href: "/dashboard/reports" },
        { name: `⚙️ ${language === "VI" ? "Cài đặt" : "Settings"}`, href: "/dashboard/settings" },
        { name: `❓ ${language === "VI" ? "Trợ giúp" : "Help"}`, href: "/dashboard/help" },
      ],
    },
    
    // My Workspace (HR self-service + staff features) - all staff-type roles (not students/parents)
    {
      name: `🙋 ${language === "VI" ? "Khu làm việc" : "My Workspace"}`,
      icon: "🙋",
      roles: ["SUPERADMIN", "CHAIRMAN", "CEO", "DIRECTOR", "CENTER_ADMIN", "CENTER_MANAGER", "ACADEMIC_MANAGER", "TEACHER", "STAFF", "TA", "TEACHING_ASSISTANT"],
      permission: "dashboard" as const,
      children: [
        { name: `🙋 ${language === "VI" ? "Trang cá nhân" : "My Workspace"}`, href: "/dashboard/self-service" },
        { name: `📚 ${language === "VI" ? "Đào tạo" : "Training"}`, href: "/dashboard/training" },
        { name: `⭐ ${language === "VI" ? "Đánh giá" : "Performance"}`, href: "/dashboard/performance" },
        { name: `🧑‍💼 ${language === "VI" ? "Tuyển dụng" : "Recruitment"}`, href: "/dashboard/recruitment" },
      ],
    },

    // Additional Services - Chairman/CEO/SuperAdmin
    ...(isSuperAdmin ? [{
      name: `🏛️ ${language === "VI" ? "Dịch vụ khác" : "Other Services"}`,
      icon: "🏛️",
      roles: ["SUPERADMIN"],
      permission: "settings" as const,
      children: [
        { name: `📚 ${language === "VI" ? "Thư viện" : "Library"}`, href: "/dashboard/library" },
        { name: `📖 ${language === "VI" ? "Quản lý thư viện" : "Library Admin"}`, href: "/dashboard/superadmin/library" },
        { name: `🏷️ ${language === "VI" ? "Danh mục sách" : "Book Categories"}`, href: "/dashboard/superadmin/library/categories" },
        { name: `✍️ ${language === "VI" ? "Tác giả" : "Authors"}`, href: "/dashboard/superadmin/library/authors" },
        { name: `🏢 ${language === "VI" ? "Nhà xuất bản" : "Publishers"}`, href: "/dashboard/superadmin/library/publishers" },
        { name: `📚 ${language === "VI" ? "Tồn kho TV" : "Library Inventory"}`, href: "/dashboard/superadmin/library/inventory" },
        { name: `📖 ${language === "VI" ? "Mượn sách" : "Borrowings"}`, href: "/dashboard/superadmin/library/borrowings" },
        { name: `🔖 ${language === "VI" ? "Đặt trước sách" : "Reservations"}`, href: "/dashboard/superadmin/library/reservations" },
        { name: `⚠️ ${language === "VI" ? "Phạt thư viện" : "Library Fines"}`, href: "/dashboard/superadmin/library/fines" },
        { name: `�🚌 ${language === "VI" ? "Xe đưa đón" : "Transport"}`, href: "/dashboard/transport" },
        { name: `🚌 ${language === "VI" ? "Quản lý xe" : "Transport Admin"}`, href: "/dashboard/superadmin/transport" },
        { name: `🏠 ${language === "VI" ? "Ký túc xá" : "Hostel"}`, href: "/dashboard/hostel" },
        { name: `🛏️ ${language === "VI" ? "Quản lý phòng KTX" : "Hostel Rooms (admin)"}`, href: "/dashboard/superadmin/hostel-rooms" },
        { name: `📖 ${language === "VI" ? "Nhà sách" : "Bookstore"}`, href: "/dashboard/bookstore" },
        { name: `📦 ${language === "VI" ? "Quản lý sản phẩm" : "Bookstore Products (admin)"}`, href: "/dashboard/superadmin/bookstore-products" },
        { name: `⚽ ${language === "VI" ? "Quản lý thể thao" : "Sports Management"}`, href: "/dashboard/superadmin/sports" },
      ],
    }] : []),
    
    // AI & Advanced Features - Chairman/CEO only and permission based
    ...((isChairman || isCEO || (isCenterManager && checkPermission("ai_assistant"))) ? [{
      name: `🤖 ${t("aiAnalytics")}`,
      icon: "🤖",
      roles: ["SUPERADMIN", "CENTER_MANAGER"],
      permission: "ai_assistant" as const,
      children: [
        { name: t("aiGateway"), href: "/dashboard/superadmin/ai-gateway" },
        { name: `🛠️ ${language === "VI" ? "AI Workbench" : "AI Workbench"}`, href: "/dashboard/superadmin/ai/workbench" },
        { name: `🧭 ${language === "VI" ? "Lộ trình AI" : "AI Learning Paths"}`, href: "/dashboard/superadmin/ai/learning-paths" },
        { name: `✨ ${language === "VI" ? "Gợi ý AI" : "AI Recommendations"}`, href: "/dashboard/superadmin/ai/recommendations" },
        { name: `🤖 ${language === "VI" ? "AI Đánh giá" : "AI Assessments"}`, href: "/dashboard/superadmin/ai/assessments" },
        { name: `💬 ${language === "VI" ? "Hội thoại AI" : "AI Conversations"}`, href: "/dashboard/superadmin/ai/conversations" },
        { name: `📈 ${language === "VI" ? "Tiến độ AI" : "AI Progress"}`, href: "/dashboard/superadmin/ai/learning-progress" },
        { name: t("reports"), href: "/dashboard/superadmin/reports" },
        { name: t("gamification"), href: "/dashboard/superadmin/gamification" },
        { name: `📢 ${language === "VI" ? "Thông báo hệ thống" : "Communications"}`, href: "/dashboard/superadmin/communications" },
        { name: `🔐 ${language === "VI" ? "Vai trò & Quyền" : "Roles & Permissions"}`, href: "/dashboard/superadmin/roles" },
      ],
    }] : []),
    
    // ===== TEACHER PANEL =====
    ...(user?.role?.toUpperCase() === "TEACHER" ? [
      {
        name: `📚 ${t("myClasses")}`,
        icon: "📚",
        href: "/dashboard/teacher/classes",
        roles: ["TEACHER"],
        permission: "dashboard" as const,
      },
      {
        name: `📅 ${t("mySchedule")}`,
        icon: "📅",
        href: "/dashboard/teacher/schedule",
        roles: ["TEACHER"],
        permission: "dashboard" as const,
      },
      {
        name: `✅ ${t("attendance")}`,
        icon: "✅",
        href: "/dashboard/teacher/attendance",
        roles: ["TEACHER"],
        permission: "dashboard" as const,
      },
      {
        name: `📊 ${t("myGrades")}`,
        icon: "📊",
        href: "/dashboard/teacher/grades",
        roles: ["TEACHER"],
        permission: "dashboard" as const,
      },
      {
        name: `👨‍🎓 ${language === "VI" ? "Học sinh" : "My Students"}`,
        icon: "👨‍🎓",
        href: "/dashboard/teacher/students",
        roles: ["TEACHER"],
        permission: "dashboard" as const,
      },
      {
        name: `🗓️ ${t("myLeaveRequests")}`,
        icon: "🗓️",
        href: "/dashboard/teacher/leave",
        roles: ["TEACHER"],
        permission: "dashboard" as const,
      },
      {
        name: `📝 ${language === "VI" ? "Đơn xin phép" : "Permission Slips"}`,
        icon: "📝",
        href: "/dashboard/teacher/permission-slips",
        roles: ["TEACHER"],
        permission: "dashboard" as const,
      },
      {
        name: `💬 ${t("messages")}`,
        icon: "💬",
        href: "/dashboard/teacher/messages",
        roles: ["TEACHER"],
        permission: "dashboard" as const,
      },
    ] : []),

    // ===== STAFF PANEL =====
    ...(user?.role?.toUpperCase() === "STAFF" ? [
      {
        name: `📋 ${language === "VI" ? "Công việc" : "My Tasks"}`,
        icon: "📋",
        href: "/dashboard/staff/tasks",
        roles: ["STAFF"],
        permission: "dashboard" as const,
      },
      {
        name: `✅ ${t("attendance")}`,
        icon: "✅",
        href: "/dashboard/staff/attendance",
        roles: ["STAFF"],
        permission: "dashboard" as const,
      },
      {
        name: `🗓️ ${t("myLeaveRequests")}`,
        icon: "🗓️",
        href: "/dashboard/teacher/leave",
        roles: ["STAFF"],
        permission: "dashboard" as const,
      },
      {
        name: `📅 ${language === "VI" ? "Lịch" : "Calendar"}`,
        icon: "📅",
        href: "/dashboard/staff/calendar",
        roles: ["STAFF"],
        permission: "dashboard" as const,
      },
      {
        name: `💬 ${t("messages")}`,
        icon: "💬",
        href: "/dashboard/staff/messages",
        roles: ["STAFF"],
        permission: "dashboard" as const,
      },
    ] : []),

    // ===== CENTER ADMIN PANEL =====
    ...(isCenterAdmin ? [
      {
        name: `🎓 ${t("academy")}`,
        icon: "🎓",
        roles: ["CENTER_ADMIN"],
        permission: "students" as const,
        children: [
          { name: t("studentsNav"), href: "/dashboard/academy/students" },
          { name: t("teachersNav"), href: "/dashboard/academy/teachers" },
          { name: t("coursesNav"), href: "/dashboard/academy/courses" },
          { name: t("classes"), href: "/dashboard/academy/classrooms" },
          { name: `🏫 ${t("classrooms")}`, href: "/dashboard/academy/classrooms" },
          { name: t("enrollments"), href: "/dashboard/academy/enrollments" },
        ],
      },
      {
        name: `📅 ${t("attendanceLeave")}`,
        icon: "📅",
        roles: ["CENTER_ADMIN"],
        permission: "attendance" as const,
        children: [
          { name: t("studentAttendance"), href: "/dashboard/attendance" },
          { name: t("teacherAttendance"), href: "/dashboard/superadmin/attendance/teachers" },
          { name: `✅ ${t("leaveApprovals")}`, href: "/dashboard/attendance/leave-approvals" },
          { name: t("approvals"), href: "/dashboard/center-admin/attendance/approvals" },
        ],
      },
      {
        name: `💰 ${t("finance")}`,
        icon: "💰",
        roles: ["CENTER_ADMIN"],
        permission: "payments" as const,
        children: [
          { name: `💳 ${t("payments")}`, href: "/dashboard/payments" },
          { name: `📄 ${t("invoices")}`, href: "/dashboard/finance/invoices" },
        ],
      },
    ] : []),

    // ===== CENTER MANAGER PANEL =====
    ...(isCenterManager && !isSuperAdmin ? [
      {
        name: `🎓 ${t("academy")}`,
        icon: "🎓",
        roles: ["CENTER_MANAGER"],
        permission: "students" as const,
        children: [
          { name: t("studentsNav"), href: "/dashboard/centermanager/students" },
          { name: t("teachersNav"), href: "/dashboard/centermanager/teachers" },
          { name: t("classes"), href: "/dashboard/centermanager/classes" },
          { name: t("enrollments"), href: "/dashboard/academy/enrollments" },
        ],
      },
      {
        name: `📅 ${t("attendanceLeave")}`,
        icon: "📅",
        roles: ["CENTER_MANAGER"],
        permission: "attendance" as const,
        children: [
          { name: t("studentAttendance"), href: "/dashboard/attendance" },
          { name: `✅ ${t("leaveApprovals")}`, href: "/dashboard/attendance/leave-approvals" },
        ],
      },
      {
        name: `👨‍👩‍👧 ${t("parentCommunications")}`,
        icon: "👨‍👩‍👧",
        href: "/dashboard/centermanager/parent-communications",
        roles: ["CENTER_MANAGER"],
        permission: "dashboard" as const,
      },
    ] : []),

    // ===== STUDENT PANEL =====
    ...(user?.role?.toUpperCase() === "STUDENT" ? [
      {
        name: `📊 ${t("dashboard")}`,
        icon: "📊",
        href: "/dashboard/student",
        roles: ["STUDENT"],
        permission: "dashboard" as const,
      },
      {
        name: `📚 ${t("myClasses")}`,
        icon: "📚",
        href: "/dashboard/student/classes",
        roles: ["STUDENT"],
        permission: "dashboard" as const,
      },
      {
        name: `📅 ${t("mySchedule")}`,
        icon: "📅",
        href: "/dashboard/student/schedule",
        roles: ["STUDENT"],
        permission: "dashboard" as const,
      },
      {
        name: `📝 ${t("assignments")}`,
        icon: "📝",
        href: "/dashboard/student/assignments",
        roles: ["STUDENT"],
        permission: "dashboard" as const,
      },
      {
        name: `📊 ${t("myGrades")}`,
        icon: "📊",
        href: "/dashboard/student/grades",
        roles: ["STUDENT"],
        permission: "dashboard" as const,
      },
      {
        name: `✅ ${t("attendance")}`,
        icon: "✅",
        href: "/dashboard/student/attendance",
        roles: ["STUDENT"],
        permission: "dashboard" as const,
      },
      {
        name: `💰 ${t("payments")}`,
        icon: "💰",
        href: "/dashboard/student/payments",
        roles: ["STUDENT"],
        permission: "dashboard" as const,
      },
      {
        name: `💬 ${t("messages")}`,
        icon: "💬",
        href: "/dashboard/student/messages",
        roles: ["STUDENT"],
        permission: "dashboard" as const,
      },
      {
        name: `👤 ${t("myProfile")}`,
        icon: "👤",
        href: "/dashboard/student/profile",
        roles: ["STUDENT"],
        permission: "dashboard" as const,
      },
    ] : []),
    
    // ===== PARENT PANEL =====
    ...(user?.role?.toUpperCase() === "PARENT" ? [
      {
        name: `📊 ${t("dashboard")}`,
        icon: "📊",
        href: "/dashboard/parent",
        roles: ["PARENT"],
        permission: "dashboard" as const,
      },
      {
        name: `👨‍👧‍👦 ${t("children")}`,
        icon: "👨‍👧‍👦",
        href: "/dashboard/parent/children",
        roles: ["PARENT"],
        permission: "dashboard" as const,
      },
      {
        name: `📅 ${t("schedule")}`,
        icon: "📅",
        href: "/dashboard/parent/schedule",
        roles: ["PARENT"],
        permission: "dashboard" as const,
      },
      {
        name: `📊 ${t("grades")}`,
        icon: "📊",
        href: "/dashboard/parent/grades",
        roles: ["PARENT"],
        permission: "dashboard" as const,
      },
      {
        name: `✅ ${t("attendance")}`,
        icon: "✅",
        href: "/dashboard/parent/attendance",
        roles: ["PARENT"],
        permission: "dashboard" as const,
      },
      {
        name: `💰 ${t("payments")}`,
        icon: "💰",
        href: "/dashboard/parent/payments",
        roles: ["PARENT"],
        permission: "dashboard" as const,
      },
      {
        name: `💬 ${t("messages")}`,
        icon: "💬",
        href: "/dashboard/parent/messages",
        roles: ["PARENT"],
        permission: "dashboard" as const,
      },
      {
        name: `📞 ${t("communication")}`,
        icon: "📞",
        href: "/dashboard/parent/communication",
        roles: ["PARENT"],
        permission: "dashboard" as const,
      },
      {
        name: `📝 ${language === "VI" ? "Đơn xin phép" : "Permission Slips"}`,
        icon: "📝",
        href: "/dashboard/parent/permission-slips",
        roles: ["PARENT"],
        permission: "dashboard" as const,
      },
      {
        name: `📚 ${language === "VI" ? "Tài liệu phụ huynh" : "Resources"}`,
        icon: "📚",
        href: "/dashboard/parent/resources",
        roles: ["PARENT"],
        permission: "dashboard" as const,
      },
      {
        name: `👤 ${t("myProfile")}`,
        icon: "👤",
        href: "/dashboard/parent/profile",
        roles: ["PARENT"],
        permission: "dashboard" as const,
      },
    ] : []),
    
    // ===== TEACHING ASSISTANT PANEL =====
    ...(user?.role?.toUpperCase() === "TEACHING_ASSISTANT" || user?.role?.toUpperCase() === "TA" ? [
      {
        name: `📊 ${t("dashboard")}`,
        icon: "📊",
        href: "/dashboard/ta",
        roles: ["TEACHING_ASSISTANT", "TA"],
        permission: "dashboard" as const,
      },
      {
        name: `📚 ${t("myClasses")}`,
        icon: "📚",
        href: "/dashboard/ta/classes",
        roles: ["TEACHING_ASSISTANT", "TA"],
        permission: "dashboard" as const,
      },
      {
        name: `📊 ${t("gradesAssessment")}`,
        icon: "📊",
        href: "/dashboard/ta/grades",
        roles: ["TEACHING_ASSISTANT", "TA"],
        permission: "dashboard" as const,
      },
      {
        name: `✅ ${t("attendance")}`,
        icon: "✅",
        href: "/dashboard/ta/attendance",
        roles: ["TEACHING_ASSISTANT", "TA"],
        permission: "dashboard" as const,
      },
      {
        name: `📋 ${t("tasks")}`,
        icon: "📋",
        href: "/dashboard/ta/tasks",
        roles: ["TEACHING_ASSISTANT", "TA"],
        permission: "dashboard" as const,
      },
      {
        name: `💬 ${t("messages")}`,
        icon: "💬",
        href: "/dashboard/ta/messages",
        roles: ["TEACHING_ASSISTANT", "TA"],
        permission: "dashboard" as const,
      },
    ] : []),
  ];

  const filteredNav = navigationItems.filter(item => {
    if (!item.roles) return true;
    // If user is superadmin type (CHAIRMAN, CEO, DIRECTOR), treat as SUPERADMIN for navigation
    const userRole = user?.role?.toUpperCase() || "";
    const effectiveRole = isSuperAdmin ? "SUPERADMIN" : userRole;
    return item.roles.includes(effectiveRole) || item.roles.includes(userRole);
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#0a1a5c] text-white z-50 flex items-center justify-between px-4 shadow-lg">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/dashboard/superadmin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-[#0a1a5c] font-bold">L</span>
            </div>
            <span className="font-bold text-lg">LERA Admin</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Role Badge */}
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            isChairman ? "bg-yellow-400 text-gray-900" : 
            isCEO ? "bg-purple-400 text-white" :
            isDirector ? "bg-blue-400 text-white" :
            isCenterAdmin ? "bg-green-400 text-white" :
            isCenterManager ? "bg-teal-400 text-white" :
            user?.role?.toUpperCase() === "TEACHER" ? "bg-indigo-400 text-white" :
            user?.role?.toUpperCase() === "STUDENT" ? "bg-sky-400 text-white" :
            user?.role?.toUpperCase() === "PARENT" ? "bg-pink-400 text-white" :
            (user?.role?.toUpperCase() === "TEACHING_ASSISTANT" || user?.role?.toUpperCase() === "TA") ? "bg-orange-400 text-white" :
            user?.role?.toUpperCase() === "STAFF" ? "bg-slate-400 text-white" :
            "bg-gray-400 text-white"
          }`}>
            {isChairman ? "👑 CHAIRMAN" : 
             isCEO ? "🏢 CEO" : 
             isDirector ? "📊 DIRECTOR" : 
             isCenterAdmin ? "🏫 CENTER ADMIN" :
             isCenterManager ? "👔 CENTER MANAGER" :
             user?.role?.toUpperCase() === "TEACHER" ? "👨‍🏫 TEACHER" :
             user?.role?.toUpperCase() === "STUDENT" ? "🎓 STUDENT" :
             user?.role?.toUpperCase() === "PARENT" ? "👨‍👩‍👧 PARENT" :
             (user?.role?.toUpperCase() === "TEACHING_ASSISTANT" || user?.role?.toUpperCase() === "TA") ? "📋 TA" :
             user?.role?.toUpperCase() === "STAFF" ? "👤 STAFF" :
             user?.role}
          </span>
          
          {/* Quick Actions */}
          <Link href="/dashboard/connect" className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="LERA Connect">
            💬
          </Link>
          <Link href="/" target="_blank" className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="View Public Site">
            🌐
          </Link>
          
          {/* Notifications */}
          <div className="relative notification-dropdown">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowNotifications(!showNotifications);
              }}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors relative"
              title={t("notifications")}
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-xs flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            
            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[70vh] overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                  <h3 className="font-bold text-gray-900">🔔 {t("notifications")}</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {t("markAllRead")}
                    </button>
                  )}
                </div>
                
                {/* Notification List */}
                <div className="max-h-80 overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">{t("loading")}</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <span className="text-4xl">📭</span>
                      <p className="text-sm text-gray-500 mt-2">{t("noNotifications")}</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notification.isRead ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xl">
                            {notification.type === 'info' ? 'ℹ️' :
                             notification.type === 'success' ? '✅' :
                             notification.type === 'warning' ? '⚠️' :
                             notification.type === 'error' ? '❌' :
                             notification.type === 'message' ? '💬' :
                             notification.type === 'approval' ? '📋' :
                             notification.type === 'payment' ? '💰' : '🔔'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-medium text-gray-900 truncate ${!notification.isRead ? 'font-bold' : ''}`}>
                                {language === 'VI' && notification.titleVi ? notification.titleVi : notification.title}
                              </p>
                              {!notification.isRead && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                              {language === 'VI' && notification.messageVi ? notification.messageVi : notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(notification.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Footer */}
                <div className="p-3 border-t border-gray-100 bg-gray-50">
                  <Link
                    href="/dashboard/notifications"
                    className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                    onClick={() => setShowNotifications(false)}
                  >
                    {t("viewAllNotifications")} →
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
            <button
              onClick={() => setLanguage("VI")}
              className={`px-2 py-1 text-xs font-medium rounded ${language === "VI" ? "bg-white text-[#0a1a5c]" : "text-white/80 hover:text-white"}`}
            >
              🇻🇳 VI
            </button>
            <button
              onClick={() => setLanguage("EN")}
              className={`px-2 py-1 text-xs font-medium rounded ${language === "EN" ? "bg-white text-[#0a1a5c]" : "text-white/80 hover:text-white"}`}
            >
              🇬🇧 EN
            </button>
          </div>
          
          {/* User Menu - Click to view profile */}
          <button 
            onClick={handleOpenProfile}
            className="flex items-center gap-2 pl-4 border-l border-white/20 hover:bg-white/10 rounded-lg py-1 px-2 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-white/70">{user?.email}</p>
            </div>
          </button>
        </div>
      </header>

      {/* Sidebar Scrollbar Styles */}
      <style jsx global>{sidebarScrollbarStyles}</style>

      {/* Sidebar */}
      <aside 
        className={`sidebar-scroller fixed left-0 top-16 bottom-0 w-64 bg-white shadow-lg transition-transform z-40 overflow-x-scroll overflow-y-scroll ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#94a3b8 #f1f5f9'
        }}
      >
        <nav className="p-4">
          {filteredNav.map((item, index) => (
            <div key={index} className="mb-2">
              {item.children ? (
                <div>
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === item.name ? null : item.name)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                      activeDropdown === item.name ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span>{item.name}</span>
                    </span>
                    <svg className={`w-4 h-4 transition-transform ${activeDropdown === item.name ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {activeDropdown === item.name && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children
                        .filter((child: any) => !child.roles || child.roles.includes(isSuperAdmin ? "SUPERADMIN" : user?.role?.toUpperCase()) || child.roles.includes(user?.role?.toUpperCase()))
                        .map((child, childIndex) => (
                        <Link
                          key={childIndex}
                          href={child.href}
                          className={`block px-4 py-2 rounded-lg text-sm transition-colors ${
                            pathname === child.href 
                              ? "bg-blue-600 text-white" 
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href!}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    pathname === item.href 
                      ? "bg-blue-600 text-white" 
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>
        
        {/* Impersonation Section - SuperAdmin Only */}
        {isSuperAdmin && (
          <div className="p-4 border-t">
            <p className="text-xs text-gray-500 mb-2">🎭 IMPERSONATE AS</p>
            <select className="w-full p-2 text-sm border rounded-lg">
              <option value="">Select user...</option>
              <option value="center-admin">Center Admin - Lach Tray</option>
              <option value="teacher">Teacher - John Doe</option>
              <option value="parent">Parent - Nguyen Van A</option>
            </select>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className={`pt-16 transition-all ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        <div className="p-6">
          {children}
        </div>
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">My Profile</h2>
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Profile Header */}
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto text-white text-3xl font-bold">
                  {user?.name?.charAt(0) || "U"}
                </div>
                <h3 className="text-xl font-bold mt-4">{profileData?.fullname || user?.name}</h3>
                <p className="text-gray-500">{profileData?.email || user?.email}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {profileData?.role?.name || user?.role}
                </span>
              </div>

              {/* Profile Details */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-3">Contact Information</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Phone</p>
                      <p className="font-medium">{profileData?.phone || "Not set"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Email</p>
                      <p className="font-medium">{profileData?.email || user?.email}</p>
                    </div>
                  </div>
                </div>

                {salaryConfig && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-700 mb-3">💰 Compensation</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Hourly Rate</p>
                        <p className="font-medium text-green-600">
                          {salaryConfig.hourlyRate?.toLocaleString() || 0} VND
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Base Salary</p>
                        <p className="font-medium text-green-600">
                          {salaryConfig.baseSalary?.toLocaleString() || 0} VND
                        </p>
                      </div>
                      {salaryConfig.bonusPercentage > 0 && (
                        <div>
                          <p className="text-gray-500">Bonus %</p>
                          <p className="font-medium text-green-600">{salaryConfig.bonusPercentage}%</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-3">Account Status</h4>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      profileData?.active !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {profileData?.active !== false ? "Active" : "Inactive"}
                    </span>
                    {profileData?.createdAt && (
                      <span className="text-xs text-gray-500">
                        Member since {new Date(profileData.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => { void logoutSession(); }}
                  className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                >
                  🚪 Logout
                </button>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    // Navigate to profile settings
                    router.push("/dashboard/profile");
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
