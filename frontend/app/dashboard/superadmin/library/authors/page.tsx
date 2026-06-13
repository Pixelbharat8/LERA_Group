"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function AuthorsAdminPage() {
  return (
    <AdminCrudPage
      title="Authors"
      description="Authors referenced by books in the library catalogue."
      endpoint="/api/authors"
      searchableFields={["name", "nationality"]}
      columns={[
        { key: "name", label: "Name", required: true },
        { key: "nationality", label: "Nationality" },
        { key: "birthYear", label: "Born", type: "number" },
        { key: "website", label: "Website", placeholder: "https://...", hideInList: true },
        { key: "photoUrl", label: "Photo URL", hideInList: true },
        { key: "isActive", label: "Active", type: "boolean" },
        { key: "biography", label: "Biography", type: "textarea", hideInList: true },
      ]}
      defaults={{ isActive: true }}
    />
  );
}
