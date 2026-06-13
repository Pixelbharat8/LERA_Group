"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../../../lib/api";

export default function ChairmanDepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [newDept, setNewDept] = useState({
    departmentName: "",
    departmentNameVi: "",
    departmentCode: "",
    departmentType: "ACADEMIC",
    centerId: "",
    description: "",
  });

  const departmentTypes = ["ACADEMIC", "ADMINISTRATIVE", "SUPPORT", "FINANCE", "HR", "IT", "MARKETING"];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deptsData, centersData] = await Promise.all([
        apiFetch("/api/departments").catch(() => []),
        apiFetch("/api/centers").catch(() => []),
      ]);
      setDepartments(Array.isArray(deptsData) ? deptsData : deptsData?.data || []);
      setCenters(Array.isArray(centersData) ? centersData : centersData?.data || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    try {
      await apiFetch("/api/departments", {
        method: "POST",
        body: JSON.stringify(newDept),
      });
      alert("Department created successfully!");
      setShowAddModal(false);
      setNewDept({ departmentName: "", departmentNameVi: "", departmentCode: "", departmentType: "ACADEMIC", centerId: "", description: "" });
      fetchData();
    } catch (error) {
      console.error("Error creating department:", error);
      alert("Failed to create department");
    }
  };

  const handleUpdate = async () => {
    if (!editingDept) return;
    try {
      await apiFetch(`/api/departments/${editingDept.id}`, {
        method: "PUT",
        body: JSON.stringify(editingDept),
      });
      alert("Department updated successfully!");
      setShowEditModal(false);
      fetchData();
    } catch (error) {
      console.error("Error updating department:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      await apiFetch(`/api/departments/${id}`, { method: "DELETE" });
      alert("Department deleted!");
      fetchData();
    } catch (error) {
      console.error("Error deleting department:", error);
    }
  };

  const getCenterName = (centerId: string) => {
    const center = centers.find(c => c.id === centerId);
    return center?.name || "Unknown";
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      ACADEMIC: "bg-blue-100 text-blue-800",
      ADMINISTRATIVE: "bg-purple-100 text-purple-800",
      SUPPORT: "bg-green-100 text-green-800",
      FINANCE: "bg-yellow-100 text-yellow-800",
      HR: "bg-pink-100 text-pink-800",
      IT: "bg-indigo-100 text-indigo-800",
      MARKETING: "bg-orange-100 text-orange-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
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
          <h1 className="text-3xl font-bold text-gray-800">🏛️ Departments Management</h1>
          <p className="text-gray-600">Manage all organizational departments</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          ➕ Add Department
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Total Departments</p>
          <p className="text-2xl font-bold text-blue-600">{departments.length}</p>
        </div>
        {departmentTypes.slice(0, 3).map((type) => (
          <div key={type} className="bg-white rounded-xl shadow p-4">
            <p className="text-gray-500 text-sm">{type}</p>
            <p className="text-2xl font-bold text-gray-800">
              {departments.filter(d => d.departmentType === type).length}
            </p>
          </div>
        ))}
      </div>

      {/* Departments Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Department</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Code</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Center</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {departments.map((dept, index) => (
                <tr key={dept.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{dept.departmentName || dept.name}</p>
                      <p className="text-sm text-gray-500">{dept.description || "No description"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">{dept.departmentCode || dept.code}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(dept.departmentType || dept.type)}`}>
                      {dept.departmentType || dept.type || "General"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{getCenterName(dept.centerId)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingDept(dept); setShowEditModal(true); }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(dept.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">➕ Add New Department</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                <input
                  type="text"
                  value={newDept.departmentName}
                  onChange={(e) => setNewDept({ ...newDept, departmentName: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Enter department name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Code</label>
                <input
                  type="text"
                  value={newDept.departmentCode}
                  onChange={(e) => setNewDept({ ...newDept, departmentCode: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="e.g., DEPT-HR-001"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newDept.departmentType}
                    onChange={(e) => setNewDept({ ...newDept, departmentType: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    {departmentTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Center</label>
                  <select
                    value={newDept.centerId}
                    onChange={(e) => setNewDept({ ...newDept, centerId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">Select Center</option>
                    {centers.map((center) => (
                      <option key={center.id} value={center.id}>{center.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newDept.description}
                  onChange={(e) => setNewDept({ ...newDept, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingDept && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">✏️ Edit Department</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                <input
                  type="text"
                  value={editingDept.departmentName || editingDept.name || ""}
                  onChange={(e) => setEditingDept({ ...editingDept, departmentName: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Code</label>
                <input
                  type="text"
                  value={editingDept.departmentCode || editingDept.code || ""}
                  onChange={(e) => setEditingDept({ ...editingDept, departmentCode: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={editingDept.departmentType || editingDept.type || "ACADEMIC"}
                    onChange={(e) => setEditingDept({ ...editingDept, departmentType: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    {departmentTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Center</label>
                  <select
                    value={editingDept.centerId || ""}
                    onChange={(e) => setEditingDept({ ...editingDept, centerId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">Select Center</option>
                    {centers.map((center) => (
                      <option key={center.id} value={center.id}>{center.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingDept.description || ""}
                  onChange={(e) => setEditingDept({ ...editingDept, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleUpdate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
