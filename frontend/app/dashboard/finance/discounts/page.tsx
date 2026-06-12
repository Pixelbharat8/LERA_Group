"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { buildCenterFilterUrl } from "../../../../lib/center-filter";
import { useUserCenter } from "../../../hooks/useUserCenter";

interface Discount {
  id: string;
  name: string;
  code?: string;
  type: "PERCENTAGE" | "FIXED" | "SIBLING" | "EARLY_BIRD" | "SCHOLARSHIP" | "STAFF" | "LOYALTY";
  value: number;
  maxAmount?: number;
  minPurchase?: number;
  applicableTo: "ALL" | "TUITION" | "MATERIALS" | "REGISTRATION" | "SPECIFIC_COURSE";
  courseIds?: string[];
  startDate?: string;
  endDate?: string;
  usageLimit?: number;
  usageCount: number;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
  autoApply: boolean;
  stackable: boolean;
  description?: string;
  createdAt: string;
}

interface StudentDiscount {
  id: string;
  studentId: string;
  studentName: string;
  discountId: string;
  discountName: string;
  discountType: string;
  discountValue: number;
  startDate: string;
  endDate?: string;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  appliedBy: string;
  reason?: string;
}

interface Student {
  id: string;
  fullname?: string;
  name?: string;
}

export default function DiscountsPage() {
  const { centerId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [activeTab, setActiveTab] = useState<"discounts" | "student-discounts" | "promotions">("discounts");
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [studentDiscounts, setStudentDiscounts] = useState<StudentDiscount[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);

  const [form, setForm] = useState({
    name: "",
    code: "",
    type: "PERCENTAGE" as Discount["type"],
    value: 0,
    maxAmount: 0,
    minPurchase: 0,
    applicableTo: "ALL" as Discount["applicableTo"],
    startDate: "",
    endDate: "",
    usageLimit: 0,
    autoApply: false,
    stackable: false,
    description: ""
  });

  const [assignForm, setAssignForm] = useState({
    studentId: "",
    discountId: "",
    startDate: "",
    endDate: "",
    reason: ""
  });

  useEffect(() => {
    if (!userLoading) fetchData();
  }, [userLoading, centerId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const center = shouldFilterByCenter ? centerId : null;
      const studentsData = await apiFetch(buildCenterFilterUrl("/api/students", center)).catch(() => []);
      const studentsList = Array.isArray(studentsData) ? studentsData : [];
      setStudents(studentsList);

      const [discountsData, studentDiscountsData] = await Promise.all([
        apiFetch("/api/discounts?isActive=true").catch(() => apiFetch("/api/discounts").catch(() => [])),
        center && studentsList.length > 0
          ? Promise.all(
              studentsList.map((s: Student) =>
                apiFetch(`/api/student-discounts?studentId=${encodeURIComponent(s.id)}`).catch(() => [])
              )
            ).then((batches) => batches.flatMap((b) => (Array.isArray(b) ? b : [])))
          : apiFetch("/api/student-discounts").catch(() => []),
      ]);

      if (Array.isArray(studentDiscountsData)) {
        setStudentDiscounts(studentDiscountsData.map((sd: any) => ({
          id: sd.id,
          studentId: sd.studentId,
          studentName: sd.studentName || 'Unknown',
          discountId: sd.discount?.id,
          discountName: sd.discount?.name || 'Unknown',
          discountType: sd.discount?.type || 'PERCENTAGE',
          discountValue: sd.discount?.value || 0,
          startDate: sd.startDate || sd.createdAt,
          endDate: sd.endDate,
          status: sd.isActive ? 'ACTIVE' : 'EXPIRED',
          appliedBy: sd.appliedBy || 'System',
          reason: sd.reason
        })));
      }

      setDiscounts(Array.isArray(discountsData) ? discountsData : []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setDiscounts([]);
      setStudentDiscounts([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      PERCENTAGE: "bg-blue-100 text-blue-800",
      FIXED: "bg-green-100 text-green-800",
      SIBLING: "bg-purple-100 text-purple-800",
      EARLY_BIRD: "bg-yellow-100 text-yellow-800",
      SCHOLARSHIP: "bg-pink-100 text-pink-800",
      STAFF: "bg-indigo-100 text-indigo-800",
      LOYALTY: "bg-orange-100 text-orange-800"
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-800",
      INACTIVE: "bg-gray-100 text-gray-500",
      EXPIRED: "bg-red-100 text-red-800",
      REVOKED: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      PERCENTAGE: "🏷️",
      FIXED: "💵",
      SIBLING: "👨‍👩‍👧‍👦",
      EARLY_BIRD: "🐦",
      SCHOLARSHIP: "🎓",
      STAFF: "👔",
      LOYALTY: "⭐"
    };
    return icons[type] || "🏷️";
  };

  const stats = {
    totalDiscounts: discounts.length,
    activeDiscounts: discounts.filter(d => d.status === "ACTIVE").length,
    studentsWithDiscount: studentDiscounts.filter(sd => sd.status === "ACTIVE").length,
    totalUsage: discounts.reduce((sum, d) => sum + d.usageCount, 0)
  };

  const openEditModal = (discount: Discount) => {
    setEditingDiscount(discount);
    setForm({
      name: discount.name,
      code: discount.code || "",
      type: discount.type,
      value: discount.value,
      maxAmount: discount.maxAmount || 0,
      minPurchase: discount.minPurchase || 0,
      applicableTo: discount.applicableTo,
      startDate: discount.startDate || "",
      endDate: discount.endDate || "",
      usageLimit: discount.usageLimit || 0,
      autoApply: discount.autoApply,
      stackable: discount.stackable,
      description: discount.description || ""
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingDiscount(null);
    setForm({
      name: "",
      code: "",
      type: "PERCENTAGE",
      value: 0,
      maxAmount: 0,
      minPurchase: 0,
      applicableTo: "ALL",
      startDate: "",
      endDate: "",
      usageLimit: 0,
      autoApply: false,
      stackable: false,
      description: ""
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const url = editingDiscount ? `/api/discounts/${editingDiscount.id}` : "/api/discounts";
      const method = editingDiscount ? "PUT" : "POST";

      await apiFetch(url, {
        method,
        body: JSON.stringify(form)
      });

      await fetchData();
      setShowModal(false);
    } catch (err) {
      console.error("Error saving discount:", err);
    }
  };

  const handleAssign = async () => {
    try {
      await apiFetch("/api/student-discounts", {
        method: "POST",
        body: JSON.stringify(assignForm)
      });

      await fetchData();
      setShowAssignModal(false);
      setAssignForm({ studentId: "", discountId: "", startDate: "", endDate: "", reason: "" });
    } catch (err) {
      console.error("Error assigning discount:", err);
    }
  };

  const toggleStatus = async (discountId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await apiFetch(`/api/discounts/${discountId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus })
      });
      await fetchData();
    } catch (err) {
      console.error("Error toggling status:", err);
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
            <span className="text-gray-900">Discounts</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">🏷️ Discount Management</h1>
          <p className="text-gray-500">Create and manage discounts, scholarships, and promotions</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAssignModal(true)}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            📋 Assign to Student
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ➕ Create Discount
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Discounts</p>
              <p className="text-3xl font-bold mt-1">{stats.totalDiscounts}</p>
            </div>
            <div className="text-4xl opacity-80">🏷️</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Active</p>
              <p className="text-3xl font-bold mt-1">{stats.activeDiscounts}</p>
            </div>
            <div className="text-4xl opacity-80">✅</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Students with Discount</p>
              <p className="text-3xl font-bold mt-1">{stats.studentsWithDiscount}</p>
            </div>
            <div className="text-4xl opacity-80">👨‍🎓</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Total Usage</p>
              <p className="text-3xl font-bold mt-1">{stats.totalUsage}</p>
            </div>
            <div className="text-4xl opacity-80">📊</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          {[
            { id: "discounts", label: "All Discounts", icon: "🏷️" },
            { id: "student-discounts", label: "Student Discounts", icon: "👨‍🎓" },
            { id: "promotions", label: "Promotions", icon: "🎉" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-3 font-medium transition-colors relative ${
                activeTab === tab.id
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon} {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : activeTab === "discounts" ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applies To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Validity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {discounts.map(discount => (
                  <tr key={discount.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getTypeIcon(discount.type)}</span>
                        <div>
                          <div className="font-medium">{discount.name}</div>
                          {discount.code && (
                            <code className="text-xs bg-gray-100 px-1 rounded">{discount.code}</code>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(discount.type)}`}>
                        {discount.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {discount.type === "FIXED" ? formatCurrency(discount.value) : `${discount.value}%`}
                      {discount.maxAmount ? (
                        <div className="text-xs text-gray-500">Max: {formatCurrency(discount.maxAmount)}</div>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{discount.applicableTo}</td>
                    <td className="px-6 py-4">
                      <span className="font-medium">{discount.usageCount}</span>
                      {discount.usageLimit && (
                        <span className="text-gray-500">/{discount.usageLimit}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {discount.startDate && discount.endDate ? (
                        <div>
                          <div>{discount.startDate}</div>
                          <div>to {discount.endDate}</div>
                        </div>
                      ) : discount.startDate ? (
                        <div>From {discount.startDate}</div>
                      ) : (
                        "No expiry"
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(discount.status)}`}>
                        {discount.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(discount)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleStatus(discount.id, discount.status)}
                          className={discount.status === "ACTIVE" ? "text-red-600 hover:text-red-800" : "text-green-600 hover:text-green-800"}
                        >
                          {discount.status === "ACTIVE" ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === "student-discounts" ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {studentDiscounts.map(sd => (
                  <tr key={sd.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{sd.studentName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(sd.discountType)}`}>
                        {sd.discountName}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{sd.discountValue}%</td>
                    <td className="px-6 py-4 text-gray-600">{sd.startDate}</td>
                    <td className="px-6 py-4 text-gray-600">{sd.endDate || "No end date"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(sd.status)}`}>
                        {sd.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{sd.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {discounts.filter(d => d.code && d.startDate && d.endDate).map(promo => (
                <div key={promo.id} className="border rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-3xl">{getTypeIcon(promo.type)}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(promo.status)}`}>
                      {promo.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{promo.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{promo.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <code className="text-lg font-bold bg-yellow-100 text-yellow-800 px-3 py-1 rounded">
                      {promo.code}
                    </code>
                    <span className="text-2xl font-bold text-green-600">
                      {promo.type === "FIXED" ? formatCurrency(promo.value) : `${promo.value}%`}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 space-y-1">
                    <div>📅 {promo.startDate} - {promo.endDate}</div>
                    <div>📊 Used: {promo.usageCount}/{promo.usageLimit || "∞"}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-bold">{editingDiscount ? "Edit Discount" : "Create Discount"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., Early Bird Discount"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as Discount["type"] }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED">Fixed Amount</option>
                    <option value="SIBLING">Sibling</option>
                    <option value="EARLY_BIRD">Early Bird</option>
                    <option value="SCHOLARSHIP">Scholarship</option>
                    <option value="STAFF">Staff</option>
                    <option value="LOYALTY">Loyalty</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value * {form.type === "FIXED" ? "(VND)" : "(%)"}
                  </label>
                  <input
                    type="number"
                    value={form.value}
                    onChange={(e) => setForm(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Promo Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., NEWYEAR2025"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Applies To</label>
                  <select
                    value={form.applicableTo}
                    onChange={(e) => setForm(prev => ({ ...prev, applicableTo: e.target.value as Discount["applicableTo"] }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="ALL">All Fees</option>
                    <option value="TUITION">Tuition Only</option>
                    <option value="MATERIALS">Materials Only</option>
                    <option value="REGISTRATION">Registration Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (VND)</label>
                  <input
                    type="number"
                    value={form.maxAmount}
                    onChange={(e) => setForm(prev => ({ ...prev, maxAmount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="0 = no limit"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                <input
                  type="number"
                  value={form.usageLimit}
                  onChange={(e) => setForm(prev => ({ ...prev, usageLimit: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="0 = unlimited"
                />
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.autoApply}
                    onChange={(e) => setForm(prev => ({ ...prev, autoApply: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Auto-apply when eligible</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.stackable}
                    onChange={(e) => setForm(prev => ({ ...prev, stackable: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Stackable with other discounts</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingDiscount ? "Save Changes" : "Create Discount"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Discount Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-bold">Assign Discount to Student</h2>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                <select
                  value={assignForm.studentId}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, studentId: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Student</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.fullname || s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount *</label>
                <select
                  value={assignForm.discountId}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, discountId: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Discount</option>
                  {discounts.filter(d => d.status === "ACTIVE").map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.value}%)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={assignForm.startDate}
                    onChange={(e) => setAssignForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={assignForm.endDate}
                    onChange={(e) => setAssignForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={assignForm.reason}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                  placeholder="Reason for assigning this discount..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button
                  onClick={handleAssign}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Assign Discount
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
