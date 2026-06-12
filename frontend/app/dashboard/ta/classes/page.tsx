"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import {
  isClassActive,
  loadScopedClasses,
  resolveMyTeacherId,
} from "../../../../lib/teacher-context";

interface Class {
  id: string;
  className: string;
  programId: string;
  programName: string;
  teacherId: string;
  teacherName: string;
  schedule: string;
  capacity: number;
  enrolledCount: number;
  status: string;
}

export default function TAClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError("");
      const teacherEntityId = await resolveMyTeacherId();
      if (!teacherEntityId) {
        setError("No teaching assistant profile linked to your account.");
        setClasses([]);
        return;
      }

      const mapped = await loadScopedClasses("ta", teacherEntityId);
      const teacherIds = Array.from(new Set(mapped.map((c) => c.teacherId).filter(Boolean)));
      const teacherNames = new Map<string, string>();
      await Promise.all(
        teacherIds.map(async (tid) => {
          try {
            const t = (await apiFetch(`/api/teachers/${tid}`)) as {
              fullname?: string;
              name?: string;
            };
            teacherNames.set(tid, t?.fullname || t?.name || "");
          } catch {
            teacherNames.set(tid, "");
          }
        })
      );

      setClasses(
        mapped.map((c) => ({
          id: c.id,
          className: c.className,
          programId: c.programId,
          programName: c.programName,
          teacherId: c.teacherId,
          teacherName: teacherNames.get(c.teacherId) || "",
          schedule: c.schedule,
          capacity: c.capacity,
          enrolledCount: c.enrolledCount,
          status: c.status,
        }))
      );
    } catch (err) {
      setError("Error loading classes");
      setClasses([]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      OPEN: "bg-green-100 text-green-800",
      ACTIVE: "bg-green-100 text-green-800",
      COMPLETED: "bg-gray-100 text-gray-800",
      UPCOMING: "bg-blue-100 text-blue-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/ta" className="hover:text-blue-600">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-gray-900">My Classes</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">📚 My Assigned Classes</h1>
          <p className="text-gray-500 mt-1">Classes you&apos;re assisting with</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Classes Assigned</h3>
            <p className="text-gray-500">You don&apos;t have any classes assigned yet.</p>
          </div>
        ) : (
          classes.map((classItem) => (
            <div
              key={classItem.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{classItem.className}</h3>
                  <p className="text-sm text-gray-600">{classItem.programName || classItem.programId}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(classItem.status)}`}
                >
                  {classItem.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">👨‍🏫</span>
                  <span>{classItem.teacherName || "Lead teacher"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">📅</span>
                  <span>{classItem.schedule}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">👥</span>
                  <span>
                    {classItem.enrolledCount} / {classItem.capacity} students
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/dashboard/academy/classes/${classItem.id}`}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Details →
                  </Link>
                  <Link
                    href={`/dashboard/ta/attendance?classId=${classItem.id}`}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Mark Attendance
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {classes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500 mb-1">Total Classes</div>
            <div className="text-2xl font-bold text-gray-900">{classes.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500 mb-1">Open Classes</div>
            <div className="text-2xl font-bold text-green-600">
              {classes.filter((c) => isClassActive(c.status)).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500 mb-1">Total Students</div>
            <div className="text-2xl font-bold text-blue-600">
              {classes.reduce((sum, c) => sum + (c.enrolledCount || 0), 0)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
