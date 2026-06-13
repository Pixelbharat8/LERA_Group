"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function LibraryInventoryAdminPage() {
  return (
    <AdminCrudPage
      title="📚 Library Inventory"
      description="Per-center physical / digital copies of each book. Use this to track holdings, condition and current location."
      endpoint="/api/library-inventory"
      columns={[
        { key: "bookId", label: "Book", required: true, placeholder: "uuid" },
        { key: "centerId", label: "Center", placeholder: "uuid" },
        { key: "totalCopies", label: "Total copies", type: "number" },
        { key: "availableCopies", label: "Available", type: "number" },
        { key: "borrowedCopies", label: "Borrowed", type: "number" },
        { key: "reservedCopies", label: "Reserved", type: "number" },
        { key: "shelfLocation", label: "Shelf", placeholder: "A-12-3" },
        { key: "condition", label: "Condition", type: "select", options: [
          { value: "NEW", label: "NEW" },
          { value: "GOOD", label: "GOOD" },
          { value: "WORN", label: "WORN" },
          { value: "DAMAGED", label: "DAMAGED" },
          { value: "LOST", label: "LOST" },
        ]},
        { key: "notes", label: "Notes", type: "textarea", hideInList: true },
      ]}
      defaults={{ condition: "GOOD", totalCopies: 1, availableCopies: 1 }}
    />
  );
}
