"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../../lib/api";

type FeeRuleType = "Per Session" | "Per Course" | "Percentage";

type FeeRule = {
  id: number;
  name: string;
  type: FeeRuleType;
  amount: number;
  status: "Active" | "Inactive";
};

export default function FeeRulesPage() {
  const [rules, setRules] = useState<FeeRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<{ name: string; type: FeeRuleType; amount: string; status: "Active" | "Inactive" }>(
    {
      name: "",
      type: "Per Session",
      amount: "",
      status: "Active",
    }
  );

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/fee-rules").catch(() => []);
      if (Array.isArray(data) && data.length > 0) {
        setRules(data.map((r: any) => ({
          id: r.id,
          name: r.name || r.ruleName,
          type: r.type || r.feeType || "Per Session",
          amount: r.amount || r.value || 0,
          status: r.status === "ACTIVE" || r.isActive ? "Active" : "Inactive",
        })));
      } else {
        // Default rules if API returns empty
        setRules([
          { id: 1, name: "Standard Course Fee", type: "Per Session", amount: 150000, status: "Active" },
          { id: 2, name: "IELTS Prep Fee", type: "Per Course", amount: 5000000, status: "Active" },
          { id: 3, name: "Early Bird Discount", type: "Percentage", amount: -10, status: "Active" },
          { id: 4, name: "Sibling Discount", type: "Percentage", amount: -15, status: "Active" },
        ]);
      }
    } catch (error) {
      console.error("Error fetching fee rules:", error);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: "", type: "Per Session", amount: "", status: "Active" });
    setIsModalOpen(true);
  };

  const openEdit = (rule: FeeRule) => {
    setEditingId(rule.id);
    setForm({
      name: rule.name,
      type: rule.type,
      amount: String(rule.amount),
      status: rule.status,
    });
    setIsModalOpen(true);
  };

  const onDelete = async (id: number) => {
    const ok = window.confirm("Delete this rule?");
    if (!ok) return;
    try {
      await apiFetch(`/api/fee-rules/${id}`, { method: "DELETE" });
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error("Error deleting rule:", error);
      setRules((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = form.name.trim();
    const amountNum = Number(form.amount);

    if (!name) {
      window.alert("Rule name is required.");
      return;
    }
    if (!Number.isFinite(amountNum)) {
      window.alert("Amount must be a number.");
      return;
    }

    try {
      if (editingId == null) {
        const response = await apiFetch("/api/fee-rules", {
          method: "POST",
          body: JSON.stringify({
            name,
            type: form.type,
            amount: amountNum,
            status: form.status === "Active" ? "ACTIVE" : "INACTIVE",
          }),
        }).catch(() => null);

        const nextId = response?.id || (rules.length ? Math.max(...rules.map((r) => r.id)) + 1 : 1);
        const newRule: FeeRule = {
          id: nextId,
          name,
          type: form.type,
          amount: amountNum,
          status: form.status,
        };
        setRules((prev) => [newRule, ...prev]);
      } else {
        await apiFetch(`/api/fee-rules/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({
            name,
            type: form.type,
            amount: amountNum,
            status: form.status === "Active" ? "ACTIVE" : "INACTIVE",
          }),
        }).catch(() => null);

        setRules((prev) =>
          prev.map((r) =>
            r.id === editingId
              ? { ...r, name, type: form.type, amount: amountNum, status: form.status }
              : r
          )
        );
      }
    } catch (error) {
      console.error("Error saving rule:", error);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/superadmin" className="hover:text-blue-600">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-gray-900">Fee Rules</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">💵 Fee Rules</h1>
          <p className="text-gray-500">Configure pricing and discount rules</p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          ➕ Add Rule
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId == null ? "Add Fee Rule" : "Edit Fee Rule"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-800"
                aria-label="Close"
              >
                ✖️
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4 px-5 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Rule Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  placeholder="e.g. Early Bird Discount"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as FeeRuleType }))}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  >
                    <option value="Per Session">Per Session</option>
                    <option value="Per Course">Per Course</option>
                    <option value="Percentage">Percentage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    value={form.amount}
                    onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    placeholder={form.type === "Percentage" ? "e.g. -10" : "e.g. 150000"}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {form.type === "Percentage" ? "Use % (negative for discount)" : "VND amount"}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as "Active" | "Inactive" }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  {editingId == null ? "Create" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rule Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rules.map((rule) => (
              <tr key={rule.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{rule.name}</td>
                <td className="px-6 py-4 text-gray-500">{rule.type}</td>
                <td className="px-6 py-4">
                  {rule.type === "Percentage" ? `${rule.amount}%` : `${rule.amount.toLocaleString()}đ`}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      rule.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {rule.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => openEdit(rule)}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(rule.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr>
                <td className="px-6 py-8 text-center text-gray-500" colSpan={5}>
                  No rules yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
