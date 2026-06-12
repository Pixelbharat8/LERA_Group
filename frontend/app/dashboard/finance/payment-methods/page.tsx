"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function PaymentMethodsAdminPage() {
  return (
    <AdminCrudPage
      title="Payment Methods"
      description="Configure the payment gateways and offline channels available to families."
      endpoint="/api/payment-methods"
      searchableFields={["methodName", "methodCode", "providerName"]}
      columns={[
        { key: "methodName", label: "Name", required: true, placeholder: "Bank Transfer" },
        { key: "methodCode", label: "Code", placeholder: "BANK_TRANSFER" },
        {
          key: "methodType",
          label: "Type",
          type: "select",
          options: [
            { value: "CASH", label: "Cash" },
            { value: "BANK_TRANSFER", label: "Bank transfer" },
            { value: "CARD", label: "Card" },
            { value: "E_WALLET", label: "E-wallet" },
            { value: "INSTALLMENT", label: "Installment" },
          ],
        },
        { key: "providerName", label: "Provider" },
        { key: "transactionFeePercentage", label: "Fee %", type: "number" },
        { key: "fixedTransactionFee", label: "Fixed fee", type: "number", hideInList: true },
        { key: "minAmount", label: "Min", type: "number", hideInList: true },
        { key: "maxAmount", label: "Max", type: "number", hideInList: true },
        { key: "isActive", label: "Active", type: "boolean" },
        { key: "isDefault", label: "Default", type: "boolean" },
        { key: "isOnline", label: "Online", type: "boolean" },
        { key: "requiresVerification", label: "Verify", type: "boolean", hideInList: true },
        { key: "processingTimeHours", label: "Processing hrs", type: "number", hideInList: true },
        { key: "displayOrder", label: "Order", type: "number" },
        { key: "iconUrl", label: "Icon URL", hideInList: true },
        { key: "description", label: "Description", type: "textarea", hideInList: true },
        { key: "instructions", label: "Instructions", type: "textarea", hideInList: true },
        { key: "accountInfo", label: "Account info (JSON)", type: "json", hideInList: true },
      ]}
      defaults={{
        isActive: true,
        isDefault: false,
        isOnline: false,
        requiresVerification: false,
        methodType: "BANK_TRANSFER",
      }}
    />
  );
}
