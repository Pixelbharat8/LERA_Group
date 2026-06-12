"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function TaxSettingsAdminPage() {
  return (
    <AdminCrudPage
      title="Tax Settings"
      description="Income tax slabs and statutory deductions used by payroll calculations."
      endpoint="/api/tax-settings"
      searchableFields={["taxName", "taxType"]}
      columns={[
        { key: "taxName", label: "Tax", required: true, placeholder: "Income Tax" },
        {
          key: "taxType",
          label: "Type",
          type: "select",
          options: [
            { value: "INCOME", label: "Income" },
            { value: "PROFESSIONAL", label: "Professional" },
            { value: "TDS", label: "TDS" },
          ],
        },
        {
          key: "calculationMethod",
          label: "Method",
          type: "select",
          options: [
            { value: "SLAB", label: "Slab" },
            { value: "PERCENTAGE", label: "Percentage" },
            { value: "FIXED", label: "Fixed" },
          ],
        },
        { key: "percentageRate", label: "Rate %", type: "number" },
        { key: "fixedAmount", label: "Fixed amt", type: "number" },
        { key: "minTaxableIncome", label: "Min taxable", type: "number", hideInList: true },
        { key: "maxExemption", label: "Max exemption", type: "number", hideInList: true },
        { key: "applicableFrom", label: "Effective from", type: "date" },
        { key: "applicableTo", label: "Effective to", type: "date", hideInList: true },
        { key: "isActive", label: "Active", type: "boolean" },
        { key: "taxSlabs", label: "Slabs (JSON)", type: "json", hideInList: true },
        { key: "description", label: "Description", type: "textarea", hideInList: true },
      ]}
      defaults={{ isActive: true, calculationMethod: "PERCENTAGE", taxType: "INCOME" }}
    />
  );
}
