"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function BookCategoriesAdminPage() {
  return (
    <AdminCrudPage
      title="Book Categories"
      description="Library taxonomy. Optional parent for sub-categories."
      endpoint="/api/book-categories"
      searchableFields={["name", "nameVi"]}
      columns={[
        { key: "name", label: "Name (EN)", required: true },
        { key: "nameVi", label: "Name (VI)" },
        { key: "parentCategoryId", label: "Parent ID", hideInList: true },
        { key: "isActive", label: "Active", type: "boolean" },
        { key: "description", label: "Description", type: "textarea", hideInList: true },
      ]}
      defaults={{ isActive: true }}
    />
  );
}
