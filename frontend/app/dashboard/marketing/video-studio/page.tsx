"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { usePermissions } from "../../../context/PermissionContext";

/**
 * AI Video Studio — internal marketing/manager tool to auto-generate short promo videos.
 * Calls the ai_gateway video endpoints (/api/ai/video/*). Rendering is gated on a provider
 * the Chairman configures in Super Admin → AI Gateway; until then this shows a clear notice.
 */

const ALLOWED = [
  "CHAIRMAN", "CEO", "DIRECTOR", "SUPER_ADMIN", "SUPERADMIN", "ADMIN",
  "CENTER_MANAGER", "CENTER_ADMIN", "ACADEMIC_MANAGER", "MARKETING", "STAFF",
];

export default function VideoStudioPage() {
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

  const [status, setStatus] = useState<{ configured: boolean; provider: string; costPerRender: number } | null>(null);
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<string[]>([""]);
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string>("");

  useEffect(() => {
    apiFetch("/api/ai/video/status")
      .then((s: any) => setStatus(s))
      .catch(() => setStatus({ configured: false, provider: "", costPerRender: 0 }));
  }, []);

  const setImage = (i: number, v: string) => setImages((p) => p.map((x, idx) => (idx === i ? v : x)));
  const addImage = () => setImages((p) => [...p, ""]);
  const removeImage = (i: number) => setImages((p) => p.filter((_, idx) => idx !== i));

  const generate = async () => {
    setGenerating(true);
    setResult("");
    try {
      const res: any = await apiFetch("/api/ai/video/generate", {
        method: "POST",
        body: JSON.stringify({
          prompt: prompt.trim(),
          images: images.map((s) => s.trim()).filter(Boolean),
          aspectRatio,
        }),
      });
      setResult(JSON.stringify(res, null, 2));
    } catch (e: any) {
      setResult("⚠️ " + (e?.message || "Generation failed"));
    }
    setGenerating(false);
  };

  if (!allowed) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Marketing access only</h1>
        <p className="text-gray-600">Ask the Chairman to grant you the Social Media / Communication feature.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900">🎬 AI Video Studio</h1>
      <p className="text-gray-500 mt-1 mb-6">Auto-generate short promo videos for social posts from photos + a prompt.</p>

      {status && !status.configured && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
          <b>No video provider connected yet.</b> Auto video generation needs an external AI video service + API key
          (there&apos;s no free local renderer). A Chairman/Super Admin can add one in{" "}
          <Link href="/dashboard/superadmin/ai-gateway" className="underline font-medium">Super Admin → AI Gateway</Link>.
          You can still fill in the brief below.
        </div>
      )}
      {status?.configured && (
        <div className="mb-6 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
          ● Connected via <b>{status.provider || "provider"}</b>
          {status.costPerRender > 0 ? ` · ~$${status.costPerRender} per render` : ""}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prompt / script</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="e.g. 30-second promo: happy students in class, upbeat, ‘Book a free trial at LERA Academy’"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Source images (URLs)</label>
          {images.map((img, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                value={img}
                onChange={(e) => setImage(i, e.target.value)}
                placeholder="https://… or /images/…"
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
              />
              <button onClick={() => removeImage(i)} disabled={images.length === 1}
                className="w-9 rounded border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-30">✕</button>
            </div>
          ))}
          <button onClick={addImage} className="text-sm text-blue-600 hover:underline">＋ Add image</button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Aspect ratio</label>
          <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm">
            <option value="9:16">9:16 — Reels / TikTok / Stories</option>
            <option value="1:1">1:1 — Feed square</option>
            <option value="16:9">16:9 — YouTube / landscape</option>
          </select>
        </div>

        <button
          onClick={generate}
          disabled={generating || !prompt.trim()}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {generating ? "Generating…" : status?.configured ? `Generate video${status.costPerRender > 0 ? ` (~$${status.costPerRender})` : ""}` : "Generate (needs provider)"}
        </button>
      </div>

      {result && (
        <pre className="mt-6 p-4 rounded-lg bg-gray-900 text-gray-100 text-xs overflow-auto whitespace-pre-wrap">{result}</pre>
      )}
    </div>
  );
}
