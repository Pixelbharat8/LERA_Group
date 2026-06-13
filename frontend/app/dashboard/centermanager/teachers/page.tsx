"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { apiFetch } from "../../../../lib/api";

interface Teacher {
  id: string;
  teacherCode: string;
  specialization?: string;
  qualification?: string;
  yearsOfExperience?: number;
  status: string;
  userId?: string;
  fullName?: string;
  email?: string;
  user?: {
    fullName: string;
    email: string;
  };
}

export default function CenterManagerTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    const userDataStr = Cookies.get("userData");
    let centerId = null;
    
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        centerId = userData.centerId;
      } catch (e) {}
    }

    try {
      const data = await apiFetch(`/api/teachers${centerId ? `?centerId=${centerId}` : ""}`);
      const teachersList = Array.isArray(data) ? data : [];
      
      // Fetch user details for each teacher to get names
      const teachersWithNames = await Promise.all(
        teachersList.map(async (teacher: Teacher) => {
          if (teacher.userId) {
            try {
              const user = await apiFetch(`/api/users/${teacher.userId}`);
              return {
                ...teacher,
                fullName: user.fullName || user.name || "",
                email: user.email || ""
              };
            } catch {
              return teacher;
            }
          }
          return teacher;
        })
      );
      
      setTeachers(teachersWithNames);
    } catch (err) {
      console.error("Failed to fetch teachers:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(t =>
    t.teacherCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👨‍🏫 Center Teachers</h1>
          <p className="text-gray-500">View teachers in your center</p>
        </div>
        <input
          type="text"
          placeholder="Search teachers..."
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm">Total Teachers</h3>
          <p className="text-2xl font-bold">{teachers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm">Active</h3>
          <p className="text-2xl font-bold">{teachers.filter(t => t.status === "ACTIVE").length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <h3 className="text-gray-500 text-sm">Specializations</h3>
          <p className="text-2xl font-bold">{new Set(teachers.map(t => t.specialization).filter(Boolean)).size}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <h3 className="text-gray-500 text-sm">Avg Experience</h3>
          <p className="text-2xl font-bold">
            {teachers.length > 0 ? Math.round(teachers.reduce((s, t) => s + (t.yearsOfExperience || 0), 0) / teachers.length) : 0} yrs
          </p>
        </div>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No teachers found in your center.
          </div>
        ) : (
          filteredTeachers.map((teacher) => (
            <div key={teacher.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                  👨‍🏫
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{teacher.fullName || teacher.user?.fullName || teacher.teacherCode}</h3>
                  <p className="text-sm text-gray-500">{teacher.specialization || "No specialization"}</p>
                  <p className="text-xs text-gray-400">{teacher.email || teacher.user?.email}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  teacher.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                }`}>
                  {teacher.status}
                </span>
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between text-sm text-gray-500">
                <span>{teacher.qualification || "N/A"}</span>
                <span>{teacher.yearsOfExperience || 0} yrs exp</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
