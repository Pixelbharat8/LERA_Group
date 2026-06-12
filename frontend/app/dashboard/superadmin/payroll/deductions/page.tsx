"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function DeductionsAdminPage() {
  return (
    <AdminCrudPage
      title="💰 Deductions"
      description="Approved deductions (advances, fines, missed sessions) that subtract from the next payroll cycle for the targeted teacher."
      endpoint="/api/payroll/deductions"
      columns={[
        { key: "teacherId", label: "Teacher ID", required: true, type: "number" },
        { key: "payrollCycleId", label: "Payroll cycle ID", type: "number" },
        { key: "deductionType", label: "Type", placeholder: "ADVANCE / FINE / TAX" },
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
