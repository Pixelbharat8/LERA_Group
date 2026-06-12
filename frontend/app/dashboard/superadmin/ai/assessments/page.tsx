"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function AiAssessmentsAdminPage() {
  return (
    <AdminCrudPage
      title="🤖 AI Assessments"
      description="Auto-generated quizzes / placement tests produced by the AI gateway. Edit metadata or retire stale assessments here."
      endpoint="/api/ai/assessments"
      columns={[
        { key: "title", label: "Title", required: true },
        { key: "subject", label: "Subject" },
        { key: "level", label: "Level", placeholder: "B1 / B2 / C1" },
        { key: "type", label: "Type", placeholder: "PLACEMENT / DIAGNOSTIC / QUIZ" },
        { key: "status", label: "Status", type: "select", options: [
          { value: "DRAFT", label: "DRAFT" },
          { value: "PUBLISHED", label: "PUBLISHED" },
          { value: "ARCHIVED", label: "ARCHIVED" },
        ]},
        { key: "questions", label: "Questions (JSON)", type: "json", hideInList: true },
        { key: "metadata", label: "Metadata (JSON)", type: "json", hideInList: true },
      ]}
      defaults={{ status: "DRAFT" }}
    />
  );
}
