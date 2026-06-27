"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { useReveal } from "../../../hooks/useReveal";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function CenterManagementPage() {
  useReveal();
  const [loading, setLoading] = useState(true);
  const [year] = useState(new Date().getFullYear());
  const [d, setD] = useState<any>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [dash, rev, revMonthly, exp, leads, students, enrollments, payments, attendance] = await Promise.all([
        apiFetch(`/api/finance/dashboard`).catch(() => ({})),
        apiFetch(`/api/finance/revenue?period=year&year=${year}`).catch(() => ({})),
        apiFetch(`/api/finance/revenue/monthly`).catch(() => []),
        apiFetch(`/api/finance/expenses?period=year&year=${year}`).catch(() => ({})),
        apiFetch(`/api/leads/stats`, {}, { silent: true }).catch(() => ({})),
        apiFetch(`/api/students`).catch(() => []),
        apiFetch(`/api/enrollments`).catch(() => []),
        apiFetch(`/api/payments`).catch(() => []),
        apiFetch(`/api/attendance/summary`, {}, { silent: true }).catch(() => ({})),
      ]);

      const sList = Array.isArray(students) ? students : [];
      const pList = Array.isArray(payments) ? payments : [];
      const eList = Array.isArray(enrollments) ? enrollments : [];
      const isPaid = (p: any) => ["PAID", "paid", "COMPLETED", "completed"].includes(p.status);

      const inYear = (raw: any) => raw && new Date(raw).getFullYear() === year;
      const joined = sList.filter((s: any) => inYear(s.createdAt || s.created_at)).length;
      const lost = sList.filter((s: any) => ["WITHDRAWN", "INACTIVE", "GRADUATED"].includes((s.status || "").toUpperCase())).length;
      const active = sList.filter((s: any) => (s.status || "ACTIVE").toUpperCase() === "ACTIVE").length;

      const revenue = Number(rev?.total) || Number(dash?.totalRevenue) || 0;
      const cost = Number(exp?.total) || 0;
      const outstanding = Number(dash?.outstandingAmount) || 0;
      const inv = dash?.invoiceStats || {};
      const collectionRate = revenue + outstanding > 0 ? (revenue / (revenue + outstanding)) * 100 : 100;
      const attendanceRate = Number(attendance?.attendanceRate) || 0;

      const leadsTotal = Number(leads?.totalCount) || 0;
      const converted = Number(leads?.convertedCount) || 0;
      const qualified = (Number(leads?.qualifiedCount) || 0) + converted;
      const contacted = (Number(leads?.contactedCount) || 0) + qualified;
      const convRate = leadsTotal > 0 ? (converted / leadsTotal) * 100 : 0;
      const payingStudents = new Set(pList.filter(isPaid).map((p: any) => String(p.studentId))).size;

      // Tuition by month (authoritative backend monthly revenue, aligned Jan–Dec)
      const monthMap: Record<string, number> = {};
      (Array.isArray(revMonthly) ? revMonthly : []).forEach((m: any) => { monthMap[m.month] = Number(m.revenue) || 0; });
      const byMonth = MONTHS.map((m) => ({ month: m, revenue: monthMap[m] || 0 }));

      const retention = active + lost > 0 ? (active / (active + lost)) * 100 : 100;
      // Transparent composite health score (avg of four real sub-scores)
      const convScore = Math.min(100, convRate * 4);
      const health = Math.round((collectionRate + attendanceRate + retention + convScore) / 4);

      // Watch list — real flags
      const watch: { label: string; detail: string; level: "high" | "med" | "low" }[] = [];
      if (inv.overdue > 0) watch.push({ label: `${inv.overdue} overdue invoice${inv.overdue > 1 ? "s" : ""}`, detail: "Payment past due — collect now", level: "high" });
      if (inv.pending > 0) watch.push({ label: `${inv.pending} unpaid invoice${inv.pending > 1 ? "s" : ""}`, detail: fmtC(outstanding) + " outstanding", level: "med" });
      if (attendanceRate > 0 && attendanceRate < 80) watch.push({ label: `Attendance ${attendanceRate.toFixed(0)}%`, detail: "Below 80% — check at-risk students", level: "med" });
      const newLeads = Number(leads?.newCount) || 0;
      if (newLeads > 0) watch.push({ label: `${newLeads} new lead${newLeads > 1 ? "s" : ""} unworked`, detail: "Assign + first contact", level: "low" });
      if (lost > 0) watch.push({ label: `${lost} student${lost > 1 ? "s" : ""} lost`, detail: "Log exit reason + retention", level: "high" });

      // Do these this week — derived actions
      const actions: string[] = [];
      if (inv.overdue > 0) actions.push(`Collect ${inv.overdue} overdue invoice(s) — ${fmtC(Number(dash?.outstandingAmount) || 0)} at risk.`);
      if (newLeads > 0) actions.push(`Work ${newLeads} new lead(s): assign an owner and make first contact.`);
      if (qualified - converted > 0) actions.push(`Convert ${qualified - converted} qualified lead(s) sitting in the pipeline.`);
      if (attendanceRate > 0 && attendanceRate < 90) actions.push(`Follow up absentees — attendance is ${attendanceRate.toFixed(0)}%.`);
      if (actions.length === 0) actions.push("All clear — no urgent collection, lead or attendance flags this week.");

      setD({
        revenue, cost, profit: revenue - cost, margin: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0,
        growth: Number(rev?.growth) || 0, thisMonth: Number(dash?.thisMonthRevenue) || 0,
        joined, lost, active, netAdds: joined - lost, attendanceRate, outstanding,
        leadsTotal, contacted, qualified, converted, convRate, payingStudents,
        byMonth, health, collectionRate, retention, watch, actions,
        invoiceStats: inv, completedPayments: Number(dash?.completedPayments) || 0,
        breakEvenStudents: revenue > 0 && payingStudents > 0 ? Math.ceil(cost / (revenue / Math.max(1, payingStudents))) : 0,
      });
    } catch (e) {
      console.error("Center management load error:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !d) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>;
  }

  const maxMonth = Math.max(1, ...d.byMonth.map((m: any) => m.revenue));
  const healthColor = d.health >= 75 ? "text-green-600" : d.health >= 50 ? "text-amber-600" : "text-red-600";
  const healthRing = d.health >= 75 ? "#16a34a" : d.health >= 50 ? "#d97706" : "#dc2626";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Center Management</h1>
          <p className="text-gray-600">Command center — tuition, students, attendance, funnel &amp; health · live data · {year}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/ceo/finance" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Finance →</Link>
          <Link href="/dashboard/ceo/funnel" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Funnel →</Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="reveal-stagger grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Kpi label={`Tuition · ${year}`} value={fmtC(d.revenue)} sub={`${d.growth > 0 ? "+" : ""}${d.growth.toFixed(0)}% vs last`} tone="green" />
        <Kpi label="Students joined" value={`${d.joined}`} sub="this year" tone="blue" />
        <Kpi label="Net adds" value={`${d.netAdds >= 0 ? "+" : ""}${d.netAdds}`} sub={`${d.lost} lost`} tone="indigo" />
        <Kpi label="Attendance" value={d.attendanceRate ? `${d.attendanceRate.toFixed(0)}%` : "—"} sub="present rate" tone="teal" />
        <Kpi label="Lead → student" value={`${d.convRate.toFixed(0)}%`} sub={`${d.converted}/${d.leadsTotal} leads`} tone="purple" />
        <Kpi label="Outstanding" value={fmtC(d.outstanding)} sub={`${d.invoiceStats.overdue || 0} overdue`} tone="amber" />
      </div>

      {/* Tuition by month + Revenue vs cost */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="reveal card-premium p-6 lg:col-span-2">
          <h3 className="text-lg font-bold mb-4">Tuition collected by month — {year}</h3>
          <div className="flex items-end gap-2 h-52">
            {d.byMonth.map((m: any) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="w-full flex items-end justify-center h-44">
                  <div className="w-2/3 bg-gradient-to-t from-green-600 to-green-400 rounded-t hover:opacity-80 transition-all" style={{ height: `${(m.revenue / maxMonth) * 100}%` }} title={fmtC(m.revenue)} />
                </div>
                <span className="text-xs text-gray-500">{m.month}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="reveal card-premium p-6">
          <h3 className="text-lg font-bold mb-4">Revenue vs Cost</h3>
          <Bar label="Revenue" value={d.revenue} max={Math.max(d.revenue, d.cost)} color="bg-green-500" />
          <Bar label="Teacher payroll" value={d.cost} max={Math.max(d.revenue, d.cost)} color="bg-red-400" />
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Net</span><span className={`font-bold ${d.profit >= 0 ? "text-blue-600" : "text-orange-600"}`}>{fmtC(d.profit)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Margin</span><span className="font-bold">{d.margin.toFixed(0)}%</span></div>
            {d.breakEvenStudents > 0 && (
              <div className="flex justify-between text-sm"><span className="text-gray-500">Break-even</span><span className="font-medium">~{d.breakEvenStudents} paying students</span></div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-3">Cost = teacher payroll (the tracked operating cost).</p>
        </div>
      </div>

      {/* Health score + Lead funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="reveal card-premium p-6 flex flex-col items-center justify-center">
          <h3 className="text-lg font-bold mb-4 self-start">Center health score</h3>
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="9" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={healthRing} strokeWidth="9" strokeLinecap="round"
                strokeDasharray={`${(d.health / 100) * 264} 264`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${healthColor}`}>{d.health}</span>
              <span className="text-xs text-gray-400">/ 100</span>
            </div>
          </div>
          <div className="mt-4 w-full text-xs text-gray-500 space-y-1">
            <div className="flex justify-between"><span>Collection</span><span>{d.collectionRate.toFixed(0)}%</span></div>
            <div className="flex justify-between"><span>Attendance</span><span>{d.attendanceRate.toFixed(0)}%</span></div>
            <div className="flex justify-between"><span>Retention</span><span>{d.retention.toFixed(0)}%</span></div>
            <div className="flex justify-between"><span>Lead conversion</span><span>{d.convRate.toFixed(0)}%</span></div>
          </div>
        </div>

        <div className="reveal card-premium p-6 lg:col-span-2">
          <h3 className="text-lg font-bold mb-4">Lead funnel &amp; conversion</h3>
          {[
            { k: "Leads", v: d.leadsTotal, c: "from-indigo-400 to-indigo-600" },
            { k: "Contacted", v: d.contacted, c: "from-indigo-400 to-indigo-600" },
            { k: "Qualified", v: d.qualified, c: "from-blue-400 to-blue-600" },
            { k: "Converted", v: d.converted, c: "from-green-400 to-green-600" },
            { k: "Paying", v: d.payingStudents, c: "from-green-500 to-green-700" },
          ].map((s, i, arr) => {
            const max = Math.max(1, d.leadsTotal);
            const prev = i > 0 ? arr[i - 1].v : null;
            const conv = prev && prev > 0 ? (s.v / prev) * 100 : null;
            return (
              <div key={s.k} className="mb-2">
                {prev !== null && <div className="text-xs text-gray-400 pl-2">↓ {conv !== null ? conv.toFixed(0) : "—"}%</div>}
                <div className="flex items-center gap-3">
                  <div className={`bg-gradient-to-r ${s.c} text-white rounded-lg h-11 flex items-center justify-between px-4`} style={{ width: `${Math.max(18, (s.v / max) * 100)}%`, minWidth: 120 }}>
                    <span className="font-semibold text-sm">{s.k}</span><span className="font-bold">{s.v}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Watch list + Do these this week */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="reveal card-premium p-6">
          <h3 className="text-lg font-bold mb-4">⚠️ Watch list</h3>
          {d.watch.length === 0 ? <p className="text-gray-400 text-sm">Nothing flagged — all healthy.</p> : (
            <div className="space-y-2">
              {d.watch.map((w: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{w.label}</p>
                    <p className="text-xs text-gray-500">{w.detail}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${w.level === "high" ? "bg-red-100 text-red-700" : w.level === "med" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{w.level === "high" ? "High" : w.level === "med" ? "Medium" : "Low"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="reveal card-premium p-6">
          <h3 className="text-lg font-bold mb-4">✅ Do these this week</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            {d.actions.map((a: string, i: number) => (
              <li key={i} className="flex gap-2"><span className="text-blue-600">→</span>{a}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Retention */}
      <div className="reveal card-premium p-6">
        <h3 className="text-lg font-bold mb-4">Retention &amp; roster</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Mini label="Active students" value={`${d.active}`} />
          <Mini label="Joined this year" value={`${d.joined}`} />
          <Mini label="Lost" value={`${d.lost}`} />
          <Mini label="Net retention" value={`${d.retention.toFixed(0)}%`} />
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: string }) {
  const tones: Record<string, string> = {
    green: "from-green-500 to-green-600", blue: "from-blue-500 to-blue-600", indigo: "from-indigo-500 to-indigo-600",
    teal: "from-teal-500 to-teal-600", purple: "from-purple-500 to-purple-600", amber: "from-amber-500 to-amber-600",
  };
  return (
    <div className={`bg-gradient-to-br ${tones[tone]} text-white rounded-2xl shadow-card p-4`}>
      <p className="text-white/80 text-xs">{label}</p>
      <p className="text-2xl font-bold leading-tight mt-1">{value}</p>
      <p className="text-white/70 text-xs mt-1">{sub}</p>
    </div>
  );
}
function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">{label}</span><span className="font-medium">{fmtC(value)}</span></div>
      <div className="bg-gray-100 rounded-full h-3 overflow-hidden"><div className={`${color} h-full rounded-full`} style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }} /></div>
    </div>
  );
}
function Mini({ label, value }: { label: string; value: string }) {
  return <div className="bg-gray-50 rounded-lg p-4"><p className="text-xs text-gray-500">{label}</p><p className="text-2xl font-bold text-brand-navy">{value}</p></div>;
}
function fmtC(a: number) {
  const v = Math.abs(a); const neg = a < 0;
  let s = v >= 1_000_000_000 ? `₫${(v / 1e9).toFixed(1)}B` : v >= 1_000_000 ? `₫${(v / 1e6).toFixed(1)}M` : `₫${v.toLocaleString()}`;
  return neg ? `-${s}` : s;
}
