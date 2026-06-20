"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { resolveMyTeacherId } from "@/lib/teacher-context";

interface Row { studentId: string; studentName: string; score: number | null; percentage: number | null; grade: string | null; passed: boolean | null; }

export default function GradebookPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [classId, setClassId] = useState("");
  const [exams, setExams] = useState<any[]>([]);
  const [examId, setExamId] = useState("");
  const [exam, setExam] = useState<any>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Teachers can't list all classes (the bare /api/classes 403s with "centerId required");
  // use the teacher-scoped endpoint so the gradebook actually shows the teacher's own classes.
  useEffect(() => {
    (async () => {
      const tid = await resolveMyTeacherId();
      if (!tid) { setClasses([]); return; }
      apiFetch(`/api/classes?teacherId=${tid}`, {}, { silent: true })
        .then((d) => setClasses(Array.isArray(d) ? d : []))
        .catch(() => {});
    })();
  }, []);

  useEffect(() => {
    setExams([]); setExamId(""); setRows([]);
    if (!classId) return;
    apiFetch(`/api/exams?classId=${classId}`, {}, { silent: true }).then((d) => setExams(Array.isArray(d) ? d : [])).catch(() => {});
  }, [classId]);

  useEffect(() => {
    if (!examId) { setRows([]); setExam(null); return; }
    setLoading(true); setMsg(null);
    apiFetch(`/api/grades/gradebook?examId=${examId}`)
      .then((d) => {
        setExam(d.exam);
        setRows(d.rows || []);
        const init: Record<string, string> = {};
        (d.rows || []).forEach((r: Row) => { init[r.studentId] = r.score != null ? String(r.score) : ""; });
        setScores(init);
      })
      .catch((e) => setMsg(e?.message || "Failed to load gradebook"))
      .finally(() => setLoading(false));
  }, [examId]);

  const saveAll = async () => {
    setSaving(true); setMsg(null);
    try {
      const grades = Object.entries(scores)
        .filter(([, v]) => v !== "" && v != null)
        .map(([studentId, v]) => ({ studentId, score: Number(v) }));
      const res = await apiFetch("/api/grades/bulk", { method: "POST", body: JSON.stringify({ examId, grades }) });
      setMsg(`✅ Saved ${res?.saved ?? grades.length} grade(s)`);
      const d = await apiFetch(`/api/grades/gradebook?examId=${examId}`);
      setRows(d.rows || []);
    } catch (e: any) {
      setMsg(e?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const max = exam?.maxScore ?? 100;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/teacher" className="hover:text-blue-600">Teacher</Link><span>/</span><span className="text-gray-900">Gradebook</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">📊 Gradebook</h1>
        <p className="text-gray-500">Enter all grades for an assessment at once</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={classId} onChange={(e) => setClassId(e.target.value)} className="h-10 rounded-md border border-gray-300 px-3 text-sm">
          <option value="">Select class…</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={examId} onChange={(e) => setExamId(e.target.value)} disabled={!classId} className="h-10 rounded-md border border-gray-300 px-3 text-sm disabled:bg-gray-100">
          <option value="">{classId ? "Select assessment…" : "Pick a class first"}</option>
          {exams.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
        {examId && <button onClick={saveAll} disabled={saving || loading} className="h-10 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving…" : "Save all"}</button>}
      </div>

      {msg && <div className="rounded-lg border px-4 py-2 text-sm bg-gray-50 text-gray-700">{msg}</div>}

      {loading ? <div className="text-center text-gray-500 py-10">Loading…</div> : examId && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-3 border-b text-sm text-gray-600">
            {exam?.name} · max {max}{exam?.passingScore != null ? ` · pass ${exam.passingScore}` : ""}
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score (/{max})</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">%</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-200">
              {rows.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">No students enrolled in this class.</td></tr>
              ) : rows.map((r) => (
                <tr key={r.studentId} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium">{r.studentName}</td>
                  <td className="px-6 py-3">
                    <input type="number" min={0} max={max} value={scores[r.studentId] ?? ""}
                      onChange={(e) => setScores({ ...scores, [r.studentId]: e.target.value })}
                      className="w-24 h-9 rounded-md border border-gray-300 px-2 text-sm" />
                  </td>
                  <td className="px-6 py-3 text-gray-500">{r.percentage != null ? `${r.percentage}%` : "—"}</td>
                  <td className="px-6 py-3">
                    {r.grade ? <span className={`px-2 py-1 rounded text-xs font-medium ${r.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{r.grade}</span> : <span className="text-gray-400">—</span>}
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
