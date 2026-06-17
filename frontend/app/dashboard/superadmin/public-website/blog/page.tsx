"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { apiFetch } from "../../../../../lib/api";

interface BlogPost {
  id: string;
  titleEN: string;
  titleVI: string;
  excerptEN: string;
  excerptVI: string;
  contentEN: string;
  contentVI: string;
  image: string;
  category: string;
  author: string;
  publishedAt: string;
  status: "published" | "draft" | "scheduled";
  views: number;
  slug?: string;
  isFeatured?: boolean;
  audience?: string; // ALL | PARENT | STUDENT | TEACHER
}

const initialPosts: BlogPost[] = [];

const categories = ["Learning Tips", "Exam Prep", "Parents Guide", "News", "Events", "Success Stories"];
const audiences = ["ALL", "PARENT", "STUDENT", "TEACHER"];

export default function BlogEditor() {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft" | "scheduled">("all");
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // Editor modal field refs (uncontrolled inputs)
  const titleEnRef = useRef<HTMLInputElement>(null);
  const excerptEnRef = useRef<HTMLTextAreaElement>(null);
  const contentEnRef = useRef<HTMLTextAreaElement>(null);
  const titleViRef = useRef<HTMLInputElement>(null);
  const excerptViRef = useRef<HTMLTextAreaElement>(null);
  const contentViRef = useRef<HTMLTextAreaElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const handleSavePost = async (status: BlogPost["status"]) => {
    const payload = {
      titleEn: titleEnRef.current?.value || "",
      titleVi: titleViRef.current?.value || "",
      excerptEn: excerptEnRef.current?.value || "",
      excerptVi: excerptViRef.current?.value || "",
      contentEn: contentEnRef.current?.value || "",
      contentVi: contentViRef.current?.value || "",
      imageUrl: imageRef.current?.value || "",
      category: categoryRef.current?.value || "News",
      audience: editingPost?.audience || "ALL",
      author: editingPost?.author || "LERA Academy",
      slug: editingPost?.slug,
      status,
    };
    try {
      if (editingPost) {
        await apiFetch(`/api/blog/${editingPost.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/api/blog", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      await fetchPosts();
      setShowEditor(false);
      setEditingPost(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const data = await apiFetch("/api/blog");
      // Map backend data to frontend format
      const mappedPosts = (Array.isArray(data) ? data : []).map((p: any) => ({
        id: p.id,
        titleEN: p.titleEn || "",
        titleVI: p.titleVi || "",
        excerptEN: p.excerptEn || "",
        excerptVI: p.excerptVi || "",
        contentEN: p.contentEn || "",
        contentVI: p.contentVi || "",
        image: p.imageUrl || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=300&fit=crop",
        category: p.category || "News",
        author: p.author || "LERA Academy",
        publishedAt: p.publishedAt || "",
        status: p.status || "draft",
        views: p.views || 0,
        slug: p.slug,
        isFeatured: p.isFeatured,
        audience: p.audience || "ALL"
      }));
      setPosts(mappedPosts);
    } catch (err: any) {
      console.error("Error fetching blog posts:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = filter === "all" ? posts : posts.filter(p => p.status === filter);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this post?")) {
      try {
        await apiFetch(`/api/blog/${id}`, { method: "DELETE" });
        setPosts(posts.filter(p => p.id !== id));
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handleStatusChange = async (id: string, status: BlogPost["status"]) => {
    try {
      const endpoint = status === "published" 
        ? `/api/blog/${id}/publish`
        : `/api/blog/${id}/unpublish`;
      
      await apiFetch(endpoint, { method: "PUT" });
      setPosts(posts.map(p => p.id === id ? { ...p, status } : p));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddPost = async () => {
    const newPost = {
      titleEn: "New Blog Post",
      titleVi: "Bài Viết Mới",
      excerptEn: "Post excerpt...",
      excerptVi: "Tóm tắt bài viết...",
      contentEn: "Full article content here...",
      contentVi: "Nội dung bài viết đầy đủ ở đây...",
      imageUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=300&fit=crop",
      category: "News",
      audience: "ALL",
      author: "LERA Academy",
      status: "draft"
    };
    
    try {
      await apiFetch("/api/blog", {
        method: "POST",
        body: JSON.stringify(newPost)
      });
      await fetchPosts();
      setShowEditor(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span>Public Website</span>
            <span>/</span>
            <span className="text-gray-900">Blog & Posts</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">📝 Blog & Posts Manager</h1>
          <p className="text-gray-500">Create and manage blog posts for the website</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingPost(null);
              setShowEditor(true);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            ➕ New Post
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">📄</div>
          <div>
            <p className="text-2xl font-bold">{posts.length}</p>
            <p className="text-sm text-gray-500">Total Posts</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">✅</div>
          <div>
            <p className="text-2xl font-bold">{posts.filter(p => p.status === "published").length}</p>
            <p className="text-sm text-gray-500">Published</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">📝</div>
          <div>
            <p className="text-2xl font-bold">{posts.filter(p => p.status === "draft").length}</p>
            <p className="text-sm text-gray-500">Drafts</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">👁</div>
          <div>
            <p className="text-2xl font-bold">{posts.reduce((acc, p) => acc + p.views, 0).toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Views</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex gap-2">
          {(["all", "published", "draft", "scheduled"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post) => (
          <div key={post.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="relative h-40">
              <img src={post.image} alt={post.titleEN} className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  post.status === "published" 
                    ? "bg-green-500 text-white"
                    : post.status === "draft"
                    ? "bg-yellow-500 text-white"
                    : "bg-purple-500 text-white"
                }`}>
                  {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-blue-600 font-medium">{post.category}</span>
                  {post.audience && post.audience !== "ALL" && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                      For {post.audience.toLowerCase()}s
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 line-clamp-2">{post.titleEN}</h3>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Audience:</label>
                <select
                  value={post.audience || "ALL"}
                  onChange={async (e) => {
                    const audience = e.target.value;
                    try {
                      // PUT a minimal patch — backend's update mapper merges
                      // by-field, so leaving everything else out preserves it.
                      await apiFetch(`/api/blog/${post.id}`, {
                        method: "PUT",
                        body: JSON.stringify({
                          titleEn: post.titleEN,
                          excerptEn: post.excerptEN,
                          contentEn: post.contentEN,
                          imageUrl: post.image,
                          category: post.category,
                          author: post.author,
                          status: post.status,
                          slug: post.slug,
                          audience,
                        }),
                      });
                      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, audience } : p));
                    } catch (err: any) {
                      setError(err.message);
                    }
                  }}
                  className="text-xs border rounded px-1 py-0.5 flex-1"
                >
                  {audiences.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2">{post.excerptEN}</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>👁 {post.views} views</span>
                <span>{post.publishedAt || "Not published"}</span>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t">
                <button 
                  onClick={() => {
                    setEditingPost(post);
                    setShowEditor(true);
                  }}
                  className="flex-1 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                >
                  ✏️ Edit
                </button>
                {post.status === "draft" ? (
                  <button 
                    onClick={() => handleStatusChange(post.id, "published")}
                    className="flex-1 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                  >
                    Publish
                  </button>
                ) : (
                  <button 
                    onClick={() => handleStatusChange(post.id, "draft")}
                    className="flex-1 py-2 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                  >
                    Unpublish
                  </button>
                )}
                <button 
                  onClick={() => handleDelete(post.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  🗑
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Post Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{editingPost ? "✏️ Edit Post" : "➕ New Post"}</h2>
                <button onClick={() => setShowEditor(false)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900">🇬🇧 English</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      ref={titleEnRef}
                      type="text"
                      defaultValue={editingPost?.titleEN}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Post title in English"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                    <textarea
                      ref={excerptEnRef}
                      defaultValue={editingPost?.excerptEN}
                      rows={2}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Short description..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                    <textarea
                      ref={contentEnRef}
                      defaultValue={editingPost?.contentEN}
                      rows={8}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Full post content..."
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900">🇻🇳 Vietnamese</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      ref={titleViRef}
                      type="text"
                      defaultValue={editingPost?.titleVI}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Tiêu đề bài viết"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                    <textarea
                      ref={excerptViRef}
                      defaultValue={editingPost?.excerptVI}
                      rows={2}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Mô tả ngắn..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                    <textarea
                      ref={contentViRef}
                      defaultValue={editingPost?.contentVI}
                      rows={8}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Nội dung bài viết đầy đủ..."
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    ref={categoryRef}
                    defaultValue={editingPost?.category}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image</label>
                  <input
                    ref={imageRef}
                    type="text"
                    defaultValue={editingPost?.image}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Image URL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    defaultValue={editingPost?.status || "draft"}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setShowEditor(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => handleSavePost("draft")}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                💾 Save as Draft
              </button>
              <button
                onClick={() => handleSavePost("published")}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                ✅ Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
