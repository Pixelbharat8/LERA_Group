"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { hasAuthSession } from "@/lib/api";

// Academic Manager Panel Access Control Layout
const ALLOWED_ROLES = ["CHAIRMAN", "CEO", "DIRECTOR", "SUPER_ADMIN", "SUPERADMIN", "CENTER_ADMIN", "CENTER_MANAGER", "ACADEMIC_MANAGER"];

export default function AcademicManagerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const checkAuthorization = () => {
      const actualRole = Cookies.get("actualRole");
      const userDataStr = Cookies.get("userData");

      if (!hasAuthSession()) {
        router.push("/auth/login");
        setIsLoading(false);
        return;
      }

      let role = actualRole || "USER";
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          role = userData.roleName || actualRole || "USER";
        } catch (e) {
          console.error("Failed to parse user data");
        }
      }

      const normalizedRole = role.toUpperCase();
      setUserRole(normalizedRole);

      const hasAccess = ALLOWED_ROLES.includes(normalizedRole);

      if (!hasAccess) {
        console.warn(`Access denied to Academic Manager Panel: User role ${normalizedRole} not allowed`);
        router.push("/dashboard");
        return;
      }

      setIsAuthorized(true);
      setIsLoading(false);
    };

    checkAuthorization();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading academic manager dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access the Academic Manager Panel.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Current Role: <span className="font-semibold">{userRole}</span>
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
