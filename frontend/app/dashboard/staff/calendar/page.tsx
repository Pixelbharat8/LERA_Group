"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { apiFetch } from "../../../../lib/api";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  type: "task" | "meeting" | "event" | "deadline" | "holiday";
  location?: string;
  attendees?: string[];
}

export default function StaffCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const userData = Cookies.get("userData");
      let staffId = "";
      if (userData) {
        const parsed = JSON.parse(decodeURIComponent(userData));
        staffId = parsed.id || parsed.userId;
      }

      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      const [tasks, meetings, schedules] = await Promise.all([
        apiFetch(`/api/tasks?assigneeId=${staffId}`).catch(() => []),
        apiFetch(`/api/meetings?participantId=${staffId}`).catch(() => []),
        apiFetch(`/api/schedules?month=${month}&year=${year}`).catch(() => []),
      ]);

      const calendarEvents: CalendarEvent[] = [];

      // Add tasks as events
      if (Array.isArray(tasks)) {
        tasks.forEach((t: any) => {
          if (t.dueDate) {
            calendarEvents.push({
              id: `task-${t.id}`,
              title: t.title || t.name,
              date: t.dueDate.split("T")[0],
              type: "task",
              description: t.description
            });
          }
        });
      }

      // Add meetings
      if (Array.isArray(meetings)) {
        meetings.forEach((m: any) => {
          calendarEvents.push({
            id: `meeting-${m.id}`,
            title: m.title || m.subject,
            date: m.date?.split("T")[0] || m.meetingDate?.split("T")[0],
            startTime: m.startTime,
            endTime: m.endTime,
            type: "meeting",
            location: m.location || m.room
          });
        });
      }

      if (calendarEvents.length === 0) {
        // No events from API
      }

      setEvents(calendarEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month, -i),
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return events.filter(e => e.date === dateStr);
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "meeting": return "bg-blue-500";
      case "task": return "bg-orange-500";
      case "deadline": return "bg-red-500";
      case "event": return "bg-purple-500";
      case "holiday": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const selectedDateEvents = selectedDate 
    ? events.filter(e => e.date === selectedDate)
    : [];

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
          <h1 className="text-3xl font-bold text-gray-800">Calendar</h1>
          <p className="text-gray-600">View your schedule and upcoming events</p>
        </div>
        <Link href="/dashboard/staff" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ←
            </button>
            <h2 className="text-xl font-bold">
              {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              →
            </button>
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const dayEvents = getEventsForDate(day.date);
              const dateStr = day.date.toISOString().split("T")[0];
              
              return (
                <div
                  key={index}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`min-h-[100px] p-2 border rounded-lg cursor-pointer transition-colors ${
                    day.isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400"
                  } ${isToday(day.date) ? "border-blue-500 border-2" : "border-gray-200"} ${
                    selectedDate === dateStr ? "bg-blue-50" : "hover:bg-gray-50"
                  }`}
                >
                  <div className={`text-sm font-medium ${isToday(day.date) ? "text-blue-600" : ""}`}>
                    {day.date.getDate()}
                  </div>
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={`${getEventColor(event.type)} text-white text-xs px-1 py-0.5 rounded truncate`}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500">+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar - Selected Date Events */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold mb-4">
            {selectedDate 
              ? new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
              : "Select a Date"}
          </h3>

          {selectedDate && (
            <div className="space-y-3">
              {selectedDateEvents.length === 0 ? (
                <p className="text-gray-500 text-sm">No events on this day</p>
              ) : (
                selectedDateEvents.map((event) => (
                  <div key={event.id} className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-3 h-3 rounded-full ${getEventColor(event.type)}`}></div>
                      <span className="text-xs uppercase text-gray-500">{event.type}</span>
                    </div>
                    <h4 className="font-semibold text-gray-800">{event.title}</h4>
                    {event.startTime && (
                      <p className="text-sm text-gray-600">
                        🕐 {event.startTime} {event.endTime && `- ${event.endTime}`}
                      </p>
                    )}
                    {event.location && (
                      <p className="text-sm text-gray-600">📍 {event.location}</p>
                    )}
                    {event.description && (
                      <p className="text-sm text-gray-500 mt-1">{event.description}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Legend */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold mb-3">Legend</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Meeting</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>Task</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Deadline</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span>Event</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Holiday</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-bold mb-4">Upcoming Events</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {events
            .filter(e => new Date(e.date) >= new Date())
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 4)
            .map((event) => (
              <div key={event.id} className="border rounded-lg p-4">
                <div className={`${getEventColor(event.type)} text-white text-xs px-2 py-1 rounded inline-block mb-2`}>
                  {event.type.toUpperCase()}
                </div>
                <h4 className="font-semibold">{event.title}</h4>
                <p className="text-sm text-gray-600">
                  {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  {event.startTime && ` at ${event.startTime}`}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
