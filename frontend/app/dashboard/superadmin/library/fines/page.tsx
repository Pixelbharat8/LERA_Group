"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function LibraryFinesAdminPage() {
  return (
    <AdminCrudPage
      title="⚠️ Library Fines"
      description="Fines auto-issued for overdue / lost / damaged books. Mark as paid or waived from here."
      endpoint="/api/library-fines"
      columns={[
        { key: "borrowingId", label: "Borrowing", placeholder: "uuid" },
        { key: "userId", label: "User", required: true, placeholder: "uuid" },
        { key: "amount", label: "Amount (VND)", type: "number", required: true },
        { key: "reason", label: "Reason", type: "select", options: [
          { value: "OVERDUE", label: "OVERDUE" },
          { value: "LOST", label: "LOST" },
          { value: "DAMAGED", label: "DAMAGED" },
        ]},
        { key: "issuedAt", label: "Issued", type: "datetime" },
        { key: "paidAt", label: "Paid", type: "datetime" },
        { key: "status", label: "Status", type: "select", options: [
          { value: "OUTSTANDING", label: "OUTSTANDING" },
          { value: "PAID", label: "PAID" },
          { value: "WAIVED", label: "WAIVED" },
        ]},
        { key: "notes", label: "Notes", type: "textarea", hideInList: true },
      ]}
      defaults={{ status: "OUTSTANDING", reason: "OVERDUE" }}
    />
  );
}
