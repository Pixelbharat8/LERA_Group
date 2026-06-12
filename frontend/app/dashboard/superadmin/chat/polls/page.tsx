"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function ChatPollsAdminPage() {
  return (
    <AdminCrudPage
      title="📊 Chat Polls"
      description="Polls posted in conversations / class groups. Use this to retire stale polls or to investigate misuse."
      endpoint="/api/chat/polls"
      columns={[
        { key: "question", label: "Question", required: true, type: "textarea" },
        { key: "conversationId", label: "Conversation", placeholder: "uuid" },
        { key: "createdBy", label: "Created by", placeholder: "uuid" },
        { key: "pollType", label: "Type", type: "select", options: [
          { value: "SINGLE", label: "SINGLE choice" },
          { value: "MULTIPLE", label: "MULTIPLE choice" },
          { value: "QUIZ", label: "QUIZ (correct answer)" },
        ]},
        { key: "isAnonymous", label: "Anonymous?", type: "boolean" },
        { key: "allowsMultiple", label: "Multi-vote?", type: "boolean" },
        { key: "isClosed", label: "Closed?", type: "boolean" },
        { key: "expiresAt", label: "Expires at", type: "datetime" },
        { key: "correctOption", label: "Correct option (quiz)", type: "number", hideInList: true },
      ]}
      defaults={{ pollType: "SINGLE", isAnonymous: false, isClosed: false }}
    />
  );
}
