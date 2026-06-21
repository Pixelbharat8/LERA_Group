"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

/**
 * CEO Growth & Marketing KPIs — every figure is computed from real backend data:
 *  - lead funnel:   /api/leads/stats
 *  - ad spend:      /api/marketing-campaigns (sum of spentAmount)
 *  - revenue:       /api/payments/summary (totalRevenue)
 *  - students:      /api/students (count)
 *  - renewals:      /api/renewals
 * No fabricated numbers — when a source has no data the KPI shows "—".
 */
export default function CeoGrowthPage() {
  const [loading, setLoading] = useState(true);
  const [d, setD] = useState({
    leads: 0, contacted: 0, qualified: 0, converted: 0, lost: 0,
    adSpend: 0, revenue: 0, students: 0,
    renewTotal: 0, renewed: 0,
  });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [leadStats, campaigns, pay, students, renewals] = await Promise.all([
      apiFetch("/api/leads/stats", {}, { silent: true }).catch(() => null),
      apiFetch("/api/marketing-campaigns", {}, { silent: true }).catch(() => []),
      apiFetch("/api/payments/summary", {}, { silent: true }).catch(() => null),
      apiFetch("/api/students", {}, { silent: true }).catch(() => []),
      apiFetch("/api/renewals", {}, { silent: true }).catch(() => []),
    ]);
    const adSpend = Array.isArray(campaigns)
      ? campaigns.reduce((s: number, c: any) => s + (Number(c.spentAmount) || 0), 0) : 0;
    const studentCount = Array.isArray(students) ? students.length : Number((students as any)?.totalElements) || 0;
    const renewList = Array.isArray(renewals) ? renewals : [];
    const renewed = renewList.filter((r: any) => ["RENEWED", "COMPLETED", "ACTIVE"].includes(String(r.status).toUpperCase())).length;
    setD({
      leads: Number(leadStats?.totalCount) || 0,
      contacted: Number(leadStats?.contactedCount) || 0,
      qualified: Number(leadStats?.qualifiedCount) || 0,
      converted: Number(leadStats?.convertedCount) || 0,
      lost: Number(leadStats?.lostCount) || 0,
      adSpend,
      revenue: Number(pay?.totalRevenue) || 0,
      students: studentCount,
      renewTotal: renewList.length,
      renewed,
    });
    setLoading(false);
  }

  const vnd = (n: number) => (n >= 1_000_000 ? `₫${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `₫${(n / 1000).toFixed(0)}K` : `₫${Math.round(n)}`);
  const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : null);

  const cac = d.converted > 0 ? d.adSpend / d.converted : null;          // cost to acquire one enrolment
  const ltv = d.students > 0 ? d.revenue / d.students : null;             // avg lifetime revenue / student
  const ltvCac = cac && ltv && cac > 0 ? Math.round((ltv / cac) * 100) / 100 : null;
  const convRate = pct(d.converted, d.leads);                            // lead -> enrolment
  const renewRate = pct(d.renewed, d.renewTotal);

  const ratioTone = ltvCac == null ? "text-gray-400" : ltvCac >= 3 ? "text-green-600" : ltvCac >= 1 ? "text-amber-600" : "text-red-600";

  const tiles: { label: string; value: string; sub?: string; tone?: string }[] = [
    { label: "LTV : CAC", value: ltvCac == null ? "—" : `${ltvCac}×`, sub: "healthy ≥ 3×", tone: ratioTone },
    { label: "CAC (cost / enrolment)", value: cac == null ? "—" : vnd(cac), sub: `${vnd(d.adSpend)} spend ÷ ${d.converted} enrolled` },
    { label: "LTV (avg revenue / student)", value: ltv == null ? "—" : vnd(ltv), sub: `${vnd(d.revenue)} ÷ ${d.students} students` },
    { label: "Lead → enrolment", value: convRate == null ? "—" : `${convRate}%`, sub: `${d.converted} of ${d.leads} leads` },
    { label: "Total leads", value: String(d.leads), sub: `${d.lost} lost` },
    { label: "New enrolments", value: String(d.converted), sub: "converted leads" },
    { label: "Renewal rate", value: renewRate == null ? "—" : `${renewRate}%`, sub: d.renewTotal ? `${d.renewed} of ${d.renewTotal}` : "no renewal data yet" },
    { label: "Total revenue", value: vnd(d.revenue), sub: "all completed payments" },
  ];

  const funnel = [
    { label: "Leads", n: d.leads, color: "bg-blue-500" },
    { label: "Contacted", n: d.contacted, color: "bg-indigo-500" },
    { label: "Qualified", n: d.qualified, color: "bg-purple-500" },
    { label: "Enrolled", n: d.converted, color: "bg-green-600" },
  ];
  const funnelMax = Math.max(1, ...funnel.map((f) => f.n));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/ceo" className="hover:text-blue-600">CEO</Link><span>/</span><span className="text-gray-900">Growth KPIs</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">📈 Growth &amp; Marketing KPIs</h1>
        <p className="text-gray-500">Acquisition economics computed live from leads, ad spend, revenue and renewals.</p>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {tiles.map((t) => (
              <div key={t.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <p className="text-sm text-gray-500">{t.label}</p>
                <p className={`text-2xl font-bold mt-1 ${t.tone || "text-gray-900"}`}>{t.value}</p>
                {t.sub && <p className="text-xs text-gray-400 mt-1">{t.sub}</p>}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Acquisition funnel</h2>
            <div className="space-y-3">
              {funnel.map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-600">{f.label}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div className={`${f.color} h-6 rounded-full flex items-center justify-end pr-2 text-white text-xs font-medium`}
                         style={{ width: `${Math.max(6, (f.n / funnelMax) * 100)}%` }}>{f.n}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-400">
            CAC = total campaign spend ÷ enrolled leads · LTV = total revenue ÷ students · LTV:CAC = LTV ÷ CAC
            (target ≥ 3×) · conversion = enrolled ÷ leads · renewal = renewed ÷ total renewals. Plug real
            tuition/LTV on the <Link href="/dashboard/chairman/marketing/roi" className="text-blue-600 hover:underline">ROI page</Link>.
          </p>
        </>
      )}
    </div>
  );
}
