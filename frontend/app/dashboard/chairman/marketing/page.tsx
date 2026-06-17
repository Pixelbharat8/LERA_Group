"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

interface QuickStat {
  label: string;
  value: string;
  change: number;
  icon: string;
  color: string;
}

const sections = [
  {
    id: "social-media",
    title: "Social Media Management",
    description: "Manage social links, tracking pixels, and sharing defaults",
    icon: "📱",
    href: "/dashboard/chairman/marketing/social-media",
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "ads-campaigns",
    title: "Ads & Campaigns",
    description: "Create and manage advertising campaigns across platforms",
    icon: "📣",
    href: "/dashboard/chairman/marketing/ads-campaigns",
    color: "from-purple-500 to-purple-600",
  },
  {
    id: "content-calendar",
    title: "Content Calendar",
    description: "Plan and schedule social media content",
    icon: "📅",
    href: "/dashboard/chairman/marketing/content-calendar",
    color: "from-green-500 to-green-600",
  },
  {
    id: "analytics",
    title: "Social Analytics",
    description: "Performance insights across all platforms",
    icon: "📊",
    href: "/dashboard/chairman/marketing/analytics",
    color: "from-orange-500 to-orange-600",
  },
];

export default function ChairmanMarketingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<QuickStat[]>([
    { label: "Total Followers", value: "31.2K", change: 11.2, icon: "👥", color: "bg-blue-500" },
    { label: "Monthly Engagement", value: "29.6K", change: 18.5, icon: "💬", color: "bg-green-500" },
    { label: "Active Campaigns", value: "4", change: 0, icon: "📣", color: "bg-purple-500" },
    { label: "Total Ad Spend", value: "₫115.5M", change: -5.2, icon: "💰", color: "bg-orange-500" },
  ]);
  const [platforms, setPlatforms] = useState([
    { name: "Facebook", icon: "📘", followers: "12.5K", growth: "+8.5%" },
    { name: "Instagram", icon: "📸", followers: "8.3K", growth: "+12.3%" },
    { name: "TikTok", icon: "🎵", followers: "5.1K", growth: "+28.5%" },
    { name: "Zalo", icon: "💬", followers: "3.2K", growth: "+5.2%" },
  ]);
  const [recentActivity, setRecentActivity] = useState([
    { type: "post", platform: "📘", title: "New Year Enrollment post published", time: "2 hours ago", status: "success" },
    { type: "campaign", platform: "📸", title: "Summer Camp Promo reached 50% budget", time: "5 hours ago", status: "warning" },
    { type: "milestone", platform: "🎵", title: "TikTok reached 5,000 followers!", time: "1 day ago", status: "success" },
    { type: "schedule", platform: "💬", title: "3 posts scheduled for this week", time: "1 day ago", status: "info" },
  ]);
  const [upcomingPosts, setUpcomingPosts] = useState([
    { title: "Student Success Story", date: "Jan 9, 2:00 PM", platforms: "📘📸💬" },
    { title: "Behind the Scenes", date: "Jan 10, 6:00 PM", platforms: "🎵📸" },
    { title: "Weekly Tips", date: "Jan 11, 10:00 AM", platforms: "📘" },
  ]);

  useEffect(() => {
    fetchMarketingStats();
    fetchPlatforms();
    fetchRecentActivity();
    fetchUpcomingPosts();
  }, []);

  const fetchPlatforms = async () => {
    try {
      const data = await apiFetch("/api/social-platforms");
      if (Array.isArray(data) && data.length > 0) {
        const platformIcons: Record<string, string> = {
          facebook: "📘", instagram: "📸", tiktok: "🎵", zalo: "💬", youtube: "📺", twitter: "🐦"
        };
        setPlatforms(data.map((p: any) => ({
          name: p.platformName || p.name,
          icon: platformIcons[p.platformName?.toLowerCase()] || "📱",
          followers: p.followerCount >= 1000 ? `${(p.followerCount / 1000).toFixed(1)}K` : String(p.followerCount || 0),
          growth: `+${p.growthRate || 0}%`,
        })));
      }
    } catch (e) {
      console.log("Using default platforms");
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const posts = await apiFetch("/api/social-media-posts?limit=4");
      if (Array.isArray(posts) && posts.length > 0) {
        const platformIcons: Record<string, string> = {
          facebook: "📘", instagram: "📸", tiktok: "🎵", zalo: "💬"
        };
        setRecentActivity(posts.slice(0, 4).map((p: any) => ({
          type: "post",
          platform: platformIcons[p.platform?.toLowerCase()] || "📱",
          title: p.content?.substring(0, 40) + (p.content?.length > 40 ? "..." : "") || "Post published",
          time: p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : "Recently",
          status: p.status === "PUBLISHED" ? "success" : p.status === "SCHEDULED" ? "info" : "warning",
        })));
      }
    } catch (e) {
      console.log("Using default activity");
    }
  };

  const fetchUpcomingPosts = async () => {
    try {
      const posts = await apiFetch("/api/social-media-posts?status=SCHEDULED");
      if (Array.isArray(posts) && posts.length > 0) {
        const platformIcons: Record<string, string> = {
          facebook: "📘", instagram: "📸", tiktok: "🎵", zalo: "💬"
        };
        setUpcomingPosts(posts.slice(0, 3).map((p: any) => ({
          title: p.content?.substring(0, 30) + (p.content?.length > 30 ? "..." : "") || "Scheduled Post",
          date: p.scheduledAt ? new Date(p.scheduledAt).toLocaleString() : "Scheduled",
          platforms: platformIcons[p.platform?.toLowerCase()] || "📱",
        })));
      }
    } catch (e) {
      console.log("Using default upcoming posts");
    }
  };

  const fetchMarketingStats = async () => {
    try {
      let activeCampaigns = 4;
      let totalSpend = 115500000;
      let totalLikes = 29600;
      let totalReach = 31200;

      // Fetch campaign stats - apiFetch returns data directly
      try {
        const campaigns = await apiFetch("/api/marketing-campaigns");
        if (Array.isArray(campaigns)) {
          activeCampaigns = campaigns.filter((c: Record<string, string>) => c.status === "ACTIVE").length;
          totalSpend = campaigns.reduce((sum: number, c: Record<string, number>) => sum + (c.spentAmount || 0), 0);
        }
      } catch (e) {
        console.log("Using default campaign stats");
      }

      // Fetch post stats
      try {
        const postStats = await apiFetch("/api/social-media-posts/stats");
        if (postStats) {
          totalLikes = postStats.totalLikes || 0;
          totalReach = postStats.totalReach || 0;
        }
      } catch (e) {
        console.log("Using default post stats");
      }

      setStats([
        { label: "Total Reach", value: totalReach >= 1000 ? `${(totalReach / 1000).toFixed(1)}K` : String(totalReach), change: 11.2, icon: "👥", color: "bg-blue-500" },
        { label: "Total Engagement", value: totalLikes >= 1000 ? `${(totalLikes / 1000).toFixed(1)}K` : String(totalLikes), change: 18.5, icon: "💬", color: "bg-green-500" },
        { label: "Active Campaigns", value: String(activeCampaigns), change: 0, icon: "📣", color: "bg-purple-500" },
        { label: "Total Ad Spend", value: `₫${(totalSpend / 1000000).toFixed(1)}M`, change: -5.2, icon: "💰", color: "bg-orange-500" },
      ]);
    } catch (error) {
      console.error("Error fetching marketing stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/chairman" className="text-gray-500 hover:text-gray-700">
                ← Back
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">📢 Marketing & Social Media</h1>
                <p className="text-sm text-gray-500">Comprehensive marketing management for Chairman</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/chairman/marketing/roi"
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                📊 ROI by channel
              </Link>
              <Link
                href="/dashboard/chairman/marketing/content-calendar"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                ➕ New Post
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                  {stat.icon}
                </div>
                <span className={`text-sm font-medium ${stat.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {stat.change >= 0 ? "↑" : "↓"} {Math.abs(stat.change)}%
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Sections */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Marketing Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sections.map((s) => (
            <Link
              key={s.id}
              href={s.href}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:-translate-y-1 transition-all group"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform`}>
                {s.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{s.title}</h3>
              <p className="text-sm text-gray-600">{s.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">🔔 Recent Activity</h2>
              <Link href="/dashboard/chairman/marketing/analytics" className="text-sm text-blue-600 hover:underline">
                View All
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {recentActivity.map((activity, i) => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <div className="text-2xl">{activity.platform}</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{activity.title}</div>
                    <div className="text-sm text-gray-500">{activity.time}</div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === "success" ? "bg-green-500" :
                    activity.status === "warning" ? "bg-yellow-500" : "bg-blue-500"
                  }`}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions & Platform Overview */}
          <div className="space-y-6">
            {/* Platform Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">📱 Platform Overview</h2>
              </div>
              <div className="p-4 space-y-3">
                {platforms.map((platform) => (
                  <div key={platform.name} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{platform.icon}</span>
                      <span className="font-medium text-gray-900">{platform.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600">{platform.followers}</span>
                      <span className="text-green-600 text-sm">{platform.growth}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-100">
                <Link
                  href="/dashboard/chairman/marketing/social-media"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Manage All Platforms →
                </Link>
              </div>
            </div>

            {/* Upcoming Posts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-900">📅 Upcoming Posts</h2>
                <Link href="/dashboard/chairman/marketing/content-calendar" className="text-sm text-blue-600 hover:underline">
                  View Calendar
                </Link>
              </div>
              <div className="p-4 space-y-3">
                {upcomingPosts.map((post, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div>
                      <div className="font-medium text-gray-900">{post.title}</div>
                      <div className="text-sm text-gray-500">{post.date}</div>
                    </div>
                    <div className="text-lg">{post.platforms}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg mb-1">Need Help with Marketing?</h2>
              <p className="text-blue-100">Access guides, best practices, and support for your marketing campaigns.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { window.location.href = "/dashboard/help"; }}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
              >
                📚 View Guides
              </button>
              <button
                onClick={() => { window.location.href = "/dashboard/chairman/support"; }}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition"
              >
                💬 Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
