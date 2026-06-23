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

// Multi-step follow-up sequences (cadences). Enrolling a lead creates a dated follow-up per step.
const SEQUENCES: { id: string; name: string; steps: { day: number; channel: string; note: string }[] }[] = [
  { id: "nurture", name: "New-lead nurture", steps: [
    { day: 0, channel: "PHONE", note: "Intro call — welcome & needs" },
    { day: 1, channel: "SMS", note: "Send centre info + trial-class link" },
    { day: 3, channel: "EMAIL", note: "Programme details & pricing" },
    { day: 7, channel: "PHONE", note: "Check interest, book trial" },
  ] },
  { id: "trial", name: "Trial follow-up", steps: [
    { day: 0, channel: "SMS", note: "Confirm trial-class time" },
    { day: 1, channel: "PHONE", note: "Trial feedback call" },
    { day: 3, channel: "EMAIL", note: "Enrolment offer + next steps" },
  ] },
  { id: "reengage", name: "Re-engage cold lead", steps: [
    { day: 0, channel: "EMAIL", note: "We miss you — new term starting" },
    { day: 5, channel: "PHONE", note: "Personal check-in" },
    { day: 10, channel: "SMS", note: "Last-chance enrolment offer" },
  ] },
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
  // Lead detail drawer
  const [selected, setSelected] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState("GENERAL");
  const [followups, setFollowups] = useState<any[]>([]);
  const [seqId, setSeqId] = useState(SEQUENCES[0].id);
  const [enrolling, setEnrolling] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!selected) return;
    setDrawerLoading(true);
    Promise.all([
      apiFetch(`/api/lead-activities/lead/${selected.id}`, {}, { silent: true }).catch(() => []),
      apiFetch(`/api/lead-notes/lead/${selected.id}`, {}, { silent: true }).catch(() => []),
      apiFetch(`/api/followups/lead/${selected.id}`, {}, { silent: true }).catch(() => []),
    ]).then(([a, n, f]) => {
      setActivities(Array.isArray(a) ? a : []);
      setNotes(Array.isArray(n) ? n : []);
      setFollowups(Array.isArray(f) ? f : []);
    }).finally(() => setDrawerLoading(false));
  }, [selected]);

  function isoDatePlus(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  async function enrollSequence() {
    if (!selected) return;
    const seq = SEQUENCES.find((s) => s.id === seqId);
    if (!seq) return;
    setEnrolling(true);
    try {
      // Create one dated follow-up per step (channel = action type, due = today + day offset).
      for (const step of seq.steps) {
        await apiFetch("/api/followups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadId: selected.id,
            actionType: step.channel,
            notes: `[${seq.name}] ${step.note}`,
            nextFollowupDate: isoDatePlus(step.day),
          }),
        }, { silent: true });
      }
      const f = await apiFetch(`/api/followups/lead/${selected.id}`, {}, { silent: true }).catch(() => []);
      setFollowups(Array.isArray(f) ? f : []);
      alert(`Enrolled in “${seq.name}” — ${seq.steps.length} follow-ups scheduled.`);
    } catch (e: any) {
      alert(e?.message || "Could not enroll in the sequence.");
    } finally {
      setEnrolling(false);
    }
  }

  async function addNote() {
    if (!selected || !noteText.trim()) return;
    try {
      await apiFetch("/api/lead-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: selected.id, note: noteText.trim(), noteType }),
      }, { silent: true });
      setNoteText("");
      const n = await apiFetch(`/api/lead-notes/lead/${selected.id}`, {}, { silent: true }).catch(() => []);
      setNotes(Array.isArray(n) ? n : []);
    } catch (e: any) {
      alert(e?.message || "Could not add the note.");
    }
  }

  // AI-draft a follow-up message from the lead's context (real draft when the gateway has an
  // OpenAI key; a sensible fallback otherwise). Result drops into the note box to edit/send.
  async function aiDraft() {
    if (!selected) return;
    setAiBusy(true);
    try {
      const who = selected.studentName || selected.parentName || "the student";
      const ctx = [
        `Student/lead: ${who}`,
        selected.parentName ? `Parent: ${selected.parentName}` : "",
        `Stage: ${norm(selected.status)}`,
        selected.temperature ? `Interest: ${selected.temperature}` : "",
        notes[0]?.note ? `Latest note: ${notes[0].note}` : "",
      ].filter(Boolean).join("; ");
      const res: any = await apiFetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: "You are a warm, concise admissions advisor at LERA English Academy. Draft a short, friendly follow-up message (2-4 sentences) to a parent to move this lead forward to enrolment. No placeholders.",
          message: `Write the next follow-up message for this lead. Context: ${ctx}.`,
        }),
      }, { silent: true }).catch(() => null);
      if (res?.message) {
        setNoteText(String(res.message).trim());
        if (res.usingRealAI === false) {
          // Honest signal: gateway has no OpenAI key, so this is a generic draft.
          setNoteType("EMAIL");
        }
      } else {
        alert("AI draft unavailable.");
      }
    } catch (e: any) {
      alert(e?.message || "AI draft failed.");
    } finally {
      setAiBusy(false);
    }
  }

  async function changeStatus(stage: string) {
    if (!selected) return;
    const lead = leads.find((l) => l.id === selected.id) || selected;
    setLeads((ls) => ls.map((l) => (l.id === selected.id ? { ...l, status: stage } : l)));
    setSelected({ ...selected, status: stage });
    try {
      await apiFetch(`/api/leads/${selected.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...lead, status: stage }),
      }, { silent: true });
      await load();
    } catch (e: any) { alert(e?.message || "Could not update status."); }
  }

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
                      onClick={() => setSelected(l)}
                      className={`bg-white rounded-lg border border-gray-200 shadow-sm p-3 cursor-pointer hover:shadow hover:ring-1 hover:ring-blue-300 ${dragId === l.id ? "opacity-50" : ""}`}
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

      {/* Lead detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md bg-white h-full shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b sticky top-0 bg-white flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selected.studentName || selected.parentName || "Lead"}</h2>
                <p className="text-sm text-gray-500">{selected.parentName && selected.studentName ? `Parent: ${selected.parentName}` : ""}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-400 block text-xs">Phone</span>{selected.parentPhone || "—"}</div>
                <div><span className="text-gray-400 block text-xs">Score</span>{selected.score ?? "—"}</div>
                <div><span className="text-gray-400 block text-xs">Temperature</span><span className={`px-2 py-0.5 rounded-full text-xs ${temp(selected.temperature)}`}>{String(selected.temperature || "—").toUpperCase()}</span></div>
                <div><span className="text-gray-400 block text-xs">Stage</span>
                  <select value={norm(selected.status)} onChange={(e) => changeStatus(e.target.value)}
                    className="mt-1 border border-gray-300 rounded px-2 py-1 text-sm w-full">
                    {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 text-sm mb-2">Add note</h3>
                <div className="flex gap-2 mb-2">
                  <select value={noteType} onChange={(e) => setNoteType(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm">
                    {["GENERAL", "CALL", "MEETING", "EMAIL", "IMPORTANT"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button onClick={aiDraft} disabled={aiBusy} title="AI-draft a follow-up message" className="px-3 py-1 rounded bg-purple-600 text-white text-sm disabled:opacity-50">
                    {aiBusy ? "…" : "✨ AI draft"}
                  </button>
                  <button onClick={addNote} disabled={!noteText.trim()} className="px-3 py-1 rounded bg-blue-600 text-white text-sm disabled:opacity-50">Add</button>
                </div>
                <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={2} placeholder="Log a call, note a follow-up…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>

              {/* Sequences / cadences */}
              <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                <h3 className="font-semibold text-gray-800 text-sm mb-2">📨 Enroll in sequence</h3>
                <div className="flex gap-2 items-center">
                  <select value={seqId} onChange={(e) => setSeqId(e.target.value)} className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm bg-white">
                    {SEQUENCES.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.steps.length} steps)</option>)}
                  </select>
                  <button onClick={enrollSequence} disabled={enrolling} className="px-3 py-1 rounded bg-blue-600 text-white text-sm disabled:opacity-50">
                    {enrolling ? "…" : "Enroll"}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">{SEQUENCES.find((s) => s.id === seqId)?.steps.map((s) => `D${s.day} ${s.channel}`).join(" · ")}</p>
              </div>

              {followups.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm mb-2">Scheduled follow-ups</h3>
                  <div className="space-y-1.5">
                    {[...followups].sort((a, b) => String(a.nextFollowupDate || a.scheduledAt).localeCompare(String(b.nextFollowupDate || b.scheduledAt))).map((f) => (
                      <div key={f.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{f.actionType}</span>
                          <span className="text-gray-700">{f.notes}</span>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{f.nextFollowupDate || (f.scheduledAt ? String(f.scheduledAt).slice(0, 10) : "")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {drawerLoading ? <p className="text-sm text-gray-400">Loading…</p> : (
                <>
                  {notes.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm mb-2">Notes</h3>
                      <div className="space-y-2">
                        {notes.map((n) => (
                          <div key={n.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>{n.noteType || "GENERAL"}</span>
                              <span>{n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}</span>
                            </div>
                            <div className="text-gray-700">{n.note}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-2">Activity timeline</h3>
                    {activities.length === 0 ? <p className="text-sm text-gray-400">No activity yet.</p> : (
                      <div className="space-y-2">
                        {activities.map((a) => (
                          <div key={a.id} className="flex gap-3 text-sm">
                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                            <div>
                              <div className="text-gray-800">{a.activityTitle || a.activityType}</div>
                              {a.description && <div className="text-gray-500 text-xs">{a.description}</div>}
                              <div className="text-gray-400 text-xs">{a.activityDate ? new Date(a.activityDate).toLocaleString() : ""}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
