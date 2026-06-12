"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";

/**
 * Audit-log viewer.
 *
 * Backed by {@code GET /api/audit-logs} which returns a Spring Page<AuditLog>:
 *   { content: [...], number, size, totalElements, totalPages }
 *
 * Lets reviewers filter by action / entityType / userId and a "since" cutoff,
 * with pagination and an expandable detail row showing the JSON diff.
 */

type AuditEntry = {
  id: string;
  action: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  oldValues?: string;
  newValues?: string;
  createdAt: string;
};

type Page<T> = {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export default function AuditLogsPage() {
  const [data, setData] = React.useState<Page<AuditEntry> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(0);
  const [filters, setFilters] = React.useState({ action: "", entityType: "", userId: "", since: "" });
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("size", "50");
      if (filters.action.trim())     params.set("action", filters.action.trim());
      if (filters.entityType.trim()) params.set("entityType", filters.entityType.trim());
      if (filters.userId.trim())     params.set("userId", filters.userId.trim());
      if (filters.since)             params.set("since", `${filters.since}T00:00:00`);
      const res = await apiFetch(`/api/audit-logs?${params.toString()}`);
      setData(res);
    } catch (e: any) {
      setError(e?.message || "Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  React.useEffect(() => { refresh(); }, [refresh]);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
    refresh();
  }

  function clearFilters() {
    setFilters({ action: "", entityType: "", userId: "", since: "" });
    setPage(0);
  }

  return (
    <div className="p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
        <p className="text-sm text-gray-500">
          Sensitive admin actions (approvals, impersonations, fee plan changes, etc.).
        </p>
      </header>

      <form onSubmit={applyFilters} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        <input
          placeholder="Action (e.g. USER_APPROVED)"
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          className="h-9 rounded-md border border-gray-300 px-3 text-sm"
        />
        <input
          placeholder="Entity type (e.g. User)"
          value={filters.entityType}
          onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
          className="h-9 rounded-md border border-gray-300 px-3 text-sm"
        />
        <input
          placeholder="User ID"
          value={filters.userId}
          onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
          className="h-9 rounded-md border border-gray-300 px-3 text-sm font-mono"
        />
        <input
          type="date"
          value={filters.since}
          onChange={(e) => setFilters({ ...filters, since: e.target.value })}
          className="h-9 rounded-md border border-gray-300 px-3 text-sm"
        />
        <div className="flex gap-2">
          <button type="submit" className="flex-1 h-9 rounded-md bg-blue-600 px-3 text-sm text-white hover:bg-blue-700">
            Apply
          </button>
          <button type="button" onClick={clearFilters} className="h-9 rounded-md border border-gray-300 px-3 text-sm hover:bg-gray-50">
            Clear
          </button>
        </div>
      </form>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-600">When</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Action</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Entity</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">User</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">IP</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : !data?.content?.length ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No audit entries match.</td></tr>
            ) : (
              data.content.map((row) => (
                <React.Fragment key={row.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap">{new Date(row.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-2 font-mono text-xs">{row.action}</td>
                    <td className="px-4 py-2">
                      {row.entityType || "—"}
                      {row.entityId && (
                        <span className="ml-1 font-mono text-xs text-gray-500">{row.entityId.slice(0, 8)}…</span>
                      )}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">{row.userId || "—"}</td>
                    <td className="px-4 py-2 font-mono text-xs">{row.ipAddress || "—"}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {expandedId === row.id ? "Hide" : "Details"}
                      </button>
                    </td>
                  </tr>
                  {expandedId === row.id && (
                    <tr>
                      <td colSpan={6} className="px-4 py-3 bg-gray-50">
                        <DiffPreview oldJson={row.oldValues} newJson={row.newValues} userAgent={row.userAgent} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <footer className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Page {data.number + 1} of {data.totalPages} · {data.totalElements} entries
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(Math.max(0, page - 1))}
              className="h-9 rounded-md border border-gray-300 px-3 text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              ← Prev
            </button>
            <button
              disabled={page + 1 >= data.totalPages}
              onClick={() => setPage(page + 1)}
              className="h-9 rounded-md border border-gray-300 px-3 text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Next →
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}

function DiffPreview({ oldJson, newJson, userAgent }: { oldJson?: string; newJson?: string; userAgent?: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <p className="text-xs font-semibold text-gray-700 mb-1">Old</p>
        <pre className="rounded-md bg-white border border-gray-200 p-2 text-xs overflow-x-auto">
          {pretty(oldJson) || <span className="text-gray-400">—</span>}
        </pre>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-700 mb-1">New</p>
        <pre className="rounded-md bg-white border border-gray-200 p-2 text-xs overflow-x-auto">
          {pretty(newJson) || <span className="text-gray-400">—</span>}
        </pre>
      </div>
      {userAgent && (
        <div className="md:col-span-2 text-xs text-gray-500">User-Agent: <code>{userAgent}</code></div>
      )}
    </div>
  );
}

function pretty(s?: string) {
  if (!s) return "";
  try {
    return JSON.stringify(JSON.parse(s), null, 2);
  } catch {
    return s;
  }
}
