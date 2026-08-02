"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { loadMyClasses, resolveMyStudentId } from "../../../../lib/student-context";
import { uploadFile, uploadPublicPath } from "../../../../lib/upload-file";

interface Assignment {
  id: string;
  title: string;
  description: string;
  className: string;
  dueDate: string;
  status: "PENDING" | "SUBMITTED" | "GRADED";
  grade?: string;
  feedback?: string;
}

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "SUBMITTED" | "GRADED">("ALL");
  // Submission modal state
  const [submitTarget, setSubmitTarget] = useState<Assignment | null>(null);
  const [submitText, setSubmitText] = useState("");
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const studentId = await resolveMyStudentId();
      if (!studentId) {
        setAssignments([]);
        return;
      }
      const myClasses = await loadMyClasses(studentId);
      const classIds = new Set(myClasses.map((c) => c.id));
      const classNames = new Map(myClasses.map((c) => [c.id, c.className]));
      const data = await apiFetch(`/api/assignments?studentId=${studentId}`).catch(() => []);
      const assignmentsArray = (Array.isArray(data) ? data : []).filter(
        (a: { classId?: string }) => !a.classId || classIds.has(String(a.classId))
      );
      if (assignmentsArray.length > 0) {
        setAssignments(assignmentsArray.map((a: any) => ({
          id: a.id,
          title: a.title || a.name || "Assignment",
          description: a.description || "",
          className:
            a.className ||
            a.class?.name ||
            classNames.get(String(a.classId ?? "")) ||
            "Class",
          dueDate: a.dueDate || a.due_date || new Date().toISOString(),
          status: a.status || "PENDING",
          grade: a.grade,
          feedback: a.feedback
        })));
      } else {
        setAssignments([]);
      }
    } catch (err) {
      console.error(err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const openSubmit = (assignment: Assignment) => {
    setSubmitTarget(assignment);
    setSubmitText("");
    setSubmitFile(null);
    setSubmitError(null);
  };

  const doSubmit = async () => {
    if (!submitTarget) return;
    // Require at least some work — written text or a file.
    if (!submitText.trim() && !submitFile) {
      setSubmitError("Add a written answer or attach a file before submitting.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const studentId = await resolveMyStudentId();
      if (!studentId) {
        setSubmitError("Could not resolve your student profile. Please try again.");
        return;
      }

      let attachmentUrl: string | undefined;
      let attachmentName: string | undefined;
      let attachmentSize: number | undefined;
      if (submitFile) {
        const res = await uploadFile(submitFile);
        const url = uploadPublicPath(res);
        if (!url) {
          setSubmitError(res.error || "File upload was rejected (allowed: images, PDF, Word, Excel; max 10MB).");
          return;
        }
        attachmentUrl = url;
        attachmentName = res.originalName || submitFile.name;
        attachmentSize = res.size ?? submitFile.size;
      }

      await apiFetch(`/api/assignment-submissions`, {
        method: "POST",
        body: JSON.stringify({
          assignmentId: Number(submitTarget.id),
          studentId,
          submissionText: submitText.trim() || null,
          attachmentUrl: attachmentUrl || null,
          attachmentName: attachmentName || null,
          attachmentSize: attachmentSize ?? null,
          submittedAt: new Date().toISOString(),
          status: "SUBMITTED",
        }),
      });
      setSubmitTarget(null);
      await fetchAssignments();
    } catch (err) {
      console.error(err);
      setSubmitError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      SUBMITTED: "bg-blue-100 text-blue-800",
      GRADED: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const filteredAssignments = filter === "ALL" ? assignments : assignments.filter((a) => a.status === filter);

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
          <span className="text-gray-900">My Assignments</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">📝 My Assignments</h1>
        <p className="text-gray-500 mt-1">View and submit your assignments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Total Assignments</div>
          <div className="text-2xl font-bold text-gray-900">{assignments.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            {assignments.filter((a) => a.status === "PENDING").length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Submitted</div>
          <div className="text-2xl font-bold text-blue-600">
            {assignments.filter((a) => a.status === "SUBMITTED").length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Graded</div>
          <div className="text-2xl font-bold text-green-600">
            {assignments.filter((a) => a.status === "GRADED").length}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow p-2">
        <div className="flex gap-2">
          {(["ALL", "PENDING", "SUBMITTED", "GRADED"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === status ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">No Assignments Found</h3>
            <p className="text-gray-500">
              {filter === "ALL" ? "You don't have any assignments yet." : `No ${filter.toLowerCase()} assignments.`}
            </p>
          </div>
        ) : (
          filteredAssignments.map((assignment) => (
            <div key={assignment.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{assignment.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(assignment.status)}`}>
                      {assignment.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{assignment.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <span>📚</span>
                      <span>{assignment.className}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>📅</span>
                      <span>Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "—"}</span>
                    </div>
                    {assignment.grade && (
                      <div className="flex items-center gap-1">
                        <span>📊</span>
                        <span className="font-medium">Grade: {assignment.grade}</span>
                      </div>
                    )}
                  </div>
                  {assignment.feedback && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-900"><strong>Feedback:</strong> {assignment.feedback}</p>
                    </div>
                  )}
                </div>
                {assignment.status === "PENDING" && (
                  <button
                    onClick={() => openSubmit(assignment)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
                  >
                    Submit
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {submitTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !submitting && setSubmitTarget(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 border-b border-gray-100">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 truncate">Submit: {submitTarget.title}</h2>
                <p className="text-sm text-gray-500">{submitTarget.className}</p>
              </div>
              <button onClick={() => !submitting && setSubmitTarget(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your answer</label>
                <textarea
                  rows={5}
                  value={submitText}
                  onChange={(e) => setSubmitText(e.target.value)}
                  placeholder="Type your answer, or just attach a file below…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attachment (optional)</label>
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => setSubmitFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-400 mt-1">Images, PDF, Word or Excel · up to 10MB.</p>
                {submitFile && <p className="text-xs text-gray-600 mt-1">Selected: {submitFile.name}</p>}
              </div>
              {submitError && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{submitError}</div>}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={doSubmit}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Submitting…" : "Submit assignment"}
                </button>
                <button
                  onClick={() => setSubmitTarget(null)}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
