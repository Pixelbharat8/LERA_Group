"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import ExportMenu from "../../../components/ExportMenu";

interface Parent {
  id: string;
  userId: string;
  parentCode: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  occupation?: string;
  centerId?: string;
  status: string;
  childrenCount?: number;
  createdAt: string;
}

interface Center {
  id: string;
  code: string;
  name: string;
}

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [filters, setFilters] = useState({
    centerId: "",
    status: "",
  });
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    occupation: "",
    centerId: "",
  });

  useEffect(() => {
    fetchParents();
    fetchCenters();
  }, []);

  const fetchParents = async () => {
    try {
      const data = await apiFetch("/api/parents");
      setParents(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load parents");
      setParents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCenters = async () => {
    try {
      const data = await apiFetch("/api/centers");
      setCenters(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch centers:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editingParent) {
        const updatedParent = await apiFetch(`/api/parents/${editingParent.id}`, {
          method: "PUT",
          body: JSON.stringify(formData)
        });
        setParents(parents.map(p => p.id === editingParent.id ? updatedParent : p));
        setEditingParent(null);
      } else {
        const newParent = await apiFetch("/api/parents", {
          method: "POST",
          body: JSON.stringify({
            ...formData,
            status: "ACTIVE"
          })
        });
        setParents([...parents, newParent]);
      }
      setShowAddModal(false);
      setFormData({ fullName: "", email: "", phone: "", address: "", occupation: "", centerId: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (parent: Parent) => {
    setEditingParent(parent);
    setFormData({
      fullName: parent.fullName || "",
      email: parent.email || "",
      phone: parent.phone || "",
      address: parent.address || "",
      occupation: parent.occupation || "",
      centerId: parent.centerId || "",
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this parent record?")) return;
    
    try {
      await apiFetch(`/api/parents/${id}`, { method: "DELETE" });
      setParents(parents.filter(p => p.id !== id));
    } catch (err) {
      console.error("Error deleting parent:", err);
    }
  };

  const handleToggleStatus = async (parent: Parent) => {
    const newStatus = parent.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    if (!confirm(`Change status from ${parent.status} to ${newStatus}?`)) return;
    try {
      await apiFetch(`/api/parents/${parent.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...parent, status: newStatus }),
      });
      fetchParents();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const getCenterName = (centerId: string) => {
    const center = centers.find(c => c.id === centerId);
    return center?.name || "N/A";
  };

  const filteredParents = parents.filter(parent => {
    const matchesSearch = parent.parentCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      parent.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      parent.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      parent.phone?.includes(searchQuery);
    const matchesCenter = !filters.centerId || parent.centerId === filters.centerId;
    const matchesStatus = !filters.status || parent.status === filters.status;
    return matchesSearch && matchesCenter && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">Parents</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">👨‍👩‍👧 Parents Management</h1>
          <p className="text-gray-500">Manage parent accounts and guardian information</p>
        </div>
        <div className="flex gap-2">
          <ExportMenu
            filename="parents"
            rows={parents}
            columns={[
              { key: "parentCode", label: "Code" },
              { key: "fullName", label: "Name" },
              { key: "email", label: "Email" },
              { key: "phone", label: "Phone" },
              { key: "address", label: "Address" },
              { key: "occupation", label: "Occupation" },
              { key: "childrenCount", label: "Children" },
              { key: "status", label: "Status" },
              { key: "createdAt", label: "Created" },
            ]}
          />
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            ➕ Add New Parent
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">👨‍👩‍👧</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{parents.length}</p>
              <p className="text-sm text-gray-500">Total Parents</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">✅</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{parents.filter(p => p.status === "ACTIVE").length}</p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">👶</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{parents.reduce((sum, p) => sum + (p.childrenCount || 0), 0)}</p>
              <p className="text-sm text-gray-500">Total Children</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-2xl">📧</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{parents.filter(p => p.email).length}</p>
              <p className="text-sm text-gray-500">With Email</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Search parents..."
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          value={filters.centerId}
          onChange={(e) => setFilters({ ...filters, centerId: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Centers</option>
          {centers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <button
          onClick={() => { setSearchQuery(""); setFilters({ centerId: "", status: "" }); }}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Clear Filters
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Center</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Children</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredParents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  {parents.length === 0 ? "No parents found. Add your first parent!" : "No parents match your filters."}
                </td>
              </tr>
            ) : (
              filteredParents.map((parent) => (
                <tr key={parent.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-500">{parent.parentCode || "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                        {parent.fullName?.charAt(0) || "P"}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{parent.fullName}</p>
                        <p className="text-sm text-gray-500">{parent.occupation || "Parent"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div>{parent.email || "-"}</div>
                    <div className="text-gray-500">{parent.phone || "-"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getCenterName(parent.centerId || "")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-medium">
                      {parent.childrenCount || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(parent)}
                      className={`px-2 py-1 text-xs rounded-full cursor-pointer hover:opacity-80 ${
                      parent.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {parent.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/dashboard/academy/parents/${parent.id}`} className="text-blue-600 hover:text-blue-800 mr-3">View</Link>
                    <button onClick={() => handleEdit(parent)} className="text-green-600 hover:text-green-800 mr-3">Edit</button>
                    <button 
                      onClick={() => handleDelete(parent.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Parent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">{editingParent ? "Edit Parent" : "Add New Parent"}</h2>
              <button onClick={() => { setShowAddModal(false); setEditingParent(null); }} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input 
                  type="text" 
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Parent's full name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Phone number"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Full address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                  <input 
                    type="text" 
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Job/Occupation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Center</label>
                  <select
                    value={formData.centerId}
                    onChange={(e) => setFormData({ ...formData, centerId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select center</option>
                    {centers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Parent"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
