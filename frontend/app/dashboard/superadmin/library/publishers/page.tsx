"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function PublishersAdminPage() {
  return (
    <AdminCrudPage
      title="Publishers"
      description="Publishing houses referenced by library books."
      endpoint="/api/publishers"
      searchableFields={["name", "country"]}
      columns={[
        { key: "name", label: "Name", required: true },
        { key: "country", label: "Country" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email" },
        { key: "website", label: "Website", placeholder: "https://...", hideInList: true },
        { key: "address", label: "Address", hideInList: true },
        { key: "isActive", label: "Active", type: "boolean" },
      ]}
      defaults={{ isActive: true }}
    />
  );
}
