"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function BonusesAdminPage() {
  return (
    <AdminCrudPage
      title="🎉 Bonuses"
      description="Approved bonuses that flow into the next payroll cycle for the targeted teacher."
      endpoint="/api/payroll/bonuses"
      columns={[
        { key: "teacherId", label: "Teacher ID", required: true, type: "number" },
        { key: "payrollCycleId", label: "Payroll cycle ID", type: "number" },
        { key: "bonusType", label: "Type", placeholder: "PERFORMANCE / RETENTION / TET" },
        { key: "amount", label: "Amount (VND)", type: "number", required: true },
        { key: "status", label: "Status", type: "select", options: [
          { value: "APPROVED", label: "APPROVED" },
          { value: "PENDING", label: "PENDING" },
          { value: "REJECTED", label: "REJECTED" },
        ]},
        { key: "notes", label: "Notes", type: "textarea", hideInList: true },
      ]}
      defaults={{ status: "APPROVED" }}
    />
  );
}
