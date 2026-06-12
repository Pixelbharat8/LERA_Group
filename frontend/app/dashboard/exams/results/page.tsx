"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { useUserCenter, buildCenterFilterUrl } from "../../../hooks/useUserCenter";

interface ExamResult {
  id: string;
  studentId: string;
  examId: string;
  studentName: string;
  examName: string;
  score: number;
  percentage: number;
  grade: string;
  passed: boolean;
  feedback?: string;
  examDate?: string;
  createdAt?: string;
}

export default function ExamResultsPage() {
  const { centerId: userCenterId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading) {
      fetchResults();
    }
  }, [userLoading, userCenterId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const url = buildCenterFilterUrl("/api/exam-results", shouldFilterByCenter ? userCenterId : null);
      const data = await apiFetch(url);
      setResults(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch exam results:", err);
      setError("Failed to load exam results");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    if (!grade) return "bg-gray-100 text-gray-800";
    const g = grade.toUpperCase();
    if (g.startsWith("A")) return "bg-green-100 text-green-800";
    if (g.startsWith("B")) return "bg-blue-100 text-blue-800";
    if (g.startsWith("C")) return "bg-yellow-100 text-yellow-800";
    if (g.startsWith("D")) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/superadmin" className="hover:text-blue-600">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-900">Exam Results</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📊 Exam Results</h1>
            <p className="text-gray-500">View and manage exam results</p>
          </div>
          <button
            onClick={fetchResults}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading exam results...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchResults}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-900">No Exam Results</h3>
          <p className="text-gray-500 mt-2">No exam results have been recorded yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {results.map((result) => (
                <tr key={result.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{result.studentName || "Unknown Student"}</td>
                  <td className="px-6 py-4 text-gray-500">{result.examName || "Unknown Exam"}</td>
                  <td className="px-6 py-4">
                    {result.percentage != null ? `${result.percentage}%` : result.score != null ? result.score : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getGradeColor(result.grade)}`}>
                      {result.grade || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {result.passed ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Passed</span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Failed</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(result.examDate || result.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
