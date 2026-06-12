"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function TeacherOvertimeAdminPage() {
  return (
    <AdminCrudPage
      title="⏱️ Teacher Overtime"
      description="Approved overtime hours that feed into the next payroll cycle. Use the type field to apply different multipliers."
      endpoint="/api/teacher-overtime"
      columns={[
        { key: "teacherId", label: "Teacher", required: true, placeholder: "uuid" },
        { key: "overtimeDate", label: "Date", type: "date", required: true },
        { key: "hoursWorked", label: "Hours", type: "number", required: true },
        { key: "overtimeType", label: "Type", type: "select", options: [
          { value: "REGULAR", label: "REGULAR" },
          { value: "WEEKEND", label: "WEEKEND" },
          { value: "HOLIDAY", label: "HOLIDAY" },
        ]},
        { key: "hourlyRate", label: "Rate (VND/hr)", type: "number" },
        { key: "totalAmount", label: "Total (VND)", type: "number", readOnly: true },
        { key: "status", label: "Status", placeholder: "APPROVED / PENDING" },
        { key: "notes", label: "Notes", type: "textarea", hideInList: true },
      ]}
      defaults={{ overtimeType: "REGULAR", status: "APPROVED" }}
    />
  );
}
