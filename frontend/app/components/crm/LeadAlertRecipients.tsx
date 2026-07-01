"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../lib/api";

/**
 * Chairman/manager control: who gets alerted (in-app + push) when a new website trial/enquiry
 * lead arrives. Saves the chosen user IDs to the `lead_alert_user_ids` CMS setting, which
 * connect_service's PublicLeadController reads on every new lead.
 */

type U = { id: string; name: string; role: string };

// Roles that can meaningfully own/answer a lead (teachers/students/parents excluded).
const LEAD_ROLES = new Set([
  "CHAIRMAN", "CEO", "DIRECTOR", "SUPER_ADMIN", "SUPERADMIN", "ADMIN",
  "CENTER_MANAGER", "CENTER_ADMIN", "ACADEMIC_MANAGER", "MARKETING", "STAFF", "ACCOUNTANT",
]);

export default function LeadAlertRecipients() {
  const [users, setUsers] = useState<U[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const rawUsers: any[] = await apiFetch("/api/users").catch(() => []);
      const mapped: U[] = (Array.isArray(rawUsers) ? rawUsers : [])
        .map((u) => ({
          id: String(u.id),
          name: u.fullname || u.fullName || u.name || u.email || "User",
          role: String(u.roleName || u.role?.name || u.role || "").toUpperCase(),
        }))
        .filter((u) => LEAD_ROLES.has(u.role));
      setUsers(mapped);

      const setting: any = await apiFetch("/api/cms-settings/key/lead_alert_user_ids").catch(() => null);
      const csv: string = setting?.settingValue || "";
      setSelected(new Set(csv.split(",").map((s) => s.trim()).filter(Boolean)));
    })();
  }, []);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      await apiFetch("/api/cms-settings/batch", {
        method: "POST",
        body: JSON.stringify({
          settings: [{ settingKey: "lead_alert_user_ids", settingValue: Array.from(selected).join(","), category: "crm" }],
        }),
      });
      setMsg("✅ Saved — these people are alerted on every new enquiry.");
    } catch (e: any) {
      setMsg("⚠️ " + (e?.message || "Save failed"));
    }
    setSaving(false);
  };

  const summary = useMemo(() => {
    if (selected.size === 0) return "No one — new enquiries won't alert anyone yet";
    return users.filter((u) => selected.has(u.id)).map((u) => u.name).join(", ") || `${selected.size} selected`;
  }, [selected, users]);

  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
          🔔 New-enquiry alerts
          <span className={`text-xs font-normal ${selected.size === 0 ? "text-red-500" : "text-gray-500"}`}>— {summary}</span>
        </span>
        <span className="text-gray-400 text-sm">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="border-t border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-3">
            Pick who gets notified (bell + push) the moment a website trial/enquiry arrives. They can then assign & reply.
          </p>
          {users.length === 0 ? (
            <p className="text-sm text-gray-400">No eligible staff found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-auto">
              {users.map((u) => (
                <label key={u.id} className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggle(u.id)} />
                  <span className="truncate">{u.name}</span>
                  <span className="ml-auto text-[10px] text-gray-400">{u.role}</span>
                </label>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 mt-3">
            <button onClick={save} disabled={saving} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Saving…" : "Save recipients"}
            </button>
            {msg && <span className="text-xs text-gray-600">{msg}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
