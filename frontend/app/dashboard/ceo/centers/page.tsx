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
  revenue: number;
  status: "active" | "inactive" | "under_review";
  openingDate?: string;
}

export default function CEOCentersPage() {
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
      const [centersRaw, studentsData, usersData, paymentsData] = await Promise.all([
        apiFetch("/api/centers").catch(() => []),
        apiFetch("/api/students").catch(() => []),
        apiFetch("/api/users").catch(() => []),
        apiFetch("/api/payments").catch(() => []),
      ]);
      
      const centerList = Array.isArray(centersRaw) ? centersRaw : [];
      const studentList = Array.isArray(studentsData) ? studentsData : [];
      const userList = Array.isArray(usersData) ? usersData : [];
      const paymentList = Array.isArray(paymentsData) ? paymentsData : [];

      if (centerList.length > 0) {
        setCenters(centerList.map((c: any) => {
          // Count students per center from real student data
          const centerStudents = studentList.filter((s: any) => s.centerId === c.id);
          const centerStaff = userList.filter((u: any) => u.centerId === c.id);
          const centerPayments = paymentList.filter((p: any) => p.centerId === c.id && p.status === "COMPLETED");
          const centerRevenue = centerPayments.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

          return {
            id: c.id,
            name: c.name,
            address: c.address || c.location || "",
            phone: c.phone || c.phoneNumber,
            email: c.email,
            manager: c.managerName || c.manager?.fullname,
            studentCount: c.studentCount || centerStudents.length,
            staffCount: c.staffCount || centerStaff.length,
            revenue: c.revenue || centerRevenue,
            status: c.status?.toLowerCase() || "active",
            openingDate: c.openingDate || c.createdAt
          };
        }));
      } else {
        setCenters([]);
      }
    } catch (error) {
      console.error("Error fetching centers:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) return `₫${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `₫${(amount / 1000000).toFixed(0)}M`;
    return `₫${amount.toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      case "under_review": return "bg-yellow-100 text-yellow-800";
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
    totalRevenue: centers.reduce((sum, c) => sum + c.revenue, 0),
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
          <h1 className="text-3xl font-bold text-gray-800">All Centers</h1>
          <p className="text-gray-600">Overview of all LERA Academy locations</p>
        </div>
        <Link href="/dashboard/ceo" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Centers</p>
              <p className="text-2xl font-bold">{totalStats.activeCenters}/{centers.length}</p>
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
              <p className="text-gray-500 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(totalStats.totalRevenue)}</p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-full text-xl">💰</div>
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

      {/* Centers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCenters.map((center) => (
          <div
            key={center.id}
            className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedCenter(center)}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{center.name}</h3>
                  <p className="text-sm text-gray-600">{center.address}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(center.status)}`}>
                  {center.status.replace("_", " ").toUpperCase()}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{center.studentCount}</p>
                  <p className="text-xs text-gray-600">Students</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{center.staffCount}</p>
                  <p className="text-xs text-gray-600">Staff</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-lg font-bold text-green-600">{formatCurrency(center.revenue)}</p>
                  <p className="text-xs text-gray-600">Revenue</p>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>👤 {center.manager || "TBD"}</span>
                <span>📞 {center.phone}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Center Detail Modal */}
      {selectedCenter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold">{selectedCenter.name}</h2>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${getStatusBadge(selectedCenter.status)}`}>
                  {selectedCenter.status.replace("_", " ").toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setSelectedCenter(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{selectedCenter.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Manager</p>
                  <p className="font-medium">{selectedCenter.manager || "TBD"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{selectedCenter.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selectedCenter.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Opening Date</p>
                  <p className="font-medium">
                    {selectedCenter.openingDate 
                      ? new Date(selectedCenter.openingDate).toLocaleDateString()
                      : "TBD"}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Performance Metrics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">{selectedCenter.studentCount}</p>
                    <p className="text-sm text-gray-600">Students</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-3xl font-bold text-purple-600">{selectedCenter.staffCount}</p>
                    <p className="text-sm text-gray-600">Staff</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedCenter.revenue)}</p>
                    <p className="text-sm text-gray-600">Revenue</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <Link href={`/dashboard/chairman/centers/${selectedCenter.id}`} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                View Full Details
              </Link>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                📊 View Reports
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
