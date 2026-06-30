import type { Metadata } from "next";

// Blog posts are served by academy_service (see next.config.js: /api/blog -> academyUrl).
// generateMetadata runs server-side, so it fetches the backend directly rather than via the
// browser rewrite. Resilient: any failure falls back to generic /blog metadata.
const ACADEMY = process.env.ACADEMY_SERVICE_URL || "http://localhost:8082";

function plain(text: unknown): string {
  return String(text ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const canonical = `/blog/${params.slug}`;
  try {
    const res = await fetch(`${ACADEMY}/api/blog/slug/${params.slug}`, { cache: "no-store" });
    if (res.ok) {
      const post: any = await res.json();
      const title = post.title || post.titleEn || "Article";
      const descSource =
        post.excerpt || post.summary || post.metaDescription || plain(post.content || post.contentEn);
      const description =
        (descSource && descSource.slice(0, 200)) ||
        "News, tips and stories from LERA Academy — premium English education in Hải Phòng.";
      const image = post.featuredImage || post.imageUrl;
      return {
        title,
        description,
        alternates: { canonical },
        openGraph: {
          title: `${title} | LERA Academy`,
          description,
          url: `https://leraacademy.edu.vn${canonical}`,
          type: "article",
          ...(image ? { images: [{ url: image }] } : {}),
        },
      };
    }
  } catch {
    /* fall through to generic metadata below */
  }
  return {
    title: "Blog",
    description: "News, tips and stories from LERA Academy — premium English education in Hải Phòng.",
    alternates: { canonical },
  };
}

export default function BlogPostLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
