"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { useUserCenter, buildCenterFilterUrl } from "../../../hooks/useUserCenter";

/**
 * A CourseProgram stores `code`, `price` and `isActive`. This page used code,
 * price and status, none of which the API accepts or returns — so editing a course
 * silently lost its code and its price, and the active/inactive toggle did nothing at all.
 *
 * The Age Group picker's own labels carry the range ("Kids (3-6)"), so they map cleanly onto the
 * entity's ageFrom/ageTo instead of the free-text ageGroup the API was discarding.
 */
interface Course {
  id: string;
  code: string;
  name: string;
  nameVi?: string;
  description?: string;
  durationWeeks: number;
  sessionsPerWeek: number;
  price: number;
  level?: string;
  ageFrom?: number | null;
  ageTo?: number | null;
  isActive?: boolean;
}

export default function CoursesPage() {
  const { centerId: userCenterId, shouldFilterByCenter, loading: userLoading } = useUserCenter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  /** "Kids (3-6)" -> { ageFrom: 3, ageTo: 6 }. "Adults (16+)" has no upper bound. */
  const AGE_GROUPS: Record<string, { ageFrom: number; ageTo: number | null }> = {
    "Kids (3-6)": { ageFrom: 3, ageTo: 6 },
    "Kids (7-10)": { ageFrom: 7, ageTo: 10 },
    "Teens (11-15)": { ageFrom: 11, ageTo: 15 },
    "Adults (16+)": { ageFrom: 16, ageTo: null },
  };

  const ageGroupLabel = (ageFrom?: number | null, ageTo?: number | null) =>
    Object.keys(AGE_GROUPS).find(
      (k) => AGE_GROUPS[k].ageFrom === ageFrom && AGE_GROUPS[k].ageTo === (ageTo ?? null)
    ) ?? "";

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    nameVi: "",
    description: "",
    durationWeeks: 12,
    sessionsPerWeek: 2,
    price: 200000,
    level: "Beginner",
    ageFrom: 3 as number | null,
    ageTo: 6 as number | null,
  });

  useEffect(() => {
    if (!userLoading) {
      fetchCourses();
    }
  }, [userLoading, userCenterId]);

  const fetchCourses = async () => {
    try {
      const url = shouldFilterByCenter 
        ? buildCenterFilterUrl("/api/courses", userCenterId)
        : "/api/courses";
      const data = await apiFetch(url);
      setCourses(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load courses");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editingCourse) {
        const updatedCourse = await apiFetch(`/api/courses/${editingCourse.id}`, {
          method: "PUT",
          body: JSON.stringify(formData)
        });
        setCourses(courses.map(c => c.id === editingCourse.id ? updatedCourse : c));
        setEditingCourse(null);
      } else {
        const newCourse = await apiFetch("/api/courses", {
          method: "POST",
          body: JSON.stringify({
            ...formData,
            isActive: true
          })
        });
        setCourses([...courses, newCourse]);
      }
      setShowAddModal(false);
      setFormData({
        code: "", name: "", nameVi: "", description: "",
        durationWeeks: 12, sessionsPerWeek: 2, price: 200000,
        level: "Beginner", ageFrom: 3, ageTo: 6,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      code: course.code || "",
      name: course.name || "",
      nameVi: course.nameVi || "",
      description: course.description || "",
      durationWeeks: course.durationWeeks || 12,
      sessionsPerWeek: course.sessionsPerWeek || 2,
      price: course.price || 200000,
      level: course.level || "Beginner",
      ageFrom: course.ageFrom ?? null,
      ageTo: course.ageTo ?? null
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    
    try {
      await apiFetch(`/api/courses/${id}`, { method: "DELETE" });
      setCourses(courses.filter(c => c.id !== id));
    } catch (err) {
      console.error("Error deleting course:", err);
    }
  };

  const handleToggleStatus = async (course: Course) => {
    const nextActive = !(course.isActive ?? true);
    if (!confirm(`Change this course to ${nextActive ? "ACTIVE" : "INACTIVE"}?`)) return;
    try {
      await apiFetch(`/api/courses/${course.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...course, isActive: nextActive }),
      });
      fetchCourses();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <span className="text-gray-900">Courses</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">📚 Courses Management</h1>
          <p className="text-gray-500">Manage all courses and curriculum</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          ➕ Add New Course
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">📚</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
              <p className="text-sm text-gray-500">Total Courses</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">✅</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{courses.filter(c => c.isActive !== false).length}</p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search courses..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Course Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
            {courses.length === 0 ? "No courses found. Add your first course!" : "No courses match your search."}
          </div>
        ) : (
          filteredCourses.map((course) => (
            <div key={course.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <span className="px-2 py-1 text-xs font-mono bg-gray-100 rounded">{course.code}</span>
                <button 
                  onClick={() => handleToggleStatus(course)}
                  className={`px-2 py-1 text-xs rounded-full cursor-pointer hover:opacity-80 transition-opacity ${
                  course.isActive !== false ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                }`}
                  title="Click to toggle status"
                >
                  {course.isActive}
                </button>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.name}</h3>
              {course.nameVi && <p className="text-sm text-gray-500 mb-2">{course.nameVi}</p>}
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description || "No description"}</p>
              <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-4">
                <span className="bg-gray-100 px-2 py-1 rounded">📅 {course.durationWeeks} weeks</span>
                <span className="bg-gray-100 px-2 py-1 rounded">🔄 {course.sessionsPerWeek}x/week</span>
                {course.level && <span className="bg-blue-100 px-2 py-1 rounded">{course.level}</span>}
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-lg font-bold text-blue-600">
                  {course.price?.toLocaleString()}đ/session
                </span>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(course)} className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                  <button 
                    onClick={() => handleDelete(course.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">{editingCourse ? "Edit Course" : "Add New Course"}</h2>
              <button onClick={() => { setShowAddModal(false); setEditingCourse(null); }} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Code *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="e.g., ENG101" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Name *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="English for Kids" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vietnamese Name</label>
                <input 
                  type="text" 
                  value={formData.nameVi}
                  onChange={(e) => setFormData({...formData, nameVi: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="Tiếng Anh cho trẻ em" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  rows={3}
                  placeholder="Course description..." 
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (weeks)</label>
                  <input 
                    type="number" 
                    min={1}
                    value={formData.durationWeeks}
                    onChange={(e) => setFormData({...formData, durationWeeks: parseInt(e.target.value) || 1})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sessions/Week</label>
                  <input 
                    type="number" 
                    min={1}
                    value={formData.sessionsPerWeek}
                    onChange={(e) => setFormData({...formData, sessionsPerWeek: parseInt(e.target.value) || 1})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price/Session (VNĐ)</label>
                  <input 
                    type="number" 
                    min={0}
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <select 
                    value={formData.level}
                    onChange={(e) => setFormData({...formData, level: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option>Beginner</option>
                    <option>Elementary</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
                  <select 
                    value={ageGroupLabel(formData.ageFrom, formData.ageTo)}
                    onChange={(e) => setFormData({
                      ...formData,
                      ageFrom: AGE_GROUPS[e.target.value]?.ageFrom ?? null,
                      ageTo: AGE_GROUPS[e.target.value]?.ageTo ?? null,
                    })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option>Kids (3-6)</option>
                    <option>Kids (7-10)</option>
                    <option>Teens (11-15)</option>
                    <option>Adults (16+)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)} 
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Add Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
