"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../../../lib/api";

export default function ChairmanSettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSetting, setEditingSetting] = useState<any>(null);
  const [newSetting, setNewSetting] = useState({
    settingKey: "",
    settingValue: "",
    settingType: "STRING",
    category: "general",
    description: "",
    isPublic: false,
  });

  const categories = ["general", "branding", "email", "payment", "security", "features", "api"];
  const settingTypes = ["STRING", "NUMBER", "BOOLEAN", "JSON", "URL", "EMAIL"];

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/system-settings");
      setSettings(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleCreateSetting = async () => {
    try {
      await apiFetch("/api/system-settings", {
        method: "POST",
        body: JSON.stringify(newSetting),
      });
      alert("Setting created successfully!");
      setShowAddModal(false);
      setNewSetting({
        settingKey: "",
        settingValue: "",
        settingType: "STRING",
        category: "general",
        description: "",
        isPublic: false,
      });
      fetchSettings();
    } catch (error: any) {
      console.error("Error creating setting:", error);
      alert(error.message || "Error creating setting");
    }
  };

  const handleUpdateSetting = async () => {
    if (!editingSetting) return;
    try {
      await apiFetch(`/api/system-settings/${editingSetting.id}`, {
        method: "PUT",
        body: JSON.stringify(editingSetting),
      });
      alert("Setting updated successfully!");
      setShowEditModal(false);
      setEditingSetting(null);
      fetchSettings();
    } catch (error) {
      console.error("Error updating setting:", error);
      alert("Failed to update setting");
    }
  };

  const handleDeleteSetting = async (id: string) => {
    if (!confirm("Are you sure you want to delete this setting?")) return;
    try {
      await apiFetch(`/api/system-settings/${id}`, { method: "DELETE" });
      alert("Setting deleted successfully!");
      fetchSettings();
    } catch (error) {
      console.error("Error deleting setting:", error);
    }
  };

  const handleQuickUpdate = async (setting: any, newValue: string) => {
    try {
      await apiFetch(`/api/system-settings/key/${setting.settingKey}`, {
        method: "PUT",
        body: JSON.stringify({ value: newValue }),
      });
      fetchSettings();
    } catch (error) {
      console.error("Error updating setting:", error);
    }
  };

  const filteredSettings = settings.filter((setting) => {
    const matchesSearch = 
      setting.settingKey?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      setting.settingValue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      setting.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || setting.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedSettings = filteredSettings.reduce((acc: any, setting: any) => {
    const category = setting.category || "general";
    if (!acc[category]) acc[category] = [];
    acc[category].push(setting);
    return acc;
  }, {});

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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">⚙️ System Settings</h1>
          <p className="text-gray-600">Configure all system parameters and options</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>➕</span> Add New Setting
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Total Settings</p>
          <p className="text-2xl font-bold text-blue-600">{settings.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Public Settings</p>
          <p className="text-2xl font-bold text-green-600">
            {settings.filter(s => s.isPublic).length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Private Settings</p>
          <p className="text-2xl font-bold text-orange-600">
            {settings.filter(s => !s.isPublic).length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Categories</p>
          <p className="text-2xl font-bold text-purple-600">
            {Object.keys(groupedSettings).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search settings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Settings by Category */}
      <div className="space-y-6">
        {Object.entries(groupedSettings).map(([category, categorySettings]: [string, any]) => (
          <div key={category} className="bg-white rounded-xl shadow overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <h2 className="text-white font-semibold text-lg capitalize">
                {category} Settings ({categorySettings.length})
              </h2>
            </div>
            <div className="divide-y">
              {categorySettings.map((setting: any) => (
                <div key={setting.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {setting.settingKey}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          setting.isPublic ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                        }`}>
                          {setting.isPublic ? "Public" : "Private"}
                        </span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {setting.settingType || "STRING"}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm mb-2">{setting.description || "No description"}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 text-sm">Value:</span>
                        {setting.settingType === "BOOLEAN" ? (
                          <button
                            onClick={() => handleQuickUpdate(setting, setting.settingValue === "true" ? "false" : "true")}
                            className={`px-3 py-1 rounded text-sm font-medium ${
                              setting.settingValue === "true"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {setting.settingValue === "true" ? "Enabled" : "Disabled"}
                          </button>
                        ) : (
                          <span className="font-mono text-sm text-gray-800 bg-gray-50 px-2 py-1 rounded max-w-md truncate">
                            {setting.settingValue || "(empty)"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => { setEditingSetting(setting); setShowEditModal(true); }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteSetting(setting.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Setting Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">➕ Add New Setting</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Setting Key</label>
                <input
                  type="text"
                  value={newSetting.settingKey}
                  onChange={(e) => setNewSetting({ ...newSetting, settingKey: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="e.g., app_name, smtp_host"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                <textarea
                  value={newSetting.settingValue}
                  onChange={(e) => setNewSetting({ ...newSetting, settingValue: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Setting value"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newSetting.settingType}
                    onChange={(e) => setNewSetting({ ...newSetting, settingType: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {settingTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newSetting.category}
                    onChange={(e) => setNewSetting({ ...newSetting, category: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newSetting.description}
                  onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of this setting"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newSetting.isPublic}
                  onChange={(e) => setNewSetting({ ...newSetting, isPublic: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700">
                  Make this setting publicly accessible
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSetting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Setting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Setting Modal */}
      {showEditModal && editingSetting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">✏️ Edit Setting</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Setting Key</label>
                <input
                  type="text"
                  value={editingSetting.settingKey || ""}
                  disabled
                  className="w-full px-4 py-2 border rounded-lg bg-gray-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                <textarea
                  value={editingSetting.settingValue || ""}
                  onChange={(e) => setEditingSetting({ ...editingSetting, settingValue: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={editingSetting.settingType || "STRING"}
                    onChange={(e) => setEditingSetting({ ...editingSetting, settingType: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {settingTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={editingSetting.category || "general"}
                    onChange={(e) => setEditingSetting({ ...editingSetting, category: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={editingSetting.description || ""}
                  onChange={(e) => setEditingSetting({ ...editingSetting, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editIsPublic"
                  checked={editingSetting.isPublic || false}
                  onChange={(e) => setEditingSetting({ ...editingSetting, isPublic: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="editIsPublic" className="text-sm text-gray-700">
                  Make this setting publicly accessible
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => { setShowEditModal(false); setEditingSetting(null); }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSetting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
