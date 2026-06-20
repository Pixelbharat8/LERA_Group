"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../lib/api";
import { useUserCenter } from "../../hooks/useUserCenter";

type Tab = "payslips" | "leave" | "attendance" | "news";

export default function SelfServicePortal() {
  const { userId, centerId, loading: userLoading } = useUserCenter();
  const [tab, setTab] = useState<Tab>("payslips");

  const [payslips, setPayslips] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [showApply, setShowApply] = useState(false);
  const [applying, setApplying] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ leaveType: "ANNUAL_LEAVE", leaveDate: "", endDate: "", reason: "" });
  const [viewPayslip, setViewPayslip] = useState<any>(null);

  useEffect(() => {
    if (!userLoading && userId) loadAll();
    else if (!userLoading && !userId) { setLoading(false); setError("Could not determine your user — please re-login."); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading, userId]);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [pay, reqs, bal, att, broadcasts] = await Promise.all([
        apiFetch(`/api/payroll/user/${userId}`, {}, { silent: true }).catch(() => []),
        apiFetch(`/api/leave-requests/user/${userId}`, {}, { silent: true }).catch(() => []),
        apiFetch(`/api/leave-balance/${userId}`, {}, { silent: true }).catch(() => null),
        apiFetch(`/api/attendance/user/${userId}/summary`, {}, { silent: true }).catch(() => null),
        apiFetch(`/api/broadcasts`, {}, { silent: true }).catch(() => []),
      ]);
      setPayslips(Array.isArray(pay) ? pay : []);
      setLeaveRequests(Array.isArray(reqs) ? reqs : []);
      setLeaveBalance(bal);
      setAttendance(att);
      setNews(Array.isArray(broadcasts) ? broadcasts : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load your data");
    } finally {
      setLoading(false);
    }
  }

  async function applyLeave() {
    if (!leaveForm.leaveDate || !leaveForm.reason) { setError("Pick a start date and a reason"); return; }
    setApplying(true);
    setError(null);
    setInfo(null);
    try {
      await apiFetch("/api/leaves/apply", {
        method: "POST",
        body: JSON.stringify({
          userId,
          centerId,
          userType: "STAFF",
          requestedBy: userId,
          leaveType: leaveForm.leaveType,
          leaveDate: leaveForm.leaveDate,
          endDate: leaveForm.endDate || leaveForm.leaveDate,
          reason: leaveForm.reason,
        }),
      });
      setInfo("Leave request submitted.");
      setShowApply(false);
      setLeaveForm({ leaveType: "ANNUAL_LEAVE", leaveDate: "", endDate: "", reason: "" });
      await loadAll();
    } catch (e: any) {
      setError(e?.message || "Failed to submit leave request");
    } finally {
      setApplying(false);
    }
  }

  const money = (v: any, cur = "VND") => (v == null ? "—" : `${Number(v).toLocaleString()} ${cur}`);

  // Open a clean, printable payslip in a new window (browser print = save-as-PDF).
  function printPayslip(p: any) {
    const cur = p.currency || "VND";
    const fmt = (v: any) => (v == null ? "—" : `${Number(v).toLocaleString()} ${cur}`);
    // Part-time / hourly staff are paid hourlyRate × hours; this is the teachingAmount the
    // backend computes. Include it in the gross so the payslip reconciles to net pay.
    const hours = Number(p.teachingHours) || 0;
    const rate = Number(p.hourlyRate) || 0;
    const teachingAmount = Number(p.teachingAmount) || (hours * rate);
    const hourlyRow = (hours > 0 || teachingAmount > 0)
      ? `<tr><td>Teaching pay (${hours} hrs × ${fmt(rate)})</td><td class="r">${fmt(teachingAmount)}</td></tr>`
      : "";
    const gross = (Number(p.baseSalary) || 0) + teachingAmount + (Number(p.bonus) || 0);
    const w = window.open("", "_blank", "width=720,height=900");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Payslip ${p.payPeriodStart || ""}</title>
      <style>body{font-family:system-ui,Arial,sans-serif;color:#111;padding:32px;max-width:640px;margin:auto}
      h1{font-size:20px;margin:0 0 4px} .muted{color:#666;font-size:13px}
      table{width:100%;border-collapse:collapse;margin-top:20px} td{padding:8px 0;border-bottom:1px solid #eee}
      td.r{text-align:right} .net{font-weight:700;font-size:18px} .net td{border-top:2px solid #111;border-bottom:none;padding-top:12px}
      .badge{display:inline-block;padding:2px 8px;border-radius:9999px;background:#eef;font-size:12px}</style></head><body>
      <h1>LERA Academy — Payslip</h1>
      <div class="muted">Pay period: ${p.payPeriodStart || "—"} → ${p.payPeriodEnd || "—"} · Status: <span class="badge">${p.status || "—"}</span></div>
      <table>
        <tr><td>Base salary</td><td class="r">${fmt(p.baseSalary)}</td></tr>
        ${hourlyRow}
        <tr><td>Bonus</td><td class="r">${fmt(p.bonus)}</td></tr>
        <tr><td>Gross</td><td class="r">${fmt(gross)}</td></tr>
        <tr><td>Deductions</td><td class="r">- ${fmt(p.deductions)}</td></tr>
        <tr class="net"><td>Net pay</td><td class="r">${fmt(p.totalAmount)}</td></tr>
      </table>
      <p class="muted" style="margin-top:24px">Generated ${new Date().toLocaleString()}</p>
      <script>window.onload=function(){window.print();}</script></body></html>`);
    w.document.close();
  }
  const statusPill = (s: string) => {
    const m: Record<string, string> = {
      PAID: "bg-green-100 text-green-800", APPROVED: "bg-green-100 text-green-800",
      PENDING: "bg-yellow-100 text-yellow-800", REJECTED: "bg-red-100 text-red-800",
      CANCELLED: "bg-gray-100 text-gray-600",
    };
    return m[s?.toUpperCase()] || "bg-gray-100 text-gray-700";
  };
  const prettyKey = (k: string) => k.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: "payslips", label: "My Payslips", icon: "💵" },
    { key: "leave", label: "My Leave", icon: "🏖️" },
    { key: "attendance", label: "My Attendance", icon: "🕒" },
    { key: "news", label: "Announcements", icon: "📰" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-900">My Workspace</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">🙋 My Workspace</h1>
        <p className="text-gray-500">Your payslips, leave, attendance, and centre announcements</p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {info && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">{info}</div>}

      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${tab === t.key ? "bg-white border border-b-white border-gray-200 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-10">Loading…</div>
      ) : (
        <>
          {tab === "payslips" && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pay period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours × rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bonus</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net pay</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payslips.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-10 text-center text-gray-500">No payslips yet.</td></tr>
                  ) : payslips.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">{p.payPeriodStart || "—"} → {p.payPeriodEnd || "—"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{money(p.baseSalary, p.currency)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {(Number(p.teachingHours) || 0) > 0 || (Number(p.teachingAmount) || 0) > 0
                          ? <span title={`${Number(p.teachingHours) || 0} hrs × ${money(p.hourlyRate, p.currency)}`}>{money(p.teachingAmount ?? (Number(p.teachingHours) || 0) * (Number(p.hourlyRate) || 0), p.currency)}</span>
                          : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{money(p.bonus, p.currency)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{money(p.deductions, p.currency)}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">{money(p.totalAmount, p.currency)}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs rounded-full ${statusPill(p.status)}`}>{p.status}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button onClick={() => setViewPayslip(p)} className="text-blue-600 hover:text-blue-700 text-sm mr-3">View</button>
                        <button onClick={() => printPayslip(p)} className="text-gray-600 hover:text-gray-800 text-sm">🖨️ Print</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "leave" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {leaveBalance && typeof leaveBalance === "object" ? (
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(leaveBalance).filter(([, v]) => typeof v === "number").map(([k, v]) => (
                        <span key={k} className="px-3 py-1 rounded-full bg-blue-50 text-blue-700">{prettyKey(k)}: <b>{String(v)}</b></span>
                      ))}
                    </div>
                  ) : <span className="text-gray-400">Leave balance unavailable</span>}
                </div>
                <button onClick={() => setShowApply(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">➕ Apply for leave</button>
              </div>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {leaveRequests.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">No leave requests yet.</td></tr>
                    ) : leaveRequests.map((l) => (
                      <tr key={l.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">{(l.leaveType || "").replace(/_/g, " ")}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{l.leaveDate || l.startDate || "—"}{(l.endDate && l.endDate !== l.leaveDate) ? ` → ${l.endDate}` : ""}</td>
                        <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{l.reason || "—"}</td>
                        <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs rounded-full ${statusPill(l.status)}`}>{l.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "attendance" && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              {attendance && typeof attendance === "object" && Object.keys(attendance).length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(attendance).map(([k, v]) => (
                    <div key={k} className="border border-gray-100 rounded-lg p-4">
                      <p className="text-2xl font-bold text-gray-900">{typeof v === "number" || typeof v === "string" ? String(v) : "—"}</p>
                      <p className="text-sm text-gray-500">{prettyKey(k)}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-500">No attendance summary available yet.</p>}
            </div>
          )}

          {tab === "news" && (
            <div className="space-y-3">
              {news.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-500">No announcements.</div>
              ) : news.map((n, i) => (
                <div key={n.id || i} className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{n.title || n.subject || "Announcement"}</h3>
                    <span className="text-xs text-gray-400">{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ""}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{n.message || n.body || n.content || ""}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {viewPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewPayslip(null)}>
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <header className="flex items-center justify-between border-b px-5 py-3">
              <h2 className="text-base font-semibold">💵 Payslip</h2>
              <button onClick={() => setViewPayslip(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </header>
            <div className="px-5 py-4">
              <div className="text-sm text-gray-500 mb-3">
                {viewPayslip.payPeriodStart || "—"} → {viewPayslip.payPeriodEnd || "—"}
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${statusPill(viewPayslip.status)}`}>{viewPayslip.status}</span>
              </div>
              {(() => {
                const hours = Number(viewPayslip.teachingHours) || 0;
                const rate = Number(viewPayslip.hourlyRate) || 0;
                const teaching = Number(viewPayslip.teachingAmount) || hours * rate;
                const gross = (Number(viewPayslip.baseSalary) || 0) + teaching + (Number(viewPayslip.bonus) || 0);
                return (
                  <div className="divide-y">
                    <div className="flex justify-between py-2 text-sm"><span className="text-gray-500">Base salary</span><span>{money(viewPayslip.baseSalary, viewPayslip.currency)}</span></div>
                    {(hours > 0 || teaching > 0) && (
                      <div className="flex justify-between py-2 text-sm">
                        <span className="text-gray-500">Teaching pay <span className="text-gray-400">({hours} hrs × {money(rate, viewPayslip.currency)})</span></span>
                        <span>{money(teaching, viewPayslip.currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 text-sm"><span className="text-gray-500">Bonus</span><span>{money(viewPayslip.bonus, viewPayslip.currency)}</span></div>
                    <div className="flex justify-between py-2 text-sm"><span className="text-gray-500">Gross</span><span>{money(gross, viewPayslip.currency)}</span></div>
                    <div className="flex justify-between py-2 text-sm"><span className="text-gray-500">Deductions</span><span className="text-red-600">- {money(viewPayslip.deductions, viewPayslip.currency)}</span></div>
                    <div className="flex justify-between py-3 text-base font-bold border-t-2 border-gray-900"><span>Net pay</span><span>{money(viewPayslip.totalAmount, viewPayslip.currency)}</span></div>
                  </div>
                );
              })()}
            </div>
            <footer className="flex justify-end gap-2 border-t px-5 py-3">
              <button onClick={() => setViewPayslip(null)} className="h-9 rounded-md border border-gray-300 px-3 text-sm hover:bg-gray-50">Close</button>
              <button onClick={() => printPayslip(viewPayslip)} className="h-9 rounded-md bg-blue-600 px-4 text-sm text-white hover:bg-blue-700">🖨️ Print / Download PDF</button>
            </footer>
          </div>
        </div>
      )}

      {showApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowApply(false)}>
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <header className="flex items-center justify-between border-b px-5 py-3">
              <h2 className="text-base font-semibold">Apply for Leave</h2>
              <button onClick={() => setShowApply(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </header>
            <div className="space-y-3 px-5 py-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Leave type</label>
                <select value={leaveForm.leaveType} onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                  className="h-9 w-full rounded-md border border-gray-300 px-2 text-sm">
                  {["ANNUAL_LEAVE", "SICK_LEAVE", "CASUAL_LEAVE", "EMERGENCY", "MATERNITY", "PATERNITY", "BEREAVEMENT"].map((t) => (
                    <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">From *</label>
                  <input type="date" value={leaveForm.leaveDate} onChange={(e) => setLeaveForm({ ...leaveForm, leaveDate: e.target.value })}
                    className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
                  <input type="date" value={leaveForm.endDate} onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reason *</label>
                <textarea rows={3} value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <footer className="flex justify-end gap-2 border-t px-5 py-3">
              <button onClick={() => setShowApply(false)} className="h-9 rounded-md border border-gray-300 px-3 text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={applyLeave} disabled={applying} className="h-9 rounded-md bg-green-600 px-4 text-sm text-white hover:bg-green-700 disabled:opacity-60">
                {applying ? "Submitting…" : "Submit"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
