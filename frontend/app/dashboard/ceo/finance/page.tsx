"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { exportToCsv, datedFilename } from "../../../../lib/export-csv";

interface MonthPL {
  month: string;
  revenue: number;
  expenses: number; // teacher payroll
}

interface FinancialData {
  totalRevenue: number;
  totalExpenses: number; // teacher payroll
  netProfit: number;
  monthlyGrowth: number;
  newStudents: number;
  expensesTracked: boolean;
  byCenter: { centerId: string; centerName: string; revenue: number }[];
  byMonth: MonthPL[];
  topCourses: { name: string; students: number }[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function CEOFinancePage() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<"month" | "quarter" | "year">("year");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchFinancialData();
  }, [selectedPeriod, selectedYear]);

  // Period window [start, end) — mirrors the backend (latest month/quarter of the year, or full year).
  const periodWindow = (): [Date, Date] => {
    const now = new Date();
    const y = selectedYear;
    if (selectedPeriod === "month") {
      const m = y === now.getFullYear() ? now.getMonth() : 11;
      return [new Date(y, m, 1), new Date(y, m + 1, 1)];
    }
    if (selectedPeriod === "quarter") {
      const q = y === now.getFullYear() ? Math.floor(now.getMonth() / 3) * 3 : 9;
      return [new Date(y, q, 1), new Date(y, q + 3, 1)];
    }
    return [new Date(y, 0, 1), new Date(y + 1, 0, 1)];
  };

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const [revenueData, expenseData, centerData, paymentsData, enrollmentsData, studentsData] =
        await Promise.all([
          apiFetch(`/api/finance/revenue?period=${selectedPeriod}&year=${selectedYear}`).catch(() => null),
          apiFetch(`/api/finance/expenses?period=${selectedPeriod}&year=${selectedYear}`).catch(() => null),
          apiFetch("/api/centers").catch(() => []),
          apiFetch("/api/payments").catch(() => []),
          apiFetch("/api/enrollments").catch(() => []),
          apiFetch("/api/students").catch(() => []),
        ]);

      const centers = Array.isArray(centerData) ? centerData : [];
      const payments = Array.isArray(paymentsData) ? paymentsData : [];
      const enrollments = Array.isArray(enrollmentsData) ? enrollmentsData : [];
      const students = Array.isArray(studentsData) ? studentsData : [];
      const isPaid = (p: any) => ["PAID", "paid", "COMPLETED", "completed"].includes(p.status);

      const totalRevenue = revenueData?.total ?? payments.filter(isPaid).reduce((s: number, p: any) => s + (p.amount || 0), 0);
      const totalExpenses = expenseData?.total ?? 0;

      // Monthly revenue from real payments, scoped to the selected year. Use createdAt as the
      // accounting date — the same basis the backend revenue endpoint uses — so the table/chart
      // totals line up with the headline (seed paidAt/paymentDate fields are stale).
      const revByMonthIdx = MONTHS.map((_, idx) =>
        payments
          .filter((p: any) => {
            const d = new Date(p.createdAt || p.paidAt || p.paymentDate);
            return d.getFullYear() === selectedYear && d.getMonth() === idx && isPaid(p);
          })
          .reduce((s: number, p: any) => s + (p.amount || 0), 0)
      );
      // Monthly expenses (teacher payroll) come from the backend, aligned Jan–Dec.
      const expByMonth: { month: string; expenses: number }[] = Array.isArray(expenseData?.byMonth)
        ? expenseData.byMonth
        : MONTHS.map((m) => ({ month: m, expenses: 0 }));
      const expByMonthIdx = MONTHS.map(
        (m) => Number(expByMonth.find((e) => e.month === m)?.expenses) || 0
      );
      const byMonth: MonthPL[] = MONTHS.map((m, i) => ({
        month: m,
        revenue: revByMonthIdx[i],
        expenses: expByMonthIdx[i],
      }));

      // New students acquired within the selected period window.
      const [winStart, winEnd] = periodWindow();
      // "New" = when the student record was created (createdAt) — the seed enrollmentDate is stale.
      const newStudents = students.filter((s: any) => {
        const raw = s.createdAt || s.created_at || s.enrollmentDate;
        if (!raw) return false;
        const d = new Date(raw);
        return d >= winStart && d < winEnd;
      }).length;

      // Revenue by centre (real, from paid payments).
      const byCenter = centers.map((c: any) => {
        const cid = String(c.id);
        const revenue = payments
          .filter((p: any) => String(p.centerId) === cid && isPaid(p))
          .reduce((s: number, p: any) => s + (p.amount || 0), 0);
        return { centerId: cid, centerName: c.name, revenue };
      });

      // Course popularity by enrolment count (no fabricated per-course revenue).
      const courseMap: Record<string, { name: string; students: number }> = {};
      enrollments.forEach((e: any) => {
        const name = e.courseName || e.course?.name || e.programName || "Unknown Course";
        (courseMap[name] ||= { name, students: 0 }).students++;
      });
      const topCourses = Object.values(courseMap).sort((a, b) => b.students - a.students).slice(0, 5);

      setData({
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        monthlyGrowth: revenueData?.growth || 0,
        newStudents,
        expensesTracked: expenseData?.tracked !== false,
        byCenter,
        byMonth,
        topCourses,
      });
    } catch (error) {
      console.error("Error fetching financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (a: number) => {
    const neg = a < 0;
    const v = Math.abs(a);
    let s: string;
    if (v >= 1_000_000_000) s = `₫${(v / 1_000_000_000).toFixed(1)}B`;
    else if (v >= 1_000_000) s = `₫${(v / 1_000_000).toFixed(1)}M`;
    else s = `₫${v.toLocaleString()}`;
    return neg ? `-${s}` : s;
  };
  const pct = (v: number) => (v > 0 ? `+${v.toFixed(1)}%` : `${v.toFixed(1)}%`);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const margin = data.totalRevenue > 0 ? (data.netProfit / data.totalRevenue) * 100 : 0;
  const isProfit = data.netProfit >= 0;
  // Real, computed insights (no hardcoded claims).
  const topCenter = [...data.byCenter].sort((a, b) => b.revenue - a.revenue)[0];
  const monthsWithRev = data.byMonth.filter((m) => m.revenue > 0);
  const bestMonth = [...monthsWithRev].sort((a, b) => b.revenue - a.revenue)[0];
  const expenseRatio = data.totalRevenue > 0 ? (data.totalExpenses / data.totalRevenue) * 100 : 0;
  const maxBar = Math.max(1, ...data.byMonth.map((m) => Math.max(m.revenue, m.expenses)));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Financial Reports — Profit &amp; Loss</h1>
          <p className="text-gray-600">Revenue (student payments) vs teacher payroll · real data</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/ceo" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            ← Back
          </Link>
          <button
            onClick={() =>
              exportToCsv(datedFilename("ceo-finance-pl"), data.byMonth, [
                { key: "month", label: "Month" },
                { key: "revenue", label: "Revenue" },
                { key: "expenses", label: "Teacher Payroll" },
                { key: (m) => m.revenue - m.expenses, label: "Profit/Loss" },
              ])
            }
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            📥 Export P&amp;L
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <span className="text-sm font-medium text-gray-500">Filter:</span>
          <div className="flex gap-2">
            {(["month", "quarter", "year"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
          <p className="text-3xl font-bold">{fmt(data.totalRevenue)}</p>
          <p className="text-green-100 text-sm mt-2">{pct(data.monthlyGrowth)} vs last period</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl shadow p-6">
          <p className="text-red-100 text-sm">Teacher Payroll (Expenses)</p>
          <p className="text-3xl font-bold">{fmt(data.totalExpenses)}</p>
          <p className="text-red-100 text-sm mt-2">{expenseRatio.toFixed(1)}% of revenue</p>
        </div>
        <div className={`bg-gradient-to-br ${isProfit ? "from-blue-500 to-blue-600" : "from-orange-500 to-orange-600"} text-white rounded-xl shadow p-6`}>
          <p className="text-blue-100 text-sm">Net {isProfit ? "Profit" : "Loss"}</p>
          <p className="text-3xl font-bold">{fmt(data.netProfit)}</p>
          <p className="text-blue-100 text-sm mt-2">{margin.toFixed(1)}% margin</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow p-6">
          <p className="text-purple-100 text-sm">New Students ({selectedPeriod})</p>
          <p className="text-3xl font-bold">{data.newStudents}</p>
          <p className="text-purple-100 text-sm mt-2">acquired this {selectedPeriod}</p>
        </div>
      </div>

      {/* Revenue vs Expenses — visual */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Revenue vs Teacher Payroll — {selectedYear}</h3>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Revenue</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block" /> Payroll</span>
          </div>
        </div>
        <div className="flex items-end gap-2 h-56">
          {data.byMonth.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="w-full flex items-end justify-center gap-0.5 h-48">
                <div
                  className="w-1/2 bg-gradient-to-t from-green-600 to-green-400 rounded-t transition-all hover:opacity-80"
                  style={{ height: `${(m.revenue / maxBar) * 100}%` }}
                  title={`Revenue: ${fmt(m.revenue)}`}
                />
                <div
                  className="w-1/2 bg-gradient-to-t from-red-500 to-red-300 rounded-t transition-all hover:opacity-80"
                  style={{ height: `${(m.expenses / maxBar) * 100}%` }}
                  title={`Payroll: ${fmt(m.expenses)}`}
                />
              </div>
              <span className="text-xs text-gray-500">{m.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* P&L breakdown table */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-bold mb-4">Monthly Profit &amp; Loss — {selectedYear}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="text-left py-3 px-4">Month</th>
                <th className="text-right py-3 px-4">Revenue</th>
                <th className="text-right py-3 px-4">Teacher Payroll</th>
                <th className="text-right py-3 px-4">Profit / Loss</th>
                <th className="text-right py-3 px-4">Margin</th>
              </tr>
            </thead>
            <tbody>
              {data.byMonth.map((m) => {
                const pl = m.revenue - m.expenses;
                const mgn = m.revenue > 0 ? (pl / m.revenue) * 100 : 0;
                const empty = m.revenue === 0 && m.expenses === 0;
                return (
                  <tr key={m.month} className={`border-b hover:bg-gray-50 ${empty ? "text-gray-300" : ""}`}>
                    <td className="py-2.5 px-4 font-medium">{m.month}</td>
                    <td className="py-2.5 px-4 text-right text-green-600">{fmt(m.revenue)}</td>
                    <td className="py-2.5 px-4 text-right text-red-500">{fmt(m.expenses)}</td>
                    <td className={`py-2.5 px-4 text-right font-semibold ${pl >= 0 ? "text-blue-600" : "text-orange-600"}`}>{fmt(pl)}</td>
                    <td className="py-2.5 px-4 text-right">{empty ? "—" : `${mgn.toFixed(0)}%`}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 font-bold bg-gray-50">
                <td className="py-3 px-4">Total ({selectedYear})</td>
                <td className="py-3 px-4 text-right text-green-700">
                  {fmt(data.byMonth.reduce((s, m) => s + m.revenue, 0))}
                </td>
                <td className="py-3 px-4 text-right text-red-600">
                  {fmt(data.byMonth.reduce((s, m) => s + m.expenses, 0))}
                </td>
                <td className={`py-3 px-4 text-right ${data.byMonth.reduce((s, m) => s + m.revenue - m.expenses, 0) >= 0 ? "text-blue-700" : "text-orange-700"}`}>
                  {fmt(data.byMonth.reduce((s, m) => s + m.revenue - m.expenses, 0))}
                </td>
                <td className="py-3 px-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
        {!data.expensesTracked && (
          <p className="text-xs text-gray-400 mt-3">
            Teacher payroll not yet recorded for this range — payroll figures show as ₫0.
          </p>
        )}
      </div>

      {/* Revenue by Center + Top Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold mb-4">Revenue by Center</h3>
          <div className="space-y-4">
            {data.byCenter.length === 0 && <p className="text-gray-400 text-sm">No center revenue yet.</p>}
            {data.byCenter.map((center) => {
              const max = Math.max(1, ...data.byCenter.map((c) => c.revenue));
              return (
                <div key={center.centerId}>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-sm">{center.centerName}</span>
                    <span className="text-sm text-green-600">{fmt(center.revenue)}</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(center.revenue / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold mb-4">Most Popular Courses (by enrolment)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="text-left py-2 px-3">#</th>
                  <th className="text-left py-2 px-3">Course</th>
                  <th className="text-right py-2 px-3">Students</th>
                </tr>
              </thead>
              <tbody>
                {data.topCourses.length === 0 && (
                  <tr><td colSpan={3} className="py-4 text-center text-gray-400">No enrolments yet.</td></tr>
                )}
                {data.topCourses.map((course, i) => (
                  <tr key={course.name} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">{i + 1}</td>
                    <td className="py-2 px-3 font-medium">{course.name}</td>
                    <td className="py-2 px-3 text-right">{course.students}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Real computed insights (no hardcoded claims) */}
      <div className="bg-white rounded-xl shadow p-6">
        <h4 className="font-semibold mb-3">💡 Insights (computed)</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• {selectedYear} {selectedPeriod} result: <span className={isProfit ? "text-blue-600 font-medium" : "text-orange-600 font-medium"}>{isProfit ? "Profit" : "Loss"} of {fmt(Math.abs(data.netProfit))}</span> at {margin.toFixed(1)}% margin.</li>
          <li>• Teacher payroll is {expenseRatio.toFixed(1)}% of revenue.</li>
          {topCenter && topCenter.revenue > 0 && (
            <li>• Top center by revenue: <span className="font-medium">{topCenter.centerName}</span> ({fmt(topCenter.revenue)}).</li>
          )}
          {bestMonth && (
            <li>• Strongest revenue month: <span className="font-medium">{bestMonth.month}</span> ({fmt(bestMonth.revenue)}).</li>
          )}
          <li>• {data.newStudents} new student{data.newStudents === 1 ? "" : "s"} acquired this {selectedPeriod}.</li>
        </ul>
      </div>
    </div>
  );
}
