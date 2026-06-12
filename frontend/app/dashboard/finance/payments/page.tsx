"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../../../lib/api";
import { useUserCenter, buildCenterFilterUrl } from "../../../hooks/useUserCenter";

interface Payment {
  id: string;
  studentName: string;
  studentEmail: string;
  amount: number;
  method: string;
  status: string;
  invoiceNumber: string;
  paidAt: string;
  description: string;
}

export default function PaymentsPage() {
  const { centerId: userCenterId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (!userLoading) {
      fetchPayments();
    }
  }, [userLoading, userCenterId]);

  const fetchPayments = async () => {
    try {
      const url = buildCenterFilterUrl("/api/payments", shouldFilterByCenter ? userCenterId : null);
      const data = await apiFetch(url);
      setPayments(Array.isArray(data) ? data : data.content || []);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const paidAmount = payments
    .filter((p) => p.status === "PAID" || p.status === "COMPLETED")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

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
          <h1 className="text-2xl font-bold text-gray-800">💳 Payments</h1>
          <p className="text-gray-500">Manage student payments and transactions</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          ➕ Record Payment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-3xl font-bold text-blue-600">{payments.length}</div>
          <div className="text-gray-500 text-sm">Total Transactions</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-3xl font-bold text-green-600">
            {totalAmount.toLocaleString()} VND
          </div>
          <div className="text-gray-500 text-sm">Total Amount</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-3xl font-bold text-purple-600">
            {paidAmount.toLocaleString()} VND
          </div>
          <div className="text-gray-500 text-sm">Collected</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-3xl font-bold text-yellow-600">
            {payments.filter((p) => p.status === "PENDING").length}
          </div>
          <div className="text-gray-500 text-sm">Pending</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="🔍 Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">All Status</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Invoice</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Student</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Method</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No payments found.
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-blue-600">
                      {payment.invoiceNumber || `INV-${payment.id.slice(0, 8)}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium">{payment.studentName || "N/A"}</span>
                      <p className="text-xs text-gray-500">{payment.studentEmail}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-green-600">
                    {(payment.amount || 0).toLocaleString()} VND
                  </td>
                  <td className="px-4 py-3 text-gray-600">{payment.method || "Cash"}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm">
                    {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        payment.status === "PAID" || payment.status === "COMPLETED"
                          ? "bg-green-100 text-green-700"
                          : payment.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">👁️</button>
                      <button className="p-1 text-green-600 hover:bg-green-50 rounded">🧾</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
