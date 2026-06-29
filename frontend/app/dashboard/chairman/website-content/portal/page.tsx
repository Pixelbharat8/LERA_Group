"use client";

import CmsPageEditor, { CmsField } from "@/components/cms/CmsPageEditor";

const FIELDS: CmsField[] = [
  { key: "hero_badge", label: "Hero — badge" },
  { key: "hero_title", label: "Hero — title" },
  { key: "hero_subtitle", label: "Hero — subtitle", type: "textarea" },
  { key: "parents_eyebrow", label: "Parents section — eyebrow" },
  { key: "parents_heading", label: "Parents section — heading" },
  { key: "students_eyebrow", label: "Students section — eyebrow" },
  { key: "students_heading", label: "Students section — heading" },
  { key: "cta_heading", label: "Bottom CTA — heading" },
  { key: "cta_subtitle", label: "Bottom CTA — subtitle", type: "textarea" },
];

export default function PortalEditorPage() {
  return (
    <CmsPageEditor
      category="portal"
      title="Portal page"
      description="Hero, section headings and CTA copy for /portal"
      previewHref="/portal"
      fields={FIELDS}
    />
  );
}
