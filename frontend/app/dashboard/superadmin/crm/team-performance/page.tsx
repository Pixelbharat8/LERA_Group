"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";

/**
 * Marketing Team Performance — per-person KPIs with money.
 * Real data: leads (assignedTo + status) and total revenue / students for an average
 * enrolment value. Money = conversions × avg value; commission/target/ad-spend are
 * tunable inputs (defaults shown) since they aren't stored per person yet.
 */
type Row = {
  ownerId: string;
  name: string;
  leads: number;
  contacted: number;
  converted: number;
};

export default function MarketingTeamPerformancePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [avgValue, setAvgValue] = useState(0);
  const [commissionPct, setCommissionPct] = useState(5);
  const [targets, setTargets] = useState<Record<string, number>>({});
  const [spend, setSpend] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [leads, users, pay, students] = await Promise.all([
      apiFetch("/api/leads", {}, { silent: true }).catch(() => []),
      apiFetch("/api/users", {}, { silent: true }).catch(() => []),
      apiFetch("/api/payments/summary", {}, { silent: true }).catch(() => null),
      apiFetch("/api/students", {}, { silent: true }).catch(() => []),
    ]);
    const userMap = new Map<string, string>();
    (Array.isArray(users) ? users : (users as any)?.content || []).forEach((u: any) =>
      userMap.set(String(u.id), u.fullname || u.fullName || u.email || "—"));

    const byOwner = new Map<string, Row>();
    (Array.isArray(leads) ? leads : (leads as any)?.content || []).forEach((l: any) => {
      const owner = l.assignedTo ? String(l.assignedTo) : "unassigned";
      if (!byOwner.has(owner)) {
        byOwner.set(owner, {
          ownerId: owner,
          name: owner === "unassigned" ? "Unassigned" : userMap.get(owner) || owner.slice(0, 8),
          leads: 0, contacted: 0, converted: 0,
        });
      }
      const r = byOwner.get(owner)!;
      r.leads++;
      const s = String(l.status || "").toUpperCase();
      if (["CONTACTED", "QUALIFIED", "TRIAL_BOOKED", "TRIAL_ATTENDED", "CONVERTED"].includes(s)) r.contacted++;
      if (s === "CONVERTED") r.converted++;
    });
    const list = Array.from(byOwner.values()).filter((r) => r.ownerId !== "unassigned" || r.leads > 0)
      .sort((a, b) => b.converted - a.converted || b.leads - a.leads);
    setRows(list);

    const totalRevenue = Number(pay?.totalRevenue) || 0;
    const studentCount = Array.isArray(students) ? students.length : Number((students as any)?.totalElements) || 0;
    if (totalRevenue > 0 && studentCount > 0) setAvgValue(Math.round(totalRevenue / studentCount));
    setLoading(false);
  }

  const vnd = (n: number) => (n >= 1_000_000 ? `₫${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `₫${(n / 1000).toFixed(0)}K` : `₫${Math.round(n)}`);
  const defaultTarget = 50_000_000;

  const totals = rows.reduce((a, r) => {
    const rev = r.converted * avgValue;
    return { leads: a.leads + r.leads, converted: a.converted + r.converted, revenue: a.revenue + rev };
  }, { leads: 0, converted: 0, revenue: 0 });
  const totalCommission = totals.revenue * (commissionPct / 100);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/superadmin/crm" className="hover:text-blue-600">CRM</Link><span>/</span>
          <span className="text-gray-900">Team Performance</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">🏆 Marketing Team Performance</h1>
        <p className="text-gray-500">Per-person leads, conversions, revenue, commission and targets.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Team leads", value: String(totals.leads) },
          { label: "Enrolments", value: String(totals.converted) },
          { label: "Revenue (est)", value: vnd(totals.revenue) },
          { label: `Commission @ ${commissionPct}%`, value: vnd(totalCommission) },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          Commission rate
          <input type="number" value={commissionPct} onChange={(e) => setCommissionPct(Number(e.target.value))}
            className="w-20 h-9 rounded-lg border border-gray-300 px-2 text-right text-sm" /> %
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          Avg revenue / enrolment
          <input type="number" value={avgValue || ""} onChange={(e) => setAvgValue(Number(e.target.value))}
            className="w-36 h-9 rounded-lg border border-gray-300 px-2 text-right text-sm" placeholder="auto" /> ₫
        </label>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Team member", "Leads", "Enrolled", "Conv %", "Revenue (est)", "Commission", "Target", "Achieved", "Ad spend", "ROI"].map((h) => (
                <th key={h} className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase ${h === "Team member" ? "text-left" : "text-right"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-500">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-500">No assigned leads yet.</td></tr>
            ) : rows.map((r) => {
              const rev = r.converted * avgValue;
              const commission = rev * (commissionPct / 100);
              const target = targets[r.ownerId] ?? defaultTarget;
              const achieved = target > 0 ? Math.round((rev / target) * 100) : null;
              const sp = Number(spend[r.ownerId]) || 0;
              const roi = sp > 0 ? Math.round((rev - sp) / sp * 100) : null;
              return (
                <tr key={r.ownerId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                  <td className="px-4 py-3 text-right">{r.leads}</td>
                  <td className="px-4 py-3 text-right text-green-700 font-medium">{r.converted}</td>
                  <td className="px-4 py-3 text-right">{r.leads ? Math.round(r.converted / r.leads * 1000) / 10 : 0}%</td>
                  <td className="px-4 py-3 text-right text-gray-700">{vnd(rev)}</td>
                  <td className="px-4 py-3 text-right text-blue-700 font-medium">{vnd(commission)}</td>
                  <td className="px-4 py-3 text-right">
                    <input type="number" value={targets[r.ownerId] ?? defaultTarget}
                      onChange={(e) => setTargets({ ...targets, [r.ownerId]: Number(e.target.value) })}
                      className="w-28 h-8 rounded border border-gray-300 px-2 text-right text-sm" />
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${achieved == null ? "text-gray-400" : achieved >= 100 ? "text-green-600" : achieved >= 50 ? "text-amber-600" : "text-red-600"}`}>
                    {achieved == null ? "—" : `${achieved}%`}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <input type="number" value={spend[r.ownerId] ?? ""} placeholder="0"
                      onChange={(e) => setSpend({ ...spend, [r.ownerId]: Number(e.target.value) })}
                      className="w-28 h-8 rounded border border-gray-300 px-2 text-right text-sm" />
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${roi == null ? "text-gray-400" : roi >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {roi == null ? "—" : `${roi >= 0 ? "+" : ""}${roi}%`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400">
        Leads, enrolments and conversion are live from CRM lead ownership/status. Revenue (est) = enrolments ×
        avg revenue/enrolment (from real payments). Commission = revenue × rate. Target, ad spend and commission
        rate are editable here; wire them to per-person config to persist.
      </p>
    </div>
  );
}
