"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function ChatAiTutorAdminPage() {
  return (
    <AdminCrudPage
      title="🤖 AI Tutor Sessions"
      description="One-on-one AI tutoring sessions started from chat. Read-only audit so support can investigate cost spikes or quality issues."
      endpoint="/api/chat/ai-tutor"
      columns={[
        { key: "userId", label: "User", placeholder: "uuid" },
        { key: "subject", label: "Subject" },
        { key: "topic", label: "Topic" },
        { key: "messageCount", label: "Messages", type: "number" },
        { key: "totalTokens", label: "Tokens", type: "number" },
        { key: "totalCost", label: "Cost (USD)", type: "number" },
        { key: "rating", label: "Rating", type: "number" },
        { key: "feedback", label: "Feedback", type: "textarea", hideInList: true },
        { key: "createdAt", label: "Started", type: "datetime", readOnly: true, hideInForm: true },
      ]}
      canCreate={false}
      canEdit={false}
    />
  );
}
