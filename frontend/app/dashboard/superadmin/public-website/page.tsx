"use client";

import Link from "next/link";

export default function PublicWebsiteManagement() {
  const sections = [
    { name: "Header & Menu", href: "/dashboard/superadmin/public-website/header", icon: "📋", description: "Navigation menu, phone, email, social links" },
    { name: "Home Page", href: "/dashboard/superadmin/public-website/home", icon: "🏠", description: "Edit hero section, stats, and main content" },
    { name: "About Page", href: "/dashboard/superadmin/public-website/about", icon: "ℹ️", description: "Company story, mission, vision, and team" },
    { name: "Hero Section", href: "/dashboard/superadmin/public-website/hero", icon: "🎯", description: "Configure hero banners and CTAs" },
    { name: "Courses", href: "/dashboard/superadmin/public-website/courses", icon: "📚", description: "Manage public course listings" },
    { name: "Centers", href: "/dashboard/superadmin/public-website/centers", icon: "📍", description: "Learning center locations and info" },
    { name: "Blog", href: "/dashboard/superadmin/public-website/blog", icon: "📝", description: "Create and manage blog posts" },
    { name: "Testimonials", href: "/dashboard/superadmin/public-website/testimonials", icon: "⭐", description: "Manage customer reviews and testimonials" },
    { name: "Student Achievements", href: "/dashboard/superadmin/public-website/achievements", icon: "🏆", description: "Showcase outstanding students and exam results" },
    { name: "Leadership Team", href: "/dashboard/superadmin/public-website/leadership", icon: "👔", description: "Board members and leadership profiles" },
    { name: "FAQ", href: "/dashboard/superadmin/public-website/faq", icon: "❓", description: "Frequently asked questions" },
    { name: "Contact", href: "/dashboard/superadmin/public-website/contact", icon: "📞", description: "Contact page and form settings" },
    { name: "Media Library", href: "/dashboard/superadmin/public-website/media", icon: "🖼️", description: "Upload and manage images and videos" },
    { name: "Branding", href: "/dashboard/superadmin/public-website/branding", icon: "🎨", description: "Configure colors, logos, and brand assets" },
    { name: "Footer", href: "/dashboard/superadmin/public-website/footer", icon: "📋", description: "Edit footer content and links" },
    { name: "Privacy Policy", href: "/dashboard/superadmin/public-website/privacy", icon: "🔒", description: "Privacy policy content and sections" },
    { name: "Terms of Service", href: "/dashboard/superadmin/public-website/terms", icon: "📜", description: "Terms and conditions content" },
    { name: "SEO Settings", href: "/dashboard/superadmin/public-website/seo", icon: "🔍", description: "Configure meta tags and SEO settings" },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/superadmin" className="hover:text-blue-600">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-900">Public Website</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">🌐 Public Website Management</h1>
        <p className="text-gray-600 mt-2">Manage your public-facing website content and settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sections.map((section) => (
          <Link
            key={section.name}
            href={section.href}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-200 hover:border-blue-300"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">{section.icon}</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{section.name}</h3>
                <p className="text-sm text-gray-500">{section.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <a href="/" target="_blank" className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
            👁️ View Live Website
          </a>
          <a href="/about" target="_blank" className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
            📄 View About Page
          </a>
          <a href="/courses" target="_blank" className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
            📚 View Courses Page
          </a>
          <a href="/contact" target="_blank" className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
            📞 View Contact Page
          </a>
        </div>
      </div>
    </div>
  );
}
