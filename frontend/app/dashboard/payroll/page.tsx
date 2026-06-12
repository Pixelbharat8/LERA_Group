"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { apiFetch } from "../../../lib/api";
import { useUserCenter, buildCenterFilterUrl } from "../../hooks/useUserCenter";

type PayrollRecord = {
  id: string;
  teacherId?: string;
  teacherName?: string;
  centerName?: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  baseSalary?: number;
  teachingHours?: number;
  hourlyRate?: number;
  teachingAmount?: number;
  bonus?: number;
  deductions?: number;
  totalAmount?: number;
  currency?: string;
  status?: string;
  createdAt?: string;
  paidAt?: string;
  notes?: string;
  approvedBy?: string;
};

type PayrollStats = {
  totalPayroll?: number;
  pendingCount?: number;
  approvedCount?: number;
  paidCount?: number;
};

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function PayrollPage() {
  const { centerId: userCenterId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [stats, setStats] = useState<PayrollStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  
  const [generateForm, setGenerateForm] = useState<{
    payPeriodStart: string;
    payPeriodEnd: string;
  }>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return {
      payPeriodStart: toIsoDate(start),
      payPeriodEnd: toIsoDate(end),
    };
  });

  useEffect(() => {
    if (!userLoading) {
      fetchAll();
    }
  }, [userLoading, userCenterId]);

  const fetchAll = async () => {
    await Promise.all([fetchPayroll(), fetchStats()]);
  };

  const fetchPayroll = async () => {
    try {
      const url = shouldFilterByCenter && userCenterId
        ? `/api/payroll?centerId=${encodeURIComponent(userCenterId)}`
        : "/api/payroll";
      const data = await apiFetch(url);
      setPayroll(Array.isArray(data) ? data : []);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load payroll");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await apiFetch("/api/payroll/stats").catch(() => ({}));
      setStats(data || {});
    } catch {
      // ignore
    }
  };

  const openGeneratePayroll = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    setGenerateForm({
      payPeriodStart: toIsoDate(start),
      payPeriodEnd: toIsoDate(end),
    });
    setShowGenerateModal(true);
  };

  const generatePayrollForAll = async () => {
    setGenerating(true);
    try {
      if (!generateForm.payPeriodStart || !generateForm.payPeriodEnd) {
        window.alert("Select pay period start and end dates.");
        return;
      }

      const payload = {
        payPeriodStart: generateForm.payPeriodStart,
        payPeriodEnd: generateForm.payPeriodEnd,
        includeAllTeachers: true,
      };

      const generated = await apiFetch("/api/payroll/generate", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      window.alert(`✅ Successfully generated payroll for ${generated.length || 0} teachers!`);
      setShowGenerateModal(false);
      await fetchAll();
    } catch (e: any) {
      window.alert(e?.message || "Failed to generate payroll");
    } finally {
      setGenerating(false);
    }
  };

  const approvePayroll = async (id: string) => {
    if (!window.confirm("Approve this payroll record?")) return;
    
    try {
      // Get current user ID from cookies
      let approvedBy = "admin";
      const userDataStr = Cookies.get("userData");
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          approvedBy = userData.id || userData.email || "admin";
        } catch (e) { /* use default */ }
      }
      
      await apiFetch(`/api/payroll/${id}/approve`, {
        method: "PUT",
        body: JSON.stringify({ approvedBy }),
      });
      await fetchAll();
    } catch (e: any) {
      window.alert(e?.message || "Failed to approve payroll");
    }
  };

  const markAsPaid = async (id: string) => {
    if (!window.confirm("Mark this payroll as PAID?")) return;
    
    try {
      await apiFetch(`/api/payroll/${id}/pay`, {
        method: "PUT",
      });
      await fetchAll();
    } catch (e: any) {
      window.alert(e?.message || "Failed to mark as paid");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/superadmin" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">Payroll</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">💼 Payroll Management</h1>
          <p className="text-gray-500">Enterprise payroll system with attendance integration</p>
        </div>
        <button
          onClick={openGeneratePayroll}
          disabled={generating}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <span>🚀</span>
          {generating ? "Generating..." : "Generate Payroll for All Teachers"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">👨‍🏫</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{payroll.length}</p>
              <p className="text-sm text-gray-500">Total Records</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">💵</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {typeof stats.totalPayroll === "number" ? `${Number(stats.totalPayroll).toLocaleString()} ₫` : "-"}
              </p>
              <p className="text-sm text-gray-500">Total Payroll</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-2xl">⏳</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingCount ?? "-"}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">✅</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.paidCount ?? "-"}</p>
              <p className="text-sm text-gray-500">Paid</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teaching</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payroll.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                      No payroll records found. Click "Generate Payroll for All Teachers" to create payroll based on attendance data.
                    </td>
                  </tr>
                ) : (
                  payroll.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">
                        <div className="text-gray-900">{p.teacherName || "Unknown Teacher"}</div>
                        {p.centerName && <div className="text-xs text-gray-500">{p.centerName}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {p.payPeriodStart} → {p.payPeriodEnd}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {p.teachingHours ?? "-"}h
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {typeof p.baseSalary === "number" ? `${Number(p.baseSalary).toLocaleString()}` : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {typeof p.teachingAmount === "number" ? `${Number(p.teachingAmount).toLocaleString()}` : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {typeof p.totalAmount === "number" ? `${Number(p.totalAmount).toLocaleString()} ₫` : "-"}
                      </td>
                      <td className="px-6 py-4">
                        {p.status === "PENDING" && (
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">⏳ Pending</span>
                        )}
                        {p.status === "APPROVED" && (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">✓ Approved</span>
                        )}
                        {p.status === "PAID" && (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">✅ Paid</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {p.status === "PENDING" && (
                            <button
                              onClick={() => approvePayroll(p.id)}
                              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Approve
                            </button>
                          )}
                          {p.status === "APPROVED" && (
                            <button
                              onClick={() => markAsPaid(p.id)}
                              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Mark Paid
                            </button>
                          )}
                          {p.status === "PAID" && (
                            <span className="text-xs text-gray-400">Immutable</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Payroll Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">🚀 Generate Payroll for All Teachers</h2>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-gray-500 hover:text-gray-800"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Enterprise Payroll Generation:</strong>
                  <br />
                  • Fetches all teachers from Identity Service
                  <br />
                  • Calculates teaching hours from Attendance Service
                  <br />
                  • Applies hourly rates and generates individual payroll
                  <br />
                  • Creates records with PENDING status for approval
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pay Period Start</label>
                  <input
                    type="date"
                    value={generateForm.payPeriodStart}
                    onChange={(e) => setGenerateForm((p) => ({ ...p, payPeriodStart: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pay Period End</label>
                  <input
                    type="date"
                    value={generateForm.payPeriodEnd}
                    onChange={(e) => setGenerateForm((p) => ({ ...p, payPeriodEnd: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t px-5 py-4">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="flex-1 rounded-lg border px-4 py-2 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={generatePayrollForAll}
                disabled={generating}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {generating ? "Generating..." : "Generate Payroll"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
