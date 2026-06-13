"use client";

import AdminCrudPage from "@/components/AdminCrudPage";

export default function ReferralsAdminPage() {
  return (
    <AdminCrudPage
      title="Referrals"
      description="Parent referral records. Convert via the row action once the referred family enrols."
      endpoint="/api/referrals"
      searchableFields={["referredEmail", "referredName", "status"]}
      columns={[
        { key: "referrerUserId", label: "Referrer", placeholder: "user uuid", hideInList: true },
        { key: "referredName", label: "Lead name" },
        { key: "referredEmail", label: "Email", required: true },
        { key: "referredPhone", label: "Phone", hideInList: true },
        {
          key: "status",
          label: "Status",
          type: "select",
          options: [
            { value: "PENDING",   label: "Pending" },
            { value: "CONTACTED", label: "Contacted" },
            { value: "CONVERTED", label: "Converted" },
            { value: "REJECTED",  label: "Rejected" },
            { value: "EXPIRED",   label: "Expired" },
          ],
        },
        { key: "rewardAmount", label: "Reward", type: "number" },
        {
          key: "rewardStatus",
          label: "Reward status",
          type: "select",
          options: [
            { value: "NONE",    label: "None" },
            { value: "PENDING", label: "Pending" },
            { value: "PAID",    label: "Paid" },
          ],
        },
        { key: "centerId", label: "Center ID", hideInList: true },
        { key: "studentId", label: "Student ID", hideInList: true },
        { key: "notes", label: "Notes", type: "textarea", hideInList: true },
      ]}
      defaults={{ status: "PENDING", rewardStatus: "NONE" }}
    />
  );
}
