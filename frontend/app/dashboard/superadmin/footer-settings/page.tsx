"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function FooterSettingsAdminPage() {
  return (
    <AdminCrudPage
      title="Footer Settings"
      description="Per-section, per-language key/value entries used to render the public site footer."
      endpoint="/api/footer-settings"
      searchableFields={["settingKey", "section", "settingValue"]}
      columns={[
        { key: "settingKey", label: "Key", required: true, placeholder: "copyright_text" },
        {
          key: "section",
          label: "Section",
          type: "select",
          options: [
            { value: "copyright", label: "Copyright" },
            { value: "description", label: "Description" },
            { value: "contact", label: "Contact" },
            { value: "social", label: "Social" },
            { value: "column_1", label: "Column 1" },
            { value: "column_2", label: "Column 2" },
            { value: "column_3", label: "Column 3" },
            { value: "column_4", label: "Column 4" },
          ],
        },
        {
          key: "language",
          label: "Lang",
          type: "select",
          options: [
            { value: "en", label: "English" },
            { value: "vi", label: "Tiếng Việt" },
          ],
        },
        { key: "settingValue", label: "Value", type: "textarea" },
        { key: "displayOrder", label: "Order", type: "number" },
        { key: "isActive", label: "Active", type: "boolean" },
      ]}
      defaults={{ language: "en", section: "copyright", displayOrder: 0, isActive: true }}
    />
  );
}
