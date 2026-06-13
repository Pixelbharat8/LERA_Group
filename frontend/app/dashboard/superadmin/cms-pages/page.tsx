"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function CmsPagesAdminPage() {
  return (
    <AdminCrudPage
      title="CMS Pages"
      description="Bilingual static pages (Privacy, Terms, About, etc.). Slug must be URL-safe."
      endpoint="/api/cms-pages"
      searchableFields={["slug", "titleEn", "titleVi"]}
      columns={[
        { key: "slug", label: "Slug", required: true, placeholder: "privacy-policy" },
        { key: "titleEn", label: "Title (EN)", required: true },
        { key: "titleVi", label: "Title (VI)" },
        { key: "isPublished", label: "Published", type: "boolean" },
        { key: "publishDate", label: "Publish at", type: "datetime" },
        { key: "metaTitle", label: "Meta title", hideInList: true },
        { key: "metaDescription", label: "Meta description", type: "textarea", hideInList: true },
        { key: "featuredImage", label: "Featured image URL", hideInList: true },
        { key: "contentEn", label: "Content (EN)", type: "textarea", hideInList: true },
        { key: "contentVi", label: "Content (VI)", type: "textarea", hideInList: true },
      ]}
      defaults={{ isPublished: false }}
    />
  );
}
