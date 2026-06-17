"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import ExportMenu from "../../../components/ExportMenu";
import { useUserCenter, buildCenterFilterUrl } from "../../../hooks/useUserCenter";

interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  centerId: string;
  centerName: string;
  courseId?: string;
  courseName?: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: "DRAFT" | "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";
  items: InvoiceItem[];
  createdAt: string;
}

interface InvoiceItem {
  id: string;
  itemType: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Student {
  id: string;
  fullname?: string;
  name?: string;
  email?: string;
  centerId?: string;
}

interface Center {
  id: string;
  name: string;
}

export default function InvoicesPage() {
  const { centerId: userCenterId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCenter, setFilterCenter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [generating, setGenerating] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "CASH",
    paymentGateway: "",
    transactionId: "",
    notes: ""
  });

  const [form, setForm] = useState({
    studentId: "",
    centerId: "",
    dueDate: "",
    items: [{ itemType: "TUITION", description: "", quantity: 1, unitPrice: 0 }],
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
      const invoicesUrl = buildCenterFilterUrl('/api/invoices', shouldFilterByCenter ? userCenterId : null);
      const studentsUrl = buildCenterFilterUrl('/api/students', shouldFilterByCenter ? userCenterId : null);
      const [invoicesData, studentsData, centersData] = await Promise.all([
        apiFetch(invoicesUrl).catch(() => []),
        apiFetch(studentsUrl).catch(() => []),
        apiFetch('/api/centers').catch(() => [])
      ]);

      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setCenters(Array.isArray(centersData) ? centersData : []);
      
      if (Array.isArray(invoicesData)) {
        // Map backend invoice format to frontend interface
        setInvoices(invoicesData.map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber || `INV-${inv.id?.slice(0, 8)}`,
          studentId: inv.studentId,
          studentName: inv.studentName || 'Unknown Student',
          centerId: inv.centerId,
          centerName: inv.centerName || 'Unknown Center',
          courseName: inv.courseName,
          invoiceDate: inv.invoiceDate || inv.createdAt?.split('T')[0],
          dueDate: inv.dueDate,
          subtotal: inv.subtotal || inv.totalAmount || 0,
          discountAmount: inv.discountAmount || 0,
          taxAmount: inv.taxAmount || 0,
          totalAmount: inv.totalAmount || 0,
          paidAmount: inv.paidAmount || 0,
          balance: (inv.totalAmount || 0) - (inv.paidAmount || 0),
          status: inv.status || 'PENDING',
          items: inv.items || [],
          createdAt: inv.createdAt
        })));
      } else {
        setInvoices([]);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-800",
      PENDING: "bg-yellow-100 text-yellow-800",
      PARTIAL: "bg-blue-100 text-blue-800",
      PAID: "bg-green-100 text-green-800",
      OVERDUE: "bg-red-100 text-red-800",
      CANCELLED: "bg-gray-100 text-gray-500"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const stats = {
    total: invoices.length,
    pending: invoices.filter(i => i.status === "PENDING").length,
    overdue: invoices.filter(i => i.status === "OVERDUE").length,
    paid: invoices.filter(i => i.status === "PAID").length,
    totalAmount: invoices.reduce((sum, i) => sum + i.totalAmount, 0),
    paidAmount: invoices.reduce((sum, i) => sum + i.paidAmount, 0),
    outstandingAmount: invoices.reduce((sum, i) => sum + i.balance, 0)
  };

  const filteredInvoices = invoices.filter(inv => {
    if (filterStatus !== "all" && inv.status !== filterStatus) return false;
    if (filterCenter !== "all" && inv.centerId !== filterCenter) return false;
    if (searchQuery && !inv.studentName.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const openDetailModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailModal(true);
  };

  const generateInvoice = async () => {
    if (!form.studentId || !form.dueDate) {
      alert("Please select a student and due date");
      return;
    }

    setGenerating(true);
    try {
      const payload = {
        studentId: form.studentId,
        centerId: form.centerId,
        dueDate: form.dueDate,
        items: form.items.filter(item => item.description && item.unitPrice > 0),
        notes: form.notes
      };

      await apiFetch("/api/invoices", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      await fetchData();
      setShowModal(false);
      setForm({
        studentId: "",
        centerId: "",
        dueDate: "",
        items: [{ itemType: "TUITION", description: "", quantity: 1, unitPrice: 0 }],
        notes: ""
      });
    } catch (err) {
      console.error("Error generating invoice:", err);
      alert("Error generating invoice");
    } finally {
      setGenerating(false);
    }
  };

  const markAsPaid = async (invoiceId: string) => {
    try {
      await apiFetch(`/api/invoices/${invoiceId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "PAID" })
      });
      await fetchData();
      setShowDetailModal(false);
    } catch (err) {
      console.error("Error marking as paid:", err);
    }
  };

  const openPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentForm({
      amount: String(invoice.balance || invoice.totalAmount),
      paymentMethod: "CASH",
      paymentGateway: "",
      transactionId: "",
      notes: ""
    });
    setShowDetailModal(false);
    setShowPaymentModal(true);
  };

  const recordPayment = async () => {
    if (!selectedInvoice) return;
    
    const amount = Number(paymentForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }
    if (amount > selectedInvoice.balance) {
      alert("Payment amount cannot exceed the balance due.");
      return;
    }

    setGenerating(true);
    try {
      // Create payment record
      await apiFetch("/api/payments", {
        method: "POST",
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          studentId: selectedInvoice.studentId,
          centerId: selectedInvoice.centerId,
          amount: amount,
          paymentMethod: paymentForm.paymentMethod,
          paymentGateway: paymentForm.paymentGateway || null,
          transactionId: paymentForm.transactionId || null,
          notes: paymentForm.notes || null,
          status: "COMPLETED",
          currency: "VND"
        })
      });

      // Update invoice paid amount and status
      const newPaidAmount = (selectedInvoice.paidAmount || 0) + amount;
      const newStatus = newPaidAmount >= selectedInvoice.totalAmount ? "PAID" : "PARTIAL";
      
      await apiFetch(`/api/invoices/${selectedInvoice.id}`, {
        method: "PUT",
        body: JSON.stringify({
          paidAmount: newPaidAmount,
          status: newStatus,
          paidAt: newStatus === "PAID" ? new Date().toISOString() : null
        })
      });

      await fetchData();
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      alert("Payment recorded successfully!");
    } catch (err) {
      console.error("Error recording payment:", err);
      alert("Error recording payment");
    } finally {
      setGenerating(false);
    }
  };

  const sendReminder = async (invoiceId: string) => {
    alert(`Reminder sent for invoice ${invoiceId}`);
  };

  const addItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { itemType: "MISC", description: "", quantity: 1, unitPrice: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item)
    }));
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
            <span className="text-gray-900">Invoices</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">🧾 Invoice Management</h1>
          <p className="text-gray-500">Generate, track, and manage student invoices</p>
        </div>
        <div className="flex gap-2">
          <ExportMenu
            filename="invoices"
            rows={invoices}
            columns={[
              { key: "invoiceNumber", label: "Invoice #" },
              { key: "studentName", label: "Student" },
              { key: "centerName", label: "Centre" },
              { key: "courseName", label: "Course" },
              { key: "invoiceDate", label: "Invoice Date" },
              { key: "dueDate", label: "Due Date" },
              { key: "totalAmount", label: "Total" },
              { key: "paidAmount", label: "Paid" },
              { key: "balance", label: "Balance" },
              { key: "status", label: "Status" },
            ]}
          />
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ➕ Generate Invoice
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Invoiced</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalAmount)}</p>
              <p className="text-xs text-blue-200 mt-1">{stats.total} invoices</p>
            </div>
            <div className="text-4xl opacity-80">📄</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Collected</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(stats.paidAmount)}</p>
              <p className="text-xs text-green-200 mt-1">{stats.paid} paid invoices</p>
            </div>
            <div className="text-4xl opacity-80">✅</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Outstanding</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(stats.outstandingAmount)}</p>
              <p className="text-xs text-yellow-200 mt-1">{stats.pending} pending</p>
            </div>
            <div className="text-4xl opacity-80">⏳</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Overdue</p>
              <p className="text-2xl font-bold mt-1">{stats.overdue}</p>
              <p className="text-xs text-red-200 mt-1">Need attention</p>
            </div>
            <div className="text-4xl opacity-80">⚠️</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by student name or invoice number..."
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
            <option value="DRAFT">Draft</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
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

      {/* Invoices Table */}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Center</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-blue-600">{inv.invoiceNumber}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{inv.studentName}</div>
                        {inv.courseName && <div className="text-sm text-gray-500">{inv.courseName}</div>}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{inv.centerName}</td>
                      <td className="px-6 py-4 font-medium">{formatCurrency(inv.totalAmount)}</td>
                      <td className="px-6 py-4 text-green-600">{formatCurrency(inv.paidAmount)}</td>
                      <td className="px-6 py-4 font-medium text-red-600">{formatCurrency(inv.balance)}</td>
                      <td className="px-6 py-4 text-gray-600">{inv.dueDate}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(inv.status)}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openDetailModal(inv)}
                          className="text-blue-600 hover:text-blue-800 mr-2"
                        >
                          View
                        </button>
                        {inv.balance > 0 && inv.status !== "CANCELLED" && (
                          <button
                            onClick={() => openPaymentModal(inv)}
                            className="text-green-600 hover:text-green-800 mr-2"
                          >
                            Pay
                          </button>
                        )}
                        {inv.status === "OVERDUE" && (
                          <button
                            onClick={() => sendReminder(inv.id)}
                            className="text-yellow-600 hover:text-yellow-800"
                          >
                            Remind
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-bold">Generate Invoice</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                  <select
                    value={form.studentId}
                    onChange={(e) => {
                      const student = students.find(s => s.id === e.target.value);
                      setForm(prev => ({ ...prev, studentId: e.target.value, centerId: student?.centerId || "" }));
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Student</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.fullname || s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Invoice Items</label>
                  <button onClick={addItem} className="text-blue-600 text-sm hover:text-blue-800">+ Add Item</button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <select
                        value={item.itemType}
                        onChange={(e) => updateItem(index, "itemType", e.target.value)}
                        className="w-32 px-2 py-2 border rounded-lg text-sm"
                      >
                        <option value="TUITION">Tuition</option>
                        <option value="MATERIAL">Material</option>
                        <option value="REGISTRATION">Registration</option>
                        <option value="EXAM">Exam</option>
                        <option value="MISC">Other</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Amount"
                        value={item.unitPrice || ""}
                        onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                        className="w-32 px-3 py-2 border rounded-lg text-sm"
                      />
                      {form.items.length > 1 && (
                        <button onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700">✕</button>
                      )}
                    </div>
                  ))}
                </div>
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

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(form.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0))}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button
                  onClick={generateInvoice}
                  disabled={generating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {generating ? "Generating..." : "Generate Invoice"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-xl font-bold">{selectedInvoice.invoiceNumber}</h2>
                <p className="text-sm text-gray-500">{selectedInvoice.studentName}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Invoice Date</p>
                  <p className="font-medium">{selectedInvoice.invoiceDate}</p>
                </div>
                <div>
                  <p className="text-gray-500">Due Date</p>
                  <p className="font-medium">{selectedInvoice.dueDate}</p>
                </div>
                <div>
                  <p className="text-gray-500">Center</p>
                  <p className="font-medium">{selectedInvoice.centerName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedInvoice.status)}`}>
                    {selectedInvoice.status}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-3">Items</h3>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Description</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">Unit Price</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map(item => (
                      <tr key={item.id} className="border-b">
                        <td className="px-3 py-2">{item.description}</td>
                        <td className="px-3 py-2 text-right">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(selectedInvoice.subtotal)}</span></div>
                {selectedInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600"><span>Discount:</span><span>-{formatCurrency(selectedInvoice.discountAmount)}</span></div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span><span>{formatCurrency(selectedInvoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-green-600"><span>Paid:</span><span>{formatCurrency(selectedInvoice.paidAmount)}</span></div>
                <div className="flex justify-between font-bold text-red-600"><span>Balance Due:</span><span>{formatCurrency(selectedInvoice.balance)}</span></div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button onClick={() => setShowDetailModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Close</button>
                {selectedInvoice.balance > 0 && (
                  <>
                    <button
                      onClick={() => openPaymentModal(selectedInvoice)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      💳 Record Payment
                    </button>
                    <button
                      onClick={() => markAsPaid(selectedInvoice.id)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      ✓ Mark Paid
                    </button>
                  </>
                )}
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  🖨️ Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-bold">💳 Record Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Invoice: <span className="font-medium">{selectedInvoice.invoiceNumber}</span></p>
                <p className="text-sm text-gray-600">Student: <span className="font-medium">{selectedInvoice.studentName}</span></p>
                <p className="text-sm text-gray-600">Total: <span className="font-medium">{formatCurrency(selectedInvoice.totalAmount)}</span></p>
                <p className="text-sm text-gray-600">Paid: <span className="font-medium text-green-600">{formatCurrency(selectedInvoice.paidAmount)}</span></p>
                <p className="text-sm text-gray-600 font-bold">Balance Due: <span className="text-red-600">{formatCurrency(selectedInvoice.balance)}</span></p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount (VND) *</label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="Enter payment amount"
                  max={selectedInvoice.balance}
                />
                <p className="text-xs text-gray-500 mt-1">Max: {formatCurrency(selectedInvoice.balance)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2"
                  >
                    <option value="CASH">CASH</option>
                    <option value="BANK_TRANSFER">BANK TRANSFER</option>
                    <option value="CARD">CARD</option>
                    <option value="MOMO">MOMO</option>
                    <option value="VNPAY">VNPAY</option>
                    <option value="ZALOPAY">ZALOPAY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gateway</label>
                  <select
                    value={paymentForm.paymentGateway}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentGateway: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2"
                  >
                    <option value="">None (Manual)</option>
                    <option value="VNPAY">VNPAY</option>
                    <option value="MOMO">MOMO</option>
                    <option value="ZALOPAY">ZALOPAY</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                <input
                  type="text"
                  value={paymentForm.transactionId}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, transactionId: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 font-mono"
                  placeholder="e.g. TXN123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2"
                  rows={2}
                  placeholder="Optional notes"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  disabled={generating}
                >
                  Cancel
                </button>
                <button
                  onClick={recordPayment}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  disabled={generating}
                >
                  {generating ? "Processing..." : "Record Payment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
