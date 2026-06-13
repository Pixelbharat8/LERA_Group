"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

interface Staff {
  id: string;
  userId: string;
  staffCode: string;
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  department?: string;
  departmentId?: string;
  centerId?: string;
  employmentType: string;
  hireDate: string;
  status: string;
  createdAt: string;
}

interface Center {
  id: string;
  code: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

export default function StaffListPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({
    centerId: "",
    departmentId: "",
    employmentType: "",
    status: "",
    staffCode: "",
    hireDateFrom: "",
    hireDateTo: "",
  });
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    jobTitle: "",
    departmentId: "",
    centerId: "",
    employmentType: "FULL_TIME",
    hireDate: "",
  });

  useEffect(() => {
    fetchStaff();
    fetchRelatedData();
  }, []);

  const fetchStaff = async () => {
    try {
      const data = await apiFetch("/api/staff");
      setStaffList(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load staff");
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedData = async () => {
    try {
      const [centersData, departmentsData] = await Promise.all([
        apiFetch("/api/centers").catch(() => []),
        apiFetch("/api/departments").catch(() => []),
      ]);
      setCenters(Array.isArray(centersData) ? centersData : []);
      setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
    } catch (err) {
      console.error("Failed to fetch related data:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editingStaff) {
        const updatedStaff = await apiFetch(`/api/staff/${editingStaff.id}`, {
          method: "PUT",
          body: JSON.stringify(formData)
        });
        setStaffList(staffList.map(s => s.id === editingStaff.id ? updatedStaff : s));
        setEditingStaff(null);
      } else {
        const newStaff = await apiFetch("/api/staff", {
          method: "POST",
          body: JSON.stringify({
            ...formData,
            status: "ACTIVE"
          })
        });
        setStaffList([...staffList, newStaff]);
      }
      setShowAddModal(false);
      setFormData({ fullName: "", email: "", phone: "", jobTitle: "", departmentId: "", centerId: "", employmentType: "FULL_TIME", hireDate: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setFormData({
      fullName: staff.fullName || "",
      email: staff.email || "",
      phone: staff.phone || "",
      jobTitle: staff.jobTitle || "",
      departmentId: staff.departmentId || "",
      centerId: staff.centerId || "",
      employmentType: staff.employmentType || "FULL_TIME",
      hireDate: staff.hireDate || "",
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;
    
    try {
      await apiFetch(`/api/staff/${id}`, { method: "DELETE" });
      setStaffList(staffList.filter(s => s.id !== id));
    } catch (err) {
      console.error("Error deleting staff:", err);
    }
  };

  const handleToggleStatus = async (staff: Staff) => {
    const newStatus = staff.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    if (!confirm(`Change status from ${staff.status} to ${newStatus}?`)) return;
    try {
      await apiFetch(`/api/staff/${staff.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...staff, status: newStatus }),
      });
      fetchStaff();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const getCenterName = (centerId: string) => {
    const center = centers.find(c => c.id === centerId);
    return center?.name || "N/A";
  };

  const getDepartmentName = (departmentId: string) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept?.name || "N/A";
  };

  const filteredStaff = staffList.filter(staff => {
    const matchesSearch = staff.staffCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCenter = !filters.centerId || staff.centerId === filters.centerId;
    const matchesDepartment = !filters.departmentId || staff.departmentId === filters.departmentId;
    const matchesEmploymentType = !filters.employmentType || staff.employmentType === filters.employmentType;
    const matchesStatus = !filters.status || staff.status === filters.status;
    const matchesStaffCode = !filters.staffCode || staff.staffCode?.toLowerCase().includes(filters.staffCode.toLowerCase());
    const matchesHireDateFrom = !filters.hireDateFrom || new Date(staff.hireDate) >= new Date(filters.hireDateFrom);
    const matchesHireDateTo = !filters.hireDateTo || new Date(staff.hireDate) <= new Date(filters.hireDateTo);
    return matchesSearch && matchesCenter && matchesDepartment && matchesEmploymentType && matchesStatus && matchesStaffCode && matchesHireDateFrom && matchesHireDateTo;
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
            <span className="text-gray-900">Staff</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">👥 Staff Management</h1>
          <p className="text-gray-500">Manage all staff members and employees</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
          >
            📥 Import
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            ➕ Add Staff
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">👥</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{staffList.length}</p>
              <p className="text-sm text-gray-500">Total Staff</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">✅</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{staffList.filter(s => s.status === "ACTIVE").length}</p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">💼</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{staffList.filter(s => s.employmentType === "FULL_TIME").length}</p>
              <p className="text-sm text-gray-500">Full-Time</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-2xl">⏰</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{staffList.filter(s => s.employmentType === "PART_TIME").length}</p>
              <p className="text-sm text-gray-500">Part-Time</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-2xl">🔧</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{staffList.filter(s => s.employmentType === "CONTRACT").length}</p>
              <p className="text-sm text-gray-500">Contract</p>
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
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by name, email..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <input
            type="text"
            placeholder="Staff Code (e.g., STF001)"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.staffCode}
            onChange={(e) => setFilters({ ...filters, staffCode: e.target.value })}
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
            value={filters.departmentId}
            onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select
            value={filters.employmentType}
            onChange={(e) => setFilters({ ...filters, employmentType: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Employment Types</option>
            <option value="FULL_TIME">Full-Time</option>
            <option value="PART_TIME">Part-Time</option>
            <option value="CONTRACT">Contract</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ON_LEAVE">On Leave</option>
          </select>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 whitespace-nowrap">Hire Date:</label>
            <input
              type="date"
              value={filters.hireDateFrom}
              onChange={(e) => setFilters({ ...filters, hireDateFrom: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 whitespace-nowrap">To:</label>
            <input
              type="date"
              value={filters.hireDateTo}
              onChange={(e) => setFilters({ ...filters, hireDateTo: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <button
            onClick={() => { setSearchQuery(""); setFilters({ centerId: "", departmentId: "", employmentType: "", status: "", staffCode: "", hireDateFrom: "", hireDateTo: "" }); }}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Center</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStaff.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  {staffList.length === 0 ? "No staff found. Add your first staff member!" : "No staff match your filters."}
                </td>
              </tr>
            ) : (
              filteredStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {staff.fullName?.charAt(0) || "S"}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{staff.fullName}</p>
                        <p className="text-xs font-mono text-gray-500">{staff.staffCode || staff.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-gray-900">{staff.jobTitle || "-"}</p>
                    <p className="text-sm text-gray-500">{staff.phone || "-"}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getDepartmentName(staff.departmentId || "")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getCenterName(staff.centerId || "")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      staff.employmentType === "FULL_TIME" ? "bg-purple-100 text-purple-800" :
                      staff.employmentType === "PART_TIME" ? "bg-orange-100 text-orange-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {staff.employmentType?.replace("_", " ") || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => handleToggleStatus(staff)}
                      className={`px-2 py-1 text-xs rounded-full cursor-pointer hover:opacity-80 transition-opacity ${
                      staff.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                      staff.status === "ON_LEAVE" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }`}
                      title="Click to toggle status"
                    >
                      {staff.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/dashboard/academy/staff/${staff.id}`} className="text-blue-600 hover:text-blue-800 mr-3">View</Link>
                    <button onClick={() => handleEdit(staff)} className="text-green-600 hover:text-green-800 mr-3">Edit</button>
                    <button 
                      onClick={() => handleDelete(staff.id)}
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

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">{editingStaff ? "Edit Staff Member" : "Add Staff Member"}</h2>
              <button onClick={() => { setShowAddModal(false); setEditingStaff(null); }} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
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
                  placeholder="Staff member's full name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Phone number"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Job title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="FULL_TIME">Full-Time</option>
                    <option value="PART_TIME">Part-Time</option>
                    <option value="CONTRACT">Contract</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
                <input 
                  type="date" 
                  value={formData.hireDate}
                  onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
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
                  {saving ? "Creating..." : "Create Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Import Staff</h2>
              <button onClick={() => setShowImportModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">Upload an Excel file to bulk import staff members.</p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input type="file" accept=".xlsx,.xls" className="hidden" id="staff-import-file" />
                <label htmlFor="staff-import-file" className="cursor-pointer">
                  <div className="text-4xl mb-2">📥</div>
                  <p className="text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-400">Excel files only (.xlsx, .xls)</p>
                </label>
              </div>
              <a 
                href="/api/import/templates/staff" 
                className="block text-center text-blue-600 hover:text-blue-800"
              >
                📄 Download template
              </a>
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
