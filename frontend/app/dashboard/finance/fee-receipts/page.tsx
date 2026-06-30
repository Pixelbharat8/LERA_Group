"use client";

import AdminCrudPage from "@/components/AdminCrudPage";
import { usePermissions } from "@/app/context/PermissionContext";

export default function FeeReceiptsAdminPage() {
  // Issuing / voiding receipts is governed by the Chairman's "Payments / Finance" grant.
  // God-mode roles (Chairman/CEO/Super Admin) default to granted, so they're never blocked.
  // The backend enforces the same via PermissionGateFilter (finance.create) — this keeps the
  // UI honest so revoked staff don't see a button that would just 403.
  const { hasPermission } = usePermissions();
  const canIssue = hasPermission("payments");

  return (
    <AdminCrudPage
      title="🧾 Fee Receipts"
      description="Issued receipts for student-fee payments. Look up a receipt number for a parent, or void a wrong issuance."
      endpoint="/api/fee-receipts"
      searchableFields={["receiptNumber"]}
      // Receipts are immutable once issued — the backend exposes POST + DELETE only (no PUT).
      canEdit={false}
      canCreate={canIssue}
      canDelete={canIssue}
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
