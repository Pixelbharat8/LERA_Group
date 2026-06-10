"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "../../context/LanguageContext";
import { apiFetch } from "../../../lib/api";

interface Product {
  id: string;
  name: string;
  nameVi?: string;
  description?: string;
  category: string;
  price: number;
  discountPrice?: number;
  image?: string;
  inStock: boolean;
  quantity: number;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export default function BookstorePage() {
  const { language } = useLanguage();
  const isVietnamese = language === "VI";
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCart, setShowCart] = useState(false);

  const t = {
    title: isVietnamese ? "Cửa Hàng" : "Bookstore",
    search: isVietnamese ? "Tìm kiếm sản phẩm..." : "Search products...",
    all: isVietnamese ? "Tất cả" : "All",
    textbooks: isVietnamese ? "Sách giáo khoa" : "Textbooks",
    workbooks: isVietnamese ? "Sách bài tập" : "Workbooks",
    stationery: isVietnamese ? "Văn phòng phẩm" : "Stationery",
    uniform: isVietnamese ? "Đồng phục" : "Uniform",
    addToCart: isVietnamese ? "Thêm vào giỏ" : "Add to Cart",
    cart: isVietnamese ? "Giỏ hàng" : "Cart",
    checkout: isVietnamese ? "Thanh toán" : "Checkout",
    emptyCart: isVietnamese ? "Giỏ hàng trống" : "Cart is empty",
    total: isVietnamese ? "Tổng cộng" : "Total",
    inStock: isVietnamese ? "Còn hàng" : "In Stock",
    outOfStock: isVietnamese ? "Hết hàng" : "Out of Stock",
    remove: isVietnamese ? "Xóa" : "Remove",
    continueShopping: isVietnamese ? "Tiếp tục mua sắm" : "Continue Shopping",
  };

  const categories = [
    { id: "all", name: t.all },
    { id: "textbooks", name: t.textbooks },
    { id: "workbooks", name: t.workbooks },
    { id: "stationery", name: t.stationery },
    { id: "uniform", name: t.uniform },
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await apiFetch("/api/bookstore/products");
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      // Show a real (empty) catalogue rather than fake demo products.
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || placing) return;
    setPlacing(true);
    try {
      await apiFetch("/api/bookstore/orders", {
        method: "POST",
        body: JSON.stringify({
          items: cart.map((i) => ({ productId: i.productId, name: i.name, price: i.price, quantity: i.quantity })),
          total: cartTotal,
        }),
      });
      setCart([]);
      setShowCart(false);
      setOrderPlaced(true);
      setTimeout(() => setOrderPlaced(false), 5000);
    } catch (error) {
      alert(isVietnamese ? "Đặt hàng thất bại. Vui lòng thử lại." : "Order failed. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        name: isVietnamese && product.nameVi ? product.nameVi : product.name,
        price: product.discountPrice || product.price,
        quantity: 1
      }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredProducts = products.filter(product => {
    const name = isVietnamese && product.nameVi ? product.nameVi : product.name;
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {orderPlaced && (
        <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg">
          ✅ {isVietnamese ? "Đặt hàng thành công!" : "Order placed successfully!"}
        </div>
      )}
      {/* Header */}
      <div className="mb-6">
        <nav className="text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{t.title}</span>
        </nav>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
          <button
            onClick={() => setShowCart(true)}
            className="relative px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            🛒 {t.cart}
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search & Categories */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
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
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg font-medium ${selectedCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-6xl">
                {product.category === "textbooks" ? "📚" : 
                 product.category === "workbooks" ? "📖" :
                 product.category === "stationery" ? "✏️" : "👕"}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                  {isVietnamese && product.nameVi ? product.nameVi : product.name}
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  {product.discountPrice ? (
                    <>
                      <span className="text-lg font-bold text-red-600">{formatCurrency(product.discountPrice)}</span>
                      <span className="text-sm text-gray-400 line-through">{formatCurrency(product.price)}</span>
                    </>
                  ) : (
                    <span className="text-lg font-bold text-blue-600">{formatCurrency(product.price)}</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${product.inStock ? 'text-green-600' : 'text-red-600'}`}>
                    {product.inStock ? `✓ ${t.inStock}` : `✗ ${t.outOfStock}`}
                  </span>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={!product.inStock}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${product.inStock ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                  >
                    {t.addToCart}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-xl flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">{t.cart}</h2>
              <button onClick={() => setShowCart(false)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <span className="text-4xl block mb-2">🛒</span>
                  {t.emptyCart}
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.productId} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-blue-600">{formatCurrency(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(item.productId, -1)} className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300">-</button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, 1)} className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300">+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.productId)} className="text-red-500 hover:text-red-700">
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-medium">{t.total}</span>
                  <span className="text-2xl font-bold text-blue-600">{formatCurrency(cartTotal)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={placing || cart.length === 0}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {placing ? (isVietnamese ? "Đang xử lý..." : "Placing order...") : t.checkout}
                </button>
                <button onClick={() => setShowCart(false)} className="w-full py-3 text-gray-600 hover:text-gray-900 mt-2">
                  {t.continueShopping}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
