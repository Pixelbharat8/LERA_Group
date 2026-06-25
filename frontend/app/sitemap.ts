import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://lera.edu.vn'
  
  // Static pages
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

  // Course pages
  const coursePages = [
    '/courses/lera-starters',
    '/courses/lera-explorers',
    '/courses/lera-primary',
    '/courses/lera-teens',
    '/courses/ielts-sat',
    '/courses/business-english',
    '/courses/conversation',
    '/courses/phonics',
  ]
  
  const allPages = [...staticPages, ...coursePages]
  
  return allPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : route.startsWith('/courses') ? 0.9 : 0.8,
  }))
}
