"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../../../../lib/api";
import Link from "next/link";

interface Course {
  id: string;
  code: string;
  name: string;
  nameVi?: string;
  description?: string;
  descriptionVi?: string;
  ageFrom?: number;
  ageTo?: number;
  durationWeeks?: number;
  sessionsPerWeek?: number;
  isActive?: boolean;
}

export default function CoursesContentPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await apiFetch("/api/courses").catch(() => []);
      if (Array.isArray(data)) {
        setCourses(data);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCourse = async () => {
    if (!editingCourse) return;
    setIsSaving(true);
    try {
      await apiFetch(`/api/courses/${editingCourse.id}`, {
        method: "PUT",
        body: JSON.stringify(editingCourse)
      });
      await fetchCourses();
      setEditingCourse(null);
      alert("Course saved successfully!");
    } catch (error) {
      console.error("Error saving course:", error);
      alert("Error saving course. Please try again.");
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
                <h1 className="text-xl font-bold text-gray-900">Courses</h1>
                <p className="text-sm text-gray-500">Manage course content displayed on website</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a href="/courses" target="_blank" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                👁️ Preview
              </a>
              <Link
                href="/dashboard/chairman/courses"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                + Add New Course
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Courses List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                <h3 className="text-xl font-bold">{course.name}</h3>
                <p className="text-blue-100 text-sm">{course.code}</p>
              </div>
              <div className="p-6">
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex justify-between">
                    <span>Age Range:</span>
                    <span className="font-medium">{course.ageFrom || "?"} - {course.ageTo || "?"} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-medium">{course.durationWeeks || "-"} weeks</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sessions/Week:</span>
                    <span className="font-medium">{course.sessionsPerWeek || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`font-medium ${course.isActive ? "text-green-600" : "text-red-600"}`}>
                      {course.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setEditingCourse(course)}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  ✏️ Edit Content
                </button>
              </div>
            </div>
          ))}
        </div>

        {courses.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="text-5xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Courses Found</h3>
            <p className="text-gray-500 mb-4">Add courses from the Courses Management page</p>
            <Link
              href="/dashboard/chairman/courses"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
            >
              Go to Courses Management
            </Link>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Edit Course Content</h2>
                <button onClick={() => setEditingCourse(null)} className="text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name (English)</label>
                <input
                  type="text"
                  value={editingCourse.name}
                  onChange={(e) => setEditingCourse({ ...editingCourse, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name (Vietnamese)</label>
                <input
                  type="text"
                  value={editingCourse.nameVi || ""}
                  onChange={(e) => setEditingCourse({ ...editingCourse, nameVi: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (English)</label>
                <textarea
                  value={editingCourse.description || ""}
                  onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Vietnamese)</label>
                <textarea
                  value={editingCourse.descriptionVi || ""}
                  onChange={(e) => setEditingCourse({ ...editingCourse, descriptionVi: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age From</label>
                  <input
                    type="number"
                    value={editingCourse.ageFrom || ""}
                    onChange={(e) => setEditingCourse({ ...editingCourse, ageFrom: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age To</label>
                  <input
                    type="number"
                    value={editingCourse.ageTo || ""}
                    onChange={(e) => setEditingCourse({ ...editingCourse, ageTo: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setEditingCourse(null)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCourse}
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
