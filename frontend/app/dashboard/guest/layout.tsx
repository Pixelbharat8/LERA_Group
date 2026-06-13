"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { hasAuthSession } from "@/lib/api";
import Link from "next/link";

// Guest/Pending User Panel Layout
// For users who signed up but haven't been assigned a role yet

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isValidUser, setIsValidUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const checkUser = () => {
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

      // If user has a proper role, redirect them to their dashboard
      const assignedRoles = [
        "CHAIRMAN", "CEO", "DIRECTOR", "SUPER_ADMIN", "SUPERADMIN",
        "CENTER_MANAGER", "CENTER_ADMIN", "TEACHER", "STUDENT", "PARENT", "STAFF",
        "ACCOUNTANT", "HR", "FINANCE"
      ];

      if (assignedRoles.includes(normalizedRole)) {
        // Redirect to appropriate dashboard
        const redirectRoutes: Record<string, string> = {
          CHAIRMAN: "/dashboard/chairman",
          CEO: "/dashboard/ceo",
          DIRECTOR: "/dashboard/director",
          SUPER_ADMIN: "/dashboard/superadmin",
          SUPERADMIN: "/dashboard/superadmin",
          CENTER_MANAGER: "/dashboard/centermanager",
          CENTER_ADMIN: "/dashboard/academy",
          TEACHER: "/dashboard/teacher",
          STUDENT: "/dashboard/student",
          PARENT: "/dashboard/parent",
          STAFF: "/dashboard/staff",
        };
        router.push(redirectRoutes[normalizedRole] || "/dashboard");
        return;
      }

      // User is guest/pending - allow access
      setIsValidUser(true);
      setIsLoading(false);
    };

    checkUser();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isValidUser) {
    return null; // Will redirect
  }

  return <>{children}</>;
}
