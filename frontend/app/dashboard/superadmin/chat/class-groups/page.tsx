"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function ChatClassGroupsAdminPage() {
  return (
    <AdminCrudPage
      title="🏫 Class Group Chats"
      description="Each class can have its own chat group with parents and/or students. Configure who is auto-added when a new student joins."
      endpoint="/api/chat/class-groups"
      columns={[
        { key: "classId", label: "Class", required: true, placeholder: "uuid" },
        { key: "groupId", label: "Group", placeholder: "uuid" },
        { key: "className", label: "Class name" },
        { key: "gradeLevel", label: "Grade" },
        { key: "section", label: "Section" },
        { key: "academicYear", label: "Year", placeholder: "2026-2027" },
        { key: "groupType", label: "Type", type: "select", options: [
          { value: "CLASS", label: "CLASS" },
          { value: "SUBJECT", label: "SUBJECT" },
          { value: "ACTIVITY", label: "ACTIVITY" },
        ]},
        { key: "includeParents", label: "Parents?", type: "boolean" },
        { key: "includeStudents", label: "Students?", type: "boolean" },
        { key: "autoSyncMembers", label: "Auto-sync new members?", type: "boolean" },
        { key: "isActive", label: "Active?", type: "boolean" },
      ]}
      defaults={{ groupType: "CLASS", includeParents: true, includeStudents: true, autoSyncMembers: true, isActive: true }}
    />
  );
}
