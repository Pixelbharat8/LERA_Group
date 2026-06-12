"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../lib/api";
import { useUserCenter, buildCenterFilterUrl } from "../../hooks/useUserCenter";
import Cookies from "js-cookie";

type Student = {
  id: string;
  fullname?: string;
  name?: string;
  email?: string;
  phone?: string;
  centerId?: string;
};

type Center = {
  id: string;
  name: string;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  studentId?: string;
  centerId?: string;
  totalAmount: number;
  status: string;
  dueDate?: string;
};

type Payment = {
  id: string;
  invoiceId?: string;
  studentId?: string;
  enrollmentId?: string;
  centerId?: string;
  paymentMethod: string;
  amount: number;
  currency?: string;
  status?: string;
  transactionId?: string;
  paymentGateway?: string;
  processedBy?: string;
  notes?: string;
  createdAt?: string;
  paidAt?: string;
  // Joined data
  studentName?: string;
  centerName?: string;
  courseName?: string;
  invoiceNumber?: string;
  processedByName?: string;
  effectiveCenterId?: string;
};

type FinancialStats = {
  totalRevenue: number;
  pendingPayments: number;
  completedPayments: number;
  refundedPayments: number;
  refundedAmount: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  averagePayment: number;
};

export default function PaymentsPage() {
  const { centerId: userCenterId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<{ [key: string]: Student }>({});
  const [centers, setCenters] = useState<Center[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [users, setUsers] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "by-center" | "by-student">("all");
  const [selectedCenter, setSelectedCenter] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    pendingPayments: 0,
    completedPayments: 0,
    refundedPayments: 0,
    refundedAmount: 0,
    thisMonthRevenue: 0,
    lastMonthRevenue: 0,
    averagePayment: 0
  });

  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);
  const [refundPayment, setRefundPayment] = useState<Payment | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [creating, setCreating] = useState(false);
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [refundForm, setRefundForm] = useState({ amount: "", reason: "" });
  const [form, setForm] = useState({
    studentId: "",
    centerId: "",
    invoiceId: "",
    amount: "",
    paymentMethod: "CASH",
    paymentGateway: "",
    status: "COMPLETED",
    notes: "",
    courseName: "",
    transactionId: ""
  });

  useEffect(() => {
    if (!userLoading) {
      fetchData();
    }
  }, [userLoading, userCenterId]);

  // Lock filter UI to the user's center (CENTER_MANAGER) to prevent confusing/invalid filtering
  useEffect(() => {
    if (shouldFilterByCenter && userCenterId) {
      setSelectedCenter(userCenterId);
      setCurrentPage(1);
    }
  }, [shouldFilterByCenter, userCenterId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Filter by center for CENTER_MANAGER
      const paymentsUrl = shouldFilterByCenter 
        ? buildCenterFilterUrl("/api/payments", userCenterId)
        : "/api/payments";
      const studentsUrl = shouldFilterByCenter 
        ? buildCenterFilterUrl("/api/students", userCenterId)
        : "/api/students";
      const invoicesUrl = shouldFilterByCenter 
        ? buildCenterFilterUrl("/api/invoices", userCenterId)
        : "/api/invoices";
        
      const [paymentsData, studentsData, centersData, invoicesData, usersData] = await Promise.all([
        apiFetch(paymentsUrl).catch(() => []),
        apiFetch(studentsUrl).catch(() => []),
        apiFetch("/api/centers").catch(() => []),
        apiFetch(invoicesUrl).catch(() => []),
        apiFetch("/api/users").catch(() => [])
      ]);

      // Build users map for processedBy
      let usersMap: { [key: string]: string } = {};
      if (Array.isArray(usersData)) {
        usersData.forEach((u: any) => { usersMap[u.id] = u.fullname || u.name || u.email || "Unknown"; });
      }
      setUsers(usersMap);

      let studentsMap: { [key: string]: Student } = {};
      let studentArr: Student[] = Array.isArray(studentsData) ? studentsData : [];
      studentArr.forEach(s => { studentsMap[s.id] = s; });
      setStudents(studentsMap);
      setStudentList(studentArr);

      let centersArr: Center[] = Array.isArray(centersData) ? centersData : [];
      setCenters(centersArr);

      let invoicesArr: Invoice[] = Array.isArray(invoicesData) ? invoicesData : [];
      setInvoices(invoicesArr);

      const paymentsArr = Array.isArray(paymentsData) ? paymentsData : [];
      const enrichedPayments = paymentsArr.map((p: any) => {
        const paymentCenterId = p.centerId || studentsMap[p.studentId]?.centerId || null;
        return {
          ...p,
          studentName: studentsMap[p.studentId]?.fullname || studentsMap[p.studentId]?.name || "N/A",
          centerName:
            centersArr.find((c) => c.id === paymentCenterId)?.name ||
            centersArr.find((c) => c.id === p.centerId)?.name ||
            (studentsMap[p.studentId]?.centerId ? centersArr.find((c) => c.id === studentsMap[p.studentId]?.centerId)?.name : "N/A") ||
            "N/A",
          invoiceNumber: invoicesArr.find((i) => i.id === p.invoiceId)?.invoiceNumber || null,
          processedByName: usersMap[p.processedBy] || null,
          effectiveCenterId: paymentCenterId || undefined,
        } as Payment;
      });

      setPayments(enrichedPayments);
      calculateStats(enrichedPayments);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (paymentsData: Payment[]) => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const completed = paymentsData.filter(p => p.status === "COMPLETED");
    const pending = paymentsData.filter(p => p.status === "PENDING");
    const refunded = paymentsData.filter(p => p.status === "REFUNDED");
    
    const thisMonthPayments = completed.filter(p => {
      if (!p.createdAt) return false;
      const date = new Date(p.createdAt);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });

    const lastMonthPayments = completed.filter(p => {
      if (!p.createdAt) return false;
      const date = new Date(p.createdAt);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    });

    const totalRevenue = completed.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const pendingTotal = pending.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const refundedTotal = refunded.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const thisMonthTotal = thisMonthPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const lastMonthTotal = lastMonthPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    setStats({
      totalRevenue,
      pendingPayments: pendingTotal,
      completedPayments: completed.length,
      refundedPayments: refunded.length,
      refundedAmount: refundedTotal,
      thisMonthRevenue: thisMonthTotal,
      lastMonthRevenue: lastMonthTotal,
      averagePayment: completed.length > 0 ? totalRevenue / completed.length : 0
    });
  };

  const openCreate = () => {
    setForm({
      studentId: "",
      centerId: shouldFilterByCenter ? (userCenterId || "") : "",
      invoiceId: "",
      amount: "",
      paymentMethod: "CASH",
      paymentGateway: "",
      status: "COMPLETED",
      notes: "",
      courseName: "",
      transactionId: "",
    });
    setShowModal(true);
  };

  const openEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setForm({
      studentId: payment.studentId || "",
      centerId: payment.centerId || "",
      invoiceId: payment.invoiceId || "",
      amount: String(payment.amount || ""),
      paymentMethod: payment.paymentMethod || "CASH",
      paymentGateway: payment.paymentGateway || "",
      status: payment.status || "PENDING",
      notes: payment.notes || "",
      courseName: "",
      transactionId: payment.transactionId || ""
    });
    setShowEditModal(true);
  };

  const openReceipt = (payment: Payment) => {
    setReceiptPayment(payment);
    setShowReceiptModal(true);
  };

  const openRefund = (payment: Payment) => {
    setRefundPayment(payment);
    setRefundForm({ amount: String(payment.amount || ""), reason: "" });
    setShowRefundModal(true);
  };

  const processRefund = async () => {
    if (!refundPayment) return;

    const paymentAmount = Number(refundPayment.amount || 0);
    const refundAmount = Number(refundForm.amount);
    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      window.alert("Enter a valid refund amount.");
      return;
    }
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      window.alert("Invalid original payment amount.");
      return;
    }
    if (refundAmount > paymentAmount) {
      window.alert("Refund amount cannot exceed payment amount.");
      return;
    }
    if (!refundForm.reason.trim()) {
      window.alert("Please provide a reason for the refund.");
      return;
    }

    setCreating(true);
    try {
      // Create refund request (approval workflow)
      await apiFetch("/api/refunds", {
        method: "POST",
        body: JSON.stringify({
          paymentId: refundPayment.id,
          amount: refundAmount,
          currency: refundPayment.currency || "VND",
          reason: refundForm.reason.trim(),
          status: "PENDING",
          metadata: JSON.stringify({
            originalStatus: refundPayment.status || null,
            transactionId: refundPayment.transactionId || null,
            requestedFrom: "dashboard/payments"
          })
        })
      });

      setShowRefundModal(false);
      setRefundPayment(null);
      setRefundForm({ amount: "", reason: "" });
      await fetchData();
      window.alert("Refund request submitted. It will be processed after approval.");
    } catch (e: any) {
      window.alert(e?.message || "Failed to submit refund request");
    } finally {
      setCreating(false);
    }
  };

  const printReceipt = () => {
    window.print();
  };

  const exportToCSV = () => {
    const headers = ["Student", "Center", "Amount", "Method", "Gateway", "Transaction ID", "Invoice", "Status", "Date", "Paid At", "Notes"];
    const rows = filteredPayments.map(p => [
      p.studentName || "N/A",
      p.centerName || "N/A",
      p.amount,
      p.paymentMethod,
      p.paymentGateway || "",
      p.transactionId || "",
      p.invoiceNumber || "",
      p.status || "",
      p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "",
      p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "",
      p.notes || ""
    ]);
    
    const csvContent = [headers, ...rows].map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const updatePayment = async () => {
    if (!editingPayment) return;
    
    const amountNum = Number(form.amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      window.alert("Enter a valid amount.");
      return;
    }

    setCreating(true);
    try {
      const payload = {
        paymentMethod: form.paymentMethod,
        amount: amountNum,
        currency: "VND",
        transactionId: form.transactionId || null,
        paymentGateway: form.paymentGateway || null,
        status: form.status,
        notes: form.notes || null
      };

      await apiFetch(`/api/payments/${editingPayment.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setShowEditModal(false);
      setEditingPayment(null);
      await fetchData();
    } catch (e: any) {
      window.alert(e?.message || "Failed to update payment");
    } finally {
      setCreating(false);
    }
  };

  const updatePaymentStatus = async (id: string, newStatus: string) => {
    try {
      await apiFetch(`/api/payments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus })
      });
      await fetchData();
    } catch (e: any) {
      window.alert(e?.message || "Failed to update status");
    }
  };

  const createPayment = async () => {
    const amountNum = Number(form.amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      window.alert("Enter a valid amount.");
      return;
    }

    // Get current user ID for processedBy
    const userData = Cookies.get("userData");
    let currentUserId = null;
    if (userData) {
      try { currentUserId = JSON.parse(userData).id || null; } catch {}
    }

    setCreating(true);
    try {
      const payload = {
        studentId: form.studentId || null,
        centerId: form.centerId || null,
        invoiceId: form.invoiceId || null,
        amount: amountNum,
        paymentMethod: form.paymentMethod,
        paymentGateway: form.paymentGateway || null,
        status: form.status,
        notes: form.notes ? `${form.courseName ? 'Course: ' + form.courseName + '. ' : ''}${form.notes}` : (form.courseName || null),
        currency: "VND",
        transactionId: form.transactionId || null,
        processedBy: currentUserId
      };

      await apiFetch("/api/payments", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setShowModal(false);
      await fetchData();
    } catch (e: any) {
      window.alert(e?.message || "Failed to create payment");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment?")) return;
    try {
      await apiFetch(`/api/payments/${id}`, { method: "DELETE" });
      alert("Payment deleted!");
      await fetchData();
    } catch (error) {
      console.error("Error deleting payment:", error);
      alert("Error deleting payment");
    }
  };

  const getFilteredPayments = () => {
    let filtered = [...payments];
    if (selectedCenter !== "all") {
      filtered = filtered.filter((p) => (p.effectiveCenterId || p.centerId) === selectedCenter);
    }
    if (selectedStatus !== "all") {
      filtered = filtered.filter(p => p.status === selectedStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        (p.studentName?.toLowerCase().includes(q)) ||
        (p.transactionId?.toLowerCase().includes(q)) ||
        (p.invoiceNumber?.toLowerCase().includes(q)) ||
        (p.notes?.toLowerCase().includes(q))
      );
    }
    if (dateRange.start) {
      filtered = filtered.filter(p => p.createdAt && new Date(p.createdAt) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      filtered = filtered.filter(p => p.createdAt && new Date(p.createdAt) <= new Date(dateRange.end + "T23:59:59"));
    }
    return filtered;
  };

  const getCenterStats = () => {
    const centerMap: { [key: string]: { name: string; total: number; count: number; pending: number } } = {};
    payments.forEach((p) => {
      const centerId = p.effectiveCenterId || p.centerId || "unknown";
      const centerName = p.centerName || "Unknown Center";
      if (!centerMap[centerId]) {
        centerMap[centerId] = { name: centerName, total: 0, count: 0, pending: 0 };
      }
      if (p.status === "COMPLETED") {
        centerMap[centerId].total += Number(p.amount || 0);
        centerMap[centerId].count++;
      } else if (p.status === "PENDING") {
        centerMap[centerId].pending += Number(p.amount || 0);
      }
    });
    return Object.entries(centerMap)
      .filter(([id]) => id !== "unknown")
      .map(([id, data]) => ({ id, ...data }));
  };

  const filteredPayments = getFilteredPayments();
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const centerStats = getCenterStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "COMPLETED": return "bg-green-100 text-green-800";
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "FAILED": return "bg-red-100 text-red-800";
      case "REFUNDED": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Print styles: only print the receipt */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-content,
          #receipt-content * {
            visibility: visible;
          }
          #receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/superadmin" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">Payments</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">💰 Payments & Income Management</h1>
          <p className="text-gray-500">Track student payments, center income, and financial overview</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/finance/invoices" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            📄 Invoices
          </Link>
          <Link href="/dashboard/finance/refunds" className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
            💸 Refunds
          </Link>
          <button onClick={openCreate} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            ➕ Record Payment
          </button>
          <button onClick={exportToCSV} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <div className="text-4xl opacity-80">💵</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">This Month</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(stats.thisMonthRevenue)}</p>
              {stats.lastMonthRevenue > 0 && <p className="text-xs mt-1 text-blue-200">vs {formatCurrency(stats.lastMonthRevenue)} last month</p>}
            </div>
            <div className="text-4xl opacity-80">📈</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Pending Payments</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(stats.pendingPayments)}</p>
            </div>
            <div className="text-4xl opacity-80">⏳</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Refunded</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(stats.refundedAmount)}</p>
              <p className="text-xs mt-1 text-orange-200">{stats.refundedPayments} refunds</p>
            </div>
            <div className="text-4xl opacity-80">💸</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Avg Payment</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(stats.averagePayment)}</p>
              <p className="text-xs mt-1 text-purple-200">{stats.completedPayments} transactions</p>
            </div>
            <div className="text-4xl opacity-80">📊</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b flex">
          <button
            onClick={() => {
              setActiveTab("all");
              setCurrentPage(1);
            }}
            className={`px-6 py-4 font-medium transition-colors ${activeTab === "all" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            📋 All Payments
          </button>
          <button
            onClick={() => {
              setActiveTab("by-center");
              setCurrentPage(1);
            }}
            className={`px-6 py-4 font-medium transition-colors ${activeTab === "by-center" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            🏢 By Center
          </button>
          <button
            onClick={() => {
              setActiveTab("by-student");
              setCurrentPage(1);
            }}
            className={`px-6 py-4 font-medium transition-colors ${activeTab === "by-student" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            👨‍🎓 By Student
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Search</label>
              <input 
                type="text" 
                value={searchQuery} 
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Student, TXN ID, Invoice..."
                className="px-3 py-2 border rounded-lg text-sm w-48"
              />
            </div>
            {!shouldFilterByCenter && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Center</label>
                <select
                  value={selectedCenter}
                  onChange={(e) => {
                    setSelectedCenter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="all">All Centers</option>
                  {centers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {shouldFilterByCenter && userCenterId && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Center</label>
                <input
                  value={centers.find((c) => c.id === userCenterId)?.name || "Your Center"}
                  readOnly
                  className="px-3 py-2 border rounded-lg text-sm bg-gray-100 text-gray-700"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select value={selectedStatus} onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }} className="px-3 py-2 border rounded-lg text-sm">
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">From Date</label>
              <input type="date" value={dateRange.start} onChange={(e) => { setDateRange(prev => ({ ...prev, start: e.target.value })); setCurrentPage(1); }} className="px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To Date</label>
              <input type="date" value={dateRange.end} onChange={(e) => { setDateRange(prev => ({ ...prev, end: e.target.value })); setCurrentPage(1); }} className="px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div className="flex-1"></div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Filtered Total ({filteredPayments.length} records)</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(filteredPayments.filter(p => p.status === "COMPLETED").reduce((s, p) => s + Number(p.amount || 0), 0))}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
          ) : activeTab === "by-center" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {centerStats.map(center => (
                <div key={center.id} className="bg-gray-50 rounded-xl p-6 border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">🏢</div>
                    <div>
                      <h3 className="font-bold text-gray-900">{center.name}</h3>
                      <p className="text-sm text-gray-500">{center.count} transactions</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-gray-600">Total Revenue:</span><span className="font-bold text-green-600">{formatCurrency(center.total)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Pending:</span><span className="font-medium text-yellow-600">{formatCurrency(center.pending)}</span></div>
                  </div>
                </div>
              ))}
              {centerStats.length === 0 && <div className="col-span-full text-center py-12 text-gray-500">No center data available</div>}
            </div>
          ) : activeTab === "by-student" ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Center</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Paid</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(() => {
                    const studentPayments: { [key: string]: { name: string; center: string; total: number; pending: number; lastDate: string } } = {};
                    filteredPayments.forEach(p => {
                      const sid = p.studentId || "unknown";
                      if (!studentPayments[sid]) studentPayments[sid] = { name: p.studentName || "Unknown", center: p.centerName || "N/A", total: 0, pending: 0, lastDate: "" };
                      if (p.status === "COMPLETED") studentPayments[sid].total += Number(p.amount || 0);
                      else if (p.status === "PENDING") studentPayments[sid].pending += Number(p.amount || 0);
                      if (p.createdAt && (!studentPayments[sid].lastDate || p.createdAt > studentPayments[sid].lastDate)) studentPayments[sid].lastDate = p.createdAt;
                    });
                    return Object.entries(studentPayments).filter(([id]) => id !== "unknown").map(([id, data]) => (
                      <tr key={id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{data.name}</td>
                        <td className="px-6 py-4 text-gray-600">{data.center}</td>
                        <td className="px-6 py-4 font-medium text-green-600">{formatCurrency(data.total)}</td>
                        <td className="px-6 py-4 text-yellow-600">{formatCurrency(data.pending)}</td>
                        <td className="px-6 py-4 text-gray-500">{data.lastDate ? new Date(data.lastDate).toLocaleDateString() : "-"}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Center</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedPayments.length === 0 ? (
                    <tr><td colSpan={9} className="px-6 py-10 text-center text-gray-500">No payments found.</td></tr>
                  ) : (
                    paginatedPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium">{p.studentName || "N/A"}</div>
                          {p.notes && <div className="text-xs text-gray-500 truncate max-w-[150px]">{p.notes}</div>}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{p.centerName || "N/A"}</td>
                        <td className="px-6 py-4 font-bold text-green-600">{formatCurrency(Number(p.amount))}</td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600">{p.paymentMethod}</span>
                          {p.paymentGateway && <div className="text-xs text-gray-400">{p.paymentGateway}</div>}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm font-mono">{p.transactionId || "-"}</td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{p.invoiceNumber || "-"}</td>
                        <td className="px-6 py-4">
                          <select
                            value={p.status || "PENDING"}
                            onChange={(e) => updatePaymentStatus(p.id, e.target.value)}
                            className={`px-2 py-1 text-xs rounded-full border-0 ${getStatusColor(p.status)}`}
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="FAILED">FAILED</option>
                            <option value="REFUNDED">REFUNDED</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "-"}
                          {p.paidAt && <div className="text-xs text-green-600">Paid: {new Date(p.paidAt).toLocaleDateString()}</div>}
                          {p.processedByName && <div className="text-xs text-gray-400">By: {p.processedByName}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <button onClick={() => openReceipt(p)} className="p-1 text-green-600 hover:bg-green-50 rounded mr-1" title="Receipt">🧾</button>
                          <button onClick={() => openEdit(p)} className="p-1 text-blue-600 hover:bg-blue-50 rounded mr-1" title="Edit">✏️</button>
                          {p.status === "COMPLETED" && (
                            <button onClick={() => openRefund(p)} className="p-1 text-orange-600 hover:bg-orange-50 rounded mr-1" title="Refund">💸</button>
                          )}
                          <button onClick={() => handleDelete(p.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">🗑️</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <p className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredPayments.length)} of {filteredPayments.length}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      ← Previous
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 border rounded text-sm ${currentPage === pageNum ? "bg-blue-600 text-white" : "hover:bg-gray-50"}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Record Student Payment</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>
            <div className="space-y-4 px-5 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Student *</label>
                <select value={form.studentId} onChange={(e) => { const student = studentList.find(s => s.id === e.target.value); setForm(prev => ({ ...prev, studentId: e.target.value, centerId: student?.centerId || prev.centerId })); }} className="mt-1 w-full rounded-lg border px-3 py-2">
                  <option value="">Select Student</option>
                  {studentList.map(s => <option key={s.id} value={s.id}>{s.fullname || s.name || s.email}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Center</label>
                  <select value={form.centerId} onChange={(e) => setForm(prev => ({ ...prev, centerId: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2">
                    <option value="">Select Center</option>
                    {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Invoice (Optional)</label>
                  <select value={form.invoiceId} onChange={(e) => setForm(prev => ({ ...prev, invoiceId: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2">
                    <option value="">No Invoice</option>
                    {invoices.filter(i => !form.studentId || i.studentId === form.studentId).map(i => (
                      <option key={i.id} value={i.id}>{i.invoiceNumber} - {formatCurrency(i.totalAmount)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Course/Program</label>
                <input value={form.courseName} onChange={(e) => setForm(prev => ({ ...prev, courseName: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="e.g. LERA Starters, IELTS Prep" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount (VND) *</label>
                <input value={form.amount} onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="e.g. 2500000" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <select value={form.paymentMethod} onChange={(e) => setForm(prev => ({ ...prev, paymentMethod: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2">
                    <option value="CASH">CASH</option>
                    <option value="BANK_TRANSFER">BANK TRANSFER</option>
                    <option value="CARD">CARD</option>
                    <option value="MOMO">MOMO</option>
                    <option value="VNPAY">VNPAY</option>
                    <option value="ZALOPAY">ZALOPAY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Gateway</label>
                  <select value={form.paymentGateway} onChange={(e) => setForm(prev => ({ ...prev, paymentGateway: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2">
                    <option value="">None (Manual)</option>
                    <option value="VNPAY">VNPAY</option>
                    <option value="MOMO">MOMO</option>
                    <option value="ZALOPAY">ZALOPAY</option>
                    <option value="STRIPE">STRIPE</option>
                    <option value="PAYPAL">PAYPAL</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                  <input value={form.transactionId} onChange={(e) => setForm(prev => ({ ...prev, transactionId: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2 font-mono" placeholder="TXN123456789" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select value={form.status} onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2">
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="FAILED">FAILED</option>
                    <option value="REFUNDED">REFUNDED</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2" rows={3} placeholder="Optional notes" />
              </div>
              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50" disabled={creating}>Cancel</button>
                <button type="button" onClick={createPayment} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50" disabled={creating}>{creating ? "Saving..." : "Save Payment"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {showEditModal && editingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Edit Payment</h2>
              <button onClick={() => { setShowEditModal(false); setEditingPayment(null); }} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>
            <div className="space-y-4 px-5 py-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">Student: <span className="font-medium">{editingPayment.studentName || "N/A"}</span></p>
                <p className="text-sm text-gray-600">Center: <span className="font-medium">{editingPayment.centerName || "N/A"}</span></p>
                {editingPayment.invoiceNumber && <p className="text-sm text-gray-600">Invoice: <span className="font-medium">{editingPayment.invoiceNumber}</span></p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount (VND)</label>
                <input value={form.amount} onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="e.g. 2500000" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <select value={form.paymentMethod} onChange={(e) => setForm(prev => ({ ...prev, paymentMethod: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2">
                    <option value="CASH">CASH</option>
                    <option value="BANK_TRANSFER">BANK TRANSFER</option>
                    <option value="CARD">CARD</option>
                    <option value="MOMO">MOMO</option>
                    <option value="VNPAY">VNPAY</option>
                    <option value="ZALOPAY">ZALOPAY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Gateway</label>
                  <select value={form.paymentGateway} onChange={(e) => setForm(prev => ({ ...prev, paymentGateway: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2">
                    <option value="">None (Manual)</option>
                    <option value="VNPAY">VNPAY</option>
                    <option value="MOMO">MOMO</option>
                    <option value="ZALOPAY">ZALOPAY</option>
                    <option value="STRIPE">STRIPE</option>
                    <option value="PAYPAL">PAYPAL</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                  <input value={form.transactionId} onChange={(e) => setForm(prev => ({ ...prev, transactionId: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2 font-mono" placeholder="e.g. TXN123456789" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select value={form.status} onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2">
                    <option value="PENDING">PENDING</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="FAILED">FAILED</option>
                    <option value="REFUNDED">REFUNDED</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2" rows={2} placeholder="Optional notes" />
              </div>
              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={() => { setShowEditModal(false); setEditingPayment(null); }} className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50" disabled={creating}>Cancel</button>
                <button type="button" onClick={updatePayment} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50" disabled={creating}>{creating ? "Saving..." : "Update Payment"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && receiptPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-5 py-4 print:hidden">
              <h2 className="text-lg font-semibold text-gray-900">Payment Receipt</h2>
              <div className="flex gap-2">
                <button onClick={printReceipt} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">🖨️ Print</button>
                <button onClick={() => { setShowReceiptModal(false); setReceiptPayment(null); }} className="text-gray-500 hover:text-gray-800">✕</button>
              </div>
            </div>
            <div className="p-6" id="receipt-content">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">LERA English</h1>
                <p className="text-sm text-gray-500">Payment Receipt</p>
              </div>
              
              <div className="border-t border-b py-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Receipt No:</span>
                  <span className="font-mono font-medium">{receiptPayment.transactionId || receiptPayment.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span>{receiptPayment.createdAt ? new Date(receiptPayment.createdAt).toLocaleDateString("vi-VN") : "-"}</span>
                </div>
                {receiptPayment.invoiceNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice:</span>
                    <span>{receiptPayment.invoiceNumber}</span>
                  </div>
                )}
              </div>
              
              <div className="py-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Student:</span>
                  <span className="font-medium">{receiptPayment.studentName || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Center:</span>
                  <span>{receiptPayment.centerName || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span>{receiptPayment.paymentMethod}</span>
                </div>
                {receiptPayment.paymentGateway && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gateway:</span>
                    <span>{receiptPayment.paymentGateway}</span>
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-700">Total Amount:</span>
                  <span className="text-2xl font-bold text-green-600">{formatCurrency(Number(receiptPayment.amount))}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(receiptPayment.status)}`}>
                    {receiptPayment.status}
                  </span>
                </div>
              </div>
              
              {receiptPayment.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600"><span className="font-medium">Notes:</span> {receiptPayment.notes}</p>
                </div>
              )}
              
              <div className="mt-6 text-center text-xs text-gray-400">
                <p>Thank you for your payment!</p>
                <p>LERA English Academy</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && refundPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">💸 Submit Refund Request</h2>
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setRefundPayment(null);
                }}
                className="text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800">
                  <strong>Note:</strong> This will submit a refund request for approval. The payment will not be marked as refunded until the refund is approved and completed.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  Student: <span className="font-medium">{refundPayment.studentName || "N/A"}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Original Amount:{" "}
                  <span className="font-medium text-green-600">{formatCurrency(Number(refundPayment.amount))}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Payment Date:{" "}
                  <span className="font-medium">
                    {refundPayment.createdAt ? new Date(refundPayment.createdAt).toLocaleDateString() : "-"}
                  </span>
                </p>
                {refundPayment.transactionId && (
                  <p className="text-sm text-gray-600">
                    Transaction ID: <span className="font-mono">{refundPayment.transactionId}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount (VND) *</label>
                <input
                  type="number"
                  value={refundForm.amount}
                  onChange={(e) => setRefundForm((prev) => ({ ...prev, amount: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="Enter refund amount"
                  max={Number(refundPayment.amount || 0)}
                />
                <p className="text-xs text-gray-500 mt-1">Maximum: {formatCurrency(Number(refundPayment.amount))}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Refund *</label>
                <textarea
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm((prev) => ({ ...prev, reason: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2"
                  rows={3}
                  placeholder="Please provide the reason for this refund..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowRefundModal(false);
                    setRefundPayment(null);
                  }}
                  className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={processRefund}
                  className="rounded-lg bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 disabled:opacity-50"
                  disabled={creating}
                >
                  {creating ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">{error}</div>}
    </div>
  );
}
