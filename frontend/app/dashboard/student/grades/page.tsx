"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { loadMyClasses, resolveMyStudentId } from "../../../../lib/student-context";

interface Grade {
  id: string;
  subject: string;
  examName: string;
  examType: "QUIZ" | "TEST" | "MIDTERM" | "FINAL" | "ASSIGNMENT";
  score: number;
  maxScore: number;
  percentage: number;
  grade: string;
  feedback?: string;
  examDate: string;
  className: string;
  teacherName: string;
}

export default function StudentGradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "QUIZ" | "TEST" | "MIDTERM" | "FINAL" | "ASSIGNMENT">("ALL");
  const [sortBy, setSortBy] = useState<"date" | "score" | "subject">("date");

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const studentId = await resolveMyStudentId();
      if (!studentId) {
        setGrades([]);
        return;
      }
      const myClassIds = new Set((await loadMyClasses(studentId)).map((c) => c.id));

      const data = await apiFetch(`/api/exam-results/student/${studentId}`).catch(() => []);
      const resultsArray = Array.isArray(data) ? data : [];

      const examsData = await apiFetch(`/api/exams?studentId=${studentId}`).catch(() => []);
      const examsMap = new Map<string, any>(
        (Array.isArray(examsData) ? examsData : [])
          .filter((e: { classId?: string }) => !e.classId || myClassIds.has(String(e.classId)))
          .map((e: { id: string }) => [e.id, e])
      );
      
      if (resultsArray.length > 0) {
        setGrades(resultsArray.map((g: any) => {
          const exam = examsMap.get(g.examId) || {};
          return {
            id: g.id,
            subject: exam.subject || exam.name?.split(' ')[0] || "General",
            examName: g.examName || exam.name || "Exam",
            examType: exam.examType || "TEST",
            score: Number(g.score) || 0,
            maxScore: Number(exam.maxScore) || 100,
            percentage: Number(g.percentage) || Math.round((Number(g.score) / Number(exam.maxScore || 100)) * 100),
            grade: g.grade || calculateGrade(Number(g.score), Number(exam.maxScore || 100)),
            feedback: g.feedback,
            examDate: exam.examDate || g.createdAt || new Date().toISOString(),
            className: exam.className || "Class",
            teacherName: g.gradedByName || "Teacher"
          };
        }));
      } else {
        setGrades([]);
      }
    } catch (err) {
      console.error(err);
      setGrades([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateGrade = (score: number, maxScore: number): string => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return "A";
    if (percentage >= 85) return "A-";
    if (percentage >= 80) return "B+";
    if (percentage >= 75) return "B";
    if (percentage >= 70) return "B-";
    if (percentage >= 65) return "C+";
    if (percentage >= 60) return "C";
    if (percentage >= 55) return "C-";
    if (percentage >= 50) return "D";
    return "F";
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "bg-green-100 text-green-800";
    if (grade.startsWith("B")) return "bg-blue-100 text-blue-800";
    if (grade.startsWith("C")) return "bg-yellow-100 text-yellow-800";
    if (grade.startsWith("D")) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const getExamTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      QUIZ: "bg-purple-100 text-purple-800",
      TEST: "bg-blue-100 text-blue-800",
      MIDTERM: "bg-orange-100 text-orange-800",
      FINAL: "bg-red-100 text-red-800",
      ASSIGNMENT: "bg-green-100 text-green-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const filteredGrades = filter === "ALL" ? grades : grades.filter((g) => g.examType === filter);
  
  const sortedGrades = [...filteredGrades].sort((a, b) => {
    if (sortBy === "date") return new Date(b.examDate).getTime() - new Date(a.examDate).getTime();
    if (sortBy === "score") return b.percentage - a.percentage;
    if (sortBy === "subject") return a.subject.localeCompare(b.subject);
    return 0;
  });

  const avgPercentage = grades.length > 0
    ? Math.round(grades.reduce((sum, g) => sum + g.percentage, 0) / grades.length)
    : 0;

  const highestGrade = grades.length > 0
    ? grades.reduce((max, g) => (g.percentage > max.percentage ? g : max), grades[0])
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/student" className="hover:text-blue-600">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-900">My Grades</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">📊 My Grades & Results</h1>
        <p className="text-gray-500 mt-1">View your exam results and performance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Total Exams</div>
          <div className="text-2xl font-bold text-gray-900">{grades.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Average Score</div>
          <div className="text-2xl font-bold text-blue-600">{avgPercentage}%</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Average Grade</div>
          <div className="text-2xl font-bold text-green-600">{calculateGrade(avgPercentage, 100)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Highest Score</div>
          <div className="text-2xl font-bold text-purple-600">
            {highestGrade ? `${highestGrade.percentage}%` : "N/A"}
          </div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap items-center gap-4">
        <div className="flex gap-2">
          {(["ALL", "QUIZ", "TEST", "MIDTERM", "FINAL", "ASSIGNMENT"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === type ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date" | "score" | "subject")}
            className="px-3 py-1.5 border rounded-lg text-sm"
          >
            <option value="date">Date</option>
            <option value="score">Score</option>
            <option value="subject">Subject</option>
          </select>
        </div>
      </div>

      {/* Grades List */}
      <div className="space-y-4">
        {sortedGrades.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">No Grades Found</h3>
            <p className="text-gray-500">
              {filter === "ALL" ? "You don't have any grades yet." : `No ${filter.toLowerCase()} results.`}
            </p>
          </div>
        ) : (
          sortedGrades.map((grade) => (
            <div key={grade.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{grade.examName}</h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${getExamTypeColor(grade.examType)}`}>
                      {grade.examType}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                    <span>📚 {grade.subject}</span>
                    <span>🏫 {grade.className}</span>
                    <span>👩‍🏫 {grade.teacherName}</span>
                    <span>📅 {new Date(grade.examDate).toLocaleDateString()}</span>
                  </div>
                  {grade.feedback && (
                    <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                      <span className="font-medium">Feedback:</span> {grade.feedback}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">{grade.score}/{grade.maxScore}</div>
                  <div className="text-lg text-gray-500">{grade.percentage}%</div>
                  <span className={`inline-block mt-2 px-3 py-1 text-sm font-bold rounded ${getGradeColor(grade.grade)}`}>
                    {grade.grade}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
