"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function CourseLessonsAdminPage() {
  return (
    <AdminCrudPage
      title="Course Lessons"
      description="Individual lessons inside a module."
      endpoint="/api/course-lessons"
      searchableFields={["lessonName", "lessonNameVi"]}
      columns={[
        { key: "moduleId", label: "Module ID", required: true, hideInList: true },
        { key: "lessonName", label: "Name (EN)", required: true },
        { key: "lessonNameVi", label: "Name (VI)" },
        {
          key: "lessonType",
          label: "Type",
          type: "select",
          options: [
            { value: "lecture", label: "Lecture" },
            { value: "practice", label: "Practice" },
            { value: "quiz", label: "Quiz" },
            { value: "project", label: "Project" },
          ],
        },
        { key: "sequence", label: "Order", type: "number" },
        { key: "durationMinutes", label: "Minutes", type: "number" },
        { key: "isPublished", label: "Published", type: "boolean" },
        { key: "objectives", label: "Objectives", type: "textarea", hideInList: true },
        { key: "content", label: "Content", type: "textarea", hideInList: true },
        { key: "description", label: "Description (EN)", type: "textarea", hideInList: true },
        { key: "descriptionVi", label: "Description (VI)", type: "textarea", hideInList: true },
      ]}
      defaults={{ isPublished: false, sequence: 1, durationMinutes: 90, lessonType: "lecture" }}
    />
  );
}
