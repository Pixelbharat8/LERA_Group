"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { useUserCenter, buildCenterFilterUrl } from "../../../hooks/useUserCenter";

interface Followup {
  id: string;
  leadName: string;
  type: string;
  date: string;
  time?: string;
  status: string;
  notes: string;
}

export default function FollowupsPage() {
  const { centerId: userCenterId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(true);
  // Schedule modal
  const [showModal, setShowModal] = useState(false);
  const [leads, setLeads] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ leadId: "", actionType: "PHONE", date: "", time: "", notes: "" });
  const [formErr, setFormErr] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading) {
      fetchFollowups();
      fetchLeads();
    }
  }, [userLoading, userCenterId, shouldFilterByCenter]);

  const fetchLeads = async () => {
    try {
      const data = await apiFetch("/api/leads").catch(() => []);
      const arr = Array.isArray(data) ? data : (data as any)?.content || [];
      setLeads(arr.map((l: any) => ({ id: l.id, name: l.parentName || l.name || l.studentName || "Lead" })));
    } catch {
      setLeads([]);
    }
  };

  const handleSchedule = async () => {
    if (!form.leadId) { setFormErr("Select a lead."); return; }
    if (!form.date) { setFormErr("Pick a date."); return; }
    setSaving(true);
    setFormErr(null);
    try {
      const scheduledAt = `${form.date}T${form.time || "09:00"}:00`;
      await apiFetch("/api/followups", {
        method: "POST",
        body: JSON.stringify({
          leadId: form.leadId,
          actionType: form.actionType,
          nextFollowupDate: form.date,
          scheduledAt,
          notes: form.notes || null,
          status: "PENDING",
        }),
      });
      setShowModal(false);
      setForm({ leadId: "", actionType: "PHONE", date: "", time: "", notes: "" });
      await fetchFollowups();
    } catch (e: any) {
      setFormErr(e?.message || "Could not schedule the follow-up.");
    } finally {
      setSaving(false);
    }
  };

  const fetchFollowups = async () => {
    try {
      const url = buildCenterFilterUrl(
        "/api/followups",
        shouldFilterByCenter ? userCenterId : null
      );
      const data = await apiFetch(url);
      const followupsArray = Array.isArray(data) ? data : [];
      setFollowups(followupsArray.map((f: any) => ({
        id: f.id,
        leadName: f.lead?.parentName || f.leadName || "Unknown Lead",
        type: f.actionType || f.action_type || f.type || "Call",
        date: f.nextFollowupDate?.split("T")[0] || f.next_followup_date || new Date().toISOString().split("T")[0],
        // Real scheduled time from the timestamp (blank when the follow-up is date-only).
        time: f.nextFollowupDate && String(f.nextFollowupDate).includes("T")
          ? new Date(f.nextFollowupDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "",
        status: f.outcome === "INTERESTED" ? "Scheduled" : f.outcome === "CALLBACK" ? "Pending" : f.outcome === "SCHEDULED_DEMO" ? "Scheduled" : f.outcome ? "Completed" : "Pending",
        notes: f.notes || ""
      })));
    } catch (err) {
      console.error("Error fetching followups:", err);
      setFollowups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id: string) => {
    if (!confirm("Mark this follow-up as completed?")) return;
    try {
      await apiFetch(`/api/followups/${id}`, {
        method: "PUT",
        // status DONE marks it complete (the main CRM dashboard counts pending via status);
        // outcome records how it went.
        body: JSON.stringify({ status: "DONE", outcome: "CONVERTED" }),
      });
      await fetchFollowups();
    } catch (err) {
      console.error("Error completing followup:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Completed": return "bg-green-100 text-green-800";
      case "Scheduled": return "bg-blue-100 text-blue-800";
      case "Missed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/superadmin" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">Follow-ups</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">📋 Follow-ups</h1>
          <p className="text-gray-500">Track lead follow-up activities</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          ➕ Schedule Follow-up
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-2xl">⏳</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{followups.filter(f => f.status === "Pending").length}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">📅</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{followups.filter(f => f.status === "Scheduled").length}</p>
              <p className="text-sm text-gray-500">Scheduled</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">✅</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{followups.filter(f => f.status === "Completed").length}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-2xl">❌</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{followups.filter(f => f.status === "Missed").length}</p>
              <p className="text-sm text-gray-500">Missed</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {followups.map((followup) => (
              <tr key={followup.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium">{followup.leadName}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs bg-gray-100 rounded">{followup.type}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{followup.date} {followup.time}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(followup.status)}`}>{followup.status}</span>
                </td>
                <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{followup.notes}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button onClick={() => handleComplete(followup.id)} className="text-green-600 hover:text-green-800">Complete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !saving && setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Schedule a follow-up</h2>
              <button onClick={() => !saving && setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lead *</label>
                <select value={form.leadId} onChange={(e) => setForm({ ...form, leadId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">Select a lead…</option>
                  {leads.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.actionType} onChange={(e) => setForm({ ...form, actionType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    {["PHONE", "EMAIL", "SMS", "MEETING", "OTHER"].map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time (optional)</label>
                <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              {formErr && <div className="p-2 rounded-lg bg-red-50 text-red-700 text-sm">{formErr}</div>}
              <div className="flex gap-3 pt-1">
                <button onClick={handleSchedule} disabled={saving} className="flex-1 py-2.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50">
                  {saving ? "Scheduling…" : "Schedule follow-up"}
                </button>
                <button onClick={() => setShowModal(false)} disabled={saving} className="px-5 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
