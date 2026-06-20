"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  loadRosterStudentsForClasses,
  loadScopedClasses,
  resolveMyTeacherId,
  type RosterStudent,
} from "../../../../lib/teacher-context";

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<RosterStudent[]>([]);
  const [classList, setClassList] = useState<{ id: string; className: string }[]>([]);
  const [classFilter, setClassFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");
      const teacherEntityId = await resolveMyTeacherId();
      if (!teacherEntityId) {
        setError("No teacher profile linked to your account.");
        setStudents([]);
        return;
      }
      const classes = await loadScopedClasses("teacher", teacherEntityId);
      setClassList(classes.map((c) => ({ id: c.id, className: c.className })));
      const roster = await loadRosterStudentsForClasses(
        classes.map((c) => ({ id: c.id, className: c.className }))
      );
      setStudents(roster);
    } catch (err) {
      console.error(err);
      setStudents([]);
      setError("Could not load your students.");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesClass = !classFilter || student.className === classFilter;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      student.fullname.toLowerCase().includes(q) ||
      student.studentCode.toLowerCase().includes(q) ||
      student.email?.toLowerCase().includes(q) ||
      student.className.toLowerCase().includes(q);
    return matchesClass && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/teacher" className="hover:text-blue-600">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-gray-900">My Students</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">👨‍🎓 My Students</h1>
          <p className="text-gray-500 mt-1">Students enrolled in your classes</p>
        </div>
        <Link
          href="/dashboard/teacher/classes"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          View My Classes
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name, code, email, or class..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent md:w-64"
        >
          <option value="">All my classes ({students.length})</option>
          {classList.map((c) => (
            <option key={c.id} value={c.className}>
              {c.className} ({students.filter((s) => s.className === c.className).length})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Total Students</div>
          <div className="text-2xl font-bold text-gray-900">{students.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Active Students</div>
          <div className="text-2xl font-bold text-green-600">
            {students.filter((s) => s.status === "ACTIVE").length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Search Results</div>
          <div className="text-2xl font-bold text-blue-600">{filteredStudents.length}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Student Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {students.length === 0
                      ? "No students enrolled in your classes yet."
                      : "No students match your search."}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.studentCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.fullname}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {student.email || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {student.phone || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {student.className}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          student.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/dashboard/academy/students/${student.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
