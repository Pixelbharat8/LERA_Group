"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";

/**
 * Reusable admin CRUD page.
 *
 * Drop this into any /dashboard/<role>/<feature> route to get a fully working
 * list / create / edit / delete UI against a REST endpoint that follows our
 * standard shape:
 *
 *   GET    {endpoint}        -> Item[]
 *   GET    {endpoint}/{id}   -> Item
 *   POST   {endpoint}        -> Item
 *   PUT    {endpoint}/{id}   -> Item
 *   DELETE {endpoint}/{id}   -> 204
 *
 * Most of our orphan admin pages need exactly this. Configuration-driven so
 * we don't have to copy-paste 200 lines of forms 20 times.
 */

export type AdminColumnType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "select"
  | "json";

export interface AdminColumn {
  key: string;
  label: string;
  type?: AdminColumnType;
  required?: boolean;
  /** Hide this column from the list view (still editable in the form). */
  hideInList?: boolean;
  /** Hide this field from the form (still shown in the list). */
  hideInForm?: boolean;
  /** Read-only — visible in form but disabled. */
  readOnly?: boolean;
  /** Custom renderer for the list cell. */
  render?: (value: any, row: Record<string, any>) => React.ReactNode;
  /** For type=select — { value, label } pairs. */
  options?: Array<{ value: string; label: string }>;
  /** Placeholder for the form input. */
  placeholder?: string;
}

export interface AdminCrudPageProps {
  title: string;
  description?: string;
  endpoint: string;
  /** Primary key field, defaults to "id". */
  idField?: string;
  columns: AdminColumn[];
  /** Optional default values when creating a new row. */
  defaults?: Record<string, any>;
  /** Optional: extra filters rendered above the list (key = field name). */
  searchableFields?: string[];
  /** Disable create / edit / delete individually. */
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  /** Optional adapter — transform the response into Item[] (some APIs wrap). */
  unwrap?: (raw: any) => any[];
}

const DEFAULT_UNWRAP = (raw: any): any[] => {
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.data)) return raw.data;
  if (raw && Array.isArray(raw.items)) return raw.items;
  if (raw && Array.isArray(raw.content)) return raw.content;
  return [];
};

export default function AdminCrudPage({
  title,
  description,
  endpoint,
  idField = "id",
  columns,
  defaults = {},
  searchableFields = [],
  canCreate = true,
  canEdit = true,
  canDelete = true,
  unwrap = DEFAULT_UNWRAP,
}: AdminCrudPageProps) {
  const [rows, setRows] = React.useState<Record<string, any>[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [editing, setEditing] = React.useState<Record<string, any> | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(endpoint);
      setRows(unwrap(data));
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [endpoint, unwrap]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const visibleColumns = columns.filter((c) => !c.hideInList);
  const formColumns = columns.filter((c) => !c.hideInForm);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return rows;
    const needle = search.toLowerCase();
    const fields = searchableFields.length > 0 ? searchableFields : columns.map((c) => c.key);
    return rows.filter((r) =>
      fields.some((f) => String(r[f] ?? "").toLowerCase().includes(needle))
    );
  }, [rows, search, searchableFields, columns]);

  async function handleSave(values: Record<string, any>) {
    setSaving(true);
    setError(null);
    try {
      if (editing && editing[idField]) {
        await apiFetch(`${endpoint}/${editing[idField]}`, {
          method: "PUT",
          body: JSON.stringify(values),
        });
      } else {
        await apiFetch(endpoint, {
          method: "POST",
          body: JSON.stringify(values),
        });
      }
      setEditing(null);
      setCreating(false);
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: Record<string, any>) {
    if (!confirm(`Delete this ${title.replace(/s$/, "").toLowerCase()}?`)) return;
    setError(null);
    try {
      await apiFetch(`${endpoint}/${row[idField]}`, { method: "DELETE" });
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Failed to delete");
    }
  }

  function renderCell(col: AdminColumn, row: Record<string, any>) {
    if (col.render) return col.render(row[col.key], row);
    const v = row[col.key];
    if (v == null || v === "") return <span className="text-gray-400">—</span>;
    if (col.type === "boolean") {
      return v ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
          Yes
        </span>
      ) : (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
          No
        </span>
      );
    }
    if (col.type === "json") return <code className="text-xs">{JSON.stringify(v)}</code>;
    if (col.type === "datetime" || col.type === "date") {
      try {
        return <span>{new Date(v).toLocaleString()}</span>;
      } catch {
        return String(v);
      }
    }
    return String(v);
  }

  return (
    <div className="p-6 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={refresh}
            className="h-9 rounded-md border border-gray-300 px-3 text-sm hover:bg-gray-50"
          >
            Refresh
          </button>
          {canCreate && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="h-9 rounded-md bg-blue-600 px-3 text-sm text-white hover:bg-blue-700"
            >
              + New
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-2 text-left font-medium text-gray-600 whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
              {(canEdit || canDelete) && (
                <th className="px-4 py-2 text-right font-medium text-gray-600">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td
                  className="px-4 py-8 text-center text-gray-500"
                  colSpan={visibleColumns.length + 1}
                >
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-8 text-center text-gray-500"
                  colSpan={visibleColumns.length + 1}
                >
                  No records yet.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row[idField]} className="hover:bg-gray-50">
                  {visibleColumns.map((col) => (
                    <td key={col.key} className="px-4 py-2 align-top whitespace-pre-wrap">
                      {renderCell(col, row)}
                    </td>
                  ))}
                  {(canEdit || canDelete) && (
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => setEditing(row)}
                          className="text-sm text-blue-600 hover:text-blue-800 mr-3"
                        >
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {(editing || creating) && (
        <CrudForm
          title={editing ? `Edit ${title.replace(/s$/, "")}` : `New ${title.replace(/s$/, "")}`}
          columns={formColumns}
          initial={editing || defaults}
          saving={saving}
          onSave={handleSave}
          onCancel={() => {
            setEditing(null);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

function CrudForm({
  title,
  columns,
  initial,
  saving,
  onSave,
  onCancel,
}: {
  title: string;
  columns: AdminColumn[];
  initial: Record<string, any>;
  saving: boolean;
  onSave: (values: Record<string, any>) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = React.useState<Record<string, any>>({ ...initial });
  const [validationError, setValidationError] = React.useState<string | null>(null);

  function setField(key: string, v: any) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);
    for (const c of columns) {
      if (c.required && (values[c.key] == null || values[c.key] === "")) {
        setValidationError(`${c.label} is required`);
        return;
      }
    }
    const cleaned: Record<string, any> = {};
    for (const c of columns) {
      let v = values[c.key];
      if (v === "") v = null;
      if (c.type === "json" && typeof v === "string") {
        try {
          v = JSON.parse(v);
        } catch {
          setValidationError(`${c.label} must be valid JSON`);
          return;
        }
      }
      if (c.type === "number" && v != null) v = Number(v);
      cleaned[c.key] = v;
    }
    onSave(cleaned);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-lg bg-white shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </header>
        <div className="space-y-3 px-5 py-4 max-h-[70vh] overflow-y-auto">
          {validationError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {validationError}
            </div>
          )}
          {columns.map((c) => (
            <div key={c.key} className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                {c.label}
                {c.required && <span className="text-red-500"> *</span>}
              </label>
              {c.type === "textarea" ? (
                <textarea
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  disabled={c.readOnly}
                  placeholder={c.placeholder}
                  value={values[c.key] ?? ""}
                  onChange={(e) => setField(c.key, e.target.value)}
                />
              ) : c.type === "boolean" ? (
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    disabled={c.readOnly}
                    checked={!!values[c.key]}
                    onChange={(e) => setField(c.key, e.target.checked)}
                  />
                  Enabled
                </label>
              ) : c.type === "select" ? (
                <select
                  className="h-9 w-full rounded-md border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={c.readOnly}
                  value={values[c.key] ?? ""}
                  onChange={(e) => setField(c.key, e.target.value)}
                >
                  <option value="">— select —</option>
                  {c.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : c.type === "json" ? (
                <textarea
                  className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  disabled={c.readOnly}
                  placeholder={c.placeholder || "{}"}
                  value={
                    typeof values[c.key] === "string"
                      ? values[c.key]
                      : JSON.stringify(values[c.key] ?? "", null, 2)
                  }
                  onChange={(e) => setField(c.key, e.target.value)}
                />
              ) : (
                <input
                  type={c.type === "number" ? "number" : c.type === "date" ? "date" : c.type === "datetime" ? "datetime-local" : "text"}
                  className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={c.readOnly}
                  placeholder={c.placeholder}
                  value={values[c.key] ?? ""}
                  onChange={(e) => setField(c.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
        <footer className="flex justify-end gap-2 border-t border-gray-200 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 rounded-md border border-gray-300 px-3 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-9 rounded-md bg-blue-600 px-4 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </footer>
      </form>
    </div>
  );
}
