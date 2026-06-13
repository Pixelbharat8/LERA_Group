"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import ExportMenu from "../../../components/ExportMenu";
import { useUserCenter, buildCenterFilterUrl } from "../../../hooks/useUserCenter";

interface Enrollment {
  id: string;
  enrollmentCode: string;
  studentId: string;
  classId: string;
  enrollmentDate: string;
  status: string;
  paymentStatus?: string;
}

interface Student {
  id: string;
  studentCode: string;
  fullName: string;
}

interface ClassItem {
  id: string;
  classCode: string;
  name: string;
}

export default function EnrollmentsPage() {
  const { centerId: userCenterId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingEnrollment, setViewingEnrollment] = useState<Enrollment | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    enrollmentCode: "",
    studentId: "",
    classId: "",
    paymentStatus: "PENDING"
  });

  useEffect(() => {
    if (!userLoading) {
      fetchEnrollments();
      fetchRelatedData();
    }
  }, [userLoading, userCenterId]);

  const fetchEnrollments = async () => {
    try {
      const url = shouldFilterByCenter 
        ? buildCenterFilterUrl("/api/enrollments", userCenterId)
        : "/api/enrollments";
      const data = await apiFetch(url);
      setEnrollments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load enrollments");
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedData = async () => {
    try {
      const studentsUrl = shouldFilterByCenter
        ? buildCenterFilterUrl("/api/students", userCenterId)
        : "/api/students";
      const classesUrl = shouldFilterByCenter
        ? buildCenterFilterUrl("/api/classes", userCenterId)
        : "/api/classes";
      const [studentsData, classesData] = await Promise.all([
        apiFetch(studentsUrl).catch(() => []),
        apiFetch(classesUrl).catch(() => []),
      ]);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch (err) {
      console.error("Failed to fetch related data:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const newEnrollment = await apiFetch("/api/enrollments", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          enrollmentDate: new Date().toISOString(),
          status: "ACTIVE"
        })
      });

      setEnrollments([...enrollments, newEnrollment]);
      setShowAddModal(false);
      setFormData({ enrollmentCode: "", studentId: "", classId: "", paymentStatus: "PENDING" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this enrollment?")) return;
    
    try {
      await apiFetch(`/api/enrollments/${id}`, { method: "DELETE" });
      setEnrollments(enrollments.filter(e => e.id !== id));
    } catch (err) {
      console.error("Error canceling enrollment:", err);
    }
  };

  const handleToggleStatus = async (enrollment: Enrollment) => {
    const newStatus = enrollment.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    if (!confirm(`Change enrollment status from ${enrollment.status} to ${newStatus}?`)) return;
    try {
      await apiFetch(`/api/enrollments/${enrollment.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...enrollment, status: newStatus }),
      });
      fetchEnrollments();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleTogglePaymentStatus = async (enrollment: Enrollment) => {
    const statusOrder = ["PENDING", "PAID", "OVERDUE"];
    const currentIndex = statusOrder.indexOf(enrollment.paymentStatus || "PENDING");
    const newStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    if (!confirm(`Change payment status from ${enrollment.paymentStatus || "PENDING"} to ${newStatus}?`)) return;
    try {
      await apiFetch(`/api/enrollments/${enrollment.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...enrollment, paymentStatus: newStatus }),
      });
      fetchEnrollments();
    } catch (err) {
      console.error("Error updating payment status:", err);
    }
  };

  const filteredEnrollments = enrollments.filter(e =>
    e.enrollmentCode?.toLowerCase().includes(searchQuery.toLowerCase())
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/superadmin" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">Enrollments</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">📝 Enrollments Management</h1>
          <p className="text-gray-500">Manage student enrollments</p>
        </div>
        <div className="flex gap-2">
          <ExportMenu
            filename="enrollments"
            rows={enrollments}
            columns={[
              { key: "enrollmentCode", label: "Code" },
              { key: (e) => students.find((s) => s.id === e.studentId)?.fullName || e.studentId, label: "Student" },
              { key: (e) => classes.find((c) => c.id === e.classId)?.name || e.classId, label: "Class" },
              { key: "enrollmentDate", label: "Enrollment Date" },
              { key: "status", label: "Status" },
              { key: "paymentStatus", label: "Payment Status" },
            ]}
          />
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            ➕ New Enrollment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">📝</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{enrollments.length}</p>
              <p className="text-sm text-gray-500">Total Enrollments</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">✅</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{enrollments.filter(e => e.status === "ACTIVE").length}</p>
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

      {/* Search */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search enrollments..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEnrollments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  {enrollments.length === 0 ? "No enrollments found." : "No enrollments match your search."}
                </td>
              </tr>
            ) : (
              filteredEnrollments.map((enrollment) => (
                <tr key={enrollment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{enrollment.enrollmentCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{enrollment.studentId?.substring(0, 8)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{enrollment.classId?.substring(0, 8)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {enrollment.enrollmentDate ? new Date(enrollment.enrollmentDate).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleTogglePaymentStatus(enrollment)}
                      className={`px-2 py-1 text-xs rounded-full cursor-pointer hover:opacity-80 ${
                      enrollment.paymentStatus === "PAID" ? "bg-green-100 text-green-800" : 
                      enrollment.paymentStatus === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {enrollment.paymentStatus || "N/A"}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(enrollment)}
                      className={`px-2 py-1 text-xs rounded-full cursor-pointer hover:opacity-80 ${
                      enrollment.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {enrollment.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => setViewingEnrollment(enrollment)} className="text-blue-600 hover:text-blue-800 mr-3">View</button>
                    <button 
                      onClick={() => handleDelete(enrollment.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Enrollment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">New Enrollment</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Code *</label>
                <input 
                  type="text" 
                  required
                  value={formData.enrollmentCode}
                  onChange={(e) => setFormData({...formData, enrollmentCode: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="e.g., ENR001" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                <select 
                  required
                  value={formData.studentId}
                  onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select Student</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.fullName || s.studentCode}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                <select 
                  required
                  value={formData.classId}
                  onChange={(e) => setFormData({...formData, classId: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                <select 
                  value={formData.paymentStatus}
                  onChange={(e) => setFormData({...formData, paymentStatus: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="PARTIAL">Partial</option>
                </select>
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
                  {saving ? "Creating..." : "Create Enrollment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Enrollment Modal */}
      {viewingEnrollment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Enrollment Details</h2>
              <button onClick={() => setViewingEnrollment(null)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Enrollment Code</label>
                  <p className="font-mono text-gray-900">{viewingEnrollment.enrollmentCode}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Status</label>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    viewingEnrollment.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}>
                    {viewingEnrollment.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Student ID</label>
                  <p className="text-gray-900 font-mono">{viewingEnrollment.studentId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Class ID</label>
                  <p className="text-gray-900 font-mono">{viewingEnrollment.classId}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Enrollment Date</label>
                  <p className="text-gray-900">{viewingEnrollment.enrollmentDate ? new Date(viewingEnrollment.enrollmentDate).toLocaleDateString() : "-"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Payment Status</label>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    viewingEnrollment.paymentStatus === "PAID" ? "bg-green-100 text-green-800" : 
                    viewingEnrollment.paymentStatus === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {viewingEnrollment.paymentStatus || "N/A"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setViewingEnrollment(null)} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
