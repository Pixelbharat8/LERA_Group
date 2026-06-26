"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { useUserCenter, buildCenterFilterUrl } from "../../../hooks/useUserCenter";

interface CRMAnalytics {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  qualifiedLeads: number;
  trialBookedLeads: number;
  trialAttendedLeads: number;
  convertedLeads: number;
  lostLeads: number;
  conversionRate: number;
  avgTimeToConvert: number;
  leadsBySource: { source: string; count: number }[];
  leadsByCenter: { center: string; count: number }[];
  monthlyTrend: { month: string; leads: number; converted: number }[];
}

interface Center {
  id: string;
  name: string;
}

export default function CRMAnalyticsPage() {
  const { centerId: userCenterId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<CRMAnalytics>({
    totalLeads: 0,
    newLeads: 0,
    contactedLeads: 0,
    qualifiedLeads: 0,
    trialBookedLeads: 0,
    trialAttendedLeads: 0,
    convertedLeads: 0,
    lostLeads: 0,
    conversionRate: 0,
    avgTimeToConvert: 0,
    leadsBySource: [],
    leadsByCenter: [],
    monthlyTrend: [],
  });
  const [centers, setCenters] = useState<Center[]>([]);
  const [dateRange, setDateRange] = useState("30");

  useEffect(() => {
    if (!userLoading) {
      fetchAnalytics();
    }
  }, [dateRange, userLoading, userCenterId, shouldFilterByCenter]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const leadsUrl = buildCenterFilterUrl(
        "/api/leads",
        shouldFilterByCenter ? userCenterId : null
      );
      const [leadsData, centersData] = await Promise.all([
        apiFetch(leadsUrl).catch(() => []),
        apiFetch("/api/centers").catch(() => []),
      ]);

      const leads = Array.isArray(leadsData) ? leadsData : [];
      const centersArr = Array.isArray(centersData) ? centersData : [];
      setCenters(centersArr);

      // Calculate analytics
      const newLeads = leads.filter((l: any) => l.status === "NEW").length;
      const contacted = leads.filter((l: any) => l.status === "CONTACTED").length;
      const qualified = leads.filter((l: any) => l.status === "QUALIFIED").length;
      const trialBooked = leads.filter((l: any) => l.status === "TRIAL_BOOKED").length;
      const trialAttended = leads.filter((l: any) => l.status === "TRIAL_ATTENDED").length;
      const converted = leads.filter((l: any) => l.status === "CONVERTED").length;
      const lost = leads.filter((l: any) => l.status === "LOST" || l.status === "NO_SHOW").length;

      // Leads by source
      const sourceMap: Record<string, number> = {};
      leads.forEach((l: any) => {
        const src = l.utmSource || l.source || "Direct";
        sourceMap[src] = (sourceMap[src] || 0) + 1;
      });

      // Leads by center
      const centerMap: Record<string, number> = {};
      leads.forEach((l: any) => {
        const centerName = centersArr.find((c: Center) => c.id === l.centerId)?.name || "Unassigned";
        centerMap[centerName] = (centerMap[centerName] || 0) + 1;
      });

      // Monthly trend (last 6 months)
      const monthlyData: Record<string, { leads: number; converted: number }> = {};
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
        monthlyData[key] = { leads: 0, converted: 0 };
      }
      
      leads.forEach((l: any) => {
        if (l.createdAt) {
          const d = new Date(l.createdAt);
          const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
          if (monthlyData[key]) {
            monthlyData[key].leads++;
            if (l.status === "CONVERTED") monthlyData[key].converted++;
          }
        }
      });

      setAnalytics({
        totalLeads: leads.length,
        newLeads,
        contactedLeads: contacted,
        qualifiedLeads: qualified,
        trialBookedLeads: trialBooked,
        trialAttendedLeads: trialAttended,
        convertedLeads: converted,
        lostLeads: lost,
        conversionRate: leads.length > 0 ? Math.round((converted / leads.length) * 100) : 0,
        // Real avg days from lead creation to conversion (0 when no converted leads with timestamps).
        avgTimeToConvert: (() => {
          const cv = leads.filter((l: any) => l.status === "CONVERTED" && l.createdAt && l.updatedAt);
          if (!cv.length) return 0;
          const totalDays = cv.reduce((s: number, l: any) =>
            s + Math.max(0, (new Date(l.updatedAt).getTime() - new Date(l.createdAt).getTime()) / 864e5), 0);
          return Math.round(totalDays / cv.length);
        })(),
        leadsBySource: Object.entries(sourceMap).map(([source, count]) => ({ source, count })),
        leadsByCenter: Object.entries(centerMap).map(([center, count]) => ({ center, count })),
        monthlyTrend: Object.entries(monthlyData).map(([month, data]) => ({ month, ...data })),
      });
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
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
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/crm" className="hover:text-blue-600">CRM</Link>
            <span>/</span>
            <span className="text-gray-900">Analytics</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">📈 CRM Analytics</h1>
          <p className="text-gray-500">Executive overview of lead management performance</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-xs uppercase">Total Leads</h3>
          <p className="text-2xl font-bold">{analytics.totalLeads}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-cyan-500">
          <h3 className="text-gray-500 text-xs uppercase">New</h3>
          <p className="text-2xl font-bold text-cyan-600">{analytics.newLeads}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-yellow-500">
          <h3 className="text-gray-500 text-xs uppercase">Contacted</h3>
          <p className="text-2xl font-bold text-yellow-600">{analytics.contactedLeads}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-500">
          <h3 className="text-gray-500 text-xs uppercase">Qualified</h3>
          <p className="text-2xl font-bold text-green-600">{analytics.qualifiedLeads}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-purple-500">
          <h3 className="text-gray-500 text-xs uppercase">Converted</h3>
          <p className="text-2xl font-bold text-purple-600">{analytics.convertedLeads}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-500">
          <h3 className="text-gray-500 text-xs uppercase">Lost</h3>
          <p className="text-2xl font-bold text-red-600">{analytics.lostLeads}</p>
        </div>
      </div>

      {/* Conversion Rate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4">🎯 Conversion Rate</h3>
          <div className="flex items-center gap-4">
            <div className="text-5xl font-bold text-green-600">{analytics.conversionRate}%</div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                  style={{ width: `${analytics.conversionRate}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {analytics.convertedLeads} converted out of {analytics.totalLeads} total leads
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4">📊 Lead Pipeline</h3>
          <div className="space-y-3">
            {[
              { label: "New", value: analytics.newLeads, color: "bg-blue-500" },
              { label: "Contacted", value: analytics.contactedLeads, color: "bg-yellow-500" },
              { label: "Qualified", value: analytics.qualifiedLeads, color: "bg-green-500" },
              { label: "Trial booked", value: analytics.trialBookedLeads, color: "bg-indigo-500" },
              { label: "Trial done", value: analytics.trialAttendedLeads, color: "bg-teal-500" },
              { label: "Converted", value: analytics.convertedLeads, color: "bg-purple-500" },
              { label: "Lost", value: analytics.lostLeads, color: "bg-red-500" },
            ].map((stage) => (
              <div key={stage.label} className="flex items-center gap-2">
                <span className="w-20 text-sm text-gray-600">{stage.label}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${stage.color} transition-all duration-500`}
                    style={{ width: `${analytics.totalLeads > 0 ? (stage.value / analytics.totalLeads) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-10 text-right font-medium">{stage.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leads by Source & Center */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4">🌐 Leads by Source</h3>
          {analytics.leadsBySource.length > 0 ? (
            <div className="space-y-2">
              {analytics.leadsBySource
                .sort((a, b) => b.count - a.count)
                .map((item) => (
                  <div key={item.source} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{item.source}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No data available</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4">🏢 Leads by Center</h3>
          {analytics.leadsByCenter.length > 0 ? (
            <div className="space-y-2">
              {analytics.leadsByCenter
                .sort((a, b) => b.count - a.count)
                .map((item) => (
                  <div key={item.center} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{item.center}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No data available</p>
          )}
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-4">📅 Monthly Trend (Last 6 Months)</h3>
        <div className="grid grid-cols-6 gap-4">
          {analytics.monthlyTrend.map((month) => (
            <div key={month.month} className="text-center">
              <div className="h-32 flex flex-col justify-end items-center gap-1">
                <div 
                  className="w-full bg-blue-200 rounded-t"
                  style={{ height: `${Math.max(10, (month.leads / Math.max(...analytics.monthlyTrend.map(m => m.leads), 1)) * 100)}%` }}
                />
                <div 
                  className="w-full bg-green-500 rounded-t -mt-1"
                  style={{ height: `${Math.max(5, (month.converted / Math.max(...analytics.monthlyTrend.map(m => m.leads), 1)) * 100)}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-gray-500">{month.month}</div>
              <div className="text-sm font-medium">{month.leads} / {month.converted}</div>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-200 rounded"></div> Total Leads
          </span>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div> Converted
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-4">⚡ Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/crm/leads"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            📋 Manage Leads
          </Link>
          <Link
            href="/dashboard/crm/followups"
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            📞 Follow-ups
          </Link>
          <Link
            href="/dashboard/crm/registrations"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            📝 Registrations
          </Link>
          <Link
            href="/dashboard/chairman/marketing/ads-campaigns"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            📣 Marketing Campaigns
          </Link>
        </div>
      </div>
    </div>
  );
}
