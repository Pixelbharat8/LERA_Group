"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../../../../lib/api";
import Link from "next/link";

interface Center {
  id: string;
  name: string;
  nameVi?: string;
  address?: string;
  addressVi?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export default function CentersContentPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [centers, setCenters] = useState<Center[]>([]);
  const [editingCenter, setEditingCenter] = useState<Center | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    try {
      const data = await apiFetch("/api/centers").catch(() => []);
      if (Array.isArray(data)) {
        setCenters(data);
      }
    } catch (error) {
      console.error("Error fetching centers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCenter = async () => {
    if (!editingCenter) return;
    setIsSaving(true);
    try {
      await apiFetch(`/api/centers/${editingCenter.id}`, {
        method: "PUT",
        body: JSON.stringify(editingCenter)
      });
      await fetchCenters();
      setEditingCenter(null);
      alert("Center saved successfully!");
    } catch (error) {
      console.error("Error saving center:", error);
      alert("Error saving center. Please try again.");
    } finally {
      setIsSaving(false);
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
                <h1 className="text-xl font-bold text-gray-900">Centers</h1>
                <p className="text-sm text-gray-500">Manage center locations displayed on website</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a href="/centers" target="_blank" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                👁️ Preview
              </a>
              <Link
                href="/dashboard/chairman/centers"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                + Add New Center
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Centers List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {centers.map((center) => (
            <div
              key={center.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
                <h3 className="text-xl font-bold">{center.name}</h3>
                {center.nameVi && <p className="text-green-100 text-sm">{center.nameVi}</p>}
              </div>
              <div className="p-6">
                <div className="space-y-3 text-sm text-gray-600 mb-4">
                  {center.address && (
                    <div className="flex items-start gap-2">
                      <span>📍</span>
                      <span>{center.address}</span>
                    </div>
                  )}
                  {center.phone && (
                    <div className="flex items-center gap-2">
                      <span>📞</span>
                      <span>{center.phone}</span>
                    </div>
                  )}
                  {center.email && (
                    <div className="flex items-center gap-2">
                      <span>✉️</span>
                      <span>{center.email}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <span>Status:</span>
                    <span className={`font-medium ${center.isActive ? "text-green-600" : "text-red-600"}`}>
                      {center.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setEditingCenter(center)}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  ✏️ Edit Content
                </button>
              </div>
            </div>
          ))}
        </div>

        {centers.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="text-5xl mb-4">📍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Centers Found</h3>
            <p className="text-gray-500 mb-4">Add centers from the Centers Management page</p>
            <Link
              href="/dashboard/chairman/centers"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
            >
              Go to Centers Management
            </Link>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingCenter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Edit Center Content</h2>
                <button onClick={() => setEditingCenter(null)} className="text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name (English)</label>
                <input
                  type="text"
                  value={editingCenter.name}
                  onChange={(e) => setEditingCenter({ ...editingCenter, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name (Vietnamese)</label>
                <input
                  type="text"
                  value={editingCenter.nameVi || ""}
                  onChange={(e) => setEditingCenter({ ...editingCenter, nameVi: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address (English)</label>
                <textarea
                  value={editingCenter.address || ""}
                  onChange={(e) => setEditingCenter({ ...editingCenter, address: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address (Vietnamese)</label>
                <textarea
                  value={editingCenter.addressVi || ""}
                  onChange={(e) => setEditingCenter({ ...editingCenter, addressVi: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editingCenter.phone || ""}
                    onChange={(e) => setEditingCenter({ ...editingCenter, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingCenter.email || ""}
                    onChange={(e) => setEditingCenter({ ...editingCenter, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setEditingCenter(null)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCenter}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
