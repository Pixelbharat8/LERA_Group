"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

interface StaffMember {
  id: string;
  fullname: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  center?: string;
  status: "active" | "inactive" | "on_leave";
  joinDate?: string;
  avatar?: string;
}

export default function DirectorStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterCenter, setFilterCenter] = useState<string>("all");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const [users, teachers] = await Promise.all([
        apiFetch("/api/users").catch(() => []),
        apiFetch("/api/teachers").catch(() => []),
      ]);

      const allStaff: StaffMember[] = [];
      
      if (Array.isArray(users)) {
        users.forEach((u: any) => {
          allStaff.push({
            id: u.id,
            fullname: u.fullname || `${u.firstName} ${u.lastName}`.trim() || u.email,
            email: u.email,
            phone: u.phone,
            role: u.role || "STAFF",
            department: u.department || "General",
            center: u.centerName || "Main Center",
            status: u.status?.toLowerCase() || "active",
            joinDate: u.createdAt || u.joinDate,
          });
        });
      }

      if (Array.isArray(teachers)) {
        teachers.forEach((t: any) => {
          if (!allStaff.find(s => s.email === t.email)) {
            allStaff.push({
              id: t.id,
              fullname: t.fullname || `${t.firstName} ${t.lastName}`.trim(),
              email: t.email,
              phone: t.phone,
              role: "TEACHER",
              department: "Academic",
              center: t.centerName || "Main Center",
              status: t.status?.toLowerCase() || "active",
              joinDate: t.createdAt,
            });
          }
        });
      }

      if (allStaff.length === 0) {
        setStaff([]);
      } else {
        setStaff(allStaff);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "CENTER_MANAGER": return "bg-purple-100 text-purple-800";
      case "TEACHER": return "bg-blue-100 text-blue-800";
      case "TA": return "bg-indigo-100 text-indigo-800";
      case "ACCOUNTANT": return "bg-green-100 text-green-800";
      case "HR": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      case "on_leave": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const uniqueRoles = Array.from(new Set(staff.map(s => s.role)));
  const uniqueCenters = Array.from(new Set(staff.map(s => s.center).filter(Boolean)));

  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || s.role === filterRole;
    const matchesCenter = filterCenter === "all" || s.center === filterCenter;
    return matchesSearch && matchesRole && matchesCenter;
  });

  const staffStats = {
    total: staff.length,
    active: staff.filter(s => s.status === "active").length,
    teachers: staff.filter(s => s.role === "TEACHER").length,
    managers: staff.filter(s => s.role === "CENTER_MANAGER").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Staff Management</h1>
          <p className="text-gray-600">View and manage all staff members</p>
        </div>
        <Link href="/dashboard/director" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Staff</p>
              <p className="text-2xl font-bold">{staffStats.total}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-full text-xl">👥</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Staff</p>
              <p className="text-2xl font-bold">{staffStats.active}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-full text-xl">✅</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Teachers</p>
              <p className="text-2xl font-bold">{staffStats.teachers}</p>
            </div>
            <div className="bg-indigo-500 p-3 rounded-full text-xl">👨‍🏫</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Managers</p>
              <p className="text-2xl font-bold">{staffStats.managers}</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-full text-xl">👔</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff..."
            className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Roles</option>
            {uniqueRoles.map(role => (
              <option key={role} value={role}>{role.replace("_", " ")}</option>
            ))}
          </select>
          <select
            value={filterCenter}
            onChange={(e) => setFilterCenter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Centers</option>
            {uniqueCenters.map(center => (
              <option key={center} value={center}>{center}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4">Staff Member</th>
              <th className="text-left py-3 px-4">Role</th>
              <th className="text-left py-3 px-4">Center</th>
              <th className="text-left py-3 px-4">Department</th>
              <th className="text-center py-3 px-4">Status</th>
              <th className="text-center py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((member) => (
              <tr key={member.id} className="border-t hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-lg font-medium">
                      {member.fullname.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{member.fullname}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(member.role)}`}>
                    {member.role.replace("_", " ")}
                  </span>
                </td>
                <td className="py-4 px-4 text-sm">{member.center}</td>
                <td className="py-4 px-4 text-sm">{member.department}</td>
                <td className="py-4 px-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(member.status)}`}>
                    {member.status.replace("_", " ").toUpperCase()}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <button
                    onClick={() => setSelectedStaff(member)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Staff Detail Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-2xl font-bold">
                  {selectedStaff.fullname.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedStaff.fullname}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(selectedStaff.role)}`}>
                    {selectedStaff.role.replace("_", " ")}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedStaff(null)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{selectedStaff.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{selectedStaff.phone || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Center:</span>
                <span className="font-medium">{selectedStaff.center}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Department:</span>
                <span className="font-medium">{selectedStaff.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Join Date:</span>
                <span className="font-medium">
                  {selectedStaff.joinDate ? new Date(selectedStaff.joinDate).toLocaleDateString() : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedStaff.status)}`}>
                  {selectedStaff.status.replace("_", " ").toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { window.location.href = `/dashboard/users/${selectedStaff.id}`; }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                View Profile
              </button>
              <button
                onClick={() => { window.location.href = `mailto:${selectedStaff.email}`; }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                📧 Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
