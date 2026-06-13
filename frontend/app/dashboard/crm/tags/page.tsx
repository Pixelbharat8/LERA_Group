"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

interface LeadTag {
  id: string;
  name: string;
  color?: string;
  description?: string;
  createdAt?: string;
}

const TAG_COLORS = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Yellow", value: "#F59E0B" },
  { name: "Red", value: "#EF4444" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Pink", value: "#EC4899" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Cyan", value: "#06B6D4" },
];

export default function LeadTagsPage() {
  const [tags, setTags] = useState<LeadTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<LeadTag | null>(null);
  const [formData, setFormData] = useState({ name: "", color: "#3B82F6", description: "" });

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const data = await apiFetch("/api/lead-tags");
      setTags(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching tags:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingTag) {
        await apiFetch(`/api/lead-tags/${editingTag.id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
      } else {
        await apiFetch("/api/lead-tags", {
          method: "POST",
          body: JSON.stringify(formData),
        });
      }
      setShowModal(false);
      setEditingTag(null);
      setFormData({ name: "", color: "#3B82F6", description: "" });
      fetchTags();
    } catch (err) {
      console.error("Error saving tag:", err);
    }
  };

  const handleEdit = (tag: LeadTag) => {
    setEditingTag(tag);
    setFormData({ name: tag.name, color: tag.color || "#3B82F6", description: tag.description || "" });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tag?")) return;
    try {
      await apiFetch(`/api/lead-tags/${id}`, { method: "DELETE" });
      fetchTags();
    } catch (err) {
      console.error("Error deleting tag:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/crm" className="hover:text-blue-600">CRM</Link>
            <span>/</span>
            <span className="text-gray-900">Tags</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">🏷️ Lead Tags</h1>
          <p className="text-gray-500">Organize and categorize your leads with tags</p>
        </div>
        <button
          onClick={() => { setEditingTag(null); setFormData({ name: "", color: "#3B82F6", description: "" }); setShowModal(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Create Tag
        </button>
      </div>

      {/* Tags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tags.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl p-8 text-center text-gray-500">
            No tags created yet. Create your first tag to organize leads!
          </div>
        ) : (
          tags.map((tag) => (
            <div key={tag.id} className="bg-white rounded-xl shadow-sm p-4 border hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: tag.color || "#3B82F6" }}
                />
                <span className="font-semibold text-lg">{tag.name}</span>
              </div>
              {tag.description && (
                <p className="text-sm text-gray-500 mb-3">{tag.description}</p>
              )}
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-xs text-gray-400">
                  {tag.createdAt ? new Date(tag.createdAt).toLocaleDateString() : ""}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(tag)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(tag.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4">{editingTag ? "Edit Tag" : "Create Tag"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tag Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="e.g., Hot Lead, VIP, Priority"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <div className="flex flex-wrap gap-2">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`w-8 h-8 rounded-full border-2 ${formData.color === color.value ? "border-gray-800" : "border-transparent"}`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg h-20 resize-none"
                  placeholder="Optional description..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setShowModal(false); setEditingTag(null); }}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {editingTag ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
