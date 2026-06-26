"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

interface Stage {
  key: string;
  label: string;
  count: number;
  domain: "crm" | "academy" | "finance";
  hint: string;
}

interface FunnelData {
  stages: Stage[];
  revenue: number;
  payingStudents: number;
  leads: number;
  converted: number;
}

const DOMAIN_COLOR: Record<Stage["domain"], string> = {
  crm: "from-indigo-400 to-indigo-600",
  academy: "from-teal-400 to-teal-600",
  finance: "from-green-400 to-green-600",
};
const DOMAIN_LABEL: Record<Stage["domain"], string> = {
  crm: "CRM · Acquisition",
  academy: "Academy",
  finance: "Finance",
};

export default function CEOFunnelPage() {
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFunnel();
  }, []);

  const fetchFunnel = async () => {
    try {
      setLoading(true);
      const [leadStats, enrollmentsRaw, , paymentsRaw] = await Promise.all([
        apiFetch("/api/leads/stats", {}, { silent: true }).catch(() => null),
        apiFetch("/api/enrollments").catch(() => []),
        apiFetch("/api/students").catch(() => []),
        apiFetch("/api/payments").catch(() => []),
      ]);

      const enrollments = Array.isArray(enrollmentsRaw) ? enrollmentsRaw : [];
      const payments = Array.isArray(paymentsRaw) ? paymentsRaw : [];
      const isPaid = (p: any) => ["PAID", "paid", "COMPLETED", "completed"].includes(p.status);

      // Lead pipeline (current statuses are mutually exclusive → cumulative "reached stage" counts).
      const leads = Number(leadStats?.totalCount) || 0;
      const convertedC = Number(leadStats?.convertedCount) || 0;
      const qualifiedC = Number(leadStats?.qualifiedCount) || 0;
      const contactedC = Number(leadStats?.contactedCount) || 0;
      const reachedConverted = convertedC;
      const reachedQualified = qualifiedC + convertedC;
      const reachedContacted = contactedC + qualifiedC + convertedC;

      // Realized students & revenue.
      const enrolledStudents = new Set(enrollments.map((e: any) => String(e.studentId))).size;
      const payingStudents = new Set(payments.filter(isPaid).map((p: any) => String(p.studentId))).size;
      const revenue = payments.filter(isPaid).reduce((s: number, p: any) => s + (p.amount || 0), 0);

      const stages: Stage[] = [
        { key: "leads", label: "Leads", count: leads, domain: "crm", hint: "Inquiries captured" },
        { key: "contacted", label: "Contacted", count: reachedContacted, domain: "crm", hint: "Reached out to" },
        { key: "qualified", label: "Qualified", count: reachedQualified, domain: "crm", hint: "Good-fit prospects" },
        { key: "converted", label: "Converted", count: reachedConverted, domain: "crm", hint: "Won as students" },
        { key: "enrolled", label: "Enrolled", count: enrolledStudents, domain: "academy", hint: "In a class (incl. direct)" },
        { key: "paying", label: "Paying", count: payingStudents, domain: "finance", hint: "Made ≥1 payment" },
      ];

      setData({ stages, revenue, payingStudents, leads, converted: reachedConverted });
    } catch (e) {
      console.error("Error loading funnel:", e);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (a: number) => {
    if (a >= 1_000_000_000) return `₫${(a / 1_000_000_000).toFixed(1)}B`;
    if (a >= 1_000_000) return `₫${(a / 1_000_000).toFixed(1)}M`;
    return `₫${a.toLocaleString()}`;
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const maxCount = Math.max(1, ...data.stages.map((s) => s.count));
  const avgPerPaying = data.payingStudents > 0 ? data.revenue / data.payingStudents : 0;
  const leadToConverted = data.leads > 0 ? (data.converted / data.leads) * 100 : 0;

  // Biggest drop-off within the lead pipeline (where the % drop from previous is largest).
  let worst: { from: string; to: string; drop: number } | null = null;
  for (let i = 1; i < data.stages.length; i++) {
    const prev = data.stages[i - 1];
    const cur = data.stages[i];
    // Skip the converted→enrolled boundary (domains differ; enrolled can exceed converted via direct sign-ups).
    if (prev.key === "converted") continue;
    if (prev.count === 0) continue;
    const dropPct = ((prev.count - cur.count) / prev.count) * 100;
    if (dropPct > 0 && (!worst || dropPct > worst.drop)) worst = { from: prev.label, to: cur.label, drop: dropPct };
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">End-to-End Funnel</h1>
          <p className="text-gray-600">Acquisition → enrolment → revenue · real data across CRM, Academy & Finance</p>
        </div>
        <Link href="/dashboard/ceo" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
          ← Back
        </Link>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">Lead → Converted</p>
          <p className="text-3xl font-bold text-indigo-600">{leadToConverted.toFixed(0)}%</p>
          <p className="text-xs text-gray-400 mt-1">{data.converted} of {data.leads} leads won</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">Paying Students</p>
          <p className="text-3xl font-bold text-green-600">{data.payingStudents}</p>
          <p className="text-xs text-gray-400 mt-1">made ≥1 payment</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">Revenue</p>
          <p className="text-3xl font-bold text-gray-800">{fmt(data.revenue)}</p>
          <p className="text-xs text-gray-400 mt-1">collected to date</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">Avg Revenue / Student</p>
          <p className="text-3xl font-bold text-gray-800">{fmt(avgPerPaying)}</p>
          <p className="text-xs text-gray-400 mt-1">lifetime value</p>
        </div>
      </div>

      {/* Funnel */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-bold mb-6">Acquisition → Revenue Funnel</h3>
        <div className="space-y-1">
          {data.stages.map((s, i) => {
            const prev = i > 0 ? data.stages[i - 1] : null;
            const width = Math.max(6, (s.count / maxCount) * 100);
            const pctOfLeads = data.leads > 0 ? (s.count / data.leads) * 100 : 0;
            // Conversion from previous (suppress at the lead→student domain change).
            const boundary = prev && prev.key === "converted";
            const conv = prev && prev.count > 0 ? (s.count / prev.count) * 100 : null;
            return (
              <div key={s.key}>
                {prev && (
                  <div className="flex items-center gap-2 pl-4 h-7 text-xs">
                    {boundary ? (
                      <span className="text-gray-400">↓ enrolled students (some sign up directly, not via a tracked lead)</span>
                    ) : (
                      <span className={`${conv !== null && conv < 50 ? "text-orange-600" : "text-gray-500"}`}>
                        ↓ {conv !== null ? conv.toFixed(0) : "—"}% continue
                        {conv !== null && (
                          <span className="text-gray-400"> · {prev.count - s.count} drop off</span>
                        )}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <div
                    className={`bg-gradient-to-r ${DOMAIN_COLOR[s.domain]} text-white rounded-lg h-16 flex items-center justify-between px-5 transition-all`}
                    style={{ width: `${width}%`, minWidth: "180px" }}
                  >
                    <div>
                      <p className="font-bold text-lg leading-tight">{s.label}</p>
                      <p className="text-xs opacity-80">{s.hint}</p>
                    </div>
                    <span className="text-2xl font-bold">{s.count}</span>
                  </div>
                  <div className="text-sm text-gray-500 whitespace-nowrap">{pctOfLeads.toFixed(0)}% of leads</div>
                </div>
              </div>
            );
          })}
          {/* Revenue cap */}
          <div className="flex items-center gap-2 pl-4 h-7 text-xs text-gray-400">↓ generates</div>
          <div className="bg-gray-900 text-white rounded-lg h-16 flex items-center justify-between px-5" style={{ width: "100%" }}>
            <div>
              <p className="font-bold text-lg leading-tight">Revenue</p>
              <p className="text-xs opacity-80">tuition collected from paying students</p>
            </div>
            <span className="text-2xl font-bold">{fmt(data.revenue)}</span>
          </div>
        </div>

        {/* Domain legend */}
        <div className="flex flex-wrap gap-4 mt-6 text-xs">
          {(["crm", "academy", "finance"] as const).map((d) => (
            <span key={d} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-sm bg-gradient-to-r ${DOMAIN_COLOR[d]}`} /> {DOMAIN_LABEL[d]}
            </span>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white rounded-xl shadow p-6">
        <h4 className="font-semibold mb-3">💡 Funnel insights</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• {leadToConverted.toFixed(0)}% of leads convert to students ({data.converted}/{data.leads}).</li>
          {worst && (
            <li>• Biggest acquisition drop-off: <span className="font-medium text-orange-600">{worst.from} → {worst.to}</span> (−{worst.drop.toFixed(0)}%) — the stage to improve first.</li>
          )}
          <li>• {data.payingStudents} students are paying; average lifetime value <span className="font-medium">{fmt(avgPerPaying)}</span>.</li>
          {data.stages.find((s) => s.key === "enrolled")!.count > data.converted && (
            <li>• Enrolled students ({data.stages.find((s) => s.key === "enrolled")!.count}) exceed converted leads ({data.converted}) — most enrolments come in directly, not through the tracked lead pipeline. Capturing those as leads would sharpen attribution.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
