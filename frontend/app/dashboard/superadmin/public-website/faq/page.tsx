"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";

interface FAQ {
  id?: string;
  question: string;
  questionVi?: string;
  answer: string;
  answerVi?: string;
  category?: string;
  sortOrder?: number;
  isActive?: boolean;
}

const FAQ_CATEGORIES = [
  { value: "general", label: "General", emoji: "📋" },
  { value: "enrollment", label: "Enrollment", emoji: "📝" },
  { value: "payment", label: "Payment & Fees", emoji: "💳" },
  { value: "courses", label: "Courses & Programs", emoji: "📚" },
  { value: "schedule", label: "Schedule & Timing", emoji: "📅" },
  { value: "support", label: "Support", emoji: "🆘" },
];

export default function FAQManagementPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [newFaq, setNewFaq] = useState<FAQ | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const data = await apiFetch("/api/faqs");
      if (Array.isArray(data)) {
        setFaqs(data.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
      }
    } catch (err) {
      console.log("Error fetching FAQs");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFaq = async (faq: FAQ) => {
    setSaving(true);
    try {
      if (faq.id) {
        // Update existing
        await apiFetch(`/api/faqs/${faq.id}`, {
          method: "PUT",
          body: JSON.stringify(faq),
        });
        setFaqs(faqs.map(f => f.id === faq.id ? faq : f));
      } else {
        // Create new
        const created = await apiFetch("/api/faqs", {
          method: "POST",
          body: JSON.stringify({
            ...faq,
            sortOrder: faqs.length + 1,
            isActive: true,
          }),
        });
        setFaqs([...faqs, created]);
      }
      setEditingFaq(null);
      setNewFaq(null);
      setMessage("✅ FAQ saved successfully!");
    } catch (err: any) {
      setMessage("❌ Error: " + err.message);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      await apiFetch(`/api/faqs/${id}`, { method: "DELETE" });
      setFaqs(faqs.filter(f => f.id !== id));
      setMessage("✅ FAQ deleted!");
    } catch (err: any) {
      setMessage("❌ Error: " + err.message);
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const handleToggleActive = async (faq: FAQ) => {
    try {
      await apiFetch(`/api/faqs/${faq.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...faq, isActive: !faq.isActive }),
      });
      setFaqs(faqs.map(f => f.id === faq.id ? { ...f, isActive: !f.isActive } : f));
      setMessage("✅ FAQ updated!");
    } catch (err: any) {
      setMessage("❌ Error: " + err.message);
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const filteredFaqs = filterCategory === "all" 
    ? faqs 
    : faqs.filter(f => f.category === filterCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const FAQForm = ({ faq, onSave, onCancel }: { faq: FAQ; onSave: (faq: FAQ) => void; onCancel: () => void }) => {
    const [formData, setFormData] = useState<FAQ>(faq);

    return (
      <div className="bg-blue-50 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question (English) *</label>
            <input
              type="text"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., How can I enroll my child?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question (Vietnamese)</label>
            <input
              type="text"
              value={formData.questionVi || ""}
              onChange={(e) => setFormData({ ...formData, questionVi: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Câu hỏi tiếng Việt"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Answer (English) *</label>
            <textarea
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Answer to the question..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Answer (Vietnamese)</label>
            <textarea
              value={formData.answerVi || ""}
              onChange={(e) => setFormData({ ...formData, answerVi: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Câu trả lời tiếng Việt"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={formData.category || "general"}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {FAQ_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.emoji} {cat.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
            <input
              type="number"
              value={formData.sortOrder || 0}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onSave(formData)}
            disabled={saving || !formData.question || !formData.answer}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? "⏳ Saving..." : faq.id ? "✓ Update FAQ" : "✓ Create FAQ"}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/superadmin" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/superadmin/public-website" className="hover:text-blue-600">Public Website</Link>
            <span>/</span>
            <span className="text-gray-900">FAQ Management</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">❓ FAQ Management</h1>
          <p className="text-gray-500">Manage frequently asked questions for the public website</p>
        </div>
        <div className="flex items-center gap-3">
          {message && <span className={message.includes("✅") ? "text-green-600" : "text-red-600"}>{message}</span>}
          <button
            onClick={() => setNewFaq({ question: "", answer: "", category: "general" })}
            disabled={!!newFaq}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            + Add FAQ
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total FAQs</p>
          <p className="text-2xl font-bold text-gray-900">{faqs.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{faqs.filter(f => f.isActive !== false).length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Inactive</p>
          <p className="text-2xl font-bold text-gray-400">{faqs.filter(f => f.isActive === false).length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Categories</p>
          <p className="text-2xl font-bold text-blue-600">{new Set(faqs.map(f => f.category)).size}</p>
        </div>
      </div>

      {/* New FAQ Form */}
      {newFaq && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">➕ Add New FAQ</h2>
          <FAQForm 
            faq={newFaq} 
            onSave={handleSaveFaq} 
            onCancel={() => setNewFaq(null)} 
          />
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Filter by category:</span>
          <button
            onClick={() => setFilterCategory("all")}
            className={`px-3 py-1 rounded-full text-sm ${
              filterCategory === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All ({faqs.length})
          </button>
          {FAQ_CATEGORIES.map((cat) => {
            const count = faqs.filter(f => f.category === cat.value).length;
            return (
              <button
                key={cat.value}
                onClick={() => setFilterCategory(cat.value)}
                className={`px-3 py-1 rounded-full text-sm ${
                  filterCategory === cat.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat.emoji} {cat.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* FAQs List */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b">
          <h2 className="font-bold text-gray-900">FAQ List</h2>
        </div>

        <div className="divide-y">
          {filteredFaqs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No FAQs found. Click "Add FAQ" to create one.
            </div>
          ) : (
            filteredFaqs.map((faq) => (
              <div key={faq.id} className="p-4">
                {editingFaq && editingFaq.id === faq.id ? (
                  <FAQForm 
                    faq={editingFaq} 
                    onSave={handleSaveFaq} 
                    onCancel={() => setEditingFaq(null)} 
                  />
                ) : (
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {FAQ_CATEGORIES.find(c => c.value === faq.category)?.emoji || "📋"}
                        </span>
                        <h3 className="font-bold text-gray-900">{faq.question}</h3>
                        {faq.isActive === false && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">Hidden</span>
                        )}
                      </div>
                      {faq.questionVi && (
                        <p className="text-sm text-blue-600 mb-1">🇻🇳 {faq.questionVi}</p>
                      )}
                      <p className="text-sm text-gray-600 mt-2">{faq.answer}</p>
                      {faq.answerVi && (
                        <p className="text-sm text-gray-500 mt-1">🇻🇳 {faq.answerVi}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        <span>Order: {faq.sortOrder || 0}</span>
                        <span>•</span>
                        <span className="capitalize">{faq.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(faq)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          faq.isActive !== false
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {faq.isActive !== false ? "✓ Active" : "Hidden"}
                      </button>
                      <button
                        onClick={() => setEditingFaq(faq)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteFaq(faq.id!)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
