"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../../../../lib/api";
import Link from "next/link";

interface FAQItem {
  id: string;
  question: string;
  questionVi?: string;
  answer: string;
  answerVi?: string;
  category?: string;
  order?: number;
  isActive?: boolean;
}

export default function FAQContentPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [editingFAQ, setEditingFAQ] = useState<FAQItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const categories = ["General", "Courses", "Enrollment", "Payment", "Teachers", "Other"];

  const emptyFAQ: FAQItem = {
    id: "",
    question: "",
    questionVi: "",
    answer: "",
    answerVi: "",
    category: "General",
    order: 0,
    isActive: true
  };

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const data = await apiFetch("/api/faqs").catch(() => []);
      if (Array.isArray(data)) {
        setFaqs(data.sort((a, b) => (a.order || 0) - (b.order || 0)));
      }
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingFAQ) return;
    setIsSaving(true);
    try {
      if (isCreating) {
        await apiFetch("/api/faqs", {
          method: "POST",
          body: JSON.stringify(editingFAQ)
        });
      } else {
        await apiFetch(`/api/faqs/${editingFAQ.id}`, {
          method: "PUT",
          body: JSON.stringify(editingFAQ)
        });
      }
      await fetchFAQs();
      setEditingFAQ(null);
      setIsCreating(false);
      alert("FAQ saved successfully!");
    } catch (error) {
      console.error("Error saving FAQ:", error);
      alert("Error saving FAQ. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      await apiFetch(`/api/faqs/${id}`, { method: "DELETE" });
      await fetchFAQs();
      alert("FAQ deleted successfully!");
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      alert("Error deleting FAQ.");
    }
  };

  const filteredFAQs = filterCategory === "all" 
    ? faqs 
    : faqs.filter(f => f.category === filterCategory);

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
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/chairman/website-content" className="text-gray-500 hover:text-gray-700">
                ← Back
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">FAQ Management</h1>
                <p className="text-sm text-gray-500">Manage frequently asked questions</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a href="/faq" target="_blank" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                👁️ Preview
              </a>
              <button
                onClick={() => {
                  setEditingFAQ({ ...emptyFAQ, order: faqs.length + 1 });
                  setIsCreating(true);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                + Add FAQ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Category Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setFilterCategory("all")}
            className={`px-4 py-2 rounded-lg font-medium ${
              filterCategory === "all"
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            All ({faqs.length})
          </button>
          {categories.map((cat) => {
            const count = faqs.filter(f => f.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filterCategory === cat
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFAQs.map((faq, index) => (
            <div
              key={faq.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                        #{index + 1}
                      </span>
                      {faq.category && (
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                          {faq.category}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          faq.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {faq.isActive ? "Active" : "Hidden"}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">Q: {faq.question}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">A: {faq.answer}</p>
                    {faq.questionVi && (
                      <p className="text-gray-400 text-sm mt-2 italic">🇻🇳 {faq.questionVi}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setEditingFAQ(faq);
                        setIsCreating(false);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(faq.id)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredFAQs.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="text-5xl mb-4">❓</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No FAQs Found</h3>
            <p className="text-gray-500 mb-4">
              {filterCategory === "all"
                ? "Add frequently asked questions to help your customers"
                : `No FAQs in the "${filterCategory}" category`}
            </p>
            <button
              onClick={() => {
                setEditingFAQ({ ...emptyFAQ, category: filterCategory === "all" ? "General" : filterCategory });
                setIsCreating(true);
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add FAQ
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingFAQ && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {isCreating ? "Add New FAQ" : "Edit FAQ"}
                </h2>
                <button
                  onClick={() => {
                    setEditingFAQ(null);
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={editingFAQ.category || "General"}
                    onChange={(e) => setEditingFAQ({ ...editingFAQ, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={editingFAQ.order || 0}
                    onChange={(e) => setEditingFAQ({ ...editingFAQ, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    min={0}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question (English) *</label>
                <input
                  type="text"
                  value={editingFAQ.question}
                  onChange={(e) => setEditingFAQ({ ...editingFAQ, question: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="What are your opening hours?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question (Vietnamese)</label>
                <input
                  type="text"
                  value={editingFAQ.questionVi || ""}
                  onChange={(e) => setEditingFAQ({ ...editingFAQ, questionVi: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Giờ mở cửa của bạn là gì?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Answer (English) *</label>
                <textarea
                  value={editingFAQ.answer}
                  onChange={(e) => setEditingFAQ({ ...editingFAQ, answer: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="We are open Monday to Saturday, 8:00 AM to 8:00 PM."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Answer (Vietnamese)</label>
                <textarea
                  value={editingFAQ.answerVi || ""}
                  onChange={(e) => setEditingFAQ({ ...editingFAQ, answerVi: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Chúng tôi mở cửa từ Thứ Hai đến Thứ Bảy, 8:00 sáng đến 8:00 tối."
                />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingFAQ.isActive ?? true}
                    onChange={(e) => setEditingFAQ({ ...editingFAQ, isActive: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <span className="text-gray-700">Show on website</span>
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditingFAQ(null);
                  setIsCreating(false);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !editingFAQ.question || !editingFAQ.answer}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSaving ? "Saving..." : "Save FAQ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
