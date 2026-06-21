"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

interface QuickStat {
  label: string;
  value: string;
  // Real trend/secondary metric from the backend, or null when none exists
  // (we never fabricate a percentage).
  change: number | null;
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
  // All values come from the backend — no hardcoded fallbacks. Empty until loaded.
  const [stats, setStats] = useState<QuickStat[]>([]);
  const [platforms, setPlatforms] = useState<{ name: string; icon: string; followers: string; growth: string }[]>([]);
  const [recentActivity, setRecentActivity] = useState<{ type: string; platform: string; title: string; time: string; status: string }[]>([]);
  const [upcomingPosts, setUpcomingPosts] = useState<{ title: string; date: string; platforms: string }[]>([]);

  useEffect(() => {
    fetchMarketingStats();
    fetchRecentActivity();
    fetchUpcomingPosts();
  }, []);

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

  const fmtK = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n));

  const fetchMarketingStats = async () => {
    try {
      // Campaigns → active count + real spend (sum of spentAmount)
      let activeCampaigns = 0;
      let totalSpend = 0;
      const campaigns = await apiFetch("/api/marketing-campaigns", {}, { silent: true }).catch(() => []);
      if (Array.isArray(campaigns)) {
        activeCampaigns = campaigns.filter((c: any) => c.status === "ACTIVE").length;
        totalSpend = campaigns.reduce((sum: number, c: any) => sum + (Number(c.spentAmount) || 0), 0);
      }

      // Post stats → real reach + engagement (likes + comments + shares) + engagement rate
      let totalReach = 0, totalLikes = 0, totalComments = 0, totalShares = 0;
      let engagementRate: number | null = null;
      const postStats = await apiFetch("/api/social-media-posts/stats", {}, { silent: true }).catch(() => null);
      if (postStats) {
        totalReach = Number(postStats.totalReach) || 0;
        totalLikes = Number(postStats.totalLikes) || 0;
        totalComments = Number(postStats.totalComments) || 0;
        totalShares = Number(postStats.totalShares) || 0;
        engagementRate = typeof postStats.engagementRate === "number" ? postStats.engagementRate : null;
      }
      const engagement = totalLikes + totalComments + totalShares;

      // Platforms → render the overview list AND compute a real follower-weighted growth rate
      let avgGrowth: number | null = null;
      const plat = await apiFetch("/api/social-platforms", {}, { silent: true }).catch(() => []);
      if (Array.isArray(plat) && plat.length > 0) {
        const icons: Record<string, string> = {
          facebook: "📘", instagram: "📸", tiktok: "🎵", zalo: "💬", youtube: "📺", twitter: "🐦", linkedin: "💼", google: "🔍",
        };
        setPlatforms(
          plat
            .filter((p: any) => (Number(p.followerCount) || 0) > 0)
            .sort((a: any, b: any) => (Number(b.followerCount) || 0) - (Number(a.followerCount) || 0))
            .map((p: any) => ({
              name: p.displayName || p.platformName || p.name,
              icon: icons[String(p.platformName).toLowerCase()] || "📱",
              followers: fmtK(Number(p.followerCount) || 0),
              growth: `${(Number(p.growthRate) || 0) >= 0 ? "+" : ""}${Number(p.growthRate) || 0}%`,
            }))
        );
        const totalFollowers = plat.reduce((s: number, p: any) => s + (Number(p.followerCount) || 0), 0);
        if (totalFollowers > 0) {
          const weighted = plat.reduce((s: number, p: any) => s + (Number(p.growthRate) || 0) * (Number(p.followerCount) || 0), 0);
          avgGrowth = Math.round((weighted / totalFollowers) * 10) / 10;
        }
      }

      setStats([
        { label: "Total Reach", value: fmtK(totalReach), change: avgGrowth, icon: "👥", color: "bg-blue-500" },
        { label: "Total Engagement", value: fmtK(engagement), change: engagementRate, icon: "💬", color: "bg-green-500" },
        { label: "Active Campaigns", value: String(activeCampaigns), change: null, icon: "📣", color: "bg-purple-500" },
        { label: "Total Ad Spend", value: `₫${(totalSpend / 1000000).toFixed(1)}M`, change: null, icon: "💰", color: "bg-orange-500" },
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
                {stat.change != null && (
                  <span className={`text-sm font-medium ${stat.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {stat.change >= 0 ? "↑" : "↓"} {Math.abs(stat.change)}%
                  </span>
                )}
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
              {!isLoading && recentActivity.length === 0 && (
                <div className="p-6 text-center text-sm text-gray-400">No recent activity yet.</div>
              )}
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
                {!isLoading && platforms.length === 0 && (
                  <div className="py-4 text-center text-sm text-gray-400">No connected platforms.</div>
                )}
                {platforms.map((platform) => (
                  <Link
                    key={platform.name}
                    href={`/dashboard/chairman/marketing/social-media?platform=${encodeURIComponent(platform.name.toLowerCase())}`}
                    className="flex items-center justify-between py-2 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{platform.icon}</span>
                      <span className="font-medium text-gray-900">{platform.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600">{platform.followers}</span>
                      <span className={`text-sm ${platform.growth.startsWith("-") ? "text-red-600" : "text-green-600"}`}>{platform.growth}</span>
                    </div>
                  </Link>
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
                {!isLoading && upcomingPosts.length === 0 && (
                  <div className="py-4 text-center text-sm text-gray-400">No scheduled posts.</div>
                )}
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
