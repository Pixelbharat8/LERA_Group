"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { apiFetch } from "../../../../lib/api";

interface FinancialData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  monthlyGrowth: number;
  byCenter: { centerId: string; centerName: string; revenue: number; expenses: number }[];
  byMonth: { month: string; revenue: number; expenses: number }[];
  topCourses: { name: string; revenue: number; students: number }[];
}

export default function CEOFinancePage() {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<"month" | "quarter" | "year">("month");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchFinancialData();
  }, [selectedPeriod, selectedYear]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const [revenueData, expenseData, centerData, paymentsData, enrollmentsData] = await Promise.all([
        apiFetch(`/api/finance/revenue?period=${selectedPeriod}&year=${selectedYear}`).catch(() => null),
        apiFetch(`/api/finance/expenses?period=${selectedPeriod}&year=${selectedYear}`).catch(() => null),
        apiFetch("/api/centers").catch(() => []),
        apiFetch("/api/payments").catch(() => []),
        apiFetch("/api/enrollments").catch(() => []),
      ]);

      // Process real data or use demo
      const centers = Array.isArray(centerData) ? centerData : [];
      const paymentList = Array.isArray(paymentsData) ? paymentsData : [];
      const enrollmentList = Array.isArray(enrollmentsData) ? enrollmentsData : [];
      
      // Calculate total revenue from payments
      const totalPaidAmount = paymentList
        .filter((p: any) => p.status === "PAID" || p.status === "paid" || p.status === "COMPLETED")
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      const actualRevenue = revenueData?.total || totalPaidAmount || 0;
      const actualExpenses = expenseData?.total || 0;
      
      setFinancialData({
        totalRevenue: actualRevenue,
        totalExpenses: actualExpenses,
        netProfit: actualRevenue - actualExpenses,
        monthlyGrowth: revenueData?.growth || 0,
        byCenter: centers.length > 0 
          ? centers.map((c: any) => {
              const cid = String(c.id);
              const centerRev = paymentList
                .filter((p: any) => String(p.centerId) === cid && (p.status === "PAID" || p.status === "paid" || p.status === "COMPLETED"))
                .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
              return {
                centerId: cid,
                centerName: c.name,
                revenue: centerRev,
                expenses: 0,
              };
            })
          : [],
        byMonth: (() => {
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          return months.map((m, idx) => {
            const monthPayments = paymentList.filter((p: any) => {
              const d = new Date(p.paymentDate || p.createdAt);
              return d.getMonth() === idx && (p.status === "PAID" || p.status === "paid" || p.status === "COMPLETED");
            });
            return {
              month: m,
              revenue: monthPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
              expenses: 0,
            };
          });
        })(),
        topCourses: (() => {
          if (!Array.isArray(enrollmentList) || enrollmentList.length === 0) return [];
          const courseMap: Record<string, { name: string; revenue: number; students: number }> = {};
          enrollmentList.forEach((e: any) => {
            const courseName = e.courseName || e.course?.name || "Unknown Course";
            if (!courseMap[courseName]) courseMap[courseName] = { name: courseName, revenue: 0, students: 0 };
            courseMap[courseName].students++;
          });
          return Object.values(courseMap).sort((a, b) => b.students - a.students).slice(0, 5);
        })(),
      });
    } catch (error) {
      console.error("Error fetching financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) return `₫${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `₫${(amount / 1000000).toFixed(0)}M`;
    return `₫${amount.toLocaleString()}`;
  };

  const formatPercentage = (value: number) => {
    return value > 0 ? `+${value.toFixed(1)}%` : `${value.toFixed(1)}%`;
  };

  if (loading || !financialData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const profitMargin = ((financialData.netProfit / financialData.totalRevenue) * 100).toFixed(1);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Financial Reports</h1>
          <p className="text-gray-600">Executive financial overview and analysis</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/ceo" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            ← Back to Dashboard
          </Link>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            📥 Export Report
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            {(["month", "quarter", "year"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  selectedPeriod === period ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border rounded-lg"
          >
            {[2024, 2025, 2026].map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow p-6">
          <p className="text-green-100 text-sm">Total Revenue</p>
          <p className="text-3xl font-bold">{formatCurrency(financialData.totalRevenue)}</p>
          <p className="text-green-100 text-sm mt-2">
            {formatPercentage(financialData.monthlyGrowth)} vs last period
          </p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl shadow p-6">
          <p className="text-red-100 text-sm">Total Expenses</p>
          <p className="text-3xl font-bold">{formatCurrency(financialData.totalExpenses)}</p>
          <p className="text-red-100 text-sm mt-2">
            {((financialData.totalExpenses / financialData.totalRevenue) * 100).toFixed(1)}% of revenue
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow p-6">
          <p className="text-blue-100 text-sm">Net Profit</p>
          <p className="text-3xl font-bold">{formatCurrency(financialData.netProfit)}</p>
          <p className="text-blue-100 text-sm mt-2">{profitMargin}% profit margin</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow p-6">
          <p className="text-purple-100 text-sm">Monthly Growth</p>
          <p className="text-3xl font-bold">{formatPercentage(financialData.monthlyGrowth)}</p>
          <p className="text-purple-100 text-sm mt-2">Year over year</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Month */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold mb-4">Monthly Revenue Trend</h3>
          <div className="space-y-3">
            {financialData.byMonth.map((item) => {
              const maxRevenue = Math.max(...financialData.byMonth.map(m => m.revenue));
              const width = (item.revenue / maxRevenue) * 100;
              return (
                <div key={item.month} className="flex items-center gap-3">
                  <span className="w-10 text-sm text-gray-600">{item.month}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${width}%` }}
                    >
                      <span className="text-white text-xs font-medium">{formatCurrency(item.revenue)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue by Center */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold mb-4">Revenue by Center</h3>
          <div className="space-y-4">
            {financialData.byCenter.map((center) => {
              const maxRevenue = Math.max(...financialData.byCenter.map(c => c.revenue));
              const width = (center.revenue / maxRevenue) * 100;
              const profit = center.revenue - center.expenses;
              return (
                <div key={center.centerId}>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-sm">{center.centerName}</span>
                    <span className="text-sm text-green-600">+{formatCurrency(profit)}</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Revenue: {formatCurrency(center.revenue)}</span>
                    <span>Expenses: {formatCurrency(center.expenses)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Courses */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-bold mb-4">Top Revenue Generating Courses</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Rank</th>
                <th className="text-left py-3 px-4">Course Name</th>
                <th className="text-right py-3 px-4">Revenue</th>
                <th className="text-right py-3 px-4">Students</th>
                <th className="text-right py-3 px-4">Avg/Student</th>
                <th className="text-right py-3 px-4">Share</th>
              </tr>
            </thead>
            <tbody>
              {financialData.topCourses.map((course, index) => {
                const totalCourseRevenue = financialData.topCourses.reduce((sum, c) => sum + c.revenue, 0);
                const share = ((course.revenue / totalCourseRevenue) * 100).toFixed(1);
                const avgPerStudent = course.revenue / course.students;
                return (
                  <tr key={course.name} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className={`w-8 h-8 flex items-center justify-center rounded-full text-white ${
                        index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : index === 2 ? "bg-orange-400" : "bg-gray-300"
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">{course.name}</td>
                    <td className="py-3 px-4 text-right text-green-600 font-semibold">
                      {formatCurrency(course.revenue)}
                    </td>
                    <td className="py-3 px-4 text-right">{course.students}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(avgPerStudent)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-gray-100 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${share}%` }}></div>
                        </div>
                        <span className="text-sm">{share}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h4 className="font-semibold mb-3">💡 Key Insights</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• IELTS Preparation remains the top revenue generator</li>
            <li>• Main Center contributes 33% of total revenue</li>
            <li>• Q4 shows seasonal decline - consider promotions</li>
            <li>• Profit margin improved by 2.3% vs last year</li>
          </ul>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h4 className="font-semibold mb-3">📈 Recommendations</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Expand IELTS program to satellite centers</li>
            <li>• Optimize expenses in underperforming branches</li>
            <li>• Launch holiday promotions for Q4 boost</li>
            <li>• Consider new Business English packages</li>
          </ul>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h4 className="font-semibold mb-3">⚠️ Action Items</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Review Ngô Quyền branch performance</li>
            <li>• Approve Q1 marketing budget</li>
            <li>• Schedule board meeting for expansion</li>
            <li>• Finalize teacher salary adjustments</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
