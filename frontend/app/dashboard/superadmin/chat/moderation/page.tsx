"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

/**
 * Moderation queue: messages flagged automatically (or by users) that need
 * review. Edit the row to mark as APPROVED / BLOCKED / FLAGGED, optionally
 * with reviewer notes.
 */
export default function ChatModerationAdminPage() {
  return (
    <AdminCrudPage
      title="🛡️ Chat Moderation Queue"
      description="Messages flagged by automatic filters or human reports. Review, then mark APPROVED / BLOCKED / FLAGGED."
      endpoint="/api/chat/moderation"
      columns={[
        { key: "messageId", label: "Message", placeholder: "uuid" },
        { key: "userId", label: "Author", placeholder: "uuid" },
        { key: "conversationId", label: "Conversation", placeholder: "uuid" },
        { key: "originalContent", label: "Content", type: "textarea" },
        { key: "violationType", label: "Violation", type: "select", options: [
          { value: "PROFANITY", label: "PROFANITY" },
          { value: "BULLYING", label: "BULLYING" },
          { value: "SPAM", label: "SPAM" },
          { value: "SENSITIVE_INFO", label: "SENSITIVE_INFO" },
          { value: "INAPPROPRIATE", label: "INAPPROPRIATE" },
        ]},
        { key: "severity", label: "Severity", type: "select", options: [
          { value: "LOW", label: "LOW" },
          { value: "MEDIUM", label: "MEDIUM" },
          { value: "HIGH", label: "HIGH" },
          { value: "CRITICAL", label: "CRITICAL" },
        ]},
        { key: "status", label: "Status", type: "select", options: [
          { value: "PENDING", label: "PENDING" },
          { value: "APPROVED", label: "APPROVED" },
          { value: "BLOCKED", label: "BLOCKED" },
          { value: "FLAGGED", label: "FLAGGED" },
          { value: "REVIEWED", label: "REVIEWED" },
        ]},
        { key: "actionTaken", label: "Action", placeholder: "WARNED / BLOCKED / DELETED / NONE" },
        { key: "reviewNotes", label: "Notes", type: "textarea", hideInList: true },
        { key: "isFalsePositive", label: "False +ve?", type: "boolean" },
        { key: "createdAt", label: "Flagged at", type: "datetime", readOnly: true, hideInForm: true },
      ]}
      defaults={{ status: "PENDING", severity: "MEDIUM" }}
      canCreate={false}
    />
  );
}
