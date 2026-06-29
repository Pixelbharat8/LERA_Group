"use client";

import CmsPageEditor, { CmsField } from "@/components/cms/CmsPageEditor";

const FIELDS: CmsField[] = [
  { key: "title", label: "Page heading" },
  { key: "subtitle", label: "Subtitle", type: "textarea" },
  { key: "success_msg", label: "Success message", type: "textarea" },
];

export default function BookTrialEditorPage() {
  return (
    <CmsPageEditor
      category="book_trial"
      title="Book a trial page"
      description="Heading, subtitle and success copy for /book-trial"
      previewHref="/book-trial"
      fields={FIELDS}
    />
  );
}
