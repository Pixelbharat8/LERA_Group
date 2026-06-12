"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function CampaignLeadsAdminPage() {
  return (
    <AdminCrudPage
      title="📣 Campaign Leads"
      description="Maps marketing-campaign IDs to the leads they generated. Used for campaign-ROI reporting."
      endpoint="/api/campaign-leads"
      columns={[
        { key: "campaignId", label: "Campaign", required: true, placeholder: "uuid" },
        { key: "leadId", label: "Lead", required: true, placeholder: "uuid" },
        { key: "source", label: "Source", placeholder: "FACEBOOK / GOOGLE / REFERRAL" },
        { key: "addedAt", label: "Added at", type: "datetime", readOnly: true, hideInForm: true },
        { key: "notes", label: "Notes", type: "textarea", hideInList: true },
      ]}
    />
  );
}
