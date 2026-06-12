"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

type Director = {
  id: string;
  fullname?: string;
  name?: string;
  email: string;
  phone?: string;
  position?: string;
  title?: string;
  department?: string;
  departmentId?: string;
  centerId?: string;
  status?: string;
  joinDate?: string;
  bio?: string;
  responsibilities?: string[];
  reportsTo?: string;
  directReports?: number;
  salary?: number;
  photoUrl?: string;
  roleName?: string;
  createdAt?: string;
};

type Center = {
  id: string;
  name: string;
};

type Department = {
  id: string;
  name?: string;
  departmentName?: string;
};

// Default titles - will be overridden by API data
const DEFAULT_DIRECTOR_TITLES = [
  "Managing Director",
  "Executive Director",
  "Director of Operations",
  "Director of Finance",
  "Director of HR",
  "Director of Marketing",
  "Director of Technology",
  "Director of Sales",
  "Director of Education",
  "Regional Director",
  "Center Director",
  "Academic Director",
  "Creative Director",
  "Program Director"
];

export default function DirectorsPage() {
  const [directors, setDirectors] = useState<Director[]>([]);
  const [allUsers, setAllUsers] = useState<Director[]>([]);
  const [directorTitles, setDirectorTitles] = useState<string[]>(DEFAULT_DIRECTOR_TITLES);
  const [centers, setCenters] = useState<Center[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedDirector, setSelectedDirector] = useState<Director | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    fullname: "",
    email: "",
    phone: "",
    position: "Director of Operations",
    departmentId: "",
    centerId: "",
    bio: "",
    responsibilities: "",
    reportsTo: "",
    status: "ACTIVE"
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterCenter, setFilterCenter] = useState("all");
  const [activeTab, setActiveTab] = useState<"grid" | "org-chart">("grid");

  useEffect(() => {
    fetchDirectorTitles();
    fetchData();
  }, []);

  // Fetch director position options from system settings
  const fetchDirectorTitles = async () => {
    try {
      const data = await apiFetch("/api/system-settings/category/dropdown_director_positions");
      if (Array.isArray(data) && data.length > 0) {
        const titles = data.map((item: any) => item.settingValue || item.label).filter(Boolean);
        if (titles.length > 0) {
          setDirectorTitles(titles);
        }
      }
    } catch (error) {
      console.log("Using default director titles");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, centersData, departmentsData] = await Promise.all([
        apiFetch("/api/users").catch(() => []),
        apiFetch("/api/centers").catch(() => []),
        apiFetch("/api/departments").catch(() => [])
      ]);

      const users = Array.isArray(usersData) ? usersData : [];
      setAllUsers(users);

      // Filter directors
      const directorRoles = ["DIRECTOR", "MANAGER", "HEAD"];
      const directorList = users.filter((u: Director) => 
        directorRoles.some(role => u.roleName?.toUpperCase().includes(role)) ||
        directorTitles.some(title => (u.position || u.title || "").toLowerCase().includes(title.toLowerCase().replace("director of ", "")))
      );
      setDirectors(directorList);

      setCenters(Array.isArray(centersData) ? centersData : []);
      setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setForm({
      fullname: "",
      email: "",
      phone: "",
      position: "Director of Operations",
      departmentId: "",
      centerId: "",
      bio: "",
      responsibilities: "",
      reportsTo: "",
      status: "ACTIVE"
    });
    setModalMode("add");
    setSelectedDirector(null);
    setShowModal(true);
  };

  const openEditModal = (director: Director) => {
    setForm({
      fullname: director.fullname || director.name || "",
      email: director.email || "",
      phone: director.phone || "",
      position: director.position || director.title || "Director of Operations",
      departmentId: director.departmentId || "",
      centerId: director.centerId || "",
      bio: director.bio || "",
      responsibilities: director.responsibilities?.join(", ") || "",
      reportsTo: director.reportsTo || "",
      status: director.status || "ACTIVE"
    });
    setModalMode("edit");
    setSelectedDirector(director);
    setShowModal(true);
  };

  const openViewModal = (director: Director) => {
    setSelectedDirector(director);
    setModalMode("view");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.fullname || !form.email) {
      alert("Name and email are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fullname: form.fullname,
        email: form.email,
        phone: form.phone,
        position: form.position,
        title: form.position,
        departmentId: form.departmentId || null,
        centerId: form.centerId || null,
        bio: form.bio,
        responsibilities: form.responsibilities ? form.responsibilities.split(",").map(r => r.trim()) : [],
        reportsTo: form.reportsTo,
        status: form.status,
        roleName: "DIRECTOR"
      };

      if (modalMode === "edit" && selectedDirector) {
        await apiFetch(`/api/users/${selectedDirector.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        alert("Director updated successfully!");
      } else {
        await apiFetch("/api/users", {
          method: "POST",
          body: JSON.stringify({
            ...payload,
            password: "Director@123",
            username: form.email.split("@")[0]
          })
        });
        alert("Director added successfully!");
      }

      setShowModal(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to save director");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this director?")) return;
    try {
      await apiFetch(`/api/users/${id}`, { method: "DELETE" });
      alert("Director removed!");
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    }
  };

  const getDepartmentName = (deptId?: string) => {
    if (!deptId) return "-";
    const dept = departments.find(d => d.id === deptId);
    return dept?.departmentName || dept?.name || "-";
  };

  const getCenterName = (centerId?: string) => {
    if (!centerId) return "-";
    return centers.find(c => c.id === centerId)?.name || "-";
  };

  const filteredDirectors = directors.filter(director => {
    const matchesSearch = 
      (director.fullname || director.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      director.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (director.position || director.title || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === "all" || director.departmentId === filterDepartment;
    const matchesCenter = filterCenter === "all" || director.centerId === filterCenter;
    return matchesSearch && matchesDepartment && matchesCenter;
  });

  const getPositionIcon = (position?: string) => {
    if (!position) return "👤";
    const pos = position.toLowerCase();
    if (pos.includes("managing") || pos.includes("executive")) return "👔";
    if (pos.includes("finance")) return "💰";
    if (pos.includes("hr") || pos.includes("human")) return "👥";
    if (pos.includes("technology") || pos.includes("tech") || pos.includes("it")) return "💻";
    if (pos.includes("marketing")) return "📢";
    if (pos.includes("sales")) return "📈";
    if (pos.includes("education") || pos.includes("academic")) return "📚";
    if (pos.includes("operation")) return "⚙️";
    if (pos.includes("regional") || pos.includes("center")) return "🏢";
    return "🎯";
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800";
      case "INACTIVE": return "bg-gray-100 text-gray-800";
      case "ON_LEAVE": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Group directors by department for org chart view
  const directorsByDepartment = departments.map(dept => ({
    department: dept,
    directors: directors.filter(d => d.departmentId === dept.id)
  })).filter(group => group.directors.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/chairman" className="hover:text-blue-600">Chairman Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">Directors</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">👔 Director Management</h1>
          <p className="text-gray-500">Manage directors, department heads, and leadership team</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          ➕ Add Director
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Directors</p>
              <p className="text-3xl font-bold mt-1">{directors.length}</p>
            </div>
            <div className="text-4xl opacity-80">👔</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Active Directors</p>
              <p className="text-3xl font-bold mt-1">
                {directors.filter(d => d.status === "ACTIVE").length}
              </p>
            </div>
            <div className="text-4xl opacity-80">✅</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Departments Covered</p>
              <p className="text-3xl font-bold mt-1">
                {new Set(directors.map(d => d.departmentId).filter(Boolean)).size}
              </p>
            </div>
            <div className="text-4xl opacity-80">🏢</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Centers Managed</p>
              <p className="text-3xl font-bold mt-1">
                {new Set(directors.map(d => d.centerId).filter(Boolean)).size}
              </p>
            </div>
            <div className="text-4xl opacity-80">📍</div>
          </div>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b flex">
          <button
            onClick={() => setActiveTab("grid")}
            className={`px-6 py-4 font-medium transition-colors ${activeTab === "grid" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            📊 Grid View
          </button>
          <button
            onClick={() => setActiveTab("org-chart")}
            className={`px-6 py-4 font-medium transition-colors ${activeTab === "org-chart" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            🗂️ By Department
          </button>
        </div>

        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search by name, email, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.departmentName || dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filterCenter}
                onChange={(e) => setFilterCenter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Centers</option>
                {centers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : activeTab === "org-chart" ? (
            <div className="space-y-8">
              {directorsByDepartment.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-5xl mb-4">🏢</div>
                  <p>No directors assigned to departments yet</p>
                </div>
              ) : (
                directorsByDepartment.map(group => (
                  <div key={group.department.id} className="border rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
                      <h3 className="text-lg font-bold">{group.department.departmentName || group.department.name}</h3>
                      <p className="text-blue-100 text-sm">{group.directors.length} director(s)</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                      {group.directors.map(director => (
                        <div key={director.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                              {getPositionIcon(director.position || director.title)}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{director.fullname || director.name}</h4>
                              <p className="text-sm text-gray-500">{director.position || director.title}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <button onClick={() => openViewModal(director)} className="text-blue-600 text-sm hover:underline">View</button>
                            <button onClick={() => openEditModal(director)} className="text-green-600 text-sm hover:underline">Edit</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : filteredDirectors.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-5xl mb-4">👔</div>
              <p className="text-lg font-medium">No directors found</p>
              <p className="text-sm">Add directors to build your leadership team</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDirectors.map((director) => (
                <div key={director.id} className="border rounded-xl p-6 hover:shadow-lg transition-shadow bg-white">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl">
                      {getPositionIcon(director.position || director.title)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900">{director.fullname || director.name}</h3>
                      <p className="text-blue-600 font-medium text-sm">{director.position || director.title || "Director"}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span>📧</span>
                      <span className="truncate">{director.email}</span>
                    </div>
                    {director.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <span>📱</span>
                        <span>{director.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <span>🏢</span>
                      <span>{getDepartmentName(director.departmentId)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span>📍</span>
                      <span>{getCenterName(director.centerId)}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(director.status)}`}>
                      {director.status || "ACTIVE"}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openViewModal(director)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="View"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => openEditModal(director)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(director.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Remove"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit/View Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {modalMode === "add" ? "➕ Add Director" : modalMode === "edit" ? "✏️ Edit Director" : "👔 Director Profile"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-800 text-xl">✕</button>
            </div>

            {modalMode === "view" && selectedDirector ? (
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-3xl">
                    {getPositionIcon(selectedDirector.position || selectedDirector.title)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedDirector.fullname || selectedDirector.name}</h3>
                    <p className="text-blue-600 font-medium">{selectedDirector.position || selectedDirector.title}</p>
                    <span className={`inline-block mt-2 px-3 py-1 text-sm rounded-full ${getStatusBadge(selectedDirector.status)}`}>
                      {selectedDirector.status || "ACTIVE"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedDirector.email}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{selectedDirector.phone || "-"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Department</p>
                    <p className="font-medium">{getDepartmentName(selectedDirector.departmentId)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Center</p>
                    <p className="font-medium">{getCenterName(selectedDirector.centerId)}</p>
                  </div>
                </div>

                {selectedDirector.bio && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-2">Biography</p>
                    <p className="text-gray-700">{selectedDirector.bio}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => { setModalMode("edit"); openEditModal(selectedDirector); }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Edit Director
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={form.fullname}
                      onChange={(e) => setForm({ ...form, fullname: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position/Title</label>
                    <select
                      value={form.position}
                      onChange={(e) => setForm({ ...form, position: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {directorTitles.map(title => (
                        <option key={title} value={title}>{title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select
                      value={form.departmentId}
                      onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.departmentName || dept.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Center</label>
                    <select
                      value={form.centerId}
                      onChange={(e) => setForm({ ...form, centerId: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Center</option>
                      {centers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reports To</label>
                  <select
                    value={form.reportsTo}
                    onChange={(e) => setForm({ ...form, reportsTo: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Superior</option>
                    {allUsers.filter(u => u.id !== selectedDirector?.id).map(u => (
                      <option key={u.id} value={u.id}>{u.fullname || u.name || u.email}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Brief biography..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Responsibilities (comma separated)</label>
                  <input
                    type="text"
                    value={form.responsibilities}
                    onChange={(e) => setForm({ ...form, responsibilities: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Budget oversight, Team management, Strategic planning"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ON_LEAVE">On Leave</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : modalMode === "add" ? "Add Director" : "Save Changes"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}
    </div>
  );
}
