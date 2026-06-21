"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";
import { useUserCenter, buildCenterFilterUrl } from "../../../../hooks/useUserCenter";

type Mode = "source" | "campaign";
interface Row { channel: string; leads: number; trials: number; converted: number; conversionRate: number; }

export default function MarketingRoiPage() {
  const { centerId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [mode, setMode] = useState<Mode>("source");
  const [rows, setRows] = useState<Row[]>([]);
  const [spend, setSpend] = useState<Record<string, number>>({});
  const [avgValue, setAvgValue] = useState(0); // avg revenue per enrolled student (real default, editable)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading, centerId, mode]);

  // Normalise a campaign name to match the UTM-style channel value (e.g. "Summer Camp 2026" -> "summer_camp_2026").
  const norm = (s: string) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

  async function load() {
    setLoading(true); setError(null);
    try {
      const url = buildCenterFilterUrl(`/api/leads/analytics/by-${mode}`, shouldFilterByCenter ? centerId : null);
      const [data, campaigns, paySummary] = await Promise.all([
        apiFetch(url, {}, { silent: true }).catch(() => []),
        apiFetch("/api/marketing-campaigns", {}, { silent: true }).catch(() => []),
        apiFetch("/api/payments/summary", {}, { silent: true }).catch(() => null),
      ]);
      const list: Row[] = Array.isArray(data) ? data : [];
      setRows(list);

      // Auto-fill ad spend from real campaign spentAmount (campaign mode); match by normalised name.
      if (mode === "campaign" && Array.isArray(campaigns)) {
        const next: Record<string, number> = {};
        list.forEach((r) => {
          const ch = String(r.channel || "");
          const m = campaigns.find((c: any) => {
            const n = norm(c.campaignName);
            return n === ch || n.startsWith(ch) || ch.startsWith(n);
          });
          if (m) next[r.channel] = Number(m.spentAmount) || 0;
        });
        setSpend(next);
      }

      // Default avg revenue / enrolment from REAL data: total completed revenue ÷ enrolled students.
      const totalRevenue = Number(paySummary?.totalRevenue) || 0;
      const studentsRes = await apiFetch(
        buildCenterFilterUrl("/api/students", shouldFilterByCenter ? centerId : null),
        {}, { silent: true }
      ).catch(() => []);
      const studentCount = Array.isArray(studentsRes)
        ? studentsRes.length
        : Number(studentsRes?.totalElements) || 0;
      if (totalRevenue > 0 && studentCount > 0) setAvgValue(Math.round(totalRevenue / studentCount));
    } catch (e: any) { setError(e?.message || "Failed to load analytics"); }
    finally { setLoading(false); }
  }

  const totals = rows.reduce((a, r) => ({ leads: a.leads + r.leads, trials: a.trials + r.trials, converted: a.converted + r.converted }), { leads: 0, trials: 0, converted: 0 });
  const totalSpend = Object.values(spend).reduce((a, b) => a + (Number(b) || 0), 0);
  const totalRevenueEst = totals.converted * avgValue;
  const fmt = (n: number) => (isFinite(n) && n > 0 ? Math.round(n).toLocaleString() + " ₫" : "—");
  const roiPct = (rev: number, sp: number) => (sp > 0 ? Math.round((rev - sp) / sp * 100) : null);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/chairman/marketing" className="hover:text-blue-600">Marketing</Link><span>/</span><span className="text-gray-900">ROI</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">📊 Marketing ROI by Channel</h1>
        <p className="text-gray-500">Which channels actually produce enrolments. Enter ad spend to see cost per lead / enrolment.</p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total leads", value: totals.leads, icon: "👥", bg: "bg-blue-100" },
          { label: "Trials", value: totals.trials, icon: "🎓", bg: "bg-indigo-100" },
          { label: "Enrolled", value: totals.converted, icon: "🎉", bg: "bg-green-100" },
          { label: "Overall conv.", value: `${totals.leads ? Math.round(totals.converted / totals.leads * 1000) / 10 : 0}%`, icon: "📈", bg: "bg-amber-100" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 ${s.bg} rounded-lg flex items-center justify-center text-xl`}>{s.icon}</div>
              <div><p className="text-2xl font-bold text-gray-900">{s.value}</p><p className="text-sm text-gray-500">{s.label}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {([["source", "By source (UTM)"], ["campaign", "By campaign"]] as [Mode, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setMode(k)}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${mode === k ? "bg-blue-600 text-white" : "bg-white border border-gray-300 hover:bg-gray-50"}`}>{l}</button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          Avg revenue / enrolment
          <input type="number" value={avgValue || ""} onChange={(e) => setAvgValue(Number(e.target.value))}
            className="w-36 h-9 rounded-lg border border-gray-300 px-2 text-right text-sm" placeholder="auto" />
          <span className="text-xs text-gray-400">₫ (from real payments; editable)</span>
        </label>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase text-xs">Channel</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase text-xs">Leads</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase text-xs">Trials</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase text-xs">Enrolled</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase text-xs">Conv. %</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase text-xs">Ad spend (₫)</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase text-xs">Cost / enrolment</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase text-xs">Revenue (est)</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase text-xs">ROI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-500">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-500">No lead data yet.</td></tr>
            ) : rows.map((r) => {
              const sp = Number(spend[r.channel]) || 0;
              const rev = r.converted * avgValue;
              const roi = roiPct(rev, sp);
              return (
                <tr key={r.channel} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.channel}</td>
                  <td className="px-4 py-3 text-right">{r.leads}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{r.trials}</td>
                  <td className="px-4 py-3 text-right text-green-700 font-medium">{r.converted}</td>
                  <td className="px-4 py-3 text-right">{r.conversionRate}%</td>
                  <td className="px-4 py-3 text-right">
                    <input type="number" value={spend[r.channel] ?? ""} placeholder="0"
                      onChange={(e) => setSpend({ ...spend, [r.channel]: Number(e.target.value) })}
                      className="w-28 h-8 rounded border border-gray-300 px-2 text-right text-sm" />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(sp / r.converted)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{fmt(rev)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${roi == null ? "text-gray-400" : roi >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {roi == null ? "—" : `${roi >= 0 ? "+" : ""}${roi}%`}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="bg-gray-50 font-medium">
              <tr>
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right">{totals.leads}</td>
                <td className="px-4 py-3 text-right">{totals.trials}</td>
                <td className="px-4 py-3 text-right text-green-700">{totals.converted}</td>
                <td className="px-4 py-3 text-right">{totals.leads ? Math.round(totals.converted / totals.leads * 1000) / 10 : 0}%</td>
                <td className="px-4 py-3 text-right">{totalSpend ? totalSpend.toLocaleString() + " ₫" : "—"}</td>
                <td className="px-4 py-3 text-right">{fmt(totalSpend / totals.converted)}</td>
                <td className="px-4 py-3 text-right">{fmt(totalRevenueEst)}</td>
                {(() => { const roi = roiPct(totalRevenueEst, totalSpend); return (
                  <td className={`px-4 py-3 text-right ${roi == null ? "text-gray-400" : roi >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {roi == null ? "—" : `${roi >= 0 ? "+" : ""}${roi}%`}
                  </td>
                ); })()}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <p className="text-xs text-gray-400">
        Lead→trial→enrolment is live from CRM lead statuses (UTM source/campaign). In “By campaign” mode, ad spend
        auto-fills from each campaign’s real spent amount (still editable). Revenue (est) = enrolments × avg
        revenue/enrolment (defaulted from real payments); ROI = (revenue − spend) ÷ spend.
      </p>
    </div>
  );
}
