"use client";

import { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

interface PermissionSlip {
  id: string;
  title: string;
  titleVi?: string;
  description?: string;
  descriptionVi?: string;
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

interface Child {
  id: string;
  fullname: string;
  studentCode?: string;
  className?: string;
}

/**
 * Parent-facing permission slip / consent inbox.
 *
 * Lists every OPEN slip and, for each of the parent's children, shows the
 * current Yes/No (or "Not answered yet") plus a one-click toggle. Optimistic
 * UI: we POST to /api/permission-slips/{id}/respond and rebuild the local
 * map from the canonical response list when it returns.
 */
export default function ParentPermissionSlipsPage() {
  const [slips, setSlips] = useState<PermissionSlip[]>([]);
  const [responses, setResponses] = useState<SlipResponse[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // "slipId|studentId"
  const [comment, setComment] = useState<Record<string, string>>({});

  const parentId = useMemo(() => {
    const raw = Cookies.get("userData");
    if (!raw) return null;
    try {
      return JSON.parse(raw)?.id ?? null;
    } catch {
      return null;
    }
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // /me/responses derives the parent from the JWT — no client ID needed.
      // We still pass parentId (when known) to /parents/{id}/children since
      // that endpoint needs an explicit ID for the lookup.
      const [slipsData, kids, respData] = await Promise.all([
        apiFetch("/api/permission-slips?status=OPEN"),
        parentId ? apiFetch(`/api/parents/${parentId}/children`).catch(() => []) : Promise.resolve([]),
        apiFetch("/api/permission-slips/me/responses").catch(() => []),
      ]);
      const childList: Child[] = Array.isArray(kids) ? kids : kids?.children || [];
      setSlips(Array.isArray(slipsData) ? slipsData : []);
      setChildren(childList);
      setResponses(Array.isArray(respData) ? respData : []);
    } catch (e: any) {
      setError(e?.message || "Could not load permission slips.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [parentId]);

  function answerFor(slipId: string, studentId: string): SlipResponse | undefined {
    return responses.find((r) => r.slipId === slipId && r.studentId === studentId);
  }

  async function respond(slipId: string, studentId: string, value: "YES" | "NO") {
    const key = `${slipId}|${studentId}`;
    setBusy(key);
    try {
      // parentId intentionally omitted — server derives it from the JWT to
      // close the loophole where clients could record under another parent.
      await apiFetch(`/api/permission-slips/${slipId}/respond`, {
        method: "POST",
        body: JSON.stringify({
          studentId,
          response: value,
          comment: comment[key] || undefined,
        }),
      });
      const respData = await apiFetch("/api/permission-slips/me/responses").catch(() => []);
      setResponses(Array.isArray(respData) ? respData : []);
      setComment((c) => ({ ...c, [key]: "" }));
    } catch (e: any) {
      setError(e?.message || "Could not save your response.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/dashboard/parent" className="text-sm text-purple-700 hover:underline">
            ← Parent dashboard
          </Link>
          <h1 className="text-2xl font-semibold mt-1">Permission Slips</h1>
          <p className="text-gray-600 text-sm">
            Approve or decline activities the school is asking permission for.
          </p>
        </div>
        <button
          onClick={load}
          className="px-3 py-1.5 text-sm rounded-lg border bg-white hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading…</div>
      ) : slips.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-xl border">
          No open permission slips. You're all caught up.
        </div>
      ) : (
        <div className="space-y-4">
          {slips.map((slip) => (
            <div key={slip.id} className="bg-white rounded-xl border p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{slip.title}</h2>
                  {slip.description && (
                    <p className="text-gray-700 mt-1 text-sm whitespace-pre-line">{slip.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-3">
                    {slip.activityDate && (
                      <span>Activity: {new Date(slip.activityDate).toLocaleString()}</span>
                    )}
                    {slip.dueDate && (
                      <span>Reply by: {new Date(slip.dueDate).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700">
                  {slip.status}
                </span>
              </div>

              <div className="mt-4 divide-y border rounded-lg">
                {children.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500">
                    No linked children found on your account.
                  </div>
                ) : (
                  children.map((child) => {
                    const ans = answerFor(slip.id, child.id);
                    const key = `${slip.id}|${child.id}`;
                    const isBusy = busy === key;
                    return (
                      <div key={child.id} className="p-3 flex flex-wrap items-center gap-3">
                        <div className="flex-1 min-w-[180px]">
                          <div className="font-medium text-gray-900">{child.fullname}</div>
                          {child.className && (
                            <div className="text-xs text-gray-500">{child.className}</div>
                          )}
                          {ans ? (
                            <div className="text-xs mt-1">
                              <span
                                className={`inline-block px-2 py-0.5 rounded ${
                                  ans.response === "YES"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-rose-100 text-rose-700"
                                }`}
                              >
                                {ans.response === "YES" ? "Approved" : "Declined"}
                              </span>
                              <span className="text-gray-500 ml-2">
                                {new Date(ans.respondedAt).toLocaleString()}
                              </span>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500 mt-1">Not answered yet</div>
                          )}
                        </div>
                        <input
                          type="text"
                          value={comment[key] || ""}
                          onChange={(e) => setComment((c) => ({ ...c, [key]: e.target.value }))}
                          placeholder="Optional note…"
                          className="flex-1 min-w-[160px] text-sm border rounded px-2 py-1"
                        />
                        <div className="flex gap-2">
                          <button
                            disabled={isBusy}
                            onClick={() => respond(slip.id, child.id, "YES")}
                            className="px-3 py-1.5 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            disabled={isBusy}
                            onClick={() => respond(slip.id, child.id, "NO")}
                            className="px-3 py-1.5 rounded bg-rose-600 text-white text-sm hover:bg-rose-700 disabled:opacity-60"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
