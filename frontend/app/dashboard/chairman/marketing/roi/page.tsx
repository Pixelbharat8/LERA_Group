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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading, centerId, mode]);

  async function load() {
    setLoading(true); setError(null);
    try {
      const url = buildCenterFilterUrl(`/api/leads/analytics/by-${mode}`, shouldFilterByCenter ? centerId : null);
      const data = await apiFetch(url).catch(() => []);
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) { setError(e?.message || "Failed to load analytics"); }
    finally { setLoading(false); }
  }

  const totals = rows.reduce((a, r) => ({ leads: a.leads + r.leads, trials: a.trials + r.trials, converted: a.converted + r.converted }), { leads: 0, trials: 0, converted: 0 });
  const totalSpend = Object.values(spend).reduce((a, b) => a + (Number(b) || 0), 0);
  const fmt = (n: number) => (isFinite(n) && n > 0 ? Math.round(n).toLocaleString() + " ₫" : "—");

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

      <div className="flex gap-2">
        {([["source", "By source (UTM)"], ["campaign", "By campaign"]] as [Mode, string][]).map(([k, l]) => (
          <button key={k} onClick={() => setMode(k)}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${mode === k ? "bg-blue-600 text-white" : "bg-white border border-gray-300 hover:bg-gray-50"}`}>{l}</button>
        ))}
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
              <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase text-xs">Cost / lead</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase text-xs">Cost / enrolment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-500">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-500">No lead data yet.</td></tr>
            ) : rows.map((r) => {
              const sp = Number(spend[r.channel]) || 0;
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
                  <td className="px-4 py-3 text-right text-gray-600">{fmt(sp / r.leads)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(sp / r.converted)}</td>
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
                <td className="px-4 py-3 text-right">{fmt(totalSpend / totals.leads)}</td>
                <td className="px-4 py-3 text-right">{fmt(totalSpend / totals.converted)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <p className="text-xs text-gray-400">Lead→trial→enrolment is computed live from CRM lead statuses (UTM source/campaign). Ad spend is entered here; connect ad-account APIs later to pull spend automatically.</p>
    </div>
  );
}
