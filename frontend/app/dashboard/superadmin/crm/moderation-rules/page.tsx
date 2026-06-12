"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function ContentModerationRulesAdminPage() {
  return (
    <AdminCrudPage
      title="🛡️ Content Moderation Rules"
      description="Pattern-based filters that auto-flag or block messages in chat / lessons / social posts."
      endpoint="/api/content-moderation-rules"
      columns={[
        { key: "name", label: "Name", required: true },
        { key: "pattern", label: "Pattern (regex)", required: true, type: "textarea" },
        { key: "action", label: "Action", type: "select", options: [
          { value: "FLAG", label: "FLAG" },
          { value: "BLOCK", label: "BLOCK" },
          { value: "REVIEW", label: "REVIEW" },
        ]},
        { key: "severity", label: "Severity", type: "select", options: [
          { value: "LOW", label: "LOW" },
          { value: "MEDIUM", label: "MEDIUM" },
          { value: "HIGH", label: "HIGH" },
          { value: "CRITICAL", label: "CRITICAL" },
        ]},
        { key: "isActive", label: "Active?", type: "boolean" },
        { key: "description", label: "Description", type: "textarea", hideInList: true },
      ]}
      defaults={{ action: "FLAG", severity: "MEDIUM", isActive: true }}
    />
  );
}
