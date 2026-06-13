"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function LedgerEntriesAdminPage() {
  return (
    <AdminCrudPage
      title="📒 Ledger Entries"
      description="Every financial movement (payment, refund, fee, adjustment). Investigate balances or post a manual correction."
      endpoint="/api/ledger"
      searchableFields={["accountName", "accountCode", "description"]}
      columns={[
        { key: "transactionDate", label: "Date", type: "date", required: true },
        { key: "accountCode", label: "Account code", placeholder: "4000" },
        { key: "accountName", label: "Account", required: true, placeholder: "Tuition Revenue" },
        {
          key: "entryType",
          label: "Type",
          type: "select",
          options: [
            { value: "PAYMENT", label: "PAYMENT" },
            { value: "REFUND", label: "REFUND" },
            { value: "FEE", label: "FEE" },
            { value: "DISCOUNT", label: "DISCOUNT" },
            { value: "ADJUSTMENT", label: "ADJUSTMENT" },
          ],
        },
        { key: "debitAmount", label: "Debit (VND)", type: "number" },
        { key: "creditAmount", label: "Credit (VND)", type: "number" },
        { key: "balance", label: "Balance (VND)", type: "number", hideInForm: true },
        {
          key: "status",
          label: "Status",
          type: "select",
          options: [
            { value: "DRAFT", label: "DRAFT" },
            { value: "POSTED", label: "POSTED" },
            { value: "APPROVED", label: "APPROVED" },
            { value: "VOID", label: "VOID" },
          ],
        },
        { key: "referenceType", label: "Ref type", placeholder: "INVOICE / PAYMENT", hideInList: true },
        { key: "referenceId", label: "Ref ID", placeholder: "uuid", hideInList: true },
        { key: "description", label: "Description", type: "textarea", hideInList: true },
      ]}
      defaults={{ entryType: "ADJUSTMENT", status: "DRAFT", debitAmount: 0, creditAmount: 0 }}
      // Ledger entries should never be hard-deleted (use VOID status instead).
      canDelete={false}
    />
  );
}
