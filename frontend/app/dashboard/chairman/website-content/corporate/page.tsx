"use client";

import CmsPageEditor, { CmsField } from "@/components/cms/CmsPageEditor";

const FIELDS: CmsField[] = [
  { key: "hero_badge", label: "Hero — badge" },
  { key: "hero_title", label: "Hero — title" },
  { key: "hero_subtitle", label: "Hero — subtitle", type: "textarea" },
  { key: "benefit1_title", label: "Benefit 1 — title" },
  { key: "benefit1_desc", label: "Benefit 1 — description", type: "textarea" },
  { key: "benefit2_title", label: "Benefit 2 — title" },
  { key: "benefit2_desc", label: "Benefit 2 — description", type: "textarea" },
  { key: "benefit3_title", label: "Benefit 3 — title" },
  { key: "benefit3_desc", label: "Benefit 3 — description", type: "textarea" },
  { key: "benefit4_title", label: "Benefit 4 — title" },
  { key: "benefit4_desc", label: "Benefit 4 — description", type: "textarea" },
  { key: "form_title", label: "Inquiry form — heading" },
  { key: "form_subtitle", label: "Inquiry form — subtitle", type: "textarea" },
  { key: "success_msg", label: "Success message", type: "textarea" },
];

export default function CorporateEditorPage() {
  return (
    <CmsPageEditor
      category="corporate"
      title="Corporate page"
      description="Hero, benefits and inquiry-form copy for /corporate"
      previewHref="/corporate"
      fields={FIELDS}
    />
  );
}
