"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function SalaryPayoutsAdminPage() {
  return (
    <AdminCrudPage
      title="💸 Salary Payouts"
      description="Individual salary disbursements. Once a payroll cycle is approved, each teacher's payment is materialised here for finance to settle."
      endpoint="/api/salary-payouts"
      columns={[
        { key: "salaryId", label: "Payroll record", placeholder: "uuid" },
        { key: "teacherId", label: "Teacher", required: true, placeholder: "uuid" },
        { key: "payoutDate", label: "Payout date", type: "date" },
        { key: "amount", label: "Amount", type: "number", required: true },
        { key: "paymentMethod", label: "Method", type: "select", options: [
          { value: "BANK_TRANSFER", label: "Bank transfer" },
          { value: "CASH", label: "Cash" },
          { value: "CHEQUE", label: "Cheque" },
        ]},
        { key: "bankName", label: "Bank", hideInList: true },
        { key: "accountNumber", label: "Account #", hideInList: true },
        { key: "transactionReference", label: "Ref" },
        { key: "status", label: "Status", type: "select", options: [
          { value: "PENDING", label: "PENDING" },
          { value: "PROCESSING", label: "PROCESSING" },
          { value: "COMPLETED", label: "COMPLETED" },
          { value: "FAILED", label: "FAILED" },
        ]},
        { key: "failureReason", label: "Failure reason", type: "textarea", hideInList: true },
        { key: "notes", label: "Notes", type: "textarea", hideInList: true },
      ]}
      defaults={{ status: "PENDING", paymentMethod: "BANK_TRANSFER" }}
    />
  );
}
