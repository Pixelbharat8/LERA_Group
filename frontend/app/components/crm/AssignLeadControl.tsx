"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";

/**
 * Assign a lead to a staff member (who then owns the reply). PUT /api/leads/{id} with
 * { assignedTo } — the backend notifies the assignee. Loads eligible staff from /api/users.
 */

const LEAD_ROLES = new Set([
  "CHAIRMAN", "CEO", "DIRECTOR", "SUPER_ADMIN", "SUPERADMIN", "ADMIN",
  "CENTER_MANAGER", "CENTER_ADMIN", "ACADEMIC_MANAGER", "MARKETING", "STAFF", "ACCOUNTANT",
]);

export default function AssignLeadControl({
  leadId,
  currentAssignedTo,
  onAssigned,
}: {
  leadId: string;
  currentAssignedTo?: string;
  onAssigned?: (userId: string) => void;
}) {
  const [users, setUsers] = useState<{ id: string; name: string; role: string }[]>([]);
  const [value, setValue] = useState(currentAssignedTo || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const raw: any[] = await apiFetch("/api/users").catch(() => []);
      setUsers(
        (Array.isArray(raw) ? raw : [])
          .map((u) => ({
            id: String(u.id),
            name: u.fullname || u.fullName || u.name || u.email || "User",
            role: String(u.roleName || u.role?.name || u.role || "").toUpperCase(),
          }))
          .filter((u) => LEAD_ROLES.has(u.role)),
      );
    })();
  }, []);

  const assign = async (userId: string) => {
    setValue(userId);
    if (!userId) return;
    setSaving(true);
    setMsg("");
    try {
      await apiFetch(`/api/leads/${leadId}`, { method: "PUT", body: JSON.stringify({ assignedTo: userId }) });
      setMsg("✅ Assigned — they've been notified.");
      onAssigned?.(userId);
    } catch (e: any) {
      setMsg("⚠️ " + (e?.message || "Assign failed"));
    }
    setSaving(false);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Assign to (who replies)</label>
      <select
        value={value}
        onChange={(e) => assign(e.target.value)}
        disabled={saving}
        className="w-full border rounded-lg px-3 py-2 text-sm"
      >
        <option value="">— Unassigned —</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
        ))}
      </select>
      {msg && <p className="text-xs text-gray-600 mt-1">{msg}</p>}
    </div>
  );
}
