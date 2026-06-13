"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../lib/api";
import { useUserCenter, buildCenterFilterUrl } from "../../hooks/useUserCenter";

export default function ProgressPage() {
  const { centerId: userCenterId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    avgCompletion: 0,
    avgScore: 0,
    improvement: 0,
    goalAchievement: 0,
    totalStudents: 0,
    totalEnrollments: 0,
  });
  const [recentProgress, setRecentProgress] = useState<any[]>([]);

  useEffect(() => {
    if (!userLoading) {
      fetchProgressData();
    }
  }, [userLoading, userCenterId]);

  const fetchProgressData = async () => {
    try {
      const studentsUrl = buildCenterFilterUrl("/api/students", shouldFilterByCenter ? userCenterId : null);
      const enrollmentsUrl = buildCenterFilterUrl("/api/enrollments", shouldFilterByCenter ? userCenterId : null);
      const examsUrl = buildCenterFilterUrl("/api/exams", shouldFilterByCenter ? userCenterId : null);
      const [students, enrollments, exams] = await Promise.all([
        apiFetch(studentsUrl).catch(() => []),
        apiFetch(enrollmentsUrl).catch(() => []),
        apiFetch(examsUrl).catch(() => []),
      ]);

      const studentCount = Array.isArray(students) ? students.length : 0;
      const enrollmentCount = Array.isArray(enrollments) ? enrollments.length : 0;
      
      // Calculate average completion based on enrollments
      const completedEnrollments = Array.isArray(enrollments) 
        ? enrollments.filter((e: any) => e.status === 'completed').length 
        : 0;
      const avgCompletion = enrollmentCount > 0 
        ? Math.round((completedEnrollments / enrollmentCount) * 100) 
        : 0;

      setStats({
        avgCompletion: avgCompletion || 0,
        avgScore: 0,
        improvement: 0,
        goalAchievement: 0,
        totalStudents: studentCount,
        totalEnrollments: enrollmentCount,
      });

      // Set recent progress from students
      if (Array.isArray(students) && Array.isArray(enrollments)) {
        setRecentProgress(students.slice(0, 5).map((s: any) => {
          const studentEnrollments = enrollments.filter((e: any) => String(e.studentId) === String(s.id));
          const completed = studentEnrollments.filter((e: any) => e.status === "completed" || e.status === "COMPLETED").length;
          const total = studentEnrollments.length;
          return {
            name: s.fullname || s.fullnameVi || 'Student',
            progress: total > 0 ? Math.round((completed / total) * 100) : 0,
            course: studentEnrollments[0]?.courseName || studentEnrollments[0]?.course?.name || 'N/A',
          };
        }));
      }
    } catch (error) {
      console.error("Error fetching progress data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/superadmin" className="hover:text-blue-600">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-900">Progress Reports</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📈 Progress Reports</h1>
            <p className="text-gray-500">Track student learning progress</p>
          </div>
          <button
            onClick={fetchProgressData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>🔄</span>
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="text-2xl mb-2">🏆</div>
              <p className="text-2xl font-bold">{stats.avgCompletion}%</p>
              <p className="text-sm text-gray-500">Avg. Completion</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="text-2xl mb-2">⭐</div>
              <p className="text-2xl font-bold">{stats.avgScore}/5</p>
              <p className="text-sm text-gray-500">Avg. Score</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="text-2xl mb-2">📈</div>
              <p className="text-2xl font-bold text-green-600">+{stats.improvement}%</p>
              <p className="text-sm text-gray-500">Improvement</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="text-2xl mb-2">🎯</div>
              <p className="text-2xl font-bold">{stats.goalAchievement}%</p>
              <p className="text-sm text-gray-500">Goal Achievement</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="text-2xl mb-2">👨‍🎓</div>
              <p className="text-2xl font-bold text-blue-600">{stats.totalStudents}</p>
              <p className="text-sm text-gray-500">Total Students</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="text-2xl mb-2">📝</div>
              <p className="text-2xl font-bold text-purple-600">{stats.totalEnrollments}</p>
              <p className="text-sm text-gray-500">Total Enrollments</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">📊 Recent Student Progress</h2>
            {recentProgress.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No progress data available</p>
            ) : (
              <div className="space-y-4">
                {recentProgress.map((student, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {student.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{student.name}</span>
                        <span className="text-sm text-gray-500">{student.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${student.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
