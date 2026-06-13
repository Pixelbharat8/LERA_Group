"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

type Employee = {
  id: string;
  fullname?: string;
  name?: string;
  email: string;
  phone?: string;
  position?: string;
  title?: string;
  departmentId?: string;
  centerId?: string;
  status?: string;
  roleName?: string;
  reportsTo?: string;
  orgLevel?: number;
  directReports?: string[];
  createdAt?: string;
};

type Department = {
  id: string;
  name?: string;
  departmentName?: string;
};

type Center = {
  id: string;
  name: string;
};

const ORG_LEVELS = [
  { level: 1, name: "Chairman/Board", color: "from-purple-600 to-purple-700", icon: "👑" },
  { level: 2, name: "C-Level (CEO, CFO, COO)", color: "from-blue-600 to-blue-700", icon: "🎯" },
  { level: 3, name: "Director", color: "from-indigo-500 to-indigo-600", icon: "👔" },
  { level: 4, name: "Manager/Head", color: "from-green-500 to-green-600", icon: "📊" },
  { level: 5, name: "Team Lead/Supervisor", color: "from-yellow-500 to-yellow-600", icon: "👨‍💼" },
  { level: 6, name: "Senior Staff", color: "from-orange-500 to-orange-600", icon: "⭐" },
  { level: 7, name: "Staff/Employee", color: "from-gray-500 to-gray-600", icon: "👤" },
];

export default function OrgStructurePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    orgLevel: 7,
    reportsTo: "",
    position: "",
    departmentId: "",
    centerId: ""
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<number | "all">("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [activeView, setActiveView] = useState<"list" | "hierarchy" | "chart">("list");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, departmentsData, centersData] = await Promise.all([
        apiFetch("/api/users").catch(() => []),
        apiFetch("/api/departments").catch(() => []),
        apiFetch("/api/centers").catch(() => [])
      ]);

      const users = Array.isArray(usersData) ? usersData : [];
      
      // Filter out students and parents - only show staff/employees
      const excludedRoles = ["STUDENT", "PARENT", "GUARDIAN"];
      
      const staffUsers = users.filter((u: any) => {
        // Check multiple role fields that might exist
        const roleName = (u.roleName || u.role || "").toUpperCase();
        const position = (u.position || u.title || "").toUpperCase();
        
        // Exclude if any role field contains student or parent
        if (excludedRoles.some(r => roleName.includes(r))) return false;
        if (excludedRoles.some(r => position.includes(r))) return false;
        
        // Also check if the user has a role object with name
        if (u.roleObj?.name && excludedRoles.some(r => u.roleObj.name.toUpperCase().includes(r))) return false;
        
        return true;
      });
      
      // Assign org levels based on role if not set
      const enrichedUsers = staffUsers.map((u: Employee) => ({
        ...u,
        orgLevel: u.orgLevel || getDefaultOrgLevel(u.roleName || u.position || ""),
      }));
      
      setEmployees(enrichedUsers);
      setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
      setCenters(Array.isArray(centersData) ? centersData : []);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const getDefaultOrgLevel = (role: string): number => {
    const r = role.toLowerCase();
    if (r.includes("chairman") || r.includes("board")) return 1;
    if (r.includes("ceo") || r.includes("cfo") || r.includes("coo") || r.includes("cto")) return 2;
    if (r.includes("director")) return 3;
    if (r.includes("manager") || r.includes("head")) return 4;
    if (r.includes("lead") || r.includes("supervisor")) return 5;
    if (r.includes("senior")) return 6;
    return 7;
  };

  const openEditModal = (employee: Employee) => {
    setForm({
      orgLevel: employee.orgLevel || 7,
      reportsTo: employee.reportsTo || "",
      position: employee.position || employee.title || "",
      departmentId: employee.departmentId || "",
      centerId: employee.centerId || ""
    });
    setSelectedEmployee(employee);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selectedEmployee) return;

    setSaving(true);
    try {
      await apiFetch(`/api/users/${selectedEmployee.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...selectedEmployee,
          orgLevel: form.orgLevel,
          reportsTo: form.reportsTo || null,
          position: form.position,
          departmentId: form.departmentId || null,
          centerId: form.centerId || null
        })
      });
      alert("Employee updated successfully!");
      setShowModal(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to update employee");
    } finally {
      setSaving(false);
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

  const getManagerName = (managerId?: string) => {
    if (!managerId) return "-";
    const manager = employees.find(e => e.id === managerId);
    return manager?.fullname || manager?.name || manager?.email || "-";
  };

  const getDirectReportsCount = (employeeId: string) => {
    return employees.filter(e => e.reportsTo === employeeId).length;
  };

  const getDirectReports = (employeeId: string) => {
    return employees.filter(e => e.reportsTo === employeeId);
  };

  const getLevelInfo = (level?: number) => {
    return ORG_LEVELS.find(l => l.level === level) || ORG_LEVELS[ORG_LEVELS.length - 1];
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      (emp.fullname || emp.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.position || emp.title || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === "all" || emp.orgLevel === filterLevel;
    const matchesDepartment = filterDepartment === "all" || emp.departmentId === filterDepartment;
    return matchesSearch && matchesLevel && matchesDepartment;
  });

  // Group employees by org level for hierarchy view
  const employeesByLevel = ORG_LEVELS.map(level => ({
    ...level,
    employees: employees.filter(e => e.orgLevel === level.level)
  }));

  // Stats
  const stats = {
    total: employees.length,
    byLevel: ORG_LEVELS.map(l => ({
      level: l.level,
      name: l.name,
      count: employees.filter(e => e.orgLevel === l.level).length
    })),
    withManager: employees.filter(e => e.reportsTo).length,
    withoutManager: employees.filter(e => !e.reportsTo).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/chairman" className="hover:text-blue-600">Chairman Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">Organization Structure</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">🏢 Organization Structure & Reporting</h1>
          <p className="text-gray-500">Manage employee hierarchy, org levels, and reporting relationships</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {ORG_LEVELS.map(level => (
          <div key={level.level} className={`bg-gradient-to-br ${level.color} rounded-xl p-4 text-white`}>
            <div className="text-2xl mb-1">{level.icon}</div>
            <p className="text-xs opacity-80">{level.name}</p>
            <p className="text-2xl font-bold">{stats.byLevel.find(s => s.level === level.level)?.count || 0}</p>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">👥</div>
            <div>
              <p className="text-sm text-gray-500">Total Employees</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-2xl">✅</div>
            <div>
              <p className="text-sm text-gray-500">With Manager Assigned</p>
              <p className="text-3xl font-bold text-green-600">{stats.withManager}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center text-2xl">⚠️</div>
            <div>
              <p className="text-sm text-gray-500">Without Manager</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.withoutManager}</p>
            </div>
          </div>
        </div>
      </div>

      {/* View Tabs & Filters */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b flex">
          <button
            onClick={() => setActiveView("list")}
            className={`px-6 py-4 font-medium transition-colors ${activeView === "list" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            📋 List View
          </button>
          <button
            onClick={() => setActiveView("hierarchy")}
            className={`px-6 py-4 font-medium transition-colors ${activeView === "hierarchy" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            🗂️ Hierarchy View
          </button>
          <button
            onClick={() => setActiveView("chart")}
            className={`px-6 py-4 font-medium transition-colors ${activeView === "chart" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            📊 Org Chart
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
                value={filterLevel === "all" ? "all" : filterLevel}
                onChange={(e) => setFilterLevel(e.target.value === "all" ? "all" : Number(e.target.value))}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Levels</option>
                {ORG_LEVELS.map(level => (
                  <option key={level.level} value={level.level}>{level.icon} {level.name}</option>
                ))}
              </select>
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
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : activeView === "hierarchy" ? (
            <div className="space-y-6">
              {employeesByLevel.filter(level => level.employees.length > 0).map(level => (
                <div key={level.level} className="border rounded-xl overflow-hidden">
                  <div className={`bg-gradient-to-r ${level.color} px-6 py-4 text-white flex items-center gap-3`}>
                    <span className="text-2xl">{level.icon}</span>
                    <div>
                      <h3 className="text-lg font-bold">Level {level.level}: {level.name}</h3>
                      <p className="text-sm opacity-80">{level.employees.length} employee(s)</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {level.employees.map(emp => (
                      <div key={emp.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 bg-gradient-to-br ${level.color} rounded-full flex items-center justify-center text-white font-bold`}>
                            {(emp.fullname || emp.name || "?")[0].toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{emp.fullname || emp.name}</h4>
                            <p className="text-sm text-gray-500">{emp.position || emp.title || emp.roleName}</p>
                          </div>
                          <button
                            onClick={() => openEditModal(emp)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit"
                          >
                            ✏️
                          </button>
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Reports to:</span>
                            <span className="font-medium">{getManagerName(emp.reportsTo)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Direct Reports:</span>
                            <span className="font-medium text-blue-600">{getDirectReportsCount(emp.id)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Department:</span>
                            <span className="font-medium">{getDepartmentName(emp.departmentId)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : activeView === "chart" ? (
            <div className="space-y-8">
              {/* Simple Org Chart visualization */}
              {employeesByLevel.filter(level => level.employees.length > 0).map(level => (
                <div key={level.level} className="text-center">
                  <div className={`inline-block bg-gradient-to-r ${level.color} text-white px-4 py-2 rounded-lg mb-4`}>
                    {level.icon} Level {level.level}: {level.name}
                  </div>
                  <div className="flex flex-wrap justify-center gap-4">
                    {level.employees.map(emp => (
                      <div key={emp.id} className="relative">
                        <div 
                          className="bg-white border-2 border-gray-200 rounded-xl p-4 w-48 hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => openEditModal(emp)}
                        >
                          <div className={`w-12 h-12 mx-auto bg-gradient-to-br ${level.color} rounded-full flex items-center justify-center text-white font-bold text-lg mb-2`}>
                            {(emp.fullname || emp.name || "?")[0].toUpperCase()}
                          </div>
                          <h4 className="font-semibold text-gray-900 text-sm">{emp.fullname || emp.name}</h4>
                          <p className="text-xs text-gray-500">{emp.position || emp.title || emp.roleName}</p>
                          {getDirectReportsCount(emp.id) > 0 && (
                            <div className="mt-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {getDirectReportsCount(emp.id)} direct report(s)
                            </div>
                          )}
                        </div>
                        {/* Connection line to reports */}
                        {getDirectReportsCount(emp.id) > 0 && (
                          <div className="absolute left-1/2 bottom-0 w-0.5 h-4 bg-gray-300 transform translate-y-full -translate-x-1/2"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Org Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reports To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Direct Reports</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Center</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        No employees found
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map(emp => {
                      const levelInfo = getLevelInfo(emp.orgLevel);
                      const directReportsCount = getDirectReportsCount(emp.id);
                      return (
                        <tr key={emp.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 bg-gradient-to-br ${levelInfo.color} rounded-full flex items-center justify-center text-white font-bold`}>
                                {(emp.fullname || emp.name || "?")[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{emp.fullname || emp.name}</p>
                                <p className="text-sm text-gray-500">{emp.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-white text-sm bg-gradient-to-r ${levelInfo.color}`}>
                              {levelInfo.icon} L{emp.orgLevel}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-gray-900">{emp.position || emp.title || "-"}</p>
                            <p className="text-xs text-gray-500">{emp.roleName}</p>
                          </td>
                          <td className="px-6 py-4">
                            {emp.reportsTo ? (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-900">{getManagerName(emp.reportsTo)}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {directReportsCount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                👥 {directReportsCount}
                              </span>
                            ) : (
                              <span className="text-gray-400">0</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-600">{getDepartmentName(emp.departmentId)}</td>
                          <td className="px-6 py-4 text-gray-600">{getCenterName(emp.centerId)}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => openEditModal(emp)}
                              className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Edit Organization Details</h2>
                <p className="text-sm text-gray-500">{selectedEmployee.fullname || selectedEmployee.name}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-800 text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Level</label>
                <select
                  value={form.orgLevel}
                  onChange={(e) => setForm({ ...form, orgLevel: Number(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {ORG_LEVELS.map(level => (
                    <option key={level.level} value={level.level}>
                      {level.icon} Level {level.level}: {level.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {getLevelInfo(form.orgLevel).name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reports To (Manager)</label>
                <select
                  value={form.reportsTo}
                  onChange={(e) => setForm({ ...form, reportsTo: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Manager (Top Level)</option>
                  {employees
                    .filter(e => e.id !== selectedEmployee.id && (e.orgLevel || 7) < form.orgLevel)
                    .sort((a, b) => (a.orgLevel || 7) - (b.orgLevel || 7))
                    .map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {getLevelInfo(emp.orgLevel).icon} {emp.fullname || emp.name} - {emp.position || emp.roleName}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position/Title</label>
                <input
                  type="text"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>

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

              {/* Direct Reports Preview */}
              {getDirectReportsCount(selectedEmployee.id) > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Direct Reports ({getDirectReportsCount(selectedEmployee.id)})
                  </h4>
                  <div className="space-y-2">
                    {getDirectReports(selectedEmployee.id).map(report => (
                      <div key={report.id} className="flex items-center gap-2 text-sm">
                        <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 text-xs font-bold">
                          {(report.fullname || report.name || "?")[0].toUpperCase()}
                        </div>
                        <span>{report.fullname || report.name}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">{report.position || report.roleName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                  {saving ? "Saving..." : "Save Changes"}
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
