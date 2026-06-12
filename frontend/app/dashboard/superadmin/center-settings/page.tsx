"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function CenterSettingsAdminPage() {
  return (
    <AdminCrudPage
      title="Center Settings"
      description="Per-center configuration overrides (class size caps, booking windows, reminder toggles, etc.)."
      endpoint="/api/center-settings"
      searchableFields={["settingKey", "settingCategory"]}
      columns={[
        { key: "centerId", label: "Center ID", required: true, hideInList: true },
        { key: "settingKey", label: "Key", required: true, placeholder: "MAX_CLASS_SIZE" },
        {
          key: "settingType",
          label: "Type",
          type: "select",
          options: [
            { value: "STRING",  label: "String" },
            { value: "NUMBER",  label: "Number" },
            { value: "BOOLEAN", label: "Boolean" },
            { value: "JSON",    label: "JSON" },
          ],
        },
        {
          key: "settingCategory",
          label: "Category",
          type: "select",
          options: [
            { value: "GENERAL",      label: "General" },
            { value: "ENROLLMENT",   label: "Enrollment" },
            { value: "ATTENDANCE",   label: "Attendance" },
            { value: "PAYMENT",      label: "Payment" },
            { value: "NOTIFICATION", label: "Notification" },
          ],
        },
        { key: "settingValue", label: "Value", type: "textarea" },
        { key: "isEditable", label: "Editable", type: "boolean" },
        { key: "isPublic", label: "Public", type: "boolean" },
        { key: "displayOrder", label: "Order", type: "number", hideInList: true },
        { key: "description", label: "Description", type: "textarea", hideInList: true },
        { key: "validationRules", label: "Validation (JSON)", type: "json", hideInList: true },
      ]}
      defaults={{ settingType: "STRING", settingCategory: "GENERAL", isEditable: true, isPublic: false }}
    />
  );
}
