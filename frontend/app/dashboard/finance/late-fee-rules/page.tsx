"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function LateFeeRulesAdminPage() {
  return (
    <AdminCrudPage
      title="Late-Fee Rules"
      description="Penalty rules applied when an invoice goes past its due date."
      endpoint="/api/late-fee-rules"
      searchableFields={["ruleName"]}
      columns={[
        { key: "ruleName", label: "Rule", required: true, placeholder: "Standard 5% after 7 days" },
        { key: "centerId", label: "Center ID", hideInList: true },
        { key: "daysAfterDue", label: "Days after due", type: "number", required: true },
        { key: "gracePeriodDays", label: "Grace period (d)", type: "number" },
        {
          key: "feeType",
          label: "Fee type",
          type: "select",
          options: [
            { value: "PERCENTAGE", label: "Percentage" },
            { value: "FIXED",      label: "Fixed amount" },
          ],
        },
        { key: "feeValue", label: "Value", type: "number", required: true },
        { key: "compoundInterest", label: "Compound", type: "boolean" },
        { key: "isActive", label: "Active", type: "boolean" },
      ]}
      defaults={{ feeType: "PERCENTAGE", isActive: true, compoundInterest: false, gracePeriodDays: 0, daysAfterDue: 7 }}
    />
  );
}
