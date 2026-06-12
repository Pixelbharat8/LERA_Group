"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { apiFetch, hasAuthSession } from "../../../../lib/api";
import { loadExamResultsForClassIds, loadExamsForClassIds } from "../../../../lib/exam-data";
import { loadScopedClasses, resolveMyTeacherId } from "../../../../lib/teacher-context";

type Student = {
  id: string;
  fullname?: string;
  name?: string;
  email?: string;
  studentId?: string;
};

type ClassItem = {
  id: string;
  name: string;
  courseId?: string;
  courseName?: string;
  teacherId?: string;
  taId?: string;
  students?: Student[];
};

type Exam = {
  id: string;
  name: string;
  examName?: string;
  title?: string;
  classId?: string;
  courseId?: string;
  examDate?: string;
  maxScore?: number;
  totalMarks?: number;
  status?: string;
};

type ExamResult = {
  id: string;
  examId: string;
  studentId: string;
  score?: number;
  marks?: number;
  grade?: string;
  feedback?: string;
  status?: string;
};

type Assignment = {
  id: string;
  title: string;
  classId?: string;
  dueDate?: string;
  maxScore?: number;
  status?: string;
};

type ApiRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is ApiRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const toOptionalString = (value: unknown): string | undefined =>
  value === undefined || value === null ? undefined : String(value);

const toOptionalNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeExam = (value: unknown): Exam | null => {
  if (!isRecord(value) || !value.id) return null;
  const name = toOptionalString(value.name ?? value.examName ?? value.title) || "Exam";
  return {
    id: String(value.id),
    name,
    examName: toOptionalString(value.examName),
    title: toOptionalString(value.title),
    classId: toOptionalString(value.classId),
    courseId: toOptionalString(value.courseId),
    examDate: toOptionalString(value.examDate),
    maxScore: toOptionalNumber(value.maxScore),
    totalMarks: toOptionalNumber(value.totalMarks),
    status: toOptionalString(value.status),
  };
};

const normalizeExamResult = (value: unknown): ExamResult | null => {
  if (!isRecord(value) || !value.id || !value.examId || !value.studentId) return null;
  return {
    id: String(value.id),
    examId: String(value.examId),
    studentId: String(value.studentId),
    score: toOptionalNumber(value.score),
    marks: toOptionalNumber(value.marks),
    grade: toOptionalString(value.grade),
    feedback: toOptionalString(value.feedback),
    status: toOptionalString(value.status),
  };
};

const normalizeAssignment = (value: unknown): Assignment | null => {
  if (!isRecord(value) || !value.id || !value.title) return null;
  return {
    id: String(value.id),
    title: String(value.title),
    classId: toOptionalString(value.classId),
    dueDate: toOptionalString(value.dueDate),
    maxScore: toOptionalNumber(value.maxScore),
    status: toOptionalString(value.status),
  };
};

const normalizeStudent = (value: unknown): Student | null => {
  if (!isRecord(value) || !value.id) return null;
  return {
    id: String(value.id),
    fullname: toOptionalString(value.fullname ?? value.fullName),
    name: toOptionalString(value.name),
    email: toOptionalString(value.email),
    studentId: toOptionalString(value.studentId ?? value.studentCode),
  };
};

export default function TAGradesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  // Filters
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"overview" | "exams" | "assignments">("overview");
  
  // Grade entry
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradeForm, setGradeForm] = useState({
    examId: "",
    studentId: "",
    score: "",
    grade: "",
    feedback: ""
  });
  const [saving, setSaving] = useState(false);
  const [editingResult, setEditingResult] = useState<ExamResult | null>(null);

  useEffect(() => {
    if (!hasAuthSession()) {
      router.push("/auth/login");
      return;
    }
    
    try {
      const userData = Cookies.get("userData");
      if (userData) {
        const parsed = JSON.parse(decodeURIComponent(userData));
        setUser(parsed);
        fetchData();
      }
    } catch (e) {
      console.error("Error parsing user data:", e);
    }
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const teacherEntityId = await resolveMyTeacherId();
      const scopedClasses = teacherEntityId
        ? await loadScopedClasses("ta", teacherEntityId)
        : [];
      const classIdList = scopedClasses.map((c) => c.id);
      const classIds = new Set(classIdList);

      const [examsData, resultsData, assignmentsData] = await Promise.all([
        loadExamsForClassIds(classIdList),
        loadExamResultsForClassIds(classIdList),
        teacherEntityId
          ? apiFetch(`/api/assignments/teacher/${teacherEntityId}`).catch(() => [])
          : Promise.resolve([]),
      ]);

      const enrollmentLists = await Promise.all(
        scopedClasses.map((c) =>
          apiFetch(`/api/enrollments?classId=${c.id}`).catch(() => [])
        )
      );
      const studentIds = Array.from(
        new Set(
          enrollmentLists
            .flat()
            .map((e: { studentId?: string }) => e.studentId)
            .filter(Boolean) as string[]
        )
      );
      const studentsData = await Promise.all(
        studentIds.map((id) => apiFetch(`/api/students/${id}`).catch(() => null))
      );

      setClasses(
        scopedClasses.map((c) => ({
          id: c.id,
          name: c.className,
          courseId: c.programId,
          courseName: c.programName,
        }))
      );
      
      const examsArr = (Array.isArray(examsData) ? examsData : [])
        .map(normalizeExam)
        .filter((exam): exam is Exam => Boolean(exam));
      setExams(examsArr);

      setStudents(
        studentsData
          .map(normalizeStudent)
          .filter((student): student is Student => Boolean(student))
      );

      const resultsArr = (Array.isArray(resultsData) ? resultsData : [])
        .map(normalizeExamResult)
        .filter((result): result is ExamResult => Boolean(result))
        .filter((r) => examsArr.some((e) => e.id === r.examId));
      setExamResults(resultsArr);

      const assignmentsArr = (Array.isArray(assignmentsData) ? assignmentsData : [])
        .map(normalizeAssignment)
        .filter((assignment): assignment is Assignment => Boolean(assignment))
        .filter((a) => !a.classId || classIds.has(a.classId));
      setAssignments(assignmentsArr);
      
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredExams = () => {
    if (selectedClass === "all") return exams;
    return exams.filter(e => e.classId === selectedClass);
  };

  const getFilteredAssignments = () => {
    if (selectedClass === "all") return assignments;
    return assignments.filter(a => a.classId === selectedClass);
  };

  const getStudentsForClass = (classId: string) => {
    const classItem = classes.find(c => c.id === classId);
    if (classItem?.students) return classItem.students;
    return students;
  };

  const getExamResults = (examId: string) => {
    return examResults.filter(r => r.examId === examId);
  };

  const getStudentResult = (examId: string, studentId: string) => {
    return examResults.find(r => r.examId === examId && r.studentId === studentId);
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student?.fullname || student?.name || student?.email || "Unknown";
  };

  const openGradeEntry = (examId: string, studentId: string, existingResult?: ExamResult) => {
    if (existingResult) {
      setEditingResult(existingResult);
      setGradeForm({
        examId,
        studentId,
        score: String(existingResult.score || existingResult.marks || ""),
        grade: existingResult.grade || "",
        feedback: existingResult.feedback || ""
      });
    } else {
      setEditingResult(null);
      setGradeForm({
        examId,
        studentId,
        score: "",
        grade: "",
        feedback: ""
      });
    }
    setShowGradeModal(true);
  };

  const saveGrade = async () => {
    if (!gradeForm.score) {
      alert("Please enter a score");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        examId: gradeForm.examId,
        studentId: gradeForm.studentId,
        score: Number(gradeForm.score),
        marks: Number(gradeForm.score),
        grade: gradeForm.grade || calculateGrade(Number(gradeForm.score)),
        feedback: gradeForm.feedback,
        status: "GRADED"
      };

      if (editingResult) {
        await apiFetch(`/api/exam-results/${editingResult.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch("/api/exam-results", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }

      setShowGradeModal(false);
      if (user?.id) {
        fetchData();
      }
      alert("Grade saved successfully!");
    } catch (error: any) {
      alert(error?.message || "Failed to save grade");
    } finally {
      setSaving(false);
    }
  };

  const calculateGrade = (score: number): string => {
    if (score >= 90) return "A+";
    if (score >= 85) return "A";
    if (score >= 80) return "B+";
    if (score >= 75) return "B";
    if (score >= 70) return "C+";
    if (score >= 65) return "C";
    if (score >= 60) return "D+";
    if (score >= 55) return "D";
    return "F";
  };

  const getGradeColor = (grade?: string) => {
    if (!grade) return "bg-gray-100 text-gray-800";
    if (grade.startsWith("A")) return "bg-green-100 text-green-800";
    if (grade.startsWith("B")) return "bg-blue-100 text-blue-800";
    if (grade.startsWith("C")) return "bg-yellow-100 text-yellow-800";
    if (grade.startsWith("D")) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  // Calculate stats
  const stats = {
    totalClasses: classes.length,
    totalExams: exams.length,
    gradedResults: examResults.filter(r => r.status === "GRADED" || r.score !== undefined).length,
    pendingGrades: examResults.filter(r => r.status === "PENDING" || (!r.score && !r.marks)).length,
    averageScore: examResults.length > 0 
      ? Math.round(examResults.reduce((sum, r) => sum + (r.score || r.marks || 0), 0) / examResults.filter(r => r.score || r.marks).length) 
      : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/ta" className="hover:text-blue-600">TA Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">Grades & Assessments</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Grades & Assessment Assistance</h1>
          <p className="text-gray-500">Help manage student grades and exam results</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/ta/classes" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            📚 My Classes
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Assigned Classes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalClasses}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">📚</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Exams</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalExams}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">📝</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Graded Results</p>
              <p className="text-2xl font-bold text-green-600">{stats.gradedResults}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">✅</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending Grades</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingGrades}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-2xl">⏳</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Avg Score</p>
              <p className="text-2xl font-bold text-blue-600">{stats.averageScore}%</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">📊</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow">
        {/* Tabs */}
        <div className="border-b flex">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-4 font-medium transition-colors ${activeTab === "overview" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            📋 Overview
          </button>
          <button
            onClick={() => setActiveTab("exams")}
            className={`px-6 py-4 font-medium transition-colors ${activeTab === "exams" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            📝 Exam Results
          </button>
          <button
            onClick={() => setActiveTab("assignments")}
            className={`px-6 py-4 font-medium transition-colors ${activeTab === "assignments" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            📄 Assignments
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Filter by Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="all">All Classes</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            {activeTab === "exams" && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Select Exam</label>
                <select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Select an exam</option>
                  {getFilteredExams().map(e => (
                    <option key={e.id} value={e.id}>{e.name || e.title}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Classes Overview */}
              <div>
                <h3 className="text-lg font-semibold mb-4">📚 Assigned Classes</h3>
                {classes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <span className="text-4xl">📭</span>
                    <p className="mt-2">No classes assigned yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes.map(cls => {
                      const classExams = exams.filter(e => e.classId === cls.id);
                      const classResults = examResults.filter(r => 
                        classExams.some(e => e.id === r.examId)
                      );
                      return (
                        <div key={cls.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">📚</div>
                            <div>
                              <h4 className="font-semibold">{cls.name}</h4>
                              {cls.courseName && <p className="text-sm text-gray-500">{cls.courseName}</p>}
                            </div>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Exams:</span>
                              <span className="font-medium">{classExams.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Results Entered:</span>
                              <span className="font-medium text-green-600">{classResults.filter(r => r.score || r.marks).length}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedClass(cls.id);
                              setActiveTab("exams");
                            }}
                            className="w-full mt-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                          >
                            View Grades →
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent Grades */}
              <div>
                <h3 className="text-lg font-semibold mb-4">📝 Recent Grade Entries</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {examResults.slice(0, 10).map(result => {
                        const exam = exams.find(e => e.id === result.examId);
                        return (
                          <tr key={result.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">{getStudentName(result.studentId)}</td>
                            <td className="px-4 py-3 text-gray-600">{exam?.name || exam?.title || "N/A"}</td>
                            <td className="px-4 py-3 font-bold">{result.score || result.marks || "-"}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(result.grade)}`}>
                                {result.grade || "-"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs ${result.status === "GRADED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                                {result.status || "PENDING"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {examResults.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No grade entries yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "exams" && (
            <div>
              {!selectedExam ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">📝 Select an Exam to Enter Grades</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getFilteredExams().map(exam => {
                      const results = getExamResults(exam.id);
                      const graded = results.filter(r => r.score || r.marks).length;
                      return (
                        <div
                          key={exam.id}
                          onClick={() => setSelectedExam(exam.id)}
                          className="border rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-xl">📝</div>
                            <div>
                              <h4 className="font-semibold">{exam.name || exam.title}</h4>
                              <p className="text-sm text-gray-500">
                                {exam.examDate ? new Date(exam.examDate).toLocaleDateString() : "No date"}
                              </p>
                            </div>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Max Score: {exam.maxScore || exam.totalMarks || 100}</span>
                            <span className="text-green-600">{graded} graded</span>
                          </div>
                        </div>
                      );
                    })}
                    {getFilteredExams().length === 0 && (
                      <div className="col-span-full text-center py-8 text-gray-500">
                        <span className="text-4xl">📭</span>
                        <p className="mt-2">No exams found for this class</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedExam("")}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ← Back to Exams
                      </button>
                      <h3 className="text-lg font-semibold">
                        {exams.find(e => e.id === selectedExam)?.name || "Exam Results"}
                      </h3>
                    </div>
                    <div className="text-sm text-gray-500">
                      Max Score: {exams.find(e => e.id === selectedExam)?.maxScore || exams.find(e => e.id === selectedExam)?.totalMarks || 100}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feedback</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {students.map(student => {
                          const result = getStudentResult(selectedExam, student.id);
                          return (
                            <tr key={student.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="font-medium">{student.fullname || student.name}</div>
                                <div className="text-xs text-gray-500">{student.studentId || student.email}</div>
                              </td>
                              <td className="px-4 py-3 font-bold text-lg">
                                {result?.score || result?.marks || "-"}
                              </td>
                              <td className="px-4 py-3">
                                {result?.grade ? (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(result.grade)}`}>
                                    {result.grade}
                                  </span>
                                ) : "-"}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                                {result?.feedback || "-"}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs ${result?.status === "GRADED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                                  {result?.status || "PENDING"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => openGradeEntry(selectedExam, student.id, result || undefined)}
                                  className={`px-3 py-1 rounded text-sm ${result ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}
                                >
                                  {result ? "✏️ Edit" : "➕ Add Grade"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {students.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No students found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "assignments" && (
            <div>
              <h3 className="text-lg font-semibold mb-4">📄 Assignments</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredAssignments().map(assignment => (
                  <div key={assignment.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-xl">📄</div>
                      <div>
                        <h4 className="font-semibold">{assignment.title}</h4>
                        {assignment.dueDate && (
                          <p className="text-sm text-gray-500">
                            Due: {new Date(assignment.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Max Score: {assignment.maxScore || 100}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${assignment.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                        {assignment.status || "ACTIVE"}
                      </span>
                    </div>
                  </div>
                ))}
                {getFilteredAssignments().length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <span className="text-4xl">📭</span>
                    <p className="mt-2">No assignments found</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grade Entry Modal */}
      {showGradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-semibold">
                {editingResult ? "Edit Grade" : "Enter Grade"}
              </h2>
              <button onClick={() => setShowGradeModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  Student: <span className="font-medium">{getStudentName(gradeForm.studentId)}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Exam: <span className="font-medium">{exams.find(e => e.id === gradeForm.examId)?.name || "N/A"}</span>
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Score *</label>
                <input
                  type="number"
                  value={gradeForm.score}
                  onChange={(e) => setGradeForm(prev => ({ ...prev, score: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter score"
                  min="0"
                  max={exams.find(e => e.id === gradeForm.examId)?.maxScore || 100}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade (Auto-calculated)</label>
                <input
                  type="text"
                  value={gradeForm.grade || (gradeForm.score ? calculateGrade(Number(gradeForm.score)) : "")}
                  onChange={(e) => setGradeForm(prev => ({ ...prev, grade: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., A, B+, C"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Feedback (Optional)</label>
                <textarea
                  value={gradeForm.feedback}
                  onChange={(e) => setGradeForm(prev => ({ ...prev, feedback: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Enter feedback for the student..."
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowGradeModal(false)}
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={saveGrade}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Grade"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
