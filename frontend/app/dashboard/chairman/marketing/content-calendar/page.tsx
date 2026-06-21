"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";

interface ContentPost {
  id: string;
  title: string;
  content: string;
  platform: string[];
  mediaUrl: string;
  mediaType: "image" | "video" | "carousel";
  scheduledAt: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "FAILED";
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  createdBy: string;
  createdAt: string;
}

const PLATFORMS = [
  { id: "facebook", name: "Facebook", icon: "📘", color: "#1877F2" },
  { id: "instagram", name: "Instagram", icon: "📸", color: "#E4405F" },
  { id: "tiktok", name: "TikTok", icon: "🎵", color: "#000000" },
  { id: "zalo", name: "Zalo", icon: "💬", color: "#0068FF" },
  { id: "youtube", name: "YouTube", icon: "▶️", color: "#FF0000" },
];

export default function ContentCalendarPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<"calendar" | "list" | "create">("calendar");
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newPost, setNewPost] = useState<Partial<ContentPost>>({
    title: "",
    content: "",
    platform: ["facebook"],
    mediaUrl: "",
    mediaType: "image",
    scheduledAt: "",
    status: "DRAFT",
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const data = await apiFetch("/api/social-media-posts").catch(() => []);
      if (Array.isArray(data) && data.length > 0) {
        // Transform API data to ContentPost format
        const transformedPosts: ContentPost[] = data.map((post: any) => ({
          id: String(post.id),
          title: String(post.title || ""),
          content: String(post.content || ""),
          platform: post.platforms || ["facebook"],
          mediaUrl: post.mediaUrls?.[0] || "",
          mediaType: "image" as const,
          scheduledAt: String(post.scheduledAt || post.createdAt || new Date().toISOString()),
          status: (["DRAFT", "SCHEDULED", "PUBLISHED", "FAILED"].includes(String(post.status || "").toUpperCase()) 
            ? String(post.status || "DRAFT").toUpperCase() 
            : "DRAFT") as "DRAFT" | "SCHEDULED" | "PUBLISHED" | "FAILED",
          engagement: {
            likes: Number(post.likes) || 0,
            comments: Number(post.comments) || 0,
            shares: Number(post.shares) || 0,
            views: Number(post.reach) || 0,
          },
          createdBy: "Marketing Team",
          createdAt: String(post.createdAt || new Date().toISOString()),
        }));
        setPosts(transformedPosts);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Open the modal pre-filled to edit an existing post.
  const startEdit = (post: ContentPost) => {
    setEditingId(post.id);
    setNewPost({
      title: post.title,
      content: post.content,
      platform: post.platform,
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType,
      scheduledAt: post.scheduledAt ? String(post.scheduledAt).slice(0, 16) : "",
      status: post.status,
    });
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingId(null);
    setNewPost({ title: "", content: "", platform: ["facebook"], mediaUrl: "", mediaType: "image", scheduledAt: "", status: "DRAFT" });
  };

  const handleCreatePost = async () => {
    try {
      const postData = {
        title: newPost.title,
        content: newPost.content,
        platforms: newPost.platform,
        mediaUrls: newPost.mediaUrl ? [newPost.mediaUrl] : [],
        contentType: newPost.mediaType,
        scheduledAt: newPost.scheduledAt,
        status: newPost.status?.toLowerCase() || "draft",
      };

      // Update when editing, create otherwise.
      await apiFetch(
        editingId ? `/api/social-media-posts/${editingId}` : "/api/social-media-posts",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        }
      );

      await fetchPosts();
      closeModal();
    } catch (error) {
      console.error(editingId ? "Error updating post:" : "Error creating post:", error);
      alert((error as any)?.message || "Could not save the post.");
    }
  };

  const handlePublishPost = async (postId: string) => {
    try {
      await apiFetch(`/api/social-media-posts/${postId}/publish`, { method: "PUT" }, { silent: true });
      await fetchPosts();
      alert("Published to the connected network(s).");
    } catch (error: any) {
      await fetchPosts();
      // Surface the real reason (e.g. "facebook: skipped: not connected" or a Graph API error).
      alert(error?.message || "Could not publish. Connect the platform first, then try again.");
    }
  };

  const handleSchedulePost = async (post: ContentPost) => {
    try {
      await apiFetch(`/api/social-media-posts/${post.id}/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: post.scheduledAt }),
      });
      await fetchPosts();
    } catch (error) {
      console.error("Error scheduling post:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED": return "bg-green-100 text-green-700";
      case "SCHEDULED": return "bg-blue-100 text-blue-700";
      case "DRAFT": return "bg-gray-100 text-gray-700";
      case "FAILED": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getPostsForDay = (day: number) => {
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return posts.filter((p) => p.scheduledAt.startsWith(dateStr));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
                <h1 className="text-xl font-bold text-gray-900">📅 Content Calendar</h1>
                <p className="text-sm text-gray-500">Plan and schedule social media content</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveView("calendar")}
                  className={`px-3 py-1.5 text-sm rounded-md ${activeView === "calendar" ? "bg-white shadow-sm" : ""}`}
                >
                  📅 Calendar
                </button>
                <button
                  onClick={() => setActiveView("list")}
                  className={`px-3 py-1.5 text-sm rounded-md ${activeView === "list" ? "bg-white shadow-sm" : ""}`}
                >
                  📋 List
                </button>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                ➕ New Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Total Posts</div>
            <div className="text-2xl font-bold text-gray-900">{posts.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Scheduled</div>
            <div className="text-2xl font-bold text-blue-600">{posts.filter((p) => p.status === "SCHEDULED").length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Published</div>
            <div className="text-2xl font-bold text-green-600">{posts.filter((p) => p.status === "PUBLISHED").length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Total Engagement</div>
            <div className="text-2xl font-bold text-purple-600">
              {posts.reduce((sum, p) => sum + p.engagement.likes + p.engagement.comments + p.engagement.shares, 0)}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Total Views</div>
            <div className="text-2xl font-bold text-orange-600">
              {posts.reduce((sum, p) => sum + p.engagement.views, 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        {activeView === "calendar" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Calendar Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <button
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ←
              </button>
              <h2 className="text-lg font-bold text-gray-900">
                {selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </h2>
              <button
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                →
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 border-b border-gray-200">
                  {day}
                </div>
              ))}
              {getDaysInMonth(selectedDate).map((day, i) => {
                const dayPosts = day ? getPostsForDay(day) : [];
                const isToday = day === new Date().getDate() && 
                  selectedDate.getMonth() === new Date().getMonth() && 
                  selectedDate.getFullYear() === new Date().getFullYear();

                return (
                  <div
                    key={i}
                    className={`min-h-[120px] p-2 border-b border-r border-gray-100 ${day ? "bg-white" : "bg-gray-50"} ${isToday ? "bg-blue-50" : ""}`}
                  >
                    {day && (
                      <>
                        <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600" : "text-gray-700"}`}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {dayPosts.slice(0, 3).map((post) => (
                            <div
                              key={post.id}
                              className={`text-xs p-1 rounded truncate ${getStatusColor(post.status)}`}
                              title={post.title}
                            >
                              {post.platform.map((p) => PLATFORMS.find((pl) => pl.id === p)?.icon).join("")} {post.title}
                            </div>
                          ))}
                          {dayPosts.length > 3 && (
                            <div className="text-xs text-gray-500">+{dayPosts.length - 3} more</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeView === "list" && (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex gap-4">
                  {post.mediaUrl && (
                    <img src={post.mediaUrl} alt="" className="w-24 h-24 object-cover rounded-lg" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{post.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{post.content}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(post.status)}`}>
                        {post.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1">
                        {post.platform.map((p) => (
                          <span key={p} title={p} className="text-lg">
                            {PLATFORMS.find((pl) => pl.id === p)?.icon}
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">📅 {formatDate(post.scheduledAt)}</span>
                      {post.status === "PUBLISHED" && (
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span>❤️ {post.engagement.likes}</span>
                          <span>💬 {post.engagement.comments}</span>
                          <span>🔄 {post.engagement.shares}</span>
                          <span>👁️ {post.engagement.views}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => startEdit(post)} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg">Edit</button>
                    {post.status === "DRAFT" && (
                      <button
                        onClick={() => handleSchedulePost(post)}
                        className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg"
                      >
                        Schedule
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? "Edit Post" : "Create New Post"}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Post Title</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., New Course Announcement"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={4}
                  placeholder="Write your post content here... Include hashtags!"
                />
                <p className="text-xs text-gray-400 mt-1">{(newPost.content || "").length}/2200 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((platform) => (
                    <button
                      key={platform.id}
                      onClick={() => {
                        const current = newPost.platform || [];
                        if (current.includes(platform.id)) {
                          setNewPost({ ...newPost, platform: current.filter((p) => p !== platform.id) });
                        } else {
                          setNewPost({ ...newPost, platform: [...current, platform.id] });
                        }
                      }}
                      className={`px-3 py-2 rounded-lg border flex items-center gap-2 transition ${
                        (newPost.platform || []).includes(platform.id)
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <span>{platform.icon}</span>
                      <span className="text-sm">{platform.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Media URL</label>
                <input
                  type="url"
                  value={newPost.mediaUrl}
                  onChange={(e) => setNewPost({ ...newPost, mediaUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Media Type</label>
                  <select
                    value={newPost.mediaType}
                    onChange={(e) => setNewPost({ ...newPost, mediaType: e.target.value as "image" | "video" | "carousel" })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="carousel">Carousel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schedule For</label>
                  <input
                    type="datetime-local"
                    value={newPost.scheduledAt}
                    onChange={(e) => setNewPost({ ...newPost, scheduledAt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => { setNewPost({ ...newPost, status: "DRAFT" }); handleCreatePost(); }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Save as Draft
              </button>
              <button
                onClick={() => { setNewPost({ ...newPost, status: "SCHEDULED" }); handleCreatePost(); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Schedule Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
