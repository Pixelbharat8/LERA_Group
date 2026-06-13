"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../../lib/api";

interface Exam {
  id: string;
  name: string;
  classId: string;
  examTypeId?: string;
  examDate: string;
  maxScore: number;
  passingScore: number;
  durationMinutes: number;
  description?: string;
}

export default function ExamManagement() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [formData, setFormData] = useState({ name: "", examDate: "", maxScore: 100, passingScore: 50, durationMinutes: 60 });

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const data = await apiFetch("/api/exams");
      setExams(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching exams:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingExam) {
        await apiFetch(`/api/exams/${editingExam.id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
      } else {
        await apiFetch("/api/exams", {
          method: "POST",
          body: JSON.stringify(formData),
        });
      }
      setShowModal(false);
      setEditingExam(null);
      fetchExams();
      setFormData({ name: "", examDate: "", maxScore: 100, passingScore: 50, durationMinutes: 60 });
    } catch (error) {
      console.error("Error saving exam:", error);
    }
  };

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam);
    setFormData({
      name: exam.name,
      examDate: exam.examDate,
      maxScore: exam.maxScore,
      passingScore: exam.passingScore,
      durationMinutes: exam.durationMinutes,
    });
    setShowModal(true);
  };

  const handleViewResults = (examId: string) => {
    window.location.href = `/dashboard/superadmin/exams/results?examId=${examId}`;
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this exam?")) return;
    try {
      await apiFetch(`/api/exams/${id}`, { method: "DELETE" });
      fetchExams();
    } catch (error) {
      console.error("Error deleting exam:", error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exam Management</h1>
          <p className="text-gray-500">Create and manage examinations</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Create Exam
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm">Total Exams</h3>
          <p className="text-2xl font-bold">{exams.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm">Upcoming</h3>
          <p className="text-2xl font-bold">{exams.filter(e => new Date(e.examDate) >= new Date()).length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <h3 className="text-gray-500 text-sm">This Month</h3>
          <p className="text-2xl font-bold">{exams.filter(e => {
            const date = new Date(e.examDate);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          }).length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <h3 className="text-gray-500 text-sm">Completed</h3>
          <p className="text-2xl font-bold">{exams.filter(e => new Date(e.examDate) < new Date()).length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Passing</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {exams.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No exams found. Create your first exam!</td></tr>
            ) : (
              exams.map((exam) => {
                const examDate = new Date(exam.examDate);
                const now = new Date();
                const isUpcoming = examDate >= now;
                return (
                  <tr key={exam.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{exam.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{examDate.toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{exam.durationMinutes} min</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{exam.maxScore}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{exam.passingScore}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${isUpcoming ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                        {isUpcoming ? "Upcoming" : "Completed"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button onClick={() => handleEdit(exam)} className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                      <button onClick={() => handleViewResults(exam.id)} className="text-green-600 hover:text-green-900 mr-3">Results</button>
                      <button onClick={() => handleDelete(exam.id)} className="text-red-600 hover:text-red-900">Delete</button>
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
            <h2 className="text-xl font-bold mb-4">{editingExam ? "Edit Exam" : "Create Exam"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Date *</label>
                <input type="date" required value={formData.examDate} onChange={(e) => setFormData({ ...formData, examDate: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                  <input type="number" min="1" value={formData.durationMinutes} onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Score</label>
                  <input type="number" min="1" value={formData.maxScore} onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passing</label>
                  <input type="number" min="1" value={formData.passingScore} onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setShowModal(false); setEditingExam(null); }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingExam ? "Save Changes" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
