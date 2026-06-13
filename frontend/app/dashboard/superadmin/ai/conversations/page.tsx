"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function AiConversationsAdminPage() {
  return (
    <AdminCrudPage
      title="💬 AI Conversations"
      description="Read-only audit of AI tutor / chatbot conversations. Use this to investigate poor responses, cost spikes or policy violations."
      endpoint="/api/ai/conversations"
      columns={[
        { key: "userId", label: "User", placeholder: "uuid" },
        { key: "model", label: "Model", placeholder: "gpt-4o / claude-3" },
        { key: "title", label: "Title" },
        { key: "messageCount", label: "Messages", type: "number" },
        { key: "totalTokens", label: "Tokens", type: "number" },
        { key: "totalCost", label: "Cost (USD)", type: "number" },
        { key: "createdAt", label: "Started", type: "datetime", readOnly: true, hideInForm: true },
      ]}
      canCreate={false}
      canEdit={false}
    />
  );
}
