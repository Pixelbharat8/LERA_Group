"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../../../lib/api";

export default function ChairmanCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [newCourse, setNewCourse] = useState({
    name: "",
    nameVi: "",
    code: "",
    description: "",
    descriptionVi: "",
    category: "kids",
    level: "beginner",
    ageFrom: 4,
    ageTo: 18,
    price: 0,
    isActive: true,
    isFeatured: false,
  });

  const categories = ["kids", "teens", "adults", "business", "ielts", "toeic", "general"];
  const levels = ["beginner", "elementary", "pre-intermediate", "intermediate", "upper-intermediate", "advanced"];

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/courses");
      setCourses(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreate = async () => {
    try {
      await apiFetch("/api/courses", {
        method: "POST",
        body: JSON.stringify(newCourse),
      });
      alert("Course created successfully!");
      setShowAddModal(false);
      setNewCourse({
        name: "", nameVi: "", code: "", description: "", descriptionVi: "",
        category: "kids", level: "beginner", ageFrom: 4, ageTo: 18, price: 0, isActive: true, isFeatured: false,
      });
      fetchCourses();
    } catch (error) {
      console.error("Error creating course:", error);
      alert("Failed to create course");
    }
  };

  const handleUpdate = async () => {
    if (!editingCourse) return;
    try {
      await apiFetch(`/api/courses/${editingCourse.id}`, {
        method: "PUT",
        body: JSON.stringify(editingCourse),
      });
      alert("Course updated successfully!");
      setShowEditModal(false);
      fetchCourses();
    } catch (error) {
      console.error("Error updating course:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      await apiFetch(`/api/courses/${id}`, { method: "DELETE" });
      alert("Course deleted!");
      fetchCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
    }
  };

  const handleToggleFeatured = async (course: any) => {
    try {
      await apiFetch(`/api/courses/${course.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...course, isFeatured: !course.isFeatured }),
      });
      fetchCourses();
    } catch (error) {
      console.error("Error toggling featured:", error);
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || course.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      kids: "from-pink-400 to-pink-600",
      teens: "from-purple-400 to-purple-600",
      adults: "from-blue-400 to-blue-600",
      business: "from-green-400 to-green-600",
      ielts: "from-red-400 to-red-600",
      toeic: "from-orange-400 to-orange-600",
      general: "from-gray-400 to-gray-600",
    };
    return colors[category] || "from-gray-400 to-gray-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">📚 Courses Management</h1>
          <p className="text-gray-600">Manage all courses and programs</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          ➕ Add New Course
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Total Courses</p>
          <p className="text-2xl font-bold text-blue-600">{courses.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Active</p>
          <p className="text-2xl font-bold text-green-600">{courses.filter(c => c.isActive).length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Featured</p>
          <p className="text-2xl font-bold text-purple-600">{courses.filter(c => c.isFeatured).length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Kids</p>
          <p className="text-2xl font-bold text-pink-600">{courses.filter(c => c.category === "kids").length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Adults</p>
          <p className="text-2xl font-bold text-blue-600">{courses.filter(c => c.category === "adults").length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div key={course.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className={`h-3 bg-gradient-to-r ${getCategoryColor(course.category)}`}></div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg">{course.name}</h3>
                  <p className="text-sm text-gray-500">{course.code}</p>
                </div>
                <div className="flex gap-1">
                  {course.isFeatured && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">⭐ Featured</span>
                  )}
                  <span className={`px-2 py-1 rounded text-xs ${
                    course.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {course.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {course.description || "No description"}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs capitalize">{course.category}</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs capitalize">{course.level}</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                  Ages {course.ageFrom || "?"}-{course.ageTo || "?"}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleFeatured(course)}
                  className={`flex-1 px-3 py-2 rounded text-sm ${
                    course.isFeatured ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {course.isFeatured ? "⭐ Featured" : "☆ Feature"}
                </button>
                <button
                  onClick={() => { setEditingCourse(course); setShowEditModal(true); }}
                  className="flex-1 bg-blue-100 text-blue-600 px-3 py-2 rounded"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(course.id)}
                  className="px-3 py-2 bg-red-100 text-red-600 rounded"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">➕ Add New Course</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Name (English)</label>
                <input
                  type="text"
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Enter course name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Name (Vietnamese)</label>
                <input
                  type="text"
                  value={newCourse.nameVi}
                  onChange={(e) => setNewCourse({ ...newCourse, nameVi: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
                <input
                  type="text"
                  value={newCourse.code}
                  onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="e.g., IELTS-001"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newCourse.category}
                    onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <select
                    value={newCourse.level}
                    onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    {levels.map((level) => (
                      <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age From</label>
                  <input
                    type="number"
                    value={newCourse.ageFrom}
                    onChange={(e) => setNewCourse({ ...newCourse, ageFrom: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age To</label>
                  <input
                    type="number"
                    value={newCourse.ageTo}
                    onChange={(e) => setNewCourse({ ...newCourse, ageTo: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newCourse.isActive}
                    onChange={(e) => setNewCourse({ ...newCourse, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Active</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newCourse.isFeatured}
                    onChange={(e) => setNewCourse({ ...newCourse, isFeatured: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Featured</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">✏️ Edit Course</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                <input
                  type="text"
                  value={editingCourse.name || ""}
                  onChange={(e) => setEditingCourse({ ...editingCourse, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
                <input
                  type="text"
                  value={editingCourse.code || ""}
                  onChange={(e) => setEditingCourse({ ...editingCourse, code: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={editingCourse.category || "general"}
                    onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <select
                    value={editingCourse.level || "beginner"}
                    onChange={(e) => setEditingCourse({ ...editingCourse, level: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    {levels.map((level) => (
                      <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingCourse.description || ""}
                  onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingCourse.isActive}
                    onChange={(e) => setEditingCourse({ ...editingCourse, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Active</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingCourse.isFeatured}
                    onChange={(e) => setEditingCourse({ ...editingCourse, isFeatured: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Featured</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleUpdate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
