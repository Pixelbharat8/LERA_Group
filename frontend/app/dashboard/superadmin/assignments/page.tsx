"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../../lib/api";
import { exportToCsv, datedFilename } from "../../../../lib/export-csv";
import { buildCenterFilterUrl } from "../../../../lib/center-filter";
import { useUserCenter } from "../../../hooks/useUserCenter";

interface Assignment {
  id: number;
  title: string;
  description?: string;
  classId: number;
  assignmentType: string;
  assignedDate: string;
  dueDate: string;
  maxScore: number;
  isGraded: boolean;
}

export default function AssignmentManagement() {
  const { centerId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ title: "", assignmentType: "homework", dueDate: "", maxScore: 100, classId: 1, createdBy: 1 });

  useEffect(() => {
    if (!userLoading) {
      fetchAssignments();
    }
  }, [userLoading, centerId]);

  const fetchAssignments = async () => {
    try {
      const data = await apiFetch(
        buildCenterFilterUrl("/api/assignments", shouldFilterByCenter ? centerId : null)
      );
      setAssignments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData({ title: "", assignmentType: "homework", dueDate: "", maxScore: 100, classId: 1, createdBy: 1 });
    setShowModal(true);
  };

  const openEdit = (assignment: Assignment) => {
    setEditingId(assignment.id);
    setFormData({
      title: assignment.title,
      assignmentType: assignment.assignmentType,
      dueDate: assignment.dueDate ? assignment.dueDate.split("T")[0] : "",
      maxScore: assignment.maxScore,
      classId: assignment.classId,
      createdBy: 1,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId !== null) {
        await apiFetch(`/api/assignments/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({ ...formData }),
        });
      } else {
        await apiFetch("/api/assignments", {
          method: "POST",
          body: JSON.stringify({ ...formData, assignedDate: new Date().toISOString().split('T')[0] }),
        });
      }
      setShowModal(false);
      setEditingId(null);
      fetchAssignments();
      setFormData({ title: "", assignmentType: "homework", dueDate: "", maxScore: 100, classId: 1, createdBy: 1 });
    } catch (error) {
      console.error("Error saving assignment:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;
    try {
      await apiFetch(`/api/assignments/${id}`, { method: "DELETE" });
      fetchAssignments();
    } catch (error) {
      console.error("Error deleting assignment:", error);
    }
  };

  const handleExport = () => {
    exportToCsv(datedFilename("assignments"), assignments, [
      { key: "title", label: "Title" },
      { key: "assignmentType", label: "Type" },
      { key: (a) => new Date(a.assignedDate).toLocaleDateString(), label: "Assigned" },
      { key: (a) => new Date(a.dueDate).toLocaleDateString(), label: "Due Date" },
      { key: "maxScore", label: "Max Score" },
    ]);
  };

  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignment Management</h1>
          <p className="text-gray-500">Create and manage class assignments</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Export CSV
          </button>
          <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            + Create Assignment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm">Total Assignments</h3>
          <p className="text-2xl font-bold">{assignments.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm">Active</h3>
          <p className="text-2xl font-bold">{assignments.filter(a => getDaysRemaining(a.dueDate) >= 0).length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <h3 className="text-gray-500 text-sm">Due This Week</h3>
          <p className="text-2xl font-bold">{assignments.filter(a => getDaysRemaining(a.dueDate) >= 0 && getDaysRemaining(a.dueDate) <= 7).length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <h3 className="text-gray-500 text-sm">Overdue</h3>
          <p className="text-2xl font-bold">{assignments.filter(a => getDaysRemaining(a.dueDate) < 0).length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assignments.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No assignments found. Create your first assignment!</td></tr>
            ) : (
              assignments.map((assignment) => {
                const daysRemaining = getDaysRemaining(assignment.dueDate);
                return (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{assignment.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs capitalize ${
                        assignment.assignmentType === "homework" ? "bg-blue-100 text-blue-800" :
                        assignment.assignmentType === "project" ? "bg-purple-100 text-purple-800" :
                        assignment.assignmentType === "quiz" ? "bg-orange-100 text-orange-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {assignment.assignmentType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(assignment.assignedDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(assignment.dueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{assignment.maxScore}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        daysRemaining < 0 ? "bg-red-100 text-red-800" :
                        daysRemaining <= 3 ? "bg-orange-100 text-orange-800" :
                        "bg-green-100 text-green-800"
                      }`}>
                        {daysRemaining < 0 ? "Overdue" : daysRemaining === 0 ? "Due Today" : `${daysRemaining} days left`}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button onClick={() => openEdit(assignment)} className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                      <button className="text-green-600 hover:text-green-900 mr-3">View Submissions</button>
                      <button onClick={() => handleDelete(assignment.id)} className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingId !== null ? "Edit Assignment" : "Create Assignment"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={formData.assignmentType} onChange={(e) => setFormData({ ...formData, assignmentType: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                    <option value="homework">Homework</option>
                    <option value="project">Project</option>
                    <option value="quiz">Quiz</option>
                    <option value="essay">Essay</option>
                    <option value="presentation">Presentation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Score</label>
                  <input type="number" min="1" value={formData.maxScore} onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) })} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                <input type="date" required value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setShowModal(false); setEditingId(null); }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingId !== null ? "Save" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
