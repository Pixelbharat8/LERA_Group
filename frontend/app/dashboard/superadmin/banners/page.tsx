"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function BannersAdminPage() {
  return (
    <AdminCrudPage
      title="Banners"
      description="Hero banners shown on the public website and app shell."
      endpoint="/api/banners"
      searchableFields={["title", "titleVi", "position"]}
      columns={[
        { key: "title", label: "Title (EN)", required: true },
        { key: "titleVi", label: "Title (VI)" },
        { key: "imageUrl", label: "Image URL", required: true, placeholder: "https://..." },
        { key: "imageUrlMobile", label: "Mobile image URL", hideInList: true },
        { key: "linkUrl", label: "Link URL", hideInList: true },
        { key: "buttonText", label: "Button text", hideInList: true },
        { key: "buttonTextVi", label: "Button text (VI)", hideInList: true },
        {
          key: "position",
          label: "Position",
          type: "select",
          options: [
            { value: "homepage", label: "Homepage" },
            { value: "academy", label: "Academy" },
            { value: "events", label: "Events" },
            { value: "admissions", label: "Admissions" },
          ],
        },
        { key: "displayOrder", label: "Order", type: "number" },
        { key: "startDate", label: "Start", type: "date", hideInList: true },
        { key: "endDate", label: "End", type: "date", hideInList: true },
        { key: "isActive", label: "Active", type: "boolean" },
        { key: "subtitle", label: "Subtitle (EN)", type: "textarea", hideInList: true },
        { key: "subtitleVi", label: "Subtitle (VI)", type: "textarea", hideInList: true },
      ]}
      defaults={{ isActive: true, position: "homepage", displayOrder: 0 }}
    />
  );
}
