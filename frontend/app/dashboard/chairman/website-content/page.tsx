"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../../../lib/api";
import Link from "next/link";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

interface ContentSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  lastUpdated?: string;
}

const contentSections: ContentSection[] = [
  {
    id: "header",
    title: "Header & Menu",
    description: "Navigation menu, phone, email, social links, and CTA button",
    icon: "📋",
    href: "/dashboard/chairman/website-content/header"
  },
  {
    id: "home",
    title: "Home Page",
    description: "Hero section, featured courses, testimonials, and call-to-action sections",
    icon: "🏠",
    href: "/dashboard/chairman/website-content/home"
  },
  {
    id: "about",
    title: "About Page",
    description: "Company story, mission, vision, team members, and statistics",
    icon: "ℹ️",
    href: "/dashboard/chairman/website-content/about"
  },
  {
    id: "courses",
    title: "Courses Page",
    description: "Course listings, categories, and course details content",
    icon: "📚",
    href: "/dashboard/chairman/website-content/courses"
  },
  {
    id: "centers",
    title: "Centers Page",
    description: "Learning center locations and contact information",
    icon: "📍",
    href: "/dashboard/chairman/website-content/centers"
  },
  {
    id: "contact",
    title: "Contact Page",
    description: "Contact form settings, FAQs, and support information",
    icon: "📞",
    href: "/dashboard/chairman/website-content/contact"
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    description: "Privacy policy content and sections",
    icon: "🔒",
    href: "/dashboard/chairman/website-content/privacy"
  },
  {
    id: "terms",
    title: "Terms of Service",
    description: "Terms and conditions content and sections",
    icon: "📜",
    href: "/dashboard/chairman/website-content/terms"
  },
  {
    id: "testimonials",
    title: "Testimonials",
    description: "Customer reviews and success stories",
    icon: "⭐",
    href: "/dashboard/chairman/website-content/testimonials"
  },
  {
    id: "faq",
    title: "FAQ",
    description: "Frequently asked questions",
    icon: "❓",
    href: "/dashboard/chairman/website-content/faq"
  },
  {
    id: "leadership",
    title: "Leadership Team",
    description: "Board members, executives, and leadership profiles",
    icon: "👔",
    href: "/dashboard/chairman/website-content/leadership"
  },
  {
    id: "branding",
    title: "Branding & SEO",
    description: "Logo, colors, meta tags, and SEO settings",
    icon: "🎨",
    href: "/dashboard/chairman/website-content/branding"
  },
  {
    id: "hero",
    title: "Hero Section",
    description: "Main hero banner, headlines, and call-to-action on homepage",
    icon: "🖼️",
    href: "/dashboard/chairman/website-content/hero"
  },
  {
    id: "footer",
    title: "Footer",
    description: "Footer navigation, social links, and copyright information",
    icon: "📎",
    href: "/dashboard/chairman/website-content/footer"
  },
  {
    id: "blog",
    title: "Blog Posts",
    description: "Blog articles, news updates, and announcements",
    icon: "📝",
    href: "/dashboard/chairman/website-content/blog"
  },
  {
    id: "settings",
    title: "Website Settings",
    description: "General website configuration, header settings, and display options",
    icon: "⚙️",
    href: "/dashboard/chairman/website-content/settings"
  }
];

export default function WebsiteContentPage() {
  const [stats, setStats] = useState({
    totalPages: 10,
    lastUpdated: "Never",
    publishedTestimonials: 0,
    activeCourses: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [testimonials, courses] = await Promise.all([
        apiFetch("/api/testimonials/published").catch(() => []),
        apiFetch("/api/courses").catch(() => [])
      ]);
      
      setStats({
        totalPages: 10,
        lastUpdated: new Date().toLocaleDateString(),
        publishedTestimonials: Array.isArray(testimonials) ? testimonials.length : 0,
        activeCourses: Array.isArray(courses) ? courses.length : 0
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <div className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white p-4 z-50">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-xl font-bold">L</span>
          </div>
          <div>
            <div className="font-bold">LERA Academy</div>
            <div className="text-xs text-gray-400">Chairman Panel</div>
          </div>
        </div>
        <nav className="space-y-2">
          <Link href="/dashboard/chairman" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors">
            <span>📊</span> Dashboard
          </Link>
          <Link href="/dashboard/chairman/website-content" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-600 text-white">
            <span>🌐</span> Website Content
          </Link>
          <Link href="/dashboard/chairman/users" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors">
            <span>👥</span> Users
          </Link>
          <Link href="/dashboard/chairman/centers" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors">
            <span>🏢</span> Centers
          </Link>
          <Link href="/dashboard/chairman/courses" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors">
            <span>📚</span> Courses
          </Link>
          <Link href="/dashboard/chairman/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors">
            <span>⚙️</span> Settings
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Website Content Management</h1>
          <p className="text-gray-600 mt-2">Manage all public website pages and content from one place</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📄</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalPages}</div>
                <div className="text-sm text-gray-500">Total Pages</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.activeCourses}</div>
                <div className="text-sm text-gray-500">Active Courses</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.publishedTestimonials}</div>
                <div className="text-sm text-gray-500">Testimonials</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🌐</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">Live</div>
                <div className="text-sm text-gray-500">Website Status</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Quick Actions</h2>
              <p className="text-blue-100">Common tasks for website management</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a 
                href="/" 
                target="_blank" 
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
              >
                👁️ View Website
              </a>
              <Link 
                href="/dashboard/chairman/website-content/home" 
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
              >
                ✏️ Edit Home Page
              </Link>
              <Link 
                href="/dashboard/chairman/website-content/testimonials" 
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
              >
                ⭐ Manage Reviews
              </Link>
            </div>
          </div>
        </div>

        {/* Content Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contentSections.map((section) => (
            <Link
              key={section.id}
              href={section.href}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200 group"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gray-100 group-hover:bg-blue-100 rounded-xl flex items-center justify-center transition-colors">
                  <span className="text-3xl">{section.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{section.description}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-gray-400">Click to edit</span>
                <span className="text-blue-600 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-2">💡 Tips for Content Management</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• All content supports both English (EN) and Vietnamese (VI) languages</li>
            <li>• Changes are saved immediately and visible on the public website</li>
            <li>• Use the preview button to see changes before publishing</li>
            <li>• Images should be uploaded in high resolution (min 1200px width)</li>
          </ul>
        </div>
        </div>
      </div>
    </div>
  );
}
