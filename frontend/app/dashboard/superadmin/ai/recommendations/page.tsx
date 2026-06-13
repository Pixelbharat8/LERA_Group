"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function AiRecommendationsAdminPage() {
  return (
    <AdminCrudPage
      title="✨ AI Student Recommendations"
      description="Per-student suggestions surfaced by the AI gateway (next lesson, weak topic, study schedule)."
      endpoint="/api/ai/student-recommendations"
      columns={[
        { key: "studentId", label: "Student", required: true, placeholder: "uuid" },
        { key: "type", label: "Type", placeholder: "NEXT_LESSON / WEAK_TOPIC / SCHEDULE" },
        { key: "title", label: "Title" },
        { key: "body", label: "Body", type: "textarea", hideInList: true },
        { key: "score", label: "Score", type: "number" },
        { key: "status", label: "Status", type: "select", options: [
          { value: "PENDING", label: "PENDING" },
          { value: "SHOWN", label: "SHOWN" },
          { value: "ACCEPTED", label: "ACCEPTED" },
          { value: "DISMISSED", label: "DISMISSED" },
        ]},
        { key: "metadata", label: "Metadata (JSON)", type: "json", hideInList: true },
      ]}
      defaults={{ status: "PENDING" }}
    />
  );
}
