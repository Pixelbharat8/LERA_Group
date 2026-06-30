"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

interface Registration {
  id: string;
  studentName: string;
  course: string;
  date: string;
  status: string;
  payment: string;
  amount?: number;
}

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  // New-registration modal
  const [showModal, setShowModal] = useState(false);
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [form, setForm] = useState({ studentName: "", parentName: "", parentPhone: "", parentEmail: "", courseId: "", amount: "", notes: "" });

  useEffect(() => {
    fetchRegistrations();
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await apiFetch("/api/courses").catch(() => []);
      const arr = Array.isArray(data) ? data : (data as any)?.content || [];
      setCourses(arr.map((c: any) => ({ id: c.id, name: c.name || c.courseName || "Course" })));
    } catch {
      setCourses([]);
    }
  };

  const handleCreate = async () => {
    if (!form.studentName.trim()) { setFormErr("Student name is required."); return; }
    if (!form.parentPhone.trim()) { setFormErr("Parent phone is required."); return; }
    setSaving(true);
    setFormErr(null);
    try {
      const course = courses.find((c) => c.id === form.courseId);
      await apiFetch("/api/student-registrations", {
        method: "POST",
        body: JSON.stringify({
          studentName: form.studentName.trim(),
          parentName: form.parentName.trim() || null,
          parentPhone: form.parentPhone.trim(),
          parentEmail: form.parentEmail.trim() || null,
          courseId: form.courseId || null,
          courseName: course?.name || null,
          amount: form.amount ? Number(form.amount) : null,
          notes: form.notes.trim() || null,
          status: "PENDING",
          paymentStatus: "PENDING",
        }),
      });
      setShowModal(false);
      setForm({ studentName: "", parentName: "", parentPhone: "", parentEmail: "", courseId: "", amount: "", notes: "" });
      await fetchRegistrations();
    } catch (e: any) {
      setFormErr(e?.message || "Could not create the registration.");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async (id: string) => {
    if (!confirm("Confirm this registration?")) return;
    try {
      await apiFetch(`/api/student-registrations/${id}/confirm`, { method: "PUT" });
      fetchRegistrations();
    } catch (err) {
      console.error("Error confirming registration:", err);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const data = await apiFetch("/api/student-registrations");
      const regsArray = Array.isArray(data) ? data : [];
      setRegistrations(regsArray.map((r: any) => ({
        id: r.id,
        studentName: r.studentName || r.student_name || "Unknown",
        course: r.courseName || r.course_name || "N/A",
        date: r.registrationDate?.split("T")[0] || r.registration_date || new Date().toISOString().split("T")[0],
        status: r.status === "CONFIRMED" ? "Confirmed" : r.status === "PENDING" ? "Pending" : r.status || "Pending",
        payment: r.paymentStatus === "PAID" ? "Paid" : r.paymentStatus === "PARTIAL" ? "Partial" : r.paymentStatus || "Pending",
        amount: r.amount
      })));
    } catch (err) {
      console.error("Error fetching registrations:", err);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/superadmin" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">Registrations</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">📝 Registrations</h1>
          <p className="text-gray-500">Manage new student registrations</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          ➕ New Registration
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">📝</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{registrations.length}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">✅</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{registrations.filter(r => r.status === "Confirmed").length}</p>
              <p className="text-sm text-gray-500">Confirmed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-2xl">⏳</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{registrations.filter(r => r.status === "Pending").length}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">💰</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{registrations.filter(r => r.payment === "Paid").length}</p>
              <p className="text-sm text-gray-500">Paid</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {registrations.map((reg) => (
              <tr key={reg.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium">{reg.studentName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{reg.course}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{reg.date}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    reg.status === "Confirmed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                  }`}>{reg.status}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    reg.payment === "Paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                  }`}>{reg.payment}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button onClick={() => handleConfirm(reg.id)} className="text-green-600 hover:text-green-800">Confirm</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !saving && setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">New registration</h2>
              <button onClick={() => !saving && setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student name *</label>
                <input value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent name</label>
                  <input value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent phone *</label>
                  <input value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent email</label>
                <input type="email" value={form.parentEmail} onChange={(e) => setForm({ ...form, parentEmail: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                  <select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="">Select…</option>
                    {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              {formErr && <div className="p-2 rounded-lg bg-red-50 text-red-700 text-sm">{formErr}</div>}
              <div className="flex gap-3 pt-1">
                <button onClick={handleCreate} disabled={saving} className="flex-1 py-2.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50">
                  {saving ? "Saving…" : "Create registration"}
                </button>
                <button onClick={() => setShowModal(false)} disabled={saving} className="px-5 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
