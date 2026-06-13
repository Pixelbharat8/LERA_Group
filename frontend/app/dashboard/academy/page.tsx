"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { apiFetch } from "../../../lib/api";
import { useLanguage } from "../../context/LanguageContext";
import { useUserCenter, buildCenterFilterUrl } from "../../hooks/useUserCenter";

export default function AcademyDashboard() {
  const { t } = useLanguage();
  const { centerId: userCenterId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalCourses: 0,
    activeEnrollments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLoading) fetchStats();
  }, [userLoading, userCenterId, shouldFilterByCenter]);

  const fetchStats = async () => {
    try {
      const studentsUrl = shouldFilterByCenter
        ? buildCenterFilterUrl("/api/students", userCenterId)
        : "/api/students";
      const teachersUrl = shouldFilterByCenter
        ? buildCenterFilterUrl("/api/teachers", userCenterId)
        : "/api/teachers";
      const classesUrl = shouldFilterByCenter
        ? buildCenterFilterUrl("/api/classes", userCenterId)
        : "/api/classes";
      const [students, teachers, classes, courses] = await Promise.all([
        apiFetch(studentsUrl).catch(() => ({ totalElements: 0 })),
        apiFetch(teachersUrl).catch(() => ({ totalElements: 0 })),
        apiFetch(classesUrl).catch(() => ({ totalElements: 0 })),
        apiFetch("/api/courses").catch(() => ({ totalElements: 0 })),
      ]);
      setStats({
        totalStudents: students.totalElements || students.length || 0,
        totalTeachers: teachers.totalElements || teachers.length || 0,
        totalClasses: classes.totalElements || classes.length || 0,
        totalCourses: courses.totalElements || courses.length || 0,
        activeEnrollments: 0,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { name: t("studentsNav"), href: "/dashboard/academy/students", icon: "👨‍🎓", count: stats.totalStudents, description: t("manageStudents") },
    { name: t("teachersNav"), href: "/dashboard/academy/teachers", icon: "👩‍🏫", count: stats.totalTeachers, description: t("manageTeachers") },
    { name: t("classes"), href: "/dashboard/academy/classrooms", icon: "📖", count: stats.totalClasses, description: t("manageClasses") },
    { name: t("coursesNav"), href: "/dashboard/academy/courses", icon: "📚", count: stats.totalCourses, description: t("manageCourses") },
    { name: t("enrollments"), href: "/dashboard/academy/enrollments", icon: "📝", count: stats.activeEnrollments, description: t("activeEnrollments") },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t("academyDashboard")}</h1>
        <p className="text-gray-600 mt-2">{t("academyOverview")}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{loading ? "..." : stats.totalStudents}</div>
          <div className="text-sm text-blue-700">{t("studentsNav")}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-2xl font-bold text-green-600">{loading ? "..." : stats.totalTeachers}</div>
          <div className="text-sm text-green-700">{t("teachersNav")}</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">{loading ? "..." : stats.totalClasses}</div>
          <div className="text-sm text-purple-700">{t("classes")}</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="text-2xl font-bold text-orange-600">{loading ? "..." : stats.totalCourses}</div>
          <div className="text-sm text-orange-700">{t("coursesNav")}</div>
        </div>
        <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
          <div className="text-2xl font-bold text-pink-600">{loading ? "..." : stats.activeEnrollments}</div>
          <div className="text-sm text-pink-700">{t("enrollments")}</div>
        </div>
      </div>

      {/* Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <Link
            key={section.name}
            href={section.href}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">{section.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{section.name}</h3>
                  <span className="text-2xl font-bold text-blue-600">{section.count}</span>
                </div>
                <p className="text-sm text-gray-500">{section.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">{t("quickActions")}</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/academy/students?action=new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            + Add Student
          </Link>
          <Link href="/dashboard/academy/teachers?action=new" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
            + Add Teacher
          </Link>
          <Link href="/dashboard/academy/classrooms" className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">
            + Create Class
          </Link>
          <Link href="/dashboard/academy/courses?action=new" className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700">
            + Add Course
          </Link>
        </div>
      </div>
    </div>
  );
}
