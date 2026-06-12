"use client";

import { useState, useRef } from "react";
import { uploadFile, uploadPublicPath } from "@/lib/upload-file";

interface ImageUploaderProps {
  currentImage: string;
  onImageChange: (url: string) => void;
  className?: string;
  label?: string;
  showPreview?: boolean;
  previewHeight?: string;
  accept?: string;
  maxSizeMB?: number;
}

export default function ImageUploader({
  currentImage,
  onImageChange,
  className = "",
  label,
  showPreview = true,
  previewHeight = "h-40",
  accept = "image/*",
  maxSizeMB = 5
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Image must be less than ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);
    try {
      const data = await uploadFile(file);
      const path = uploadPublicPath(data);
      if (path) {
        onImageChange(path);
      } else {
        convertToBase64(file);
      }
    } catch {
      convertToBase64(file);
    } finally {
      setUploading(false);
    }
  };

  const convertToBase64 = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      onImageChange(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onImageChange(urlInput.trim());
      setShowUrlInput(false);
      setUrlInput("");
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}
      
      {/* URL Input + Upload Buttons */}
      <div className="flex gap-2">
        <input
          type="text"
          value={currentImage}
          onChange={(e) => onImageChange(e.target.value)}
          placeholder="https://example.com/image.jpg or upload"
          className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm"
        >
          {uploading ? (
            <>
              <span className="animate-spin">⏳</span> Uploading...
            </>
          ) : (
            <>📤 Upload</>
          )}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Image Preview */}
      {showPreview && currentImage && (
        <div className={`relative ${previewHeight} rounded-lg overflow-hidden border border-gray-200 bg-gray-50`}>
          <img
            src={currentImage}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
            }}
          />
          <button
            type="button"
            onClick={() => onImageChange('')}
            className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
          >
            ✕ Remove
          </button>
        </div>
      )}

      {/* Quick URL input modal */}
      {showUrlInput && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">Enter Image URL</h3>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleUrlSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Apply
              </button>
              <button
                onClick={() => { setShowUrlInput(false); setUrlInput(""); }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for use in cards/lists
export function ImageUploaderCompact({
  currentImage,
  onImageChange,
  className = ""
}: {
  currentImage: string;
  onImageChange: (url: string) => void;
  className?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const data = await uploadFile(file);
      const path = uploadPublicPath(data);
      if (path) {
        onImageChange(path);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          onImageChange(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        onImageChange(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`relative group ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      {/* Hover overlay for image upload */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10 rounded-lg">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-3 py-2 bg-white text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          {uploading ? "⏳ Uploading..." : "📤 Upload Image"}
        </button>
      </div>
    </div>
  );
}
