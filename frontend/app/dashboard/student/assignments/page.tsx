"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { loadMyClasses, resolveMyStudentId } from "../../../../lib/student-context";

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

  const handleSubmit = async (assignment: Assignment) => {
    if (!confirm(`Submit "${assignment.title}"? You may not be able to change it afterwards.`)) return;
    try {
      const studentId = await resolveMyStudentId();
      if (!studentId) {
        alert("Could not resolve your student profile. Please try again.");
        return;
      }
      await apiFetch(`/api/assignment-submissions`, {
        method: "POST",
        body: JSON.stringify({
          assignmentId: Number(assignment.id),
          studentId,
          submittedAt: new Date().toISOString(),
          status: "SUBMITTED",
        }),
      });
      await fetchAssignments();
    } catch (err) {
      console.error(err);
      alert("Failed to submit assignment. Please try again.");
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
                      <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
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
                    onClick={() => handleSubmit(assignment)}
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
    </div>
  );
}
