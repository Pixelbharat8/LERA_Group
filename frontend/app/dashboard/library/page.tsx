"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "../../context/LanguageContext";
import { apiFetch } from "../../../lib/api";

interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  category: string;
  available: boolean;
  totalCopies: number;
  availableCopies: number;
  coverImage?: string;
}

interface BorrowedBook {
  id: string;
  bookTitle: string;
  borrowDate: string;
  dueDate: string;
  status: "borrowed" | "overdue" | "returned";
}

export default function LibraryPage() {
  const { language } = useLanguage();
  const isVietnamese = language === "VI";
  const [books, setBooks] = useState<Book[]>([]);
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const t = {
    title: isVietnamese ? "Thư Viện" : "Library",
    search: isVietnamese ? "Tìm kiếm sách..." : "Search books...",
    allCategories: isVietnamese ? "Tất cả" : "All Categories",
    available: isVietnamese ? "Có sẵn" : "Available",
    borrowed: isVietnamese ? "Đã mượn" : "Borrowed",
    myBooks: isVietnamese ? "Sách của tôi" : "My Books",
    browseBooks: isVietnamese ? "Duyệt sách" : "Browse Books",
    dueDate: isVietnamese ? "Hạn trả" : "Due Date",
    borrow: isVietnamese ? "Mượn" : "Borrow",
    return: isVietnamese ? "Trả sách" : "Return",
    overdue: isVietnamese ? "Quá hạn" : "Overdue",
    totalBooks: isVietnamese ? "Tổng sách" : "Total Books",
    borrowedCount: isVietnamese ? "Đang mượn" : "Currently Borrowed",
    overdueCount: isVietnamese ? "Quá hạn" : "Overdue",
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [booksData, borrowedData] = await Promise.all([
        apiFetch("/api/library/books"),
        apiFetch("/api/library/borrowed"),
      ]);
      setBooks(Array.isArray(booksData) ? booksData : []);
      setBorrowedBooks(Array.isArray(borrowedData) ? borrowedData : []);
    } catch (error) {
      // Don't fabricate a catalog on failure — show the real (empty) state.
      console.error("Failed to load library data:", error);
      setBooks([]);
      setBorrowedBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["all", ...Array.from(new Set(books.map(b => b.category)))];

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const overdueCount = borrowedBooks.filter(b => b.status === "overdue").length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <nav className="text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{t.title}</span>
        </nav>
        <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">📚</div>
            <div>
              <p className="text-sm text-gray-500">{t.totalBooks}</p>
              <p className="text-2xl font-bold text-gray-900">{books.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">📖</div>
            <div>
              <p className="text-sm text-gray-500">{t.borrowedCount}</p>
              <p className="text-2xl font-bold text-gray-900">{borrowedBooks.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-2xl">⏰</div>
            <div>
              <p className="text-sm text-gray-500">{t.overdueCount}</p>
              <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* My Borrowed Books */}
      {borrowedBooks.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t.myBooks}</h2>
          <div className="space-y-3">
            {borrowedBooks.map(book => (
              <div key={book.id} className={`flex items-center justify-between p-4 rounded-lg ${book.status === 'overdue' ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-4">
                  <span className="text-2xl">📖</span>
                  <div>
                    <p className="font-medium text-gray-900">{book.bookTitle}</p>
                    <p className="text-sm text-gray-500">{t.dueDate}: {new Date(book.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {book.status === "overdue" && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full">{t.overdue}</span>
                  )}
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t.return}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Browse Books */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t.browseBooks}</h2>
        
        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder={t.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                {cat === "all" ? t.allCategories : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBooks.map(book => (
              <div key={book.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  <div className="w-16 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center text-2xl">
                    📕
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 line-clamp-2">{book.title}</h3>
                    <p className="text-sm text-gray-500">{book.author}</p>
                    <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">{book.category}</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className={`text-sm ${book.available ? 'text-green-600' : 'text-red-600'}`}>
                    {book.available ? `✓ ${book.availableCopies} ${t.available}` : `✗ ${isVietnamese ? 'Hết' : 'Unavailable'}`}
                  </span>
                  <button 
                    disabled={!book.available}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${book.available ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                  >
                    {t.borrow}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
