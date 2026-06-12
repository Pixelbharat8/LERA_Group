"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";

/**
 * Lesson Plans admin — review and run the approval lifecycle.
 *
 *   DRAFT -> SUBMITTED -> APPROVED -> IN_PROGRESS -> COMPLETED
 *
 * Authorised reviewers (admin/center-manager/director) can approve or reject;
 * teachers can submit / start / complete via the same workflow endpoints.
 */

type Plan = {
  id: string;
  title?: string;
  titleVi?: string;
  planDate?: string;
  subject?: string;
  gradeLevel?: string;
  teacherId?: string;
  classId?: string;
  centerId?: string;
  status?: "DRAFT" | "SUBMITTED" | "APPROVED" | "IN_PROGRESS" | "COMPLETED" | string;
  totalDurationMinutes?: number;
  approvedAt?: string;
  approvedBy?: string;
};

const STATUS_TABS: Array<{ key: string; label: string; tone: string }> = [
  { key: "ALL",         label: "All",         tone: "bg-gray-100 text-gray-800" },
  { key: "DRAFT",       label: "Draft",       tone: "bg-gray-200 text-gray-800" },
  { key: "SUBMITTED",   label: "Pending review", tone: "bg-amber-100 text-amber-800" },
  { key: "APPROVED",    label: "Approved",    tone: "bg-blue-100 text-blue-800" },
  { key: "IN_PROGRESS", label: "In progress", tone: "bg-indigo-100 text-indigo-800" },
  { key: "COMPLETED",   label: "Completed",   tone: "bg-green-100 text-green-800" },
];

function StatusPill({ status }: { status?: string }) {
  const tab = STATUS_TABS.find((t) => t.key === status);
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tab?.tone || "bg-gray-100 text-gray-700"}`}>
      {status ?? "—"}
    </span>
  );
}

export default function LessonPlansAdminPage() {
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [tab, setTab] = React.useState<string>("SUBMITTED");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<Plan | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const path = tab === "ALL" ? "/api/lesson-plans" : `/api/lesson-plans?status=${tab}`;
      const data = await apiFetch(path);
      setPlans(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load lesson plans");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  async function transition(plan: Plan, action: "submit" | "approve" | "reject" | "start" | "complete", reason?: string) {
    setBusyId(plan.id);
    setError(null);
    try {
      let url = `/api/lesson-plans/${plan.id}/${action}`;
      if (action === "reject" && reason) url += `?reason=${encodeURIComponent(reason)}`;
      await apiFetch(url, { method: "PATCH" });
      await refresh();
      if (selected?.id === plan.id) setSelected(null);
    } catch (e: any) {
      setError(e?.message || `Failed to ${action}`);
    } finally {
      setBusyId(null);
    }
  }

  const counts = React.useMemo(() => {
    const map: Record<string, number> = { ALL: plans.length };
    for (const p of plans) {
      const s = p.status || "DRAFT";
      map[s] = (map[s] ?? 0) + 1;
    }
    return map;
  }, [plans]);

  return (
    <div className="p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Lesson Plans</h1>
        <p className="text-sm text-gray-500">
          Review submitted plans, approve or send back for revision, and watch progress through the lifecycle.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => {
          const active = t.key === tab;
          const count = tab === "ALL" ? counts[t.key] : t.key === tab ? counts[t.key] : undefined;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`h-9 rounded-md border px-3 text-sm transition ${
                active
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-300 bg-white hover:bg-gray-50"
              }`}
            >
              {t.label}
              {typeof count === "number" && (
                <span className="ml-2 text-xs opacity-80">{count}</span>
              )}
            </button>
          );
        })}
        <div className="ml-auto">
          <button
            type="button"
            onClick={refresh}
            className="h-9 rounded-md border border-gray-300 px-3 text-sm hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Title</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Date</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Subject</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Grade</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Duration</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-2 text-right font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : plans.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No lesson plans in this state.</td></tr>
            ) : (
              plans.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <button onClick={() => setSelected(p)} className="text-left text-blue-700 hover:underline">
                      {p.title || "(untitled)"}
                    </button>
                  </td>
                  <td className="px-4 py-2">{p.planDate || "—"}</td>
                  <td className="px-4 py-2">{p.subject || "—"}</td>
                  <td className="px-4 py-2">{p.gradeLevel || "—"}</td>
                  <td className="px-4 py-2">{p.totalDurationMinutes ? `${p.totalDurationMinutes} min` : "—"}</td>
                  <td className="px-4 py-2"><StatusPill status={p.status} /></td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <Actions plan={p} busy={busyId === p.id} onTransition={transition} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <DetailDrawer plan={selected} onClose={() => setSelected(null)} busy={busyId === selected.id} onTransition={transition} />
      )}
    </div>
  );
}

function Actions({
  plan,
  busy,
  onTransition,
}: {
  plan: Plan;
  busy: boolean;
  onTransition: (p: Plan, action: "submit" | "approve" | "reject" | "start" | "complete", reason?: string) => void;
}) {
  if (busy) return <span className="text-xs text-gray-400">working…</span>;
  switch (plan.status) {
    case "DRAFT":
      return (
        <button onClick={() => onTransition(plan, "submit")} className="text-sm text-amber-700 hover:text-amber-900">
          Submit
        </button>
      );
    case "SUBMITTED":
      return (
        <>
          <button onClick={() => onTransition(plan, "approve")} className="text-sm text-blue-700 hover:text-blue-900 mr-3">
            Approve
          </button>
          <button
            onClick={() => {
              const reason = prompt("Reason for sending back?") || "";
              onTransition(plan, "reject", reason);
            }}
            className="text-sm text-red-700 hover:text-red-900"
          >
            Reject
          </button>
        </>
      );
    case "APPROVED":
      return (
        <button onClick={() => onTransition(plan, "start")} className="text-sm text-indigo-700 hover:text-indigo-900">
          Start
        </button>
      );
    case "IN_PROGRESS":
      return (
        <button onClick={() => onTransition(plan, "complete")} className="text-sm text-green-700 hover:text-green-900">
          Complete
        </button>
      );
    default:
      return <span className="text-xs text-gray-400">—</span>;
  }
}

function DetailDrawer({
  plan,
  onClose,
  busy,
  onTransition,
}: {
  plan: Plan;
  onClose: () => void;
  busy: boolean;
  onTransition: (p: Plan, action: "submit" | "approve" | "reject" | "start" | "complete", reason?: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-xl overflow-y-auto bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <div>
            <h2 className="text-base font-semibold">{plan.title || "(untitled)"}</h2>
            <p className="text-xs text-gray-500">{plan.subject} · grade {plan.gradeLevel} · {plan.planDate}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </header>
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <StatusPill status={plan.status} />
            {plan.totalDurationMinutes && <span className="text-xs text-gray-500">{plan.totalDurationMinutes} min</span>}
          </div>
          <dl className="grid grid-cols-2 gap-2 text-xs text-gray-700">
            <dt className="text-gray-500">Plan ID</dt>
            <dd className="font-mono">{plan.id}</dd>
            <dt className="text-gray-500">Class ID</dt>
            <dd className="font-mono">{plan.classId || "—"}</dd>
            <dt className="text-gray-500">Teacher ID</dt>
            <dd className="font-mono">{plan.teacherId || "—"}</dd>
            <dt className="text-gray-500">Center ID</dt>
            <dd className="font-mono">{plan.centerId || "—"}</dd>
            <dt className="text-gray-500">Approved by</dt>
            <dd className="font-mono">{plan.approvedBy || "—"}</dd>
            <dt className="text-gray-500">Approved at</dt>
            <dd>{plan.approvedAt ? new Date(plan.approvedAt).toLocaleString() : "—"}</dd>
          </dl>
        </div>
        <footer className="flex flex-wrap gap-2 border-t border-gray-200 px-5 py-3">
          <Actions plan={plan} busy={busy} onTransition={onTransition} />
        </footer>
      </div>
    </div>
  );
}
