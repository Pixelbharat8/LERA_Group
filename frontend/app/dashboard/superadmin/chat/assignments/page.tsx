"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function ChatSharedAssignmentsAdminPage() {
  return (
    <AdminCrudPage
      title="📝 Shared Assignments (Chat)"
      description="Assignments posted in class group chats. Manage publication, late-submission policy and notifications from here."
      endpoint="/api/chat/assignments"
      columns={[
        { key: "title", label: "Title", required: true },
        { key: "assignmentType", label: "Type", type: "select", options: [
          { value: "HOMEWORK", label: "HOMEWORK" },
          { value: "CLASSWORK", label: "CLASSWORK" },
          { value: "PROJECT", label: "PROJECT" },
          { value: "EXAM", label: "EXAM" },
          { value: "QUIZ", label: "QUIZ" },
        ]},
        { key: "subject", label: "Subject" },
        { key: "classId", label: "Class", placeholder: "uuid" },
        { key: "conversationId", label: "Conversation", placeholder: "uuid" },
        { key: "sharedById", label: "Shared by", placeholder: "uuid" },
        { key: "dueDate", label: "Due", type: "datetime" },
        { key: "maxScore", label: "Max score", type: "number" },
        { key: "allowLateSubmission", label: "Allow late?", type: "boolean" },
        { key: "latePenaltyPercent", label: "Late penalty (%)", type: "number", hideInList: true },
        { key: "isPublished", label: "Published?", type: "boolean" },
        { key: "notifyParents", label: "Notify parents?", type: "boolean" },
        { key: "description", label: "Description", type: "textarea", hideInList: true },
        { key: "instructions", label: "Instructions", type: "textarea", hideInList: true },
        { key: "attachmentUrls", label: "Attachments (JSON)", type: "json", hideInList: true },
      ]}
      defaults={{ assignmentType: "HOMEWORK", isPublished: true, notifyParents: true, allowLateSubmission: false }}
    />
  );
}
