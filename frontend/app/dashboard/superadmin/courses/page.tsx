"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../../../lib/api";

interface Course {
  id: string;
  name: string;
  code: string;
  description: string;
  level: string;
  duration: number;
  fee: number;
  status: string;
}

export default function SuperAdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [newCourse, setNewCourse] = useState({
    name: "",
    code: "",
    description: "",
    level: "BEGINNER",
    duration: 0,
    fee: 0,
    status: "ACTIVE"
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await apiFetch("/api/courses");
      setCourses(Array.isArray(data) ? data : data?.content || []);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await apiFetch("/api/courses", {
        method: "POST",
        body: JSON.stringify(newCourse),
      });
      alert("Course created successfully!");
      setShowAddModal(false);
      setNewCourse({ name: "", code: "", description: "", level: "BEGINNER", duration: 0, fee: 0, status: "ACTIVE" });
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
      alert("Failed to update course");
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
      alert("Failed to delete course");
    }
  };

  const handleToggleStatus = async (course: Course) => {
    const newStatus = course.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    if (!confirm(`Change status from ${course.status} to ${newStatus}?`)) return;
    try {
      await apiFetch(`/api/courses/${course.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...course, status: newStatus }),
      });
      fetchCourses();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const filteredCourses = courses.filter((course) =>
    course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code?.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📚 All Courses</h1>
          <p className="text-gray-500">Manage courses and curriculum</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          ➕ Add Course
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-3xl font-bold text-blue-600">{courses.length}</div>
          <div className="text-gray-500 text-sm">Total Courses</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-3xl font-bold text-green-600">
            {courses.filter((c) => c.status === "ACTIVE").length}
          </div>
          <div className="text-gray-500 text-sm">Active</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-3xl font-bold text-purple-600">
            {new Set(courses.map((c) => c.level)).size}
          </div>
          <div className="text-gray-500 text-sm">Levels</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-3xl font-bold text-orange-600">
            {courses.reduce((sum, c) => sum + (c.duration || 0), 0)}h
          </div>
          <div className="text-gray-500 text-sm">Total Duration</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <input
          type="text"
          placeholder="🔍 Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCourses.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-xl text-center text-gray-500">
            No courses found. Create your first course to get started.
          </div>
        ) : (
          filteredCourses.map((course) => (
            <div key={course.id} className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{course.code}</span>
                <button
                  onClick={() => handleToggleStatus(course)}
                  className={`px-2 py-1 rounded-full text-xs cursor-pointer hover:opacity-80 ${
                  course.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                }`}>
                  {course.status}
                </button>
              </div>
              <h3 className="font-semibold text-lg mb-2">{course.name}</h3>
              <p className="text-gray-500 text-sm mb-4 line-clamp-2">{course.description || "No description"}</p>
              <div className="flex justify-between text-sm text-gray-600">
                <span>📊 {course.level || "All Levels"}</span>
                <span>⏱️ {course.duration || 0}h</span>
                <span>💰 {(course.fee || 0).toLocaleString()} VND</span>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => { setEditingCourse(course); setShowEditModal(true); }} className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100">
                  Edit
                </button>
                <button onClick={() => handleDelete(course.id)} className="flex-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Add New Course</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Course Name"
                value={newCourse.name}
                onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Course Code (e.g., ENG101)"
                value={newCourse.code}
                onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <textarea
                placeholder="Description"
                value={newCourse.description}
                onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows={3}
              />
              <select
                value={newCourse.level}
                onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="BEGINNER">Beginner</option>
                <option value="ELEMENTARY">Elementary</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
              <input
                type="number"
                placeholder="Duration (hours)"
                value={newCourse.duration}
                onChange={(e) => setNewCourse({ ...newCourse, duration: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="number"
                placeholder="Fee (VND)"
                value={newCourse.fee}
                onChange={(e) => setNewCourse({ ...newCourse, fee: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <select
                value={newCourse.status}
                onChange={(e) => setNewCourse({ ...newCourse, status: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={handleCreate} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Edit Course</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Course Name"
                value={editingCourse.name}
                onChange={(e) => setEditingCourse({ ...editingCourse, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Course Code"
                value={editingCourse.code}
                onChange={(e) => setEditingCourse({ ...editingCourse, code: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <textarea
                placeholder="Description"
                value={editingCourse.description || ""}
                onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows={3}
              />
              <select
                value={editingCourse.level}
                onChange={(e) => setEditingCourse({ ...editingCourse, level: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="BEGINNER">Beginner</option>
                <option value="ELEMENTARY">Elementary</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
              <input
                type="number"
                placeholder="Duration (hours)"
                value={editingCourse.duration}
                onChange={(e) => setEditingCourse({ ...editingCourse, duration: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="number"
                placeholder="Fee (VND)"
                value={editingCourse.fee}
                onChange={(e) => setEditingCourse({ ...editingCourse, fee: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <select
                value={editingCourse.status}
                onChange={(e) => setEditingCourse({ ...editingCourse, status: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={handleUpdate} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
