"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export type CmsField = {
  key: string;            // base field name; stored as `<category>_<key>_<en|vi>`
  label: string;          // human label shown in the editor
  type?: "text" | "textarea";
  help?: string;          // optional helper text
};

/**
 * Generic editor for a public page's editable copy. Loads the CMS map for `category`,
 * renders an EN + VI input per field, and saves them via the cms-settings batch endpoint
 * under `category`. The matching page reads the same keys via usePageContent(category).
 */
export default function CmsPageEditor({
  category,
  title,
  description,
  previewHref,
  fields,
}: {
  category: string;
  title: string;
  description?: string;
  previewHref?: string;
  fields: CmsField[];
}) {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const fieldKey = (base: string, lang: "en" | "vi") => `${category}_${base}_${lang}`;

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch(`/api/cms-settings/map/${category}`).catch(() => ({}));
        if (data && typeof data === "object") setVals(data as Record<string, string>);
      } finally {
        setLoading(false);
      }
    })();
  }, [category]);

  const set = (key: string, v: string) => setVals((prev) => ({ ...prev, [key]: v }));

  const save = async () => {
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const settings = fields.flatMap((f) =>
        (["en", "vi"] as const).map((lang) => ({
          settingKey: fieldKey(f.key, lang),
          settingValue: vals[fieldKey(f.key, lang)] || "",
          category,
        }))
      );
      await apiFetch("/api/cms-settings/batch", {
        method: "POST",
        body: JSON.stringify({ settings }),
      });
      setMsg("✓ Saved — changes are live on the public page.");
    } catch (e: any) {
      setErr(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/dashboard/chairman/website-content" className="text-gray-500 hover:text-gray-700 whitespace-nowrap">
              ← Back
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">{title}</h1>
              {description && <p className="text-sm text-gray-500 truncate">{description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {previewHref && (
              <a href={previewHref} target="_blank" rel="noopener noreferrer" className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg">
                👁️ View
              </a>
            )}
            <button
              onClick={save}
              disabled={saving || loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving ? "Saving…" : "💾 Save"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {err && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{err}</div>}
        {msg && <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm">{msg}</div>}

        {loading ? (
          <div className="text-gray-400 py-12 text-center">Loading…</div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-gray-500">
              Leave a field blank to use the built-in default text. Each field has English (EN) and
              Vietnamese (VI) versions.
            </p>
            {fields.map((f) => (
              <div key={f.key} className="bg-white rounded-xl border border-gray-200 p-4">
                <label className="block text-sm font-bold text-gray-900 mb-1">{f.label}</label>
                {f.help && <p className="text-xs text-gray-400 mb-2">{f.help}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {(["en", "vi"] as const).map((lang) => {
                    const k = fieldKey(f.key, lang);
                    const common = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500";
                    return (
                      <div key={lang}>
                        <span className="block text-xs font-medium text-gray-500 mb-1 uppercase">{lang}</span>
                        {f.type === "textarea" ? (
                          <textarea rows={3} value={vals[k] || ""} onChange={(e) => set(k, e.target.value)} className={common} />
                        ) : (
                          <input value={vals[k] || ""} onChange={(e) => set(k, e.target.value)} className={common} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
