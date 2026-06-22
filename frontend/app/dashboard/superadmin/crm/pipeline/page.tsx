"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";

// The lead lifecycle, in order. Drag a card between columns to move the lead's stage.
const STAGES: { key: string; label: string; accent: string }[] = [
  { key: "NEW", label: "New", accent: "border-t-gray-400" },
  { key: "CONTACTED", label: "Contacted", accent: "border-t-blue-500" },
  { key: "QUALIFIED", label: "Qualified", accent: "border-t-indigo-500" },
  { key: "TRIAL_BOOKED", label: "Trial booked", accent: "border-t-amber-500" },
  { key: "TRIAL_ATTENDED", label: "Trial attended", accent: "border-t-orange-500" },
  { key: "CONVERTED", label: "Enrolled", accent: "border-t-green-600" },
  { key: "LOST", label: "Lost", accent: "border-t-red-500" },
];

type Lead = {
  id: string;
  parentName?: string;
  studentName?: string;
  parentPhone?: string;
  status?: string;
  score?: number;
  temperature?: string;
  assignedTo?: string;
};

export default function LeadPipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const data = await apiFetch("/api/leads", {}, { silent: true }).catch(() => []);
    setLeads(Array.isArray(data) ? data : (data as any)?.content || []);
    setLoading(false);
  }

  const norm = (s?: string) => String(s || "NEW").toUpperCase();
  const inStage = (stage: string) => leads.filter((l) => norm(l.status) === stage);

  async function moveTo(stage: string) {
    const id = dragId;
    setOverStage(null); setDragId(null);
    if (!id) return;
    const lead = leads.find((l) => l.id === id);
    if (!lead || norm(lead.status) === stage) return;
    const prev = lead.status;
    // Optimistic move.
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status: stage } : l)));
    setSaving(true);
    try {
      await apiFetch(`/api/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...lead, status: stage }),
      }, { silent: true });
      await load(); // refresh score/temperature (backend re-scores on change)
    } catch (e: any) {
      setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status: prev } : l))); // rollback
      alert(e?.message || "Could not move the lead.");
    } finally {
      setSaving(false);
    }
  }

  const temp = (t?: string) => {
    const v = String(t || "").toUpperCase();
    if (v === "HOT") return "bg-red-100 text-red-700";
    if (v === "WARM") return "bg-amber-100 text-amber-700";
    if (v === "COLD") return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-500";
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/dashboard/superadmin/crm" className="hover:text-blue-600">CRM</Link><span>/</span>
            <span className="text-gray-900">Pipeline</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">🧲 Lead Pipeline</h1>
          <p className="text-sm text-gray-500">Drag a lead between stages to move it. {saving && <span className="text-blue-600">Saving…</span>}</p>
        </div>
        <Link href="/dashboard/superadmin/crm/team-performance" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">🏆 Team Performance</Link>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-16">Loading…</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const cards = inStage(stage.key);
            return (
              <div
                key={stage.key}
                onDragOver={(e) => { e.preventDefault(); setOverStage(stage.key); }}
                onDragLeave={() => setOverStage((s) => (s === stage.key ? null : s))}
                onDrop={() => moveTo(stage.key)}
                className={`flex-shrink-0 w-72 bg-gray-50 rounded-xl border-t-4 ${stage.accent} ${overStage === stage.key ? "ring-2 ring-blue-400 bg-blue-50" : ""}`}
              >
                <div className="px-3 py-2 flex items-center justify-between border-b border-gray-200">
                  <span className="font-semibold text-gray-800">{stage.label}</span>
                  <span className="text-xs bg-white border border-gray-200 rounded-full px-2 py-0.5 text-gray-600">{cards.length}</span>
                </div>
                <div className="p-2 space-y-2 min-h-[120px] max-h-[70vh] overflow-y-auto">
                  {cards.map((l) => (
                    <div
                      key={l.id}
                      draggable
                      onDragStart={() => setDragId(l.id)}
                      onDragEnd={() => { setDragId(null); setOverStage(null); }}
                      className={`bg-white rounded-lg border border-gray-200 shadow-sm p-3 cursor-grab active:cursor-grabbing hover:shadow ${dragId === l.id ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-gray-900 text-sm">{l.studentName || l.parentName || "Lead"}</div>
                        {typeof l.score === "number" && (
                          <span className="text-xs text-gray-500 shrink-0">{l.score}</span>
                        )}
                      </div>
                      {l.parentName && l.studentName && <div className="text-xs text-gray-500">Parent: {l.parentName}</div>}
                      {l.parentPhone && <div className="text-xs text-gray-400">{l.parentPhone}</div>}
                      <div className="mt-2 flex items-center gap-2">
                        {l.temperature && <span className={`text-[10px] px-2 py-0.5 rounded-full ${temp(l.temperature)}`}>{String(l.temperature).toUpperCase()}</span>}
                      </div>
                    </div>
                  ))}
                  {cards.length === 0 && <div className="text-center text-xs text-gray-300 py-6">Drop here</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
