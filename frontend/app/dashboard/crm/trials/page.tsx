"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { useUserCenter, buildCenterFilterUrl } from "../../../hooks/useUserCenter";

interface TrialSession {
  id: string;
  leadId: string;
  centerId?: string;
  programId?: string;
  scheduledAt: string;
  durationMinutes?: number;
  location?: string;
  status: "BOOKED" | "ATTENDED" | "NO_SHOW" | "CONVERTED" | "CANCELLED";
  placementLevel?: string;
  outcomeNotes?: string;
}

interface Lead {
  id: string;
  parentName?: string;
  studentName?: string;
  parentPhone?: string;
  status?: string;
}

const STATUS_COLORS: Record<string, string> = {
  BOOKED: "bg-blue-100 text-blue-800",
  ATTENDED: "bg-indigo-100 text-indigo-800",
  CONVERTED: "bg-green-100 text-green-800",
  NO_SHOW: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-600",
};

export default function TrialsPage() {
  const { centerId: userCenterId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [trials, setTrials] = useState<TrialSession[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBook, setShowBook] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ leadId: "", scheduledAt: "", durationMinutes: 45, location: "" });

  useEffect(() => {
    if (!userLoading) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading, userCenterId, shouldFilterByCenter]);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const trialsUrl = buildCenterFilterUrl("/api/trial-sessions", shouldFilterByCenter ? userCenterId : null);
      const leadsUrl = buildCenterFilterUrl("/api/leads", shouldFilterByCenter ? userCenterId : null);
      const [trialsData, leadsData] = await Promise.all([
        apiFetch(trialsUrl).catch(() => []),
        apiFetch(leadsUrl).catch(() => []),
      ]);
      setTrials(Array.isArray(trialsData) ? trialsData : []);
      setLeads(Array.isArray(leadsData) ? leadsData : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load trials");
    } finally {
      setLoading(false);
    }
  };

  const leadById = useMemo(() => {
    const m = new Map<string, Lead>();
    leads.forEach((l) => m.set(l.id, l));
    return m;
  }, [leads]);

  const leadLabel = (id: string) => {
    const l = leadById.get(id);
    if (!l) return "Unknown lead";
    const who = l.studentName || l.parentName || "Lead";
    return l.parentName && l.studentName ? `${l.studentName} (${l.parentName})` : who;
  };

  // Leads that don't yet have a booked/converted trial are the best candidates to book.
  const bookableLeads = useMemo(
    () => leads.filter((l) => l.status !== "CONVERTED" && l.status !== "LOST"),
    [leads]
  );

  async function book() {
    if (!form.leadId || !form.scheduledAt) {
      setError("Pick a lead and a date/time");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/api/trial-sessions", {
        method: "POST",
        body: JSON.stringify({
          leadId: form.leadId,
          scheduledAt: form.scheduledAt,
          durationMinutes: Number(form.durationMinutes) || 45,
          location: form.location || null,
        }),
      });
      setShowBook(false);
      setForm({ leadId: "", scheduledAt: "", durationMinutes: 45, location: "" });
      await fetchAll();
    } catch (e: any) {
      setError(e?.message || "Failed to book trial");
    } finally {
      setSaving(false);
    }
  }

  async function action(id: string, path: string, body?: Record<string, any>) {
    setError(null);
    try {
      await apiFetch(`/api/trial-sessions/${id}/${path}`, {
        method: "POST",
        body: JSON.stringify(body || {}),
      });
      await fetchAll();
    } catch (e: any) {
      setError(e?.message || "Action failed");
    }
  }

  function markAttended(t: TrialSession) {
    const level = window.prompt("Placement level from the trial (e.g. A2, Starters) — optional:", t.placementLevel || "");
    if (level === null) return; // cancelled
    action(t.id, "attended", { placementLevel: level || null });
  }

  function convert(t: TrialSession) {
    if (!confirm("Convert this trial to an enrolled student? This marks the lead CONVERTED.")) return;
    action(t.id, "convert");
  }

  const fmt = (s: string) => {
    try {
      return new Date(s).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return s;
    }
  };

  const count = (s: string) => trials.filter((t) => t.status === s).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/crm" className="hover:text-blue-600">CRM</Link>
            <span>/</span>
            <span className="text-gray-900">Trial Classes</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">🎓 Trial Classes</h1>
          <p className="text-gray-500">Book free trials, track attendance, and convert to enrolment</p>
        </div>
        <button
          onClick={() => setShowBook(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          ➕ Book Trial
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Booked", value: count("BOOKED"), icon: "📅", bg: "bg-blue-100" },
          { label: "Attended", value: count("ATTENDED"), icon: "✅", bg: "bg-indigo-100" },
          { label: "Converted", value: count("CONVERTED"), icon: "🎉", bg: "bg-green-100" },
          { label: "No-show", value: count("NO_SHOW"), icon: "❌", bg: "bg-red-100" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 ${s.bg} rounded-lg flex items-center justify-center text-xl`}>{s.icon}</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">When</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">Loading…</td></tr>
            ) : trials.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">No trials booked yet.</td></tr>
            ) : (
              trials.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{leadLabel(t.leadId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{fmt(t.scheduledAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{t.location || "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[t.status] || "bg-gray-100 text-gray-700"}`}>
                      {t.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{t.placementLevel || "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {t.status === "BOOKED" && (
                      <>
                        <button onClick={() => markAttended(t)} className="text-indigo-600 hover:text-indigo-800 mr-3">Attended</button>
                        <button onClick={() => action(t.id, "no-show")} className="text-red-600 hover:text-red-800 mr-3">No-show</button>
                        <button onClick={() => action(t.id, "cancel")} className="text-gray-500 hover:text-gray-700">Cancel</button>
                      </>
                    )}
                    {t.status === "ATTENDED" && (
                      <button onClick={() => convert(t)} className="text-green-600 hover:text-green-800">Convert →</button>
                    )}
                    {(t.status === "CONVERTED" || t.status === "NO_SHOW" || t.status === "CANCELLED") && (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowBook(false)}>
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <header className="flex items-center justify-between border-b px-5 py-3">
              <h2 className="text-base font-semibold">Book a Trial Class</h2>
              <button onClick={() => setShowBook(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </header>
            <div className="space-y-3 px-5 py-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Lead *</label>
                <select
                  value={form.leadId}
                  onChange={(e) => setForm({ ...form, leadId: e.target.value })}
                  className="h-9 w-full rounded-md border border-gray-300 px-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— select a lead —</option>
                  {bookableLeads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.studentName || l.parentName || "Lead"}{l.parentPhone ? ` · ${l.parentPhone}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date &amp; time *</label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                  className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={form.durationMinutes}
                    onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                    className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Location / room</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Room 101"
                    className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            <footer className="flex justify-end gap-2 border-t px-5 py-3">
              <button onClick={() => setShowBook(false)} className="h-9 rounded-md border border-gray-300 px-3 text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={book} disabled={saving} className="h-9 rounded-md bg-green-600 px-4 text-sm text-white hover:bg-green-700 disabled:opacity-60">
                {saving ? "Booking…" : "Book trial"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
