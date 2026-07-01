"use client";

import CmsPageEditor, { CmsField } from "@/components/cms/CmsPageEditor";

const FIELDS: CmsField[] = [
  { key: "eyebrow", label: "Hero — eyebrow" },
  { key: "title", label: "Hero — title" },
  { key: "subtitle", label: "Hero — subtitle", type: "textarea" },
  { key: "cta_label", label: "Primary button label" },
  { key: "cta_secondary", label: "Secondary button label" },
  { key: "benefits_title", label: "Benefits — heading" },
  { key: "benefit1", label: "Benefit 1" },
  { key: "benefit2", label: "Benefit 2" },
  { key: "benefit3", label: "Benefit 3" },
  { key: "eligibility_title", label: "Eligibility — heading" },
  { key: "eligibility", label: "Eligibility — text", type: "textarea" },
  { key: "how_title", label: "How to apply — heading" },
  { key: "step1", label: "Step 1" },
  { key: "step2", label: "Step 2" },
  { key: "step3", label: "Step 3" },
  { key: "footer_cta_title", label: "Closing CTA — title" },
  { key: "footer_cta_desc", label: "Closing CTA — description", type: "textarea" },
];

export default function ScholarshipsEditorPage() {
  return (
    <CmsPageEditor
      category="scholarships"
      title="Scholarships page"
      description="All copy for the public /scholarships page (the 'Scholarship this month' CTA lands here)"
      previewHref="/scholarships"
      fields={FIELDS}
    />
  );
}
