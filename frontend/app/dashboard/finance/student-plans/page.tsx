"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { useUserCenter, buildCenterFilterUrl } from "../../../hooks/useUserCenter";

interface StudentFeePlan {
  id: string;
  studentId: string;
  studentName: string;
  centerId: string;
  centerName: string;
  courseId: string;
  courseName: string;
  planType: "MONTHLY" | "QUARTERLY" | "SEMESTER" | "ANNUAL" | "CUSTOM";
  status: "ACTIVE" | "SUSPENDED" | "COMPLETED" | "CANCELLED";
  baseAmount: number;
  discountAmount: number;
  finalAmount: number;
  billingDay: number;
  nextBillingDate: string;
  startDate: string;
  endDate?: string;
  autoRenew: boolean;
  autoInvoice: boolean;
  paymentMethod?: string;
  discounts: string[];
  notes?: string;
  createdAt: string;
}

interface Student {
  id: string;
  fullname?: string;
  name?: string;
  email?: string;
}

interface Course {
  id: string;
  name: string;
  fee?: number;
}

interface Center {
  id: string;
  name: string;
}

export default function StudentFeePlansPage() {
  const { centerId: userCenterId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [feePlans, setFeePlans] = useState<StudentFeePlan[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCenter, setFilterCenter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<StudentFeePlan | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    studentId: "",
    courseId: "",
    planType: "MONTHLY" as StudentFeePlan["planType"],
    baseAmount: 0,
    billingDay: 1,
    startDate: "",
    autoRenew: true,
    autoInvoice: true,
    notes: ""
  });

  useEffect(() => {
    if (!userLoading) {
      fetchData();
    }
  }, [userLoading, userCenterId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const plansUrl = buildCenterFilterUrl('/api/student-fee-plans', shouldFilterByCenter ? userCenterId : null);
      const studentsUrl = buildCenterFilterUrl('/api/students', shouldFilterByCenter ? userCenterId : null);
      const coursesUrl = buildCenterFilterUrl('/api/courses', shouldFilterByCenter ? userCenterId : null);
      const [plansData, studentsData, coursesData, centersData] = await Promise.all([
        apiFetch(plansUrl).catch(() => []),
        apiFetch(studentsUrl).catch(() => []),
        apiFetch(coursesUrl).catch(() => []),
        apiFetch('/api/centers').catch(() => [])
      ]);

      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setCenters(Array.isArray(centersData) ? centersData : []);
      setFeePlans(Array.isArray(plansData) ? plansData : []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setFeePlans([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-800",
      SUSPENDED: "bg-yellow-100 text-yellow-800",
      COMPLETED: "bg-blue-100 text-blue-800",
      CANCELLED: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPlanTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      MONTHLY: "Monthly",
      QUARTERLY: "Quarterly (3 months)",
      SEMESTER: "Semester (6 months)",
      ANNUAL: "Annual (12 months)",
      CUSTOM: "Custom"
    };
    return labels[type] || type;
  };

  const stats = {
    total: feePlans.length,
    active: feePlans.filter(p => p.status === "ACTIVE").length,
    suspended: feePlans.filter(p => p.status === "SUSPENDED").length,
    monthlyRevenue: feePlans.filter(p => p.status === "ACTIVE").reduce((sum, p) => {
      const multiplier = p.planType === "MONTHLY" ? 1 : p.planType === "QUARTERLY" ? 1/3 : p.planType === "SEMESTER" ? 1/6 : 1/12;
      return sum + (p.finalAmount * multiplier);
    }, 0)
  };

  const filteredPlans = feePlans.filter(plan => {
    if (filterStatus !== "all" && plan.status !== filterStatus) return false;
    if (filterCenter !== "all" && plan.centerId !== filterCenter) return false;
    if (searchQuery && !plan.studentName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const openDetailModal = (plan: StudentFeePlan) => {
    setSelectedPlan(plan);
    setShowDetailModal(true);
  };

  const handleCreatePlan = async () => {
    if (!form.studentId || !form.courseId || !form.startDate) {
      alert("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      await apiFetch("/api/student-fee-plans", {
        method: "POST",
        body: JSON.stringify(form)
      });

      await fetchData();
      setShowModal(false);
      setForm({
        studentId: "",
        courseId: "",
        planType: "MONTHLY",
        baseAmount: 0,
        billingDay: 1,
        startDate: "",
        autoRenew: true,
        autoInvoice: true,
        notes: ""
      });
    } catch (err) {
      console.error("Error:", err);
      alert("Error creating fee plan");
    } finally {
      setSaving(false);
    }
  };

  const handleSuspend = async (planId: string) => {
    if (!confirm("Are you sure you want to suspend this fee plan?")) return;
    try {
      await apiFetch(`/api/student-fee-plans/${planId}/suspend`, { method: "POST" });
      await fetchData();
      setShowDetailModal(false);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleActivate = async (planId: string) => {
    try {
      await apiFetch(`/api/student-fee-plans/${planId}/activate`, { method: "POST" });
      await fetchData();
      setShowDetailModal(false);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleGenerateInvoice = async (planId: string) => {
    try {
      await apiFetch(`/api/student-fee-plans/${planId}/generate-invoice`, { method: "POST" });
      alert("Invoice generated successfully!");
      await fetchData();
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/superadmin" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/finance" className="hover:text-blue-600">Finance</Link>
            <span>/</span>
            <span className="text-gray-900">Student Fee Plans</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">📋 Student Fee Plans</h1>
          <p className="text-gray-500">Manage recurring billing plans for students</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ➕ Create Fee Plan
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Plans</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="text-4xl opacity-80">📋</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Active Plans</p>
              <p className="text-3xl font-bold mt-1">{stats.active}</p>
            </div>
            <div className="text-4xl opacity-80">✅</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Suspended</p>
              <p className="text-3xl font-bold mt-1">{stats.suspended}</p>
            </div>
            <div className="text-4xl opacity-80">⏸️</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Est. Monthly Revenue</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(stats.monthlyRevenue)}</p>
            </div>
            <div className="text-4xl opacity-80">💰</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            value={filterCenter}
            onChange={(e) => setFilterCenter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Centers</option>
            {centers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Plans Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Billing</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No fee plans found
                    </td>
                  </tr>
                ) : (
                  filteredPlans.map(plan => (
                    <tr key={plan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium">{plan.studentName}</div>
                        <div className="text-sm text-gray-500">{plan.centerName}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{plan.courseName}</td>
                      <td className="px-6 py-4">
                        <span className="text-sm">{getPlanTypeLabel(plan.planType)}</span>
                        <div className="text-xs text-gray-500">Billing day: {plan.billingDay}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-green-600">{formatCurrency(plan.finalAmount)}</div>
                        {plan.discountAmount > 0 && (
                          <div className="text-xs text-gray-500 line-through">{formatCurrency(plan.baseAmount)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">{plan.nextBillingDate}</div>
                        <div className="text-xs text-gray-500">
                          {plan.autoInvoice ? "🔄 Auto-invoice" : "📝 Manual"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(plan.status)}`}>
                          {plan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openDetailModal(plan)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Plan Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-bold">Create Student Fee Plan</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                <select
                  value={form.studentId}
                  onChange={(e) => setForm(prev => ({ ...prev, studentId: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Student</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.fullname || s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
                <select
                  value={form.courseId}
                  onChange={(e) => {
                    const course = courses.find(c => c.id === e.target.value);
                    setForm(prev => ({ ...prev, courseId: e.target.value, baseAmount: course?.fee || 0 }));
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Course</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Type *</label>
                  <select
                    value={form.planType}
                    onChange={(e) => setForm(prev => ({ ...prev, planType: e.target.value as StudentFeePlan["planType"] }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly (3 months)</option>
                    <option value="SEMESTER">Semester (6 months)</option>
                    <option value="ANNUAL">Annual (12 months)</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Amount (VND)</label>
                  <input
                    type="number"
                    value={form.baseAmount || ""}
                    onChange={(e) => setForm(prev => ({ ...prev, baseAmount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing Day</label>
                  <select
                    value={form.billingDay}
                    onChange={(e) => setForm(prev => ({ ...prev, billingDay: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {[...Array(28)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.autoRenew}
                    onChange={(e) => setForm(prev => ({ ...prev, autoRenew: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Auto-renew</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.autoInvoice}
                    onChange={(e) => setForm(prev => ({ ...prev, autoInvoice: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Auto-generate invoice</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button
                  onClick={handleCreatePlan}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Plan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Detail Modal */}
      {showDetailModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-xl font-bold">Fee Plan Details</h2>
                <p className="text-sm text-gray-500">{selectedPlan.studentName}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status & Amount */}
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(selectedPlan.status)}`}>
                  {selectedPlan.status}
                </span>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedPlan.finalAmount)}</p>
                  {selectedPlan.discountAmount > 0 && (
                    <p className="text-sm text-gray-500 line-through">{formatCurrency(selectedPlan.baseAmount)}</p>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Course</p>
                  <p className="font-medium">{selectedPlan.courseName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Center</p>
                  <p className="font-medium">{selectedPlan.centerName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Plan Type</p>
                  <p className="font-medium">{getPlanTypeLabel(selectedPlan.planType)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Billing Day</p>
                  <p className="font-medium">{selectedPlan.billingDay}</p>
                </div>
                <div>
                  <p className="text-gray-500">Start Date</p>
                  <p className="font-medium">{selectedPlan.startDate}</p>
                </div>
                <div>
                  <p className="text-gray-500">Next Billing</p>
                  <p className="font-medium">{selectedPlan.nextBillingDate}</p>
                </div>
              </div>

              {/* Discounts */}
              {selectedPlan.discounts.length > 0 && (
                <div>
                  <p className="text-gray-500 text-sm mb-2">Applied Discounts</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlan.discounts.map((d, i) => (
                      <span key={i} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                        🏷️ {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Settings */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span>{selectedPlan.autoRenew ? "✅" : "❌"}</span>
                  <span>Auto-renew</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>{selectedPlan.autoInvoice ? "✅" : "❌"}</span>
                  <span>Auto-generate invoice</span>
                </div>
                {selectedPlan.paymentMethod && (
                  <div className="flex items-center gap-2">
                    <span>💳</span>
                    <span>Payment: {selectedPlan.paymentMethod}</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedPlan.notes && (
                <div>
                  <p className="text-gray-500 text-sm mb-1">Notes</p>
                  <p className="bg-yellow-50 rounded-lg p-3 text-sm">{selectedPlan.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button onClick={() => setShowDetailModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Close</button>
                
                {selectedPlan.status === "ACTIVE" && (
                  <>
                    <button
                      onClick={() => handleGenerateInvoice(selectedPlan.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      🧾 Generate Invoice
                    </button>
                    <button
                      onClick={() => handleSuspend(selectedPlan.id)}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                    >
                      ⏸️ Suspend
                    </button>
                  </>
                )}

                {selectedPlan.status === "SUSPENDED" && (
                  <button
                    onClick={() => handleActivate(selectedPlan.id)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    ▶️ Reactivate
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
