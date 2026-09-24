"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiFetch, hasAuthSession } from "@/lib/api";

export type PermissionSource = "grant" | "role" | "default";

export interface UserPermission {
  dashboard: boolean;
  centers: boolean;
  users: boolean;
  students: boolean;
  teachers: boolean;
  classes: boolean;
  courses: boolean;
  attendance: boolean;
  payments: boolean;
  payroll: boolean;
  reports: boolean;
  settings: boolean;
  ai_assistant: boolean;
  communication: boolean;
  documents: boolean;
  // Optional so existing role/default literals stay valid; granted per-user by the
  // Chairman in Feature Management and read from the API below. Absent = no access.
  socialMedia?: boolean;
}

const DEFAULT_PERMISSIONS: UserPermission = {
  dashboard: true,
  centers: false,
  users: false,
  students: false,
  teachers: false,
  classes: false,
  courses: false,
  attendance: false,
  payments: false,
  payroll: false,
  reports: false,
  settings: false,
  ai_assistant: false,
  communication: false,
  documents: false,
};

// Default permissions per role
const ROLE_DEFAULT_PERMISSIONS: Record<string, UserPermission> = {
  CHAIRMAN: { 
    dashboard: true, centers: true, users: true, students: true, teachers: true, 
    classes: true, courses: true, attendance: true, payments: true, payroll: true, 
    reports: true, settings: true, ai_assistant: true, communication: true, documents: true 
  },
  CEO: { 
    dashboard: true, centers: true, users: true, students: true, teachers: true, 
    classes: true, courses: true, attendance: true, payments: true, payroll: true, 
    reports: true, settings: true, ai_assistant: true, communication: true, documents: true 
  },
  SUPER_ADMIN: { 
    dashboard: true, centers: true, users: true, students: true, teachers: true, 
    classes: true, courses: true, attendance: true, payments: true, payroll: true, 
    reports: true, settings: true, ai_assistant: true, communication: true, documents: true 
  },
  // Aliases used by JWT / login redirects — same effective access as SUPER_ADMIN
  SUPERADMIN: {
    dashboard: true, centers: true, users: true, students: true, teachers: true,
    classes: true, courses: true, attendance: true, payments: true, payroll: true,
    reports: true, settings: true, ai_assistant: true, communication: true, documents: true
  },
  ADMIN: {
    dashboard: true, centers: true, users: true, students: true, teachers: true,
    classes: true, courses: true, attendance: true, payments: true, payroll: true,
    reports: true, settings: true, ai_assistant: true, communication: true, documents: true
  },
  DIRECTOR: { 
    dashboard: true, centers: true, users: true, students: true, teachers: true, 
    classes: true, courses: true, attendance: true, payments: true, reports: true, 
    settings: false, ai_assistant: true, communication: true, documents: true, payroll: true 
  },
  CENTER_ADMIN: { 
    dashboard: true, centers: false, users: true, students: true, teachers: true, 
    classes: true, courses: true, attendance: true, payments: true, reports: true, 
    settings: false, ai_assistant: false, communication: true, documents: true, payroll: false 
  },
  CENTER_MANAGER: { 
    dashboard: true, centers: true, users: true, students: true, teachers: true, 
    classes: true, courses: true, attendance: true, payments: true, payroll: true, 
    reports: true, settings: true, ai_assistant: true, communication: true, documents: true 
  },
  // Finance roles — default to the finance/reporting modules so UI gating doesn't hide
  // fee-receipts/exports from them; the Chairman can still revoke per-user.
  ACCOUNTANT: {
    dashboard: true, centers: false, users: false, students: true, teachers: false,
    classes: false, courses: false, attendance: false, payments: true, payroll: true,
    reports: true, settings: false, ai_assistant: false, communication: true, documents: true
  },
  FINANCE: {
    dashboard: true, centers: false, users: false, students: true, teachers: false,
    classes: false, courses: false, attendance: false, payments: true, payroll: true,
    reports: true, settings: false, ai_assistant: false, communication: true, documents: true
  },
  TEACHER: {
    dashboard: true, centers: false, users: false, students: true, teachers: false,
    classes: true, courses: false, attendance: true, payments: false, reports: false,
    settings: false, ai_assistant: false, communication: true, documents: true, payroll: false
  },
  STUDENT: { 
    dashboard: true, centers: false, users: false, students: false, teachers: false, 
    classes: false, courses: false, attendance: true, payments: false, reports: false, 
    settings: false, ai_assistant: false, communication: true, documents: true, payroll: false 
  },
  PARENT: { 
    dashboard: true, centers: false, users: false, students: false, teachers: false, 
    classes: false, courses: false, attendance: true, payments: false, reports: false, 
    settings: false, ai_assistant: false, communication: true, documents: false, payroll: false 
  },
  STAFF: { 
    dashboard: true, centers: false, users: false, students: false, teachers: false, 
    classes: false, courses: false, attendance: true, payments: false, reports: false, 
    settings: false, ai_assistant: false, communication: true, documents: true, payroll: false 
  },
  TEACHING_ASSISTANT: { 
    dashboard: true, centers: false, users: false, students: true, teachers: false, 
    classes: true, courses: false, attendance: true, payments: false, reports: false, 
    settings: false, ai_assistant: false, communication: true, documents: true, payroll: false 
  },
  TA: { 
    dashboard: true, centers: false, users: false, students: true, teachers: false, 
    classes: true, courses: false, attendance: true, payments: false, reports: false, 
    settings: false, ai_assistant: false, communication: true, documents: true, payroll: false 
  },
  ACADEMIC_MANAGER: { 
    dashboard: true, centers: false, users: false, students: true, teachers: true, 
    classes: true, courses: true, attendance: true, payments: false, reports: true, 
    settings: false, ai_assistant: false, communication: true, documents: true, payroll: false 
  },
};

interface PermissionContextType {
  permissions: UserPermission;
  hasPermission: (permission: keyof UserPermission) => boolean;
  /** "grant" = a per-user row an admin saved; "role"/"default" = nobody configured this user. */
  source: PermissionSource;
  isGranted: (permission: keyof UserPermission) => boolean;
  refreshPermissions: () => void;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

/**
 * Loads fine-grained permissions from identity_service using {@link apiFetch}
 * so HttpOnly auth cookies work (no readable `token` cookie required).
 */
/**
 * Maps a /api/user-permissions/user/{id} body onto the client flag set, and reports whether
 * a real stored row backs it. Pure so the rule is testable without a session.
 */
export const mapApiPermissions = (
  data: unknown,
): { permissions: UserPermission; configured: boolean } | null => {
  {
    if (data && typeof data === "object") {
      // `configured` false means the server synthesised an all-denied default because this
      // user has no row. Older builds omit the key; `id` is only ever set on a real row, so
      // fall back to that rather than treating a synthesised default as a deliberate denial.
      const configured =
        (data as any).configured ?? Boolean((data as any).id);
      const permissions: UserPermission = {
        dashboard: (data as any).dashboard ?? true,
        centers: (data as any).centers ?? false,
        users: (data as any).users ?? false,
        students: (data as any).students ?? false,
        teachers: (data as any).teachers ?? false,
        classes: (data as any).classes ?? false,
        courses: (data as any).courses ?? false,
        attendance: (data as any).attendance ?? false,
        payments: (data as any).payments ?? false,
        payroll: (data as any).payroll ?? false,
        reports: (data as any).reports ?? false,
        settings: (data as any).settings ?? false,
        ai_assistant: (data as any).aiAssistant ?? (data as any).ai_assistant ?? false,
        communication: (data as any).communication ?? false,
        documents: (data as any).documents ?? false,
        socialMedia: (data as any).socialMedia ?? false,
      };
      return { permissions, configured: Boolean(configured) };
    }
  }
  return null;
};

/** True only when an admin saved a per-user row that turns `permission` on. */
export const grantsModule = (
  source: PermissionSource,
  permissions: UserPermission,
  permission: keyof UserPermission,
): boolean => source === "grant" && permissions[permission] === true;

const fetchUserPermissionsFromAPI = async (
  userId: string,
): Promise<{ permissions: UserPermission; configured: boolean } | null> => {
  try {
    return mapApiPermissions(await apiFetch(`/api/user-permissions/user/${userId}`));
  } catch (error) {
    console.log("Could not fetch user permissions from API:", error);
    return null;
  }
};

export function PermissionProvider({ children }: { children: ReactNode }) {
  // Start with ALL permissions for Chairman/CEO/Super Admin by default
  const [permissions, setPermissions] = useState<UserPermission>({
    dashboard: true, centers: true, users: true, students: true, teachers: true, 
    classes: true, courses: true, attendance: true, payments: true, payroll: true, 
    reports: true, settings: true, ai_assistant: true, communication: true, documents: true 
  });
  // Where the flags in `permissions` came from. The sidebar needs this to honour a
  // Chairman's per-user grant without also revealing a section to everyone who happens
  // to hold the same role — a role default is not somebody deciding this user may see it.
  const [source, setSource] = useState<PermissionSource>("default");
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadPermissions = async () => {
    try {
      // Get current user from cookie - try both cookie names
      let userDataStr = document.cookie
        .split("; ")
        .find((row) => row.startsWith("userData="))
        ?.split("=")[1];
      
      // Also try user_data cookie
      if (!userDataStr) {
        userDataStr = document.cookie
          .split("; ")
          .find((row) => row.startsWith("user_data="))
          ?.split("=")[1];
      }

      // Also check actualRole cookie as fallback
      const actualRole = document.cookie
        .split("; ")
        .find((row) => row.startsWith("actualRole="))
        ?.split("=")[1];

      let currentUserId = null;
      let currentRole = actualRole || "STAFF";

      if (userDataStr) {
        try {
          const userData = JSON.parse(decodeURIComponent(userDataStr));
          currentUserId = userData.id;
          currentRole = userData.roleName || userData.role?.name || userData.role || actualRole || "STAFF";
        } catch (e) {
          console.error("Error parsing user data:", e);
        }
      }

      setUserId(currentUserId);
      setUserRole(currentRole);

      // Chairman (L0 / GOD), executives, and platform admins — full UI permissions
      const highLevelRoles = ["CHAIRMAN", "CEO", "SUPER_ADMIN", "SUPERADMIN", "ADMIN", "DIRECTOR"];
      if (highLevelRoles.includes(currentRole?.toUpperCase() || "")) {
        const allPermissions: UserPermission = {
          dashboard: true, centers: true, users: true, students: true, teachers: true, 
          classes: true, courses: true, attendance: true, payments: true, payroll: true, 
          reports: true, settings: true, ai_assistant: true, communication: true, documents: true 
        };
        setPermissions(allPermissions);
        setSource("role");
        setIsLoaded(true);
        return;
      }

      // Fetch overrides from API when we have a session (Bearer or HttpOnly cookie via apiFetch)
      if (currentUserId && hasAuthSession()) {
        const granted = await fetchUserPermissionsFromAPI(currentUserId);
        // Only a real stored row counts as a grant. The previous test — "any value is
        // true" — was satisfied by the server's synthesised default, whose `dashboard`
        // is always true, so EVERY user took this branch and the role defaults below
        // were unreachable. It also meant a Chairman who switched everything off had
        // the revocation ignored and the role defaults restored.
        if (granted?.configured) {
          setPermissions(granted.permissions);
          setSource("grant");
          setIsLoaded(true);
          return;
        }
      }

      // Check localStorage as fallback
      if (currentUserId) {
        const savedPermissions = localStorage.getItem("user_permissions");
        if (savedPermissions) {
          const allPermissions = JSON.parse(savedPermissions);
          if (allPermissions[currentUserId]) {
            setPermissions(allPermissions[currentUserId]);
            setSource("grant");
            setIsLoaded(true);
            return;
          }
        }
      }

      // Use role default permissions
      const rolePerms = ROLE_DEFAULT_PERMISSIONS[currentRole?.toUpperCase() || ""] || DEFAULT_PERMISSIONS;
      setPermissions(rolePerms);
      setSource(ROLE_DEFAULT_PERMISSIONS[currentRole?.toUpperCase() || ""] ? "role" : "default");
      setIsLoaded(true);
    } catch (error) {
      console.error("Error loading permissions:", error);
      // Fail CLOSED. This used to grant every module on any thrown error — and the throw is
      // reachable without being an admin at all (a corrupt `user_permissions` localStorage
      // value makes JSON.parse throw), which handed a STUDENT the full admin sidebar.
      // Roles that legitimately see everything are resolved above, before anything can throw.
      setPermissions(DEFAULT_PERMISSIONS);
      setSource("default");
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    loadPermissions();
    
    // Listen for permission updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user_permissions") {
        loadPermissions();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const hasPermission = (permission: keyof UserPermission): boolean => {
    return permissions[permission] === true;
  };

  // True only when an admin explicitly turned this module on for THIS user.
  const isGranted = (permission: keyof UserPermission): boolean =>
    grantsModule(source, permissions, permission);

  const refreshPermissions = () => {
    loadPermissions();
  };

  return (
    <PermissionContext.Provider value={{ permissions, hasPermission, source, isGranted, refreshPermissions }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }
  return context;
}

// Export for use in other files
export { ROLE_DEFAULT_PERMISSIONS, DEFAULT_PERMISSIONS };
