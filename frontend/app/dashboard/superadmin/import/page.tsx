"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirect to the main data-import page.
 * This route exists as a convenience alias.
 */
export default function ImportRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/superadmin/data-import");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to Data Import...</p>
      </div>
    </div>
  );
}
