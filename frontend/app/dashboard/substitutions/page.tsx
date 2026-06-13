"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useUserCenter, buildCenterFilterUrl } from "../../hooks/useUserCenter";

interface Session {
  id: string; classId: string; teacherId: string; substituteTeacherId: string | null;
  sessionDate: string; startTime: string; endTime: string; topic: string; status: string;
}

export default function SubstitutionsPage() {
  const { centerId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [classNames, setClassNames] = useState<Record<string, string>>({});
  const [teacherNames, setTeacherNames] = useState<Record<string, string>>({});
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [needsCover, setNeedsCover] = useState<Set<string>>(new Set());
  const [pick, setPick] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { if (!userLoading) load(); /* eslint-disable-next-line */ }, [date, userLoading, centerId]);

  async function load() {
    setLoading(true); setMsg(null);
    try {
      const cid = shouldFilterByCenter ? centerId : null;
      const [sess, classes, tList, users, nc] = await Promise.all([
        apiFetch(buildCenterFilterUrl(`/api/class-sessions/date/${date}`, cid)).catch(() => []),
        apiFetch("/api/classes").catch(() => []),
        apiFetch("/api/teachers").catch(() => []),
        apiFetch("/api/users").catch(() => []),
        apiFetch(buildCenterFilterUrl(`/api/class-sessions/needs-cover?date=${date}`, cid)).catch(() => []),
      ]);
      setNeedsCover(new Set(Array.isArray(nc) ? nc : []));
      setSessions(Array.isArray(sess) ? sess : []);
      const cmap: Record<string, string> = {};
      (Array.isArray(classes) ? classes : []).forEach((c: any) => { cmap[c.id] = c.name; });
      setClassNames(cmap);
      const userName: Record<string, string> = {};
      (Array.isArray(users) ? users : (users?.data || [])).forEach((u: any) => { userName[u.id] = u.fullname || u.name || u.email; });
      const tmap: Record<string, string> = {};
      const tArr: { id: string; name: string }[] = [];
      (Array.isArray(tList) ? tList : []).forEach((t: any) => {
        const nm = userName[t.userId] || t.teacherCode || "Teacher";
        tmap[t.id] = nm; tArr.push({ id: t.id, name: nm });
      });
      setTeacherNames(tmap);
      setTeachers(tArr.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (e: any) { setMsg(e?.message || "Failed to load"); }
    finally { setLoading(false); }
  }

  async function assign(sessionId: string) {
    const substituteTeacherId = pick[sessionId];
    if (!substituteTeacherId) return;
    setBusy(sessionId); setMsg(null);
    try {
      await apiFetch(`/api/class-sessions/${sessionId}/assign-substitute`, {
        method: "POST", body: JSON.stringify({ substituteTeacherId, reason: "Cover assigned" }),
      });
      await load();
    } catch (e: any) { setMsg(e?.message || "Assign failed"); } finally { setBusy(null); }
  }

  async function clear(sessionId: string) {
    setBusy(sessionId); setMsg(null);
    try {
      await apiFetch(`/api/class-sessions/${sessionId}/clear-substitute`, { method: "POST" });
      await load();
    } catch (e: any) { setMsg(e?.message || "Clear failed"); } finally { setBusy(null); }
  }

  const covered = useMemo(() => sessions.filter((s) => s.substituteTeacherId).length, [sessions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link><span>/</span><span className="text-gray-900">Substitutions</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">🔁 Teacher Substitutions</h1>
          <p className="text-gray-500">Assign cover teachers for a day&apos;s classes</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 rounded-md border border-gray-300 px-3 text-sm" />
          <span className="text-sm text-gray-500">{covered}/{sessions.length} covered</span>
          {needsCover.size > 0 && <span className="text-sm font-medium text-red-600">⚠️ {needsCover.size} need cover</span>}
        </div>
      </div>

      {msg && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{msg}</div>}

      {loading ? <div className="text-center text-gray-500 py-10">Loading…</div> : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class / Topic</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cover</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-200">
              {sessions.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">No classes scheduled on this date.</td></tr>
              ) : [...sessions].sort((a, b) => (needsCover.has(b.id) ? 1 : 0) - (needsCover.has(a.id) ? 1 : 0)).map((s) => (
                <tr key={s.id} className={needsCover.has(s.id) ? "bg-red-50 hover:bg-red-100" : "hover:bg-gray-50"}>
                  <td className="px-6 py-4">
                    <div className="font-medium">{classNames[s.classId] || "Class"}</div>
                    <div className="text-sm text-gray-500">{s.topic}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{(s.startTime || "").slice(0, 5)}–{(s.endTime || "").slice(0, 5)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {teacherNames[s.teacherId] || "—"}
                    {needsCover.has(s.id) && <div className="text-xs text-red-600 mt-0.5">⚠️ On approved leave — needs cover</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {s.substituteTeacherId ? (
                      <span className="flex items-center gap-3">
                        <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">🔁 {teacherNames[s.substituteTeacherId] || "Substitute"}</span>
                        <button onClick={() => clear(s.id)} disabled={busy === s.id} className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50">Clear</button>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <select value={pick[s.id] || ""} onChange={(e) => setPick({ ...pick, [s.id]: e.target.value })} className="h-9 rounded-md border border-gray-300 px-2 text-sm">
                          <option value="">Assign cover…</option>
                          {teachers.filter((t) => t.id !== s.teacherId).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <button onClick={() => assign(s.id)} disabled={busy === s.id || !pick[s.id]} className="h-9 px-3 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">Assign</button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
