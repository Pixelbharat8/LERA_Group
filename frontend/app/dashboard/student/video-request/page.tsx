"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../../lib/api";

/**
 * Student/customer surface: REQUEST a promo video. This never triggers a paid render — the
 * marketing team reviews and approves. Requesters see the status of their own requests.
 */
export default function VideoRequestPage() {
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState("");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [mine, setMine] = useState<any[]>([]);

  const loadMine = () =>
    apiFetch("/api/ai/video/requests").then((r: any) => setMine(Array.isArray(r) ? r : [])).catch(() => setMine([]));

  useEffect(() => { loadMine(); }, []);

  const submit = async () => {
    if (!prompt.trim()) return;
    setSubmitting(true);
    setMsg("");
    try {
      await apiFetch("/api/ai/video/requests", {
        method: "POST",
        body: JSON.stringify({
          prompt: prompt.trim(),
          images: images.split("\n").map((s) => s.trim()).filter(Boolean),
          aspectRatio,
        }),
      });
      setMsg("✅ Request sent — the marketing team will review it.");
      setPrompt(""); setImages("");
      loadMine();
    } catch (e: any) {
      setMsg("⚠️ " + (e?.message || "Could not send request"));
    }
    setSubmitting(false);
  };

  const badge = (s: string) => {
    const map: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-blue-100 text-blue-800",
      RENDERED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-700",
    };
    return <span className={`px-2 py-0.5 text-xs rounded-full ${map[s] || "bg-gray-100 text-gray-600"}`}>{s}</span>;
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900">🎬 Request a Video</h1>
      <p className="text-gray-500 mt-1 mb-6">Describe the video you&apos;d like and our team will create it for you.</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">What should the video be about?</label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3}
            placeholder="e.g. A short clip celebrating our class's speaking competition, upbeat and colourful"
            className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Photo links (one per line, optional)</label>
          <textarea value={images} onChange={(e) => setImages(e.target.value)} rows={2}
            placeholder="https://…" className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
          <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            <option value="9:16">Vertical (Reels / TikTok)</option>
            <option value="1:1">Square</option>
            <option value="16:9">Landscape</option>
          </select>
        </div>
        <button onClick={submit} disabled={submitting || !prompt.trim()}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
          {submitting ? "Sending…" : "Send request"}
        </button>
        {msg && <span className="ml-3 text-sm text-gray-600">{msg}</span>}
      </div>

      {mine.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Your requests</h2>
          <div className="space-y-2">
            {mine.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 p-3 border border-gray-200 rounded-lg bg-white">
                <p className="text-sm text-gray-700 truncate">{r.prompt}</p>
                <div className="flex items-center gap-3 shrink-0">
                  {r.status === "RENDERED" && r.resultUrl && (
                    <a href={r.resultUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">View ↗</a>
                  )}
                  {badge(r.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
