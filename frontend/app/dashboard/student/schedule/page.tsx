"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { loadMyWeeklySchedule, resolveMyStudentId } from "../../../../lib/student-context";

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
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME_SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

export default function StudentSchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"week" | "list">("week");
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const studentId = await resolveMyStudentId();
      if (!studentId) {
        setSchedule([]);
        return;
      }
      const slots = await loadMyWeeklySchedule(studentId);
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

  const todaysClasses = schedule.filter(s => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return s.day === today;
  });

  const upcomingClasses = schedule.filter(s => s.status === "UPCOMING").slice(0, 5);

  if (loading) {
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
          <Link href="/dashboard/student" className="hover:text-blue-600">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-900">My Schedule</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📅 My Schedule</h1>
            <p className="text-gray-500 mt-1">View your class timetable</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("week")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                viewMode === "week" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              📆 Week View
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                viewMode === "list" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              📋 List View
            </button>
          </div>
        </div>
      </div>

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
          <div className="text-sm text-gray-500 mb-1">Upcoming This Week</div>
          <div className="text-2xl font-bold text-green-600">{upcomingClasses.length}</div>
        </div>
      </div>

      {/* Today's Classes Quick View */}
      {todaysClasses.length > 0 && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
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

      {viewMode === "week" ? (
        /* Week View - Timetable */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">Time</th>
                  {DAYS_OF_WEEK.slice(0, 6).map((day) => (
                    <th key={day} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((time) => (
                  <tr key={time} className="border-b">
                    <td className="px-4 py-2 text-sm font-medium text-gray-500">{time}</td>
                    {DAYS_OF_WEEK.slice(0, 6).map((day) => {
                      const classAtTime = schedule.find(
                        s => s.day === day && s.startTime === time
                      );
                      return (
                        <td key={day} className="px-2 py-2">
                          {classAtTime && (
                            <div className={`p-2 rounded-lg text-xs ${getStatusColor(classAtTime.status)}`}>
                              <div className="font-semibold truncate">{classAtTime.className}</div>
                              <div className="opacity-75">{classAtTime.startTime} - {classAtTime.endTime}</div>
                              <div className="opacity-75">📍 {classAtTime.room}</div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {DAYS_OF_WEEK.map((day) => {
            const dayClasses = schedule.filter(s => s.day === day);
            if (dayClasses.length === 0) return null;
            
            return (
              <div key={day} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b">
                  <h3 className="font-bold text-gray-900">{day}</h3>
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
      )}
    </div>
  );
}
