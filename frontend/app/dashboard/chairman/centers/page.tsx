"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../../../lib/api";

export default function ChairmanCentersPage() {
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCenter, setEditingCenter] = useState<any>(null);
  const [newCenter, setNewCenter] = useState({
    name: "",
    nameVi: "",
    code: "",
    address: "",
    phone: "",
    email: "",
    managerId: "",
    isActive: true,
  });

  const fetchCenters = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/centers");
      setCenters(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.error("Failed to fetch centers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCenters();
  }, []);

  const handleCreate = async () => {
    try {
      await apiFetch("/api/centers", {
        method: "POST",
        body: JSON.stringify(newCenter),
      });
      alert("Center created successfully!");
      setShowAddModal(false);
      setNewCenter({ name: "", nameVi: "", code: "", address: "", phone: "", email: "", managerId: "", isActive: true });
      fetchCenters();
    } catch (error) {
      console.error("Error creating center:", error);
      alert("Failed to create center");
    }
  };

  const handleUpdate = async () => {
    if (!editingCenter) return;
    try {
      await apiFetch(`/api/centers/${editingCenter.id}`, {
        method: "PUT",
        body: JSON.stringify(editingCenter),
      });
      alert("Center updated successfully!");
      setShowEditModal(false);
      fetchCenters();
    } catch (error) {
      console.error("Error updating center:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this center?")) return;
    try {
      await apiFetch(`/api/centers/${id}`, { method: "DELETE" });
      await fetchCenters();
      alert("Center removed from the list.");
    } catch (error: any) {
      console.error("Error deleting center:", error);
      alert(
        error?.message ||
          "Could not delete this center. It may still be linked to users, classes, or other records."
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">🏢 Centers Management</h1>
          <p className="text-gray-600">Manage all organizational centers</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          ➕ Add New Center
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Total Centers</p>
          <p className="text-2xl font-bold text-blue-600">{centers.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Active Centers</p>
          <p className="text-2xl font-bold text-green-600">{centers.filter(c => c.isActive !== false).length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Inactive Centers</p>
          <p className="text-2xl font-bold text-red-600">{centers.filter(c => c.isActive === false).length}</p>
        </div>
      </div>

      {/* Centers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {centers.map((center) => (
          <div key={center.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{center.name}</h3>
                  <p className="text-gray-500 text-sm">{center.code}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  center.isActive !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {center.isActive !== false ? "Active" : "Inactive"}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <span>📍</span> {center.address || "No address"}
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <span>📞</span> {center.phone || "No phone"}
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <span>📧</span> {center.email || "No email"}
                </p>
              </div>

              <div className="flex gap-2">
                <a
                  href={`/dashboard/chairman/centers/${center.id}`}
                  className="flex-1 bg-purple-100 text-purple-600 px-3 py-2 rounded hover:bg-purple-200 text-center"
                >
                  📋 View
                </a>
                <button
                  onClick={() => { setEditingCenter(center); setShowEditModal(true); }}
                  className="flex-1 bg-blue-100 text-blue-600 px-3 py-2 rounded hover:bg-blue-200"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(center.id)}
                  className="flex-1 bg-red-100 text-red-600 px-3 py-2 rounded hover:bg-red-200"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">➕ Add New Center</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Center Name</label>
                <input
                  type="text"
                  value={newCenter.name}
                  onChange={(e) => setNewCenter({ ...newCenter, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Enter center name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Center Code</label>
                <input
                  type="text"
                  value={newCenter.code}
                  onChange={(e) => setNewCenter({ ...newCenter, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="e.g., CTR001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={newCenter.address}
                  onChange={(e) => setNewCenter({ ...newCenter, address: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newCenter.phone}
                    onChange={(e) => setNewCenter({ ...newCenter, phone: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newCenter.email}
                    onChange={(e) => setNewCenter({ ...newCenter, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create Center</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingCenter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">✏️ Edit Center</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Center Name</label>
                <input
                  type="text"
                  value={editingCenter.name || ""}
                  onChange={(e) => setEditingCenter({ ...editingCenter, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Center Code</label>
                <input
                  type="text"
                  value={editingCenter.code || ""}
                  onChange={(e) => setEditingCenter({ ...editingCenter, code: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={editingCenter.address || ""}
                  onChange={(e) => setEditingCenter({ ...editingCenter, address: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editingCenter.phone || ""}
                    onChange={(e) => setEditingCenter({ ...editingCenter, phone: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingCenter.email || ""}
                    onChange={(e) => setEditingCenter({ ...editingCenter, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editingCenter.isActive ? "active" : "inactive"}
                  onChange={(e) => setEditingCenter({ ...editingCenter, isActive: e.target.value === "active" })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleUpdate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
