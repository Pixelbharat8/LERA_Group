"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../lib/api";
import { useUserCenter, buildCenterFilterUrl } from "../../hooks/useUserCenter";
import { useLanguage } from "../../context/LanguageContext";

interface Exam {
  id: string;
  name: string;
  classId?: string;
  examTypeId?: string;
  examDate?: string;
  maxScore?: number;
  passingScore?: number;
  durationMinutes?: number;
  description?: string;
  status?: string;
  createdAt?: string;
}

export default function ExamsPage() {
  const { centerId: userCenterId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const { t } = useLanguage();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [formData, setFormData] = useState({ name: "", examDate: "", maxScore: 100, passingScore: 50, durationMinutes: 60 });

  useEffect(() => {
    if (!userLoading) {
      fetchExams();
    }
  }, [userLoading, userCenterId]);

  const fetchExams = async () => {
    try {
      const url = buildCenterFilterUrl("/api/exams", shouldFilterByCenter ? userCenterId : null);
      const data = await apiFetch(url);
      setExams(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching exams:", err);
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam);
    setFormData({
      name: exam.name || "",
      examDate: exam.examDate || "",
      maxScore: exam.maxScore || 100,
      passingScore: exam.passingScore || 50,
      durationMinutes: exam.durationMinutes || 60,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this exam?")) return;
    try {
      await apiFetch(`/api/exams/${id}`, { method: "DELETE" });
      fetchExams();
    } catch (err) {
      console.error("Error deleting exam:", err);
      alert("Failed to delete exam");
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
      setFormData({ name: "", examDate: "", maxScore: 100, passingScore: 50, durationMinutes: 60 });
      fetchExams();
    } catch (err) {
      console.error("Error saving exam:", err);
      alert("Failed to save exam");
    }
  };

  const getExamStatus = (exam: Exam) => {
    if (!exam.examDate) return "Scheduled";
    const examDate = new Date(exam.examDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (examDate > today) return "Upcoming";
    if (examDate.toDateString() === today.toDateString()) return "Today";
    return "Completed";
  };

  const upcomingCount = exams.filter(e => getExamStatus(e) === "Upcoming").length;
  const completedCount = exams.filter(e => getExamStatus(e) === "Completed").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/superadmin" className="hover:text-blue-600">{t("dashboard")}</Link>
            <span>/</span>
            <span className="text-gray-900">{t("exams")}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">📝 {t("examsDashboard")}</h1>
          <p className="text-gray-500">{t("examOverview")}</p>
        </div>
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors" onClick={() => { setEditingExam(null); setFormData({ name: "", examDate: "", maxScore: 100, passingScore: 50, durationMinutes: 60 }); setShowModal(true); }}>
          ➕ {t("createExam")}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">📝</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{exams.length}</p>
              <p className="text-sm text-gray-500">{t("totalExams")}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-2xl">⏳</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{upcomingCount}</p>
              <p className="text-sm text-gray-500">{t("upcoming")}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">✅</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
              <p className="text-sm text-gray-500">{t("completed")}</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading exams...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-900">No Exams Found</h3>
          <p className="text-gray-500 mt-2">Create your first exam to get started.</p>
        </div>
      ) : (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {exams.map((exam) => {
              const status = getExamStatus(exam);
              return (
              <tr key={exam.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium">{exam.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{exam.maxScore || "-"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{exam.examDate || "-"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{exam.durationMinutes ? `${exam.durationMinutes} min` : "-"}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    status === "Completed" ? "bg-green-100 text-green-800" :
                    status === "Today" ? "bg-blue-100 text-blue-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>{status}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button onClick={() => handleEdit(exam)} className="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                  <button onClick={() => handleDelete(exam.id)} className="text-red-600 hover:text-red-800">Delete</button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}

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
