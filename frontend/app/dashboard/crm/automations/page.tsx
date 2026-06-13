"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

interface CrmAutomation {
  id: string;
  name: string;
  description?: string;
  triggerType: string;
  actionType: string;
  isActive: boolean;
  conditions?: string;
  createdAt?: string;
}

const TRIGGER_TYPES = [
  { value: "LEAD_CREATED", label: "New Lead Created", icon: "➕" },
  { value: "STATUS_CHANGED", label: "Lead Status Changed", icon: "🔄" },
  { value: "NO_ACTIVITY", label: "No Activity (Days)", icon: "⏰" },
  { value: "TAG_ADDED", label: "Tag Added", icon: "🏷️" },
  { value: "FOLLOWUP_DUE", label: "Follow-up Due", icon: "📞" },
];

const ACTION_TYPES = [
  { value: "SEND_EMAIL", label: "Send Email", icon: "📧" },
  { value: "SEND_SMS", label: "Send SMS", icon: "💬" },
  { value: "CREATE_TASK", label: "Create Task", icon: "📋" },
  { value: "ASSIGN_LEAD", label: "Assign Lead", icon: "👤" },
  { value: "ADD_TAG", label: "Add Tag", icon: "🏷️" },
  { value: "UPDATE_STATUS", label: "Update Status", icon: "🔄" },
  { value: "NOTIFY_TEAM", label: "Notify Team", icon: "🔔" },
];

export default function CrmAutomationsPage() {
  const [automations, setAutomations] = useState<CrmAutomation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<CrmAutomation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    triggerType: "LEAD_CREATED",
    actionType: "SEND_EMAIL",
    isActive: true,
    conditions: "",
  });

  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    setError(null);
    try {
      const data = await apiFetch("/api/crm-automations");
      setAutomations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching automations:", err);
      setError("Failed to load automations.");
      setAutomations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      if (editingAutomation) {
        await apiFetch(`/api/crm-automations/${editingAutomation.id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
      } else {
        await apiFetch("/api/crm-automations", {
          method: "POST",
          body: JSON.stringify(formData),
        });
      }
      setShowModal(false);
      setEditingAutomation(null);
      setFormData({ name: "", description: "", triggerType: "LEAD_CREATED", actionType: "SEND_EMAIL", isActive: true, conditions: "" });
      fetchAutomations();
    } catch (err) {
      console.error("Error saving automation:", err);
      setError("Failed to save automation.");
    }
  };

  const handleToggleActive = async (automation: CrmAutomation) => {
    setError(null);
    try {
      await apiFetch(`/api/crm-automations/${automation.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...automation, isActive: !automation.isActive }),
      });
      fetchAutomations();
    } catch (err) {
      console.error("Error toggling automation:", err);
      setError("Failed to update automation status.");
    }
  };

  const handleEdit = (automation: CrmAutomation) => {
    setEditingAutomation(automation);
    setFormData({
      name: automation.name,
      description: automation.description || "",
      triggerType: automation.triggerType,
      actionType: automation.actionType,
      isActive: automation.isActive,
      conditions: automation.conditions || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this automation?")) return;
    setError(null);
    try {
      await apiFetch(`/api/crm-automations/${id}`, { method: "DELETE" });
      fetchAutomations();
    } catch (err) {
      console.error("Error deleting automation:", err);
      setError("Failed to delete automation.");
    }
  };

  const getTriggerInfo = (type: string) => TRIGGER_TYPES.find(t => t.value === type) || { label: type, icon: "⚡" };
  const getActionInfo = (type: string) => ACTION_TYPES.find(a => a.value === type) || { label: type, icon: "🔧" };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/crm" className="hover:text-blue-600">CRM</Link>
            <span>/</span>
            <span className="text-gray-900">Automations</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">⚡ CRM Automations</h1>
          <p className="text-gray-500">Automate your lead management workflows</p>
        </div>
        <button
          onClick={() => { setEditingAutomation(null); setFormData({ name: "", description: "", triggerType: "LEAD_CREATED", actionType: "SEND_EMAIL", isActive: true, conditions: "" }); setShowModal(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Create Automation
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">⚡</div>
            <div>
              <p className="text-2xl font-bold">{automations.length}</p>
              <p className="text-sm text-gray-500">Total Automations</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">✅</div>
            <div>
              <p className="text-2xl font-bold text-green-600">{automations.filter(a => a.isActive).length}</p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">⏸️</div>
            <div>
              <p className="text-2xl font-bold text-gray-500">{automations.filter(a => !a.isActive).length}</p>
              <p className="text-sm text-gray-500">Paused</p>
            </div>
          </div>
        </div>
      </div>

      {/* Automations List */}
      <div className="bg-white rounded-xl shadow-sm">
        {automations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No automations created yet. Create your first automation to streamline your workflow!
          </div>
        ) : (
          <div className="divide-y">
            {automations.map((automation) => {
              const trigger = getTriggerInfo(automation.triggerType);
              const action = getActionInfo(automation.actionType);
              return (
                <div key={automation.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${automation.isActive ? "bg-green-100" : "bg-gray-100"}`}>
                        ⚡
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{automation.name}</h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${automation.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                            {automation.isActive ? "Active" : "Paused"}
                          </span>
                        </div>
                        <p className="text-gray-500 text-sm mt-1">{automation.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <span className="flex items-center gap-1 text-blue-600">
                            <span>{trigger.icon}</span> {trigger.label}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="flex items-center gap-1 text-green-600">
                            <span>{action.icon}</span> {action.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(automation)}
                        className={`px-3 py-1 rounded-lg text-sm ${automation.isActive ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" : "bg-green-100 text-green-800 hover:bg-green-200"}`}
                      >
                        {automation.isActive ? "Pause" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleEdit(automation)}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(automation.id)}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded-lg text-sm hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">{editingAutomation ? "Edit Automation" : "Create Automation"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Automation Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="e.g., Welcome Email Sequence"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg h-20 resize-none"
                  placeholder="What does this automation do?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Trigger (When)</label>
                <select
                  value={formData.triggerType}
                  onChange={(e) => setFormData({ ...formData, triggerType: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  {TRIGGER_TYPES.map((trigger) => (
                    <option key={trigger.value} value={trigger.value}>
                      {trigger.icon} {trigger.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Action (Then)</label>
                <select
                  value={formData.actionType}
                  onChange={(e) => setFormData({ ...formData, actionType: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  {ACTION_TYPES.map((action) => (
                    <option key={action.value} value={action.value}>
                      {action.icon} {action.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm">Activate immediately</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setShowModal(false); setEditingAutomation(null); }}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {editingAutomation ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
