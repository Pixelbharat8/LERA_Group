"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../lib/api";
import { useUserCenter } from "../../hooks/useUserCenter";

interface Job {
  id: string; title: string; department?: string; location?: string;
  employmentType?: string; status: string; openingsCount?: number; closingDate?: string;
  description?: string; requirements?: string;
}
interface Application {
  id: string; applicantName: string; email?: string; phone?: string; source?: string; status: string; notes?: string;
}

const PIPELINE = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"];
const APP_STATUS: Record<string, string> = {
  APPLIED: "bg-gray-100 text-gray-700", SCREENING: "bg-blue-100 text-blue-800",
  INTERVIEW: "bg-indigo-100 text-indigo-800", OFFER: "bg-amber-100 text-amber-800",
  HIRED: "bg-green-100 text-green-800", REJECTED: "bg-red-100 text-red-800",
};

export default function RecruitmentPage() {
  const { centerId, loading: userLoading } = useUserCenter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selected, setSelected] = useState<Job | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJob, setShowJob] = useState(false);
  const [showApp, setShowApp] = useState(false);
  const [jobForm, setJobForm] = useState({ title: "", department: "", location: "", employmentType: "FULL_TIME", openingsCount: 1, closingDate: "", description: "", requirements: "" });
  const [appForm, setAppForm] = useState({ applicantName: "", email: "", phone: "", source: "", coverNote: "" });

  useEffect(() => { if (!userLoading) loadJobs(); /* eslint-disable-next-line */ }, [userLoading]);

  async function loadJobs() {
    setLoading(true); setError(null);
    try {
      const data = await apiFetch("/api/job-openings").catch(() => []);
      const list = Array.isArray(data) ? data : [];
      setJobs(list);
      if (list.length && !selected) selectJob(list[0]);
    } catch (e: any) { setError(e?.message || "Failed to load openings"); }
    finally { setLoading(false); }
  }

  async function selectJob(j: Job) {
    setSelected(j);
    try { const a = await apiFetch(`/api/job-openings/${j.id}/applications`).catch(() => []); setApps(Array.isArray(a) ? a : []); }
    catch { setApps([]); }
  }

  async function createJob() {
    if (!jobForm.title) { setError("Title is required"); return; }
    setError(null);
    try {
      await apiFetch("/api/job-openings", {
        method: "POST",
        body: JSON.stringify({ ...jobForm, openingsCount: Number(jobForm.openingsCount) || 1, closingDate: jobForm.closingDate || null, centerId, status: "OPEN" }),
      });
      setShowJob(false);
      setJobForm({ title: "", department: "", location: "", employmentType: "FULL_TIME", openingsCount: 1, closingDate: "", description: "", requirements: "" });
      await loadJobs();
    } catch (e: any) { setError(e?.message || "Failed to create opening (HR only)"); }
  }

  async function addApplicant() {
    if (!selected || !appForm.applicantName) { setError("Applicant name is required"); return; }
    setError(null);
    try {
      await apiFetch(`/api/job-openings/${selected.id}/apply`, { method: "POST", body: JSON.stringify(appForm) });
      setShowApp(false);
      setAppForm({ applicantName: "", email: "", phone: "", source: "", coverNote: "" });
      await selectJob(selected);
    } catch (e: any) { setError(e?.message || "Failed to add applicant"); }
  }

  async function moveApp(appId: string, status: string) {
    try { await apiFetch(`/api/job-openings/applications/${appId}/status`, { method: "POST", body: JSON.stringify({ status }) }); if (selected) await selectJob(selected); }
    catch (e: any) { setError(e?.message || "Failed"); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link><span>/</span><span className="text-gray-900">Recruitment</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">🧑‍💼 Recruitment</h1>
          <p className="text-gray-500">Job openings &amp; applicant pipeline</p>
        </div>
        <button onClick={() => setShowJob(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">➕ New opening</button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      {loading ? <div className="text-center text-gray-500 py-10">Loading…</div> : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Openings list */}
          <div className="space-y-2">
            {jobs.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">No openings yet.</div>
            ) : jobs.map((j) => (
              <button key={j.id} onClick={() => selectJob(j)}
                className={`w-full text-left bg-white rounded-xl shadow-sm p-4 border ${selected?.id === j.id ? "border-blue-500" : "border-transparent"} hover:border-blue-300`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{j.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${j.status === "OPEN" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>{j.status}</span>
                </div>
                <p className="text-sm text-gray-500">{[j.department, j.location, j.employmentType?.replace(/_/g, " ")].filter(Boolean).join(" · ") || "—"}</p>
              </button>
            ))}
          </div>

          {/* Applicants for selected */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5">
            {!selected ? (
              <p className="text-gray-500">Select an opening to see applicants.</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{selected.title}</h2>
                    <p className="text-sm text-gray-500">{apps.length} applicant(s)</p>
                  </div>
                  <button onClick={() => setShowApp(true)} className="text-sm px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700">➕ Add applicant</button>
                </div>
                {apps.length === 0 ? (
                  <p className="text-gray-500">No applicants yet.</p>
                ) : (
                  <div className="space-y-3">
                    {apps.map((a) => (
                      <div key={a.id} className="border border-gray-100 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{a.applicantName}</p>
                            <p className="text-xs text-gray-500">{[a.email, a.phone, a.source].filter(Boolean).join(" · ")}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${APP_STATUS[a.status] || "bg-gray-100"}`}>{a.status}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-3">
                          {PIPELINE.map((s) => (
                            <button key={s} onClick={() => moveApp(a.id, s)} disabled={a.status === s}
                              className={`text-xs px-2 py-1 rounded border ${a.status === s ? "bg-gray-100 text-gray-400 border-gray-200" : "border-gray-300 hover:bg-gray-50"}`}>{s}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {showJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowJob(false)}>
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <header className="flex items-center justify-between border-b px-5 py-3"><h2 className="text-base font-semibold">New Job Opening</h2><button onClick={() => setShowJob(false)} className="text-gray-400 hover:text-gray-600">✕</button></header>
            <div className="space-y-3 px-5 py-4">
              <input placeholder="Title *" value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Department" value={jobForm.department} onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })} className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm" />
                <input placeholder="Location" value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <select value={jobForm.employmentType} onChange={(e) => setJobForm({ ...jobForm, employmentType: e.target.value })} className="h-9 w-full rounded-md border border-gray-300 px-2 text-sm">
                  {["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNAL_TRANSFER"].map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                </select>
                <input type="number" placeholder="Openings" value={jobForm.openingsCount} onChange={(e) => setJobForm({ ...jobForm, openingsCount: Number(e.target.value) })} className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm" />
                <input type="date" value={jobForm.closingDate} onChange={(e) => setJobForm({ ...jobForm, closingDate: e.target.value })} className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm" />
              </div>
              <textarea placeholder="Description" rows={2} value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <textarea placeholder="Requirements" rows={2} value={jobForm.requirements} onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <footer className="flex justify-end gap-2 border-t px-5 py-3"><button onClick={() => setShowJob(false)} className="h-9 rounded-md border border-gray-300 px-3 text-sm hover:bg-gray-50">Cancel</button><button onClick={createJob} className="h-9 rounded-md bg-blue-600 px-4 text-sm text-white hover:bg-blue-700">Create</button></footer>
          </div>
        </div>
      )}

      {showApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowApp(false)}>
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <header className="flex items-center justify-between border-b px-5 py-3"><h2 className="text-base font-semibold">Add Applicant</h2><button onClick={() => setShowApp(false)} className="text-gray-400 hover:text-gray-600">✕</button></header>
            <div className="space-y-3 px-5 py-4">
              <input placeholder="Name *" value={appForm.applicantName} onChange={(e) => setAppForm({ ...appForm, applicantName: e.target.value })} className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Email" value={appForm.email} onChange={(e) => setAppForm({ ...appForm, email: e.target.value })} className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm" />
                <input placeholder="Phone" value={appForm.phone} onChange={(e) => setAppForm({ ...appForm, phone: e.target.value })} className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm" />
              </div>
              <input placeholder="Source (referral, website…)" value={appForm.source} onChange={(e) => setAppForm({ ...appForm, source: e.target.value })} className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm" />
              <textarea placeholder="Cover note" rows={2} value={appForm.coverNote} onChange={(e) => setAppForm({ ...appForm, coverNote: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <footer className="flex justify-end gap-2 border-t px-5 py-3"><button onClick={() => setShowApp(false)} className="h-9 rounded-md border border-gray-300 px-3 text-sm hover:bg-gray-50">Cancel</button><button onClick={addApplicant} className="h-9 rounded-md bg-green-600 px-4 text-sm text-white hover:bg-green-700">Add</button></footer>
          </div>
        </div>
      )}
    </div>
  );
}
