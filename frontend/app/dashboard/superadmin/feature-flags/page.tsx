"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function FeatureFlagsAdminPage() {
  return (
    <AdminCrudPage
      title="Feature Flags"
      description="Toggle product features on or off, optionally with a rollout percentage."
      endpoint="/api/feature-flags"
      searchableFields={["flagKey", "flagName", "description"]}
      columns={[
        { key: "flagKey", label: "Key", required: true, placeholder: "checkout_v2" },
        { key: "flagName", label: "Name", placeholder: "Checkout v2" },
        { key: "isEnabled", label: "Enabled", type: "boolean" },
        { key: "rolloutPercentage", label: "Rollout %", type: "number", placeholder: "0" },
        { key: "description", label: "Description", type: "textarea", hideInList: true },
        { key: "targetTenants", label: "Target tenants (JSON)", type: "json", hideInList: true },
        { key: "targetUsers", label: "Target users (JSON)", type: "json", hideInList: true },
      ]}
      defaults={{ isEnabled: false, rolloutPercentage: 0 }}
    />
  );
}
