"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

interface BlogPost {
  id: string;
  titleEn: string;
  titleVi?: string;
  excerptEn?: string;
  excerptVi?: string;
  contentEn?: string;
  imageUrl?: string;
  category?: string;
  audience?: string;
  author?: string;
  slug?: string;
  status?: string;
  publishedAt?: string;
  createdAt: string;
}

/**
 * Parent resources hub — curated articles from the CMS where audience
 * is set to PARENT. Falls back to the general published feed if nothing
 * has been tagged for parents yet, so the page is never empty after a
 * fresh install.
 */
export default function ParentResourcesPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [category, setCategory] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/blog/audience/PARENT");
      let list: BlogPost[] = Array.isArray(data) ? data : [];
      if (list.length === 0) {
        const fallback = await apiFetch("/api/blog/published").catch(() => []);
        list = Array.isArray(fallback) ? fallback : [];
      }
      setPosts(list);
    } catch (e: any) {
      setError(e?.message || "Could not load resources.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["ALL", ...Array.from(set).sort()];
  }, [posts]);

  const filtered = useMemo(
    () => (category === "ALL" ? posts : posts.filter((p) => p.category === category)),
    [posts, category]
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <Link href="/dashboard/parent" className="text-sm text-purple-700 hover:underline">
          ← Parent dashboard
        </Link>
        <h1 className="text-2xl font-semibold mt-1">Parent Resources</h1>
        <p className="text-gray-600 text-sm">
          Reading lists, parenting tips and announcements curated for families.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>
      )}

      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                category === c
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-xl border">
          No resources have been published yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow"
            >
              {post.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.imageUrl}
                  alt={post.titleEn}
                  className="w-full h-44 object-cover"
                />
              )}
              <div className="p-4">
                {post.category && (
                  <div className="text-xs uppercase tracking-wide text-purple-700 mb-1">
                    {post.category}
                  </div>
                )}
                <h2 className="text-lg font-semibold text-gray-900 leading-snug">
                  {post.titleEn}
                </h2>
                {post.excerptEn && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-3">{post.excerptEn}</p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 mt-4">
                  <span>{post.author || "LERA"}</span>
                  <span>
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString()
                      : new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {post.slug && (
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-block mt-3 text-sm text-purple-700 hover:underline"
                  >
                    Read more →
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
