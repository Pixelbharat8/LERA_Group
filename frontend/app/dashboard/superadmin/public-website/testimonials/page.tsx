"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";

interface Testimonial {
  id: string;
  parentName: string;
  parentNameVi?: string;
  studentName?: string;
  studentAge?: number;
  rating: number;
  content: string;
  contentVi?: string;
  avatarUrl?: string;
  isFeatured: boolean;
  isPublished: boolean;
  displayOrder: number;
}

export default function TestimonialsEditor() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTestimonial, setNewTestimonial] = useState<Partial<Testimonial>>({
    parentName: "",
    studentName: "",
    studentAge: 0,
    content: "",
    rating: 5,
    avatarUrl: "",
    isPublished: true,
    isFeatured: false,
    displayOrder: 0,
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const data = await apiFetch("/api/testimonials");
      setTestimonials(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Error fetching testimonials:", err);
      setError(err.message || "Failed to load testimonials");
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    try {
      for (const testimonial of testimonials) {
        await apiFetch(`/api/testimonials/${testimonial.id}`, {
          method: "PUT",
          body: JSON.stringify(testimonial)
        });
      }
      alert("✅ Testimonials saved successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to save testimonials");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdd = async () => {
    try {
      const created = await apiFetch("/api/testimonials", {
        method: "POST",
        body: JSON.stringify({
          ...newTestimonial,
          displayOrder: testimonials.length
        })
      });
      
      setTestimonials([...testimonials, created]);
      setShowAddModal(false);
      setNewTestimonial({ parentName: "", studentName: "", studentAge: 0, content: "", rating: 5, avatarUrl: "", isPublished: true, isFeatured: false, displayOrder: 0 });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;
    
    try {
      await apiFetch(`/api/testimonials/${id}`, { method: "DELETE" });
      setTestimonials(testimonials.filter(t => t.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdate = (id: string, field: string, value: any) => {
    setTestimonials(testimonials.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
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
            <span>Public Website</span>
            <span>/</span>
            <span className="text-gray-900">Testimonials</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">💬 Testimonials Manager</h1>
          <p className="text-gray-500">Manage customer testimonials displayed on the website</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            ➕ Add Testimonial
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "💾 Save All"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Testimonials List */}
      <div className="space-y-4">
        {(!testimonials || testimonials.length === 0) && (
          <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
            No testimonials yet. Click "Add Testimonial" to create one.
          </div>
        )}
        {(testimonials || []).map((testimonial) => (
          <div 
            key={testimonial.id}
            className={`bg-white rounded-xl shadow-sm p-6 border-2 transition-all ${
              testimonial.isPublished ? "border-transparent" : "border-gray-200 opacity-60"
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <img 
                  src={testimonial.avatarUrl || "https://via.placeholder.com/100"} 
                  alt={testimonial.parentName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                />
              </div>

              {/* Content */}
              <div className="flex-1 space-y-3">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Parent Name</label>
                    <input
                      type="text"
                      value={testimonial.parentName}
                      onChange={(e) => handleUpdate(testimonial.id, "parentName", e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Student Name</label>
                    <input
                      type="text"
                      value={testimonial.studentName || ""}
                      onChange={(e) => handleUpdate(testimonial.id, "studentName", e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Student Age</label>
                    <input
                      type="number"
                      value={testimonial.studentAge || 0}
                      onChange={(e) => handleUpdate(testimonial.id, "studentAge", parseInt(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Testimonial Content</label>
                  <textarea
                    value={testimonial.content}
                    onChange={(e) => handleUpdate(testimonial.id, "content", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Avatar URL</label>
                  <input
                    type="text"
                    value={testimonial.avatarUrl || ""}
                    onChange={(e) => handleUpdate(testimonial.id, "avatarUrl", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-center gap-6 flex-wrap">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleUpdate(testimonial.id, "rating", star)}
                          className={`text-xl ${star <= testimonial.rating ? "text-yellow-400" : "text-gray-300"}`}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={testimonial.isPublished}
                      onChange={(e) => handleUpdate(testimonial.id, "isPublished", e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-600">Published</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={testimonial.isFeatured}
                      onChange={(e) => handleUpdate(testimonial.id, "isFeatured", e.target.checked)}
                      className="w-4 h-4 text-yellow-600 rounded"
                    />
                    <span className="text-sm text-gray-600">Featured</span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Display Order</label>
                    <input
                      type="number"
                      value={testimonial.displayOrder}
                      onChange={(e) => handleUpdate(testimonial.id, "displayOrder", parseInt(e.target.value))}
                      className="w-20 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => handleDelete(testimonial.id)}
                  className="p-2 text-red-400 hover:text-red-600"
                >
                  🗑
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">➕ Add New Testimonial</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Name *</label>
                <input
                  type="text"
                  value={newTestimonial.parentName || ""}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, parentName: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Nguyễn Văn A"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
                  <input
                    type="text"
                    value={newTestimonial.studentName || ""}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, studentName: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., Bé An"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student Age</label>
                  <input
                    type="number"
                    value={newTestimonial.studentAge || 0}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, studentAge: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., 5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Testimonial Content *</label>
                <textarea
                  value={newTestimonial.content || ""}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, content: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="What did they say about LERA Academy?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
                <input
                  type="text"
                  value={newTestimonial.avatarUrl || ""}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, avatarUrl: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewTestimonial({ ...newTestimonial, rating: star })}
                      className={`text-2xl ${star <= (newTestimonial.rating || 5) ? "text-yellow-400" : "text-gray-300"}`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newTestimonial.isPublished ?? true}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, isPublished: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-600">Published</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newTestimonial.isFeatured ?? false}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, isFeatured: e.target.checked })}
                    className="w-4 h-4 text-yellow-600 rounded"
                  />
                  <span className="text-sm text-gray-600">Featured</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Testimonial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
