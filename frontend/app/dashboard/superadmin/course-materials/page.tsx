"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function CourseMaterialsAdminPage() {
  return (
    <AdminCrudPage
      title="Course Materials"
      description="PDFs, videos, slides and other artefacts attached to a lesson."
      endpoint="/api/course-materials"
      searchableFields={["materialName", "materialNameVi", "materialType"]}
      columns={[
        { key: "lessonId", label: "Lesson ID", required: true, hideInList: true },
        { key: "materialName", label: "Name (EN)", required: true },
        { key: "materialNameVi", label: "Name (VI)" },
        {
          key: "materialType",
          label: "Type",
          type: "select",
          options: [
            { value: "pdf", label: "PDF" },
            { value: "video", label: "Video" },
            { value: "audio", label: "Audio" },
            { value: "image", label: "Image" },
            { value: "link", label: "Link" },
            { value: "presentation", label: "Presentation" },
            { value: "pptx", label: "PowerPoint" },
            { value: "worksheet", label: "Worksheet" },
            { value: "document", label: "Document" },
          ],
        },
        { key: "fileUrl", label: "URL", placeholder: "https://..." },
        { key: "filePath", label: "File path", hideInList: true },
        { key: "fileSize", label: "Size (bytes)", type: "number", hideInList: true },
        { key: "mimeType", label: "MIME", hideInList: true },
        { key: "durationMinutes", label: "Duration (min)", type: "number", hideInList: true },
        { key: "displayOrder", label: "Order", type: "number" },
        { key: "isRequired", label: "Required", type: "boolean" },
        { key: "isDownloadable", label: "Downloadable", type: "boolean" },
        { key: "description", label: "Description (EN)", type: "textarea", hideInList: true },
        { key: "descriptionVi", label: "Description (VI)", type: "textarea", hideInList: true },
      ]}
      defaults={{ isRequired: false, isDownloadable: true, displayOrder: 0, materialType: "pdf" }}
    />
  );
}
