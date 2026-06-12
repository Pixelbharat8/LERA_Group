"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { hasAuthSession } from "@/lib/api";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredPermission?: string;
  fallbackUrl?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles = [],
  requiredPermission,
  fallbackUrl = "/dashboard",
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthorization = () => {
      const actualRole = Cookies.get("actualRole");
      const userDataStr = Cookies.get("userData");

      if (!hasAuthSession()) {
        router.push("/auth/login");
        setIsLoading(false);
        return;
      }

      // Get user role
      let userRole = actualRole || "USER";
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          userRole = userData.roleName || actualRole || "USER";
        } catch (e) {
          console.error("Failed to parse user data");
        }
      }

      const normalizedRole = userRole.toUpperCase();

      // High-level admins always have access
      const superAdminRoles = ["CHAIRMAN", "CEO", "SUPER_ADMIN", "SUPERADMIN", "ADMIN", "DIRECTOR"];
      const isSuperAdmin = superAdminRoles.includes(normalizedRole);

      // Check role-based access
      if (allowedRoles.length > 0) {
        const hasRole = allowedRoles.some(
          (role) => role.toUpperCase() === normalizedRole
        );

        if (!hasRole && !isSuperAdmin) {
          console.warn(`Access denied: User role ${normalizedRole} not in allowed roles`, allowedRoles);
          router.push(fallbackUrl);
          setIsLoading(false);
          return;
        }
      }

      // Check permission-based access (from API if available)
      if (requiredPermission) {
        // For super admins, always allow
        if (isSuperAdmin) {
          setIsAuthorized(true);
          setIsLoading(false);
          return;
        }

        // For other roles, check user permissions from stored data or API
        // This would need to be enhanced with actual permission fetching
        const storedPermissions = Cookies.get("userPermissions");
        if (storedPermissions) {
          try {
            const permissions = JSON.parse(storedPermissions);
            if (!permissions[requiredPermission]) {
              console.warn(`Access denied: Missing permission ${requiredPermission}`);
              router.push(fallbackUrl);
              setIsLoading(false);
              return;
            }
          } catch (e) {
            console.error("Failed to parse permissions");
          }
        }
      }

      setIsAuthorized(true);
      setIsLoading(false);
    };

    checkAuthorization();
  }, [router, allowedRoles, requiredPermission, fallbackUrl]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">🚫 Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <button
            onClick={() => router.push(fallbackUrl)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Hook for checking permissions in components
export function useRoleCheck() {
  const [userRole, setUserRole] = useState<string>("USER");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isChairman, setIsChairman] = useState(false);
  const [isCEO, setIsCEO] = useState(false);
  const [isDirector, setIsDirector] = useState(false);
  const [isCenterManager, setIsCenterManager] = useState(false);

  useEffect(() => {
    const actualRole = Cookies.get("actualRole");
    const userDataStr = Cookies.get("userData");

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

    const superAdminRoles = ["CHAIRMAN", "CEO", "SUPER_ADMIN", "SUPERADMIN", "ADMIN", "DIRECTOR"];
    setIsSuperAdmin(superAdminRoles.includes(normalizedRole));
    setIsChairman(normalizedRole === "CHAIRMAN");
    setIsCEO(normalizedRole === "CEO");
    setIsDirector(normalizedRole === "DIRECTOR");
    setIsCenterManager(normalizedRole === "CENTER_MANAGER");
  }, []);

  const hasRole = (roles: string[]): boolean => {
    if (isSuperAdmin) return true;
    return roles.some((r) => r.toUpperCase() === userRole);
  };

  const canAccess = (requiredRoles: string[]): boolean => {
    if (isSuperAdmin) return true;
    return requiredRoles.some((r) => r.toUpperCase() === userRole);
  };

  return {
    userRole,
    isSuperAdmin,
    isChairman,
    isCEO,
    isDirector,
    isCenterManager,
    hasRole,
    canAccess,
  };
}
