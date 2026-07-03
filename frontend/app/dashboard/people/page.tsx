"use client";

import { useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { apiFetch } from "../../../lib/api";

// Roles allowed to search the org-wide people directory. Mirrors the backend @PreAuthorize on
// /api/users/search (manager tier); /api/students/search requires staff. Non-managers never see
// the nav link, and the page guards too.
const DIRECTORY_ROLES = [
  "SUPER_ADMIN", "SUPERADMIN", "CHAIRMAN", "CEO", "DIRECTOR",
  "CENTER_MANAGER", "CENTER_ADMIN", "ACADEMIC_MANAGER",
];

export default function PeopleDirectoryPage() {
  const [q, setQ] = useState("");
  const [employees, setEmployees] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  let role = "";
  try { role = (JSON.parse(Cookies.get("userData") || "{}").roleName || "").toUpperCase(); } catch { /* ignore */ }
  const canUse = DIRECTORY_ROLES.includes(role);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const [emp, stu] = await Promise.all([
        apiFetch(`/api/users/search?q=${encodeURIComponent(q)}`, {}, { silent: true }).catch(() => []),
        apiFetch(`/api/students/search?q=${encodeURIComponent(q)}`, {}, { silent: true }).catch(() => []),
      ]);
      setEmployees(Array.isArray(emp) ? emp : []);
      setStudents(Array.isArray(stu) ? stu : []);
      setSearched(true);
    } catch (err: any) {
      setError(err?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }

  const pretty = (v: any) => (v == null || v === "" ? "—" : String(v).replace(/_/g, " "));
  const initial = (name?: string, email?: string) => (name || email || "?").charAt(0).toUpperCase();

  if (!canUse) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">👥 People Directory</h1>
        <p className="text-gray-500">This directory is available to managers and admins. You can view your own details on <Link href="/dashboard/profile" className="text-blue-600 hover:underline">My Profile</Link>.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">👥 People Directory</h1>
        <p className="text-gray-500">Search everyone in your organization — employees and students — and open their full profile.</p>
      </div>

      <form onSubmit={search} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, email, code…"
          className="flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button type="submit" disabled={loading || !q.trim()}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Searching…" : "🔍 Search"}
        </button>
      </form>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      {searched && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Employees */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-5 py-3 border-b bg-gray-50 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">🧑‍💼 Employees</h2>
              <span className="text-xs text-gray-500">{employees.length} found</span>
            </div>
            <div className="divide-y">
              {employees.length === 0 ? (
                <p className="px-5 py-8 text-center text-gray-400 text-sm">No employees match.</p>
              ) : employees.map((u) => (
                <Link key={u.id} href={`/dashboard/users/${u.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">{initial(u.fullname, u.email)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{u.fullname || u.email}</p>
                    <p className="text-xs text-gray-500 truncate">{pretty(u.roleName)}{u.jobTitle ? ` · ${u.jobTitle}` : ""}{u.centerName ? ` · ${u.centerName}` : ""}</p>
                  </div>
                  <span className="text-gray-300">›</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Students */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-5 py-3 border-b bg-gray-50 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">🎓 Students</h2>
              <span className="text-xs text-gray-500">{students.length} found</span>
            </div>
            <div className="divide-y">
              {students.length === 0 ? (
                <p className="px-5 py-8 text-center text-gray-400 text-sm">No students match.</p>
              ) : students.map((s) => (
                <Link key={s.id} href={`/dashboard/academy/students/${s.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white text-sm font-bold shrink-0">{initial(s.fullname)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{s.fullname || s.fullnameVi || "Student"}</p>
                    <p className="text-xs text-gray-500 truncate">{s.studentCode || "—"}{s.grade ? ` · Grade ${s.grade}` : ""}{s.centerName ? ` · ${s.centerName}` : ""}</p>
                  </div>
                  <span className="text-gray-300">›</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
