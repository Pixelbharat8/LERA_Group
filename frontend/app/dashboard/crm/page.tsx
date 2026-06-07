"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUserCenter, buildCenterFilterUrl } from "../../hooks/useUserCenter";
import { apiFetch } from "../../../lib/api";
import { useLanguage } from "../../context/LanguageContext";

interface CRMStats {
  totalLeads: number;
  newLeads: number;
  convertedLeads: number;
  pendingFollowups: number;
  registrations: number;
  conversionRate: number;
}

export default function CRMDashboard() {
  const { centerId: userCenterId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const { t } = useLanguage();
  const [stats, setStats] = useState<CRMStats>({
    totalLeads: 0,
    newLeads: 0,
    convertedLeads: 0,
    pendingFollowups: 0,
    registrations: 0,
    conversionRate: 0,
  });
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLoading) {
      fetchCRMData();
    }
  }, [userLoading, userCenterId]);

  const fetchCRMData = async () => {
    try {
      const leadsUrl = buildCenterFilterUrl("/api/leads", shouldFilterByCenter ? userCenterId : null);
      // Use apiFetch (adds the JWT auth header + returns parsed JSON). Raw fetch() here
      // silently 401'd, so every stat showed 0. Endpoint is /api/followups (not /api/follow-ups).
      const [leads, followups] = await Promise.all([
        apiFetch(leadsUrl).catch(() => []),
        apiFetch("/api/followups").catch(() => []),
      ]);

      const leadsArray = Array.isArray(leads) ? leads : [];
      const convertedCount = leadsArray.filter((l: any) => l.status === "CONVERTED").length;

      setStats({
        totalLeads: leadsArray.length,
        newLeads: leadsArray.filter((l: any) => l.status === "NEW").length,
        convertedLeads: convertedCount,
        pendingFollowups: Array.isArray(followups) ? followups.filter((f: any) => f.status === "PENDING").length : 0,
        registrations: convertedCount,
        conversionRate: leadsArray.length > 0 ? Math.round((convertedCount / leadsArray.length) * 100) : 0,
      });

      setRecentLeads(leadsArray.slice(0, 5));
    } catch (err) {
      console.error("Failed to fetch CRM data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📞 {t("crmDashboard")}</h1>
          <p className="text-gray-500">{t("crmOverview")}</p>
        </div>
        <Link
          href="/dashboard/crm/leads"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add New Lead
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-xs uppercase">{t("totalLeads")}</h3>
          <p className="text-2xl font-bold">{stats.totalLeads}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-gray-500 text-xs uppercase">{t("newLeads")}</h3>
          <p className="text-2xl font-bold">{stats.newLeads}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <h3 className="text-gray-500 text-xs uppercase">{t("converted")}</h3>
          <p className="text-2xl font-bold">{stats.convertedLeads}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <h3 className="text-gray-500 text-xs uppercase">{t("followUps")}</h3>
          <p className="text-2xl font-bold">{stats.pendingFollowups}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-pink-500">
          <h3 className="text-gray-500 text-xs uppercase">{t("registrations")}</h3>
          <p className="text-2xl font-bold">{stats.registrations}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-teal-500">
          <h3 className="text-gray-500 text-xs uppercase">{t("conversionRate")}</h3>
          <p className="text-2xl font-bold">{stats.conversionRate}%</p>
        </div>
      </div>

      {/* Quick Links & Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">⚡ {t("quickActions")}</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/dashboard/crm/leads"
              className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center"
            >
              <span className="text-2xl">👥</span>
              <p className="font-medium mt-2">All Leads</p>
              <p className="text-sm text-gray-500">{stats.totalLeads} total</p>
            </Link>
            <Link
              href="/dashboard/crm/followups"
              className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-center"
            >
              <span className="text-2xl">📞</span>
              <p className="font-medium mt-2">Follow-ups</p>
              <p className="text-sm text-gray-500">{stats.pendingFollowups} pending</p>
            </Link>
            <Link
              href="/dashboard/crm/trials"
              className="p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors text-center"
            >
              <span className="text-2xl">🎓</span>
              <p className="font-medium mt-2">Trial Classes</p>
              <p className="text-sm text-gray-500">Book &amp; convert</p>
            </Link>
            <Link
              href="/dashboard/crm/renewals"
              className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center"
            >
              <span className="text-2xl">🔁</span>
              <p className="font-medium mt-2">Renewals</p>
              <p className="text-sm text-gray-500">Retain students</p>
            </Link>
            <Link
              href="/dashboard/crm/registrations"
              className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center"
            >
              <span className="text-2xl">✅</span>
              <p className="font-medium mt-2">Registrations</p>
              <p className="text-sm text-gray-500">{stats.registrations} completed</p>
            </Link>
            <Link
              href="/dashboard/superadmin/reports"
              className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center"
            >
              <span className="text-2xl">📊</span>
              <p className="font-medium mt-2">Reports</p>
              <p className="text-sm text-gray-500">View analytics</p>
            </Link>
          </div>
        </div>

        {/* Recent Leads */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">🆕 Recent Leads</h2>
            <Link href="/dashboard/crm/leads" className="text-blue-600 hover:text-blue-800 text-sm">
              View all →
            </Link>
          </div>
          {recentLeads.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No leads yet</p>
              <Link href="/dashboard/crm/leads" className="text-blue-600 hover:underline">
                Add your first lead
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLeads.map((lead, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{lead.name || lead.fullName || "Unknown"}</p>
                    <p className="text-sm text-gray-500">{lead.phone || lead.email || "-"}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    lead.status === "NEW" ? "bg-blue-100 text-blue-800" :
                    lead.status === "CONVERTED" ? "bg-green-100 text-green-800" :
                    lead.status === "CONTACTED" ? "bg-yellow-100 text-yellow-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {lead.status || "NEW"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lead Pipeline */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">📈 Lead Pipeline</h2>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {["NEW", "CONTACTED", "QUALIFIED", "NEGOTIATION", "CONVERTED"].map((stage, index) => {
            const count = recentLeads.filter(l => l.status === stage).length;
            const colors = ["bg-blue-100", "bg-yellow-100", "bg-purple-100", "bg-orange-100", "bg-green-100"];
            return (
              <div key={stage} className={`flex-shrink-0 w-48 p-4 ${colors[index]} rounded-lg`}>
                <h3 className="font-bold text-sm mb-2">{stage}</h3>
                <p className="text-3xl font-bold">{count}</p>
                <p className="text-xs text-gray-600 mt-1">leads</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
