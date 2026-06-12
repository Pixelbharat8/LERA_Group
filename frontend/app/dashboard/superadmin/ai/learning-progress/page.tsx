"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function AiLearningProgressAdminPage() {
  return (
    <AdminCrudPage
      title="📈 AI Learning Progress"
      description="Per-student progress snapshots written by the AI gateway when a path step is completed. Used by analytics dashboards."
      endpoint="/api/ai-learning-progress"
      columns={[
        { key: "studentId", label: "Student", required: true, placeholder: "uuid" },
        { key: "pathId", label: "Path", placeholder: "uuid" },
        { key: "stepId", label: "Step", placeholder: "uuid" },
        { key: "status", label: "Status", type: "select", options: [
          { value: "NOT_STARTED", label: "NOT_STARTED" },
          { value: "IN_PROGRESS", label: "IN_PROGRESS" },
          { value: "COMPLETED", label: "COMPLETED" },
        ]},
        { key: "score", label: "Score", type: "number" },
        { key: "completedAt", label: "Completed at", type: "datetime" },
        { key: "metadata", label: "Metadata (JSON)", type: "json", hideInList: true },
      ]}
      canDelete={false}
    />
  );
}
