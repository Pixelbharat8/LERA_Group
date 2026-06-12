"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { apiFetch, hasAuthSession } from "../../../lib/api";
import { useLanguage } from "../../context/LanguageContext";

export default function OrganizationPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ departments: 0, roles: 0, users: 0, centers: 0, students: 0, courses: 0 });

  useEffect(() => {
    if (!hasAuthSession()) { router.push("/auth/login"); return; }

    const fetchData = async () => {
      try {
        const [depts, roles, users, centers, students, courses] = await Promise.all([
          apiFetch("/api/departments").catch(() => []),
          apiFetch("/api/roles").catch(() => []),
          apiFetch("/api/users").catch(() => []),
          apiFetch("/api/centers").catch(() => []),
          apiFetch("/api/students").catch(() => []),
          apiFetch("/api/courses").catch(() => []),
        ]);
        setStats({
          departments: Array.isArray(depts) ? depts.length : (depts?.content?.length || 0),
          roles: Array.isArray(roles) ? roles.length : (roles?.content?.length || 0),
          users: Array.isArray(users) ? users.length : (users?.totalElements || users?.content?.length || 0),
          centers: Array.isArray(centers) ? centers.length : (centers?.content?.length || 0),
          students: Array.isArray(students) ? students.length : (students?.content?.length || students?.totalElements || 0),
          courses: Array.isArray(courses) ? courses.length : (courses?.content?.length || 0),
        });
      } catch (e) {
        console.error("Error loading org data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const sections = [
    {
      title: t("departments") || "Departments",
      desc: "Manage organizational departments, heads, and structure",
      href: "/dashboard/organization/departments",
      icon: "🏛️",
      count: stats.departments,
      color: "bg-blue-50 border-blue-200 hover:border-blue-400",
      iconBg: "bg-blue-100",
    },
    {
      title: t("rolesPermissions") || "Roles & Permissions",
      desc: "Define roles and manage access control",
      href: "/dashboard/superadmin/roles",
      icon: "🔐",
      count: stats.roles,
      color: "bg-purple-50 border-purple-200 hover:border-purple-400",
      iconBg: "bg-purple-100",
    },
    {
      title: t("userManagement") || "User Management",
      desc: "Manage all users, staff, and their assignments",
      href: "/dashboard/superadmin/users",
      icon: "👥",
      count: stats.users,
      color: "bg-green-50 border-green-200 hover:border-green-400",
      iconBg: "bg-green-100",
    },
    {
      title: t("centers") || "Centers",
      desc: "Manage academy centers and locations",
      href: "/dashboard/superadmin/centers",
      icon: "🏢",
      count: stats.centers,
      color: "bg-orange-50 border-orange-200 hover:border-orange-400",
      iconBg: "bg-orange-100",
    },
    {
      title: t("totalStudents") || "Students",
      desc: "View all enrolled students across centers",
      href: "/dashboard/academy/students",
      icon: "👨‍🎓",
      count: stats.students,
      color: "bg-teal-50 border-teal-200 hover:border-teal-400",
      iconBg: "bg-teal-100",
    },
    {
      title: t("courses") || "Courses",
      desc: "Manage courses, curriculum, and programs",
      href: "/dashboard/academy/courses",
      icon: "📚",
      count: stats.courses,
      color: "bg-indigo-50 border-indigo-200 hover:border-indigo-400",
      iconBg: "bg-indigo-100",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/dashboard" className="hover:text-blue-600">{t("dashboard")}</Link>
        <span>/</span>
        <span className="text-gray-900">{t("organization") || "Organization"}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🏢 {t("organization") || "Organization"}</h1>
        <p className="text-gray-600 mt-1">
          Manage your organizational structure, departments, roles, and users
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: t("departments") || "Departments", value: stats.departments, icon: "🏛️", color: "text-blue-600" },
          { label: t("roles") || "Roles", value: stats.roles, icon: "🔐", color: "text-purple-600" },
          { label: t("totalUsers") || "Total Users", value: stats.users, icon: "👥", color: "text-green-600" },
          { label: t("centers") || "Centers", value: stats.centers, icon: "🏢", color: "text-orange-600" },
          { label: t("totalStudents") || "Students", value: stats.students, icon: "👨‍🎓", color: "text-teal-600" },
          { label: t("courses") || "Courses", value: stats.courses, icon: "📚", color: "text-indigo-600" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>
                  {loading ? "..." : s.value}
                </p>
              </div>
              <span className="text-3xl">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section, i) => (
          <Link
            key={i}
            href={section.href}
            className={`block rounded-xl border-2 p-6 transition-all ${section.color} shadow-sm hover:shadow-md`}
          >
            <div className="flex items-start gap-4">
              <div className={`${section.iconBg} w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0`}>
                {section.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                  {section.count !== null && !loading && (
                    <span className="text-sm font-medium bg-white px-2.5 py-1 rounded-full border">
                      {section.count}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{section.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
