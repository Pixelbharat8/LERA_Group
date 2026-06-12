"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { buildCenterFilterUrl } from "../../../../lib/center-filter";
import { useUserCenter } from "../../../hooks/useUserCenter";

// Backend entity alignment: payment_service Refund
type RefundStatus = "PENDING" | "APPROVED" | "REJECTED" | "PROCESSING" | "COMPLETED" | "PROCESSED";

type Refund = {
  id: string;
  paymentId?: string;
  amount: number;
  currency?: string;
  reason?: string;
  status?: RefundStatus;
  processedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  metadata?: string;
};

type Payment = {
  id: string;
  studentId?: string;
  centerId?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  transactionId?: string;
  status?: string;
  createdAt?: string;
};

type Student = {
  id: string;
  fullname?: string;
  name?: string;
  email?: string;
};

type Center = {
  id: string;
  name: string;
};

export default function RefundsPage() {
  const { centerId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [payments, setPayments] = useState<Record<string, Payment>>({});
  const [students, setStudents] = useState<Record<string, Student>>({});
  const [centers, setCenters] = useState<Record<string, Center>>({});

  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [processing, setProcessing] = useState(false);

  const [form, setForm] = useState({
    paymentId: "",
    amount: "",
    reason: ""
  });

  useEffect(() => {
    if (!userLoading) fetchData();
  }, [userLoading, centerId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const center = shouldFilterByCenter ? centerId : null;
      const [refundsData, paymentsData, studentsData, centersData] = await Promise.all([
        apiFetch("/api/refunds").catch(() => []),
        apiFetch(buildCenterFilterUrl("/api/payments", center)).catch(() => []),
        apiFetch(buildCenterFilterUrl("/api/students", center)).catch(() => []),
        apiFetch("/api/centers").catch(() => [])
      ]);

      const paymentMap: Record<string, Payment> = {};
      (Array.isArray(paymentsData) ? paymentsData : []).forEach((p: any) => {
        if (p?.id) paymentMap[p.id] = p;
      });
      setPayments(paymentMap);

      const studentMap: Record<string, Student> = {};
      (Array.isArray(studentsData) ? studentsData : []).forEach((s: any) => {
        if (s?.id) studentMap[s.id] = s;
      });
      setStudents(studentMap);

      const centerMap: Record<string, Center> = {};
      (Array.isArray(centersData) ? centersData : []).forEach((c: any) => {
        if (c?.id) centerMap[c.id] = c;
      });
      setCenters(centerMap);

      setRefunds(Array.isArray(refundsData) ? refundsData : []);
    } catch {
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-blue-100 text-blue-800";
      case "PROCESSING":
        return "bg-purple-100 text-purple-800";
      case "COMPLETED":
      case "PROCESSED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "PENDING":
        return "⏳";
      case "APPROVED":
        return "✅";
      case "PROCESSING":
        return "⚙️";
      case "COMPLETED":
      case "PROCESSED":
        return "✔️";
      case "REJECTED":
        return "❌";
      default:
        return "📄";
    }
  };

  const filteredRefunds = useMemo(() => {
    if (filterStatus === "all") return refunds;
    return refunds.filter(r => (r.status || "PENDING") === filterStatus);
  }, [refunds, filterStatus]);

  const stats = useMemo(() => {
    const total = refunds.length;
    const pending = refunds.filter(r => (r.status || "PENDING") === "PENDING").length;
    const approved = refunds.filter(r => r.status === "APPROVED").length;
    const processingCount = refunds.filter(r => r.status === "PROCESSING").length;
    const completed = refunds.filter(r => r.status === "COMPLETED" || r.status === "PROCESSED").length;

    const totalAmount = refunds.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const pendingAmount = refunds
      .filter(r => ["PENDING", "APPROVED", "PROCESSING"].includes(r.status || "PENDING"))
      .reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const completedAmount = refunds
      .filter(r => ["COMPLETED", "PROCESSED"].includes(r.status || ""))
      .reduce((sum, r) => sum + Number(r.amount || 0), 0);

    return { total, pending, approved, processing: processingCount, completed, totalAmount, pendingAmount, completedAmount };
  }, [refunds]);

  const openDetailModal = (refund: Refund) => {
    setSelectedRefund(refund);
    setShowDetailModal(true);
  };

  const handleSubmitRequest = async () => {
    const amountNum = Number(form.amount);
    if (!form.paymentId || !Number.isFinite(amountNum) || amountNum <= 0 || !form.reason.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    setProcessing(true);
    try {
      await apiFetch("/api/refunds", {
        method: "POST",
        body: JSON.stringify({
          paymentId: form.paymentId,
          amount: amountNum,
          currency: "VND",
          reason: form.reason.trim(),
          status: "PENDING"
        })
      });

      await fetchData();
      setShowModal(false);
      setForm({ paymentId: "", amount: "", reason: "" });
    } catch {
      alert("Error submitting refund request");
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = async (refundId: string) => {
    await apiFetch(`/api/refunds/${refundId}/approve`, { method: "POST" });
    await fetchData();
    setShowDetailModal(false);
  };

  const handleReject = async (refundId: string) => {
    const reason = prompt("Please enter rejection reason:");
    if (!reason) return;

    await apiFetch(`/api/refunds/${refundId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason })
    });
    await fetchData();
    setShowDetailModal(false);
  };

  const handleProcess = async (refundId: string) => {
    await apiFetch(`/api/refunds/${refundId}/process`, { method: "POST" });
    await fetchData();
    setShowDetailModal(false);
  };

  const handleComplete = async (refundId: string) => {
    await apiFetch(`/api/refunds/${refundId}/complete`, { method: "POST" });
    await fetchData();
    setShowDetailModal(false);
  };

  const getStudentName = (paymentId?: string) => {
    const payment = paymentId ? payments[paymentId] : undefined;
    const s = payment?.studentId ? students[payment.studentId] : undefined;
    return s?.fullname || s?.name || s?.email || "N/A";
  };

  const getCenterName = (paymentId?: string) => {
    const payment = paymentId ? payments[paymentId] : undefined;
    const c = payment?.centerId ? centers[payment.centerId] : undefined;
    return c?.name || "N/A";
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
            <span className="text-gray-900">Refunds</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">💸 Refund Management</h1>
          <p className="text-gray-500">Approve, process, and track refund requests</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ➕ New Refund Request
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Pending Approval</p>
              <p className="text-3xl font-bold mt-1">{stats.pending}</p>
              <p className="text-xs text-yellow-200 mt-1">{formatCurrency(stats.pendingAmount)}</p>
            </div>
            <div className="text-4xl opacity-80">⏳</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Approved</p>
              <p className="text-3xl font-bold mt-1">{stats.approved}</p>
              <p className="text-xs text-blue-200 mt-1">Ready to process</p>
            </div>
            <div className="text-4xl opacity-80">✅</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Processing</p>
              <p className="text-3xl font-bold mt-1">{stats.processing}</p>
              <p className="text-xs text-purple-200 mt-1">In progress</p>
            </div>
            <div className="text-4xl opacity-80">⚙️</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Completed</p>
              <p className="text-3xl font-bold mt-1">{stats.completed}</p>
              <p className="text-xs text-green-200 mt-1">{formatCurrency(stats.completedAmount)}</p>
            </div>
            <div className="text-4xl opacity-80">✔️</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: "all", label: "All", count: stats.total },
          { value: "PENDING", label: "Pending", count: stats.pending },
          { value: "APPROVED", label: "Approved", count: stats.approved },
          { value: "PROCESSING", label: "Processing", count: stats.processing },
          { value: "COMPLETED", label: "Completed", count: stats.completed },
          { value: "REJECTED", label: "Rejected", count: refunds.filter(r => r.status === "REJECTED").length }
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterStatus === tab.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Refunds Table */}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Refund</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Center</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRefunds.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No refunds found
                    </td>
                  </tr>
                ) : (
                  filteredRefunds.map(refund => (
                    <tr key={refund.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-blue-600">{refund.id.slice(0, 8).toUpperCase()}</div>
                        {refund.reason && <div className="text-xs text-gray-500 truncate max-w-[240px]">{refund.reason}</div>}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-sm">
                        {refund.paymentId ? refund.paymentId.slice(0, 8).toUpperCase() : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{getStudentName(refund.paymentId)}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{getCenterName(refund.paymentId)}</td>
                      <td className="px-6 py-4 font-bold text-red-600">{formatCurrency(Number(refund.amount || 0))}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {refund.createdAt ? new Date(refund.createdAt).toLocaleString() : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full inline-flex items-center gap-1 ${getStatusColor(refund.status)}`}
                        >
                          {getStatusIcon(refund.status)} {refund.status || "PENDING"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => openDetailModal(refund)} className="text-blue-600 hover:text-blue-800">View</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Refund Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-bold">New Refund Request</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment *</label>
                <select
                  value={form.paymentId}
                  onChange={(e) => setForm(prev => ({ ...prev, paymentId: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Payment</option>
                  {Object.values(payments).slice(0, 500).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.id.slice(0, 8).toUpperCase()} - {formatCurrency(Number(p.amount || 0))}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Tip: Use "Payments" page to search the exact payment, then come here to approve/process.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount (VND) *</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Amount in VND"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Reason for refund request..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button onClick={() => { setShowModal(false); setForm({ paymentId: "", amount: "", reason: "" }); }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button
                  onClick={handleSubmitRequest}
                  disabled={processing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {processing ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Detail Modal */}
      {showDetailModal && selectedRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-xl font-bold">{selectedRefund.id.slice(0, 8).toUpperCase()}</h2>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedRefund.status)}`}>
                  {getStatusIcon(selectedRefund.status)} {selectedRefund.status || "PENDING"}
                </span>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-red-50 rounded-xl p-6 text-center">
                <p className="text-gray-600">Refund Amount</p>
                <p className="text-4xl font-bold text-red-600">{formatCurrency(Number(selectedRefund.amount || 0))}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Payment</p>
                  <p className="font-medium font-mono">{selectedRefund.paymentId || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Requested At</p>
                  <p className="font-medium">{selectedRefund.createdAt ? new Date(selectedRefund.createdAt).toLocaleString() : "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Student</p>
                  <p className="font-medium">{getStudentName(selectedRefund.paymentId)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Center</p>
                  <p className="font-medium">{getCenterName(selectedRefund.paymentId)}</p>
                </div>
              </div>

              {selectedRefund.reason && (
                <div>
                  <p className="text-gray-500 text-sm mb-1">Reason</p>
                  <p className="bg-gray-50 rounded-lg p-3">{selectedRefund.reason}</p>
                </div>
              )}

              {selectedRefund.metadata && (
                <div>
                  <p className="text-gray-500 text-sm mb-1">Metadata</p>
                  <pre className="bg-gray-50 rounded-lg p-3 text-xs overflow-auto">{selectedRefund.metadata}</pre>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <button onClick={() => setShowDetailModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Close</button>

                {(selectedRefund.status || "PENDING") === "PENDING" && (
                  <>
                    <button onClick={() => handleReject(selectedRefund.id)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">❌ Reject</button>
                    <button onClick={() => handleApprove(selectedRefund.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">✅ Approve</button>
                  </>
                )}

                {selectedRefund.status === "APPROVED" && (
                  <button onClick={() => handleProcess(selectedRefund.id)} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">⚙️ Start Processing</button>
                )}

                {selectedRefund.status === "PROCESSING" && (
                  <button onClick={() => handleComplete(selectedRefund.id)} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">✔️ Mark Complete</button>
                )}
              </div>
              <p className="text-xs text-gray-500">Note: marking complete does not automatically change the related payment status in current backend.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
