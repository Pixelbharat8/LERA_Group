import { MetadataRoute } from 'next'

// Course code → public slug (mirrors the courses pages).
const CODE_TO_SLUG: Record<string, string> = {
  STARTERS: 'lera-starters',
  EXPLORERS: 'lera-explorers',
  PRIMARY: 'lera-primary',
  TEENS: 'lera-teens',
  IELTS_SAT: 'ielts-sat',
  BUSINESS: 'business-english',
  CONVERSATION: 'conversation',
  PHONICS: 'phonics',
}

// Backend the sitemap reads live data from (same default as next.config rewrites).
const ACADEMY_URL = process.env.ACADEMY_SERVICE_URL || 'http://localhost:8082'

async function safeJson(path: string): Promise<any[]> {
  try {
    const res = await fetch(`${ACADEMY_URL}${path}`, {
      // Revalidate hourly so newly published content appears without a redeploy.
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://lera.edu.vn'

  const staticPages = [
    '',
    '/about',
    '/teachers',
    '/contact',
    '/courses',
    '/centers',
    '/blog',
    '/book-trial',
    '/placement',
    '/corporate',
    '/faq',
    '/privacy',
    '/terms',
  ]

  // Live courses (fall back to the known catalogue if the backend is unreachable).
  const liveCourses = await safeJson('/api/courses/active')
  const courseSlugs = liveCourses.length > 0
    ? liveCourses.map((c: any) => CODE_TO_SLUG[c.code]).filter(Boolean)
    : Object.values(CODE_TO_SLUG)
  const coursePages = courseSlugs.map((slug: string) => `/courses/${slug}`)

  // Live published blog posts so the articles are crawlable.
  const liveBlog = await safeJson('/api/blog/published')
  const blogPages = liveBlog.map((p: any) => p?.slug).filter(Boolean).map((s: string) => `/blog/${s}`)

  const allPages = [...staticPages, ...coursePages, ...blogPages]

  return allPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : route.startsWith('/blog/') ? 'monthly' : 'weekly',
    priority: route === '' ? 1 : route.startsWith('/courses') ? 0.9 : route.startsWith('/blog/') ? 0.7 : 0.8,
  }))
}
