"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

/**
 * User-Role assignments — the join table that grants a given user a given
 * role. The role itself is managed under /superadmin/roles. This page is for
 * support / on-call to fix mis-assignments fast.
 */
export default function UserRolesAdminPage() {
  return (
    <AdminCrudPage
      title="🔗 User-Role Assignments"
      description="Direct user ↔ role bindings. Use this only when you need to fix or audit a specific assignment outside the normal user-management flow."
      endpoint="/api/user-roles"
      columns={[
        { key: "userId", label: "User ID", required: true, placeholder: "uuid" },
        { key: "roleId", label: "Role ID", required: true, placeholder: "uuid" },
        { key: "assignedBy", label: "Assigned by", placeholder: "uuid" },
        { key: "assignedAt", label: "Assigned at", type: "datetime", readOnly: true, hideInForm: true },
      ]}
      canEdit={false}
    />
  );
}
