"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function CourseModulesAdminPage() {
  return (
    <AdminCrudPage
      title="Course Modules"
      description="Top-level units of a course. Lessons live inside modules."
      endpoint="/api/course-modules"
      searchableFields={["moduleName", "moduleNameVi"]}
      columns={[
        { key: "courseId", label: "Course ID", required: true, placeholder: "uuid", hideInList: true },
        { key: "moduleName", label: "Name (EN)", required: true },
        { key: "moduleNameVi", label: "Name (VI)" },
        { key: "sequence", label: "Order", type: "number" },
        { key: "durationWeeks", label: "Weeks", type: "number" },
        { key: "isRequired", label: "Required", type: "boolean" },
        { key: "description", label: "Description (EN)", type: "textarea", hideInList: true },
        { key: "descriptionVi", label: "Description (VI)", type: "textarea", hideInList: true },
      ]}
      defaults={{ isRequired: true, sequence: 1, durationWeeks: 4 }}
    />
  );
}
