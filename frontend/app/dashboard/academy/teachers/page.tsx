"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { apiFetch } from "../../../../lib/api";
import { useUserCenter, buildCenterFilterUrl } from "../../../hooks/useUserCenter";

interface Teacher {
  id: string;
  teacherCode: string;
  userId: string;
  centerId: string;
  specialization?: string;
  qualification?: string;
  yearsOfExperience?: number;
  nationality?: string;
  bio?: string;
  bioVi?: string;
  hourlyRate?: number;
  contractType?: string;
  isNativeSpeaker?: boolean;
  isFeatured?: boolean;
  status: string;
  createdAt?: string;
  // User info (populated from identity service)
  fullName?: string;
  email?: string;
  phone?: string;
}

interface User {
  id: string;
  fullName: string;
  email: string;
}

interface Center {
  id: string;
  name: string;
  code: string;
}

export default function TeachersPage() {
  const { centerId: userCenterId, shouldFilterByCenter, userRole, loading: userLoading } = useUserCenter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [centerFilter, setCenterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    teacherCode: "",
    specialization: "",
    qualification: "",
    yearsOfExperience: 0,
    nationality: "",
    bio: "",
    centerId: ""
  });

  // Check if user can view all centers (CHAIRMAN, SUPERADMIN, etc.)
  const canViewAllCenters = ["CHAIRMAN", "SUPERADMIN", "ADMIN", "DIRECTOR"].includes(userRole || "");

  useEffect(() => {
    if (!userLoading) {
      fetchTeachers();
      fetchCenters();
    }
  }, [userLoading, userCenterId]);

  const fetchTeachers = async () => {
    try {
      // For CENTER_MANAGER and similar roles, filter by their center
      const url = shouldFilterByCenter 
        ? buildCenterFilterUrl("/api/teachers", userCenterId)
        : "/api/teachers";
      
      const data = await apiFetch(url);
      const teachersList = Array.isArray(data) ? data : [];
      
      // Fetch user details for each teacher to get names
      const teachersWithNames = await Promise.all(
        teachersList.map(async (teacher: Teacher) => {
          if (teacher.userId) {
            try {
              const user = await apiFetch(`/api/users/${teacher.userId}`);
              return {
                ...teacher,
                fullName: user.fullName || user.name || "",
                email: user.email || ""
              };
            } catch {
              return teacher;
            }
          }
          return teacher;
        })
      );
      
      setTeachers(teachersWithNames);
    } catch (err: any) {
      setError(err.message || "Failed to load teachers");
      setTeachers([]);
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
      setCenters([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const newTeacher = await apiFetch("/api/teachers", {
        method: "POST",
        body: JSON.stringify({
          teacherCode: formData.teacherCode,
          specialization: formData.specialization,
          qualification: formData.qualification,
          yearsOfExperience: formData.yearsOfExperience,
          nationality: formData.nationality,
          bio: formData.bio,
          centerId: formData.centerId || null,
          status: "ACTIVE"
        })
      });

      setTeachers([...teachers, newTeacher]);
      setShowAddModal(false);
      setFormData({ fullName: "", email: "", teacherCode: "", specialization: "", qualification: "", yearsOfExperience: 0, nationality: "", bio: "", centerId: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this teacher?")) return;
    
    try {
      await apiFetch(`/api/teachers/${id}`, { method: "DELETE" });
      setTeachers(teachers.filter(t => t.id !== id));
    } catch (err) {
      console.error("Error deleting teacher:", err);
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      fullName: "",
      email: "",
      teacherCode: teacher.teacherCode || "",
      specialization: teacher.specialization || "",
      qualification: teacher.qualification || "",
      yearsOfExperience: teacher.yearsOfExperience || 0,
      nationality: teacher.nationality || "",
      bio: teacher.bio || "",
      centerId: teacher.centerId || ""
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    
    setSaving(true);
    setError("");

    try {
      const updatedTeacher = await apiFetch(`/api/teachers/${editingTeacher.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...formData,
          status: editingTeacher.status
        })
      });

      setTeachers(teachers.map(t => t.id === editingTeacher.id ? updatedTeacher : t));
      setShowEditModal(false);
      setEditingTeacher(null);
      setFormData({ fullName: "", email: "", teacherCode: "", specialization: "", qualification: "", yearsOfExperience: 0, nationality: "", bio: "", centerId: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = 
      teacher.teacherCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.qualification?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCenter = !centerFilter || teacher.centerId === centerFilter;
    const matchesStatus = !statusFilter || teacher.status === statusFilter;
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
            <Link href="/dashboard/superadmin" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">Teachers</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">👨‍🏫 Teachers Management</h1>
          <p className="text-gray-500">Manage all teachers across centers. Click on a teacher to view profile.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            📥 Import Excel
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            ➕ Add New Teacher
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">👨‍🏫</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
              <p className="text-sm text-gray-500">Total Teachers</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">✅</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{teachers.filter(t => t.status === "ACTIVE").length}</p>
              <p className="text-sm text-gray-500">Active</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search by name, code, specialization..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {canViewAllCenters ? (
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={centerFilter}
              onChange={(e) => setCenterFilter(e.target.value)}
            >
              <option value="">All Centers</option>
              {centers.map(center => (
                <option key={center.id} value={center.id}>{center.name}</option>
              ))}
            </select>
          ) : (
            <div className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
              {centers.find(c => c.id === userCenterId)?.name || "Your Center"}
            </div>
          )}
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ON_LEAVE">On Leave</option>
          </select>
          <div className="flex items-center text-sm text-gray-600">
            Showing {filteredTeachers.length} of {teachers.length} teachers
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialization</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qualification</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Experience</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTeachers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  {teachers.length === 0 ? "No teachers found. Add your first teacher!" : "No teachers match your search."}
                </td>
              </tr>
            ) : (
              filteredTeachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/dashboard/academy/teachers/${teacher.id}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium">
                        {teacher.fullName?.charAt(0) || teacher.teacherCode?.charAt(0) || "T"}
                      </div>
                      <span className="font-mono text-sm text-purple-600 hover:underline">{teacher.teacherCode}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{teacher.fullName || "-"}</div>
                      {teacher.email && <div className="text-sm text-gray-500">{teacher.email}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{teacher.specialization || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{teacher.qualification || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {teacher.yearsOfExperience ? `${teacher.yearsOfExperience} years` : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      teacher.status === "ACTIVE" ? "bg-green-100 text-green-800" : 
                      teacher.status === "ON_LEAVE" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {teacher.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <Link href={`/dashboard/academy/teachers/${teacher.id}`} className="text-green-600 hover:text-green-800 mr-3">
                      View
                    </Link>
                    <button 
                      onClick={() => handleEdit(teacher)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(teacher.id)}
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

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add New Teacher</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
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
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="e.g., John Smith" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="e.g., john.smith@lera.com" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teacher Code *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.teacherCode}
                    onChange={(e) => setFormData({...formData, teacherCode: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="e.g., TCH001" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialization *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.specialization}
                    onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="e.g., English, Math" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                  <input 
                    type="text" 
                    value={formData.qualification}
                    onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="e.g., TESOL, Bachelor's" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                  <input 
                    type="number" 
                    min={0}
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({...formData, yearsOfExperience: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                  <input 
                    type="text" 
                    value={formData.nationality}
                    onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="e.g., American, British" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Center</label>
                  <select 
                    value={formData.centerId}
                    onChange={(e) => setFormData({...formData, centerId: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Center</option>
                    {centers.map(center => (
                      <option key={center.id} value={center.id}>{center.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea 
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  rows={3}
                  placeholder="Short biography..." 
                />
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
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Add Teacher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {showEditModal && editingTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Edit Teacher</h2>
              <button onClick={() => { setShowEditModal(false); setEditingTeacher(null); }} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teacher Code</label>
                  <input 
                    type="text" 
                    value={formData.teacherCode}
                    onChange={(e) => setFormData({...formData, teacherCode: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-100" 
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialization *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.specialization}
                    onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                  <input 
                    type="text" 
                    value={formData.qualification}
                    onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                  <input 
                    type="number" 
                    min={0}
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({...formData, yearsOfExperience: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                  <input 
                    type="text" 
                    value={formData.nationality}
                    onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Center</label>
                  <select 
                    value={formData.centerId}
                    onChange={(e) => setFormData({...formData, centerId: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Center</option>
                    {centers.map(center => (
                      <option key={center.id} value={center.id}>{center.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea 
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingTeacher(null); }} 
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Excel Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">📥 Import Teachers from Excel</h2>
              <button onClick={() => setShowImportModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            
            <div className="space-y-6">
              {/* Download Template */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">📄 Step 1: Download Template</h3>
                <p className="text-sm text-blue-700 mb-3">Download the Excel template with required columns for teacher data.</p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  Download Template
                </button>
              </div>

              {/* Upload File */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">📤 Step 2: Upload Your File</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <input type="file" accept=".xlsx,.xls,.csv" className="hidden" id="teacher-excel-upload" />
                  <label htmlFor="teacher-excel-upload" className="cursor-pointer">
                    <div className="text-4xl mb-2">📁</div>
                    <p className="text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-400">Supports: .xlsx, .xls, .csv</p>
                  </label>
                </div>
              </div>

              {/* Options */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">⚙️ Import Options</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded text-green-600" />
                    <span className="text-sm text-gray-700">Create user accounts automatically</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded text-green-600" />
                    <span className="text-sm text-gray-700">Send welcome email with credentials</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded text-green-600" />
                    <span className="text-sm text-gray-700">Skip existing teachers (by email)</span>
                  </label>
                </div>
              </div>

              {/* Column Mapping Preview */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">📊 Expected Columns</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <span className="bg-gray-100 px-2 py-1 rounded">Full Name *</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">Email *</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">Phone</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">Center Code</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">Specialization</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">Qualification</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">Experience (Years)</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">Nationality</span>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Import Teachers
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
