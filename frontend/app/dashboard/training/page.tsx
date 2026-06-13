"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { apiFetch } from "../../../lib/api";
import { useUserCenter } from "../../hooks/useUserCenter";

type Tab = "schedule" | "mine" | "certs";

interface Session {
  id: string;
  title: string;
  category?: string;
  trainer?: string;
  scheduledAt: string;
  durationMinutes?: number;
  location?: string;
  capacity?: number;
  status: string;
  description?: string;
}
interface Registration { id: string; sessionId: string; status: string; }
interface Cert {
  id: string; name: string; issuer?: string; issueDate?: string; expiryDate?: string; credentialId?: string; notes?: string;
}

function currentUserName(): string {
  try {
    const raw = Cookies.get("userData");
    if (!raw) return "";
    const u = JSON.parse(decodeURIComponent(raw));
    return u.fullName || u.name || u.email || "";
  } catch {
    return "";
  }
}

export default function TrainingPage() {
  const { userId, centerId, loading: userLoading } = useUserCenter();
  const [tab, setTab] = useState<Tab>("schedule");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [myRegs, setMyRegs] = useState<Registration[]>([]);
  const [certs, setCerts] = useState<Cert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [showSession, setShowSession] = useState(false);
  const [showCert, setShowCert] = useState(false);
  const [sessionForm, setSessionForm] = useState({ title: "", category: "", trainer: "", scheduledAt: "", durationMinutes: 60, location: "", capacity: "" });
  const [certForm, setCertForm] = useState({ name: "", issuer: "", issueDate: "", expiryDate: "", credentialId: "", notes: "" });

  useEffect(() => {
    if (!userLoading) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading, userId]);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [s, regs, c] = await Promise.all([
        apiFetch("/api/training-sessions").catch(() => []),
        userId ? apiFetch(`/api/training-sessions/registrations/user/${userId}`).catch(() => []) : Promise.resolve([]),
        userId ? apiFetch(`/api/staff-certifications/user/${userId}`).catch(() => []) : Promise.resolve([]),
      ]);
      setSessions(Array.isArray(s) ? s : []);
      setMyRegs(Array.isArray(regs) ? regs : []);
      setCerts(Array.isArray(c) ? c : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load training");
    } finally {
      setLoading(false);
    }
  }

  const regBySession = useMemo(() => {
    const m = new Map<string, Registration>();
    myRegs.forEach((r) => m.set(r.sessionId, r));
    return m;
  }, [myRegs]);
  const sessionById = useMemo(() => {
    const m = new Map<string, Session>();
    sessions.forEach((s) => m.set(s.id, s));
    return m;
  }, [sessions]);

  async function register(sessionId: string) {
    setError(null); setInfo(null);
    try {
      await apiFetch(`/api/training-sessions/${sessionId}/register`, {
        method: "POST",
        body: JSON.stringify({ userId, userName: currentUserName() }),
      });
      setInfo("Registered for the session.");
      await loadAll();
    } catch (e: any) {
      setError(e?.message || "Could not register (you may already be registered or it's full)");
    }
  }

  async function createSession() {
    if (!sessionForm.title || !sessionForm.scheduledAt) { setError("Title and date/time are required"); return; }
    setError(null);
    try {
      await apiFetch("/api/training-sessions", {
        method: "POST",
        body: JSON.stringify({
          ...sessionForm,
          durationMinutes: Number(sessionForm.durationMinutes) || 60,
          capacity: sessionForm.capacity ? Number(sessionForm.capacity) : null,
          centerId,
        }),
      });
      setShowSession(false);
      setSessionForm({ title: "", category: "", trainer: "", scheduledAt: "", durationMinutes: 60, location: "", capacity: "" });
      await loadAll();
    } catch (e: any) {
      setError(e?.message || "Failed to create session (admin only)");
    }
  }

  async function addCert() {
    if (!certForm.name) { setError("Certificate name is required"); return; }
    setError(null);
    try {
      await apiFetch("/api/staff-certifications", {
        method: "POST",
        body: JSON.stringify({ ...certForm, userId, userName: currentUserName(), centerId }),
      });
      setShowCert(false);
      setCertForm({ name: "", issuer: "", issueDate: "", expiryDate: "", credentialId: "", notes: "" });
      await loadAll();
    } catch (e: any) {
      setError(e?.message || "Failed to add certification");
    }
  }

  async function deleteCert(id: string) {
    if (!confirm("Delete this certification?")) return;
    try { await apiFetch(`/api/staff-certifications/${id}`, { method: "DELETE" }); await loadAll(); }
    catch (e: any) { setError(e?.message || "Delete failed"); }
  }

  const fmt = (s?: string) => { if (!s) return "—"; try { return new Date(s).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }); } catch { return s; } };
  const upcoming = sessions.filter((s) => s.status === "SCHEDULED");

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: "schedule", label: "Training Schedule", icon: "📅" },
    { key: "mine", label: "My Training", icon: "🎯" },
    { key: "certs", label: "My Certifications", icon: "🏅" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span><span className="text-gray-900">Staff Training</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">📚 Staff Training &amp; Certifications</h1>
          <p className="text-gray-500">Professional development — register for sessions and track your credentials</p>
        </div>
        {tab === "schedule" && (
          <button onClick={() => setShowSession(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">➕ New session</button>
        )}
        {tab === "certs" && (
          <button onClick={() => setShowCert(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">➕ Add certification</button>
        )}
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {info && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">{info}</div>}

      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${tab === t.key ? "bg-white border border-b-white border-gray-200 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-10">Loading…</div>
      ) : tab === "schedule" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcoming.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl shadow-sm p-10 text-center text-gray-500">No upcoming training sessions.</div>
          ) : upcoming.map((s) => {
            const reg = regBySession.get(s.id);
            return (
              <div key={s.id} className="bg-white rounded-xl shadow-sm p-5 flex flex-col">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900">{s.title}</h3>
                  {s.category && <span className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5">{s.category}</span>}
                </div>
                <p className="text-sm text-gray-500 mt-1">{fmt(s.scheduledAt)}{s.durationMinutes ? ` · ${s.durationMinutes}m` : ""}</p>
                {s.trainer && <p className="text-sm text-gray-500">👤 {s.trainer}</p>}
                {s.location && <p className="text-sm text-gray-500">📍 {s.location}</p>}
                {s.description && <p className="text-sm text-gray-600 mt-2 line-clamp-3">{s.description}</p>}
                <div className="mt-4">
                  {reg ? (
                    <span className="inline-block text-xs px-3 py-1 rounded-full bg-green-100 text-green-800">✓ {reg.status}</span>
                  ) : (
                    <button onClick={() => register(s.id)} className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Register</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : tab === "mine" ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">When</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">My status</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-200">
              {myRegs.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-10 text-center text-gray-500">You haven't registered for any training yet.</td></tr>
              ) : myRegs.map((r) => {
                const s = sessionById.get(r.sessionId);
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{s?.title || "Session"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{fmt(s?.scheduledAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">{r.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Certificate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issuer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issued</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-200">
              {certs.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">No certifications recorded yet.</td></tr>
              ) : certs.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{c.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{c.issuer || "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{c.issueDate || "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{c.expiryDate || "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button onClick={() => deleteCert(c.id)} className="text-sm text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowSession(false)}>
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <header className="flex items-center justify-between border-b px-5 py-3">
              <h2 className="text-base font-semibold">New Training Session</h2>
              <button onClick={() => setShowSession(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </header>
            <div className="space-y-3 px-5 py-4">
              <input placeholder="Title *" value={sessionForm.title} onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })} className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Category" value={sessionForm.category} onChange={(e) => setSessionForm({ ...sessionForm, category: e.target.value })} className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm" />
                <input placeholder="Trainer" value={sessionForm.trainer} onChange={(e) => setSessionForm({ ...sessionForm, trainer: e.target.value })} className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm" />
              </div>
              <input type="datetime-local" value={sessionForm.scheduledAt} onChange={(e) => setSessionForm({ ...sessionForm, scheduledAt: e.target.value })} className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm" />
              <div className="grid grid-cols-3 gap-3">
                <input type="number" placeholder="Duration (m)" value={sessionForm.durationMinutes} onChange={(e) => setSessionForm({ ...sessionForm, durationMinutes: Number(e.target.value) })} className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm" />
                <input placeholder="Location" value={sessionForm.location} onChange={(e) => setSessionForm({ ...sessionForm, location: e.target.value })} className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm" />
                <input type="number" placeholder="Capacity" value={sessionForm.capacity} onChange={(e) => setSessionForm({ ...sessionForm, capacity: e.target.value })} className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm" />
              </div>
            </div>
            <footer className="flex justify-end gap-2 border-t px-5 py-3">
              <button onClick={() => setShowSession(false)} className="h-9 rounded-md border border-gray-300 px-3 text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={createSession} className="h-9 rounded-md bg-blue-600 px-4 text-sm text-white hover:bg-blue-700">Create</button>
            </footer>
          </div>
        </div>
      )}

      {showCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCert(false)}>
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <header className="flex items-center justify-between border-b px-5 py-3">
              <h2 className="text-base font-semibold">Add Certification</h2>
              <button onClick={() => setShowCert(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </header>
            <div className="space-y-3 px-5 py-4">
              <input placeholder="Name * (e.g. CELTA)" value={certForm.name} onChange={(e) => setCertForm({ ...certForm, name: e.target.value })} className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm" />
              <input placeholder="Issuer (e.g. Cambridge)" value={certForm.issuer} onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })} className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-600 mb-1">Issued</label><input type="date" value={certForm.issueDate} onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })} className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm" /></div>
                <div><label className="block text-xs text-gray-600 mb-1">Expires</label><input type="date" value={certForm.expiryDate} onChange={(e) => setCertForm({ ...certForm, expiryDate: e.target.value })} className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm" /></div>
              </div>
              <input placeholder="Credential ID" value={certForm.credentialId} onChange={(e) => setCertForm({ ...certForm, credentialId: e.target.value })} className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm" />
              <textarea placeholder="Notes" rows={2} value={certForm.notes} onChange={(e) => setCertForm({ ...certForm, notes: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <footer className="flex justify-end gap-2 border-t px-5 py-3">
              <button onClick={() => setShowCert(false)} className="h-9 rounded-md border border-gray-300 px-3 text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={addCert} className="h-9 rounded-md bg-green-600 px-4 text-sm text-white hover:bg-green-700">Save</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
