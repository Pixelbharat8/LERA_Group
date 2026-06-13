"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { apiFetch } from "../../../../lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

type CustomField = {
  id: string;
  entityType: string;
  fieldName: string;
  fieldLabel: string;
  fieldLabelVi?: string;
  fieldType: "text" | "number" | "date" | "select" | "multiselect" | "checkbox" | "textarea" | "email" | "phone" | "url" | "file";
  options?: string[]; // For select/multiselect
  isRequired: boolean;
  isActive: boolean;
  showInTable: boolean;
  showInForm: boolean;
  sortOrder: number;
  placeholder?: string;
  defaultValue?: string;
  validationRegex?: string;
  minValue?: number;
  maxValue?: number;
  helpText?: string;
  createdAt?: string;
  updatedAt?: string;
};

// Entity types that support custom fields
const ENTITY_TYPES = [
  { key: "student", label: "Students", labelVi: "Học sinh", icon: "👨‍🎓", description: "Add custom fields to student records" },
  { key: "teacher", label: "Teachers", labelVi: "Giáo viên", icon: "👨‍🏫", description: "Add custom fields to teacher records" },
  { key: "parent", label: "Parents", labelVi: "Phụ huynh", icon: "👨‍👩‍👧", description: "Add custom fields to parent records" },
  { key: "staff", label: "Staff", labelVi: "Nhân viên", icon: "👥", description: "Add custom fields to staff records" },
  { key: "course", label: "Courses", labelVi: "Khóa học", icon: "📚", description: "Add custom fields to course records" },
  { key: "class", label: "Classes", labelVi: "Lớp học", icon: "🏫", description: "Add custom fields to class records" },
  { key: "enrollment", label: "Enrollments", labelVi: "Đăng ký", icon: "📝", description: "Add custom fields to enrollment forms" },
  { key: "payment", label: "Payments", labelVi: "Thanh toán", icon: "💰", description: "Add custom fields to payment records" },
  { key: "attendance", label: "Attendance", labelVi: "Điểm danh", icon: "✅", description: "Add custom fields to attendance records" },
  { key: "lead", label: "CRM Leads", labelVi: "Khách hàng tiềm năng", icon: "📞", description: "Add custom fields to lead records" },
  { key: "center", label: "Centers", labelVi: "Trung tâm", icon: "🏢", description: "Add custom fields to center records" },
  { key: "exam", label: "Exams", labelVi: "Bài kiểm tra", icon: "📝", description: "Add custom fields to exam records" },
];

const FIELD_TYPES = [
  { key: "text", label: "Text", icon: "Aa", description: "Single line text input" },
  { key: "textarea", label: "Text Area", icon: "📝", description: "Multi-line text input" },
  { key: "number", label: "Number", icon: "#", description: "Numeric input" },
  { key: "date", label: "Date", icon: "📅", description: "Date picker" },
  { key: "select", label: "Dropdown", icon: "▼", description: "Single selection dropdown" },
  { key: "multiselect", label: "Multi-Select", icon: "☑", description: "Multiple selection" },
  { key: "checkbox", label: "Checkbox", icon: "✓", description: "Yes/No checkbox" },
  { key: "email", label: "Email", icon: "✉", description: "Email address input" },
  { key: "phone", label: "Phone", icon: "📱", description: "Phone number input" },
  { key: "url", label: "URL", icon: "🔗", description: "Website URL input" },
  { key: "file", label: "File Upload", icon: "📎", description: "File attachment" },
];

export default function CustomFieldsPage() {
  const [language, setLanguage] = useState("EN");
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeEntity, setActiveEntity] = useState("student");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);
  
  const [newField, setNewField] = useState<Partial<CustomField>>({
    fieldName: "",
    fieldLabel: "",
    fieldLabelVi: "",
    fieldType: "text",
    options: [],
    isRequired: false,
    isActive: true,
    showInTable: true,
    showInForm: true,
    sortOrder: 0,
    placeholder: "",
    defaultValue: "",
    helpText: "",
  });
  const [optionInput, setOptionInput] = useState("");

  useEffect(() => {
    const savedLang = Cookies.get("language");
    if (savedLang) setLanguage(savedLang);
  }, []);

  useEffect(() => {
    fetchFields();
  }, [activeEntity]);

  const fetchFields = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/custom-fields/entity/${activeEntity}`);
      setFields(Array.isArray(data) ? data : []);
    } catch {
      // Try system settings fallback
      try {
        const settingsData = await apiFetch(`/api/system-settings/category/custom_fields_${activeEntity}`);
        if (Array.isArray(settingsData)) {
          const parsedFields = settingsData.map((item: any) => {
            try {
              return JSON.parse(item.settingValue);
            } catch {
              return null;
            }
          }).filter(Boolean);
          setFields(parsedFields);
        } else {
          setFields([]);
        }
      } catch {
        setFields([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveField = async () => {
    if (!newField.fieldName || !newField.fieldLabel) {
      alert(language === "VI" ? "Vui lòng điền tên trường và nhãn" : "Please fill in field name and label");
      return;
    }

    setSaving(true);
    try {
      const fieldData: CustomField = {
        id: editingField?.id || `cf_${Date.now()}`,
        entityType: activeEntity,
        fieldName: newField.fieldName!.toLowerCase().replace(/\s+/g, "_"),
        fieldLabel: newField.fieldLabel!,
        fieldLabelVi: newField.fieldLabelVi || "",
        fieldType: newField.fieldType as CustomField["fieldType"],
        options: newField.options || [],
        isRequired: newField.isRequired || false,
        isActive: newField.isActive !== false,
        showInTable: newField.showInTable !== false,
        showInForm: newField.showInForm !== false,
        sortOrder: newField.sortOrder || fields.length,
        placeholder: newField.placeholder || "",
        defaultValue: newField.defaultValue || "",
        validationRegex: newField.validationRegex || "",
        minValue: newField.minValue,
        maxValue: newField.maxValue,
        helpText: newField.helpText || "",
        createdAt: editingField?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Try custom fields API first
      const endpoint = editingField 
        ? `/api/custom-fields/${editingField.id}`
        : `/api/custom-fields`;
      
      const method = editingField ? "PUT" : "POST";
      
      try {
        await apiFetch(endpoint, {
          method,
          body: JSON.stringify(fieldData)
        });
      } catch {
        // Fallback to system settings
        await apiFetch("/api/system-settings", {
          method: "POST",
          body: JSON.stringify({
            settingKey: `custom_fields_${activeEntity}_${fieldData.fieldName}`,
            settingValue: JSON.stringify(fieldData),
            category: `custom_fields_${activeEntity}`,
            description: fieldData.fieldLabel
          })
        });
      }

      // Update local state
      if (editingField) {
        setFields(prev => prev.map(f => f.id === editingField.id ? fieldData : f));
      } else {
        setFields(prev => [...prev, fieldData]);
      }

      setShowAddModal(false);
      setShowEditModal(false);
      setEditingField(null);
      resetNewField();
      
    } catch (error) {
      console.error("Error saving field:", error);
      alert(language === "VI" ? "Lỗi khi lưu trường" : "Error saving field");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteField = async (field: CustomField) => {
    if (!confirm(language === "VI" 
      ? `Bạn có chắc muốn xóa trường "${field.fieldLabel}"?` 
      : `Are you sure you want to delete "${field.fieldLabel}"?`)) {
      return;
    }

    try {
      await apiFetch(`/api/custom-fields/${field.id}`, { method: "DELETE" }).catch(() => {});
      await apiFetch(`/api/system-settings/key/custom_fields_${activeEntity}_${field.fieldName}`, { method: "DELETE" }).catch(() => {});
      setFields(prev => prev.filter(f => f.id !== field.id));
    } catch (error) {
      console.error("Error deleting field:", error);
    }
  };

  const handleToggleActive = async (field: CustomField) => {
    const updatedField = { ...field, isActive: !field.isActive };
    setFields(prev => prev.map(f => f.id === field.id ? updatedField : f));
    
    try {
      await apiFetch(`/api/custom-fields/${field.id}`, {
        method: "PUT",
        body: JSON.stringify(updatedField)
      });
    } catch (error) {
      console.error("Error toggling field:", error);
    }
  };

  const resetNewField = () => {
    setNewField({
      fieldName: "",
      fieldLabel: "",
      fieldLabelVi: "",
      fieldType: "text",
      options: [],
      isRequired: false,
      isActive: true,
      showInTable: true,
      showInForm: true,
      sortOrder: 0,
      placeholder: "",
      defaultValue: "",
      helpText: "",
    });
    setOptionInput("");
  };

  const handleEditField = (field: CustomField) => {
    setEditingField(field);
    setNewField({
      ...field
    });
    setShowEditModal(true);
  };

  const addOption = () => {
    if (optionInput.trim()) {
      setNewField(prev => ({
        ...prev,
        options: [...(prev.options || []), optionInput.trim()]
      }));
      setOptionInput("");
    }
  };

  const removeOption = (index: number) => {
    setNewField(prev => ({
      ...prev,
      options: (prev.options || []).filter((_, i) => i !== index)
    }));
  };

  const filteredFields = fields.filter(f => 
    f.fieldLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.fieldName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentEntity = ENTITY_TYPES.find(e => e.key === activeEntity);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {language === "VI" ? "🛠️ Quản Lý Trường Tùy Chỉnh" : "🛠️ Custom Fields Management"}
        </h1>
        <p className="text-gray-600 mt-1">
          {language === "VI"
            ? "Thêm cột và trường mới vào bất kỳ biểu mẫu hoặc bảng nào"
            : "Add new columns and fields to any form or table"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
              🛠️
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{fields.length}</p>
              <p className="text-sm text-gray-600">{language === "VI" ? "Tổng trường" : "Total Fields"}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">
              ✅
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{fields.filter(f => f.isActive).length}</p>
              <p className="text-sm text-gray-600">{language === "VI" ? "Đang hoạt động" : "Active"}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-xl">
              📋
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{fields.filter(f => f.showInForm).length}</p>
              <p className="text-sm text-gray-600">{language === "VI" ? "Trong biểu mẫu" : "In Forms"}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-xl">
              📊
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{fields.filter(f => f.showInTable).length}</p>
              <p className="text-sm text-gray-600">{language === "VI" ? "Trong bảng" : "In Tables"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Entity Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-4">
              {language === "VI" ? "Chọn đối tượng" : "Select Entity"}
            </h2>
            <div className="space-y-2">
              {ENTITY_TYPES.map(entity => (
                <button
                  key={entity.key}
                  onClick={() => setActiveEntity(entity.key)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    activeEntity === entity.key
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <span className="text-xl">{entity.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {language === "VI" ? entity.labelVi : entity.label}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {fields.filter(f => f.entityType === entity.key).length || 0} {language === "VI" ? "trường" : "fields"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Entity Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 mb-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{currentEntity?.icon}</span>
                <div>
                  <h2 className="text-xl font-bold">
                    {language === "VI" ? currentEntity?.labelVi : currentEntity?.label}
                  </h2>
                  <p className="text-blue-100 text-sm">{currentEntity?.description}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  resetNewField();
                  setShowAddModal(true);
                }}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                + {language === "VI" ? "Thêm trường mới" : "Add New Field"}
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={language === "VI" ? "Tìm kiếm trường..." : "Search fields..."}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              </div>
            </div>
          </div>

          {/* Fields List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin text-4xl mb-2">⏳</div>
                {language === "VI" ? "Đang tải..." : "Loading..."}
              </div>
            ) : filteredFields.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">📭</div>
                <p>{language === "VI" ? "Chưa có trường tùy chỉnh nào" : "No custom fields yet"}</p>
                <button
                  onClick={() => {
                    resetNewField();
                    setShowAddModal(true);
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {language === "VI" ? "Tạo trường đầu tiên" : "Create First Field"}
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredFields.map((field, index) => (
                  <div key={field.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg">
                            {FIELD_TYPES.find(t => t.key === field.fieldType)?.icon || "📝"}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{field.fieldLabel}</h3>
                            {field.isRequired && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                                {language === "VI" ? "Bắt buộc" : "Required"}
                              </span>
                            )}
                            {!field.isActive && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                {language === "VI" ? "Ẩn" : "Hidden"}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                            <code className="px-1 bg-gray-100 rounded text-xs">{field.fieldName}</code>
                            <span>•</span>
                            <span>{FIELD_TYPES.find(t => t.key === field.fieldType)?.label}</span>
                            {field.showInTable && <span>• 📊 Table</span>}
                            {field.showInForm && <span>• 📋 Form</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(field)}
                          className={`p-2 rounded-lg transition-colors ${
                            field.isActive 
                              ? "bg-green-100 text-green-700 hover:bg-green-200" 
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                          title={field.isActive ? "Deactivate" : "Activate"}
                        >
                          {field.isActive ? "✅" : "⭕"}
                        </button>
                        <button
                          onClick={() => handleEditField(field)}
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteField(field)}
                          className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    {field.options && field.options.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {field.options.map((opt, i) => (
                          <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingField 
                    ? (language === "VI" ? "Chỉnh sửa trường" : "Edit Field")
                    : (language === "VI" ? "Thêm trường mới" : "Add New Field")}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setEditingField(null);
                    resetNewField();
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === "VI" ? "Tên trường (ID)" : "Field Name (ID)"} *
                  </label>
                  <input
                    type="text"
                    value={newField.fieldName}
                    onChange={(e) => setNewField(prev => ({ ...prev, fieldName: e.target.value.toLowerCase().replace(/\s+/g, "_") }))}
                    placeholder="e.g., emergency_contact"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {language === "VI" ? "Chỉ chữ thường và dấu gạch dưới" : "Lowercase letters and underscores only"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === "VI" ? "Loại trường" : "Field Type"} *
                  </label>
                  <select
                    value={newField.fieldType}
                    onChange={(e) => setNewField(prev => ({ ...prev, fieldType: e.target.value as CustomField["fieldType"] }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {FIELD_TYPES.map(type => (
                      <option key={type.key} value={type.key}>
                        {type.icon} {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Labels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === "VI" ? "Nhãn (English)" : "Label (English)"} *
                  </label>
                  <input
                    type="text"
                    value={newField.fieldLabel}
                    onChange={(e) => setNewField(prev => ({ ...prev, fieldLabel: e.target.value }))}
                    placeholder="e.g., Emergency Contact"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === "VI" ? "Nhãn (Tiếng Việt)" : "Label (Vietnamese)"}
                  </label>
                  <input
                    type="text"
                    value={newField.fieldLabelVi}
                    onChange={(e) => setNewField(prev => ({ ...prev, fieldLabelVi: e.target.value }))}
                    placeholder="e.g., Liên hệ khẩn cấp"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Options for Select/Multiselect */}
              {(newField.fieldType === "select" || newField.fieldType === "multiselect") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === "VI" ? "Tùy chọn" : "Options"}
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addOption())}
                      placeholder={language === "VI" ? "Thêm tùy chọn..." : "Add option..."}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={addOption}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(newField.options || []).map((opt, index) => (
                      <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {opt}
                        <button
                          onClick={() => removeOption(index)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Placeholder & Default */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === "VI" ? "Placeholder" : "Placeholder"}
                  </label>
                  <input
                    type="text"
                    value={newField.placeholder}
                    onChange={(e) => setNewField(prev => ({ ...prev, placeholder: e.target.value }))}
                    placeholder="e.g., Enter contact number..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === "VI" ? "Giá trị mặc định" : "Default Value"}
                  </label>
                  <input
                    type="text"
                    value={newField.defaultValue}
                    onChange={(e) => setNewField(prev => ({ ...prev, defaultValue: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Number Min/Max */}
              {newField.fieldType === "number" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === "VI" ? "Giá trị tối thiểu" : "Min Value"}
                    </label>
                    <input
                      type="number"
                      value={newField.minValue || ""}
                      onChange={(e) => setNewField(prev => ({ ...prev, minValue: e.target.value ? Number(e.target.value) : undefined }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === "VI" ? "Giá trị tối đa" : "Max Value"}
                    </label>
                    <input
                      type="number"
                      value={newField.maxValue || ""}
                      onChange={(e) => setNewField(prev => ({ ...prev, maxValue: e.target.value ? Number(e.target.value) : undefined }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Help Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === "VI" ? "Văn bản trợ giúp" : "Help Text"}
                </label>
                <textarea
                  value={newField.helpText}
                  onChange={(e) => setNewField(prev => ({ ...prev, helpText: e.target.value }))}
                  rows={2}
                  placeholder={language === "VI" ? "Mô tả giúp người dùng hiểu trường này..." : "Description to help users understand this field..."}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newField.isRequired}
                    onChange={(e) => setNewField(prev => ({ ...prev, isRequired: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {language === "VI" ? "Bắt buộc" : "Required"}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newField.isActive}
                    onChange={(e) => setNewField(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {language === "VI" ? "Kích hoạt" : "Active"}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newField.showInTable}
                    onChange={(e) => setNewField(prev => ({ ...prev, showInTable: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {language === "VI" ? "Hiện trong bảng" : "Show in Table"}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newField.showInForm}
                    onChange={(e) => setNewField(prev => ({ ...prev, showInForm: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {language === "VI" ? "Hiện trong form" : "Show in Form"}
                  </span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setEditingField(null);
                  resetNewField();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {language === "VI" ? "Hủy" : "Cancel"}
              </button>
              <button
                onClick={handleSaveField}
                disabled={saving || !newField.fieldName || !newField.fieldLabel}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {saving 
                  ? (language === "VI" ? "Đang lưu..." : "Saving...") 
                  : (language === "VI" ? "Lưu trường" : "Save Field")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
