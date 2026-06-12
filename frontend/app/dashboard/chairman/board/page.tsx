"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

type BoardMember = {
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
  expertise?: string[];
  linkedIn?: string;
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

const BOARD_POSITIONS = [
  "Chairman",
  "Vice Chairman", 
  "Board Director",
  "Executive Director",
  "Non-Executive Director",
  "Independent Director",
  "Advisory Board Member",
  "Board Secretary",
  "Treasurer"
];

export default function BoardManagementPage() {
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [allUsers, setAllUsers] = useState<BoardMember[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedMember, setSelectedMember] = useState<BoardMember | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    fullname: "",
    email: "",
    phone: "",
    position: "Board Director",
    department: "",
    departmentId: "",
    centerId: "",
    bio: "",
    expertise: "",
    linkedIn: "",
    status: "ACTIVE"
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterPosition, setFilterPosition] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

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

      // Filter board members (CHAIRMAN, DIRECTOR roles or users with board positions)
      const boardRoles = ["CHAIRMAN", "DIRECTOR", "BOARD_MEMBER", "BOARD"];
      const board = users.filter((u: BoardMember) => 
        boardRoles.some(role => u.roleName?.toUpperCase().includes(role)) ||
        BOARD_POSITIONS.some(pos => u.position?.toLowerCase().includes(pos.toLowerCase()))
      );
      setBoardMembers(board);

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
      position: "Board Director",
      department: "",
      departmentId: "",
      centerId: "",
      bio: "",
      expertise: "",
      linkedIn: "",
      status: "ACTIVE"
    });
    setModalMode("add");
    setSelectedMember(null);
    setShowModal(true);
  };

  const openEditModal = (member: BoardMember) => {
    setForm({
      fullname: member.fullname || member.name || "",
      email: member.email || "",
      phone: member.phone || "",
      position: member.position || member.title || "Board Director",
      department: member.department || "",
      departmentId: member.departmentId || "",
      centerId: member.centerId || "",
      bio: member.bio || "",
      expertise: member.expertise?.join(", ") || "",
      linkedIn: member.linkedIn || "",
      status: member.status || "ACTIVE"
    });
    setModalMode("edit");
    setSelectedMember(member);
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
        expertise: form.expertise ? form.expertise.split(",").map(e => e.trim()) : [],
        linkedIn: form.linkedIn,
        status: form.status,
        roleName: "DIRECTOR"
      };

      if (modalMode === "edit" && selectedMember) {
        await apiFetch(`/api/users/${selectedMember.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        alert("Board member updated successfully!");
      } else {
        await apiFetch("/api/users", {
          method: "POST",
          body: JSON.stringify({
            ...payload,
            password: "Board@123",
            username: form.email.split("@")[0]
          })
        });
        alert("Board member added successfully!");
      }

      setShowModal(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to save board member");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this board member?")) return;
    try {
      await apiFetch(`/api/users/${id}`, { method: "DELETE" });
      alert("Board member removed!");
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    }
  };

  const handleToggleStatus = async (member: BoardMember) => {
    const newStatus = member.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    if (!confirm(`Change board member status from ${member.status} to ${newStatus}?`)) return;
    try {
      await apiFetch(`/api/users/${member.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...member, status: newStatus }),
      });
      await fetchData();
    } catch (err) {
      console.error("Error updating status:", err);
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

  const filteredMembers = boardMembers.filter(member => {
    const matchesSearch = 
      (member.fullname || member.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = filterPosition === "all" || 
      (member.position || member.title || "").toLowerCase().includes(filterPosition.toLowerCase());
    return matchesSearch && matchesPosition;
  });

  const getPositionColor = (position?: string) => {
    if (!position) return "bg-gray-100 text-gray-800";
    const pos = position.toLowerCase();
    if (pos.includes("chairman")) return "bg-purple-100 text-purple-800";
    if (pos.includes("vice")) return "bg-blue-100 text-blue-800";
    if (pos.includes("executive")) return "bg-green-100 text-green-800";
    if (pos.includes("independent")) return "bg-orange-100 text-orange-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/chairman" className="hover:text-blue-600">Chairman Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">Board Management</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">🏛️ Board of Directors</h1>
          <p className="text-gray-500">Manage board members, directors, and executive leadership</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          ➕ Add Board Member
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Board Members</p>
              <p className="text-3xl font-bold mt-1">{boardMembers.length}</p>
            </div>
            <div className="text-4xl opacity-80">👔</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Executive Directors</p>
              <p className="text-3xl font-bold mt-1">
                {boardMembers.filter(m => (m.position || m.title || "").toLowerCase().includes("executive")).length}
              </p>
            </div>
            <div className="text-4xl opacity-80">⭐</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Active Members</p>
              <p className="text-3xl font-bold mt-1">
                {boardMembers.filter(m => m.status === "ACTIVE").length}
              </p>
            </div>
            <div className="text-4xl opacity-80">✅</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Independent Directors</p>
              <p className="text-3xl font-bold mt-1">
                {boardMembers.filter(m => (m.position || m.title || "").toLowerCase().includes("independent")).length}
              </p>
            </div>
            <div className="text-4xl opacity-80">🔷</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Positions</option>
              {BOARD_POSITIONS.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Board Members Grid */}
      <div className="bg-white rounded-xl shadow-sm">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-5xl mb-4">🏛️</div>
            <p className="text-lg font-medium">No board members found</p>
            <p className="text-sm">Add board members to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredMembers.map((member) => (
              <div key={member.id} className="border rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {(member.fullname || member.name || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">{member.fullname || member.name}</h3>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${getPositionColor(member.position || member.title)}`}>
                      {member.position || member.title || "Board Member"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(member)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Remove"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>📧</span>
                    <span>{member.email}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <span>📱</span>
                      <span>{member.phone}</span>
                    </div>
                  )}
                  {member.departmentId && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <span>🏢</span>
                      <span>{getDepartmentName(member.departmentId)}</span>
                    </div>
                  )}
                  {member.centerId && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <span>📍</span>
                      <span>{getCenterName(member.centerId)}</span>
                    </div>
                  )}
                </div>

                {member.bio && (
                  <p className="mt-3 text-sm text-gray-500 line-clamp-2">{member.bio}</p>
                )}

                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <button
                    onClick={() => handleToggleStatus(member)}
                    className={`px-2 py-1 text-xs rounded-full cursor-pointer hover:opacity-80 ${member.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                    {member.status || "ACTIVE"}
                  </button>
                  {member.linkedIn && (
                    <a href={member.linkedIn} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">
                      LinkedIn →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {modalMode === "add" ? "➕ Add Board Member" : "✏️ Edit Board Member"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-800 text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={form.fullname}
                    onChange={(e) => setForm({ ...form, fullname: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <select
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    {BOARD_POSITIONS.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
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
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select Center</option>
                    {centers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Brief biography..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expertise (comma separated)</label>
                  <input
                    type="text"
                    value={form.expertise}
                    onChange={(e) => setForm({ ...form, expertise: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Finance, Strategy, Operations"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    value={form.linkedIn}
                    onChange={(e) => setForm({ ...form, linkedIn: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="EMERITUS">Emeritus</option>
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
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? "Saving..." : modalMode === "add" ? "Add Member" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}
    </div>
  );
}
