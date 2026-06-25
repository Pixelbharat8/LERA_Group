"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { buildCenterFilterUrl } from "../../../../lib/center-filter";
import { useUserCenter } from "../../../hooks/useUserCenter";
import PublicProfileFields from "../../../components/TeacherPublicProfileFields";

interface Teacher {
  id: string;
  teacherCode: string;
  fullName?: string;
  email?: string;
  specialization?: string;
  qualification?: string;
  yearsOfExperience?: number;
  nationality?: string;
  bio?: string;
  centerId?: string;
  status: string;
}

interface Center {
  id: string;
  code: string;
  name: string;
}

export default function AcademicManagerTeachersPage() {
  const { centerId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
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
    centerId: "",
    displayName: "",
    displayNameVi: "",
    photoUrl: "",
    bioVi: "",
    isFeatured: false,
    isNativeSpeaker: false
  });
  const emptyForm = {
    fullName: "", email: "", teacherCode: "", specialization: "", qualification: "",
    yearsOfExperience: 0, nationality: "", bio: "", centerId: "",
    displayName: "", displayNameVi: "", photoUrl: "", bioVi: "", isFeatured: false, isNativeSpeaker: false
  };

  useEffect(() => {
    if (!userLoading) {
      fetchTeachers();
      fetchCenters();
    }
  }, [userLoading, centerId]);

  const fetchTeachers = async () => {
    try {
      const url = buildCenterFilterUrl("/api/teachers", shouldFilterByCenter ? centerId : null);
      const data = await apiFetch(url);
      const teachersList = Array.isArray(data) ? data : [];
      
      // Fetch user details for each teacher to get names
      const teachersWithNames = await Promise.all(
        teachersList.map(async (teacher: any) => {
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
          status: "ACTIVE",
          displayName: formData.displayName || null,
          displayNameVi: formData.displayNameVi || null,
          photoUrl: formData.photoUrl || null,
          bioVi: formData.bioVi || null,
          isFeatured: formData.isFeatured,
          isNativeSpeaker: formData.isNativeSpeaker
        })
      });
      setTeachers([...teachers, newTeacher]);
      setShowAddModal(false);
      setFormData(emptyForm);
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
      centerId: teacher.centerId || "",
      displayName: (teacher as any).displayName || "",
      displayNameVi: (teacher as any).displayNameVi || "",
      photoUrl: (teacher as any).photoUrl || "",
      bioVi: (teacher as any).bioVi || "",
      isFeatured: (teacher as any).isFeatured ?? false,
      isNativeSpeaker: (teacher as any).isNativeSpeaker ?? false
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getCenterName = (id?: string) => id ? centers.find(c => c.id === id)?.name || "-" : "-";

  const filteredTeachers = teachers.filter(teacher =>
    teacher.teacherCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👨‍🏫 Teacher Management</h1>
          <p className="text-gray-500">Academic Manager - View and manage teachers</p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search teachers..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Teacher
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm">Total Teachers</h3>
          <p className="text-2xl font-bold">{teachers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm">Active Teachers</h3>
          <p className="text-2xl font-bold">{teachers.filter(t => t.status === "ACTIVE").length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <h3 className="text-gray-500 text-sm">Specializations</h3>
          <p className="text-2xl font-bold">{new Set(teachers.map(t => t.specialization).filter(Boolean)).size}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <h3 className="text-gray-500 text-sm">Avg Experience</h3>
          <p className="text-2xl font-bold">
            {teachers.length > 0 ? Math.round(teachers.reduce((sum, t) => sum + (t.yearsOfExperience || 0), 0) / teachers.length) : 0} yrs
          </p>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialization</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qualification</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Experience</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Center</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTeachers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  No teachers found.
                </td>
              </tr>
            ) : (
              filteredTeachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{teacher.teacherCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{teacher.fullName || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{teacher.specialization || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{teacher.qualification || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{teacher.yearsOfExperience || 0} yrs</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{getCenterName(teacher.centerId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      teacher.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {teacher.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(teacher)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(teacher.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
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
          <div className="bg-white rounded-xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Add New Teacher</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teacher Code *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.teacherCode}
                    onChange={(e) => setFormData({ ...formData, teacherCode: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="e.g., English, Math"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Qualification</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  placeholder="e.g., M.Ed, TESOL Certificate"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Center</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.centerId}
                  onChange={(e) => setFormData({ ...formData, centerId: e.target.value })}
                >
                  <option value="">Select Center...</option>
                  {centers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                  placeholder="Brief introduction..."
                />
              </div>

              <PublicProfileFields formData={formData} setFormData={setFormData} />

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? "Creating..." : "Create Teacher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {showEditModal && editingTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Edit Teacher</h2>
            
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teacher Code</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    value={formData.teacherCode}
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Qualification</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Center</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.centerId}
                  onChange={(e) => setFormData({ ...formData, centerId: e.target.value })}
                >
                  <option value="">Select Center...</option>
                  {centers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                />
              </div>

              <PublicProfileFields formData={formData} setFormData={setFormData} />

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingTeacher(null); }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? "Updating..." : "Update Teacher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
