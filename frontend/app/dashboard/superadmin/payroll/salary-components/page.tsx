"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function SalaryComponentsAdminPage() {
  return (
    <AdminCrudPage
      title="Salary Components"
      description="Earnings and deductions used to build payslips (HRA, DA, PF, etc.)."
      endpoint="/api/salary-components"
      searchableFields={["componentName", "componentType"]}
      columns={[
        { key: "componentName", label: "Name", required: true, placeholder: "HRA" },
        {
          key: "componentType",
          label: "Type",
          type: "select",
          options: [
            { value: "EARNING", label: "Earning" },
            { value: "DEDUCTION", label: "Deduction" },
          ],
        },
        {
          key: "calculationType",
          label: "Calc",
          type: "select",
          options: [
            { value: "FIXED", label: "Fixed" },
            { value: "PERCENTAGE", label: "Percentage" },
            { value: "HOURLY", label: "Hourly" },
          ],
        },
        { key: "defaultValue", label: "Default", type: "number" },
        { key: "isTaxable", label: "Taxable", type: "boolean" },
        { key: "isMandatory", label: "Mandatory", type: "boolean" },
        { key: "isActive", label: "Active", type: "boolean" },
        { key: "displayOrder", label: "Order", type: "number" },
        { key: "description", label: "Description", type: "textarea", hideInList: true },
      ]}
      defaults={{ isActive: true, isTaxable: true, isMandatory: false, componentType: "EARNING", calculationType: "FIXED" }}
    />
  );
}
