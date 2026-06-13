"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { useUserCenter, buildCenterFilterUrl } from "../../../hooks/useUserCenter";

type ClassRoom = {
  id: string;
  name: string;
  centerId?: string;
  programId?: string;
  levelId?: string;
  teacherId?: string;
  assistantTeacherId?: string;
  room?: string;
  scheduleDays?: string;
  scheduleTimeStart?: string;
  scheduleTimeEnd?: string;
  startDate?: string;
  endDate?: string;
  maxStudents?: number;
  status?: string;
  createdAt?: string;
  // Enriched
  centerName?: string;
  programName?: string;
  teacherName?: string;
  assistantTeacherName?: string;
  studentCount?: number;
};

type Teacher = {
  id: string;
  fullname?: string;
  name?: string;
  email?: string;
};

type Center = { id: string; name: string };
type Program = { id: string; name: string; programName?: string };

export default function ClassroomsPage() {
  const { centerId: userCenterId, shouldFilterByCenter, userRole, loading: userLoading } = useUserCenter();
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCenter, setFilterCenter] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTeacher, setFilterTeacher] = useState("");
  
  // Check if user can view all centers
  const canViewAllCenters = ["CHAIRMAN", "SUPERADMIN", "ADMIN", "DIRECTOR"].includes(userRole || "");

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassRoom | null>(null);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form
  const [form, setForm] = useState({
    name: "",
    centerId: "",
    programId: "",
    teacherId: "",
    assistantTeacherId: "",
    room: "",
    scheduleDays: "",
    scheduleTimeStart: "",
    scheduleTimeEnd: "",
    startDate: "",
    endDate: "",
    maxStudents: 15,
    status: "OPEN",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Build URLs with center filter for CENTER_MANAGER
      const classesUrl = shouldFilterByCenter 
        ? buildCenterFilterUrl("/api/classes", userCenterId) 
        : "/api/classes";
      const teachersUrl = shouldFilterByCenter 
        ? buildCenterFilterUrl("/api/teachers", userCenterId) 
        : "/api/teachers";
      const enrollmentsUrl = shouldFilterByCenter 
        ? buildCenterFilterUrl("/api/enrollments", userCenterId) 
        : "/api/enrollments";
      
      const [classesData, teachersData, centersData, programsData, enrollmentsData] = await Promise.all([
        apiFetch(classesUrl).catch(() => []),
        apiFetch(teachersUrl).catch(() => []),
        apiFetch("/api/centers").catch(() => []),
        apiFetch("/api/programs").catch(() => []),
        apiFetch(enrollmentsUrl).catch(() => []),
      ]);

      const teachersArr = (Array.isArray(teachersData) ? teachersData : []).filter(
        (t: any) => t.roleName === "TEACHER" || t.role?.name === "TEACHER" || t.roleId?.includes("teacher")
      );
      setTeachers(teachersArr);
      
      const centersArr = Array.isArray(centersData) ? centersData : [];
      setCenters(centersArr);
      
      const programsArr = Array.isArray(programsData) ? programsData : [];
      setPrograms(programsArr);

      const enrollmentsArr = Array.isArray(enrollmentsData) ? enrollmentsData : [];
      setEnrollments(enrollmentsArr);

      // Enrich classes with names
      const classesArr = Array.isArray(classesData) ? classesData : [];
      const enrichedClasses = classesArr.map((c: any) => {
        const teacher = teachersArr.find((t: any) => t.id === c.teacherId);
        const assistant = teachersArr.find((t: any) => t.id === c.assistantTeacherId);
        const center = centersArr.find((ct: any) => ct.id === c.centerId);
        const program = programsArr.find((p: any) => p.id === c.programId);
        const studentsInClass = enrollmentsArr.filter((e: any) => e.classId === c.id);
        
        return {
          ...c,
          teacherName: teacher?.fullname || teacher?.name || "Not Assigned",
          assistantTeacherName: assistant?.fullname || assistant?.name || "-",
          centerName: center?.name || "N/A",
          programName: program?.programName || program?.name || "N/A",
          studentCount: studentsInClass.length,
        };
      });
      
      setClasses(enrichedClasses);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading) {
      fetchData();
    }
  }, [userLoading, userCenterId]);

  const openCreateModal = () => {
    setForm({
      name: "",
      centerId: "",
      programId: "",
      teacherId: "",
      assistantTeacherId: "",
      room: "",
      scheduleDays: "",
      scheduleTimeStart: "",
      scheduleTimeEnd: "",
      startDate: "",
      endDate: "",
      maxStudents: 15,
      status: "OPEN",
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (classroom: ClassRoom) => {
    setForm({
      name: classroom.name || "",
      centerId: classroom.centerId || "",
      programId: classroom.programId || "",
      teacherId: classroom.teacherId || "",
      assistantTeacherId: classroom.assistantTeacherId || "",
      room: classroom.room || "",
      scheduleDays: classroom.scheduleDays || "",
      scheduleTimeStart: classroom.scheduleTimeStart || "",
      scheduleTimeEnd: classroom.scheduleTimeEnd || "",
      startDate: classroom.startDate || "",
      endDate: classroom.endDate || "",
      maxStudents: classroom.maxStudents || 15,
      status: classroom.status || "OPEN",
    });
    setSelectedClass(classroom);
    setIsEditing(true);
    setShowModal(true);
  };

  const openViewModal = (classroom: ClassRoom) => {
    setSelectedClass(classroom);
    setShowViewModal(true);
  };

  const openStudentsModal = async (classroom: ClassRoom) => {
    setSelectedClass(classroom);
    // Get students enrolled in this class
    const studentsInClass = enrollments.filter(e => e.classId === classroom.id);
    
    try {
      const classStudentDetails = await Promise.all(
        studentsInClass.map(async (enrollment) => {
          const student = (await apiFetch(`/api/students/${enrollment.studentId}`).catch(
            () => null
          )) as { fullname?: string; name?: string; email?: string; phone?: string } | null;
          return {
            ...enrollment,
            studentName: student?.fullname || student?.name || "Unknown",
            studentEmail: student?.email || "",
            studentPhone: student?.phone || "",
          };
        })
      );
      setClassStudents(classStudentDetails);
    } catch (error) {
      setClassStudents(studentsInClass);
    }
    
    setShowStudentsModal(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      alert("Please enter a class name");
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        ...form,
        maxStudents: Number(form.maxStudents),
        centerId: form.centerId || null,
        programId: form.programId || null,
        teacherId: form.teacherId || null,
        assistantTeacherId: form.assistantTeacherId || null,
      };

      if (isEditing && selectedClass) {
        await apiFetch(`/api/classes/${selectedClass.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        alert("Class updated successfully!");
      } else {
        await apiFetch("/api/classes", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        alert("Class created successfully!");
      }
      
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      alert(error.message || "Failed to save class");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this class?")) return;
    try {
      await apiFetch(`/api/classes/${id}`, { method: "DELETE" });
      alert("Class deleted successfully!");
      fetchData();
    } catch (error: any) {
      alert(error.message || "Failed to delete class");
    }
  };

  const handleStatusChange = async (classroom: ClassRoom, newStatus: string) => {
    try {
      await apiFetch(`/api/classes/${classroom.id}/status?status=${newStatus}`, {
        method: "PATCH",
      });
      fetchData();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  // Filter classes
  const filteredClasses = classes.filter((c) => {
    const matchesSearch = 
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.room?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.teacherName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCenter = !filterCenter || c.centerId === filterCenter;
    const matchesStatus = !filterStatus || c.status === filterStatus;
    const matchesTeacher = !filterTeacher || c.teacherId === filterTeacher;
    return matchesSearch && matchesCenter && matchesStatus && matchesTeacher;
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "OPEN": return "bg-green-100 text-green-800";
      case "IN_PROGRESS": return "bg-blue-100 text-blue-800";
      case "COMPLETED": return "bg-gray-100 text-gray-800";
      case "CANCELLED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatTime = (time?: string) => {
    if (!time) return "-";
    return time;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const weekDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/academy" className="hover:text-blue-600">Academy</Link>
            <span>/</span>
            <span className="text-gray-900">Classrooms</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">🏫 Classroom Management</h1>
          <p className="text-gray-600">Manage classes, schedules, teachers, and student assignments</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>➕</span> Create New Class
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Total Classes</p>
          <p className="text-2xl font-bold text-blue-600">{classes.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Open Classes</p>
          <p className="text-2xl font-bold text-green-600">
            {classes.filter(c => c.status === "OPEN").length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">
            {classes.filter(c => c.status === "IN_PROGRESS").length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Total Students</p>
          <p className="text-2xl font-bold text-purple-600">
            {classes.reduce((sum, c) => sum + (c.studentCount || 0), 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Avg. Class Size</p>
          <p className="text-2xl font-bold text-orange-600">
            {classes.length > 0 
              ? Math.round(classes.reduce((sum, c) => sum + (c.studentCount || 0), 0) / classes.length)
              : 0}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Search by name, room, teacher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="col-span-2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterCenter}
            onChange={(e) => setFilterCenter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Centers</option>
            {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={filterTeacher}
            onChange={(e) => setFilterTeacher(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Teachers</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.fullname || t.name}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl shadow">
            <div className="text-6xl mb-4">🏫</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Classes Found</h3>
            <p className="text-gray-500">Create your first class to get started</p>
          </div>
        ) : (
          filteredClasses.map((classroom) => (
            <div key={classroom.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">{classroom.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(classroom.status)}`}>
                    {classroom.status}
                  </span>
                </div>
                <p className="text-blue-100 text-sm mt-1">📍 {classroom.room || "No Room Assigned"}</p>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">🏢</span>
                  <span className="text-sm text-gray-600">{classroom.centerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">📚</span>
                  <span className="text-sm text-gray-600">{classroom.programName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">👨‍🏫</span>
                  <span className="text-sm text-gray-600">{classroom.teacherName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">📅</span>
                  <span className="text-sm text-gray-600">{classroom.scheduleDays || "Not Scheduled"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">⏰</span>
                  <span className="text-sm text-gray-600">
                    {formatTime(classroom.scheduleTimeStart)} - {formatTime(classroom.scheduleTimeEnd)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">👥</span>
                  <span className="text-sm text-gray-600">
                    {classroom.studentCount || 0} / {classroom.maxStudents || 15} Students
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((classroom.studentCount || 0) / (classroom.maxStudents || 15)) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="border-t p-4 flex items-center justify-between bg-gray-50">
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/academy/classes/${classroom.id}`}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                    title="Full class profile"
                  >
                    📋
                  </Link>
                  <button
                    onClick={() => openViewModal(classroom)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Quick view"
                  >
                    👁️
                  </button>
                  <button
                    onClick={() => openStudentsModal(classroom)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                    title="View Students"
                  >
                    👥
                  </button>
                  <button
                    onClick={() => openEditModal(classroom)}
                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(classroom.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
                <select
                  value={classroom.status}
                  onChange={(e) => handleStatusChange(classroom, e.target.value)}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-xl font-bold">{isEditing ? "✏️ Edit Class" : "➕ Create New Class"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-800 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. LERA Starters A1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                  <input
                    type="text"
                    value={form.room}
                    onChange={(e) => setForm({ ...form, room: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Room 101"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Center</label>
                  <select
                    value={form.centerId}
                    onChange={(e) => setForm({ ...form, centerId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Center</option>
                    {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                  <select
                    value={form.programId}
                    onChange={(e) => setForm({ ...form, programId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Program</option>
                    {programs.map(p => <option key={p.id} value={p.id}>{p.programName || p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Main Teacher</label>
                  <select
                    value={form.teacherId}
                    onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.fullname || t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assistant Teacher</label>
                  <select
                    value={form.assistantTeacherId}
                    onChange={(e) => setForm({ ...form, assistantTeacherId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Assistant</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.fullname || t.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Days</label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const days = form.scheduleDays ? form.scheduleDays.split(",") : [];
                        const idx = days.indexOf(day);
                        if (idx >= 0) {
                          days.splice(idx, 1);
                        } else {
                          days.push(day);
                        }
                        setForm({ ...form, scheduleDays: days.join(",") });
                      }}
                      className={`px-3 py-2 rounded-lg border ${
                        form.scheduleDays?.includes(day)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={form.scheduleTimeStart}
                    onChange={(e) => setForm({ ...form, scheduleTimeStart: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={form.scheduleTimeEnd}
                    onChange={(e) => setForm({ ...form, scheduleTimeEnd: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
                  <input
                    type="number"
                    value={form.maxStudents}
                    onChange={(e) => setForm({ ...form, maxStudents: Number(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    min={1}
                    max={100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? "Saving..." : (isEditing ? "Update Class" : "Create Class")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-xl font-bold">📋 Class Details</h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-gray-800 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white">
                <h2 className="text-2xl font-bold">{selectedClass.name}</h2>
                <p className="text-blue-100">{selectedClass.room || "No Room"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Center</p>
                  <p className="font-medium">{selectedClass.centerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Program</p>
                  <p className="font-medium">{selectedClass.programName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Teacher</p>
                  <p className="font-medium">{selectedClass.teacherName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Assistant</p>
                  <p className="font-medium">{selectedClass.assistantTeacherName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Schedule</p>
                  <p className="font-medium">{selectedClass.scheduleDays || "Not Set"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium">
                    {formatTime(selectedClass.scheduleTimeStart)} - {formatTime(selectedClass.scheduleTimeEnd)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium">{formatDate(selectedClass.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-medium">{formatDate(selectedClass.endDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Students</p>
                  <p className="font-medium">{selectedClass.studentCount} / {selectedClass.maxStudents}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedClass.status)}`}>
                    {selectedClass.status}
                  </span>
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Students Modal */}
      {showStudentsModal && selectedClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-xl font-bold">👥 Students in {selectedClass.name}</h3>
              <button onClick={() => setShowStudentsModal(false)} className="text-gray-500 hover:text-gray-800 text-xl">✕</button>
            </div>
            <div className="p-6">
              {classStudents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👥</div>
                  <p className="text-gray-500">No students enrolled in this class yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {classStudents.map((student, index) => (
                    <div key={student.id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                          {(student.studentName || "U")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{student.studentName}</p>
                          <p className="text-sm text-gray-500">{student.studentEmail}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{student.studentPhone || "-"}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          student.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}>
                          {student.status || "Enrolled"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-end pt-4 border-t mt-4">
                <button
                  onClick={() => setShowStudentsModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
