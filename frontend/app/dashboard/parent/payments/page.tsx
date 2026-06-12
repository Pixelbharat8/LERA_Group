"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "../../../../lib/api";
import { loadMyChildren } from "../../../../lib/parent-context";

interface Child {
  id: string;
  fullname: string;
  studentCode: string;
}

interface Payment {
  id: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  description: string;
}

export default function ParentPaymentsPage() {
  const searchParams = useSearchParams();
  const studentIdParam = searchParams?.get("studentId");

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState(studentIdParam || "");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChildId) fetchPayments(selectedChildId);
  }, [selectedChildId]);

  const fetchChildren = async () => {
    try {
      const rows = await loadMyChildren();
      const mappedChildren = rows.map((s) => ({
        id: s.id,
        fullname: s.fullname || "Unknown",
        studentCode: s.studentCode || "",
      }));
      setChildren(mappedChildren);
      if (!selectedChildId && mappedChildren.length > 0) {
        setSelectedChildId(mappedChildren[0].id);
      }
    } catch (err) {
      console.error(err);
      setChildren([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async (studentId: string) => {
    try {
      setLoading(true);
      const data = await apiFetch(`/api/payments?studentId=${studentId}`).catch(() => []);
      const paymentsArray = Array.isArray(data) ? data : [];
      if (paymentsArray.length > 0) {
        setPayments(paymentsArray.map((p: any) => ({
          id: p.id,
          invoiceNumber: p.invoiceNumber || p.invoice_number || `INV-${p.id?.substring(0,8) || '0000'}`,
          amount: Number(p.amount) || 0,
          dueDate: p.dueDate || p.due_date || new Date().toISOString(),
          paidDate: p.paidDate || p.paid_date,
          status: p.status || "PENDING",
          description: p.description || p.notes || "Payment"
        })));
      } else {
        setPayments([]);
      }
    } catch (err) {
      console.error(err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PAID: "bg-green-100 text-green-800",
      PENDING: "bg-yellow-100 text-yellow-800",
      OVERDUE: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const totalPending = payments.filter((p) => p.status === "PENDING" || p.status === "OVERDUE").reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = payments.filter((p) => p.status === "PAID").reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/parent" className="hover:text-blue-600">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-900">Payments</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">💰 Payment History</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Child</label>
        <select value={selectedChildId} onChange={(e) => setSelectedChildId(e.target.value)} className="w-full md:w-1/2 px-4 py-2 border rounded-lg">
          <option value="">Choose a child...</option>
          {children.map((child) => (<option key={child.id} value={child.id}>{child.fullname} ({child.studentCode})</option>))}
        </select>
      </div>

      {selectedChildId && payments.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500 mb-1">Total Pending</div>
              <div className="text-2xl font-bold text-yellow-600">₫{totalPending.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500 mb-1">Total Paid</div>
              <div className="text-2xl font-bold text-green-600">₫{totalPaid.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500 mb-1">Total Payments</div>
              <div className="text-2xl font-bold text-gray-900">{payments.length}</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{payment.invoiceNumber}</td>
                    <td className="px-6 py-4 text-sm">{payment.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">₫{payment.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(payment.dueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(payment.status)}`}>{payment.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {payment.status !== "PAID" && (
                        <button className="text-blue-600 hover:text-blue-700 font-medium">Pay Now</button>
                      )}
                      {payment.status === "PAID" && payment.paidDate && (
                        <span className="text-gray-500 text-xs">Paid {new Date(payment.paidDate).toLocaleDateString()}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selectedChildId && payments.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">💳</div>
          <h3 className="text-xl font-semibold mb-2">No Payment Records</h3>
          <p className="text-gray-500">No payment data found for this child.</p>
        </div>
      )}
    </div>
  );
}
