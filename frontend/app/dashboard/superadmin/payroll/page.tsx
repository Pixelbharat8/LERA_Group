"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "../../../../lib/api";

interface User {
  id: string;
  email: string;
  fullname: string;
  roleName: string;
  departmentName?: string;
  employeeCode?: string;
}

interface PayrollRecord {
  id: string;
  userId: string;
  month: number;
  year: number;
  baseSalary: number;
  hourlyRate?: number;
  hoursWorked?: number;
  overtimeHours?: number;
  overtimePay?: number;
  deductions?: number;
  bonus?: number;
  netSalary: number;
  status: string;
  paidAt?: string;
  createdAt?: string;
}

interface SalaryConfig {
  id?: string;
  teacherId: string;
  baseSalary: number;
  hourlyRate: number;
  sessionRate?: number;
  salaryType: string;
  status: string;
}

export default function PayrollPage() {
  const searchParams = useSearchParams();
  const preselectedUserId = searchParams.get("userId");

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>(preselectedUserId || "");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [salaryConfig, setSalaryConfig] = useState<SalaryConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);

  // Fetch all users
  useEffect(() => {
    fetchUsers();
  }, []);

  // When user is selected, fetch their data
  useEffect(() => {
    if (selectedUserId) {
      const user = users.find(u => u.id === selectedUserId);
      setSelectedUser(user || null);
      fetchPayrollData();
      fetchSalaryConfig();
      fetchAttendanceSummary();
    }
  }, [selectedUserId, users, selectedYear, viewMode]);

  const fetchUsers = async () => {
    try {
      const data = await apiFetch("/api/users");
      setUsers(Array.isArray(data) ? data : []);
      
      // Auto-select if preselected user
      if (preselectedUserId && !selectedUserId) {
        setSelectedUserId(preselectedUserId);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrollData = async () => {
    if (!selectedUserId) return;
    
    try {
      let url = `/api/payroll/user/${selectedUserId}`;
      if (viewMode === "yearly") {
        url = `/api/payroll/user/${selectedUserId}/year/${selectedYear}`;
      }
      
      const data = await apiFetch(url);
      setPayrollRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching payroll:", err);
      setPayrollRecords([]);
    }
  };

  const fetchSalaryConfig = async () => {
    if (!selectedUserId) return;
    
    try {
      const data = await apiFetch(`/api/salary-config/teacher/${selectedUserId}`);
      setSalaryConfig(data);
    } catch (err) {
      console.error("Error fetching salary config:", err);
      setSalaryConfig(null);
    }
  };

  const fetchAttendanceSummary = async () => {
    if (!selectedUserId) return;
    
    try {
      const data = await apiFetch(`/api/attendance/user/${selectedUserId}/summary?year=${selectedYear}`);
      setAttendanceSummary(data);
    } catch (err) {
      console.error("Error fetching attendance summary:", err);
      setAttendanceSummary(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Calculate totals
  const totalEarnings = payrollRecords.reduce((sum, r) => sum + (r.netSalary || 0), 0);
  const totalDeductions = payrollRecords.reduce((sum, r) => sum + (r.deductions || 0), 0);
  const totalBonus = payrollRecords.reduce((sum, r) => sum + (r.bonus || 0), 0);

  const [viewingRecord, setViewingRecord] = useState<PayrollRecord | null>(null);

  const handleViewRecord = (record: PayrollRecord) => {
    setViewingRecord(record);
  };

  const handlePrintRecord = (record: PayrollRecord) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Payslip - ${months[record.month - 1]} ${record.year}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; }
              .header { text-align: center; margin-bottom: 30px; }
              .title { color: #1e40af; font-size: 24px; font-weight: bold; }
              .subtitle { color: #666; margin-top: 5px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
              .info-item { padding: 10px; background: #f5f5f5; border-radius: 8px; }
              .label { font-size: 12px; color: #666; }
              .value { font-size: 18px; font-weight: bold; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
              th { background: #f5f5f5; }
              .total { font-weight: bold; font-size: 20px; color: #1e40af; }
              .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">LERA Academy</div>
              <div class="subtitle">Payslip for ${months[record.month - 1]} ${record.year}</div>
            </div>
            
            <div class="info-grid">
              <div class="info-item">
                <div class="label">Employee</div>
                <div class="value">${selectedUser?.fullname || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="label">Department</div>
                <div class="value">${selectedUser?.departmentName || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="label">Employee Code</div>
                <div class="value">${selectedUser?.employeeCode || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="label">Status</div>
                <div class="value">${record.status}</div>
              </div>
            </div>

            <table>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount</th>
              </tr>
              <tr>
                <td>Base Salary</td>
                <td style="text-align: right;">${formatCurrency(record.baseSalary)}</td>
              </tr>
              ${record.overtimePay ? `
              <tr>
                <td>Overtime Pay</td>
                <td style="text-align: right;">${formatCurrency(record.overtimePay)}</td>
              </tr>
              ` : ''}
              ${record.bonus ? `
              <tr>
                <td>Bonus</td>
                <td style="text-align: right; color: green;">+${formatCurrency(record.bonus)}</td>
              </tr>
              ` : ''}
              ${record.deductions ? `
              <tr>
                <td>Deductions</td>
                <td style="text-align: right; color: red;">-${formatCurrency(record.deductions)}</td>
              </tr>
              ` : ''}
              <tr>
                <td><strong>Net Salary</strong></td>
                <td class="total" style="text-align: right;">${formatCurrency(record.netSalary)}</td>
              </tr>
            </table>

            <div class="footer">
              <p>Generated on ${new Date().toLocaleString()}</p>
              <p>This is a computer-generated document. No signature required.</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
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
            <span>Finance</span>
            <span>/</span>
            <span className="text-gray-900">User Payroll</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">💰 User Payroll</h1>
          <p className="text-gray-500">View and manage employee payroll records</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Employee</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">-- Select Employee --</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullname} ({user.email}) - {user.roleName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">View Mode</label>
            <div className="flex rounded-lg overflow-hidden border border-gray-300">
              <button
                onClick={() => setViewMode("monthly")}
                className={`px-4 py-2 ${viewMode === "monthly" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setViewMode("yearly")}
                className={`px-4 py-2 ${viewMode === "yearly" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                Yearly
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {[2023, 2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedUser && (
        <>
          {/* Employee Info Card */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl text-white font-bold">
                {selectedUser.fullname?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{selectedUser.fullname}</h2>
                <p className="text-gray-500">{selectedUser.email}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{selectedUser.roleName}</span>
                  {selectedUser.departmentName && (
                    <span className="text-gray-500">📂 {selectedUser.departmentName}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                {salaryConfig && (
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Base Salary</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(salaryConfig.baseSalary)}</p>
                    {salaryConfig.hourlyRate > 0 && (
                      <p className="text-sm text-gray-500">Hourly: {formatCurrency(salaryConfig.hourlyRate)}/hr</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">💵</div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalEarnings)}</p>
                  <p className="text-sm text-gray-500">Total Earnings ({selectedYear})</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-2xl">📉</div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalDeductions)}</p>
                  <p className="text-sm text-gray-500">Total Deductions</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-2xl">🎁</div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBonus)}</p>
                  <p className="text-sm text-gray-500">Total Bonus</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">📊</div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{payrollRecords.length}</p>
                  <p className="text-sm text-gray-500">Payment Records</p>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Summary */}
          {attendanceSummary && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📅 Attendance Summary ({selectedYear})</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{attendanceSummary.presentDays || 0}</p>
                  <p className="text-sm text-gray-500">Present</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{attendanceSummary.absentDays || 0}</p>
                  <p className="text-sm text-gray-500">Absent</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{attendanceSummary.lateDays || 0}</p>
                  <p className="text-sm text-gray-500">Late</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{attendanceSummary.totalHours || 0}</p>
                  <p className="text-sm text-gray-500">Total Hours</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{attendanceSummary.overtimeHours || 0}</p>
                  <p className="text-sm text-gray-500">Overtime</p>
                </div>
              </div>
            </div>
          )}

          {/* Payroll Records Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">
                Payroll Records - {viewMode === "yearly" ? selectedYear : "Recent"}
              </h2>
              <button
                onClick={() => { window.location.href = "/dashboard/superadmin/payroll/cycles"; }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Generate Payslip
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Salary</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overtime</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bonus</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payrollRecords.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                          No payroll records found for this period
                          <div className="mt-4">
                            <button
                              onClick={() => { window.location.href = "/dashboard/superadmin/payroll/cycles"; }}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              + Create First Payroll Record
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      payrollRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap font-medium">
                            {months[record.month - 1]} {record.year}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                            {formatCurrency(record.baseSalary)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                            {formatCurrency(record.overtimePay || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-green-600">
                            +{formatCurrency(record.bonus || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-red-600">
                            -{formatCurrency(record.deductions || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                            {formatCurrency(record.netSalary)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(record.status)}`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button onClick={() => handleViewRecord(record)} className="text-blue-600 hover:text-blue-800 mr-3">View</button>
                            <button onClick={() => handlePrintRecord(record)} className="text-gray-600 hover:text-gray-800">Print</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {!selectedUser && !loading && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">👆</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Select an Employee</h3>
          <p className="text-gray-500">Choose an employee from the dropdown above to view their payroll details</p>
        </div>
      )}

      {/* View Record Modal */}
      {viewingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                💰 Payslip - {months[viewingRecord.month - 1]} {viewingRecord.year}
              </h2>
              <button onClick={() => setViewingRecord(null)} className="text-gray-500 hover:text-gray-800 text-xl">&times;</button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Employee Details</h3>
                <p><span className="text-gray-500">Name:</span> {selectedUser?.fullname}</p>
                <p><span className="text-gray-500">Department:</span> {selectedUser?.departmentName || 'N/A'}</p>
                <p><span className="text-gray-500">Employee Code:</span> {selectedUser?.employeeCode || 'N/A'}</p>
              </div>

              <div className="border rounded-lg divide-y">
                <div className="flex justify-between p-3">
                  <span>Base Salary</span>
                  <span className="font-medium">{formatCurrency(viewingRecord.baseSalary)}</span>
                </div>
                {viewingRecord.overtimePay ? (
                  <div className="flex justify-between p-3">
                    <span>Overtime Pay</span>
                    <span className="font-medium">{formatCurrency(viewingRecord.overtimePay)}</span>
                  </div>
                ) : null}
                {viewingRecord.bonus ? (
                  <div className="flex justify-between p-3">
                    <span>Bonus</span>
                    <span className="font-medium text-green-600">+{formatCurrency(viewingRecord.bonus)}</span>
                  </div>
                ) : null}
                {viewingRecord.deductions ? (
                  <div className="flex justify-between p-3">
                    <span>Deductions</span>
                    <span className="font-medium text-red-600">-{formatCurrency(viewingRecord.deductions)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between p-3 bg-blue-50">
                  <span className="font-bold">Net Salary</span>
                  <span className="font-bold text-blue-600">{formatCurrency(viewingRecord.netSalary)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(viewingRecord.status)}`}>
                  {viewingRecord.status}
                </span>
                {viewingRecord.paidAt && (
                  <span className="text-sm text-gray-500">Paid on {new Date(viewingRecord.paidAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setViewingRecord(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Close</button>
              <button onClick={() => handlePrintRecord(viewingRecord)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">🖨️ Print</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
