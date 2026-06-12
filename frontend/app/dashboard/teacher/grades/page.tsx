"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { loadExamResultsForClassIds, loadExamsForClassIds } from "../../../../lib/exam-data";
import { loadScopedClasses, resolveMyTeacherId } from "../../../../lib/teacher-context";
type Student = {
  id: string;
  fullname?: string;
  name?: string;
  email?: string;
};

type ClassInfo = {
  id: string;
  name: string;
  courseId?: string;
  courseName?: string;
};

type Exam = {
  id: string;
  examName: string;
  name?: string;
  classId?: string;
  courseId?: string;
  examType?: string;
  maxScore?: number;
  passingScore?: number;
  examDate?: string;
  duration?: number;
  durationMinutes?: number;
  status?: string;
};

type ExamResult = {
  id: string;
  examId: string;
  examName?: string;
  studentId: string;
  studentName?: string;
  score: number;
  maxScore?: number;
  percentage?: number;
  grade?: string;
  status?: string;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: string;
};

type Assignment = {
  id: string;
  title: string;
  description?: string;
  classId?: string;
  assignmentType?: string;
  dueDate?: string;
  maxScore?: number;
  createdBy?: string;
  isGraded?: boolean;
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

const normalizeStudent = (value: unknown): Student | null => {
  if (!isRecord(value) || !value.id) return null;
  return {
    id: String(value.id),
    fullname: toOptionalString(value.fullname ?? value.fullName),
    name: toOptionalString(value.name),
    email: toOptionalString(value.email),
  };
};

const normalizeExam = (value: unknown): Exam | null => {
  if (!isRecord(value) || !value.id) return null;
  const examName = toOptionalString(value.examName ?? value.name ?? value.title) || "Exam";
  return {
    id: String(value.id),
    examName,
    name: toOptionalString(value.name),
    classId: toOptionalString(value.classId),
    courseId: toOptionalString(value.courseId),
    examType: toOptionalString(value.examType),
    maxScore: toOptionalNumber(value.maxScore),
    passingScore: toOptionalNumber(value.passingScore),
    examDate: toOptionalString(value.examDate),
    duration: toOptionalNumber(value.duration),
    durationMinutes: toOptionalNumber(value.durationMinutes),
    status: toOptionalString(value.status),
  };
};

const normalizeExamResult = (value: unknown): ExamResult | null => {
  if (!isRecord(value) || !value.id || !value.examId || !value.studentId) return null;
  return {
    id: String(value.id),
    examId: String(value.examId),
    examName: toOptionalString(value.examName),
    studentId: String(value.studentId),
    studentName: toOptionalString(value.studentName),
    score: toOptionalNumber(value.score) ?? 0,
    maxScore: toOptionalNumber(value.maxScore),
    percentage: toOptionalNumber(value.percentage),
    grade: toOptionalString(value.grade),
    status: toOptionalString(value.status),
    feedback: toOptionalString(value.feedback),
    gradedAt: toOptionalString(value.gradedAt),
    gradedBy: toOptionalString(value.gradedBy),
  };
};

const normalizeAssignment = (value: unknown): Assignment | null => {
  if (!isRecord(value) || !value.id || !value.title) return null;
  return {
    id: String(value.id),
    title: String(value.title),
    description: toOptionalString(value.description),
    classId: toOptionalString(value.classId),
    assignmentType: toOptionalString(value.assignmentType),
    dueDate: toOptionalString(value.dueDate),
    maxScore: toOptionalNumber(value.maxScore),
    createdBy: toOptionalString(value.createdBy),
    isGraded: typeof value.isGraded === "boolean" ? value.isGraded : undefined,
  };
};

export default function TeacherGradesPage() {
  const [activeTab, setActiveTab] = useState<"grades" | "exams" | "assignments">("grades");
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedExam, setSelectedExam] = useState<string>("all");
  const [teacherId, setTeacherId] = useState<string>("");
  
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [editingResult, setEditingResult] = useState<ExamResult | null>(null);
  const [saving, setSaving] = useState(false);

  const [gradeForm, setGradeForm] = useState({
    studentId: "",
    examId: "",
    score: "",
    feedback: ""
  });

  const [examForm, setExamForm] = useState({
    examName: "",
    classId: "",
    examType: "QUIZ",
    maxScore: "100",
    passingScore: "50",
    examDate: "",
    duration: "60"
  });

  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    description: "",
    classId: "",
    assignmentType: "HOMEWORK",
    dueDate: "",
    maxScore: "100",
    isGraded: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const teacherEntityId = await resolveMyTeacherId();
      setTeacherId(teacherEntityId || "");
      const scopedClasses = teacherEntityId
        ? await loadScopedClasses("teacher", teacherEntityId)
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
      setStudents(
        studentsData
          .map(normalizeStudent)
          .filter((student): student is Student => Boolean(student))
      );
      setExams(
        (Array.isArray(examsData) ? examsData : [])
          .map(normalizeExam)
          .filter((exam): exam is Exam => Boolean(exam))
      );
      setExamResults(
        (Array.isArray(resultsData) ? resultsData : [])
          .map(normalizeExamResult)
          .filter((result): result is ExamResult => Boolean(result))
      );
      setAssignments(
        (Array.isArray(assignmentsData) ? assignmentsData : [])
          .map(normalizeAssignment)
          .filter((assignment): assignment is Assignment => Boolean(assignment))
          .filter((a) => !a.classId || classIds.has(a.classId))
      );
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student?.fullname || student?.name || "Unknown";
  };

  const getExamName = (examId: string) => {
    const exam = exams.find(e => e.id === examId);
    return exam?.examName || "Unknown Exam";
  };

  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls?.name || "Unknown Class";
  };

  const calculateGrade = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  };

  const filteredResults = examResults.filter(r => {
    if (selectedClass !== "all") {
      const exam = exams.find(e => e.id === r.examId);
      if (exam?.classId !== selectedClass) return false;
    }
    if (selectedExam !== "all" && r.examId !== selectedExam) return false;
    return true;
  });

  const openGradeModal = (result?: ExamResult) => {
    if (result) {
      setEditingResult(result);
      setGradeForm({
        studentId: result.studentId,
        examId: result.examId,
        score: String(result.score),
        feedback: result.feedback || ""
      });
    } else {
      setEditingResult(null);
      setGradeForm({ studentId: "", examId: "", score: "", feedback: "" });
    }
    setShowGradeModal(true);
  };

  const saveGrade = async () => {
    if (!gradeForm.studentId || !gradeForm.examId || !gradeForm.score) {
      alert("Please fill all required fields");
      return;
    }

    setSaving(true);
    try {
      const exam = exams.find(e => e.id === gradeForm.examId);
      const maxScore = exam?.maxScore || 100;
      const score = Number(gradeForm.score);

      const payload = {
        studentId: gradeForm.studentId,
        examId: gradeForm.examId,
        score,
        maxScore,
        percentage: (score / maxScore) * 100,
        grade: calculateGrade(score, maxScore),
        feedback: gradeForm.feedback || null,
        status: "GRADED",
        gradedBy: teacherId,
        gradedAt: new Date().toISOString()
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
      await fetchData();
    } catch (err: any) {
      alert(err?.message || "Failed to save grade");
    } finally {
      setSaving(false);
    }
  };

  const createExam = async () => {
    if (!examForm.examName || !examForm.classId) {
      alert("Please fill exam name and class");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: examForm.examName,
        classId: examForm.classId,
        examType: examForm.examType,
        maxScore: Number(examForm.maxScore),
        passingScore: Number(examForm.passingScore),
        examDate: examForm.examDate || null,
        durationMinutes: Number(examForm.duration),
        status: "SCHEDULED",
        createdBy: teacherId
      };

      await apiFetch("/api/exams", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setShowExamModal(false);
      setExamForm({
        examName: "",
        classId: "",
        examType: "QUIZ",
        maxScore: "100",
        passingScore: "50",
        examDate: "",
        duration: "60"
      });
      await fetchData();
    } catch (err: any) {
      alert(err?.message || "Failed to create exam");
    } finally {
      setSaving(false);
    }
  };

  const createAssignment = async () => {
    if (!assignmentForm.title || !assignmentForm.classId) {
      alert("Please fill assignment title and class");
      return;
    }

    if (!assignmentForm.dueDate) {
      alert("Please select a due date");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: assignmentForm.title,
        description: assignmentForm.description || null,
        classId: assignmentForm.classId,
        assignmentType: assignmentForm.assignmentType,
        dueDate: assignmentForm.dueDate || null,
        maxScore: Number(assignmentForm.maxScore),
        isGraded: assignmentForm.isGraded,
        createdBy: teacherId ? Number(teacherId) : null
      };

      await apiFetch("/api/assignments", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setShowAssignmentModal(false);
      setAssignmentForm({
        title: "",
        description: "",
        classId: "",
        assignmentType: "HOMEWORK",
        dueDate: "",
        maxScore: "100",
        isGraded: true
      });
      await fetchData();
    } catch (err: any) {
      alert(err?.message || "Failed to create assignment");
    } finally {
      setSaving(false);
    }
  };

  const getGradeColor = (grade?: string) => {
    switch (grade) {
      case "A": return "bg-green-100 text-green-800";
      case "B": return "bg-blue-100 text-blue-800";
      case "C": return "bg-yellow-100 text-yellow-800";
      case "D": return "bg-orange-100 text-orange-800";
      case "F": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Stats
  const stats = {
    totalStudents: students.length,
    totalExams: exams.length,
    totalAssignments: assignments.length,
    gradedResults: examResults.filter(r => r.status === "GRADED").length,
    averageScore: examResults.length > 0 
      ? Math.round(examResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / examResults.length)
      : 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/teacher" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">Grades & Exams</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">📝 Grades & Exam Management</h1>
          <p className="text-gray-500">Manage exams, assignments, and student grades</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setShowExamModal(true)} 
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            ➕ Create Exam
          </button>
          <button 
            onClick={() => setShowAssignmentModal(true)} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            📋 Create Assignment
          </button>
          <button 
            onClick={() => openGradeModal()} 
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            ✏️ Enter Grade
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">My Students</p>
              <p className="text-2xl font-bold mt-1">{stats.totalStudents}</p>
            </div>
            <div className="text-3xl">👨‍🎓</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Exams</p>
              <p className="text-2xl font-bold mt-1">{stats.totalExams}</p>
            </div>
            <div className="text-3xl">📝</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Assignments</p>
              <p className="text-2xl font-bold mt-1">{stats.totalAssignments}</p>
            </div>
            <div className="text-3xl">📋</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Graded</p>
              <p className="text-2xl font-bold mt-1 text-green-600">{stats.gradedResults}</p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Avg Score</p>
              <p className="text-2xl font-bold mt-1 text-blue-600">{stats.averageScore}%</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b flex">
          <button 
            onClick={() => setActiveTab("grades")} 
            className={`px-6 py-4 font-medium transition-colors ${activeTab === "grades" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            📊 Student Grades
          </button>
          <button 
            onClick={() => setActiveTab("exams")} 
            className={`px-6 py-4 font-medium transition-colors ${activeTab === "exams" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            📝 Exams
          </button>
          <button 
            onClick={() => setActiveTab("assignments")} 
            className={`px-6 py-4 font-medium transition-colors ${activeTab === "assignments" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            📋 Assignments
          </button>
        </div>

        {/* Filters for Grades */}
        {activeTab === "grades" && (
          <div className="p-4 border-b bg-gray-50 flex flex-wrap gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Class</label>
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)} 
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="all">All Classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Exam</label>
              <select 
                value={selectedExam} 
                onChange={(e) => setSelectedExam(e.target.value)} 
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="all">All Exams</option>
                {exams.map(e => <option key={e.id} value={e.id}>{e.examName}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : activeTab === "grades" ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feedback</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredResults.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-500">No grades found</td></tr>
                  ) : (
                    filteredResults.map(result => (
                      <tr key={result.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{result.studentName || getStudentName(result.studentId)}</td>
                        <td className="px-6 py-4 text-gray-600">{result.examName || getExamName(result.examId)}</td>
                        <td className="px-6 py-4 font-bold">{result.score}/{result.maxScore || 100}</td>
                        <td className="px-6 py-4">{Math.round(result.percentage || 0)}%</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(result.grade)}`}>
                            {result.grade || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm max-w-[200px] truncate">{result.feedback || "-"}</td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => openGradeModal(result)} 
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            ✏️
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : activeTab === "exams" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">No exams created yet</div>
              ) : (
                exams.map(exam => (
                  <div key={exam.id} className="bg-gray-50 rounded-xl p-5 border">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{exam.examName}</h3>
                        <p className="text-sm text-gray-500">{getClassName(exam.classId || "")}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        exam.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                        exam.status === "SCHEDULED" ? "bg-blue-100 text-blue-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {exam.status || "DRAFT"}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Type:</span>
                        <span className="font-medium">{exam.examType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Max Score:</span>
                        <span className="font-medium">{exam.maxScore}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Pass Mark:</span>
                        <span className="font-medium">{exam.passingScore}</span>
                      </div>
                      {exam.examDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Date:</span>
                          <span className="font-medium">{new Date(exam.examDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 pt-3 border-t flex gap-2">
                      <Link 
                        href={`/dashboard/teacher/grades?examId=${exam.id}`}
                        className="flex-1 text-center px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                      >
                        Grade Students
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">No assignments created yet</div>
              ) : (
                assignments.map(assignment => (
                  <div key={assignment.id} className="bg-gray-50 rounded-xl p-5 border">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{assignment.title}</h3>
                        <p className="text-sm text-gray-500">{getClassName(assignment.classId || "")}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        assignment.isGraded ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                      }`}>
                        {assignment.isGraded ? "Graded" : "Ungraded"}
                      </span>
                    </div>
                    {assignment.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{assignment.description}</p>
                    )}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Type:</span>
                        <span className="font-medium">{assignment.assignmentType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Max Score:</span>
                        <span className="font-medium">{assignment.maxScore}</span>
                      </div>
                      {assignment.dueDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Due:</span>
                          <span className="font-medium">{new Date(assignment.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grade Modal */}
      {showGradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-semibold">{editingResult ? "Edit Grade" : "Enter Grade"}</h2>
              <button onClick={() => setShowGradeModal(false)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>
            <div className="space-y-4 px-5 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Student *</label>
                <select 
                  value={gradeForm.studentId} 
                  onChange={(e) => setGradeForm(prev => ({ ...prev, studentId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  disabled={!!editingResult}
                >
                  <option value="">Select Student</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.fullname || s.name || s.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Exam *</label>
                <select 
                  value={gradeForm.examId} 
                  onChange={(e) => setGradeForm(prev => ({ ...prev, examId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  disabled={!!editingResult}
                >
                  <option value="">Select Exam</option>
                  {exams.map(e => (
                    <option key={e.id} value={e.id}>{e.examName} (Max: {e.maxScore})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Score *</label>
                <input 
                  type="number"
                  value={gradeForm.score} 
                  onChange={(e) => setGradeForm(prev => ({ ...prev, score: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  placeholder="Enter score"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Feedback</label>
                <textarea 
                  value={gradeForm.feedback} 
                  onChange={(e) => setGradeForm(prev => ({ ...prev, feedback: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  rows={3}
                  placeholder="Optional feedback for student"
                />
              </div>
              <div className="flex justify-end gap-3 border-t pt-4">
                <button onClick={() => setShowGradeModal(false)} className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={saveGrade} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Saving..." : "Save Grade"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exam Modal */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-semibold">Create Exam</h2>
              <button onClick={() => setShowExamModal(false)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>
            <div className="space-y-4 px-5 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Exam Name *</label>
                <input 
                  value={examForm.examName} 
                  onChange={(e) => setExamForm(prev => ({ ...prev, examName: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  placeholder="e.g. Mid-term Quiz"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Class *</label>
                <select 
                  value={examForm.classId} 
                  onChange={(e) => setExamForm(prev => ({ ...prev, classId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                >
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Exam Type</label>
                  <select 
                    value={examForm.examType} 
                    onChange={(e) => setExamForm(prev => ({ ...prev, examType: e.target.value }))}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  >
                    <option value="QUIZ">Quiz</option>
                    <option value="MIDTERM">Midterm</option>
                    <option value="FINAL">Final</option>
                    <option value="UNIT_TEST">Unit Test</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input 
                    type="date"
                    value={examForm.examDate} 
                    onChange={(e) => setExamForm(prev => ({ ...prev, examDate: e.target.value }))}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Score</label>
                  <input 
                    type="number"
                    value={examForm.maxScore} 
                    onChange={(e) => setExamForm(prev => ({ ...prev, maxScore: e.target.value }))}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pass Mark</label>
                  <input 
                    type="number"
                    value={examForm.passingScore} 
                    onChange={(e) => setExamForm(prev => ({ ...prev, passingScore: e.target.value }))}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration (min)</label>
                  <input 
                    type="number"
                    value={examForm.duration} 
                    onChange={(e) => setExamForm(prev => ({ ...prev, duration: e.target.value }))}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t pt-4">
                <button onClick={() => setShowExamModal(false)} className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={createExam} disabled={saving} className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50">
                  {saving ? "Creating..." : "Create Exam"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-semibold">Create Assignment</h2>
              <button onClick={() => setShowAssignmentModal(false)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>
            <div className="space-y-4 px-5 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title *</label>
                <input 
                  value={assignmentForm.title} 
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  placeholder="e.g. Chapter 5 Exercises"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea 
                  value={assignmentForm.description} 
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Class *</label>
                <select 
                  value={assignmentForm.classId} 
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, classId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                >
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select 
                    value={assignmentForm.assignmentType} 
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, assignmentType: e.target.value }))}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  >
                    <option value="HOMEWORK">Homework</option>
                    <option value="PROJECT">Project</option>
                    <option value="ESSAY">Essay</option>
                    <option value="PRESENTATION">Presentation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date</label>
                  <input 
                    type="date"
                    value={assignmentForm.dueDate} 
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Score</label>
                  <input 
                    type="number"
                    value={assignmentForm.maxScore} 
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, maxScore: e.target.value }))}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </div>
                <div className="flex items-center mt-6">
                  <input 
                    type="checkbox"
                    id="isGraded"
                    checked={assignmentForm.isGraded}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, isGraded: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="isGraded" className="text-sm text-gray-700">Graded Assignment</label>
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t pt-4">
                <button onClick={() => setShowAssignmentModal(false)} className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={createAssignment} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Creating..." : "Create Assignment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
