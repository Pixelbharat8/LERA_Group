"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

interface Center {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  status: string;
  createdAt: string;
}

export default function CentersManagement() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    city: "Hải Phòng",
    phone: "",
    email: "",
    adminName: "",
    adminEmail: ""
  });

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    try {
      const data = await apiFetch("/api/centers");
      setCenters(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Error fetching centers:", err);
      setCenters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const data = await apiFetch("/api/centers", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          address: formData.address,
          city: formData.city,
          phone: formData.phone,
          email: formData.email,
          status: "ACTIVE"
        })
      });

      setCenters([...centers, data]);
      setShowAddModal(false);
      setFormData({ name: "", code: "", address: "", city: "Hải Phòng", phone: "", email: "", adminName: "", adminEmail: "" });
    } catch (err: any) {
      setError(err.message || "Failed to create center");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this center?")) return;

    try {
      await apiFetch(`/api/centers/${id}`, { method: "DELETE" });
      await fetchCenters();
    } catch (err: any) {
      console.error("Error deleting center:", err);
      alert(
        err?.message ||
          "Could not delete this center. If it still has staff, students, or classes linked, remove or reassign them first."
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">All Centers</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">🏢 Centers Management</h1>
          <p className="text-gray-500">Manage all LERA Academy learning centers</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            ➕ Add New Center
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">🏢</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{centers.length}</p>
              <p className="text-sm text-gray-500">Total Centers</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">✅</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{centers.filter(c => c.status === "ACTIVE").length}</p>
              <p className="text-sm text-gray-500">Active Centers</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">�</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{Array.from(new Set(centers.map(c => c.city))).length}</p>
              <p className="text-sm text-gray-500">Cities</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-2xl">�</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{centers.length > 0 ? "Active" : "N/A"}</p>
              <p className="text-sm text-gray-500">Status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Centers Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">All Centers</h2>
            <div className="flex items-center gap-3">
              <input 
                type="text"
                placeholder="Search centers..."
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <select className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Center</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {centers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No centers found. Add your first center!
                  </td>
                </tr>
              ) : centers.map((center) => (
                <tr key={center.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{center.name}</p>
                      <p className="text-sm text-gray-500">Code: {center.code}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-gray-900">{center.address || "-"}</p>
                      <p className="text-sm text-gray-500">{center.city || "-"}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-gray-900">{center.phone || "-"}</p>
                      <p className="text-sm text-gray-500">{center.email || "-"}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      center.status === "ACTIVE" 
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {center.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedCenter(center)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View Details"
                      >
                        👁
                      </button>
                      <Link 
                        href={`/dashboard/superadmin/centers/${center.id}/edit`}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Edit"
                      >
                        ✏️
                      </Link>
                      <button 
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                        title="Impersonate Admin"
                      >
                        🎭
                      </button>
                      <button 
                        onClick={() => handleDelete(center.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Center Details Modal */}
      {selectedCenter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">🏢 {selectedCenter.name}</h2>
              <button 
                onClick={() => setSelectedCenter(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900">📋 Basic Information</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Code:</span> {selectedCenter.code}</p>
                  <p><span className="text-gray-500">Address:</span> {selectedCenter.address || "-"}</p>
                  <p><span className="text-gray-500">City:</span> {selectedCenter.city || "-"}</p>
                  <p><span className="text-gray-500">Phone:</span> {selectedCenter.phone || "-"}</p>
                  <p><span className="text-gray-500">Email:</span> {selectedCenter.email || "-"}</p>
                  <p><span className="text-gray-500">Status:</span> {selectedCenter.status}</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900">� Contact</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Phone:</span> {selectedCenter.phone || "-"}</p>
                  <p><span className="text-gray-500">Email:</span> {selectedCenter.email || "-"}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <button 
                onClick={() => setSelectedCenter(null)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <Link 
                href={`/dashboard/superadmin/centers/${selectedCenter.id}/edit`}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                ✏️ Edit Center
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Add Center Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4">
            <h2 className="text-xl font-bold mb-4">➕ Add New Center</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Center Name *</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="e.g., LERA Academy - Hà Nội" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Center Code *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="e.g., HN001" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <select 
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option>Hải Phòng</option>
                    <option>Hà Nội</option>
                    <option>Hồ Chí Minh</option>
                    <option>Đà Nẵng</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="Full address" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="0225..." 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="center@lera.edu.vn" 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)} 
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Center"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
