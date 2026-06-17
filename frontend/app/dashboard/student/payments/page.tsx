"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { resolveMyStudentId } from "../../../../lib/student-context";
import { exportToCsv, datedFilename } from "../../../../lib/export-csv";

interface Payment {
  id: string;
  invoiceNumber: string;
  description: string;
  amount: number;
  currency: string;
  dueDate: string;
  paidDate?: string;
  status: "PENDING" | "PAID" | "OVERDUE" | "FAILED" | "REFUNDED";
  paymentMethod?: string;
  transactionId?: string;
}

export default function StudentPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "PAID" | "OVERDUE">("ALL");

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const studentId = await resolveMyStudentId();
      if (!studentId) {
        setPayments([]);
        return;
      }

      const invoicesData = await apiFetch(`/api/invoices?studentId=${studentId}`).catch(() => []);
      const invoicesArray = Array.isArray(invoicesData) ? invoicesData : [];
      
      // Fetch payments for these invoices
      let allPayments: any[] = [];
      for (const invoice of invoicesArray) {
        const paymentsForInvoice = await apiFetch(`/api/payments/invoice/${invoice.id}`).catch(() => []);
        if (Array.isArray(paymentsForInvoice)) {
          allPayments = [...allPayments, ...paymentsForInvoice.map((p: any) => ({ ...p, invoice }))];
        }
      }
      
      if (invoicesArray.length > 0) {
        // Show invoices as payment items
        setPayments(invoicesArray.map((inv: any) => {
          const payment = allPayments.find((p: any) => p.invoiceId === inv.id);
          const isOverdue = new Date(inv.dueDate) < new Date() && inv.status !== 'PAID';
          return {
            id: inv.id,
            invoiceNumber: inv.invoiceNumber || `INV-${inv.id?.substring(0, 8) || '0000'}`,
            description: inv.description || inv.notes || "Invoice Payment",
            amount: Number(inv.totalAmount || inv.amount) || 0,
            currency: inv.currency || "VND",
            dueDate: inv.dueDate || new Date().toISOString(),
            paidDate: payment?.paidAt || inv.paidAt,
            status: isOverdue ? 'OVERDUE' : (inv.status || "PENDING"),
            paymentMethod: payment?.paymentMethod,
            transactionId: payment?.transactionId
          };
        }));
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
      PENDING: "bg-yellow-100 text-yellow-800",
      PAID: "bg-green-100 text-green-800",
      OVERDUE: "bg-red-100 text-red-800",
      FAILED: "bg-gray-100 text-gray-800",
      REFUNDED: "bg-purple-100 text-purple-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatCurrency = (amount: number, currency: string = "VND") => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const downloadReceipt = (payment: Payment) => {
    exportToCsv(
      datedFilename(`receipt_${payment.invoiceNumber}`),
      [payment],
      [
        { key: "invoiceNumber", label: "Invoice" },
        { key: "description", label: "Description" },
        { key: (p) => formatCurrency(p.amount, p.currency), label: "Amount" },
        { key: (p) => new Date(p.dueDate).toLocaleDateString(), label: "Due Date" },
        { key: (p) => (p.paidDate ? new Date(p.paidDate).toLocaleDateString() : ""), label: "Paid Date" },
        { key: "status", label: "Status" },
        { key: "paymentMethod", label: "Payment Method" },
        { key: "transactionId", label: "Transaction ID" },
      ]
    );
  };

  const filteredPayments = filter === "ALL" ? payments : payments.filter((p) => p.status === filter);

  const totalPending = payments
    .filter(p => p.status === "PENDING" || p.status === "OVERDUE")
    .reduce((sum, p) => sum + p.amount, 0);
  
  const totalPaid = payments
    .filter(p => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/student" className="hover:text-blue-600">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-900">My Payments</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">💰 My Payments</h1>
        <p className="text-gray-500 mt-1">View your payment history and invoices</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Total Payments</div>
          <div className="text-2xl font-bold text-gray-900">{payments.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Outstanding Balance</div>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(totalPending)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Total Paid</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Overdue</div>
          <div className="text-2xl font-bold text-orange-600">
            {payments.filter(p => p.status === "OVERDUE").length}
          </div>
        </div>
      </div>

      {/* Alert for Outstanding Balance */}
      {totalPending > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <p className="font-semibold text-yellow-800">You have outstanding payments</p>
              <p className="text-sm text-yellow-700">
                Please pay {formatCurrency(totalPending)} to avoid late fees or course interruption.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow p-2">
        <div className="flex gap-2">
          {(["ALL", "PENDING", "PAID", "OVERDUE"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {status} {status !== "ALL" && `(${payments.filter(p => p.status === status).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
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
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="text-4xl mb-2">💸</div>
                    {filter === "ALL" ? "No payments found" : `No ${filter.toLowerCase()} payments`}
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-blue-600">{payment.invoiceNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{payment.description}</div>
                      {payment.paymentMethod && (
                        <div className="text-xs text-gray-500">
                          {payment.paymentMethod} • {payment.transactionId}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold">{formatCurrency(payment.amount, payment.currency)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div>{new Date(payment.dueDate).toLocaleDateString()}</div>
                      {payment.paidDate && (
                        <div className="text-xs text-green-600">
                          Paid: {new Date(payment.paidDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(payment.status === "PENDING" || payment.status === "OVERDUE") && (
                        <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                          Pay Now
                        </button>
                      )}
                      {payment.status === "PAID" && (
                        <button
                          onClick={() => downloadReceipt(payment)}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
                        >
                          Download Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Methods Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4">💳 Accepted Payment Methods</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-2xl">🏦</span>
            <span className="text-sm font-medium">Bank Transfer</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-2xl">💳</span>
            <span className="text-sm font-medium">Credit Card</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-2xl">📱</span>
            <span className="text-sm font-medium">MoMo</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-2xl">💵</span>
            <span className="text-sm font-medium">ZaloPay</span>
          </div>
        </div>
      </div>
    </div>
  );
}
