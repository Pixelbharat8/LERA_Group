"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { useUserCenter, buildCenterFilterUrl } from "../../../hooks/useUserCenter";

type Department = {
  id: string;
  name: string;
  description?: string;
  headId?: string;
  centerId?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  // Enriched
  headName?: string;
  centerName?: string;
  employeeCount?: number;
};

type Center = { id: string; name: string };
type User = { id: string; fullname?: string; name?: string; email?: string; roleName?: string };

export default function DepartmentsPage() {
  const { centerId: userCenterId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCenter, setFilterCenter] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form
  const [form, setForm] = useState({
    name: "",
    description: "",
    headId: "",
    centerId: "",
    status: "ACTIVE",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const departmentsUrl = buildCenterFilterUrl("/api/departments", shouldFilterByCenter ? userCenterId : null);
      const usersUrl = buildCenterFilterUrl("/api/users", shouldFilterByCenter ? userCenterId : null);
      const [departmentsData, centersData, usersData] = await Promise.all([
        apiFetch(departmentsUrl).catch(() => []),
        apiFetch("/api/centers").catch(() => []),
        apiFetch(usersUrl).catch(() => []),
      ]);

      const centersArr = Array.isArray(centersData) ? centersData : centersData?.data || [];
      setCenters(centersArr);

      const usersArr = Array.isArray(usersData) ? usersData : usersData?.data || [];
      setUsers(usersArr);

      // Enrich departments
      const departmentsArr = Array.isArray(departmentsData) ? departmentsData : departmentsData?.data || [];
      const enrichedDepartments = departmentsArr.map((d: any) => {
        const head = usersArr.find((u: any) => u.id === d.headId);
        const center = centersArr.find((c: any) => c.id === d.centerId);
        const employeesInDept = usersArr.filter((u: any) => u.departmentId === d.id);
        
        return {
          ...d,
          headName: head?.fullname || head?.name || "Not Assigned",
          centerName: center?.name || "N/A",
          employeeCount: employeesInDept.length,
        };
      });
      
      setDepartments(enrichedDepartments);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading) {
      fetchData();
    }
  }, [userLoading, userCenterId]);

  const openCreateModal = () => {
    setForm({
      name: "",
      description: "",
      headId: "",
      centerId: "",
      status: "ACTIVE",
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (department: Department) => {
    setForm({
      name: department.name || "",
      description: department.description || "",
      headId: department.headId || "",
      centerId: department.centerId || "",
      status: department.status || "ACTIVE",
    });
    setSelectedDepartment(department);
    setIsEditing(true);
    setShowModal(true);
  };

  const openViewModal = (department: Department) => {
    setSelectedDepartment(department);
    setShowViewModal(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      alert("Please enter a department name");
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        headId: form.headId || null,
        centerId: form.centerId || null,
        status: form.status,
      };

      if (isEditing && selectedDepartment) {
        await apiFetch(`/api/departments/${selectedDepartment.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        alert("Department updated successfully!");
      } else {
        await apiFetch("/api/departments", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        alert("Department created successfully!");
      }
      
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      alert(error.message || "Failed to save department");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      await apiFetch(`/api/departments/${id}`, { method: "DELETE" });
      alert("Department deleted successfully!");
      fetchData();
    } catch (error: any) {
      alert(error.message || "Failed to delete department");
    }
  };

  // Filter departments
  const filteredDepartments = departments.filter((d) => {
    const matchesSearch = 
      d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.headName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCenter = !filterCenter || d.centerId === filterCenter;
    const matchesStatus = !filterStatus || d.status === filterStatus;
    return matchesSearch && matchesCenter && matchesStatus;
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800";
      case "INACTIVE": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  // Get potential department heads (managers, admins)
  const potentialHeads = users.filter(u => 
    u.roleName === "ADMIN" || 
    u.roleName === "CENTER_MANAGER" || 
    u.roleName === "HEAD_TEACHER" ||
    u.roleName === "MANAGER"
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/organization" className="hover:text-blue-600">Organization</Link>
            <span>/</span>
            <span className="text-gray-900">Departments</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">🏛️ Department Management</h1>
          <p className="text-gray-600">Manage organizational departments, heads, and structure</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>➕</span> Create Department
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Total Departments</p>
          <p className="text-2xl font-bold text-blue-600">{departments.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {departments.filter(d => d.status === "ACTIVE").length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Total Employees</p>
          <p className="text-2xl font-bold text-purple-600">
            {departments.reduce((sum, d) => sum + (d.employeeCount || 0), 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Avg. Dept Size</p>
          <p className="text-2xl font-bold text-orange-600">
            {departments.length > 0 
              ? Math.round(departments.reduce((sum, d) => sum + (d.employeeCount || 0), 0) / departments.length)
              : 0}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search by name, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="col-span-2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterCenter}
            onChange={(e) => setFilterCenter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Centers</option>
            {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl shadow">
            <div className="text-6xl mb-4">🏛️</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Departments Found</h3>
            <p className="text-gray-500">Create your first department to organize your team</p>
          </div>
        ) : (
          filteredDepartments.map((department) => (
            <div key={department.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">{department.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(department.status)}`}>
                    {department.status}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">📝</span>
                  <span className="text-sm text-gray-600 line-clamp-2">{department.description || "No description"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">👤</span>
                  <span className="text-sm text-gray-600">Head: {department.headName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">🏢</span>
                  <span className="text-sm text-gray-600">{department.centerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">👥</span>
                  <span className="text-sm text-gray-600">{department.employeeCount || 0} Employees</span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="border-t p-4 flex items-center justify-between bg-gray-50">
                <p className="text-xs text-gray-500">Created: {formatDate(department.createdAt)}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => openViewModal(department)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="View Details"
                  >
                    👁️
                  </button>
                  <button
                    onClick={() => openEditModal(department)}
                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(department.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-xl font-bold">{isEditing ? "✏️ Edit Department" : "➕ Create Department"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-800 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Human Resources, Academic, Finance"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe the department's responsibilities..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Head</label>
                <select
                  value={form.headId}
                  onChange={(e) => setForm({ ...form, headId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Head</option>
                  {potentialHeads.map(u => (
                    <option key={u.id} value={u.id}>{u.fullname || u.name} ({u.roleName})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Center</label>
                <select
                  value={form.centerId}
                  onChange={(e) => setForm({ ...form, centerId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Center (Optional)</option>
                  {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? "Saving..." : (isEditing ? "Update" : "Create")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedDepartment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-xl font-bold">📋 Department Details</h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-gray-800 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white">
                <h2 className="text-2xl font-bold">{selectedDepartment.name}</h2>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs ${getStatusColor(selectedDepartment.status)}`}>
                  {selectedDepartment.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="font-medium">{selectedDepartment.description || "No description"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Department Head</p>
                  <p className="font-medium">{selectedDepartment.headName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Center</p>
                  <p className="font-medium">{selectedDepartment.centerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Employees</p>
                  <p className="font-medium">{selectedDepartment.employeeCount || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">{formatDate(selectedDepartment.createdAt)}</p>
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
