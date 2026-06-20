"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { apiFetch } from "../../../../lib/api";
import { loadScopedClasses, resolveMyTeacherId } from "../../../../lib/teacher-context";

interface PermissionSlip {
  id: string;
  title: string;
  description?: string;
  activityDate?: string;
  dueDate?: string;
  classId?: string;
  centerId?: string;
  status: "OPEN" | "CLOSED";
  createdAt: string;
}

interface SlipResponse {
  id: string;
  slipId: string;
  studentId: string;
  parentId?: string;
  response: "YES" | "NO";
  comment?: string;
  respondedAt: string;
}

interface ClassRow {
  id: string;
  name?: string;
  className?: string;
}

/**
 * Teacher / staff console for managing permission slips: list, create, close,
 * and inspect parent responses. Backed by /api/permission-slips on
 * academy_service. Targeting is per-class today; whole-school slips are still
 * supported by leaving classId blank.
 */
export default function TeacherPermissionSlipsPage() {
  const [slips, setSlips] = useState<PermissionSlip[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [responses, setResponses] = useState<Record<string, SlipResponse[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    activityDate: "",
    dueDate: "",
    classId: "",
  });

  const userId = (() => {
    const raw = Cookies.get("userData");
    if (!raw) return null;
    try {
      return JSON.parse(raw)?.id ?? null;
    } catch {
      return null;
    }
  })();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const teacherEntityId = await resolveMyTeacherId();
      const scopedClasses = teacherEntityId
        ? await loadScopedClasses("teacher", teacherEntityId)
        : [];
      let centerId: string | null = null;
      try {
        const raw = Cookies.get("userData");
        if (raw) centerId = JSON.parse(decodeURIComponent(raw))?.centerId ?? null;
      } catch {
        centerId = null;
      }

      const slipBatches = await Promise.all([
        ...scopedClasses.map((c) =>
          apiFetch(`/api/permission-slips?classId=${encodeURIComponent(c.id)}`, {}, { silent: true }).catch(() => [])
        ),
        ...(centerId
          ? [
              apiFetch(
                `/api/permission-slips?centerId=${encodeURIComponent(centerId)}`,
                {},
                { silent: true }
              ).catch(() => []),
            ]
          : []),
      ]);
      const merged = slipBatches.flatMap((b) => (Array.isArray(b) ? b : []));
      const byId = new Map<string, PermissionSlip>();
      for (const slip of merged) {
        if (slip?.id) byId.set(String(slip.id), slip as PermissionSlip);
      }
      const list = Array.from(byId.values());
      setSlips(list);
      setClasses(
        scopedClasses.map((c) => ({
          id: c.id,
          name: c.className,
          className: c.className,
        }))
      );
    } catch (e: any) {
      setError(e?.message || "Could not load slips.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function loadResponses(slipId: string) {
    if (responses[slipId]) return;
    try {
      const data = await apiFetch(`/api/permission-slips/${slipId}/responses`);
      setResponses((r) => ({ ...r, [slipId]: Array.isArray(data) ? data : [] }));
    } catch {
      setResponses((r) => ({ ...r, [slipId]: [] }));
    }
  }

  async function createSlip(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setCreating(true);
    try {
      const body = {
        title: form.title.trim(),
        description: form.description || null,
        activityDate: form.activityDate || null,
        dueDate: form.dueDate || null,
        classId: form.classId || null,
        createdBy: userId,
        status: "OPEN",
      };
      await apiFetch("/api/permission-slips", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setShowForm(false);
      setForm({ title: "", description: "", activityDate: "", dueDate: "", classId: "" });
      await load();
    } catch (e: any) {
      setError(e?.message || "Could not create slip.");
    } finally {
      setCreating(false);
    }
  }

  async function toggleStatus(slip: PermissionSlip) {
    const next = slip.status === "OPEN" ? "CLOSED" : "OPEN";
    try {
      await apiFetch(`/api/permission-slips/${slip.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...slip, status: next }),
      });
      await load();
    } catch (e: any) {
      setError(e?.message || "Could not update slip.");
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/dashboard/teacher" className="text-sm text-blue-700 hover:underline">
            ← Teacher dashboard
          </Link>
          <h1 className="text-2xl font-semibold mt-1">Permission Slips</h1>
          <p className="text-gray-600 text-sm">
            Send consent forms to parents and track who's replied.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-1.5 text-sm rounded-lg border bg-white hover:bg-gray-50">
            Refresh
          </button>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            {showForm ? "Cancel" : "+ New slip"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>
      )}

      {showForm && (
        <form onSubmit={createSlip} className="bg-white rounded-xl border p-5 mb-6 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="e.g. Field trip to the science museum"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Logistics, cost, what to bring…"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Activity date</label>
              <input
                type="datetime-local"
                value={form.activityDate}
                onChange={(e) => setForm((f) => ({ ...f, activityDate: e.target.value }))}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reply due by</label>
              <input
                type="datetime-local"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select
                value={form.classId}
                onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">Whole school</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.className || c.name || c.id}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded border bg-white hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !form.title.trim()}
              className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create slip"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading…</div>
      ) : slips.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-xl border">
          No permission slips yet. Click "New slip" to create the first one.
        </div>
      ) : (
        <div className="space-y-3">
          {slips.map((slip) => {
            const list = responses[slip.id];
            const yes = list?.filter((r) => r.response === "YES").length ?? 0;
            const no = list?.filter((r) => r.response === "NO").length ?? 0;
            return (
              <details
                key={slip.id}
                className="bg-white rounded-xl border p-4 group"
                onToggle={(e) => {
                  if ((e.currentTarget as HTMLDetailsElement).open) loadResponses(slip.id);
                }}
              >
                <summary className="flex items-center justify-between cursor-pointer">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{slip.title}</h2>
                    <div className="text-xs text-gray-500 flex gap-3 mt-1">
                      {slip.activityDate && (
                        <span>Activity: {new Date(slip.activityDate).toLocaleString()}</span>
                      )}
                      {slip.dueDate && (
                        <span>Due: {new Date(slip.dueDate).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        slip.status === "OPEN"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {slip.status}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleStatus(slip);
                      }}
                      className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-50"
                    >
                      {slip.status === "OPEN" ? "Close" : "Reopen"}
                    </button>
                  </div>
                </summary>

                <div className="mt-4 border-t pt-4">
                  {slip.description && (
                    <p className="text-sm text-gray-700 whitespace-pre-line mb-3">
                      {slip.description}
                    </p>
                  )}
                  <div className="text-sm text-gray-700 mb-2">
                    Responses: <span className="text-emerald-700 font-medium">{yes} approved</span>
                    {" · "}
                    <span className="text-rose-700 font-medium">{no} declined</span>
                  </div>
                  {!list ? (
                    <div className="text-xs text-gray-500">Loading responses…</div>
                  ) : list.length === 0 ? (
                    <div className="text-xs text-gray-500">No responses yet.</div>
                  ) : (
                    <ul className="text-sm divide-y border rounded">
                      {list.map((r) => (
                        <li key={r.id} className="px-3 py-2 flex items-center justify-between">
                          <span className="font-mono text-xs text-gray-500">{r.studentId.slice(0, 8)}…</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              r.response === "YES"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {r.response}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(r.respondedAt).toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
