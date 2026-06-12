"use client";

import { useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiUrl } from "../../../lib/api";
import { useLanguage } from "../../context/LanguageContext";

export default function LoginPage() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // IMPORTANT:
      // Use a relative URL so Next.js `rewrites()` proxies to the Identity Service.
      // Using an absolute base URL like `http://localhost/...` can bypass rewrites
      // and hit the wrong server depending on what is running on port 80.
      const res = await axios.post(
        "/api/auth/login",
        { email: email.trim(), password },
        {
          // Required so the browser keeps the HttpOnly Set-Cookie response
          // when the API and frontend share an origin via the gateway.
          withCredentials: true,
          timeout: 60000,
        }
      );

      if (!res.data?.success || !res.data?.token || !res.data?.user) {
        throw new Error(res.data?.message || "Login failed");
      }

      // The backend has already set HttpOnly cookies for `token` and
      // `refreshToken`. We drop a non-HttpOnly `tokenSet` flag so the SPA
      // can tell whether a session exists without ever touching the JWT.
      Cookies.set("tokenSet", "1", { expires: 1 });

      // Store user data for dashboard rendering (role, name, avatar). This
      // does not contain the JWT — only display fields.
      Cookies.set("userData", JSON.stringify(res.data.user));

      // Map role to dashboard path
      // Chairman is GOD and gets their own special dashboard
      // High-privilege roles (CEO, DIRECTOR) use superadmin dashboard
      const roleName = String(res.data.user.roleName).toUpperCase();
      let rolePath: string;
      
      switch (roleName) {
        case "CHAIRMAN":
          rolePath = "chairman"; // Chairman gets their own GOD-level dashboard
          break;
        case "CEO":
          rolePath = "ceo";
          break;
        case "DIRECTOR":
          rolePath = "director";
          break;
        case "SUPER_ADMIN":
        case "SUPERADMIN":
        case "ADMIN":
          rolePath = "superadmin";
          break;
        case "CENTER_ADMIN":
          rolePath = "centeradmin";
          break;
        case "ACADEMIC_MANAGER":
          rolePath = "academicmanager";
          break;
        case "TEACHER":
          rolePath = "teacher";
          break;
        case "TEACHING_ASSISTANT":
        case "TA":
          rolePath = "ta";
          break;
        case "STUDENT":
          rolePath = "student";
          break;
        case "PARENT":
          rolePath = "parent";
          break;
        case "STAFF":
          rolePath = "staff";
          break;
        case "CENTER_MANAGER":
          rolePath = "centermanager";
          break;
        case "USER":
        case "GUEST":
        case "PENDING":
          // New users without assigned roles go to guest dashboard
          rolePath = "guest";
          break;
        default:
          // Check if role path exists, otherwise send to guest dashboard
          const knownRoles = ["chairman", "ceo", "director", "superadmin", "centeradmin", "centermanager", "academicmanager", "teacher", "ta", "student", "parent", "staff"];
          const normalizedPath = roleName.toLowerCase().replace(/_/g, "");
          rolePath = knownRoles.includes(normalizedPath) ? normalizedPath : "guest";
      }
      
      Cookies.set("role", rolePath);
      Cookies.set("actualRole", roleName); // Store the actual role for permission checks

      // Redirect to original page if coming from a 401, otherwise to role dashboard
      window.location.href = redirectTo || ("/dashboard/" + rolePath);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Please check your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Back Link */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-8">
            <span>←</span>
            <span>{t("backToHome")}</span>
          </Link>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-3xl">L</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t("welcomeBackLogin")}</h1>
          <p className="text-gray-600 mt-2">{t("signInToAccount")}</p>
        </div>

        {/* Login Form */}
        <div className="bg-white shadow-2xl rounded-2xl p-8">
          <form onSubmit={login} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t("emailAddress")}
              </label>
              <input 
                id="email"
                type="email" 
                placeholder={t("emailPlaceholder")} 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t("password")}
              </label>
              <input 
                id="password"
                type="password" 
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <span className="ml-2 text-sm text-gray-600">{t("rememberMe")}</span>
              </label>
              <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                {t("forgotPassword")}
              </Link>
            </div>

            <button 
              type="submit" 
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t("signingIn")}
                </span>
              ) : (
                t("signIn")
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-8">
          {t("noAccount")}{' '}
          <a href="/auth/register" className="text-blue-600 hover:text-blue-700 font-semibold">
            {t("registerNow") || "Register Now"}
          </a>
        </p>
      </div>
    </div>
  );
}
