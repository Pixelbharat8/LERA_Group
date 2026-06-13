"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CenterAdminRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the center-admin dashboard (with hyphen)
    router.replace("/dashboard/center-admin");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to Center Admin Dashboard...</p>
      </div>
    </div>
  );
}
