"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { apiFetch } from "@/lib/api";

interface TimeSlot {
  id: string;
  day: number; // 0-6 (Sunday-Saturday)
  startTime: string;
  endTime: string;
  subject: string;
  teacher: string;
  room: string;
  color: string;
}

export default function TimetablePage() {
  const [language, setLanguage] = useState("EN");
  const [timetable, setTimetable] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [currentDay, setCurrentDay] = useState(new Date().getDay());

  useEffect(() => {
    const savedLang = Cookies.get("language");
    if (savedLang) setLanguage(savedLang);
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch("/api/timetable/my-schedule");
      if (Array.isArray(data) && data.length > 0) {
        setTimetable(data.map((slot: any) => ({
          id: slot.id || String(Math.random()),
          day: slot.dayOfWeek ?? slot.day ?? 1,
          startTime: slot.startTime || "08:00",
          endTime: slot.endTime || "08:45",
          subject: slot.subject || slot.courseName || slot.className || "Class",
          teacher: slot.teacherName || slot.teacher || "",
          room: slot.room || slot.roomName || "",
          color: slot.color || "bg-blue-500",
        })));
      } else {
        setTimetable([]);
      }
    } catch {
      setTimetable([]);
    } finally {
      setIsLoading(false);
    }
  };

  const days = language === "VI"
    ? ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]
    : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const shortDays = language === "VI"
    ? ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const timeSlots = [
    "07:30", "08:20", "09:20", "10:10", "11:00",
    "13:30", "14:15", "15:00", "15:45"
  ];

  const getSlotForDayAndTime = (day: number, time: string) => {
    return timetable.find(slot => slot.day === day && slot.startTime === time);
  };

  const getTodaySchedule = () => {
    return timetable
      .filter(slot => slot.day === currentDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const isCurrentSlot = (slot: TimeSlot) => {
    const now = new Date();
    const today = now.getDay();
    if (slot.day !== today) return false;
    
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMin] = slot.startTime.split(":").map(Number);
    const [endHour, endMin] = slot.endTime.split(":").map(Number);
    const slotStart = startHour * 60 + startMin;
    const slotEnd = endHour * 60 + endMin;
    
    return currentTime >= slotStart && currentTime <= slotEnd;
  };

  const getNextClass = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Check today's remaining classes
    const todayClasses = timetable
      .filter(slot => slot.day === currentDay)
      .filter(slot => {
        const [startHour, startMin] = slot.startTime.split(":").map(Number);
        return startHour * 60 + startMin > currentTime;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    if (todayClasses.length > 0) return todayClasses[0];
    
    // Check next days
    for (let i = 1; i <= 7; i++) {
      const checkDay = (currentDay + i) % 7;
      const dayClasses = timetable
        .filter(slot => slot.day === checkDay)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      if (dayClasses.length > 0) return dayClasses[0];
    }
    
    return null;
  };

  const nextClass = getNextClass();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {language === "VI" ? "📚 Thời Khóa Biểu" : "📚 Timetable"}
          </h1>
          <p className="text-gray-600 mt-1">
            {language === "VI"
              ? "Xem lịch học của bạn"
              : "View your class schedule"}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                viewMode === "week" ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {language === "VI" ? "Tuần" : "Week"}
            </button>
            <button
              onClick={() => setViewMode("day")}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                viewMode === "day" ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {language === "VI" ? "Ngày" : "Day"}
            </button>
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            {language === "VI" ? "In" : "Print"} 🖨️
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
              📖
            </div>
            <div>
              <p className="text-sm text-gray-600">
                {language === "VI" ? "Số môn học" : "Subjects"}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(timetable.map(s => s.subject)).size}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
              ⏰
            </div>
            <div>
              <p className="text-sm text-gray-600">
                {language === "VI" ? "Tiết học/tuần" : "Classes/Week"}
              </p>
              <p className="text-2xl font-bold text-gray-900">{timetable.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">
              👨‍🏫
            </div>
            <div>
              <p className="text-sm text-gray-600">
                {language === "VI" ? "Giáo viên" : "Teachers"}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(timetable.map(s => s.teacher)).size}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">
              🏫
            </div>
            <div>
              <p className="text-sm text-gray-600">
                {language === "VI" ? "Phòng học" : "Rooms"}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(timetable.map(s => s.room)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Class Card */}
      {nextClass && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm">
                {isCurrentSlot(nextClass) 
                  ? (language === "VI" ? "Đang diễn ra" : "Currently in class")
                  : (language === "VI" ? "Tiết học tiếp theo" : "Next Class")}
              </p>
              <h3 className="text-xl font-bold mt-1">{nextClass.subject}</h3>
              <p className="text-blue-100 mt-1">
                {nextClass.teacher} • {nextClass.room}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{nextClass.startTime}</p>
              <p className="text-blue-200">{days[nextClass.day]}</p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">
          {language === "VI" ? "Đang tải..." : "Loading..."}
        </div>
      ) : viewMode === "week" ? (
        /* Week View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-3 text-left text-sm font-medium text-gray-600 border-b border-r border-gray-200 w-20">
                    {language === "VI" ? "Giờ" : "Time"}
                  </th>
                  {[1, 2, 3, 4, 5, 6].map(day => (
                    <th 
                      key={day} 
                      className={`p-3 text-center text-sm font-medium border-b border-r border-gray-200 ${
                        day === new Date().getDay() ? "bg-blue-50 text-blue-700" : "text-gray-600"
                      }`}
                    >
                      {shortDays[day]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((time, timeIndex) => (
                  <tr key={time} className={timeIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="p-2 text-sm text-gray-600 border-r border-gray-200 text-center font-medium">
                      {time}
                    </td>
                    {[1, 2, 3, 4, 5, 6].map(day => {
                      const slot = getSlotForDayAndTime(day, time);
                      return (
                        <td 
                          key={`${day}-${time}`} 
                          className="p-1 border-r border-gray-200 min-w-[120px] h-16"
                        >
                          {slot && (
                            <button
                              onClick={() => setSelectedSlot(slot)}
                              className={`w-full h-full ${slot.color} text-white rounded-lg p-2 text-left hover:opacity-90 transition-opacity ${
                                isCurrentSlot(slot) ? "ring-2 ring-yellow-400 ring-offset-1" : ""
                              }`}
                            >
                              <p className="text-xs font-medium truncate">{slot.subject}</p>
                              <p className="text-xs opacity-80 truncate">{slot.room}</p>
                            </button>
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
        /* Day View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          {/* Day Selector */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5, 6].map(day => (
              <button
                key={day}
                onClick={() => setCurrentDay(day)}
                className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  currentDay === day
                    ? "bg-blue-600 text-white"
                    : day === new Date().getDay()
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {days[day]}
                {day === new Date().getDay() && (
                  <span className="ml-1 text-xs">({language === "VI" ? "Hôm nay" : "Today"})</span>
                )}
              </button>
            ))}
          </div>

          {/* Day Schedule */}
          <div className="space-y-3">
            {getTodaySchedule().length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {language === "VI" ? "Không có tiết học" : "No classes"}
              </div>
            ) : (
              getTodaySchedule().map(slot => (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl hover:shadow-md transition-shadow ${
                    isCurrentSlot(slot) ? "ring-2 ring-blue-500 bg-blue-50" : "bg-gray-50"
                  }`}
                >
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{slot.startTime}</p>
                    <p className="text-sm text-gray-500">{slot.endTime}</p>
                  </div>
                  <div className={`w-1 h-16 rounded-full ${slot.color}`} />
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900">{slot.subject}</h3>
                    <p className="text-sm text-gray-600">{slot.teacher}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm">
                      {slot.room}
                    </span>
                    {isCurrentSlot(slot) && (
                      <span className="block mt-1 text-xs text-blue-600 font-medium">
                        {language === "VI" ? "Đang diễn ra" : "In Progress"}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Slot Detail Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className={`inline-block px-3 py-1 rounded-full text-sm text-white mb-2 ${selectedSlot.color}`}>
                  {days[selectedSlot.day]}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{selectedSlot.subject}</h2>
              </div>
              <button
                onClick={() => setSelectedSlot(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⏰</span>
                <div>
                  <p className="text-sm text-gray-600">{language === "VI" ? "Thời gian" : "Time"}</p>
                  <p className="font-medium text-gray-900">{selectedSlot.startTime} - {selectedSlot.endTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">👨‍🏫</span>
                <div>
                  <p className="text-sm text-gray-600">{language === "VI" ? "Giáo viên" : "Teacher"}</p>
                  <p className="font-medium text-gray-900">{selectedSlot.teacher}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚪</span>
                <div>
                  <p className="text-sm text-gray-600">{language === "VI" ? "Phòng học" : "Room"}</p>
                  <p className="font-medium text-gray-900">{selectedSlot.room}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                {language === "VI" ? "Xem tài liệu" : "View Materials"}
              </button>
              <button
                onClick={() => setSelectedSlot(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {language === "VI" ? "Đóng" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
