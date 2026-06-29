"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

type Article = {
  titleEn?: string;
  titleVi?: string;
  excerptEn?: string;
  excerptVi?: string;
  contentEn?: string;
  contentVi?: string;
  slug?: string;
  category?: string;
  usingRealAI?: boolean;
  tokensUsed?: number;
  quotaExceeded?: boolean;
};

const CATEGORIES = ["Tips", "IELTS", "Kids English", "Business English", "Parents", "News"];

export default function SeoWriterPage() {
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("Tips");
  const [lang, setLang] = useState<"en" | "vi">("en");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [article, setArticle] = useState<Article | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const generate = async () => {
    if (!keyword.trim()) {
      setErr("Enter a target keyword first.");
      return;
    }
    setErr(null);
    setMsg(null);
    setArticle(null);
    setLoading(true);
    try {
      const data: Article = await apiFetch("/api/ai/seo-article", {
        method: "POST",
        body: JSON.stringify({ keyword: keyword.trim(), category }),
      });
      setArticle(data);
      if (data?.quotaExceeded) {
        setMsg("AI quota exceeded — showing a sample. Increase this user's budget in Super Admin → AI Gateway.");
      } else if (data?.usingRealAI === false) {
        setMsg("AI not configured — showing a sample. Add a Claude API key in Super Admin → AI Gateway.");
      }
    } catch (e: any) {
      setErr(e?.message || "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    if (!article) return;
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      await apiFetch("/api/blog", {
        method: "POST",
        body: JSON.stringify({
          titleEn: article.titleEn,
          titleVi: article.titleVi,
          excerptEn: article.excerptEn,
          excerptVi: article.excerptVi,
          contentEn: article.contentEn,
          contentVi: article.contentVi,
          slug: article.slug,
          category: article.category || category,
          audience: "ALL",
          status: "draft",
        }),
      });
      setMsg("Saved as a draft. Review and publish it from Website Content → Blog.");
    } catch (e: any) {
      setErr(e?.message || "Save failed (a post with this slug may already exist).");
    } finally {
      setSaving(false);
    }
  };

  const pick = (en?: string, vi?: string) => (lang === "en" ? en : vi) || "";

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-brand-navy mb-1">AI SEO Article Writer</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Generate an SEO-optimised, bilingual (EN / VI) article for a target keyword — tuned for Hải Phòng local
        search. Review it, then save as a draft to publish from Website Content → Blog.
      </p>

      <div className="card-premium p-5 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Target keyword</label>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder='e.g. "luyện thi IELTS Hải Phòng" or "English for kids Vinhomes Marina"'
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3"
        />
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <button onClick={generate} disabled={loading} className="btn-primary px-5 py-2 disabled:opacity-50">
            {loading ? "Generating…" : "Generate with Claude"}
          </button>
        </div>
      </div>

      {err && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{err}</div>}
      {msg && <div className="mb-4 p-3 rounded-lg bg-amber-50 text-amber-800 text-sm">{msg}</div>}

      {article && (
        <div className="card-premium p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setLang("en")}
                className={`px-3 py-1 rounded text-sm ${lang === "en" ? "bg-brand-navy text-white" : "bg-gray-100 text-gray-700"}`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("vi")}
                className={`px-3 py-1 rounded text-sm ${lang === "vi" ? "bg-brand-navy text-white" : "bg-gray-100 text-gray-700"}`}
              >
                VI
              </button>
            </div>
            <div className="text-xs text-gray-400">
              {article.usingRealAI ? `Claude · ${article.tokensUsed ?? 0} tokens` : "Sample"} · /blog/{article.slug}
            </div>
          </div>
          <h2 className="text-xl font-bold text-brand-navy mb-1">{pick(article.titleEn, article.titleVi)}</h2>
          <p className="text-gray-500 text-sm mb-4 italic">{pick(article.excerptEn, article.excerptVi)}</p>
          <div
            className="max-w-none border-t border-gray-100 pt-4 leading-relaxed [&_h2]:font-semibold [&_h2]:text-brand-navy [&_h2]:mt-4 [&_h2]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-3"
            dangerouslySetInnerHTML={{ __html: pick(article.contentEn, article.contentVi) }}
          />
          <div className="mt-5 flex gap-3">
            <button onClick={saveDraft} disabled={saving} className="btn-primary px-5 py-2 disabled:opacity-50">
              {saving ? "Saving…" : "Save as draft"}
            </button>
            <button onClick={generate} disabled={loading} className="btn-secondary px-5 py-2">
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
