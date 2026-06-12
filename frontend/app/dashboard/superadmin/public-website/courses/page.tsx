"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";
import { uploadFile, uploadPublicPath } from "../../../../../lib/upload-file";

// Image upload component
const ImageUploader = ({ 
  currentImage, 
  onImageChange, 
  courseId 
}: { 
  currentImage: string; 
  onImageChange: (url: string) => void;
  courseId: string;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
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
    } catch (error) {
      // Fallback: Convert to base64 for local preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        onImageChange(base64);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onImageChange(urlInput.trim());
      setShowUrlInput(false);
      setUrlInput("");
    }
  };

  return (
    <div className="relative group">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      {/* Upload overlay on hover */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-3 py-2 bg-white text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center gap-1"
        >
          {uploading ? (
            <>
              <span className="animate-spin">⏳</span> Uploading...
            </>
          ) : (
            <>📤 Upload</>
          )}
        </button>
        <button
          onClick={() => setShowUrlInput(true)}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          🔗 URL
        </button>
      </div>

      {/* URL input modal */}
      {showUrlInput && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20 p-2">
          <div className="bg-white rounded-lg p-3 w-full max-w-xs">
            <label className="block text-xs font-medium text-gray-700 mb-1">Image URL</label>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://..."
              className="w-full px-2 py-1 text-sm border rounded mb-2 focus:ring-2 focus:ring-blue-500 outline-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleUrlSubmit}
                className="flex-1 px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Apply
              </button>
              <button
                onClick={() => { setShowUrlInput(false); setUrlInput(""); }}
                className="flex-1 px-2 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface Course {
  id: string;
  code?: string;
  name?: string;
  nameVi?: string;
  titleEN: string;
  titleVI: string;
  description?: string;
  descriptionVi?: string;
  descriptionEN: string;
  descriptionVI: string;
  ageFrom?: number;
  ageTo?: number;
  ageRange: string;
  imageUrl?: string;
  image: string;
  color: string;
  category: "kids" | "teens" | "adults";
  isFeatured?: boolean;
  isActive?: boolean;
  featured: boolean;
  enabled: boolean;
  price: number;
  duration: string;
  displayOrder?: number;
}

const initialCourses: Course[] = [
  {
    id: "lera-starters",
    titleEN: "LERA Starters",
    titleVI: "LERA Starters",
    descriptionEN: "Fun and interactive English for toddlers",
    descriptionVI: "Tiếng Anh vui nhộn và tương tác cho trẻ nhỏ",
    ageRange: "2.5-4",
    image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop",
    color: "#ec4899",
    category: "kids",
    featured: true,
    enabled: true,
    price: 2500000,
    duration: "3 months",
  },
  {
    id: "lera-explorers",
    titleEN: "LERA Explorers",
    titleVI: "LERA Explorers",
    descriptionEN: "Building confidence through exploration",
    descriptionVI: "Xây dựng sự tự tin thông qua khám phá",
    ageRange: "5-6",
    image: "https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=400&h=300&fit=crop",
    color: "#3b82f6",
    category: "kids",
    featured: true,
    enabled: true,
    price: 2800000,
    duration: "3 months",
  },
  {
    id: "lera-primary",
    titleEN: "LERA Primary",
    titleVI: "LERA Primary",
    descriptionEN: "Strong foundation for primary school students",
    descriptionVI: "Nền tảng vững chắc cho học sinh tiểu học",
    ageRange: "7-10",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=300&fit=crop",
    color: "#22c55e",
    category: "kids",
    featured: true,
    enabled: true,
    price: 3000000,
    duration: "3 months",
  },
  {
    id: "lera-teens",
    titleEN: "LERA Teens",
    titleVI: "LERA Teens",
    descriptionEN: "Academic English for teenagers",
    descriptionVI: "Tiếng Anh học thuật cho thiếu niên",
    ageRange: "11-14",
    image: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400&h=300&fit=crop",
    color: "#a855f7",
    category: "teens",
    featured: true,
    enabled: true,
    price: 3500000,
    duration: "3 months",
  },
  {
    id: "ielts-sat",
    titleEN: "IELTS & SAT",
    titleVI: "IELTS & SAT",
    descriptionEN: "Test preparation for higher education",
    descriptionVI: "Luyện thi cho giáo dục đại học",
    ageRange: "15+",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop",
    color: "#4f46e5",
    category: "adults",
    featured: true,
    enabled: true,
    price: 5000000,
    duration: "4 months",
  },
  {
    id: "business-english",
    titleEN: "Business English",
    titleVI: "Tiếng Anh Thương Mại",
    descriptionEN: "Professional English for the workplace",
    descriptionVI: "Tiếng Anh chuyên nghiệp cho môi trường làm việc",
    ageRange: "18+",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop",
    color: "#7c3aed",
    category: "adults",
    featured: false,
    enabled: true,
    price: 6000000,
    duration: "3 months",
  },
];

export default function CoursesEditor() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "kids" | "teens" | "adults">("all");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await apiFetch("/api/courses");
      // Map backend data to frontend format
      const mappedCourses = data.map((c: any) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        nameVi: c.nameVi,
        titleEN: c.name || "",
        titleVI: c.nameVi || c.name || "",
        description: c.description,
        descriptionVi: c.descriptionVi,
        descriptionEN: c.description || "",
        descriptionVI: c.descriptionVi || c.description || "",
        ageFrom: c.ageFrom,
        ageTo: c.ageTo,
        ageRange: c.ageFrom && c.ageTo ? `${c.ageFrom}-${c.ageTo}` : "All ages",
        imageUrl: c.imageUrl,
        image: c.imageUrl || "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop",
        color: c.color || "#3b82f6",
        category: c.category || "kids",
        isFeatured: c.isFeatured,
        isActive: c.isActive,
        featured: c.isFeatured || false,
        enabled: c.isActive !== false,
        price: c.price || 0,
        duration: c.duration || "3 months",
        displayOrder: c.displayOrder
      }));
      setCourses(mappedCourses);
    } catch (err: any) {
      console.error("Error fetching courses:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = filter === "all" ? courses : courses.filter(c => c.category === filter);

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    try {
      // Save each course to the backend
      for (const course of courses) {
        const payload = {
          name: course.titleEN || course.name,
          nameVi: course.titleVI || course.nameVi,
          description: course.descriptionEN || course.description,
          descriptionVi: course.descriptionVI || course.descriptionVi,
          ageFrom: course.ageFrom || parseInt(course.ageRange?.split("-")[0]) || null,
          ageTo: course.ageTo || parseInt(course.ageRange?.split("-")[1]) || null,
          imageUrl: course.image || course.imageUrl,
          color: course.color,
          category: course.category,
          isFeatured: course.featured,
          isActive: course.enabled,
          price: course.price,
          displayOrder: course.displayOrder
        };
        
        await apiFetch(`/api/courses/${course.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      }
      alert("✅ Courses saved successfully!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCourse = async () => {
    const newCourse = {
      code: `course-${Date.now()}`,
      name: "New Course",
      nameVi: "Khóa Học Mới",
      description: "Course description",
      descriptionVi: "Mô tả khóa học",
      ageFrom: 5,
      ageTo: 10,
      imageUrl: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop",
      color: "#3b82f6",
      category: "kids",
      isFeatured: false,
      isActive: true,
      price: 2500000,
      displayOrder: courses.length
    };
    
    try {
      await apiFetch("/api/courses", {
        method: "POST",
        body: JSON.stringify(newCourse)
      });
      await fetchCourses();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdate = (id: string, field: string, value: any) => {
    setCourses(courses.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this course?")) {
      try {
        await apiFetch(`/api/courses/${id}`, {
          method: "DELETE"
        });
        setCourses(courses.filter(c => c.id !== id));
      } catch (err: any) {
        setError(err.message);
      }
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
            <span className="text-gray-900">Courses</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">📖 Courses Editor</h1>
          <p className="text-gray-500">Manage courses displayed on the public website</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleAddCourse}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            ➕ Add Course
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

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex gap-2">
          {(["all", "kids", "teens", "adults"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f === "all" ? "All Courses" : f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="ml-2 text-xs opacity-70">
                ({f === "all" ? courses.length : courses.filter(c => c.category === f).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div 
            key={course.id}
            className={`bg-white rounded-xl shadow-sm overflow-hidden border-2 transition-all ${
              course.enabled ? "border-transparent" : "border-gray-200 opacity-60"
            }`}
          >
            {/* Course Image with Upload */}
            <div className="relative h-40">
              <img 
                src={course.image}
                alt={course.titleEN}
                className="w-full h-full object-cover"
              />
              <div 
                className="absolute inset-0 opacity-40"
                style={{ backgroundColor: course.color }}
              />
              
              {/* Image Upload Overlay */}
              <ImageUploader
                currentImage={course.image}
                courseId={course.id}
                onImageChange={(url) => handleUpdate(course.id, "image", url)}
              />
              
              <div className="absolute top-2 right-2 flex gap-1 z-5">
                {course.featured && (
                  <span className="px-2 py-1 bg-yellow-400 text-xs font-bold rounded">⭐ Featured</span>
                )}
                {!course.enabled && (
                  <span className="px-2 py-1 bg-gray-600 text-white text-xs font-bold rounded">Hidden</span>
                )}
              </div>
              <div className="absolute bottom-2 left-2 z-5">
                <span className="px-3 py-1 bg-white/90 backdrop-blur text-xs font-bold rounded-full">
                  Ages {course.ageRange}
                </span>
              </div>
            </div>

            {/* Course Content */}
            <div className="p-4 space-y-3">
              {/* Image URL Input */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">📷 Image URL (hover image to upload)</label>
                <input
                  type="text"
                  value={course.image}
                  onChange={(e) => handleUpdate(course.id, "image", e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Title (EN)</label>
                  <input
                    type="text"
                    value={course.titleEN}
                    onChange={(e) => handleUpdate(course.id, "titleEN", e.target.value)}
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Title (VI)</label>
                  <input
                    type="text"
                    value={course.titleVI}
                    onChange={(e) => handleUpdate(course.id, "titleVI", e.target.value)}
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Description (EN)</label>
                <textarea
                  value={course.descriptionEN}
                  onChange={(e) => handleUpdate(course.id, "descriptionEN", e.target.value)}
                  rows={2}
                  className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Age Range</label>
                  <input
                    type="text"
                    value={course.ageRange}
                    onChange={(e) => handleUpdate(course.id, "ageRange", e.target.value)}
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Price (VND)</label>
                  <input
                    type="number"
                    value={course.price}
                    onChange={(e) => handleUpdate(course.id, "price", parseInt(e.target.value))}
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Color</label>
                  <input
                    type="color"
                    value={course.color}
                    onChange={(e) => handleUpdate(course.id, "color", e.target.value)}
                    className="w-full h-8 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={course.enabled}
                      onChange={(e) => handleUpdate(course.id, "enabled", e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    Visible
                  </label>
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={course.featured}
                      onChange={(e) => handleUpdate(course.id, "featured", e.target.checked)}
                      className="w-4 h-4 text-yellow-500 rounded"
                    />
                    Featured
                  </label>
                </div>
                <button 
                  onClick={() => handleDelete(course.id)}
                  className="text-red-500 hover:text-red-600 text-sm"
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
