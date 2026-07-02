"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { usePermissions } from "../../../context/PermissionContext";

/**
 * Marketing / manager team picker for the homepage "From Our Facebook" showcase.
 * Curates the 3-up carousel the public site renders (facebook_featured_posts CMS key).
 * Same data + storage as the Chairman editor, but reachable by the marketing/manager team.
 */

type FbPost = {
  thumb: string;
  link: string;
  nameEN: string;
  nameVI: string;
  captionEN: string;
  captionVI: string;
  isVideo: boolean;
};

const emptyPost: FbPost = { thumb: "", link: "", nameEN: "", nameVI: "", captionEN: "", captionVI: "", isVideo: true };

// Marketing + manager team (plus the high-level roles that always have access).
const ALLOWED = [
  "CHAIRMAN", "CEO", "DIRECTOR", "SUPER_ADMIN", "SUPERADMIN", "ADMIN",
  "CENTER_MANAGER", "CENTER_ADMIN", "ACADEMIC_MANAGER", "MARKETING", "STAFF",
];

export default function FeaturedPostsPage() {
  const { hasPermission } = usePermissions();
  const role = useMemo(() => {
    if (typeof window === "undefined") return "";
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return String(u.roleName || u.role?.name || u.role || "").toUpperCase();
    } catch {
      return "";
    }
  }, []);
  const allowed = ALLOWED.includes(role) || hasPermission("socialMedia") || hasPermission("communication");

  const [posts, setPosts] = useState<FbPost[]>([]);
  const [pageUrl, setPageUrl] = useState("https://www.facebook.com/profile.php?id=61580971978601");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data: any = await apiFetch("/api/cms-settings/map/homepage").catch(() => ({}));
        if (data?.facebook_page_url_en) setPageUrl(data.facebook_page_url_en);
        if (data?.facebook_featured_posts_en) {
          const parsed = JSON.parse(data.facebook_featured_posts_en);
          if (Array.isArray(parsed)) setPosts(parsed.map((p: any) => ({ ...emptyPost, ...p })));
        }
      } catch {
        /* ignore */
      }
      setLoading(false);
    })();
  }, []);

  const update = (idx: number, patch: Partial<FbPost>) =>
    setPosts((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  const add = () => setPosts((prev) => [...prev, { ...emptyPost }]);
  const remove = (idx: number) => setPosts((prev) => prev.filter((_, i) => i !== idx));
  const move = (idx: number, dir: -1 | 1) =>
    setPosts((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });

  const uploadThumb = async (idx: number, file: File) => {
    setUploadingIdx(idx);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res: any = await apiFetch("/api/upload/image", { method: "POST", body: fd });
      if (res?.url) update(idx, { thumb: res.url });
    } catch (e) {
      console.error("Thumbnail upload failed:", e);
      setMessage("⚠️ Thumbnail upload failed");
    }
    setUploadingIdx(null);
  };

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      // Only persist http(s)/relative URLs — a post link/image is rendered into the public
      // homepage, so reject any javascript:/data: scheme before it's ever stored.
      const isSafe = (u?: string) => !!u && /^(https?:\/\/|\/)/i.test(u.trim());
      const json = JSON.stringify(
        posts
          .filter((p) => isSafe(p.thumb))
          .map((p) => ({ ...p, thumb: p.thumb.trim(), link: isSafe(p.link) ? p.link.trim() : "" })),
      );
      // POST /api/cms-settings/batch expects a BARE array (PUT takes the {settings:[…]} wrapper).
      await apiFetch("/api/cms-settings/batch", {
        method: "POST",
        body: JSON.stringify([
          { settingKey: "facebook_featured_posts_en", settingValue: json, category: "homepage" },
          { settingKey: "facebook_featured_posts_vi", settingValue: json, category: "homepage" },
        ]),
      });
      setMessage("✅ Saved — the homepage carousel is updated.");
    } catch (e) {
      console.error("Save failed:", e);
      setMessage("⚠️ Save failed — please try again.");
    }
    setSaving(false);
  };

  if (!allowed) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Marketing access only</h1>
        <p className="text-gray-600">Ask the Chairman to grant you the Social Media / Communication feature to curate homepage posts.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📌 Homepage Facebook Posts</h1>
          <p className="text-gray-500 mt-1">
            Hand-pick the posts/videos shown in the public &ldquo;From Our Facebook&rdquo; carousel (3 at a time, with Next).
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      {message && <div className="mb-4 p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm">{message}</div>}

      {loading ? (
        <div className="py-16 text-center text-gray-400">Loading…</div>
      ) : (
        <>
          <div className="space-y-4">
            {posts.length === 0 && (
              <div className="py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                No posts picked yet. Click <span className="font-semibold">“Add post”</span> to start.
              </div>
            )}
            {posts.map((post, idx) => (
              <div key={idx} className="flex gap-4 p-4 border border-gray-200 rounded-xl bg-white">
                {/* Thumbnail */}
                <div className="w-28 shrink-0">
                  <div className="aspect-[4/5] rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                    {post.thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.thumb} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl text-gray-300">🖼️</span>
                    )}
                  </div>
                  <label className="mt-2 block text-center text-xs text-blue-600 cursor-pointer hover:underline">
                    {uploadingIdx === idx ? "Uploading…" : "Upload image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && uploadThumb(idx, e.target.files[0])}
                    />
                  </label>
                </div>

                {/* Fields */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Name / label (EN) e.g. Mẹ Khánh Thy"
                    value={post.nameEN} onChange={(e) => update(idx, { nameEN: e.target.value })} />
                  <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Name / label (VI)"
                    value={post.nameVI} onChange={(e) => update(idx, { nameVI: e.target.value })} />
                  <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Caption (EN)"
                    value={post.captionEN} onChange={(e) => update(idx, { captionEN: e.target.value })} />
                  <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Caption (VI)"
                    value={post.captionVI} onChange={(e) => update(idx, { captionVI: e.target.value })} />
                  <input className="border rounded-lg px-3 py-2 text-sm sm:col-span-2" placeholder="Post link (https://facebook.com/…)"
                    value={post.link} onChange={(e) => update(idx, { link: e.target.value })} />
                  <input className="border rounded-lg px-3 py-2 text-sm sm:col-span-2" placeholder="Or paste image URL directly"
                    value={post.thumb} onChange={(e) => update(idx, { thumb: e.target.value })} />
                  <label className="flex items-center gap-2 text-sm text-gray-600 sm:col-span-2">
                    <input type="checkbox" checked={post.isVideo} onChange={(e) => update(idx, { isVideo: e.target.checked })} />
                    Show play ▶ button (it&apos;s a video)
                  </label>
                </div>

                {/* Order / remove */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <button onClick={() => move(idx, -1)} disabled={idx === 0} className="w-7 h-7 rounded border text-gray-500 disabled:opacity-30 hover:bg-gray-50" aria-label="Move up">↑</button>
                  <button onClick={() => move(idx, 1)} disabled={idx === posts.length - 1} className="w-7 h-7 rounded border text-gray-500 disabled:opacity-30 hover:bg-gray-50" aria-label="Move down">↓</button>
                  <button onClick={() => remove(idx)} className="w-7 h-7 rounded border border-red-200 text-red-500 hover:bg-red-50 mt-1" aria-label="Remove">✕</button>
                </div>
              </div>
            ))}
          </div>

          <button onClick={add} className="mt-4 px-4 py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg font-medium hover:bg-blue-50 w-full">
            ＋ Add post
          </button>

          <p className="mt-6 text-xs text-gray-400">
            The public page shows these 3 at a time with a Next arrow. Posts without an image are skipped.
            {" "}<Link href={pageUrl} target="_blank" className="text-blue-500 hover:underline">Open the LERA Facebook page ↗</Link>
          </p>
        </>
      )}
    </div>
  );
}
