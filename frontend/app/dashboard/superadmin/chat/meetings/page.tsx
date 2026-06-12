"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function ChatMeetingsAdminPage() {
  return (
    <AdminCrudPage
      title="📅 Parent-Teacher Meetings"
      description="Scheduled parent-teacher meetings (in-person, video, phone). Use this to reschedule, cancel or record outcomes."
      endpoint="/api/chat/meetings"
      columns={[
        { key: "teacherId", label: "Teacher", required: true, placeholder: "uuid" },
        { key: "parentId", label: "Parent", required: true, placeholder: "uuid" },
        { key: "studentId", label: "Student", placeholder: "uuid" },
        { key: "subject", label: "Subject" },
        { key: "scheduledAt", label: "When", type: "datetime", required: true },
        { key: "durationMinutes", label: "Duration (min)", type: "number" },
        { key: "meetingType", label: "Type", type: "select", options: [
          { value: "IN_PERSON", label: "In-person" },
          { value: "VIDEO_CALL", label: "Video call" },
          { value: "PHONE_CALL", label: "Phone call" },
        ]},
        { key: "meetingLink", label: "Link (video)", hideInList: true },
        { key: "location", label: "Location (in-person)", hideInList: true },
        { key: "status", label: "Status", type: "select", options: [
          { value: "PENDING", label: "PENDING" },
          { value: "CONFIRMED", label: "CONFIRMED" },
          { value: "CANCELLED", label: "CANCELLED" },
          { value: "COMPLETED", label: "COMPLETED" },
          { value: "NO_SHOW", label: "NO_SHOW" },
        ]},
        { key: "agenda", label: "Agenda", type: "textarea", hideInList: true },
        { key: "outcome", label: "Outcome", type: "textarea", hideInList: true },
        { key: "followUpRequired", label: "Follow-up?", type: "boolean" },
        { key: "followUpDate", label: "Follow-up date", type: "datetime", hideInList: true },
      ]}
      defaults={{ meetingType: "IN_PERSON", durationMinutes: 30, status: "PENDING" }}
    />
  );
}
