"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";

/**
 * Dropdown Options admin.
 *
 * The backend API ({@code /api/dropdown-options}) groups options under a
 * category key — it returns {@code Map<String, Option[]>} rather than a flat
 * list, so this page can't use the generic AdminCrudPage. Instead we render a
 * left-hand category sidebar plus the options for the selected category.
 *
 * Endpoints used:
 *   GET    /api/dropdown-options/categories        -> [{ key, label, description }]
 *   GET    /api/dropdown-options/category/{key}    -> Option[]
 *   POST   /api/dropdown-options                   -> { category, value, label, labelVi, sortOrder }
 *   PUT    /api/dropdown-options/{id}              -> { value, label, labelVi, sortOrder, isActive }
 *   DELETE /api/dropdown-options/{id}
 */

type Category = { key: string; label: string; description?: string };
type Option = {
  id: string;
  value: string;
  label: string;
  labelVi?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export default function DropdownOptionsAdminPage() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [active, setActive] = React.useState<string>("");
  const [options, setOptions] = React.useState<Option[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<Option | null>(null);
  const [creating, setCreating] = React.useState(false);

  const loadCategories = React.useCallback(async () => {
    try {
      const data = await apiFetch("/api/dropdown-options/categories");
      const list: Category[] = Array.isArray(data) ? data : [];
      setCategories(list);
      if (list.length > 0 && !active) setActive(list[0].key);
    } catch (e: any) {
      setError(e?.message || "Failed to load categories");
    }
  }, [active]);

  const loadOptions = React.useCallback(async (key: string) => {
    if (!key) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/api/dropdown-options/category/${encodeURIComponent(key)}`);
      setOptions(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load options");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { loadCategories(); }, [loadCategories]);
  React.useEffect(() => { if (active) loadOptions(active); }, [active, loadOptions]);

  async function save(values: Partial<Option>) {
    setError(null);
    try {
      if (editing?.id) {
        await apiFetch(`/api/dropdown-options/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(values),
        });
      } else {
        await apiFetch("/api/dropdown-options", {
          method: "POST",
          body: JSON.stringify({ ...values, category: active }),
        });
      }
      setEditing(null);
      setCreating(false);
      await loadOptions(active);
    } catch (e: any) {
      setError(e?.message || "Failed to save");
    }
  }

  async function remove(opt: Option) {
    if (!confirm(`Delete "${opt.label}"?`)) return;
    setError(null);
    try {
      await apiFetch(`/api/dropdown-options/${opt.id}`, { method: "DELETE" });
      await loadOptions(active);
    } catch (e: any) {
      setError(e?.message || "Failed to delete");
    }
  }

  return (
    <div className="p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dropdown Options</h1>
        <p className="text-sm text-gray-500">
          Edit the values that drive system-wide dropdowns (positions, leave types, payment methods, etc.).
        </p>
      </header>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-12 gap-4">
        <aside className="col-span-12 md:col-span-3">
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Categories
            </div>
            <ul className="divide-y divide-gray-100">
              {categories.map((c) => (
                <li key={c.key}>
                  <button
                    type="button"
                    onClick={() => setActive(c.key)}
                    className={`block w-full px-3 py-2 text-left text-sm transition ${
                      active === c.key ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-50"
                    }`}
                  >
                    {c.label}
                    {c.description && (
                      <span className="block text-xs text-gray-400">{c.description}</span>
                    )}
                  </button>
                </li>
              ))}
              {categories.length === 0 && (
                <li className="px-3 py-4 text-sm text-gray-500">No categories.</li>
              )}
            </ul>
          </div>
        </aside>

        <section className="col-span-12 md:col-span-9 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-700">
              {categories.find((c) => c.key === active)?.label || active || "Select a category"}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadOptions(active)}
                className="h-9 rounded-md border border-gray-300 px-3 text-sm hover:bg-gray-50"
              >
                Refresh
              </button>
              <button
                type="button"
                disabled={!active}
                onClick={() => setCreating(true)}
                className="h-9 rounded-md bg-blue-600 px-3 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                + New option
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Value</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Label</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Label (VI)</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Order</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Active</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
                ) : options.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No options in this category.</td></tr>
                ) : (
                  options.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-xs">{o.value}</td>
                      <td className="px-4 py-2">{o.label}</td>
                      <td className="px-4 py-2">{o.labelVi || "—"}</td>
                      <td className="px-4 py-2">{o.sortOrder ?? 0}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${o.isActive ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}`}>
                          {o.isActive ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right whitespace-nowrap">
                        <button onClick={() => setEditing(o)} className="text-sm text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                        <button onClick={() => remove(o)} className="text-sm text-red-600 hover:text-red-800">Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {(editing || creating) && (
        <OptionForm
          initial={editing || { value: "", label: "", labelVi: "", sortOrder: (options.length + 1), isActive: true }}
          onCancel={() => { setEditing(null); setCreating(false); }}
          onSave={save}
        />
      )}
    </div>
  );
}

function OptionForm({
  initial,
  onCancel,
  onSave,
}: {
  initial: Partial<Option>;
  onCancel: () => void;
  onSave: (values: Partial<Option>) => void;
}) {
  const [v, setV] = React.useState<Partial<Option>>({ ...initial });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); onSave(v); }}
        className="w-full max-w-md rounded-lg bg-white shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 className="text-base font-semibold">{initial.id ? "Edit option" : "New option"}</h2>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">✕</button>
        </header>
        <div className="space-y-3 px-5 py-4">
          <Field label="Value" required>
            <input
              required
              value={v.value || ""}
              onChange={(e) => setV({ ...v, value: e.target.value })}
              placeholder="full_time"
              className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>
          <Field label="Label (EN)" required>
            <input
              required
              value={v.label || ""}
              onChange={(e) => setV({ ...v, label: e.target.value })}
              className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>
          <Field label="Label (VI)">
            <input
              value={v.labelVi || ""}
              onChange={(e) => setV({ ...v, labelVi: e.target.value })}
              className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>
          <Field label="Order">
            <input
              type="number"
              value={v.sortOrder ?? 0}
              onChange={(e) => setV({ ...v, sortOrder: Number(e.target.value) })}
              className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!v.isActive}
              onChange={(e) => setV({ ...v, isActive: e.target.checked })}
            />
            Active
          </label>
        </div>
        <footer className="flex justify-end gap-2 border-t border-gray-200 px-5 py-3">
          <button type="button" onClick={onCancel} className="h-9 rounded-md border border-gray-300 px-3 text-sm hover:bg-gray-50">Cancel</button>
          <button type="submit" className="h-9 rounded-md bg-blue-600 px-4 text-sm text-white hover:bg-blue-700">Save</button>
        </footer>
      </form>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}
