"use client";

import { useState } from "react";

export type FbPost = {
  thumb: string;
  link?: string;
  nameEN?: string;
  nameVI?: string;
  captionEN?: string;
  captionVI?: string;
  isVideo?: boolean;
};

/**
 * ILA-style featured-posts showcase: shows 3 hand-picked posts/videos at a time
 * with Next / Prev paging (and dots). Posts are curated by the marketing / manager
 * team in the dashboard and stored in the `facebook_featured_posts` CMS setting.
 */
export default function FacebookFeatured({
  posts,
  language,
  fbUrl,
}: {
  posts: FbPost[];
  language: string;
  fbUrl: string;
}) {
  // Only allow http(s) or site-relative URLs — blocks a stored javascript:/data: payload
  // a low-trust marketing user could otherwise smuggle into a post link.
  const safeUrl = (u?: string) => (u && /^(https?:\/\/|\/)/i.test(u.trim()) ? u.trim() : undefined);

  const PAGE_SIZE = 3;
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visible = posts.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const go = (delta: number) => setPage((p) => (p + delta + pageCount) % pageCount);

  return (
    <div className="relative">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {visible.map((post, idx) => {
          const name = language === "VI" ? post.nameVI || post.nameEN : post.nameEN || post.nameVI;
          const caption = language === "VI" ? post.captionVI || post.captionEN : post.captionEN || post.captionVI;
          return (
            <a
              key={safePage * PAGE_SIZE + idx}
              href={safeUrl(post.link) || safeUrl(fbUrl) || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all aspect-[4/5] bg-gray-100"
            >
              <img
                src={post.thumb}
                alt={name || "LERA Academy"}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              {post.isVideo && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </div>
              )}
              {name && (
                <span className="absolute top-4 left-4 text-xs font-semibold text-white bg-blue-600/90 rounded-md px-3 py-1">
                  {name}
                </span>
              )}
              {caption && (
                <p className="absolute bottom-4 left-4 right-4 text-white font-semibold text-sm leading-snug drop-shadow">
                  {caption}
                </p>
              )}
            </a>
          );
        })}
      </div>

      {pageCount > 1 && (
        <>
          {/* Prev / Next arrows */}
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous"
            className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-brand-navy hover:bg-blue-600 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next"
            className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-brand-navy hover:bg-blue-600 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  i === safePage ? "w-8 bg-blue-600" : "w-2.5 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
