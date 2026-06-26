"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../lib/api";
import { useUserCenter, buildCenterFilterUrl } from "../../hooks/useUserCenter";
import { useLanguage } from "../../context/LanguageContext";

interface FinanceStats {
  totalRevenue: number;
  monthlyRevenue: number;
  outstandingBalance: number;
  refundedAmount: number;
  collectionRate: number;
  studentsPaying: number;
  overdueCount: number;
  invoiceCount: number;
}

interface CenterRevenue {
  id: string;
  name: string;
  revenue: number;
  students: number;
  collected: number;
  outstanding: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  collected: number;
  refunds: number;
}

interface RecentTransaction {
  id: string;
  type: "PAYMENT" | "INVOICE" | "REFUND";
  description: string;
  amount: number;
  date: string;
  status: string;
}

export default function FinanceDashboardPage() {
  const { centerId: userCenterId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const { t } = useLanguage();
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [centerRevenue, setCenterRevenue] = useState<CenterRevenue[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "quarter" | "year">("month");

  useEffect(() => {
    if (!userLoading) {
      fetchData();
    }
  }, [selectedPeriod, userLoading, userCenterId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const dashboardUrl = buildCenterFilterUrl('/api/finance/dashboard', shouldFilterByCenter ? userCenterId : null);
      const centersUrl = buildCenterFilterUrl('/api/finance/revenue/by-center', shouldFilterByCenter ? userCenterId : null);
      const [dashboardData, centersData, allCenters] = await Promise.all([
        apiFetch(dashboardUrl).catch(() => null),
        apiFetch(centersUrl).catch(() => []),
        apiFetch('/api/centers').catch(() => [])  // resolve real centre names (payment svc only has the UUID)
      ]);
      const centerNameById = new Map(
        (Array.isArray(allCenters) ? allCenters : []).map((c: any) => [String(c.id), c.name])
      );

      if (dashboardData) {
        setStats({
          totalRevenue: dashboardData.totalRevenue || 0,
          monthlyRevenue: dashboardData.thisMonthRevenue ?? dashboardData.totalRevenue ?? 0,
          outstandingBalance: dashboardData.outstandingAmount || 0,
          refundedAmount: dashboardData.refundedAmount || 0,
          collectionRate: dashboardData.invoiceStats?.paid > 0 ? 
            Math.round((dashboardData.invoiceStats.paid / dashboardData.invoiceStats.total * 100)) : 0,
          studentsPaying: dashboardData.activePlans || 0,
          overdueCount: dashboardData.invoiceStats?.overdue || 0,
          invoiceCount: dashboardData.invoiceStats?.total || 0
        });
      } else {
        // Show empty stats when no data
        setStats({
          totalRevenue: 0,
          monthlyRevenue: 0,
          outstandingBalance: 0,
          refundedAmount: 0,
          collectionRate: 0,
          studentsPaying: 0,
          overdueCount: 0,
          invoiceCount: 0
        });
      }

      if (Array.isArray(centersData) && centersData.length > 0) {
        setCenterRevenue(centersData.map((c: any) => ({
          id: c.centerId || c.id,
          name: c.centerName || centerNameById.get(String(c.centerId || c.id)) || c.name || 'Unknown Center',
          revenue: Number(c.totalRevenue) || 0,
          students: Number(c.studentCount ?? c.invoiceCount) || 0,
          collected: Number(c.totalRevenue) || 0,
          outstanding: Number(c.outstanding) || 0
        })));
      } else {
        setCenterRevenue([]);
      }

      // Fetch recent transactions
      try {
        const payments = await apiFetch('/api/payments?limit=10');
        if (Array.isArray(payments)) {
          setRecentTransactions(payments.slice(0, 10).map((p: any) => ({
            id: p.id,
            type: "PAYMENT" as const,
            description: p.description || `Payment #${p.id?.slice(0, 8)}`,
            amount: p.amount || 0,
            date: p.paymentDate || p.createdAt?.split('T')[0] || '',
            status: p.status || 'COMPLETED'
          })));
        }
      } catch {
        setRecentTransactions([]);
      }

      try {
        // Real 12-month completed-revenue trend from the finance service.
        const monthlyUrl = buildCenterFilterUrl('/api/finance/revenue/monthly', shouldFilterByCenter ? userCenterId : null);
        const monthly = await apiFetch(monthlyUrl);
        const arr = Array.isArray(monthly) ? monthly : [];
        // Endpoint returns real completed (collected) revenue per month. Outstanding/refunds aren't
        // broken out monthly, so collected == revenue and refunds = 0 (honest, no fabrication).
        setMonthlyData(arr.map((m: any) => {
          const rev = Number(m.revenue) || 0;
          return { month: m.month, revenue: rev, collected: rev, refunds: 0 };
        }));
      } catch {
        setMonthlyData([]);
      }
    } catch (err) {
      console.error("Error fetching finance data:", err);
      // Show empty state on error
      setStats({
        totalRevenue: 0,
        monthlyRevenue: 0,
        outstandingBalance: 0,
        refundedAmount: 0,
        collectionRate: 0,
        studentsPaying: 0,
        overdueCount: 0,
        invoiceCount: 0
      });
      setCenterRevenue([]);
      setMonthlyData([]);
      setRecentTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  // Avoid Math.max(...[]) => -Infinity when there is no data yet
  const maxRevenue = Math.max(1, ...monthlyData.map((d) => d.revenue || 0));

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/superadmin" className="hover:text-blue-600">{t("dashboard")}</Link>
            <span>/</span>
            <span className="text-gray-900">{t("financeOverview")}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">💰 {t("financeDashboard")}</h1>
          <p className="text-gray-500">{t("financeOverview")}</p>
        </div>
        <div className="flex gap-2">
          {["week", "month", "quarter", "year"].map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period as typeof selectedPeriod)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/dashboard/finance/invoices" className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">🧾</div>
          <div>
            <p className="font-medium">{t("invoices")}</p>
            <p className="text-sm text-gray-500">{t("generateManage")}</p>
          </div>
        </Link>
        <Link href="/dashboard/finance/fee-rules" className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-2xl">⚙️</div>
          <div>
            <p className="font-medium">{t("feeRules")}</p>
            <p className="text-sm text-gray-500">{t("configureFees")}</p>
          </div>
        </Link>
        <Link href="/dashboard/finance/discounts" className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-2xl">🏷️</div>
          <div>
            <p className="font-medium">{t("discounts")}</p>
            <p className="text-sm text-gray-500">{t("manageDiscounts")}</p>
          </div>
        </Link>
        <Link href="/dashboard/finance/refunds" className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-2xl">💸</div>
          <div>
            <p className="font-medium">{t("refunds")}</p>
            <p className="text-sm text-gray-500">{t("processRefunds")}</p>
          </div>
        </Link>
      </div>

      {/* Main Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">{t("totalRevenueLabel")}</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-xs text-green-200 mt-2">📈 All time earnings</p>
              </div>
              <div className="text-4xl opacity-80">💵</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">{t("thisMonth")}</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(stats.monthlyRevenue)}</p>
                <p className="text-xs text-blue-200 mt-2">{stats.invoiceCount} invoices generated</p>
              </div>
              <div className="text-4xl opacity-80">📊</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">{t("outstandingBalance")}</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(stats.outstandingBalance)}</p>
                <p className="text-xs text-orange-200 mt-2">⚠️ {stats.overdueCount} overdue</p>
              </div>
              <div className="text-4xl opacity-80">⏳</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">{t("collectionRate")}</p>
                <p className="text-2xl font-bold mt-1">{stats.collectionRate}%</p>
                <p className="text-xs text-purple-200 mt-2">{stats.studentsPaying} students paying</p>
              </div>
              <div className="text-4xl opacity-80">✅</div>
            </div>
          </div>
        </div>
      )}

      {/* Charts & Center Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-lg mb-4">📈 Revenue Trend (Last 6 Months)</h3>

          {monthlyData.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              No revenue trend data yet.
              <div className="text-sm mt-1">Once you record payments/invoices, this chart will populate automatically.</div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {monthlyData.map((data, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{data.month}</span>
                      <span className="text-gray-600">{formatCurrency(data.revenue)}</span>
                    </div>
                    <div className="flex gap-1 h-6">
                      <div
                        className="bg-green-500 rounded-l"
                        style={{ width: `${(data.collected / maxRevenue) * 100}%` }}
                        title={`Collected: ${formatCurrency(data.collected)}`}
                      />
                      <div
                        className="bg-orange-400"
                        style={{ width: `${((data.revenue - data.collected) / maxRevenue) * 100}%` }}
                        title={`Outstanding: ${formatCurrency(data.revenue - data.collected)}`}
                      />
                      {data.refunds > 0 && (
                        <div
                          className="bg-red-400 rounded-r"
                          style={{ width: `${(data.refunds / maxRevenue) * 100}%` }}
                          title={`Refunds: ${formatCurrency(data.refunds)}`}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500" />
                  <span>Collected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-orange-400" />
                  <span>Outstanding</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-400" />
                  <span>Refunds</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Center Revenue */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-lg mb-4">🏢 {t("revenueByCenter")}</h3>

          {centerRevenue.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              No center revenue yet.
              <div className="text-sm mt-1">Create invoices/payments for centers to see revenue distribution here.</div>
            </div>
          ) : (
            <div className="space-y-4">
              {centerRevenue.map((center) => {
                const total = center.revenue || 1;
                const collectedPct = (center.collected / total) * 100;
                return (
                  <div key={center.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{center.name}</p>
                        <p className="text-sm text-gray-500">{center.students} students</p>
                      </div>
                      <p className="font-bold text-green-600">{formatCurrency(center.revenue)}</p>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${collectedPct}%` }} />
                    </div>
                    <div className="flex justify-between text-xs mt-2 text-gray-500">
                      <span>Collected: {formatCurrency(center.collected)}</span>
                      <span>Outstanding: {formatCurrency(center.outstanding)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="font-bold text-lg">📝 {t("recentTransactions")}</h3>
          <Link href="/dashboard/payments" className="text-blue-600 hover:text-blue-800 text-sm">
            {t("viewAll")} →
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No recent transactions yet.
            <div className="text-sm mt-1">Record a payment to see it appear here.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("type")}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("description")}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("amount")}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("date")}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          tx.type === "PAYMENT"
                            ? "bg-green-100 text-green-800"
                            : tx.type === "INVOICE"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">{tx.description}</td>
                    <td className={`px-6 py-4 font-medium ${tx.amount < 0 ? "text-red-600" : "text-green-600"}`}>
                      {tx.amount < 0 ? "" : "+"}
                      {formatCurrency(Math.abs(tx.amount))}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{tx.date}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          tx.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : tx.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Insights (real-data / empty-state only — no demo numbers) */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-bold text-lg mb-2">📌 Insights</h3>
        <p className="text-gray-500 text-sm mb-4">
          This section will populate once invoices, discounts, refunds, and payment breakdown endpoints are connected.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-gray-50 border">
            <div className="text-sm text-gray-600">Avg. Payment</div>
            <div className="text-xl font-bold">N/A</div>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 border">
            <div className="text-sm text-gray-600">Active Discounts</div>
            <div className="text-xl font-bold">N/A</div>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 border">
            <div className="text-sm text-gray-600">Overdue Invoices</div>
            <div className="text-xl font-bold">{stats?.overdueCount ?? 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
