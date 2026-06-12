"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function CrmTriggersAdminPage() {
  return (
    <AdminCrudPage
      title="⚡ CRM Triggers"
      description="Automated rules that fire on lead-status changes (auto-email, task creation, slack alert)."
      endpoint="/api/crm-triggers"
      columns={[
        { key: "name", label: "Name", required: true },
        { key: "event", label: "Event", placeholder: "LEAD_CREATED / LEAD_QUALIFIED" },
        { key: "action", label: "Action", placeholder: "SEND_EMAIL / CREATE_TASK / SLACK_PING" },
        { key: "isActive", label: "Active?", type: "boolean" },
        { key: "config", label: "Config (JSON)", type: "json", hideInList: true },
        { key: "description", label: "Description", type: "textarea", hideInList: true },
      ]}
      defaults={{ isActive: true }}
    />
  );
}
