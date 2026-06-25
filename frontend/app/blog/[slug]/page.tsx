"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "../../context/LanguageContext";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { publicFetch } from "../../../lib/api";

/** Simple HTML sanitizer — strips <script>, onerror=, javascript: etc. */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/<iframe\b[^>]*>/gi, "")
    .replace(/<\/iframe>/gi, "");
}

interface BlogPost {
  id: string;
  title: string;
  titleVi?: string;
  slug: string;
  content?: string;
  contentVi?: string;
  featuredImage?: string;
  author?: string;
  publishedAt?: string;
  category?: string;
  tags?: string[];
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { language } = useLanguage();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await publicFetch(`/api/blog/slug/${slug}`);
        if (data) {
          // Map entity field names (titleEn/contentEn/imageUrl …) to what this page renders.
          setPost({
            id: data.id,
            title: data.title ?? data.titleEn,
            titleVi: data.titleVi,
            slug: data.slug,
            content: data.content ?? data.contentEn,
            contentVi: data.contentVi,
            featuredImage: data.featuredImage ?? data.imageUrl,
            author: data.author,
            publishedAt: data.publishedAt,
            category: data.category,
          });
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error("Failed to fetch blog post:", error);
        setNotFound(true);
      }
      setIsLoading(false);
    };

    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(language === "VI" ? "vi-VN" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-32 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {language === "VI" ? "Không tìm thấy bài viết" : "Post Not Found"}
          </h1>
          <p className="text-gray-600 mb-8">
            {language === "VI" 
              ? "Bài viết bạn tìm kiếm không tồn tại hoặc đã bị xóa."
              : "The post you're looking for doesn't exist or has been removed."}
          </p>
          <Link
            href="/blog"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {language === "VI" ? "← Quay lại Blog" : "← Back to Blog"}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const title = language === "VI" && post.titleVi ? post.titleVi : post.title;
  const content = language === "VI" && post.contentVi ? post.contentVi : post.content;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Image */}
      {post.featuredImage && (
        <div className="pt-20">
          <div className="h-[400px] w-full relative">
            <img
              src={post.featuredImage}
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>
        </div>
      )}

      {/* Content */}
      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li><Link href="/" className="hover:text-blue-600">{language === "VI" ? "Trang chủ" : "Home"}</Link></li>
            <li>/</li>
            <li><Link href="/blog" className="hover:text-blue-600">Blog</Link></li>
            <li>/</li>
            <li className="text-gray-900 font-medium truncate max-w-xs">{title}</li>
          </ol>
        </nav>

        {/* Category & Date */}
        <div className="flex items-center gap-4 mb-6">
          {post.category && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
              {post.category}
            </span>
          )}
          <span className="text-gray-500 text-sm">{formatDate(post.publishedAt)}</span>
          {post.author && (
            <span className="text-gray-500 text-sm">• {post.author}</span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 leading-tight">
          {title}
        </h1>

        {/* Content — sanitized to prevent XSS */}
        <div 
          className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(content || "") }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-3">
              {language === "VI" ? "Tags:" : "Tags:"}
            </h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, index) => (
                <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Share & Back */}
        <div className="mt-12 pt-8 border-t border-gray-200 flex items-center justify-between">
          <Link
            href="/blog"
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {language === "VI" ? "Quay lại Blog" : "Back to Blog"}
          </Link>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{language === "VI" ? "Chia sẻ:" : "Share:"}</span>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/>
              </svg>
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${encodeURIComponent(title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-sky-500 text-white rounded-full flex items-center justify-center hover:bg-sky-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </a>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}
