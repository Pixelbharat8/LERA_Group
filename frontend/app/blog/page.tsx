"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "../context/LanguageContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { publicFetch } from "../../lib/api";
import { HERO_IMAGES } from "../../config/images";

interface BlogPost {
  id: string;
  title: string;
  titleVi?: string;
  slug: string;
  excerpt?: string;
  excerptVi?: string;
  content?: string;
  contentVi?: string;
  featuredImage?: string;
  author?: string;
  publishedAt?: string;
  category?: string;
  tags?: string[];
  isPublished?: boolean;
}

// Fallback blog posts
const fallbackPosts: BlogPost[] = [
  {
    id: "1",
    title: "5 Tips to Help Your Child Learn English Faster",
    titleVi: "5 Mẹo Giúp Con Bạn Học Tiếng Anh Nhanh Hơn",
    slug: "5-tips-learn-english-faster",
    excerpt: "Discover proven strategies to accelerate your child's English learning journey with these expert tips from our teachers.",
    excerptVi: "Khám phá các chiến lược đã được chứng minh để tăng tốc hành trình học tiếng Anh của con bạn với những mẹo từ chuyên gia của chúng tôi.",
    featuredImage: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600",
    author: "LERA Academy",
    publishedAt: "2026-01-15",
    category: "Tips & Tricks",
  },
  {
    id: "2",
    title: "Why Native Teachers Matter for Language Learning",
    titleVi: "Tại Sao Giáo Viên Bản Ngữ Quan Trọng Cho Việc Học Ngôn Ngữ",
    slug: "native-teachers-matter",
    excerpt: "Learn why having native English teachers can make a significant difference in your child's pronunciation and fluency.",
    excerptVi: "Tìm hiểu tại sao có giáo viên tiếng Anh bản ngữ có thể tạo nên sự khác biệt đáng kể trong phát âm và sự lưu loát của con bạn.",
    featuredImage: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600",
    author: "LERA Academy",
    publishedAt: "2026-01-10",
    category: "Education",
  },
  {
    id: "3",
    title: "Preparing for Cambridge English Exams",
    titleVi: "Chuẩn Bị Cho Kỳ Thi Cambridge English",
    slug: "cambridge-exam-preparation",
    excerpt: "A comprehensive guide to help your child succeed in Cambridge Young Learners English tests.",
    excerptVi: "Hướng dẫn toàn diện giúp con bạn thành công trong các kỳ thi Cambridge Young Learners English.",
    featuredImage: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600",
    author: "LERA Academy",
    publishedAt: "2026-01-05",
    category: "Exams",
  },
];

export default function BlogPage() {
  const { language, t } = useLanguage();
  // Real blog posts only — no dummy. Empty until the backend has published posts (the
  // page shows a "No posts yet" state rather than fabricated articles).
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await publicFetch("/api/blog/published");
        setPosts(Array.isArray(data) ? data : []);
      } catch (error) {
        setPosts([]);
      }
      setIsLoading(false);
    };

    fetchPosts();
  }, []);

  const categories = ["all", ...Array.from(new Set(posts.map(p => p.category).filter((c): c is string => Boolean(c))))];
  
  const filteredPosts = selectedCategory === "all" 
    ? posts 
    : posts.filter(p => p.category === selectedCategory);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(language === "VI" ? "vi-VN" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{backgroundImage: `url('${HERO_IMAGES.home}')`}}></div>
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <span className="inline-block px-4 py-2 bg-white/20 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
            {language === "VI" ? "📚 Chia sẻ kiến thức" : "📚 Knowledge Sharing"}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {language === "VI" ? "Blog LERA Academy" : "LERA Academy Blog"}
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            {language === "VI" 
              ? "Mẹo học tiếng Anh, tin tức giáo dục và cập nhật từ LERA Academy"
              : "English learning tips, education news, and updates from LERA Academy"}
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {category === "all" ? (language === "VI" ? "Tất cả" : "All") : category}
              </button>
            ))}
          </div>

          {/* Blog Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <article 
                  key={post.id} 
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={post.featuredImage || "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600"}
                      alt={language === "VI" && post.titleVi ? post.titleVi : post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6">
                    {post.category && (
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mb-3">
                        {post.category}
                      </span>
                    )}
                    <h2 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {language === "VI" && post.titleVi ? post.titleVi : post.title}
                    </h2>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {language === "VI" && post.excerptVi ? post.excerptVi : post.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{formatDate(post.publishedAt)}</span>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
                      >
                        {language === "VI" ? "Đọc thêm" : "Read more"}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {language === "VI" ? "Chưa có bài viết" : "No posts yet"}
              </h3>
              <p className="text-gray-600">
                {language === "VI" ? "Hãy quay lại sau để xem các bài viết mới." : "Check back later for new posts."}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {language === "VI" ? "Đăng ký nhận tin" : "Subscribe to Our Newsletter"}
          </h2>
          <p className="text-white/80 mb-8">
            {language === "VI" 
              ? "Nhận mẹo học tiếng Anh và cập nhật mới nhất từ LERA Academy"
              : "Get English learning tips and latest updates from LERA Academy"}
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder={language === "VI" ? "Email của bạn" : "Your email"}
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-yellow-400 text-gray-900 font-bold rounded-lg hover:bg-yellow-300 transition-colors"
            >
              {language === "VI" ? "Đăng ký" : "Subscribe"}
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}
