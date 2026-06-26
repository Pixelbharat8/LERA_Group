"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../../../../lib/api";
import Link from "next/link";

interface Testimonial {
  id: string;
  authorName: string;
  authorNameVi?: string;
  authorRole?: string;
  authorRoleVi?: string;
  content: string;
  contentVi?: string;
  rating?: number;
  isActive?: boolean;
  imageUrl?: string;
}

export default function TestimonialsContentPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const emptyTestimonial: Testimonial = {
    id: "",
    authorName: "",
    authorNameVi: "",
    authorRole: "",
    authorRoleVi: "",
    content: "",
    contentVi: "",
    rating: 5,
    isActive: true,
    imageUrl: ""
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const data = await apiFetch("/api/testimonials").catch(() => []);
      if (Array.isArray(data)) {
        setTestimonials(data);
      }
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingTestimonial) return;
    setIsSaving(true);
    try {
      if (isCreating) {
        await apiFetch("/api/testimonials", {
          method: "POST",
          body: JSON.stringify(editingTestimonial)
        });
      } else {
        await apiFetch(`/api/testimonials/${editingTestimonial.id}`, {
          method: "PUT",
          body: JSON.stringify(editingTestimonial)
        });
      }
      await fetchTestimonials();
      setEditingTestimonial(null);
      setIsCreating(false);
      alert("Testimonial saved successfully!");
    } catch (error) {
      console.error("Error saving testimonial:", error);
      alert("Error saving testimonial. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;
    try {
      await apiFetch(`/api/testimonials/${id}`, { method: "DELETE" });
      await fetchTestimonials();
      alert("Testimonial deleted successfully!");
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      alert("Error deleting testimonial.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/chairman/website-content" className="text-gray-500 hover:text-gray-700">
                ← Back
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Testimonials</h1>
                <p className="text-sm text-gray-500">Manage customer testimonials displayed on website</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a href="/" target="_blank" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                👁️ Preview on Home
              </a>
              <button
                onClick={() => {
                  setEditingTestimonial(emptyTestimonial);
                  setIsCreating(true);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                + Add Testimonial
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                    {(testimonial.authorName || "?").charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{testimonial.authorName}</h3>
                    {testimonial.authorRole && (
                      <p className="text-sm text-gray-500">{testimonial.authorRole}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={star <= (testimonial.rating || 5) ? "text-yellow-400" : "text-gray-300"}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      testimonial.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {testimonial.isActive ? "Active" : "Hidden"}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-gray-700 italic">&quot;{testimonial.content}&quot;</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingTestimonial(testimonial);
                      setIsCreating(false);
                    }}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(testimonial.id)}
                    className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {testimonials.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="text-5xl mb-4">⭐</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Testimonials Yet</h3>
            <p className="text-gray-500 mb-4">Add testimonials to display on your website</p>
            <button
              onClick={() => {
                setEditingTestimonial(emptyTestimonial);
                setIsCreating(true);
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add First Testimonial
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingTestimonial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {isCreating ? "Add New Testimonial" : "Edit Testimonial"}
                </h2>
                <button
                  onClick={() => {
                    setEditingTestimonial(null);
                    setIsCreating(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author Name (English)</label>
                  <input
                    type="text"
                    value={editingTestimonial.authorName}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, authorName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author Name (Vietnamese)</label>
                  <input
                    type="text"
                    value={editingTestimonial.authorNameVi || ""}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, authorNameVi: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role/Title (English)</label>
                  <input
                    type="text"
                    value={editingTestimonial.authorRole || ""}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, authorRole: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Parent of Student"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role/Title (Vietnamese)</label>
                  <input
                    type="text"
                    value={editingTestimonial.authorRoleVi || ""}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, authorRoleVi: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Phụ huynh học sinh"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Testimonial Content (English)</label>
                <textarea
                  value={editingTestimonial.content}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, content: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Share the customer's experience..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Testimonial Content (Vietnamese)</label>
                <textarea
                  value={editingTestimonial.contentVi || ""}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, contentVi: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Chia sẻ trải nghiệm của khách hàng..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEditingTestimonial({ ...editingTestimonial, rating: star })}
                        className={`text-3xl ${
                          star <= (editingTestimonial.rating || 5)
                            ? "text-yellow-400"
                            : "text-gray-300"
                        } hover:scale-110 transition-transform`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingTestimonial.isActive ?? true}
                      onChange={(e) =>
                        setEditingTestimonial({ ...editingTestimonial, isActive: e.target.checked })
                      }
                      className="w-5 h-5 rounded border-gray-300"
                    />
                    <span className="text-gray-700">Show on website</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional)</label>
                <input
                  type="text"
                  value={editingTestimonial.imageUrl || ""}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, imageUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditingTestimonial(null);
                  setIsCreating(false);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !editingTestimonial.authorName || !editingTestimonial.content}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSaving ? "Saving..." : "Save Testimonial"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
