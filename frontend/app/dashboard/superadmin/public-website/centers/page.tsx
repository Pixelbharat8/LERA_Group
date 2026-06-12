"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";

interface Center {
  id: string;
  name: string;
  nameVi?: string;
  code?: string;
  address: string;
  phone?: string;
  email?: string;
  imageUrl?: string;
  mapUrl?: string;
  workingHours?: string;
  isActive: boolean;
  isPublic?: boolean;
  description?: string;
  descriptionVi?: string;
}

export default function CentersPageEditor() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editingCenter, setEditingCenter] = useState<Center | null>(null);

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    try {
      const data = await apiFetch("/api/centers");
      if (Array.isArray(data)) {
        setCenters(data);
      }
    } catch (err) {
      console.log("Error fetching centers");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublic = async (center: Center) => {
    try {
      await apiFetch(`/api/centers/${center.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...center,
          isPublic: !center.isPublic,
        }),
      });
      setCenters(centers.map(c => 
        c.id === center.id ? { ...c, isPublic: !c.isPublic } : c
      ));
      setMessage("✅ Center visibility updated!");
    } catch (err: any) {
      setMessage("❌ Error: " + err.message);
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const handleSaveCenter = async () => {
    if (!editingCenter) return;
    setSaving(true);
    try {
      await apiFetch(`/api/centers/${editingCenter.id}`, {
        method: "PUT",
        body: JSON.stringify(editingCenter),
      });
      setCenters(centers.map(c => 
        c.id === editingCenter.id ? editingCenter : c
      ));
      setEditingCenter(null);
      setMessage("✅ Center updated successfully!");
    } catch (err: any) {
      setMessage("❌ Error: " + err.message);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
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
            <Link href="/dashboard/superadmin" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/superadmin/public-website" className="hover:text-blue-600">Public Website</Link>
            <span>/</span>
            <span className="text-gray-900">Centers Page</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">🏢 Centers Page Editor</h1>
          <p className="text-gray-500">Manage which centers appear on the public website</p>
        </div>
        <div className="flex items-center gap-3">
          {message && <span className={message.includes("✅") ? "text-green-600" : "text-red-600"}>{message}</span>}
          <Link href="/centers" target="_blank" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            👁 Preview Public Page
          </Link>
        </div>
      </div>

      {/* Centers List */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b">
          <h2 className="font-bold text-gray-900">All Centers</h2>
          <p className="text-sm text-gray-500">Toggle visibility and edit public information for each center</p>
        </div>

        <div className="divide-y">
          {centers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No centers found. Add centers from the Organization → Centers page.
            </div>
          ) : (
            centers.map((center) => (
              <div key={center.id} className="p-4">
                {editingCenter?.id === center.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name (English)</label>
                        <input
                          type="text"
                          value={editingCenter.name}
                          onChange={(e) => setEditingCenter({ ...editingCenter, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name (Vietnamese)</label>
                        <input
                          type="text"
                          value={editingCenter.nameVi || ""}
                          onChange={(e) => setEditingCenter({ ...editingCenter, nameVi: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <input
                          type="text"
                          value={editingCenter.address}
                          onChange={(e) => setEditingCenter({ ...editingCenter, address: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="text"
                          value={editingCenter.phone || ""}
                          onChange={(e) => setEditingCenter({ ...editingCenter, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={editingCenter.email || ""}
                          onChange={(e) => setEditingCenter({ ...editingCenter, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Working Hours</label>
                        <input
                          type="text"
                          value={editingCenter.workingHours || ""}
                          onChange={(e) => setEditingCenter({ ...editingCenter, workingHours: e.target.value })}
                          placeholder="8:00 AM - 9:00 PM"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                        <input
                          type="url"
                          value={editingCenter.imageUrl || ""}
                          onChange={(e) => setEditingCenter({ ...editingCenter, imageUrl: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps Embed URL</label>
                        <input
                          type="url"
                          value={editingCenter.mapUrl || ""}
                          onChange={(e) => setEditingCenter({ ...editingCenter, mapUrl: e.target.value })}
                          placeholder="https://www.google.com/maps/embed?pb=..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (English)</label>
                        <textarea
                          value={editingCenter.description || ""}
                          onChange={(e) => setEditingCenter({ ...editingCenter, description: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Vietnamese)</label>
                        <textarea
                          value={editingCenter.descriptionVi || ""}
                          onChange={(e) => setEditingCenter({ ...editingCenter, descriptionVi: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveCenter}
                        disabled={saving}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {saving ? "⏳ Saving..." : "✓ Save Changes"}
                      </button>
                      <button
                        onClick={() => setEditingCenter(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {center.imageUrl ? (
                        <img src={center.imageUrl} alt={center.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">🏢</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">{center.name}</h3>
                        {center.code && <span className="text-xs bg-gray-100 px-2 py-1 rounded">{center.code}</span>}
                        {center.isPublic && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Public</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">📍 {center.address}</p>
                      <div className="flex gap-4 text-sm text-gray-500 mt-1">
                        {center.phone && <span>📞 {center.phone}</span>}
                        {center.email && <span>✉️ {center.email}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePublic(center)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          center.isPublic
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {center.isPublic ? "✓ Visible" : "Hidden"}
                      </button>
                      <button
                        onClick={() => setEditingCenter(center)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4">📱 Public Page Preview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {centers.filter(c => c.isPublic).map((center) => (
            <div key={center.id} className="border rounded-lg overflow-hidden">
              <div className="h-32 bg-gray-200">
                {center.imageUrl ? (
                  <img src={center.imageUrl} alt={center.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">🏢</div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold">{center.name}</h3>
                <p className="text-sm text-gray-600">{center.address}</p>
              </div>
            </div>
          ))}
          {centers.filter(c => c.isPublic).length === 0 && (
            <p className="text-gray-500 col-span-full text-center py-4">
              No centers are visible on the public website. Toggle visibility above.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
