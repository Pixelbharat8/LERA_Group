"use client";

import { useMemo } from "react";
import Cookies from "js-cookie";
import { usePermissions } from "../../../context/PermissionContext";
import SocialMediaManager from "@/components/marketing/SocialMediaManager";

// Delegated social-media control. Reachable by any user the Chairman grants the
// "Social Media" feature in Feature Management (permission `socialMedia`), plus the
// high-level roles that always have full access. Renders the same control the
// Chairman uses. Backend access is already permitted for STAFF/CENTER_MANAGER.
const HIGH_LEVEL = ["CHAIRMAN", "CEO", "SUPER_ADMIN", "SUPERADMIN", "ADMIN", "DIRECTOR"];

export default function MarketingSocialMediaPage() {
  const { hasPermission } = usePermissions();

  const role = useMemo(() => {
    try {
      const ud = Cookies.get("userData");
      if (ud) {
        const u = JSON.parse(ud);
        return String(u.roleName || u.role?.name || u.role || "").toUpperCase();
      }
    } catch {
      /* fall through */
    }
    return String(Cookies.get("actualRole") || "").toUpperCase();
  }, []);

  const allowed = HIGH_LEVEL.includes(role) || hasPermission("socialMedia");

  if (!allowed) {
    return (
      <div className="p-10 max-w-lg mx-auto text-center">
        <div className="text-4xl mb-3">🔒</div>
        <h1 className="text-lg font-bold text-gray-900 mb-1">Social Media management is not enabled</h1>
        <p className="text-sm text-gray-500">
          Ask the Chairman to turn on the <b>Social Media</b> feature for your account in
          Chairman → Feature Management.
        </p>
      </div>
    );
  }

  return <SocialMediaManager backHref="/dashboard" />;
}
