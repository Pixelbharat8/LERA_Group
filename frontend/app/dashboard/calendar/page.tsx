"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { apiFetch } from "@/lib/api";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  type: "class" | "exam" | "event" | "holiday" | "meeting" | "deadline";
  color: string;
}

export default function CalendarPage() {
  const [language, setLanguage] = useState("EN");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedLang = Cookies.get("language");
    if (savedLang) setLanguage(savedLang);
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch(`/api/calendar/events?month=${currentDate.getMonth() + 1}&year=${currentDate.getFullYear()}`);
      if (Array.isArray(data) && data.length > 0) {
        setEvents(data.map((e: CalendarEvent) => ({ ...e, startDate: new Date(e.startDate), endDate: e.endDate ? new Date(e.endDate) : undefined })));
      } else {
        setEvents([]);
      }
    } catch {
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.getDate() === date.getDate() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear();
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const weekDays = language === "VI" 
    ? ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const monthName = currentDate.toLocaleDateString(language === "VI" ? "vi-VN" : "en-US", { month: "long", year: "numeric" });

  const typeLabels = {
    class: language === "VI" ? "Lớp học" : "Class",
    exam: language === "VI" ? "Kiểm tra" : "Exam",
    event: language === "VI" ? "Sự kiện" : "Event",
    holiday: language === "VI" ? "Nghỉ lễ" : "Holiday",
    meeting: language === "VI" ? "Họp" : "Meeting",
    deadline: language === "VI" ? "Hạn chót" : "Deadline"
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {language === "VI" ? "📅 Lịch" : "📅 Calendar"}
          </h1>
          <p className="text-gray-600 mt-1">
            {language === "VI"
              ? "Quản lý lịch học và sự kiện của bạn"
              : "Manage your schedule and events"}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(["month", "week", "day"] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  view === v ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {v === "month" ? (language === "VI" ? "Tháng" : "Month") :
                 v === "week" ? (language === "VI" ? "Tuần" : "Week") :
                 (language === "VI" ? "Ngày" : "Day")}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {language === "VI" ? "+ Thêm sự kiện" : "+ Add Event"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Calendar Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ←
            </button>
            <h2 className="text-lg font-semibold text-gray-900 capitalize">{monthName}</h2>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              →
            </button>
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {weekDays.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              {language === "VI" ? "Đang tải..." : "Loading..."}
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {getDaysInMonth(currentDate).map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="min-h-[100px] border-b border-r border-gray-100 bg-gray-50" />;
                }
                
                const dayEvents = getEventsForDate(date);
                
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`min-h-[100px] p-2 border-b border-r border-gray-100 text-left hover:bg-gray-50 transition-colors ${
                      isToday(date) ? "bg-blue-50" : ""
                    } ${isSelected(date) ? "ring-2 ring-blue-500 ring-inset" : ""}`}
                  >
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm ${
                      isToday(date) ? "bg-blue-600 text-white font-bold" : "text-gray-700"
                    }`}>
                      {date.getDate()}
                    </span>
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          className={`${event.color} text-white text-xs px-1 py-0.5 rounded truncate`}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{dayEvents.length - 3} {language === "VI" ? "khác" : "more"}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Selected Date Events */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">
              {selectedDate 
                ? selectedDate.toLocaleDateString(language === "VI" ? "vi-VN" : "en-US", { weekday: "long", month: "long", day: "numeric" })
                : (language === "VI" ? "Chọn ngày để xem chi tiết" : "Select a date to view details")}
            </h3>
            {selectedDate && (
              <div className="space-y-3">
                {selectedDateEvents.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    {language === "VI" ? "Không có sự kiện" : "No events"}
                  </p>
                ) : (
                  selectedDateEvents.map(event => (
                    <div key={event.id} className="flex gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <div className={`w-1 rounded-full ${event.color}`} />
                      <div>
                        <p className="font-medium text-gray-900">{event.title}</p>
                        <p className="text-xs text-gray-500">
                          {event.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {event.description && (
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        )}
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${event.color} text-white`}>
                          {typeLabels[event.type]}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Event Legend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              {language === "VI" ? "Chú thích" : "Legend"}
            </h3>
            <div className="space-y-2">
              {Object.entries(typeLabels).map(([type, label]) => {
                const colorMap: Record<string, string> = {
                  class: "bg-blue-500",
                  exam: "bg-red-500",
                  event: "bg-green-500",
                  holiday: "bg-gray-500",
                  meeting: "bg-purple-500",
                  deadline: "bg-orange-500"
                };
                return (
                  <div key={type} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded ${colorMap[type]}`} />
                    <span className="text-sm text-gray-700">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              {language === "VI" ? "Sắp tới" : "Upcoming"}
            </h3>
            <div className="space-y-3">
              {events
                .filter(e => e.startDate >= new Date())
                .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
                .slice(0, 5)
                .map(event => (
                  <div key={event.id} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${event.color} flex items-center justify-center text-white text-xs font-medium`}>
                      {event.startDate.getDate()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                      <p className="text-xs text-gray-500">
                        {event.startDate.toLocaleDateString(language === "VI" ? "vi-VN" : "en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {language === "VI" ? "Thêm sự kiện" : "Add Event"}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === "VI" ? "Tiêu đề" : "Title"}
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === "VI" ? "Ngày" : "Date"}
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === "VI" ? "Giờ" : "Time"}
                  </label>
                  <input
                    type="time"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === "VI" ? "Loại" : "Type"}
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="class">{typeLabels.class}</option>
                  <option value="exam">{typeLabels.exam}</option>
                  <option value="event">{typeLabels.event}</option>
                  <option value="meeting">{typeLabels.meeting}</option>
                  <option value="deadline">{typeLabels.deadline}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === "VI" ? "Mô tả" : "Description"}
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {language === "VI" ? "Hủy" : "Cancel"}
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {language === "VI" ? "Lưu" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
