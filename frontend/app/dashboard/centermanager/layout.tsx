"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { hasAuthSession } from "@/lib/api";

// Center Manager Panel Access Control Layout
// CENTER_MANAGER + higher roles can access

const ALLOWED_ROLES = ["CHAIRMAN", "CEO", "DIRECTOR", "SUPER_ADMIN", "SUPERADMIN", "CENTER_MANAGER"];

export default function CenterManagerLayout({ children }: { children: React.ReactNode }) {
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
        console.warn(`Access denied to Center Manager Panel: User role ${normalizedRole} not allowed`);
        const redirectRoutes: Record<string, string> = {
          TEACHER: "/dashboard/teacher",
          STUDENT: "/dashboard/student",
          PARENT: "/dashboard/parent",
          STAFF: "/dashboard/staff",
        };
        router.push(redirectRoutes[normalizedRole] || "/dashboard");
        return;
      }

      setIsAuthorized(true);
      setIsLoading(false);
    };

    checkAuthorization();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access to Center Manager Panel...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-2">
            You don't have permission to access the <strong>Center Manager Panel</strong>.
          </p>
          <p className="text-xs text-gray-400 mb-6">
            Your current role: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{userRole || "Unknown"}</span>
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
