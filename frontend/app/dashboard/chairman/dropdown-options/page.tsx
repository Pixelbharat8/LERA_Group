"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../../../lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

type DropdownOption = {
  id: string;
  category: string;
  value: string;
  label: string;
  labelVi?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
};

const OPTION_CATEGORIES = [
  { key: "director_positions", label: "Director Positions", description: "Titles/positions for directors" },
  { key: "department_types", label: "Department Types", description: "Types of departments" },
  { key: "staff_positions", label: "Staff Positions", description: "Staff job titles" },
  { key: "leave_types", label: "Leave Types", description: "Types of leave requests" },
  { key: "contract_types", label: "Contract Types", description: "Employee contract types" },
  { key: "payment_methods", label: "Payment Methods", description: "Payment method options" },
];

// Default options for each category
const DEFAULT_OPTIONS: Record<string, string[]> = {
  director_positions: [
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
  ],
  department_types: [
    "Academic",
    "Administration",
    "Finance",
    "Marketing",
    "Human Resources",
    "IT",
    "Operations",
    "Sales"
  ],
  staff_positions: [
    "Manager",
    "Supervisor",
    "Coordinator",
    "Assistant",
    "Specialist",
    "Analyst",
    "Executive"
  ],
  leave_types: [
    "Annual Leave",
    "Sick Leave",
    "Personal Leave",
    "Maternity Leave",
    "Paternity Leave",
    "Unpaid Leave",
    "Emergency Leave"
  ],
  contract_types: [
    "Full-time",
    "Part-time",
    "Contract",
    "Freelance",
    "Internship"
  ],
  payment_methods: [
    "Cash",
    "Bank Transfer",
    "Credit Card",
    "Momo",
    "ZaloPay",
    "VNPay"
  ]
};

export default function DropdownOptionsPage() {
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("director_positions");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOption, setEditingOption] = useState<DropdownOption | null>(null);
  const [newOption, setNewOption] = useState({
    value: "",
    label: "",
    labelVi: "",
    sortOrder: 0,
    isActive: true
  });
  const [searchTerm, setSearchTerm] = useState("");

  const fetchOptions = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/system-settings/category/dropdown_${activeCategory}`);
      if (Array.isArray(data) && data.length > 0) {
        const parsedOptions = data.map((item: any, index: number) => ({
          id: item.id || String(index),
          category: activeCategory,
          value: item.settingKey?.replace(`dropdown_${activeCategory}_`, "") || item.value || "",
          label: item.settingValue || item.label || "",
          labelVi: item.description || item.labelVi || "",
          sortOrder: item.sortOrder || index,
          isActive: item.isActive !== false,
          createdAt: item.createdAt
        }));
        setOptions(parsedOptions);
      } else {
        const defaults = DEFAULT_OPTIONS[activeCategory] || [];
        setOptions(defaults.map((label, index) => ({
          id: `default_${index}`,
          category: activeCategory,
          value: label.toLowerCase().replace(/\s+/g, "_"),
          label,
          labelVi: "",
          sortOrder: index,
          isActive: true
        })));
      }
    } catch (error) {
      console.error("Failed to fetch options:", error);
      const defaults = DEFAULT_OPTIONS[activeCategory] || [];
      setOptions(defaults.map((label, index) => ({
        id: `default_${index}`,
        category: activeCategory,
        value: label.toLowerCase().replace(/\s+/g, "_"),
        label,
        labelVi: "",
        sortOrder: index,
        isActive: true
      })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, [activeCategory]);

  const handleSaveOption = async () => {
    if (!newOption.label) {
      alert("Label is required");
      return;
    }

    try {
      const settingKey = `dropdown_${activeCategory}_${newOption.label.toLowerCase().replace(/\s+/g, "_")}`;
      await apiFetch("/api/system-settings", {
        method: "POST",
        body: JSON.stringify({
          settingKey,
          settingValue: newOption.label,
          settingType: "STRING",
          category: `dropdown_${activeCategory}`,
          description: newOption.labelVi || newOption.label,
          isPublic: false
        }),
      });
      alert("Option added successfully!");
      setShowAddModal(false);
      setNewOption({ value: "", label: "", labelVi: "", sortOrder: 0, isActive: true });
      fetchOptions();
    } catch (error: any) {
      console.error("Error adding option:", error);
      alert(error.message || "Error adding option");
    }
  };

  const handleUpdateOption = async () => {
    if (!editingOption) return;
    try {
      await apiFetch(`/api/system-settings/${editingOption.id}`, {
        method: "PUT",
        body: JSON.stringify({
          settingValue: editingOption.label,
          description: editingOption.labelVi || editingOption.label,
          isActive: editingOption.isActive
        }),
      });
      alert("Option updated successfully!");
      setShowEditModal(false);
      setEditingOption(null);
      fetchOptions();
    } catch (error) {
      console.error("Error updating option:", error);
      alert("Failed to update option");
    }
  };

  const handleDeleteOption = async (option: DropdownOption) => {
    if (!confirm(`Are you sure you want to delete "${option.label}"?`)) return;
    try {
      await apiFetch(`/api/system-settings/${option.id}`, { method: "DELETE" });
      alert("Option deleted successfully!");
      fetchOptions();
    } catch (error) {
      console.error("Error deleting option:", error);
      alert("Failed to delete option");
    }
  };

  const handleInitializeDefaults = async () => {
    if (!confirm(`This will add all default options for "${OPTION_CATEGORIES.find(c => c.key === activeCategory)?.label}". Continue?`)) return;

    try {
      const defaults = DEFAULT_OPTIONS[activeCategory] || [];
      for (const label of defaults) {
        const settingKey = `dropdown_${activeCategory}_${label.toLowerCase().replace(/\s+/g, "_")}`;
        await apiFetch("/api/system-settings", {
          method: "POST",
          body: JSON.stringify({
            settingKey,
            settingValue: label,
            settingType: "STRING",
            category: `dropdown_${activeCategory}`,
            description: label,
            isPublic: false
          }),
        });
      }
      alert("Default options initialized successfully!");
      fetchOptions();
    } catch (error) {
      console.error("Error initializing defaults:", error);
      alert("Error initializing defaults");
    }
  };

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opt.labelVi?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentCategoryInfo = OPTION_CATEGORIES.find(c => c.key === activeCategory);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <span className="text-3xl">⚙️</span>
          Dropdown Options Management
        </h1>
        <p className="text-gray-600 mt-2">Manage dropdown options used across the system</p>
      </div>

      {/* Category Tabs */}
      <div className="bg-white rounded-xl shadow-sm border mb-6 overflow-hidden">
        <div className="flex flex-wrap border-b">
          {OPTION_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-6 py-4 font-medium transition-all ${
                activeCategory === cat.key
                  ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="p-4 bg-blue-50 border-b">
          <p className="text-blue-800">
            <strong>{currentCategoryInfo?.label}:</strong> {currentCategoryInfo?.description}
          </p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search options..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>+</span> Add Option
        </button>
        <button
          onClick={handleInitializeDefaults}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
        >
          <span>🔄</span> Initialize Defaults
        </button>
      </div>

      {/* Options List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : filteredOptions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-xl mb-2">No options found</p>
            <p className="text-sm">Click "Initialize Defaults" to add default options or "Add Option" to create custom ones.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Order</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Label (EN)</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Label (VI)</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredOptions.map((option, index) => (
                <tr key={option.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="text-gray-500">{index + 1}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">{option.label}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-600">{option.labelVi || "-"}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      option.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {option.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingOption(option);
                          setShowEditModal(true);
                        }}
                        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteOption(option)}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Add New Option</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label (English) *</label>
                <input
                  type="text"
                  value={newOption.label}
                  onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Director of Sales"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label (Vietnamese)</label>
                <input
                  type="text"
                  value={newOption.labelVi}
                  onChange={(e) => setNewOption({ ...newOption, labelVi: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Giám đốc Kinh doanh"
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOption}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Option
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingOption && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Edit Option</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label (English) *</label>
                <input
                  type="text"
                  value={editingOption.label}
                  onChange={(e) => setEditingOption({ ...editingOption, label: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label (Vietnamese)</label>
                <input
                  type="text"
                  value={editingOption.labelVi || ""}
                  onChange={(e) => setEditingOption({ ...editingOption, labelVi: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingOption.isActive}
                  onChange={(e) => setEditingOption({ ...editingOption, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateOption}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
