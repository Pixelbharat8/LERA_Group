"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";

interface PayrollRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  centerName: string;
  centerId: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  baseSalary: number;
  teachingHours: number;
  hourlyRate: number;
  teachingAmount: number;
  bonus: number;
  deductions: number;
  totalAmount: number;
  status: string;
  notes: string;
}

interface PayrollSummary {
  totalStaff: number;
  totalAmount: number;
  totalTax: number;
  netAmount: number;
  byRole: { [key: string]: { count: number; amount: number } };
  byCenter: { [key: string]: { count: number; amount: number } };
}

export default function PayrollReportsPage() {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"monthly" | "yearly" | "center">("monthly");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedCenter, setSelectedCenter] = useState("all");
  const [summary, setSummary] = useState<PayrollSummary | null>(null);

  useEffect(() => {
    fetchPayrollRecords();
  }, [selectedMonth, selectedYear, selectedCenter, viewMode]);

  const fetchPayrollRecords = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/payroll");
      setPayrollRecords(Array.isArray(data) ? data : []);
      calculateSummary(data);
    } catch (err) {
      console.error("Error fetching payroll:", err);
      setPayrollRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTax = (totalAmount: number): number => {
    // Vietnam Personal Income Tax (Progressive)
    // 0-5M: 5%
    // 5M-10M: 10%
    // 10M-18M: 15%
    // 18M-32M: 20%
    // 32M-52M: 25%
    // 52M-80M: 30%
    // >80M: 35%
    
    const taxableIncome = totalAmount - 11000000; // 11M VND deduction (personal + dependents)
    if (taxableIncome <= 0) return 0;
    
    let tax = 0;
    if (taxableIncome <= 5000000) {
      tax = taxableIncome * 0.05;
    } else if (taxableIncome <= 10000000) {
      tax = 5000000 * 0.05 + (taxableIncome - 5000000) * 0.10;
    } else if (taxableIncome <= 18000000) {
      tax = 5000000 * 0.05 + 5000000 * 0.10 + (taxableIncome - 10000000) * 0.15;
    } else if (taxableIncome <= 32000000) {
      tax = 5000000 * 0.05 + 5000000 * 0.10 + 8000000 * 0.15 + (taxableIncome - 18000000) * 0.20;
    } else if (taxableIncome <= 52000000) {
      tax = 5000000 * 0.05 + 5000000 * 0.10 + 8000000 * 0.15 + 14000000 * 0.20 + (taxableIncome - 32000000) * 0.25;
    } else if (taxableIncome <= 80000000) {
      tax = 5000000 * 0.05 + 5000000 * 0.10 + 8000000 * 0.15 + 14000000 * 0.20 + 20000000 * 0.25 + (taxableIncome - 52000000) * 0.30;
    } else {
      tax = 5000000 * 0.05 + 5000000 * 0.10 + 8000000 * 0.15 + 14000000 * 0.20 + 20000000 * 0.25 + 28000000 * 0.30 + (taxableIncome - 80000000) * 0.35;
    }
    
    return Math.round(tax);
  };

  const calculateSummary = (records: PayrollRecord[]) => {
    const filtered = filterRecords(records);
    
    const byRole: { [key: string]: { count: number; amount: number } } = {};
    const byCenter: { [key: string]: { count: number; amount: number } } = {};
    let totalAmount = 0;
    let totalTax = 0;

    filtered.forEach(record => {
      const role = extractRole(record.notes);
      const center = record.centerName || "No Center";
      const amount = record.totalAmount || 0;
      const tax = calculateTax(amount);

      totalAmount += amount;
      totalTax += tax;

      if (!byRole[role]) byRole[role] = { count: 0, amount: 0 };
      byRole[role].count++;
      byRole[role].amount += amount;

      if (!byCenter[center]) byCenter[center] = { count: 0, amount: 0 };
      byCenter[center].count++;
      byCenter[center].amount += amount;
    });

    setSummary({
      totalStaff: filtered.length,
      totalAmount,
      totalTax,
      netAmount: totalAmount - totalTax,
      byRole,
      byCenter
    });
  };

  const extractRole = (notes: string): string => {
    const match = notes?.match(/\[([A-Z]+)\]/);
    return match ? match[1] : "UNKNOWN";
  };

  const filterRecords = (records: PayrollRecord[]): PayrollRecord[] => {
    return records.filter(record => {
      // Filter by view mode
      if (viewMode === "monthly") {
        const recordMonth = record.payPeriodStart?.substring(0, 7);
        if (recordMonth !== selectedMonth) return false;
      } else if (viewMode === "yearly") {
        const recordYear = record.payPeriodStart?.substring(0, 4);
        if (recordYear !== selectedYear) return false;
      }

      // Filter by center
      if (selectedCenter !== "all" && record.centerName !== selectedCenter) {
        return false;
      }

      return true;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
  };

  const filteredRecords = filterRecords(payrollRecords);
  const uniqueCenters = Array.from(new Set(payrollRecords.map(r => r.centerName).filter(Boolean)));

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
            <span className="text-gray-900">Payroll Reports</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">💰 Payroll Reports</h1>
          <p className="text-gray-500">Comprehensive payroll analysis with tax calculations</p>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">View Mode</label>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("monthly")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === "monthly" 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                📅 Monthly
              </button>
              <button
                onClick={() => setViewMode("yearly")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === "yearly" 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                📆 Yearly
              </button>
              <button
                onClick={() => setViewMode("center")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === "center" 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                🏢 By Center
              </button>
            </div>
          </div>

          {viewMode === "monthly" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}

          {viewMode === "yearly" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {[2025, 2024, 2023].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Center</label>
            <select
              value={selectedCenter}
              onChange={(e) => setSelectedCenter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Centers</option>
              {uniqueCenters.map(center => (
                <option key={center} value={center}>{center}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">👥</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{summary.totalStaff}</p>
                <p className="text-sm text-gray-500">Total Staff</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">💵</div>
              <div>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.totalAmount)}</p>
                <p className="text-sm text-gray-500">Gross Payroll</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-2xl">🧾</div>
              <div>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.totalTax)}</p>
                <p className="text-sm text-gray-500">Total Tax</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">💰</div>
              <div>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.netAmount)}</p>
                <p className="text-sm text-gray-500">Net Payroll</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* By Role Breakdown */}
      {summary && viewMode !== "center" && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Breakdown by Role</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(summary.byRole).map(([role, data]) => (
              <div key={role} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-700">{role}</span>
                  <span className="text-sm text-gray-500">{data.count} staff</span>
                </div>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(data.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* By Center Breakdown */}
      {summary && viewMode === "center" && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🏢 Breakdown by Center</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(summary.byCenter).map(([center, data]) => (
              <div key={center} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-700">{center}</span>
                  <span className="text-sm text-gray-500">{data.count} staff</span>
                </div>
                <p className="text-lg font-bold text-green-600">{formatCurrency(data.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Detailed Records</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Center</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teaching Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tax</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      No payroll records found for the selected period
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => {
                    const tax = calculateTax(record.totalAmount);
                    const netAmount = record.totalAmount - tax;
                    return (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{record.teacherName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {extractRole(record.notes)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{record.centerName || "-"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{record.teachingHours}h</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{formatCurrency(record.baseSalary)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{formatCurrency(record.teachingAmount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-green-600">{formatCurrency(record.totalAmount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-red-600">{formatCurrency(tax)}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-blue-600">{formatCurrency(netAmount)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tax Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3">🧾 Vietnam Personal Income Tax Rates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <p className="font-semibold mb-2">Tax Brackets:</p>
            <ul className="space-y-1">
              <li>• 0 - 5M: <strong>5%</strong></li>
              <li>• 5M - 10M: <strong>10%</strong></li>
              <li>• 10M - 18M: <strong>15%</strong></li>
              <li>• 18M - 32M: <strong>20%</strong></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-2">Higher Brackets:</p>
            <ul className="space-y-1">
              <li>• 32M - 52M: <strong>25%</strong></li>
              <li>• 52M - 80M: <strong>30%</strong></li>
              <li>• Over 80M: <strong>35%</strong></li>
            </ul>
          </div>
        </div>
        <p className="mt-4 text-sm text-blue-700">
          <strong>Note:</strong> Tax calculated after 11M VND deduction (personal allowance + dependents)
        </p>
      </div>
    </div>
  );
}
