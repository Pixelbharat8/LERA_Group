"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function PayrollCyclesAdminPage() {
  return (
    <AdminCrudPage
      title="Payroll Cycles"
      description="Define billing periods for payroll. Status transitions: DRAFT → CALCULATED → APPROVED → PROCESSED → PAID."
      endpoint="/api/payroll-cycles"
      searchableFields={["cycleName", "status"]}
      columns={[
        { key: "cycleName", label: "Cycle", required: true, placeholder: "May 2026" },
        {
          key: "cycleType",
          label: "Type",
          type: "select",
          options: [
            { value: "WEEKLY", label: "Weekly" },
            { value: "BI_WEEKLY", label: "Bi-weekly" },
            { value: "MONTHLY", label: "Monthly" },
            { value: "QUARTERLY", label: "Quarterly" },
          ],
        },
        { key: "startDate", label: "Start", type: "date", required: true },
        { key: "endDate", label: "End", type: "date", required: true },
        { key: "paymentDate", label: "Pay date", type: "date" },
        {
          key: "status",
          label: "Status",
          type: "select",
          options: [
            { value: "DRAFT", label: "Draft" },
            { value: "CALCULATED", label: "Calculated" },
            { value: "APPROVED", label: "Approved" },
            { value: "PROCESSED", label: "Processed" },
            { value: "PAID", label: "Paid" },
          ],
        },
        { key: "totalEmployees", label: "Employees", type: "number", readOnly: true, hideInList: true },
        { key: "totalGrossSalary", label: "Gross", type: "number", readOnly: true, hideInList: true },
        { key: "totalNetSalary", label: "Net", type: "number", readOnly: true, hideInList: true },
        { key: "notes", label: "Notes", type: "textarea", hideInList: true },
      ]}
      defaults={{ cycleType: "MONTHLY", status: "DRAFT" }}
    />
  );
}
