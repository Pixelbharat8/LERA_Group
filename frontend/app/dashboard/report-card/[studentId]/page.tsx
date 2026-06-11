"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface ReportCard {
  student: { id: string; fullname: string; studentCode: string; status: string };
  classes: { classId: string; className: string; status: string }[];
  examResults: { examId: string; examName: string; score: number | null; percentage: number | null; grade: string | null; gradedAt: string | null }[];
  examCount: number;
  averagePercentage: number | null;
  attendanceRate: number | null;
}

export default function ReportCardPage() {
  const params = useParams();
  const studentId = params?.studentId as string;
  const [data, setData] = useState<ReportCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    apiFetch(`/api/report-cards/${studentId}`)
      .then((d) => setData(d))
      .catch((e) => setError(e?.message || "Could not load the report card"))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading…</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!data) return <div className="p-8 text-center text-gray-500">No data.</div>;

  // Unique classes (seed data can contain duplicate enrolment rows)
  const classes = Array.from(new Map(data.classes.map((c) => [c.classId, c])).values());

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6 print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold text-gray-900">📄 Progress Report</h1>
        <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          🖨️ Print / Save PDF
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <div>
            <div className="text-xl font-bold text-blue-900">LERA Academy</div>
            <div className="text-sm text-gray-500">Student Progress Report</div>
          </div>
          <div className="text-right text-sm text-gray-600">
            <div className="font-semibold text-gray-900">{data.student.fullname}</div>
            <div>Code: {data.student.studentCode || "—"}</div>
            <div>Status: {data.student.status}</div>
          </div>
        </div>

        {/* Summary metrics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-xs uppercase text-blue-600">Avg score</div>
            <div className="text-2xl font-bold text-blue-700">{data.averagePercentage != null ? `${data.averagePercentage}%` : "—"}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-xs uppercase text-green-600">Attendance</div>
            <div className="text-2xl font-bold text-green-700">{data.attendanceRate != null ? `${data.attendanceRate}%` : "—"}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-xs uppercase text-purple-600">Assessments</div>
            <div className="text-2xl font-bold text-purple-700">{data.examCount}</div>
          </div>
        </div>

        {/* Classes */}
        <h3 className="font-semibold text-gray-900 mb-2">Enrolled classes</h3>
        <div className="flex flex-wrap gap-2 mb-6">
          {classes.length ? classes.map((c) => (
            <span key={c.classId} className="px-3 py-1 bg-gray-100 rounded-full text-sm">{c.className}</span>
          )) : <span className="text-gray-500 text-sm">No active enrolments.</span>}
        </div>

        {/* Exam results */}
        <h3 className="font-semibold text-gray-900 mb-2">Assessment results</h3>
        {data.examResults.length ? (
          <table className="min-w-full text-sm border-t">
            <thead><tr className="text-left text-gray-500">
              <th className="py-2">Assessment</th><th className="py-2">Score</th><th className="py-2">%</th><th className="py-2">Grade</th>
            </tr></thead>
            <tbody className="divide-y">
              {data.examResults.map((r, i) => (
                <tr key={i}>
                  <td className="py-2">{r.examName}</td>
                  <td className="py-2">{r.score ?? "—"}</td>
                  <td className="py-2">{r.percentage != null ? `${r.percentage}%` : "—"}</td>
                  <td className="py-2 font-medium">{r.grade ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="text-gray-500 text-sm">No assessment results yet.</p>}

        <div className="mt-8 pt-4 border-t text-xs text-gray-400">
          Generated by LERA Academy · This is a system-generated progress report.
        </div>
      </div>
    </div>
  );
}
