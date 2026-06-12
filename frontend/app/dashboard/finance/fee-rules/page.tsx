"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

interface FeeRule {
  id: string;
  name: string;
  description: string;
  ruleType: "FLAT" | "PER_SESSION" | "HOURLY" | "PACKAGE" | "PERCENTAGE";
  category: "TUITION" | "MATERIAL" | "REGISTRATION" | "EXAM" | "MISC";
  amount: number;
  percentage?: number;
  currency: string;
  applicableTo: "ALL" | "NEW_STUDENT" | "RETURNING" | "SIBLING";
  minAge?: number;
  maxAge?: number;
  courseCategory?: string;
  isGlobal: boolean;
  centerId?: string;
  centerName?: string;
  isActive: boolean;
  priority: number;
  validFrom?: string;
  validTo?: string;
  createdAt: string;
}

interface Center {
  id: string;
  name: string;
}

export default function FeeRulesPage() {
  const [rules, setRules] = useState<FeeRule[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"global" | "center">("global");
  const [selectedCenter, setSelectedCenter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<FeeRule | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    ruleType: "FLAT" as FeeRule["ruleType"],
    category: "TUITION" as FeeRule["category"],
    amount: "",
    percentage: "",
    applicableTo: "ALL" as FeeRule["applicableTo"],
    minAge: "",
    maxAge: "",
    courseCategory: "",
    isGlobal: true,
    centerId: "",
    isActive: true,
    priority: "1",
    validFrom: "",
    validTo: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesData, centersData] = await Promise.all([
        apiFetch('/api/fee-rules').catch(() => []),
        apiFetch('/api/centers').catch(() => [])
      ]);

      setCenters(Array.isArray(centersData) ? centersData : []);

      if (Array.isArray(rulesData)) {
        // Map API response to our interface
        setRules(rulesData.map((rule: any) => ({
          id: rule.id,
          name: rule.name,
          description: rule.description || '',
          ruleType: rule.calculationType || 'FLAT',
          category: rule.category || 'TUITION',
          amount: rule.amount || 0,
          currency: 'VND',
          applicableTo: 'ALL',
          minAge: rule.minAge,
          maxAge: rule.maxAge,
          isGlobal: rule.scope === 'GLOBAL',
          centerId: rule.centerId,
          isActive: rule.isActive,
          priority: 1,
          validFrom: rule.effectiveFrom,
          validTo: rule.effectiveTo,
          createdAt: rule.createdAt
        })));
      } else {
        setRules([]);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const openCreateModal = () => {
    setEditingRule(null);
    setForm({
      name: "",
      description: "",
      ruleType: "FLAT",
      category: "TUITION",
      amount: "",
      percentage: "",
      applicableTo: "ALL",
      minAge: "",
      maxAge: "",
      courseCategory: "",
      isGlobal: activeTab === "global",
      centerId: selectedCenter !== "all" ? selectedCenter : "",
      isActive: true,
      priority: "1",
      validFrom: "",
      validTo: ""
    });
    setShowModal(true);
  };

  const openEditModal = (rule: FeeRule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name,
      description: rule.description || "",
      ruleType: rule.ruleType,
      category: rule.category,
      amount: rule.amount.toString(),
      percentage: rule.percentage?.toString() || "",
      applicableTo: rule.applicableTo,
      minAge: rule.minAge?.toString() || "",
      maxAge: rule.maxAge?.toString() || "",
      courseCategory: rule.courseCategory || "",
      isGlobal: rule.isGlobal,
      centerId: rule.centerId || "",
      isActive: rule.isActive,
      priority: rule.priority.toString(),
      validFrom: rule.validFrom || "",
      validTo: rule.validTo || ""
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount) || 0,
        percentage: form.percentage ? parseFloat(form.percentage) : null,
        minAge: form.minAge ? parseInt(form.minAge) : null,
        maxAge: form.maxAge ? parseInt(form.maxAge) : null,
        priority: parseInt(form.priority) || 1
      };

      if (editingRule) {
        await apiFetch(`/api/fee-rules/${editingRule.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch("/api/fee-rules", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }
      await fetchData();
      setShowModal(false);
    } catch (err) {
      console.error("Error saving rule:", err);
      alert("Failed to save rule");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this fee rule?")) return;
    try {
      await apiFetch(`/api/fee-rules/${id}`, { method: "DELETE" });
      await fetchData();
    } catch (err) {
      console.error("Error deleting rule:", err);
    }
  };

  const toggleRuleStatus = async (rule: FeeRule) => {
    try {
      await apiFetch(`/api/fee-rules/${rule.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...rule, isActive: !rule.isActive })
      });
      await fetchData();
    } catch (err) {
      console.error("Error toggling rule:", err);
    }
  };

  const filteredRules = rules.filter(r => {
    if (activeTab === "global") return r.isGlobal;
    if (selectedCenter === "all") return !r.isGlobal;
    return !r.isGlobal && r.centerId === selectedCenter;
  });

  const getRuleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      FLAT: "💵 Flat Fee",
      PER_SESSION: "📅 Per Session",
      HOURLY: "⏱️ Hourly",
      PACKAGE: "📦 Package",
      PERCENTAGE: "📊 Percentage"
    };
    return labels[type] || type;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      TUITION: "bg-blue-100 text-blue-800",
      MATERIAL: "bg-green-100 text-green-800",
      REGISTRATION: "bg-purple-100 text-purple-800",
      EXAM: "bg-yellow-100 text-yellow-800",
      MISC: "bg-gray-100 text-gray-800"
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/superadmin" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/finance" className="hover:text-blue-600">Finance</Link>
            <span>/</span>
            <span className="text-gray-900">Fee Rules</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">⚙️ Fee Rule Engine</h1>
          <p className="text-gray-500">Configure global and center-specific fee rules</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ➕ Add Fee Rule
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">📋</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{rules.length}</p>
              <p className="text-sm text-gray-500">Total Rules</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">🌍</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{rules.filter(r => r.isGlobal).length}</p>
              <p className="text-sm text-gray-500">Global Rules</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">🏢</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{rules.filter(r => !r.isGlobal).length}</p>
              <p className="text-sm text-gray-500">Center Rules</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-2xl">✅</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{rules.filter(r => r.isActive).length}</p>
              <p className="text-sm text-gray-500">Active Rules</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b flex">
          <button
            onClick={() => setActiveTab("global")}
            className={`px-6 py-4 font-medium transition-colors ${activeTab === "global" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            🌍 Global Rules
          </button>
          <button
            onClick={() => setActiveTab("center")}
            className={`px-6 py-4 font-medium transition-colors ${activeTab === "center" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            🏢 Center-Specific Rules
          </button>
        </div>

        {activeTab === "center" && (
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Select Center:</label>
              <select
                value={selectedCenter}
                onChange={(e) => setSelectedCenter(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">All Centers</option>
                {centers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Rules List */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-4">📝</p>
              <p>No fee rules found</p>
              <button onClick={openCreateModal} className="mt-4 text-blue-600 hover:text-blue-800">
                Create your first fee rule
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRules.map(rule => (
                <div
                  key={rule.id}
                  className={`border rounded-xl p-5 transition-all ${rule.isActive ? "bg-white hover:shadow-md" : "bg-gray-50 opacity-60"}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-gray-900">{rule.name}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getCategoryColor(rule.category)}`}>
                          {rule.category}
                        </span>
                        {!rule.isActive && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">Inactive</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="text-gray-500">{getRuleTypeLabel(rule.ruleType)}</span>
                        {rule.ruleType === "PERCENTAGE" ? (
                          <span className="font-medium text-green-600">-{rule.percentage}%</span>
                        ) : (
                          <span className="font-medium text-blue-600">{formatCurrency(rule.amount)}</span>
                        )}
                        <span className="text-gray-500">Priority: {rule.priority}</span>
                        {rule.applicableTo !== "ALL" && (
                          <span className="text-purple-600">{rule.applicableTo.replace("_", " ")}</span>
                        )}
                        {rule.minAge && rule.maxAge && (
                          <span className="text-gray-500">Ages {rule.minAge}-{rule.maxAge}</span>
                        )}
                        {rule.centerName && (
                          <span className="text-orange-600">📍 {rule.centerName}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleRuleStatus(rule)}
                        className={`px-3 py-1 text-sm rounded-lg ${rule.isActive ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}
                      >
                        {rule.isActive ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => openEditModal(rule)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingRule ? "Edit Fee Rule" : "Create Fee Rule"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Standard Tuition - LERA Primary"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={2}
                    placeholder="Describe this fee rule..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rule Type *</label>
                  <select
                    value={form.ruleType}
                    onChange={(e) => setForm(prev => ({ ...prev, ruleType: e.target.value as FeeRule["ruleType"] }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="FLAT">Flat Fee</option>
                    <option value="PER_SESSION">Per Session</option>
                    <option value="HOURLY">Hourly</option>
                    <option value="PACKAGE">Package</option>
                    <option value="PERCENTAGE">Percentage (Discount)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value as FeeRule["category"] }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="TUITION">Tuition</option>
                    <option value="MATERIAL">Material</option>
                    <option value="REGISTRATION">Registration</option>
                    <option value="EXAM">Exam</option>
                    <option value="MISC">Miscellaneous</option>
                  </select>
                </div>

                {form.ruleType === "PERCENTAGE" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Percentage (%)</label>
                    <input
                      type="number"
                      value={form.percentage}
                      onChange={(e) => setForm(prev => ({ ...prev, percentage: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g., 10"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (VND)</label>
                    <input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g., 2000000"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Applicable To</label>
                  <select
                    value={form.applicableTo}
                    onChange={(e) => setForm(prev => ({ ...prev, applicableTo: e.target.value as FeeRule["applicableTo"] }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="ALL">All Students</option>
                    <option value="NEW_STUDENT">New Students Only</option>
                    <option value="RETURNING">Returning Students</option>
                    <option value="SIBLING">Siblings</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <input
                    type="number"
                    value={form.priority}
                    onChange={(e) => setForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="1-100 (lower = higher priority)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Age</label>
                  <input
                    type="number"
                    value={form.minAge}
                    onChange={(e) => setForm(prev => ({ ...prev, minAge: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., 5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Age</label>
                  <input
                    type="number"
                    value={form.maxAge}
                    onChange={(e) => setForm(prev => ({ ...prev, maxAge: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., 10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
                  <input
                    type="date"
                    value={form.validFrom}
                    onChange={(e) => setForm(prev => ({ ...prev, validFrom: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid To</label>
                  <input
                    type="date"
                    value={form.validTo}
                    onChange={(e) => setForm(prev => ({ ...prev, validTo: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div className="col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.isGlobal}
                      onChange={(e) => setForm(prev => ({ ...prev, isGlobal: e.target.checked }))}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Global Rule (applies to all centers)</span>
                  </label>
                </div>

                {!form.isGlobal && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Center</label>
                    <select
                      value={form.centerId}
                      onChange={(e) => setForm(prev => ({ ...prev, centerId: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Select a center...</option>
                      {centers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingRule ? "Update Rule" : "Create Rule"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
