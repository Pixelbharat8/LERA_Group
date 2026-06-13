"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function LeadStatusesAdminPage() {
  return (
    <AdminCrudPage
      title="Lead Statuses"
      description="The set of statuses leads can transition through (NEW, QUALIFIED, WON, LOST, etc.)."
      endpoint="/api/lead-statuses"
      searchableFields={["statusName", "statusCode"]}
      columns={[
        { key: "statusName", label: "Name", required: true, placeholder: "Qualified" },
        { key: "statusCode", label: "Code", placeholder: "QUALIFIED" },
        { key: "colorCode", label: "Color", placeholder: "#3b82f6" },
        { key: "icon", label: "Icon", placeholder: "🎯", hideInList: true },
        { key: "displayOrder", label: "Order", type: "number" },
        { key: "isActive", label: "Active", type: "boolean" },
        { key: "isDefault", label: "Default", type: "boolean" },
        { key: "isFinal", label: "Terminal", type: "boolean" },
        { key: "description", label: "Description", type: "textarea", hideInList: true },
        { key: "autoActions", label: "Auto-actions (JSON)", type: "json", hideInList: true },
        { key: "requiredFields", label: "Required fields (JSON)", type: "json", hideInList: true },
        { key: "nextStatuses", label: "Next statuses (JSON)", type: "json", hideInList: true },
      ]}
      defaults={{ isActive: true, isDefault: false, isFinal: false, displayOrder: 0 }}
    />
  );
}
