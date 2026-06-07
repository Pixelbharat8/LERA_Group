"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function FeeReceiptsAdminPage() {
  return (
    <AdminCrudPage
      title="🧾 Fee Receipts"
      description="Issued receipts for student-fee payments. Look up a receipt number for a parent, or void a wrong issuance."
      endpoint="/api/fee-receipts"
      searchableFields={["receiptNumber"]}
      // Receipts are immutable once issued — the backend exposes POST + DELETE only (no PUT).
      canEdit={false}
      columns={[
        { key: "receiptNumber", label: "Receipt #", required: true },
        { key: "studentId", label: "Student", placeholder: "uuid", required: true },
        { key: "invoiceId", label: "Invoice", placeholder: "uuid", hideInList: true },
        { key: "paymentId", label: "Payment", placeholder: "uuid", hideInList: true },
        { key: "amount", label: "Amount (VND)", type: "number", required: true },
        { key: "paymentMethod", label: "Method", placeholder: "Cash / Bank Transfer" },
        { key: "receiptDate", label: "Receipt date", type: "datetime" },
        { key: "notes", label: "Notes", type: "textarea", hideInList: true },
      ]}
    />
  );
}
