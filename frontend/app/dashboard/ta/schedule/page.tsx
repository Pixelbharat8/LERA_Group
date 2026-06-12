"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { resolveMyTeacherId } from "../../../../lib/teacher-context";

interface ScheduleItem {
  id: string;
  className: string;
  courseName?: string;
  teacherName: string;
  date: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  studentCount?: number;
}

export default function TASchedulePage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    fetchSchedules();
  }, [weekOffset]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const taEntityId = await resolveMyTeacherId();
      if (!taEntityId) {
        setSchedules([]);
        return;
      }

      const data = await apiFetch(`/api/schedules/ta/${taEntityId}`).catch(() => []);
      
      if (Array.isArray(data) && data.length > 0) {
        setSchedules(data.map((s: any) => ({
          id: s.id,
          className: s.className || s.class?.name || "Class",
          courseName: s.courseName || s.course?.name,
          teacherName: s.teacherName || s.teacher?.fullname || "Teacher",
          date: s.date?.split("T")[0] || s.scheduleDate?.split("T")[0],
          dayOfWeek: s.dayOfWeek || new Date(s.date).toLocaleDateString("en-US", { weekday: "long" }),
          startTime: s.startTime,
          endTime: s.endTime,
          room: s.room || s.roomNumber || "TBD",
          status: s.status?.toLowerCase() || "scheduled",
          studentCount: s.studentCount || s.enrolledStudents || 0
        })));
      } else {
        setSchedules([]);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekDates = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + weekOffset * 7);
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const getSchedulesForDate = (dateStr: string) => {
    return schedules.filter(s => s.date === dateStr);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress": return "bg-green-100 text-green-800 border-green-300";
      case "completed": return "bg-gray-100 text-gray-800 border-gray-300";
      case "cancelled": return "bg-red-100 text-red-800 border-red-300";
      default: return "bg-blue-100 text-blue-800 border-blue-300";
    }
  };

  const todaySchedules = schedules.filter(s => s.date === new Date().toISOString().split("T")[0]);
  const weeklyHours = schedules.reduce((total, s) => {
    const start = parseInt(s.startTime.split(":")[0]);
    const end = parseInt(s.endTime.split(":")[0]);
    return total + (end - start);
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Schedule</h1>
          <p className="text-gray-600">View your assigned classes and sessions</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/ta" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Today's Sessions", value: todaySchedules.length, icon: "📅", color: "bg-blue-500" },
          { label: "This Week", value: schedules.length, icon: "📊", color: "bg-green-500" },
          { label: "Weekly Hours", value: `${weeklyHours}h`, icon: "⏰", color: "bg-purple-500" },
          { label: "Total Students", value: schedules.reduce((sum, s) => sum + (s.studentCount || 0), 0), icon: "👨‍🎓", color: "bg-orange-500" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-full text-xl`}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* View Toggle and Week Navigation */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setWeekOffset(weekOffset - 1)}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              ← Previous
            </button>
            <span className="font-semibold">
              {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <button
              onClick={() => setWeekOffset(weekOffset + 1)}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Next →
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setWeekOffset(0)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Today
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-lg ${viewMode === "list" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-4 py-2 rounded-lg ${viewMode === "calendar" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
            >
              Week View
            </button>
          </div>
        </div>
      </div>

      {/* Schedule Display */}
      {viewMode === "list" ? (
        <div className="bg-white rounded-xl shadow">
          <div className="p-6 space-y-4">
            {schedules.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-4xl mb-4">📅</p>
                <p>No scheduled sessions this week</p>
              </div>
            ) : (
              schedules
                .sort((a, b) => new Date(a.date + " " + a.startTime).getTime() - new Date(b.date + " " + b.startTime).getTime())
                .map((schedule) => (
                  <div key={schedule.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="text-center bg-blue-50 rounded-lg p-3 min-w-[80px]">
                          <p className="text-sm text-blue-600">{schedule.dayOfWeek.slice(0, 3)}</p>
                          <p className="text-2xl font-bold">{new Date(schedule.date).getDate()}</p>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{schedule.className}</h3>
                          {schedule.courseName && (
                            <p className="text-sm text-gray-600">{schedule.courseName}</p>
                          )}
                          <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                            <span>👨‍🏫 {schedule.teacherName}</span>
                            <span>⏰ {schedule.startTime} - {schedule.endTime}</span>
                            <span>📍 {schedule.room}</span>
                            {schedule.studentCount && <span>👨‍🎓 {schedule.studentCount} students</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(schedule.status)}`}>
                          {schedule.status.replace("_", " ").charAt(0).toUpperCase() + schedule.status.replace("_", " ").slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Week Header */}
            <div className="grid grid-cols-7 border-b">
              {weekDates.map((date, i) => {
                const isToday = date.toDateString() === new Date().toDateString();
                return (
                  <div key={i} className={`p-4 text-center border-r last:border-r-0 ${isToday ? "bg-blue-50" : ""}`}>
                    <p className="text-sm text-gray-600">{date.toLocaleDateString("en-US", { weekday: "short" })}</p>
                    <p className={`text-2xl font-bold ${isToday ? "text-blue-600" : ""}`}>{date.getDate()}</p>
                  </div>
                );
              })}
            </div>
            
            {/* Schedule Grid */}
            <div className="grid grid-cols-7 min-h-[400px]">
              {weekDates.map((date, i) => {
                const dateStr = date.toISOString().split("T")[0];
                const daySchedules = getSchedulesForDate(dateStr);
                const isToday = date.toDateString() === new Date().toDateString();
                
                return (
                  <div key={i} className={`p-2 border-r last:border-r-0 ${isToday ? "bg-blue-50" : ""}`}>
                    <div className="space-y-2">
                      {daySchedules.map((s) => (
                        <div key={s.id} className="bg-blue-100 border-l-4 border-blue-600 p-2 rounded text-xs">
                          <p className="font-semibold truncate">{s.className}</p>
                          <p className="text-gray-600">{s.startTime} - {s.endTime}</p>
                          <p className="text-gray-500 truncate">{s.room}</p>
                        </div>
                      ))}
                      {daySchedules.length === 0 && (
                        <p className="text-gray-400 text-xs text-center py-4">No classes</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Today's Details */}
      {todaySchedules.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold mb-4">📌 Today's Sessions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todaySchedules.map((s) => (
              <div key={s.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-blue-800">{s.className}</h4>
                    <p className="text-sm text-gray-600">{s.courseName}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(s.status)}`}>
                    {s.status.toUpperCase()}
                  </span>
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  <p>👨‍🏫 <strong>Teacher:</strong> {s.teacherName}</p>
                  <p>⏰ <strong>Time:</strong> {s.startTime} - {s.endTime}</p>
                  <p>📍 <strong>Room:</strong> {s.room}</p>
                  <p>👨‍🎓 <strong>Students:</strong> {s.studentCount}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
