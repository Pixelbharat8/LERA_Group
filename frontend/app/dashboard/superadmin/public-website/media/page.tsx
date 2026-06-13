"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";

interface MediaItem {
  id: string;
  name: string;
  fileUrl: string;
  url?: string; // alias for fileUrl
  thumbnailUrl?: string;
  mediaType: "image" | "video" | "document";
  type?: string;
  size?: string;
  fileSizeFormatted: string;
  uploadedAt: string;
  usedIn: string | string[];
  category?: string;
  altText?: string;
  isPublic?: boolean;
}

export default function MediaManager() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<"all" | "image" | "video" | "document">("all");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newMedia, setNewMedia] = useState({
    name: "",
    fileUrl: "",
    mediaType: "image" as "image" | "video" | "document",
    fileSizeFormatted: "",
    category: "",
    altText: "",
    usedIn: "",
  });

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const data = await apiFetch("/api/media");
      if (Array.isArray(data)) {
        setMedia(data);
      }
    } catch (error) {
      console.error("Error fetching media:", error);
      // Fallback to empty on error
      setMedia([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      const created = await apiFetch("/api/media", {
        method: "POST",
        body: JSON.stringify({
          ...newMedia,
          isPublic: true,
        }),
      });
      setMedia([created, ...media]);
      setShowUploadModal(false);
      setNewMedia({ name: "", fileUrl: "", mediaType: "image", fileSizeFormatted: "", category: "", altText: "", usedIn: "" });
    } catch (error) {
      console.error("Error adding media:", error);
      alert("Failed to add media");
    }
  };

  const filteredMedia = filter === "all" ? media : media.filter(m => m.mediaType === filter);

  const handleDelete = async (ids: string[]) => {
    if (confirm(`Are you sure you want to delete ${ids.length} item(s)?`)) {
      try {
        await apiFetch("/api/media/batch", {
          method: "DELETE",
          body: JSON.stringify(ids),
        });
        setMedia(media.filter(m => !ids.includes(m.id)));
        setSelectedItems([]);
      } catch (error) {
        console.error("Error deleting media:", error);
      }
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Copy URL to clipboard
  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      alert("URL copied to clipboard!");
    } catch (error) {
      console.error("Error copying URL:", error);
      alert("Failed to copy URL");
    }
  };

  // Download media file
  const handleDownload = async (item: MediaItem) => {
    try {
      const url = item.fileUrl || item.url;
      if (!url) {
        alert("No file URL available");
        return;
      }
      
      // Create a temporary link and trigger download
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = item.name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
      // Fallback: open in new tab
      window.open(item.fileUrl || item.url, '_blank');
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
            <span>Public Website</span>
            <span>/</span>
            <span className="text-gray-900">Media Library</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">🖼 Media Library</h1>
          <p className="text-gray-500">Manage images, videos, and documents</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedItems.length > 0 && (
            <button
              onClick={() => handleDelete(selectedItems)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              🗑 Delete ({selectedItems.length})
            </button>
          )}
          <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer flex items-center gap-2">
            ⬆️ Upload Files
            <input type="file" multiple className="hidden" accept="image/*,video/*,.pdf,.doc,.docx" />
          </label>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex gap-2">
            {(["all", "image", "video", "document"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1) + "s"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <input 
              type="text" 
              placeholder="Search files..."
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <div className="flex border rounded-lg overflow-hidden">
              <button 
                onClick={() => setViewMode("grid")}
                className={`px-3 py-2 ${viewMode === "grid" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
              >
                ⊞
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={`px-3 py-2 ${viewMode === "list" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
              >
                ☰
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Drop Zone */}
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer bg-gray-50">
        <div className="text-4xl mb-2">📤</div>
        <p className="text-gray-600 font-medium">Drag and drop files here</p>
        <p className="text-sm text-gray-400">or click to browse</p>
      </div>

      {/* Media Grid */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredMedia.map((item) => (
            <div 
              key={item.id}
              className={`relative group bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer transition-all ${
                selectedItems.includes(item.id) ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => toggleSelect(item.id)}
            >
              <div className="aspect-square relative">
                <img 
                  src={item.url || item.fileUrl} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute inset-0 bg-black/50 transition-opacity ${
                  selectedItems.includes(item.id) ? "opacity-50" : "opacity-0 group-hover:opacity-30"
                }`} />
                {selectedItems.includes(item.id) && (
                  <div className="absolute top-2 left-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                    ✓
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-medium truncate">{item.name}</p>
                <p className="text-xs text-gray-400">{item.size}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  <input 
                    type="checkbox" 
                    onChange={(e) => setSelectedItems(e.target.checked ? media.map(m => m.id) : [])}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Preview</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Size</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Used In</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Uploaded</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredMedia.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input 
                      type="checkbox" 
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <img src={item.url || item.fileUrl} alt={item.name} className="w-12 h-12 object-cover rounded" />
                  </td>
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">{item.type || item.mediaType}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{item.size || item.fileSizeFormatted}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(item.usedIn) ? item.usedIn : [item.usedIn]).map((place, i) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{place}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{item.uploadedAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleCopyUrl(item.fileUrl || item.url || '')}
                        className="p-1 hover:bg-gray-100 rounded" 
                        title="Copy URL"
                      >
                        📋
                      </button>
                      <button 
                        onClick={() => handleDownload(item)}
                        className="p-1 hover:bg-gray-100 rounded" 
                        title="Download"
                      >
                        ⬇️
                      </button>
                      <button 
                        onClick={() => handleDelete([item.id])}
                        className="p-1 hover:bg-red-50 text-red-500 rounded" 
                        title="Delete"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Storage Info */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">💾 Storage Usage</h3>
          <span className="text-sm text-gray-500">2.8 GB / 10 GB</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-blue-600 h-3 rounded-full" style={{ width: "28%" }}></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">28% of storage used</p>
      </div>
    </div>
  );
}
