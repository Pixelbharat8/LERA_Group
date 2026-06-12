"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { apiFetch } from "../../../../lib/api";

interface Student {
  id: string;
  studentCode: string;
  fullname?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  level?: string;
  status: string;
}

export default function CenterManagerStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const userDataStr = Cookies.get("userData");
    let centerId = null;
    
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        centerId = userData.centerId;
      } catch (e) {}
    }

    try {
      const data = await apiFetch(`/api/students${centerId ? `?centerId=${centerId}` : ""}`);
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch students:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s =>
    (s.studentCode || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.fullname || s.fullName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-gray-900">👨‍🎓 Center Students</h1>
          <p className="text-gray-500">View students in your center</p>
        </div>
        <input
          type="text"
          placeholder="Search students..."
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm">Total Students</h3>
          <p className="text-2xl font-bold">{students.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm">Active</h3>
          <p className="text-2xl font-bold">{students.filter(s => s.status === "ACTIVE").length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <h3 className="text-gray-500 text-sm">Levels</h3>
          <p className="text-2xl font-bold">{new Set(students.map(s => s.level).filter(Boolean)).size}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <h3 className="text-gray-500 text-sm">New This Month</h3>
          <p className="text-2xl font-bold">0</p>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
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
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{student.level || "-"}</td>
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
