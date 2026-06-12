"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface UserData {
  id: string;
  fullname: string;
  email: string;
  phone?: string;
  roleName?: string;
  avatarUrl?: string;
  createdAt?: string;
}

interface WebsiteSettings {
  contact_phone?: string;
  contact_email?: string;
  contact_address?: string;
  hero_title_en?: string;
  hero_title_vi?: string;
  hero_subtitle_en?: string;
  hero_subtitle_vi?: string;
  social_facebook?: string;
  social_youtube?: string;
  social_instagram?: string;
  logo_url?: string;
  site_name?: string;
}

export default function GuestDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [settings, setSettings] = useState<WebsiteSettings>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("welcome");

  useEffect(() => {
    // Get user data from cookies
    const userDataStr = Cookies.get("userData");
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        setUser(userData);
      } catch (e) {
        console.error("Failed to parse user data");
      }
    }

    // Fetch website settings
    const fetchSettings = async () => {
      try {
        const data = await apiFetch("/api/website-settings");
        setSettings(data);
      } catch (err) {
        console.log("Using default settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("actualRole");
    Cookies.remove("userData");
    Cookies.remove("userPermissions");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img 
                src={settings.logo_url || "/images/lera-logo.png"} 
                alt="LERA Academy" 
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-blue-800">
                  {settings.site_name || "LERA Academy"}
                </h1>
                <p className="text-xs text-gray-500">Welcome Portal</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                🌐 Visit Website
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <span className="text-blue-600 font-semibold text-sm">
                      {user?.fullname?.charAt(0) || "U"}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700">{user?.fullname || "Guest"}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Banner */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="text-4xl">⏳</div>
            <div>
              <h2 className="text-xl font-bold text-amber-800 mb-2">
                Account Pending Approval
              </h2>
              <p className="text-amber-700 mb-3">
                Thank you for registering with LERA Academy! Your account is currently being reviewed by our admin team.
                Once approved, you'll be assigned a role and gain full access to the system.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-800">
                  📧 {user?.email}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                  🆔 Status: Pending
                </span>
                {user?.createdAt && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                    📅 Registered: {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: "welcome", name: "Welcome", icon: "👋" },
            { id: "about", name: "About LERA", icon: "🏫" },
            { id: "programs", name: "Our Programs", icon: "📚" },
            { id: "facilities", name: "Facilities", icon: "🏛️" },
            { id: "contact", name: "Contact Us", icon: "📞" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {activeTab === "welcome" && (
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  {settings.hero_title_en || "Welcome to LERA Academy"} 👋
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  {settings.hero_subtitle_en || "Where Excellence is the Standard"}
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center">
                  <div className="text-4xl mb-3">🎓</div>
                  <h3 className="font-bold text-blue-800 mb-2">Quality Education</h3>
                  <p className="text-sm text-blue-700">
                    World-class curriculum designed to prepare students for the future
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center">
                  <div className="text-4xl mb-3">👨‍🏫</div>
                  <h3 className="font-bold text-green-800 mb-2">Expert Teachers</h3>
                  <p className="text-sm text-green-700">
                    Highly qualified educators dedicated to student success
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center">
                  <div className="text-4xl mb-3">🌟</div>
                  <h3 className="font-bold text-purple-800 mb-2">Modern Facilities</h3>
                  <p className="text-sm text-purple-700">
                    State-of-the-art classrooms and learning environments
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-800 mb-4">📋 What happens next?</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</div>
                    <span className="text-gray-700">Account created successfully</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold animate-pulse">2</div>
                    <span className="text-gray-700 font-medium">Admin is reviewing your registration</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-300 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <span className="text-gray-500">You'll be assigned a role (Student, Parent, Staff, etc.)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-300 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                    <span className="text-gray-500">Full dashboard access will be enabled</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "about" && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">🏫 About LERA Academy</h2>
              
              <div className="prose max-w-none">
                <div className="bg-blue-50 rounded-xl p-6 mb-6">
                  <h3 className="text-xl font-bold text-blue-800 mb-3">Our Mission</h3>
                  <p className="text-blue-700">
                    LERA Academy is committed to providing exceptional education that empowers students 
                    to achieve their full potential. We believe in nurturing not just academic excellence, 
                    but also character, creativity, and critical thinking skills.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="border rounded-xl p-6">
                    <h4 className="font-bold text-gray-800 mb-3">🎯 Our Vision</h4>
                    <p className="text-gray-600">
                      To be a leading educational institution that shapes future leaders through 
                      innovative teaching methods and a supportive learning environment.
                    </p>
                  </div>
                  <div className="border rounded-xl p-6">
                    <h4 className="font-bold text-gray-800 mb-3">💎 Our Values</h4>
                    <ul className="text-gray-600 space-y-1">
                      <li>• Excellence in education</li>
                      <li>• Integrity and respect</li>
                      <li>• Innovation and creativity</li>
                      <li>• Community and collaboration</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-6">
                  <h4 className="font-bold text-xl mb-3">🏆 Why Choose LERA?</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold">500+</div>
                      <div className="text-sm opacity-90">Happy Students</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">50+</div>
                      <div className="text-sm opacity-90">Expert Teachers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">95%</div>
                      <div className="text-sm opacity-90">Success Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "programs" && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">📚 Our Programs</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
                    <h3 className="font-bold text-lg">🎒 Primary Education</h3>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-600 mb-3">
                      Building strong foundations through interactive learning and creative exploration.
                    </p>
                    <ul className="text-sm text-gray-500 space-y-1">
                      <li>• Ages 6-11</li>
                      <li>• Core subjects + arts & sports</li>
                      <li>• Small class sizes</li>
                    </ul>
                  </div>
                </div>

                <div className="border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4">
                    <h3 className="font-bold text-lg">📖 Secondary Education</h3>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-600 mb-3">
                      Preparing students for higher education with comprehensive curriculum.
                    </p>
                    <ul className="text-sm text-gray-500 space-y-1">
                      <li>• Ages 12-18</li>
                      <li>• Advanced academics</li>
                      <li>• Career guidance</li>
                    </ul>
                  </div>
                </div>

                <div className="border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4">
                    <h3 className="font-bold text-lg">🌍 English Programs</h3>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-600 mb-3">
                      Intensive English courses for all proficiency levels.
                    </p>
                    <ul className="text-sm text-gray-500 space-y-1">
                      <li>• Native English teachers</li>
                      <li>• IELTS/TOEFL preparation</li>
                      <li>• Conversation classes</li>
                    </ul>
                  </div>
                </div>

                <div className="border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4">
                    <h3 className="font-bold text-lg">💻 STEM Programs</h3>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-600 mb-3">
                      Science, Technology, Engineering, and Mathematics excellence.
                    </p>
                    <ul className="text-sm text-gray-500 space-y-1">
                      <li>• Coding & robotics</li>
                      <li>• Science labs</li>
                      <li>• Math olympiad training</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "facilities" && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">🏛️ Our Facilities</h2>
              
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { icon: "🏫", name: "Modern Classrooms", desc: "Air-conditioned rooms with smart boards" },
                  { icon: "📚", name: "Library", desc: "Extensive collection of books and digital resources" },
                  { icon: "💻", name: "Computer Lab", desc: "Latest technology for digital learning" },
                  { icon: "🔬", name: "Science Lab", desc: "Fully equipped for experiments" },
                  { icon: "🎨", name: "Art Studio", desc: "Creative space for artistic expression" },
                  { icon: "🎵", name: "Music Room", desc: "Instruments and practice facilities" },
                  { icon: "⚽", name: "Sports Ground", desc: "Multi-purpose sports facilities" },
                  { icon: "🍽️", name: "Cafeteria", desc: "Healthy meals and snacks" },
                  { icon: "🚌", name: "Transport", desc: "Safe and comfortable school buses" },
                ].map((facility, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                    <div className="text-3xl mb-2">{facility.icon}</div>
                    <h3 className="font-bold text-gray-800">{facility.name}</h3>
                    <p className="text-sm text-gray-600">{facility.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "contact" && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">📞 Contact Us</h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-gray-700 mb-4">Get in Touch</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">📍</div>
                      <div>
                        <div className="font-medium text-gray-800">Address</div>
                        <div className="text-gray-600">
                          {settings.contact_address || "95 Hải Đăng, khu đô thị Vinhomes Marina, phường An Biên, Hải Phòng"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">📱</div>
                      <div>
                        <div className="font-medium text-gray-800">Phone</div>
                        <div className="text-gray-600">{settings.contact_phone || "0387.633.141"}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">📧</div>
                      <div>
                        <div className="font-medium text-gray-800">Email</div>
                        <div className="text-gray-600">{settings.contact_email || "info@leraacademy.edu.vn"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="font-bold text-gray-700 mb-3">Follow Us</h3>
                    <div className="flex gap-3">
                      {settings.social_facebook && (
                        <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer" 
                          className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700">
                          f
                        </a>
                      )}
                      {settings.social_youtube && (
                        <a href={settings.social_youtube} target="_blank" rel="noopener noreferrer"
                          className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700">
                          ▶
                        </a>
                      )}
                      {settings.social_instagram && (
                        <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer"
                          className="w-10 h-10 bg-pink-600 text-white rounded-full flex items-center justify-center hover:bg-pink-700">
                          📷
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-700 mb-4">Need Help?</h3>
                  <p className="text-gray-600 mb-4">
                    If you have any questions about your registration or need assistance, 
                    please don't hesitate to contact our support team.
                  </p>
                  <div className="space-y-3">
                    <a 
                      href={`mailto:${settings.contact_email || "info@leraacademy.edu.vn"}`}
                      className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      📧 Email Support
                    </a>
                    <a 
                      href={`tel:${settings.contact_phone || "0387633141"}`}
                      className="block w-full bg-green-600 text-white text-center py-3 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      📞 Call Us
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>© 2026 LERA Academy. All rights reserved.</p>
          <p className="mt-1">
            <Link href="/" className="text-blue-600 hover:underline">Visit our website</Link>
            {" · "}
            <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
            {" · "}
            <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
