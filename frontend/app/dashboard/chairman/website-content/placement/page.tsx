"use client";

import CmsPageEditor, { CmsField } from "@/components/cms/CmsPageEditor";

const FIELDS: CmsField[] = [
  { key: "title", label: "Page heading" },
  { key: "intro", label: "Intro text", type: "textarea" },
  { key: "result_heading", label: "Result — heading" },
  { key: "success_msg", label: "Success message", type: "textarea" },
];

export default function PlacementEditorPage() {
  return (
    <CmsPageEditor
      category="placement"
      title="Placement / Level-check page"
      description="Heading, intro and result copy for /placement"
      previewHref="/placement"
      fields={FIELDS}
    />
  );
}
