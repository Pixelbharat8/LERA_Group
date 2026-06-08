"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { useUserCenter, buildCenterFilterUrl } from "../../../hooks/useUserCenter";

type Tab = "needs" | "hot" | "dups";
interface Lead {
  id: string; parentName?: string; studentName?: string; parentPhone?: string;
  status: string; score?: number; temperature?: string; createdAt?: string; duplicate?: boolean;
}

const tempPill = (t?: string) =>
  t === "HOT" ? "bg-red-100 text-red-700" : t === "WARM" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700";
const tempIcon = (t?: string) => (t === "HOT" ? "🔥" : t === "WARM" ? "🌡️" : "❄️");

export default function WorkQueuePage() {
  const { centerId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [tab, setTab] = useState<Tab>("needs");
  const [needs, setNeeds] = useState<Lead[]>([]);
  const [hot, setHot] = useState<Lead[]>([]);
  const [dups, setDups] = useState<Lead[]>([]);
  const [sla, setSla] = useState(60);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading, centerId, sla]);

  async function load() {
    setLoading(true); setError(null);
    try {
      const cid = shouldFilterByCenter ? centerId : null;
      const [n, all, d] = await Promise.all([
        apiFetch(buildCenterFilterUrl(`/api/leads/needs-contact?slaMinutes=${sla}`, cid)).catch(() => []),
        apiFetch(buildCenterFilterUrl("/api/leads", cid)).catch(() => []),
        apiFetch("/api/leads/duplicates").catch(() => []),
      ]);
      setNeeds(Array.isArray(n) ? n : []);
      const allArr: Lead[] = Array.isArray(all) ? all : [];
      setHot(allArr.filter((l) => l.temperature === "HOT" && l.status !== "CONVERTED" && l.status !== "LOST")
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)));
      setDups(Array.isArray(d) ? d : []);
    } catch (e: any) { setError(e?.message || "Failed to load work queue"); }
    finally { setLoading(false); }
  }

  async function markContacted(id: string) {
    setError(null);
    try { await apiFetch(`/api/leads/${id}`, { method: "PUT", body: JSON.stringify({ status: "CONTACTED" }) }); await load(); }
    catch (e: any) { setError(e?.message || "Action failed"); }
  }

  const minsAgo = (d?: string) => {
    if (!d) return null;
    const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
    return m < 60 ? `${m}m` : m < 1440 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`;
  };
  const name = (l: Lead) => l.studentName ? `${l.studentName}${l.parentName ? ` (${l.parentName})` : ""}` : (l.parentName || "Lead");

  const rows = tab === "needs" ? needs : tab === "hot" ? hot : dups;
  const TABS: { k: Tab; label: string; count: number; icon: string }[] = [
    { k: "needs", label: "Needs contact", count: needs.length, icon: "⏰" },
    { k: "hot", label: "Hot leads", count: hot.length, icon: "🔥" },
    { k: "dups", label: "Duplicates", count: dups.length, icon: "⚠️" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/crm" className="hover:text-blue-600">CRM</Link><span>/</span><span className="text-gray-900">Work Queue</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">🎯 Lead Work Queue</h1>
          <p className="text-gray-500">Contact the right leads first — by urgency and score</p>
        </div>
        {tab === "needs" && (
          <label className="text-sm text-gray-600 flex items-center gap-2">
            SLA (min)
            <input type="number" value={sla} onChange={(e) => setSla(Number(e.target.value) || 0)}
              className="w-20 h-9 rounded-md border border-gray-300 px-2 text-sm" />
          </label>
        )}
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        {TABS.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${tab === t.k ? "bg-white border border-b-white border-gray-200 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
            {t.icon} {t.label} <span className="ml-1 px-1.5 rounded-full bg-gray-100 text-gray-600">{t.count}</span>
          </button>
        ))}
      </div>

      {loading ? <div className="text-center text-gray-500 py-10">Loading…</div> : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{tab === "needs" ? "Waiting" : "Status"}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-200">
              {rows.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                  {tab === "needs" ? "🎉 No leads breaching SLA — you're on top of it." : tab === "hot" ? "No hot leads right now." : "No duplicates."}
                </td></tr>
              ) : rows.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {name(l)} {l.duplicate && <span className="ml-1 text-xs text-orange-600">⚠️ dup</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{l.parentPhone || "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {l.temperature && <span className={`px-2 py-1 text-xs rounded-full ${tempPill(l.temperature)}`}>{tempIcon(l.temperature)} {l.score ?? ""}</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {tab === "needs" ? <span className="text-red-600 font-medium">{minsAgo(l.createdAt)} waiting</span> : l.status}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <Link href="/dashboard/crm/leads" className="text-gray-500 hover:text-gray-700 mr-3">Open</Link>
                    {l.status === "NEW" && <button onClick={() => markContacted(l.id)} className="text-blue-600 hover:text-blue-800">Mark contacted</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
