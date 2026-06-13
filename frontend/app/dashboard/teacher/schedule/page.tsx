"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { apiFetch, hasAuthSession } from "../../../../lib/api";
import { loadScopedClasses, resolveMyTeacherId } from "../../../../lib/teacher-context";

type ClassSchedule = {
  id: string;
  name: string;
  courseName?: string;
  roomNumber?: string;
  startTime?: string;
  endTime?: string;
  days?: string[];
  schedule?: string;
  students?: number;
  centerId?: string;
  centerName?: string;
};

type ScheduleEvent = {
  id: string;
  title: string;
  type: "class" | "meeting" | "event";
  startTime: string;
  endTime: string;
  location?: string;
  description?: string;
  color: string;
};

export default function TeacherSchedulePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "day" | "list">("week");

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const shortDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

  useEffect(() => {
    if (!hasAuthSession()) {
      router.push("/auth/login");
      return;
    }

    try {
      const userData = Cookies.get("userData");
      if (userData) {
        const parsed = JSON.parse(decodeURIComponent(userData));
        setUser(parsed);
        fetchSchedule();
      }
    } catch (e) {
      console.error("Error parsing user data:", e);
    }
  }, [router]);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const teacherEntityId = await resolveMyTeacherId();
      if (!teacherEntityId) {
        setClasses([]);
        return;
      }
      const mapped = await loadScopedClasses("teacher", teacherEntityId);
      setClasses(
        mapped.map((c) => ({
          id: c.id,
          name: c.className,
          courseName: c.programName,
          roomNumber: c.room,
          startTime: c.scheduleTimeStart ? String(c.scheduleTimeStart).slice(0, 5) : undefined,
          endTime: c.scheduleTimeEnd ? String(c.scheduleTimeEnd).slice(0, 5) : undefined,
          days: c.scheduleDays ? String(c.scheduleDays).split(/[,;]+/).map((d) => d.trim()) : [],
          schedule: c.schedule,
          students: c.enrolledCount,
        }))
      );
    } catch (error) {
      console.error("Error fetching schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekDates = () => {
    const current = new Date(selectedDate);
    const first = current.getDate() - current.getDay();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(current);
      date.setDate(first + i);
      return date;
    });
  };

  const formatTime = (time?: string) => {
    if (!time) return "";
    try {
      const [hours, minutes] = time.split(":");
      const h = parseInt(hours);
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      return `${h12}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  const getClassesForDay = (dayIndex: number) => {
    const dayName = daysOfWeek[dayIndex];
    return classes.filter(cls => {
      if (cls.days && Array.isArray(cls.days)) {
        return cls.days.some(d => d.toLowerCase().includes(dayName.toLowerCase().slice(0, 3)));
      }
      if (cls.schedule) {
        return cls.schedule.toLowerCase().includes(dayName.toLowerCase().slice(0, 3));
      }
      // Default: show Mon-Fri classes
      return dayIndex >= 1 && dayIndex <= 5;
    });
  };

  const getClassColor = (index: number) => {
    const colors = [
      "bg-blue-100 border-blue-400 text-blue-800",
      "bg-green-100 border-green-400 text-green-800",
      "bg-purple-100 border-purple-400 text-purple-800",
      "bg-orange-100 border-orange-400 text-orange-800",
      "bg-pink-100 border-pink-400 text-pink-800",
      "bg-teal-100 border-teal-400 text-teal-800",
    ];
    return colors[index % colors.length];
  };

  const weekDates = getWeekDates();

  // Calculate stats
  const totalClasses = classes.length;
  const todayClasses = getClassesForDay(new Date().getDay()).length;
  const totalStudents = classes.reduce((sum, cls) => sum + (cls.students || 0), 0);

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/teacher" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">My Schedule</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">📅 My Teaching Schedule</h1>
          <p className="text-gray-500">View your classes and teaching schedule</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/teacher/classes" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            📚 My Classes
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Classes</p>
              <p className="text-2xl font-bold text-gray-900">{totalClasses}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">📚</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Today's Classes</p>
              <p className="text-2xl font-bold text-green-600">{todayClasses}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">📅</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Students</p>
              <p className="text-2xl font-bold text-purple-600">{totalStudents}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">👨‍🎓</div>
          </div>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-4 border-b flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() - 7);
                setSelectedDate(newDate);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ←
            </button>
            <h2 className="font-semibold text-lg">
              {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </h2>
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() + 7);
                setSelectedDate(newDate);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              →
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="ml-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
            >
              Today
            </button>
          </div>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1 rounded text-sm ${viewMode === "week" ? "bg-white shadow" : "hover:bg-gray-200"}`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode("day")}
              className={`px-3 py-1 rounded text-sm ${viewMode === "day" ? "bg-white shadow" : "hover:bg-gray-200"}`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 rounded text-sm ${viewMode === "list" ? "bg-white shadow" : "hover:bg-gray-200"}`}
            >
              List
            </button>
          </div>
        </div>

        {/* Calendar Content */}
        <div className="p-4">
          {viewMode === "list" ? (
            <div className="space-y-4">
              {daysOfWeek.map((day, dayIndex) => {
                const dayClasses = getClassesForDay(dayIndex);
                if (dayClasses.length === 0) return null;
                return (
                  <div key={day}>
                    <h3 className="font-semibold text-gray-700 mb-2">{day}</h3>
                    <div className="grid gap-2">
                      {dayClasses.map((cls, idx) => (
                        <div
                          key={cls.id}
                          className={`p-4 rounded-lg border-l-4 ${getClassColor(idx)}`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">{cls.name}</h4>
                              {cls.courseName && <p className="text-sm opacity-80">{cls.courseName}</p>}
                            </div>
                            <div className="text-right text-sm">
                              {cls.startTime && cls.endTime && (
                                <p>{formatTime(cls.startTime)} - {formatTime(cls.endTime)}</p>
                              )}
                              {cls.roomNumber && <p className="text-xs opacity-70">Room: {cls.roomNumber}</p>}
                            </div>
                          </div>
                          {cls.students !== undefined && (
                            <p className="text-xs mt-2 opacity-70">{cls.students} students</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {classes.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <span className="text-4xl">📭</span>
                  <p className="mt-2">No classes scheduled</p>
                </div>
              )}
            </div>
          ) : viewMode === "day" ? (
            <div>
              <h3 className="font-semibold text-gray-700 mb-4">
                {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </h3>
              <div className="space-y-2">
                {getClassesForDay(selectedDate.getDay()).map((cls, idx) => (
                  <div
                    key={cls.id}
                    className={`p-4 rounded-lg border-l-4 ${getClassColor(idx)}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{cls.name}</h4>
                        {cls.courseName && <p className="text-sm opacity-80">{cls.courseName}</p>}
                      </div>
                      <div className="text-right text-sm">
                        {cls.startTime && cls.endTime && (
                          <p>{formatTime(cls.startTime)} - {formatTime(cls.endTime)}</p>
                        )}
                        {cls.roomNumber && <p className="text-xs opacity-70">Room: {cls.roomNumber}</p>}
                      </div>
                    </div>
                  </div>
                ))}
                {getClassesForDay(selectedDate.getDay()).length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <span className="text-4xl">🎉</span>
                    <p className="mt-2">No classes today!</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Week Header */}
                <div className="grid grid-cols-8 gap-1 mb-2">
                  <div className="text-sm text-gray-500 p-2">Time</div>
                  {weekDates.map((date, idx) => {
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                      <div
                        key={idx}
                        className={`text-center p-2 rounded-lg ${isToday ? "bg-blue-100" : ""}`}
                      >
                        <div className="text-sm text-gray-500">{shortDays[idx]}</div>
                        <div className={`font-semibold ${isToday ? "text-blue-600" : ""}`}>
                          {date.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Week Grid */}
                <div className="border rounded-lg overflow-hidden">
                  {hours.map((hour) => (
                    <div key={hour} className="grid grid-cols-8 gap-px bg-gray-200">
                      <div className="bg-gray-50 p-2 text-xs text-gray-500 text-right">
                        {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? "PM" : "AM"}
                      </div>
                      {weekDates.map((_, dayIdx) => {
                        const dayClasses = getClassesForDay(dayIdx);
                        const classAtHour = dayClasses.find(cls => {
                          if (!cls.startTime) return false;
                          const startHour = parseInt(cls.startTime.split(":")[0]);
                          return startHour === hour;
                        });

                        return (
                          <div key={dayIdx} className="bg-white min-h-[60px] p-1">
                            {classAtHour && (
                              <div
                                className={`p-2 rounded text-xs ${getClassColor(classes.indexOf(classAtHour))}`}
                              >
                                <div className="font-semibold truncate">{classAtHour.name}</div>
                                {classAtHour.roomNumber && (
                                  <div className="opacity-70">Room {classAtHour.roomNumber}</div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Classes */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📋 All My Classes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls, idx) => (
            <div
              key={cls.id}
              className={`p-4 rounded-lg border-l-4 ${getClassColor(idx)}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{cls.name}</h3>
                  {cls.courseName && <p className="text-sm opacity-80">{cls.courseName}</p>}
                </div>
                <span className="text-xs px-2 py-1 bg-white/50 rounded">
                  {cls.students || 0} students
                </span>
              </div>
              <div className="mt-2 text-sm space-y-1">
                {cls.startTime && cls.endTime && (
                  <p>🕐 {formatTime(cls.startTime)} - {formatTime(cls.endTime)}</p>
                )}
                {cls.roomNumber && <p>🚪 Room: {cls.roomNumber}</p>}
                {cls.schedule && <p>📅 {cls.schedule}</p>}
                {cls.centerName && <p>🏢 {cls.centerName}</p>}
              </div>
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/dashboard/academy/classes/${cls.id}`}
                  className="text-xs px-3 py-1 bg-white/80 rounded hover:bg-white transition-colors"
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
          {classes.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              <span className="text-4xl">📭</span>
              <p className="mt-2">No classes assigned yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
