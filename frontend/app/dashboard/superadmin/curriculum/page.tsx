"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../../lib/api";

interface Curriculum {
  id: string;
  name: string;
  nameVi?: string;
  description?: string;
  gradeLevel?: string;
  version?: string;
  totalHours?: number;
  isActive: boolean;
}

export default function CurriculumManagement() {
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCurriculum, setEditingCurriculum] = useState<Curriculum | null>(null);
  const [formData, setFormData] = useState({ name: "", gradeLevel: "", version: "", totalHours: 40 });

  useEffect(() => {
    fetchCurricula();
  }, []);

  const fetchCurricula = async () => {
    try {
      const data = await apiFetch("/api/curriculum");
      setCurricula(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching curriculum:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCurriculum) {
        await apiFetch(`/api/curriculum/${editingCurriculum.id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
      } else {
        await apiFetch("/api/curriculum", {
          method: "POST",
          body: JSON.stringify(formData),
        });
      }
      setShowModal(false);
      setEditingCurriculum(null);
      fetchCurricula();
      setFormData({ name: "", gradeLevel: "", version: "", totalHours: 40 });
    } catch (error) {
      console.error("Error saving curriculum:", error);
    }
  };

  const handleEdit = (curriculum: Curriculum) => {
    setEditingCurriculum(curriculum);
    setFormData({
      name: curriculum.name,
      gradeLevel: curriculum.gradeLevel || "",
      version: curriculum.version || "",
      totalHours: curriculum.totalHours || 40,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this curriculum?")) return;
    try {
      await apiFetch(`/api/curriculum/${id}`, { method: "DELETE" });
      fetchCurricula();
    } catch (error) {
      console.error("Error deleting curriculum:", error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Curriculum Management</h1>
          <p className="text-gray-500">Manage educational curricula and course structures</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Add Curriculum
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm">Total Curricula</h3>
          <p className="text-2xl font-bold">{curricula.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm">Active</h3>
          <p className="text-2xl font-bold">{curricula.filter(c => c.isActive).length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <h3 className="text-gray-500 text-sm">Total Hours</h3>
          <p className="text-2xl font-bold">{curricula.reduce((acc, c) => acc + (c.totalHours || 0), 0)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <h3 className="text-gray-500 text-sm">Grade Levels</h3>
          <p className="text-2xl font-bold">{new Set(curricula.map(c => c.gradeLevel).filter(Boolean)).size}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {curricula.length === 0 ? (
          <div className="col-span-3 bg-white rounded-lg p-8 text-center text-gray-500">
            No curricula found. Create your first curriculum!
          </div>
        ) : (
          curricula.map((curriculum) => (
            <div key={curriculum.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg text-gray-900">{curriculum.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs ${curriculum.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {curriculum.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {curriculum.description && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{curriculum.description}</p>}
              <div className="flex flex-wrap gap-2 mb-4">
                {curriculum.gradeLevel && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{curriculum.gradeLevel}</span>}
                {curriculum.version && <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">v{curriculum.version}</span>}
                {curriculum.totalHours && <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">{curriculum.totalHours}h</span>}
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => handleEdit(curriculum)} className="text-blue-600 hover:text-blue-900 text-sm">Edit</button>
                <button onClick={() => handleDelete(curriculum.id)} className="text-red-600 hover:text-red-900 text-sm">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingCurriculum ? "Edit Curriculum" : "Add New Curriculum"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                <select value={formData.gradeLevel} onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                  <option value="">Select Level</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Elementary">Elementary</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                <input type="text" value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="e.g., 1.0" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Hours</label>
                <input type="number" min="1" value={formData.totalHours} onChange={(e) => setFormData({ ...formData, totalHours: parseInt(e.target.value) })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setShowModal(false); setEditingCurriculum(null); }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingCurriculum ? "Save Changes" : "Add Curriculum"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
