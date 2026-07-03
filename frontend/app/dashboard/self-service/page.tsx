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
        apiFetch(`/api/attendance/user/${userId}/summary?year=${new Date().getFullYear()}`, {}, { silent: true }).catch(() => null),
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

  // ---- Timesheet (punch clock + weekly grid) ----
  const [weekOffset, setWeekOffset] = useState(0);
  const [punching, setPunching] = useState(false);

  const localISO = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const hhmm = (t?: string | null) => (t ? String(t).slice(11, 16) : null); // "2026-07-03T07:54:55" → "07:54"
  const workedHours = (r: any): number | null => {
    if (!r?.checkInTime || !r?.checkOutTime) return null;
    const a = new Date(r.checkInTime).getTime();
    const b = new Date(r.checkOutTime).getTime();
    return b > a ? (b - a) / 3_600_000 : null;
  };

  const records: any[] = Array.isArray(attendance?.records) ? attendance.records : [];
  const recByDate: Record<string, any> = {};
  records.forEach((r) => { if (r?.date) recByDate[r.date] = r; });

  function weekDays(offset: number): Date[] {
    const now = new Date();
    const dow = now.getDay(); // 0 Sun … 6 Sat
    const monday = new Date(now);
    monday.setDate(now.getDate() + (dow === 0 ? -6 : 1 - dow) + offset * 7);
    monday.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d; });
  }

  async function punch(kind: "in" | "out") {
    setPunching(true); setError(null); setInfo(null);
    try {
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      const body: any = { date: localISO(now) };
      if (kind === "in") { body.checkInTime = time; body.status = "PRESENT"; } else { body.checkOutTime = time; }
      await apiFetch("/api/attendance/mark", { method: "POST", body: JSON.stringify(body) });
      setInfo(kind === "in" ? "Checked in ✓" : "Checked out ✓");
      await loadAll();
    } catch (e: any) {
      setError(e?.message || "Punch failed");
    } finally {
      setPunching(false);
    }
  }

  const dayStatusStyle = (s?: string) => {
    const m: Record<string, string> = {
      PRESENT: "bg-green-50 border-green-200", CHECKED_IN: "bg-green-50 border-green-200",
      LATE: "bg-amber-50 border-amber-200", ABSENT: "bg-red-50 border-red-200",
      LEAVE: "bg-blue-50 border-blue-200", OT: "bg-purple-50 border-purple-200",
    };
    return m[(s || "").toUpperCase()] || "bg-gray-50 border-gray-200";
  };

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
      ? `<tr><td>Hourly pay (${hours} hrs × ${fmt(rate)})</td><td class="r">${fmt(teachingAmount)}</td></tr>`
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
    { key: "attendance", label: "My Timesheet", icon: "🕒" },
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

          {tab === "attendance" && (() => {
            const todayISO = localISO(new Date());
            const todayRec = recByDate[todayISO];
            const inT = hhmm(todayRec?.checkInTime);
            const outT = hhmm(todayRec?.checkOutTime);
            const days = weekDays(weekOffset);
            const monLabel = days[0].toLocaleDateString(undefined, { day: "numeric", month: "short" });
            const sunLabel = days[6].toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
            const dowNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            const num = (v: any) => (typeof v === "number" ? v : Number(v) || 0);
            return (
              <div className="space-y-4">
                {/* Punch clock */}
                <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Today · {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {inT ? <>Checked in at <span className="text-green-700">{inT}</span></> : "Not checked in yet"}
                      {outT && <> · out at <span className="text-blue-700">{outT}</span></>}
                      {workedHours(todayRec) != null && <span className="text-gray-500 font-normal"> · {workedHours(todayRec)!.toFixed(1)}h worked</span>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!inT ? (
                      <button onClick={() => punch("in")} disabled={punching}
                        className="px-5 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-60">
                        🟢 {punching ? "…" : "Check In"}
                      </button>
                    ) : !outT ? (
                      <button onClick={() => punch("out")} disabled={punching}
                        className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60">
                        🔴 {punching ? "…" : "Check Out"}
                      </button>
                    ) : (
                      <span className="px-4 py-2.5 rounded-lg bg-gray-100 text-gray-600 font-medium">✅ Done for today</span>
                    )}
                  </div>
                </div>

                {/* Summary stats */}
                {attendance && typeof attendance === "object" && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Present days", value: num(attendance.presentDays), color: "text-green-700" },
                      { label: "Late days", value: num(attendance.lateDays), color: "text-amber-600" },
                      { label: "Absent days", value: num(attendance.absentDays), color: "text-red-600" },
                      { label: "Attendance rate", value: `${num(attendance.attendanceRate).toFixed(0)}%`, color: "text-blue-700" },
                    ].map((s) => (
                      <div key={s.label} className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-sm text-gray-500">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Weekly grid */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Timesheet · {monLabel} – {sunLabel}</h3>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setWeekOffset((w) => w - 1)} className="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-50">← Prev</button>
                      {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} className="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-50">This week</button>}
                      <button onClick={() => setWeekOffset((w) => Math.min(0, w + 1))} disabled={weekOffset >= 0}
                        className="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-40">Next →</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                    {days.map((d, i) => {
                      const iso = localISO(d);
                      const r = recByDate[iso];
                      const isToday = iso === todayISO;
                      const wh = workedHours(r);
                      return (
                        <div key={iso} className={`rounded-lg border p-3 min-h-[112px] ${dayStatusStyle(r?.status)} ${isToday ? "ring-2 ring-blue-400" : ""}`}>
                          <div className="flex items-baseline justify-between">
                            <span className="text-xs font-semibold text-gray-600">{dowNames[i]}</span>
                            <span className="text-xs text-gray-400">{d.getDate()}/{d.getMonth() + 1}</span>
                          </div>
                          {r ? (
                            <div className="mt-2 space-y-0.5 text-sm">
                              <p className="text-gray-700">In <b>{hhmm(r.checkInTime) || "—"}</b></p>
                              <p className="text-gray-700">Out <b>{hhmm(r.checkOutTime) || "—"}</b></p>
                              {wh != null && <p className="text-xs text-gray-500">{wh.toFixed(1)}h</p>}
                              <p className="text-[10px] uppercase tracking-wide text-gray-500">{(r.status || "").replace(/_/g, " ")}</p>
                            </div>
                          ) : (
                            <p className="mt-4 text-xs text-gray-400">No record</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-4 text-xs text-gray-400">Times reflect your own check-in / check-out. Ask HR if a day needs correcting.</p>
                </div>
              </div>
            );
          })()}

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
                        <span className="text-gray-500">Hourly pay <span className="text-gray-400">({hours} hrs × {money(rate, viewPayslip.currency)})</span></span>
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
