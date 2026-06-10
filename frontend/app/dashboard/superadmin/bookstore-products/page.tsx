"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function BookstoreProductsAdminPage() {
  return (
    <AdminCrudPage
      title="📚 Bookstore Products"
      description="Manage the bookstore catalogue — course books, stationery, uniforms. These appear on the student/parent bookstore page."
      endpoint="/api/bookstore/products"
      columns={[
        { key: "name", label: "Name", required: true },
        { key: "category", label: "Category", placeholder: "Course Books / Stationery / Uniform" },
        { key: "price", label: "Price (VND)", type: "number" },
        { key: "stock", label: "Stock", type: "number" },
        { key: "image", label: "Image URL", hideInList: true, placeholder: "/images/..." },
        { key: "description", label: "Description", type: "textarea", hideInList: true },
        { key: "active", label: "Active?", type: "boolean" },
      ]}
      defaults={{ active: true, stock: 0, category: "Course Books" }}
    />
  );
}
