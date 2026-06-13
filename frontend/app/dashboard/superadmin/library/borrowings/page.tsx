"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function BookBorrowingsAdminPage() {
  return (
    <AdminCrudPage
      title="📖 Book Borrowings"
      description="Active and historical book loans. Mark a borrowing as returned to release the inventory copy."
      endpoint="/api/book-borrowings"
      columns={[
        { key: "bookId", label: "Book", required: true, placeholder: "uuid" },
        { key: "userId", label: "Borrower", required: true, placeholder: "uuid" },
        { key: "centerId", label: "Center", placeholder: "uuid" },
        { key: "borrowedAt", label: "Borrowed", type: "datetime" },
        { key: "dueDate", label: "Due", type: "date" },
        { key: "returnedAt", label: "Returned", type: "datetime" },
        { key: "status", label: "Status", type: "select", options: [
          { value: "BORROWED", label: "BORROWED" },
          { value: "RETURNED", label: "RETURNED" },
          { value: "OVERDUE", label: "OVERDUE" },
          { value: "LOST", label: "LOST" },
        ]},
        { key: "notes", label: "Notes", type: "textarea", hideInList: true },
      ]}
      defaults={{ status: "BORROWED" }}
    />
  );
}
