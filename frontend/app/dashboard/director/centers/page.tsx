"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

interface Center {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  manager?: string;
  studentCount: number;
  staffCount: number;
  classCount: number;
  status: "active" | "inactive";
  performance: "excellent" | "good" | "average" | "needs_improvement";
}

export default function DirectorCentersPage() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    try {
      setLoading(true);
      const [data, allStudents, allUsers, allClasses] = await Promise.all([
        apiFetch("/api/centers").catch(() => []),
        apiFetch("/api/students").catch(() => []),
        apiFetch("/api/users").catch(() => []),
        apiFetch("/api/classes").catch(() => []),
      ]);
      const studentList = Array.isArray(allStudents) ? allStudents : [];
      const userList = Array.isArray(allUsers) ? allUsers : [];
      const classList = Array.isArray(allClasses) ? allClasses : [];
      
      if (Array.isArray(data) && data.length > 0) {
        setCenters(data.map((c: any) => {
          const cid = String(c.id);
          const sCount = c.studentCount || studentList.filter((s: any) => String(s.centerId) === cid).length;
          const stCount = c.staffCount || userList.filter((u: any) => String(u.centerId) === cid && ["TEACHER", "STAFF", "TA"].includes(u.role)).length;
          const clCount = c.classCount || classList.filter((cl: any) => String(cl.centerId) === cid).length;
          const perf = sCount > 300 ? "excellent" : sCount > 150 ? "good" : sCount > 0 ? "average" : "needs_improvement";
          return {
            id: cid,
            name: c.name,
            address: c.address || c.location,
            phone: c.phone || c.phoneNumber,
            email: c.email,
            manager: c.managerName || c.manager?.fullname,
            studentCount: sCount,
            staffCount: stCount,
            classCount: clCount,
            status: c.status?.toLowerCase() || "active",
            performance: perf as any,
          };
        }));
      } else {
        setCenters([
          { id: "1", name: "Main Center - Vinhomes Marina", address: "95 Hải Đăng, Vinhomes Marina, An Biên, Hải Phòng", phone: "0387.633.141", email: "main@lera.edu.vn", manager: "N/A", studentCount: 0, staffCount: 0, classCount: 0, status: "active", performance: "average" },
        ]);
      }
    } catch (error) {
      console.error("Error fetching centers:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceBadge = (performance: string) => {
    switch (performance) {
      case "excellent": return "bg-green-100 text-green-800";
      case "good": return "bg-blue-100 text-blue-800";
      case "average": return "bg-yellow-100 text-yellow-800";
      case "needs_improvement": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredCenters = centers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStats = {
    totalStudents: centers.reduce((sum, c) => sum + c.studentCount, 0),
    totalStaff: centers.reduce((sum, c) => sum + c.staffCount, 0),
    totalClasses: centers.reduce((sum, c) => sum + c.classCount, 0),
    activeCenters: centers.filter(c => c.status === "active").length,
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
          <h1 className="text-3xl font-bold text-gray-800">Centers Management</h1>
          <p className="text-gray-600">Monitor and manage all learning centers</p>
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
              <p className="text-gray-500 text-sm">Active Centers</p>
              <p className="text-2xl font-bold">{totalStats.activeCenters}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-full text-xl">🏢</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Students</p>
              <p className="text-2xl font-bold">{totalStats.totalStudents.toLocaleString()}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-full text-xl">👨‍🎓</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Staff</p>
              <p className="text-2xl font-bold">{totalStats.totalStaff}</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-full text-xl">👥</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Classes</p>
              <p className="text-2xl font-bold">{totalStats.totalClasses}</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-full text-xl">📚</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow p-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search centers..."
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Centers Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4">Center</th>
              <th className="text-center py-3 px-4">Students</th>
              <th className="text-center py-3 px-4">Staff</th>
              <th className="text-center py-3 px-4">Classes</th>
              <th className="text-center py-3 px-4">Performance</th>
              <th className="text-center py-3 px-4">Status</th>
              <th className="text-center py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCenters.map((center) => (
              <tr key={center.id} className="border-t hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div>
                    <p className="font-medium">{center.name}</p>
                    <p className="text-sm text-gray-500">{center.address}</p>
                    <p className="text-xs text-gray-400">Manager: {center.manager || "TBD"}</p>
                  </div>
                </td>
                <td className="py-4 px-4 text-center font-medium">{center.studentCount}</td>
                <td className="py-4 px-4 text-center font-medium">{center.staffCount}</td>
                <td className="py-4 px-4 text-center font-medium">{center.classCount}</td>
                <td className="py-4 px-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPerformanceBadge(center.performance)}`}>
                    {center.performance.replace("_", " ").toUpperCase()}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    center.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}>
                    {center.status.toUpperCase()}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <button
                    onClick={() => setSelectedCenter(center)}
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

      {/* Center Detail Modal */}
      {selectedCenter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">{selectedCenter.name}</h2>
                <p className="text-gray-600 text-sm">{selectedCenter.address}</p>
              </div>
              <button onClick={() => setSelectedCenter(null)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-3xl font-bold text-blue-600">{selectedCenter.studentCount}</p>
                <p className="text-sm text-gray-600">Students</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <p className="text-3xl font-bold text-purple-600">{selectedCenter.staffCount}</p>
                <p className="text-sm text-gray-600">Staff</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-600">{selectedCenter.classCount}</p>
                <p className="text-sm text-gray-600">Classes</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg text-center">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPerformanceBadge(selectedCenter.performance)}`}>
                  {selectedCenter.performance.replace("_", " ").toUpperCase()}
                </span>
                <p className="text-sm text-gray-600 mt-2">Performance</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Manager:</span>
                <span className="font-medium">{selectedCenter.manager || "TBD"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{selectedCenter.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{selectedCenter.email}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Link href={`/dashboard/chairman/centers/${selectedCenter.id}`} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center">
                Full Details
              </Link>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                📊 Reports
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
