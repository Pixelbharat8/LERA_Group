"use client";

import CmsPageEditor, { CmsField } from "@/components/cms/CmsPageEditor";

const FIELDS: CmsField[] = [
  { key: "hero_title", label: "Hero — title" },
  { key: "hero_subtitle", label: "Hero — subtitle", type: "textarea" },
  { key: "confirm_heading", label: "Confirmation — heading" },
  { key: "confirm_message", label: "Confirmation — message", type: "textarea" },
];

export default function EnrollEditorPage() {
  return (
    <CmsPageEditor
      category="enroll"
      title="Enrol page"
      description="Hero and confirmation copy for /enroll (the course list stays live from the catalogue)"
      previewHref="/enroll"
      fields={FIELDS}
    />
  );
}
