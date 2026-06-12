"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function TenantsAdminPage() {
  return (
    <AdminCrudPage
      title="🏢 Tenants"
      description="Top-level tenant accounts. Each tenant maps to a paying customer / school group with its own subscription plan and quota."
      endpoint="/api/tenants"
      columns={[
        { key: "code", label: "Code", required: true, placeholder: "lera-hcm" },
        { key: "name", label: "Name", required: true },
        { key: "domain", label: "Domain", placeholder: "leraacademy.edu.vn" },
        { key: "subdomain", label: "Subdomain", placeholder: "hcm" },
        { key: "status", label: "Status", type: "select", options: [
          { value: "ACTIVE", label: "ACTIVE" },
          { value: "SUSPENDED", label: "SUSPENDED" },
          { value: "DELETED", label: "DELETED" },
        ]},
        { key: "subscriptionPlan", label: "Plan", placeholder: "FREE / STARTER / PRO" },
        { key: "subscriptionExpiresAt", label: "Plan expires", type: "date" },
        { key: "maxCenters", label: "Max centers", type: "number" },
        { key: "maxUsers", label: "Max users", type: "number" },
        { key: "features", label: "Features (JSON)", type: "json", hideInList: true },
        { key: "createdAt", label: "Created", type: "datetime", readOnly: true, hideInForm: true },
      ]}
      defaults={{ status: "ACTIVE", maxCenters: 1, maxUsers: 100 }}
    />
  );
}
