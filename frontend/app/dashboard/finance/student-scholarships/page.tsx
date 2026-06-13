"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function StudentScholarshipsAdminPage() {
  return (
    <AdminCrudPage
      title="🎓 Student Scholarships"
      description="Per-student scholarship awards. Each row links a scholarship template to a specific student with an effective period and amount."
      endpoint="/api/student-scholarships"
      columns={[
        { key: "studentId", label: "Student", required: true, placeholder: "uuid" },
        { key: "scholarshipId", label: "Scholarship", required: true, placeholder: "uuid" },
        { key: "amount", label: "Amount (VND)", type: "number" },
        { key: "percentage", label: "Percent", type: "number" },
        { key: "effectiveFrom", label: "From", type: "date" },
        { key: "effectiveTo", label: "To", type: "date" },
        { key: "status", label: "Status", type: "select", options: [
          { value: "ACTIVE", label: "ACTIVE" },
          { value: "PAUSED", label: "PAUSED" },
          { value: "EXPIRED", label: "EXPIRED" },
          { value: "REVOKED", label: "REVOKED" },
        ]},
        { key: "notes", label: "Notes", type: "textarea", hideInList: true },
      ]}
      defaults={{ status: "ACTIVE" }}
    />
  );
}
