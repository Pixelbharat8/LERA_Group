"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../../../lib/api";
import { buildCenterFilterUrl } from "../../../../lib/center-filter";
import { useUserCenter } from "../../../hooks/useUserCenter";

interface Student {
  id: string;
  studentCode: string;
  fullname?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  level?: string;
  status: string;
  centerId?: string;
}

interface Center {
  id: string;
  code: string;
  name: string;
}

export default function AcademicManagerStudentsPage() {
  const { centerId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [students, setStudents] = useState<Student[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("");

  useEffect(() => {
    if (!userLoading) {
      fetchStudents();
      fetchCenters();
    }
  }, [userLoading, centerId]);

  const fetchStudents = async () => {
    try {
      const url = buildCenterFilterUrl("/api/students", shouldFilterByCenter ? centerId : null);
      const data = await apiFetch(url);
      setStudents(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load students");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCenters = async () => {
    try {
      const data = await apiFetch("/api/centers");
      setCenters(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error("Failed to fetch centers:", err);
    }
  };

  const getCenterName = (id?: string) => id ? centers.find(c => c.id === id)?.name || "-" : "-";

  const levels = Array.from(new Set(students.map(s => s.level).filter(Boolean)));

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.studentCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.fullname || student.fullName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = !levelFilter || student.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👨‍🎓 Student Overview</h1>
          <p className="text-gray-500">Academic Manager - View and track student progress</p>
        </div>
        <div className="flex gap-3">
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
          >
            <option value="">All Levels</option>
            {levels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search students..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm">Total Students</h3>
          <p className="text-2xl font-bold">{students.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm">Active Students</h3>
          <p className="text-2xl font-bold">{students.filter(s => s.status === "ACTIVE").length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <h3 className="text-gray-500 text-sm">Levels</h3>
          <p className="text-2xl font-bold">{levels.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <h3 className="text-gray-500 text-sm">Centers</h3>
          <p className="text-2xl font-bold">{new Set(students.map(s => s.centerId).filter(Boolean)).size}</p>
        </div>
      </div>

      {/* Level Distribution */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">📊 Student Distribution by Level</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {levels.map(level => {
            const count = students.filter(s => s.level === level).length;
            const percentage = students.length > 0 ? Math.round((count / students.length) * 100) : 0;
            return (
              <div key={level} className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500">{level}</p>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-gray-400">{percentage}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Center</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No students found.
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{student.studentCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{student.fullname || student.fullName || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{student.email || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{student.phone || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {student.level || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{getCenterName(student.centerId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      student.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {student.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
