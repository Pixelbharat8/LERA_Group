"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function LeadAssignmentsAdminPage() {
  return (
    <AdminCrudPage
      title="🧑‍💼 Lead Assignments"
      description="Records which sales rep currently owns each lead. Reassign a lead by editing the assignedTo field."
      endpoint="/api/lead-assignments"
      columns={[
        { key: "leadId", label: "Lead", required: true, placeholder: "uuid" },
        { key: "assignedTo", label: "Owner (user)", required: true, placeholder: "uuid" },
        { key: "assignedBy", label: "Assigned by", placeholder: "uuid" },
        { key: "assignedAt", label: "Assigned at", type: "datetime", readOnly: true, hideInForm: true },
        { key: "notes", label: "Notes", type: "textarea", hideInList: true },
      ]}
    />
  );
}
