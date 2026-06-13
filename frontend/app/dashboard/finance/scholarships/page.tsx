"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function ScholarshipsAdminPage() {
  return (
    <AdminCrudPage
      title="Scholarships"
      description="Discounts and merit awards that can be applied to student fee plans."
      endpoint="/api/scholarships"
      searchableFields={["scholarshipName", "scholarshipCode", "scholarshipType"]}
      columns={[
        { key: "scholarshipName", label: "Name", required: true },
        { key: "scholarshipCode", label: "Code", placeholder: "MERIT_2026" },
        {
          key: "scholarshipType",
          label: "Type",
          type: "select",
          options: [
            { value: "MERIT", label: "Merit" },
            { value: "NEED_BASED", label: "Need-based" },
            { value: "SIBLING", label: "Sibling" },
            { value: "REFERRAL", label: "Referral" },
            { value: "FULL", label: "Full" },
            { value: "PARTIAL", label: "Partial" },
          ],
        },
        {
          key: "discountType",
          label: "Discount",
          type: "select",
          options: [
            { value: "PERCENTAGE", label: "Percentage" },
            { value: "FIXED_AMOUNT", label: "Fixed amount" },
          ],
        },
        { key: "discountValue", label: "Value", type: "number", required: true },
        { key: "maxDiscountAmount", label: "Cap", type: "number", hideInList: true },
        { key: "maxRecipients", label: "Max recipients", type: "number", hideInList: true },
        { key: "currentRecipients", label: "Current", type: "number", readOnly: true, hideInList: true },
        { key: "startDate", label: "Start", type: "date" },
        { key: "endDate", label: "End", type: "date" },
        { key: "applicationDeadline", label: "Deadline", type: "date", hideInList: true },
        { key: "totalBudget", label: "Budget", type: "number", hideInList: true },
        { key: "spentBudget", label: "Spent", type: "number", readOnly: true, hideInList: true },
        { key: "sponsorName", label: "Sponsor", hideInList: true },
        { key: "isActive", label: "Active", type: "boolean" },
        { key: "isRenewable", label: "Renewable", type: "boolean", hideInList: true },
        { key: "autoApply", label: "Auto-apply", type: "boolean", hideInList: true },
        { key: "description", label: "Description", type: "textarea", hideInList: true },
        { key: "eligibilityCriteria", label: "Eligibility (JSON)", type: "json", hideInList: true },
      ]}
      defaults={{
        isActive: true,
        isRenewable: false,
        autoApply: false,
        discountType: "PERCENTAGE",
        scholarshipType: "MERIT",
        currentRecipients: 0,
      }}
    />
  );
}
