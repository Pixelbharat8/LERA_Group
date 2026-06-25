"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../../../lib/api";
import { useUserCenter, buildCenterFilterUrl } from "../../../hooks/useUserCenter";
import TeacherPublicProfileFields from "../../../components/TeacherPublicProfileFields";

interface Teacher {
  id: string;
  teacherCode?: string;
  userId?: string;
  fullname: string;
  email: string;
  phone: string;
  centerId: string;
  centerName?: string;
  status: string;
  specialization?: string;
  qualification?: string;
  yearsOfExperience?: number;
  // Public "Meet our Teachers" profile
  displayName?: string;
  displayNameVi?: string;
  photoUrl?: string;
  bioVi?: string;
  isFeatured?: boolean;
  isNativeSpeaker?: boolean;
}

export default function SuperAdminTeachersPage() {
  const { centerId: userCenterId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [centers, setCenters] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [newTeacher, setNewTeacher] = useState({
    fullname: "",
    email: "",
    phone: "",
    centerId: "",
    specialization: "",
    status: "ACTIVE"
  });

  useEffect(() => {
    if (!userLoading) {
      fetchTeachers();
      fetchCenters();
    }
  }, [userLoading, userCenterId]);

  const fetchTeachers = async () => {
    try {
      const url = shouldFilterByCenter 
        ? buildCenterFilterUrl("/api/teachers", userCenterId)
        : "/api/teachers";
      const data = await apiFetch(url);
      const teachersList = Array.isArray(data) ? data : data.content || [];
      
      // Fetch user details for each teacher to get names
      const teachersWithNames = await Promise.all(
        teachersList.map(async (teacher: any) => {
          if (teacher.userId) {
            try {
              const user = await apiFetch(`/api/users/${teacher.userId}`);
              return {
                ...teacher,
                fullname: user.fullName || user.name || teacher.teacherCode || "",
                email: user.email || "",
                phone: user.phone || user.phoneNumber || ""
              };
            } catch {
              return {
                ...teacher,
                fullname: teacher.teacherCode || "Unknown"
              };
            }
          }
          return {
            ...teacher,
            fullname: teacher.fullname || teacher.teacherCode || "Unknown"
          };
        })
      );
      
      setTeachers(teachersWithNames);
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCenters = async () => {
    try {
      const data = await apiFetch("/api/centers");
      setCenters(Array.isArray(data) ? data : data.content || []);
    } catch (error) {
      console.error("Failed to fetch centers:", error);
    }
  };

  const handleCreate = async () => {
    try {
      await apiFetch("/api/teachers", {
        method: "POST",
        body: JSON.stringify(newTeacher),
      });
      alert("Teacher created successfully!");
      setShowAddModal(false);
      setNewTeacher({ fullname: "", email: "", phone: "", centerId: "", specialization: "", status: "ACTIVE" });
      fetchTeachers();
    } catch (error) {
      console.error("Error creating teacher:", error);
      alert("Failed to create teacher");
    }
  };

  const handleUpdate = async () => {
    if (!editingTeacher) return;
    try {
      await apiFetch(`/api/teachers/${editingTeacher.id}`, {
        method: "PUT",
        body: JSON.stringify(editingTeacher),
      });
      alert("Teacher updated successfully!");
      setShowEditModal(false);
      fetchTeachers();
    } catch (error) {
      console.error("Error updating teacher:", error);
      alert("Failed to update teacher");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this teacher?")) return;
    try {
      await apiFetch(`/api/teachers/${id}`, { method: "DELETE" });
      alert("Teacher deleted!");
      fetchTeachers();
    } catch (error) {
      console.error("Error deleting teacher:", error);
      alert("Failed to delete teacher");
    }
  };

  const handleToggleStatus = async (teacher: Teacher) => {
    const newStatus = teacher.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    if (!confirm(`Change status from ${teacher.status} to ${newStatus}?`)) return;
    try {
      await apiFetch(`/api/teachers/${teacher.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...teacher, status: newStatus }),
      });
      fetchTeachers();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const filteredTeachers = teachers.filter((teacher) =>
    teacher.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">👨‍🏫 All Teachers</h1>
          <p className="text-gray-500">Manage teachers across all centers</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          ➕ Add Teacher
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-3xl font-bold text-blue-600">{teachers.length}</div>
          <div className="text-gray-500 text-sm">Total Teachers</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-3xl font-bold text-green-600">
            {teachers.filter((t) => t.status === "ACTIVE").length}
          </div>
          <div className="text-gray-500 text-sm">Active</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-3xl font-bold text-purple-600">
            {new Set(teachers.map((t) => t.centerId)).size}
          </div>
          <div className="text-gray-500 text-sm">Centers</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <input
          type="text"
          placeholder="🔍 Search teachers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Teacher</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Phone</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Specialization</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredTeachers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No teachers found.
                </td>
              </tr>
            ) : (
              filteredTeachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                        {teacher.fullname?.charAt(0) || "T"}
                      </div>
                      <span className="font-medium">{teacher.fullname}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{teacher.email}</td>
                  <td className="px-4 py-3 text-gray-600">{teacher.phone || "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{teacher.specialization || "General"}</td>
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => handleToggleStatus(teacher)}
                      className={`px-2 py-1 rounded-full text-xs cursor-pointer hover:opacity-80 transition-opacity ${
                      teacher.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}
                      title="Click to toggle status"
                    >
                      {teacher.status}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingTeacher(teacher); setShowEditModal(true); }} className="p-1 text-green-600 hover:bg-green-50 rounded">✏️</button>
                      <button onClick={() => handleDelete(teacher.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Add New Teacher</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={newTeacher.fullname}
                onChange={(e) => setNewTeacher({ ...newTeacher, fullname: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="email"
                placeholder="Email"
                value={newTeacher.email}
                onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Phone"
                value={newTeacher.phone}
                onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Specialization (e.g., English, Math)"
                value={newTeacher.specialization}
                onChange={(e) => setNewTeacher({ ...newTeacher, specialization: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <select
                value={newTeacher.centerId}
                onChange={(e) => setNewTeacher({ ...newTeacher, centerId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select Center</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select
                value={newTeacher.status}
                onChange={(e) => setNewTeacher({ ...newTeacher, status: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={handleCreate} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Edit Teacher</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={editingTeacher.fullname}
                onChange={(e) => setEditingTeacher({ ...editingTeacher, fullname: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="email"
                placeholder="Email"
                value={editingTeacher.email}
                onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Phone"
                value={editingTeacher.phone || ""}
                onChange={(e) => setEditingTeacher({ ...editingTeacher, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Specialization"
                value={editingTeacher.specialization || ""}
                onChange={(e) => setEditingTeacher({ ...editingTeacher, specialization: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <select
                value={editingTeacher.centerId}
                onChange={(e) => setEditingTeacher({ ...editingTeacher, centerId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select Center</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select
                value={editingTeacher.status}
                onChange={(e) => setEditingTeacher({ ...editingTeacher, status: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <TeacherPublicProfileFields formData={editingTeacher} setFormData={(v) => setEditingTeacher(v)} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={handleUpdate} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
