"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { loadMyChildren } from "../../../../lib/parent-context";
import { loadMyWeeklySchedule } from "../../../../lib/student-context";

interface Child {
  id: string;
  fullname: string;
  studentCode: string;
}

interface ScheduleItem {
  id: string;
  day: string;
  dayNumber: number;
  startTime: string;
  endTime: string;
  className: string;
  courseName: string;
  teacherName: string;
  room: string;
  status: "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";
  childName?: string;
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function ParentSchedulePage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"combined" | "individual">("combined");

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      fetchSchedule(selectedChildId);
    }
  }, [selectedChildId]);

  const fetchChildren = async () => {
    try {
      const rows = await loadMyChildren();
      const mappedChildren = rows.map((s) => ({
        id: s.id,
        fullname: s.fullname || "Student",
        studentCode: s.studentCode || "",
      }));
      setChildren(mappedChildren);
      if (mappedChildren.length > 0) {
        setSelectedChildId(mappedChildren[0].id);
      }
    } catch (err) {
      console.error(err);
      setChildren([]);
    }
  };

  const fetchSchedule = async (studentId: string) => {
    try {
      setLoading(true);
      const slots = await loadMyWeeklySchedule(studentId);
      if (slots.length > 0) {
        setSchedule(
          slots.map((s) => ({
            id: s.id,
            day: s.day,
            dayNumber: s.dayNumber,
            startTime: s.startTime,
            endTime: s.endTime,
            className: s.className,
            courseName: s.courseName,
            teacherName: s.teacherName,
            room: s.room,
            status: "UPCOMING" as const,
          }))
        );
        setLoading(false);
        return;
      }

      const enrollmentsData = await apiFetch(`/api/enrollments?studentId=${studentId}`).catch(() => []);
      const enrollments = Array.isArray(enrollmentsData) ? enrollmentsData : [];
      
      // Get class IDs from enrollments
      const classIds = enrollments.map((e: any) => e.classId).filter(Boolean);
      
      // Fetch schedules for each class
      let allSchedules: any[] = [];
      for (const classId of classIds) {
        const classSchedules = await apiFetch(`/api/class-schedules/class/${classId}`).catch(() => []);
        if (Array.isArray(classSchedules)) {
          allSchedules = [...allSchedules, ...classSchedules.map((s: any) => ({ ...s, classId }))];
        }
      }
      
      const classesMap = new Map<string, Record<string, unknown>>();
      await Promise.all(
        classIds.map(async (classId) => {
          const c = (await apiFetch(`/api/classes/${classId}`).catch(() => null)) as Record<
            string,
            unknown
          > | null;
          if (c) classesMap.set(classId, c);
        })
      );
      
      const childName = children.find(c => c.id === studentId)?.fullname || "Child";
      
      if (allSchedules.length > 0) {
        setSchedule(allSchedules.map((s: any) => {
          const classInfo = classesMap.get(s.classId) || {};
          return {
            id: String(s.id),
            day: String(s.dayOfWeek || "Monday"),
            dayNumber: getDayNumber(s.dayOfWeek || "Monday"),
            startTime: String(s.startTime || "09:00"),
            endTime: String(s.endTime || "10:30"),
            className: String(classInfo.name ?? "Class"),
            courseName: String(classInfo.courseName ?? classInfo.name ?? "Course"),
            teacherName: String(classInfo.teacherName ?? "Teacher"),
            room: String(s.roomNumber || s.roomName || "TBD"),
            status: "UPCOMING" as const,
            childName,
          };
        }));
      } else {
        setSchedule([]);
      }
    } catch (err) {
      console.error(err);
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  };

  const getDayNumber = (day: string): number => {
    const days: Record<string, number> = {
      "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4,
      "Friday": 5, "Saturday": 6, "Sunday": 0
    };
    return days[day] ?? 1;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      UPCOMING: "bg-blue-100 text-blue-800 border-blue-300",
      ONGOING: "bg-green-100 text-green-800 border-green-300",
      COMPLETED: "bg-gray-100 text-gray-800 border-gray-300",
      CANCELLED: "bg-red-100 text-red-800 border-red-300",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaysClasses = schedule.filter(s => s.day === todayName);

  if (loading && !schedule.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/parent" className="hover:text-blue-600">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-900">Children's Schedule</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">📅 Children's Schedule</h1>
        <p className="text-gray-500 mt-1">View your children's class timetable</p>
      </div>

      {/* Child Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Child</label>
        <select
          value={selectedChildId}
          onChange={(e) => setSelectedChildId(e.target.value)}
          className="w-full md:w-1/2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {children.map((child) => (
            <option key={child.id} value={child.id}>
              {child.fullname} ({child.studentCode})
            </option>
          ))}
        </select>
      </div>

      {/* Today's Classes */}
      {todaysClasses.length > 0 && (
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <h2 className="text-xl font-bold mb-4">📌 Today's Classes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todaysClasses.map((item) => (
              <div key={item.id} className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="font-semibold">{item.className}</div>
                <div className="text-sm opacity-90">{item.startTime} - {item.endTime}</div>
                <div className="text-sm opacity-75">📍 {item.room}</div>
                <div className="text-sm opacity-75">👩‍🏫 {item.teacherName}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Total Classes/Week</div>
          <div className="text-2xl font-bold text-gray-900">{schedule.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Today's Classes</div>
          <div className="text-2xl font-bold text-blue-600">{todaysClasses.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Unique Courses</div>
          <div className="text-2xl font-bold text-purple-600">
            {new Set(schedule.map(s => s.courseName)).size}
          </div>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="space-y-4">
        {DAYS_OF_WEEK.map((day) => {
          const dayClasses = schedule.filter(s => s.day === day);
          if (dayClasses.length === 0) return null;
          
          const isToday = day === todayName;
          
          return (
            <div key={day} className={`bg-white rounded-lg shadow overflow-hidden ${isToday ? 'ring-2 ring-blue-500' : ''}`}>
              <div className={`px-6 py-3 border-b ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  {day}
                  {isToday && (
                    <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">Today</span>
                  )}
                </h3>
              </div>
              <div className="divide-y">
                {dayClasses.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50 flex items-center gap-4">
                    <div className="text-center min-w-[80px]">
                      <div className="text-lg font-bold text-blue-600">{item.startTime}</div>
                      <div className="text-xs text-gray-500">to {item.endTime}</div>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{item.className}</div>
                      <div className="text-sm text-gray-600">{item.courseName}</div>
                      <div className="flex gap-4 text-sm text-gray-500 mt-1">
                        <span>👩‍🏫 {item.teacherName}</span>
                        <span>📍 {item.room}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {schedule.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-semibold mb-2">No Schedule Found</h3>
          <p className="text-gray-500">This child doesn't have any scheduled classes yet.</p>
        </div>
      )}
    </div>
  );
}
