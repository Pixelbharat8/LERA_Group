"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../../../lib/api";
import { useUserCenter, buildCenterFilterUrl } from "../../../hooks/useUserCenter";

interface Student {
  id: string;
  fullname: string;
  fullnameVi?: string;
  email?: string;
  phone?: string;
  centerId: string;
  centerName?: string;
  status: string;
  createdAt: string;
  dateOfBirth?: string;
  gender?: string;
  schoolName?: string;
  grade?: string;
  enrollmentDate?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  parentId?: string;
}

interface Center {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  fullname?: string;
  name?: string;
}

export default function SuperAdminStudentsPage() {
  const { centerId: userCenterId, shouldFilterByCenter, isCenterManager, loading: userLoading } = useUserCenter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCenter, setSelectedCenter] = useState("");
  const [centers, setCenters] = useState<Center[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [newStudent, setNewStudent] = useState({
    fullname: "",
    fullnameVi: "",
    centerId: "",
    status: "ACTIVE",
    dateOfBirth: "",
    gender: "",
    schoolName: "",
    grade: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    emergencyContactName: "",
    emergencyContactPhone: ""
  });

  useEffect(() => {
    if (!userLoading) {
      fetchData();
    }
  }, [userLoading, userCenterId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [studentsData, centersData, teachersData] = await Promise.all([
        apiFetch(shouldFilterByCenter ? buildCenterFilterUrl("/api/students", userCenterId) : "/api/students").catch(() => []),
        apiFetch("/api/centers").catch(() => []),
        apiFetch("/api/teachers").catch(() => [])
      ]);

      const centersArr = Array.isArray(centersData) ? centersData : centersData?.content || [];
      setCenters(centersArr);
      
      const teachersArr = Array.isArray(teachersData) ? teachersData : teachersData?.content || [];
      setTeachers(teachersArr);

      // Map center names to students
      const studentsArr = Array.isArray(studentsData) ? studentsData : studentsData?.content || [];
      const enrichedStudents = studentsArr.map((s: any) => ({
        ...s,
        centerName: centersArr.find((c: Center) => c.id === s.centerId)?.name || "N/A"
      }));
      setStudents(enrichedStudents);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCenters = async () => {
    // Already fetched in fetchData
  };

  const handleCreate = async () => {
    try {
      await apiFetch("/api/students", {
        method: "POST",
        body: JSON.stringify(newStudent),
      });
      alert("Student created successfully!");
      setShowAddModal(false);
      setNewStudent({ fullname: "", fullnameVi: "", centerId: "", status: "ACTIVE", dateOfBirth: "", gender: "", schoolName: "", grade: "", parentName: "", parentPhone: "", parentEmail: "", emergencyContactName: "", emergencyContactPhone: "" });
      fetchData();
    } catch (error) {
      console.error("Error creating student:", error);
      alert("Failed to create student");
    }
  };

  const handleUpdate = async () => {
    if (!editingStudent) return;
    try {
      await apiFetch(`/api/students/${editingStudent.id}`, {
        method: "PUT",
        body: JSON.stringify({
          fullname: editingStudent.fullname,
          fullnameVi: editingStudent.fullnameVi,
          centerId: editingStudent.centerId,
          status: editingStudent.status,
          dateOfBirth: editingStudent.dateOfBirth,
          gender: editingStudent.gender,
          schoolName: editingStudent.schoolName,
          grade: editingStudent.grade,
          parentName: editingStudent.parentName,
          parentPhone: editingStudent.parentPhone,
          parentEmail: editingStudent.parentEmail,
          emergencyContactName: editingStudent.emergencyContactName,
          emergencyContactPhone: editingStudent.emergencyContactPhone
        }),
      });
      alert("Student updated successfully!");
      setShowEditModal(false);
      fetchData();
    } catch (error) {
      console.error("Error updating student:", error);
      alert("Failed to update student");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return;
    try {
      await apiFetch(`/api/students/${id}`, { method: "DELETE" });
      alert("Student deleted!");
      fetchData();
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete student");
    }
  };

  const handleToggleStatus = async (student: Student) => {
    const newStatus = student.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    if (!confirm(`Change status from ${student.status} to ${newStatus}?`)) return;
    try {
      await apiFetch(`/api/students/${student.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...student, status: newStatus }),
      });
      fetchData();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCenter = !selectedCenter || student.centerId === selectedCenter;
    return matchesSearch && matchesCenter;
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">👨‍🎓 All Students</h1>
          <p className="text-gray-500">Manage students across all centers</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <span>➕</span> Add Student
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-3xl font-bold text-blue-600">{students.length}</div>
          <div className="text-gray-500 text-sm">Total Students</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-3xl font-bold text-green-600">
            {students.filter((s) => s.status === "ACTIVE").length}
          </div>
          <div className="text-gray-500 text-sm">Active</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-3xl font-bold text-yellow-600">
            {students.filter((s) => s.status === "PENDING").length}
          </div>
          <div className="text-gray-500 text-sm">Pending</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-3xl font-bold text-purple-600">{centers.length}</div>
          <div className="text-gray-500 text-sm">Centers</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="🔍 Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg"
          />
          <select
            value={selectedCenter}
            onChange={(e) => setSelectedCenter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">All Centers</option>
            {centers.map((center) => (
              <option key={center.id} value={center.id}>
                {center.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Student</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Center</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">DOB</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Gender</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">School</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Grade</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Emergency Contact</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Enrolled</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    No students found. Add your first student to get started.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          {student.fullname?.charAt(0) || "S"}
                        </div>
                        <div>
                          <span className="font-medium block">{student.fullname}</span>
                          {student.fullnameVi && <span className="text-xs text-gray-500">{student.fullnameVi}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">{student.centerName || "N/A"}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{student.gender || "-"}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{student.schoolName || "-"}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{student.grade || "-"}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      {student.emergencyContactName ? (
                        <div>
                          <div>{student.emergencyContactName}</div>
                          <div className="text-xs text-gray-400">{student.emergencyContactPhone}</div>
                        </div>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(student)}
                        className={`px-2 py-1 rounded-full text-xs cursor-pointer hover:opacity-80 transition-opacity ${
                          student.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : student.status === "INACTIVE"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                        title="Click to toggle status"
                      >
                        {student.status}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      {student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : 
                       student.createdAt ? new Date(student.createdAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingStudent({...student}); setShowEditModal(true); }} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Edit">✏️</button>
                        <button onClick={() => handleDelete(student.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Add New Student</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name (English)"
                  value={newStudent.fullname}
                  onChange={(e) => setNewStudent({ ...newStudent, fullname: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Full Name (Vietnamese)"
                  value={newStudent.fullnameVi}
                  onChange={(e) => setNewStudent({ ...newStudent, fullnameVi: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={newStudent.dateOfBirth}
                    onChange={(e) => setNewStudent({ ...newStudent, dateOfBirth: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <select
                  value={newStudent.gender}
                  onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="School Name"
                  value={newStudent.schoolName}
                  onChange={(e) => setNewStudent({ ...newStudent, schoolName: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Grade (e.g. Grade 5)"
                  value={newStudent.grade}
                  onChange={(e) => setNewStudent({ ...newStudent, grade: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <select
                value={newStudent.centerId}
                onChange={(e) => setNewStudent({ ...newStudent, centerId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select Center</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              
              {/* Parent Information */}
              <div className="border-t pt-4 mt-2">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">👨‍👩‍👧 Parent Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Parent Name"
                    value={newStudent.parentName}
                    onChange={(e) => setNewStudent({ ...newStudent, parentName: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Parent Phone"
                    value={newStudent.parentPhone}
                    onChange={(e) => setNewStudent({ ...newStudent, parentPhone: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <input
                  type="email"
                  placeholder="Parent Email"
                  value={newStudent.parentEmail}
                  onChange={(e) => setNewStudent({ ...newStudent, parentEmail: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg mt-4"
                />
              </div>
              
              {/* Emergency Contact */}
              <div className="border-t pt-4 mt-2">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">🆘 Emergency Contact</h4>
                <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Emergency Contact Name"
                  value={newStudent.emergencyContactName}
                  onChange={(e) => setNewStudent({ ...newStudent, emergencyContactName: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Emergency Contact Phone"
                  value={newStudent.emergencyContactPhone}
                  onChange={(e) => setNewStudent({ ...newStudent, emergencyContactPhone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                </div>
              </div>
              <select
                value={newStudent.status}
                onChange={(e) => setNewStudent({ ...newStudent, status: e.target.value })}
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
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Edit Student</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name (English)"
                  value={editingStudent.fullname || ""}
                  onChange={(e) => setEditingStudent({ ...editingStudent, fullname: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Full Name (Vietnamese)"
                  value={editingStudent.fullnameVi || ""}
                  onChange={(e) => setEditingStudent({ ...editingStudent, fullnameVi: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editingStudent.dateOfBirth?.split('T')[0] || ""}
                    onChange={(e) => setEditingStudent({ ...editingStudent, dateOfBirth: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <select
                  value={editingStudent.gender || ""}
                  onChange={(e) => setEditingStudent({ ...editingStudent, gender: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="School Name"
                  value={editingStudent.schoolName || ""}
                  onChange={(e) => setEditingStudent({ ...editingStudent, schoolName: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Grade (e.g. Grade 5)"
                  value={editingStudent.grade || ""}
                  onChange={(e) => setEditingStudent({ ...editingStudent, grade: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Center</label>
                <select
                  value={editingStudent.centerId || ""}
                  onChange={(e) => setEditingStudent({ ...editingStudent, centerId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select Center</option>
                  {centers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Parent Information */}
              <div className="border-t pt-4 mt-2">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">👨‍👩‍👧 Parent Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Parent Name"
                    value={editingStudent.parentName || ""}
                    onChange={(e) => setEditingStudent({ ...editingStudent, parentName: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Parent Phone"
                    value={editingStudent.parentPhone || ""}
                    onChange={(e) => setEditingStudent({ ...editingStudent, parentPhone: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <input
                  type="email"
                  placeholder="Parent Email"
                  value={editingStudent.parentEmail || ""}
                  onChange={(e) => setEditingStudent({ ...editingStudent, parentEmail: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg mt-4"
                />
              </div>
              
              {/* Emergency Contact */}
              <div className="border-t pt-4 mt-2">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">🆘 Emergency Contact</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Emergency Contact Name"
                    value={editingStudent.emergencyContactName || ""}
                    onChange={(e) => setEditingStudent({ ...editingStudent, emergencyContactName: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Emergency Contact Phone"
                    value={editingStudent.emergencyContactPhone || ""}
                    onChange={(e) => setEditingStudent({ ...editingStudent, emergencyContactPhone: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <select
                value={editingStudent.status || "ACTIVE"}
                onChange={(e) => setEditingStudent({ ...editingStudent, status: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={handleUpdate} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
