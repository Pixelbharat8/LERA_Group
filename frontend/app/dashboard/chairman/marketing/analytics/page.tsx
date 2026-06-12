"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";

interface AnalyticsData {
  platform: string;
  icon: string;
  color: string;
  followers: number;
  followersGrowth: number;
  posts: number;
  engagement: number;
  engagementRate: number;
  reach: number;
  impressions: number;
  clicks: number;
  topPost: {
    title: string;
    likes: number;
    comments: number;
    shares: number;
  };
}

interface OverviewMetric {
  label: string;
  value: string;
  change: number;
  icon: string;
}

const PLATFORM_META: Record<string, { icon: string; color: string }> = {
  facebook: { icon: "📘", color: "#1877F2" },
  instagram: { icon: "📸", color: "#E4405F" },
  tiktok: { icon: "🎵", color: "#000000" },
  zalo: { icon: "💬", color: "#0068FF" },
  youtube: { icon: "▶️", color: "#FF0000" },
  linkedin: { icon: "💼", color: "#0A66C2" },
  twitter: { icon: "🐦", color: "#1DA1F2" },
};

export default function SocialAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [overview, setOverview] = useState<OverviewMetric[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      // Fetch social analytics overview
      const overviewData = await apiFetch("/api/social-analytics/overview").catch(() => null);
      const postsData = await apiFetch("/api/social-media-posts/stats").catch(() => null);
      
      let platformData: AnalyticsData[] = [];
      
      if (overviewData && typeof overviewData === 'object') {
        // Transform platform data from API
        if (overviewData.platformData && Array.isArray(overviewData.platformData)) {
          platformData = overviewData.platformData.map((p: Record<string, unknown>) => {
            const platformName = (p.platform as string || "").toLowerCase();
            const meta = PLATFORM_META[platformName] || { icon: "📱", color: "#666" };
            return {
              platform: p.platform as string || platformName,
              icon: meta.icon,
              color: meta.color,
              followers: p.followers as number || 0,
              followersGrowth: p.newFollowers ? ((p.newFollowers as number) / (p.followers as number || 1) * 100) : 0,
              posts: p.postsCount as number || 0,
              engagement: p.totalEngagement as number || 0,
              engagementRate: Number(p.engagementRate) || 0,
              reach: p.totalReach as number || 0,
              impressions: p.totalImpressions as number || 0,
              clicks: p.websiteClicks as number || 0,
              topPost: { title: "Top Post", likes: 0, comments: 0, shares: 0 },
            };
          });
        }
        
        // Build overview metrics
        const totalFollowers = overviewData.totalFollowers || 0;
        const totalEngagement = overviewData.totalEngagement || 0;
        const totalReach = overviewData.totalReach || 0;
        const totalPosts = overviewData.totalPosts || 0;
        
        setOverview([
          { label: "Total Followers", value: totalFollowers >= 1000 ? `${(totalFollowers / 1000).toFixed(1)}K` : String(totalFollowers), change: 8.5, icon: "👥" },
          { label: "Total Engagement", value: totalEngagement >= 1000 ? `${(totalEngagement / 1000).toFixed(1)}K` : String(totalEngagement), change: 12.3, icon: "💬" },
          { label: "Total Reach", value: totalReach >= 1000 ? `${(totalReach / 1000).toFixed(1)}K` : String(totalReach), change: 15.7, icon: "👁️" },
          { label: "Total Posts", value: String(totalPosts), change: 5.2, icon: "📝" },
        ]);
      }
      
      // If no data from API, show empty state
      if (platformData.length === 0) {
        setOverview([
          { label: "Total Followers", value: "0", change: 0, icon: "👥" },
          { label: "Total Engagement", value: "0", change: 0, icon: "💬" },
          { label: "Total Reach", value: "0", change: 0, icon: "👁️" },
          { label: "Total Posts", value: "0", change: 0, icon: "📝" },
        ]);
      }
      
      setAnalytics(platformData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setAnalytics([]);
      setOverview([
        { label: "Total Followers", value: "0", change: 0, icon: "👥" },
        { label: "Total Engagement", value: "0", change: 0, icon: "💬" },
        { label: "Total Reach", value: "0", change: 0, icon: "👁️" },
        { label: "Total Posts", value: "0", change: 0, icon: "📝" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/chairman/marketing" className="text-gray-500 hover:text-gray-700">
                ← Back
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">📊 Social Media Analytics</h1>
                <p className="text-sm text-gray-500">Performance insights across all platforms</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                {(["7d", "30d", "90d"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-3 py-1.5 text-sm rounded-md transition ${
                      dateRange === range ? "bg-white shadow-sm font-medium" : "text-gray-600"
                    }`}
                  >
                    {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
                  </button>
                ))}
              </div>
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">
                📥 Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {overview.map((metric) => (
            <div key={metric.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{metric.icon}</span>
                <span className={`text-sm font-medium ${metric.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {metric.change >= 0 ? "↑" : "↓"} {Math.abs(metric.change)}%
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
              <div className="text-sm text-gray-500">{metric.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Performance */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Platform Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Followers</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Growth</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Posts</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Engagement</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Eng. Rate</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Reach</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Clicks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {analytics.map((platform) => (
                  <tr key={platform.platform} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{platform.icon}</span>
                        <span className="font-medium text-gray-900">{platform.platform}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-medium">{formatNumber(platform.followers)}</td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-green-600">+{platform.followersGrowth}%</span>
                    </td>
                    <td className="px-4 py-4 text-right">{platform.posts}</td>
                    <td className="px-4 py-4 text-right font-medium">{formatNumber(platform.engagement)}</td>
                    <td className="px-4 py-4 text-right">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        platform.engagementRate >= 5 ? "bg-green-100 text-green-700" : 
                        platform.engagementRate >= 3 ? "bg-yellow-100 text-yellow-700" : 
                        "bg-red-100 text-red-700"
                      }`}>
                        {platform.engagementRate}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">{formatNumber(platform.reach)}</td>
                    <td className="px-4 py-4 text-right">{formatNumber(platform.clicks)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Posts & Charts */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performing Posts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">🏆 Top Performing Posts</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {analytics.map((platform) => (
                <div key={platform.platform} className="p-4 flex items-center gap-4">
                  <span className="text-2xl">{platform.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 truncate">{platform.topPost.title}</div>
                    <div className="text-sm text-gray-500">{platform.platform}</div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span>❤️ {platform.topPost.likes}</span>
                    <span>💬 {platform.topPost.comments}</span>
                    <span>🔄 {platform.topPost.shares}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Engagement by Platform */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">📊 Engagement Distribution</h2>
            </div>
            <div className="p-4 space-y-4">
              {analytics.map((platform) => {
                const totalEng = analytics.reduce((sum, p) => sum + p.engagement, 0);
                const percentage = (platform.engagement / totalEng) * 100;
                return (
                  <div key={platform.platform}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span>{platform.icon}</span>
                        <span className="text-sm font-medium text-gray-700">{platform.platform}</span>
                      </div>
                      <span className="text-sm text-gray-600">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all"
                        style={{ width: `${percentage}%`, backgroundColor: platform.color }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <h2 className="font-bold text-lg mb-4">💡 AI Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-medium mb-2">Best Performing Platform</div>
              <div className="text-2xl">🎵 TikTok</div>
              <div className="text-sm opacity-80 mt-1">12.4% engagement rate, +28.5% growth</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-medium mb-2">Best Posting Time</div>
              <div className="text-2xl">🕕 6:00 PM</div>
              <div className="text-sm opacity-80 mt-1">Posts at this time get 34% more engagement</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="font-medium mb-2">Recommended Action</div>
              <div className="text-2xl">📸 More Reels</div>
              <div className="text-sm opacity-80 mt-1">Video content gets 2.5x more reach than images</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
