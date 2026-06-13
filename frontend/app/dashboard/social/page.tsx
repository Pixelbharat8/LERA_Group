"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { apiFetch } from "@/lib/api";

interface Post {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    role: string;
  };
  content: string;
  images?: string[];
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  timestamp: Date;
  type: "announcement" | "achievement" | "event" | "general";
}

interface Event {
  id: string;
  title: string;
  date: Date;
  location: string;
  attendees: number;
}

export default function SocialPage() {
  const [language, setLanguage] = useState("EN");
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [activeTab, setActiveTab] = useState<"feed" | "events" | "achievements">("feed");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedLang = Cookies.get("language");
    if (savedLang) setLanguage(savedLang);
    fetchPosts();
    fetchEvents();
  }, []);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch("/api/social/posts");
      if (Array.isArray(data) && data.length > 0) {
        setPosts(data);
      } else {
        setPosts([]);
      }
    } catch {
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const data = await apiFetch("/api/social/events");
      if (Array.isArray(data) && data.length > 0) {
        setEvents(data);
      } else {
        setEvents([]);
      }
    } catch {
      setEvents([]);
    }
  };

  const handleLike = async (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
    
    try {
      await apiFetch(`/api/social/posts/${postId}/like`, { method: "POST" });
    } catch {
      // Already updated optimistically
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;

    const newPost: Post = {
      id: Date.now().toString(),
      author: {
        id: "me",
        name: "You",
        avatar: "Y",
        role: "Student"
      },
      content: newPostContent,
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
      timestamp: new Date(),
      type: "general"
    };

    setPosts(prev => [newPost, ...prev]);
    setNewPostContent("");

    try {
      await apiFetch("/api/social/posts", {
        method: "POST",
        body: JSON.stringify({ content: newPostContent })
      });
    } catch {
      // Already added optimistically
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return language === "VI" ? "Vừa xong" : "Just now";
    if (minutes < 60) return `${minutes}m ${language === "VI" ? "trước" : "ago"}`;
    if (hours < 24) return `${hours}h ${language === "VI" ? "trước" : "ago"}`;
    if (days < 7) return `${days}d ${language === "VI" ? "trước" : "ago"}`;
    return date.toLocaleDateString();
  };

  const getPostTypeStyle = (type: Post["type"]) => {
    switch (type) {
      case "announcement": return "border-l-4 border-l-blue-500";
      case "achievement": return "border-l-4 border-l-yellow-500";
      case "event": return "border-l-4 border-l-green-500";
      default: return "";
    }
  };

  const getPostTypeBadge = (type: Post["type"]) => {
    const badges = {
      announcement: { label: language === "VI" ? "Thông báo" : "Announcement", color: "bg-blue-100 text-blue-700" },
      achievement: { label: language === "VI" ? "Thành tích" : "Achievement", color: "bg-yellow-100 text-yellow-700" },
      event: { label: language === "VI" ? "Sự kiện" : "Event", color: "bg-green-100 text-green-700" },
      general: { label: "", color: "" }
    };
    return badges[type];
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {language === "VI" ? "🌐 Cộng Đồng" : "🌐 Community"}
        </h1>
        <p className="text-gray-600 mt-1">
          {language === "VI"
            ? "Kết nối với bạn bè, giáo viên và nhà trường"
            : "Connect with friends, teachers, and school"}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        {[
          { id: "feed", label: language === "VI" ? "Bảng tin" : "Feed", icon: "📰" },
          { id: "events", label: language === "VI" ? "Sự kiện" : "Events", icon: "📅" },
          { id: "achievements", label: language === "VI" ? "Thành tích" : "Achievements", icon: "🏆" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 -mb-px flex items-center gap-2 transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {activeTab === "feed" && (
            <>
              {/* Create Post */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                    Y
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder={language === "VI" ? "Bạn đang nghĩ gì?" : "What's on your mind?"}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex gap-2">
                        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                          📷
                        </button>
                        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                          📎
                        </button>
                        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                          📍
                        </button>
                      </div>
                      <button
                        onClick={handleCreatePost}
                        disabled={!newPostContent.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        {language === "VI" ? "Đăng" : "Post"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Posts */}
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">
                  {language === "VI" ? "Đang tải..." : "Loading..."}
                </div>
              ) : (
                posts.map(post => (
                  <div
                    key={post.id}
                    className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${getPostTypeStyle(post.type)}`}
                  >
                    <div className="p-4">
                      {/* Post Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                            post.author.role === "Official" ? "bg-blue-600" :
                            post.author.role === "Teacher" ? "bg-green-600" :
                            post.author.role === "Organization" ? "bg-purple-600" :
                            "bg-gray-500"
                          }`}>
                            {post.author.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{post.author.name}</span>
                              {post.author.role !== "Student" && (
                                <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                                  {post.author.role}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{formatTime(post.timestamp)}</p>
                          </div>
                        </div>
                        {getPostTypeBadge(post.type).label && (
                          <span className={`px-2 py-1 text-xs rounded-full ${getPostTypeBadge(post.type).color}`}>
                            {getPostTypeBadge(post.type).label}
                          </span>
                        )}
                      </div>

                      {/* Post Content */}
                      <p className="mt-3 text-gray-900 whitespace-pre-wrap">{post.content}</p>

                      {/* Post Actions */}
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex gap-4">
                          <button
                            onClick={() => handleLike(post.id)}
                            className={`flex items-center gap-1 text-sm transition-colors ${
                              post.isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
                            }`}
                          >
                            <span>{post.isLiked ? "❤️" : "🤍"}</span>
                            <span>{post.likes}</span>
                          </button>
                          <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-500 transition-colors">
                            <span>💬</span>
                            <span>{post.comments}</span>
                          </button>
                          <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-green-500 transition-colors">
                            <span>🔄</span>
                            <span>{post.shares}</span>
                          </button>
                        </div>
                        <button className="text-gray-500 hover:text-gray-700">
                          📤
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === "events" && (
            <div className="space-y-4">
              {events.map(event => (
                <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-xl flex flex-col items-center justify-center text-blue-600">
                      <span className="text-sm font-medium">
                        {event.date.toLocaleDateString(language === "VI" ? "vi-VN" : "en-US", { month: "short" })}
                      </span>
                      <span className="text-xl font-bold">{event.date.getDate()}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{event.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">📍 {event.location}</p>
                      <p className="text-sm text-gray-500">👥 {event.attendees} {language === "VI" ? "người tham gia" : "attendees"}</p>
                    </div>
                    <button className="px-4 py-2 h-fit bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      {language === "VI" ? "Tham gia" : "Join"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "achievements" && (
            <div className="space-y-4">
              {posts.filter(p => p.type === "achievement").map(post => (
                <div key={post.id} className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl shadow-sm border border-yellow-200 p-4">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white text-2xl">
                      🏆
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{post.author.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{post.content}</p>
                      <p className="text-xs text-gray-500 mt-2">{formatTime(post.timestamp)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-4">
              {language === "VI" ? "Thống kê của bạn" : "Your Stats"}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">12</div>
                <div className="text-xs text-gray-600">{language === "VI" ? "Bài đăng" : "Posts"}</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">156</div>
                <div className="text-xs text-gray-600">{language === "VI" ? "Bạn bè" : "Friends"}</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">5</div>
                <div className="text-xs text-gray-600">{language === "VI" ? "Nhóm" : "Groups"}</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">3</div>
                <div className="text-xs text-gray-600">{language === "VI" ? "Thành tích" : "Badges"}</div>
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-4">
              {language === "VI" ? "Sự kiện sắp tới" : "Upcoming Events"}
            </h2>
            <div className="space-y-3">
              {events.slice(0, 3).map(event => (
                <div key={event.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex flex-col items-center justify-center text-blue-600 text-xs">
                    <span className="font-bold">{event.date.getDate()}</span>
                    <span>{event.date.toLocaleDateString(language === "VI" ? "vi-VN" : "en-US", { month: "short" })}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{event.title}</p>
                    <p className="text-xs text-gray-500">{event.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Friends */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-4">
              {language === "VI" ? "Gợi ý kết bạn" : "Suggested Friends"}
            </h2>
            <div className="space-y-3">
              {[
                { name: "Nguyen Thi C", role: "Class 10A", avatar: "NTC" },
                { name: "Le Van D", role: "Class 11B", avatar: "LVD" },
                { name: "Pham Thi E", role: "Class 10A", avatar: "PTE" }
              ].map((friend, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm">
                      {friend.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{friend.name}</p>
                      <p className="text-xs text-gray-500">{friend.role}</p>
                    </div>
                  </div>
                  <button className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors">
                    {language === "VI" ? "Kết bạn" : "Add"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
