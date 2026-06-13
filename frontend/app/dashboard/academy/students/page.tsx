"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import ExportMenu from "../../../components/ExportMenu";
import { useUserCenter, buildCenterFilterUrl } from "../../../hooks/useUserCenter";

interface Student {
  id: string;
  studentCode: string;
  userId: string;
  centerId: string;
  centerName?: string;
  fullname?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  enrollmentDate: string;
  status: string;
  classes?: ClassInfo[];
}

interface ClassInfo {
  id: string;
  name: string;
  classCode: string;
}

interface Center {
  id: string;
  name: string;
  code: string;
}

interface ClassOption {
  id: string;
  name: string;
  classCode: string;
  centerId: string;
}

export default function StudentsPage() {
  const { centerId: userCenterId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [students, setStudents] = useState<Student[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filters
  const [selectedCenter, setSelectedCenter] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Import state
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [createAccounts, setCreateAccounts] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    studentCode: "",
    fullname: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    centerId: "",
    userId: "",
    password: "",
    classId: ""
  });

  useEffect(() => {
    if (!userLoading) {
      fetchStudents();
      fetchCenters();
      fetchClasses();
    }
  }, [userLoading, userCenterId]);

  const fetchStudents = async () => {
    try {
      const url = shouldFilterByCenter 
        ? buildCenterFilterUrl("/api/students", userCenterId)
        : "/api/students";
      const data = await apiFetch(url);
      setStudents(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load students");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCenters = async () => {
    try {
      const data = await apiFetch("/api/centers").catch(() => []);
      setCenters(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch centers:", err);
      setCenters([]);
    }
  };

  const fetchClasses = async () => {
    try {
      const url = shouldFilterByCenter
        ? buildCenterFilterUrl("/api/classes", userCenterId)
        : "/api/classes";
      const data = await apiFetch(url).catch(() => []);
      setClasses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch classes:", err);
      setClasses([]);
    }
  };

  // Filter classes by selected center
  const filteredClasses = selectedCenter 
    ? classes.filter(c => c.centerId === selectedCenter)
    : classes;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      // If createAccounts is checked, first create a user account
      let userId = formData.userId;
      if (createAccounts && formData.email && formData.password) {
        const userResponse = await apiFetch("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            fullname: formData.fullname,
            phone: formData.phone,
            roleName: "STUDENT",
            centerId: formData.centerId || null,
            status: "ACTIVE"
          })
        });
        if (userResponse.user?.id) {
          userId = userResponse.user.id;
        }
      }

      const newStudent = await apiFetch("/api/students", {
        method: "POST",
        body: JSON.stringify({
          studentCode: formData.studentCode,
          fullname: formData.fullname,
          email: formData.email,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth || null,
          centerId: formData.centerId || null,
          userId: userId || null,
          enrollmentDate: new Date().toISOString(),
          status: "ACTIVE"
        })
      });

      // If class is selected, enroll student in class
      if (formData.classId && newStudent.id) {
        await apiFetch("/api/enrollments", {
          method: "POST",
          body: JSON.stringify({
            studentId: newStudent.id,
            classId: formData.classId,
            status: "ACTIVE"
          })
        }).catch(err => console.error("Failed to enroll in class:", err));
      }

      setStudents([...students, newStudent]);
      setShowAddModal(false);
      setFormData({ studentCode: "", fullname: "", email: "", phone: "", dateOfBirth: "", centerId: "", userId: "", password: "", classId: "" });
      setSuccessMessage("Student created successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return;
    
    try {
      await apiFetch(`/api/students/${id}`, { method: "DELETE" });
      setStudents(students.filter(s => s.id !== id));
      setSuccessMessage("Student deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error deleting student:", err);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      studentCode: student.studentCode || "",
      fullname: student.fullname || "",
      email: student.email || "",
      phone: student.phone || "",
      dateOfBirth: student.dateOfBirth || "",
      centerId: student.centerId || "",
      userId: student.userId || "",
      password: "",
      classId: ""
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    
    setSaving(true);
    setError("");

    try {
      const updatedStudent = await apiFetch(`/api/students/${editingStudent.id}`, {
        method: "PUT",
        body: JSON.stringify({
          fullname: formData.fullname,
          email: formData.email,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth || null,
          centerId: formData.centerId || null,
          status: editingStudent.status
        })
      });

      setStudents(students.map(s => s.id === editingStudent.id ? updatedStudent : s));
      setShowEditModal(false);
      setEditingStudent(null);
      setFormData({ studentCode: "", fullname: "", email: "", phone: "", dateOfBirth: "", centerId: "", userId: "", password: "", classId: "" });
      setSuccessMessage("Student updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Excel Import Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For CSV files
    if (file.name.endsWith('.csv')) {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const data = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',');
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index]?.trim() || '';
        });
        return obj;
      });
      
      setImportData(data);
      setImportPreview(true);
    } else {
      // For Excel files, we'd need xlsx library
      setError("Please upload a CSV file. Excel (.xlsx) support coming soon.");
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setError("");
    let successCount = 0;
    let errorCount = 0;

    for (const row of importData) {
      try {
        let userId = null;
        
        // Create user account if option is enabled
        if (createAccounts && row.email) {
          const password = row.password || `Student${Date.now()}!`;
          const userResponse = await apiFetch("/api/auth/register", {
            method: "POST",
            body: JSON.stringify({
              email: row.email,
              password: password,
              fullname: row.fullname || row.name || row.full_name || '',
              phone: row.phone || '',
              roleName: "STUDENT",
              centerId: row.centerid || row.center_id || selectedCenter || null,
              status: "ACTIVE"
            })
          }).catch(() => null);
          
          if (userResponse?.user?.id) {
            userId = userResponse.user.id;
          }
        }

        // Create student record
        const studentCode = row.studentcode || row.student_code || row.code || `STU${Date.now()}`;
        await apiFetch("/api/students", {
          method: "POST",
          body: JSON.stringify({
            studentCode: studentCode,
            fullname: row.fullname || row.name || row.full_name || '',
            email: row.email || '',
            phone: row.phone || '',
            dateOfBirth: row.dateofbirth || row.date_of_birth || row.dob || null,
            centerId: row.centerid || row.center_id || selectedCenter || null,
            userId: userId,
            enrollmentDate: new Date().toISOString(),
            status: "ACTIVE"
          })
        });

        successCount++;
      } catch (err) {
        errorCount++;
        console.error("Import error for row:", row, err);
      }
    }

    setImporting(false);
    setShowImportModal(false);
    setImportData([]);
    setImportPreview(false);
    
    if (successCount > 0) {
      setSuccessMessage(`Successfully imported ${successCount} students${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
      setTimeout(() => setSuccessMessage(""), 5000);
      fetchStudents(); // Refresh the list
    }
    if (errorCount > 0 && successCount === 0) {
      setError(`Failed to import ${errorCount} students`);
    }
  };

  // Filter students by search, center, class, and status
  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchQuery || 
      student.studentCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCenter = !selectedCenter || student.centerId === selectedCenter;
    const matchesStatus = !selectedStatus || student.status === selectedStatus;
    
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
            <span className="text-gray-900">Students</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">👨‍🎓 Students Management</h1>
          <p className="text-gray-500">Manage all students across centers</p>
        </div>
        <div className="flex gap-2">
          <ExportMenu
            filename="students"
            rows={students}
            columns={[
              { key: "studentCode", label: "Code" },
              { key: "fullname", label: "Name" },
              { key: "email", label: "Email" },
              { key: "phone", label: "Phone" },
              { key: "dateOfBirth", label: "Date of Birth" },
              { key: "enrollmentDate", label: "Enrollment Date" },
              { key: "status", label: "Status" },
              { key: "centerName", label: "Centre" },
              { key: (s) => (s.classes || []).map((c) => c.name).join("; "), label: "Classes" },
            ]}
          />
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            📥 Import Excel
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            ➕ Add New Student
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">👨‍🎓</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              <p className="text-sm text-gray-500">Total Students</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">✅</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{students.filter(s => s.status === "ACTIVE").length}</p>
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

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Search students..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            value={selectedCenter}
            onChange={(e) => setSelectedCenter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Centers</option>
            {centers.map((center) => (
              <option key={center.id} value={center.id}>{center.name}</option>
            ))}
          </select>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Classes</option>
            {filteredClasses.map((cls) => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="GRADUATED">Graduated</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <button
            onClick={() => { setSearchQuery(""); setSelectedCenter(""); setSelectedClass(""); setSelectedStatus(""); }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrollment Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  {students.length === 0 ? "No students found. Add your first student!" : "No students match your search."}
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/dashboard/academy/students/${student.id}`}>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{student.studentCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                        {student.fullname?.charAt(0) || "S"}
                      </div>
                      <span className="text-blue-600 hover:underline">{student.fullname || "-"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{student.email || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      student.status === "ACTIVE" ? "bg-green-100 text-green-800" : 
                      student.status === "GRADUATED" ? "bg-blue-100 text-blue-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <Link href={`/dashboard/academy/students/${student.id}`} className="text-green-600 hover:text-green-800 mr-3">
                      View
                    </Link>
                    <button 
                      onClick={() => handleEdit(student)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(student.id)}
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

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add New Student</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student Code *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.studentCode}
                    onChange={(e) => setFormData({...formData, studentCode: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="e.g., STU001" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.fullname}
                    onChange={(e) => setFormData({...formData, fullname: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="Student full name" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="student@example.com" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="Phone number" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input 
                    type="date" 
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
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
                  {saving ? "Creating..." : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Edit Student</h2>
              <button onClick={() => { setShowEditModal(false); setEditingStudent(null); }} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student Code</label>
                  <input 
                    type="text" 
                    value={formData.studentCode}
                    className="w-full px-4 py-2 border rounded-lg bg-gray-100" 
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.fullname}
                    onChange={(e) => setFormData({...formData, fullname: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input 
                    type="date" 
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
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
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingStudent(null); }} 
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
    </div>
  );
}
