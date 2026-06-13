"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function BookReservationsAdminPage() {
  return (
    <AdminCrudPage
      title="🔖 Book Reservations"
      description="Holds placed by users for currently-checked-out books. The earliest active reservation is auto-fulfilled when the copy is returned."
      endpoint="/api/book-reservations"
      columns={[
        { key: "bookId", label: "Book", required: true, placeholder: "uuid" },
        { key: "userId", label: "User", required: true, placeholder: "uuid" },
        { key: "centerId", label: "Center", placeholder: "uuid" },
        { key: "reservedAt", label: "Reserved at", type: "datetime" },
        { key: "expiresAt", label: "Expires at", type: "datetime" },
        { key: "status", label: "Status", type: "select", options: [
          { value: "ACTIVE", label: "ACTIVE" },
          { value: "FULFILLED", label: "FULFILLED" },
          { value: "EXPIRED", label: "EXPIRED" },
          { value: "CANCELLED", label: "CANCELLED" },
        ]},
        { key: "notes", label: "Notes", type: "textarea", hideInList: true },
      ]}
      defaults={{ status: "ACTIVE" }}
    />
  );
}
