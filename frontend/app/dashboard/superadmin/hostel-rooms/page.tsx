"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function HostelRoomsAdminPage() {
  return (
    <AdminCrudPage
      title="🏠 Hostel Rooms"
      description="Manage hostel rooms. These appear on the hostel page where students can view availability and register."
      endpoint="/api/hostel/rooms"
      columns={[
        { key: "roomNumber", label: "Room No.", required: true, placeholder: "A-101" },
        { key: "block", label: "Block", placeholder: "A" },
        { key: "floor", label: "Floor", type: "number" },
        { key: "type", label: "Type", type: "select", options: [
          { value: "Single", label: "Single" },
          { value: "Double", label: "Double" },
          { value: "Triple", label: "Triple" },
          { value: "Dormitory", label: "Dormitory" },
        ]},
        { key: "capacity", label: "Capacity", type: "number" },
        { key: "monthlyRent", label: "Monthly rent (VND)", type: "number" },
        { key: "status", label: "Status", type: "select", options: [
          { value: "AVAILABLE", label: "AVAILABLE" },
          { value: "FULL", label: "FULL" },
          { value: "MAINTENANCE", label: "MAINTENANCE" },
        ]},
        { key: "description", label: "Description", type: "textarea", hideInList: true },
      ]}
      defaults={{ status: "AVAILABLE", type: "Double", capacity: 2 }}
    />
  );
}
