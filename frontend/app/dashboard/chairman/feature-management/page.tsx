"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

// Feature registry — keep in sync with UserPermissionDTO (identity_service) and
// PermissionContext. `stateKey` is what the GET returns; `putKey` is what the PUT accepts
// (note: AI assistant differs — read `aiAssistant`, write `ai_assistant`).
type Feature = { stateKey: string; putKey: string; label: string };

const MODULES: Feature[] = [
  { stateKey: "dashboard", putKey: "dashboard", label: "Dashboard" },
  { stateKey: "centers", putKey: "centers", label: "Centers" },
  { stateKey: "users", putKey: "users", label: "Users & Roles" },
  { stateKey: "students", putKey: "students", label: "Students" },
  { stateKey: "teachers", putKey: "teachers", label: "Teachers" },
  { stateKey: "classes", putKey: "classes", label: "Classes" },
  { stateKey: "courses", putKey: "courses", label: "Courses" },
  { stateKey: "attendance", putKey: "attendance", label: "Attendance" },
  { stateKey: "payments", putKey: "payments", label: "Payments / Finance" },
  { stateKey: "payroll", putKey: "payroll", label: "Payroll" },
  { stateKey: "reports", putKey: "reports", label: "Reports" },
  { stateKey: "settings", putKey: "settings", label: "Settings" },
  { stateKey: "aiAssistant", putKey: "ai_assistant", label: "AI Assistant" },
  { stateKey: "communication", putKey: "communication", label: "Communication" },
  { stateKey: "documents", putKey: "documents", label: "Documents" },
];

const SERVICES: Feature[] = [
  { stateKey: "academyServiceEnabled", putKey: "academyServiceEnabled", label: "Academy Service" },
  { stateKey: "paymentServiceEnabled", putKey: "paymentServiceEnabled", label: "Payment Service" },
  { stateKey: "attendanceServiceEnabled", putKey: "attendanceServiceEnabled", label: "Attendance Service" },
  { stateKey: "payrollServiceEnabled", putKey: "payrollServiceEnabled", label: "Payroll Service" },
  { stateKey: "connectServiceEnabled", putKey: "connectServiceEnabled", label: "Connect Service" },
  { stateKey: "aiGatewayEnabled", putKey: "aiGatewayEnabled", label: "AI Gateway" },
];

// Roles that always have full access (never gated) — mirrors PermissionContext god-mode list.
const GOD_MODE_ROLES = ["CHAIRMAN", "CEO", "SUPER_ADMIN", "SUPERADMIN", "ADMIN", "DIRECTOR"];

type UserRow = { id: string; name: string; email: string; role: string };

export default function FeatureManagementPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [perms, setPerms] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch("/api/users").catch(() => []);
        const rows = Array.isArray(data) ? data : (data as any)?.content || [];
        setUsers(
          rows.map((u: any) => ({
            id: String(u.id),
            name: u.fullname || u.fullName || u.name || u.email || "User",
            email: u.email || "",
            role: String(u.roleName || u.role?.name || u.role || "").toUpperCase(),
          }))
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectUser = async (u: UserRow) => {
    setSelected(u);
    setMsg(null);
    setLoadingPerms(true);
    setPerms({});
    try {
      const p = (await apiFetch(`/api/user-permissions/user/${u.id}`).catch(() => ({}))) as any;
      const next: Record<string, boolean> = {};
      [...MODULES, ...SERVICES].forEach((f) => {
        // API returns aiAssistant; everything else matches stateKey.
        next[f.stateKey] = Boolean(p?.[f.stateKey] ?? (f.stateKey === "aiAssistant" ? p?.ai_assistant : undefined));
      });
      setPerms(next);
    } finally {
      setLoadingPerms(false);
    }
  };

  const toggle = (key: string) => setPerms((prev) => ({ ...prev, [key]: !prev[key] }));

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    setMsg(null);
    try {
      const body: Record<string, boolean> = {};
      [...MODULES, ...SERVICES].forEach((f) => {
        body[f.putKey] = Boolean(perms[f.stateKey]);
      });
      await apiFetch(`/api/user-permissions/user/${selected.id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      setMsg("✓ Features updated. The user's sidebar and access update on their next page load.");
    } catch (e: any) {
      setMsg(`✗ ${e?.message || "Failed to save"}`);
    } finally {
      setSaving(false);
    }
  };

  const resetToRoleDefault = async () => {
    if (!selected) return;
    setSaving(true);
    setMsg(null);
    try {
      await apiFetch(`/api/user-permissions/user/${selected.id}/reset`, { method: "DELETE" });
      await selectUser(selected);
      setMsg("✓ Reset to the role's default features.");
    } catch (e: any) {
      setMsg(`✗ ${e?.message || "Failed to reset"}`);
    } finally {
      setSaving(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );
  const isGodMode = selected ? GOD_MODE_ROLES.includes(selected.role) : false;

  const Toggle = ({ f }: { f: Feature }) => (
    <button
      type="button"
      disabled={isGodMode}
      onClick={() => toggle(f.stateKey)}
      className={`flex items-center justify-between p-3 rounded-lg border text-left transition ${
        perms[f.stateKey] ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"
      } ${isGodMode ? "opacity-60 cursor-not-allowed" : "hover:border-blue-400"}`}
    >
      <span className="text-sm font-medium text-gray-800">{f.label}</span>
      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          perms[f.stateKey] ? "bg-blue-600" : "bg-gray-300"
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${perms[f.stateKey] ? "translate-x-6" : "translate-x-1"}`} />
      </span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/dashboard/chairman" className="text-gray-500 hover:text-gray-700">← Back</Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">🧩 Feature Management</h1>
            <p className="text-sm text-gray-500">Turn features on/off per user — the sidebar and backend access follow.</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User list */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, or role…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="divide-y divide-gray-100 max-h-[640px] overflow-y-auto">
            {loading ? (
              <p className="p-4 text-center text-gray-400 text-sm">Loading users…</p>
            ) : filtered.length === 0 ? (
              <p className="p-4 text-center text-gray-400 text-sm">No users.</p>
            ) : (
              filtered.map((u) => (
                <button
                  key={u.id}
                  onClick={() => selectUser(u)}
                  className={`w-full p-3 text-left hover:bg-gray-50 ${selected?.id === u.id ? "bg-blue-50 border-l-4 border-blue-600" : ""}`}
                >
                  <div className="font-medium text-gray-900 text-sm">{u.name}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-medium">{u.role || "—"}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Feature toggles */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
              Select a user to manage their features.
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selected.name}</h2>
                  <p className="text-sm text-gray-500">{selected.email} · {selected.role}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={resetToRoleDefault} disabled={saving || isGodMode} className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Reset to role default</button>
                  <button onClick={save} disabled={saving || isGodMode} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
                </div>
              </div>

              {isGodMode && (
                <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-2 text-sm text-yellow-800">
                  👑 {selected.role} has <b>full, ungateable access</b> (god mode). Feature toggles don't restrict this role.
                </div>
              )}
              {msg && <div className={`mb-4 rounded-lg px-4 py-2 text-sm ${msg.startsWith("✓") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{msg}</div>}

              {loadingPerms ? (
                <p className="text-center text-gray-400 py-8">Loading features…</p>
              ) : (
                <>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Modules</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                    {MODULES.map((f) => <Toggle key={f.stateKey} f={f} />)}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Backend Services</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SERVICES.map((f) => <Toggle key={f.stateKey} f={f} />)}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
