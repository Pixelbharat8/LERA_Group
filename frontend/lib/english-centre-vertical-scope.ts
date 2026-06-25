/**
 * English-centre execution slice: placement/diagnostic + trial lesson booking.
 * Keeps CRM, public marketing, and academy skill data on one scoped path for incremental delivery.
 */
export const ENGLISH_CENTRE_VERTICAL_SLICE_ID = "placement_trial_booking" as const;

/** UTM + notes conventions for public lead capture (trial / placement funnel). */
export const TRIAL_BOOKING_LEAD_CONTEXT = {
  utmSource: "website",
  utmMedium: "trial_booking",
  utmCampaign: ENGLISH_CENTRE_VERTICAL_SLICE_ID,
} as const;

/** UTM for the self-service placement quiz on `/placement` (distinct medium for CRM filters). */
export const PLACEMENT_QUIZ_LEAD_CONTEXT = {
  utmSource: "website",
  utmMedium: "placement_quiz",
  utmCampaign: "english_placement",
} as const;

/** UTM for corporate / B2B training enquiries on `/corporate` (distinct medium for CRM filters). */
export const CORPORATE_LEAD_CONTEXT = {
  utmSource: "website",
  utmMedium: "corporate_training",
  utmCampaign: "corporate_inquiry",
} as const;

/** UTM for online course enrolment requests on `/enroll` — the highest-intent web funnel. */
export const ENROLMENT_LEAD_CONTEXT = {
  utmSource: "website",
  utmMedium: "online_enrolment",
  utmCampaign: "course_enrolment",
} as const;

export const FUNNEL_NOTES_PREFIX = "[Trial / placement funnel]";

/** Product backlog from the English-centre audit (not in the placement+trial vertical slice). */
export const ENGLISH_CENTRE_BACKLOG = [
  { id: "reporting_pack", label: "Centre reporting pack (retention, attendance, revenue, utilization)" },
  { id: "certificates", label: "Certificate generation (course completion / level) + optional parent notify" },
  { id: "social_media", label: "Social media service: Meta/TikTok scheduling and analytics" },
  { id: "transactional_email", label: "Transactional email: receipts, class reminders, beyond password reset" },
] as const;

/** Backend services and frontend surfaces this slice depends on (relative /api rewrites). */
export const PLACEMENT_TRIAL_TOUCHPOINTS = {
  services: ["identity_service", "academy_service", "connect_service"],
  apiPrefixes: ["/api/public/leads", "/api/leads", "/api/students", "/api/student-skill-levels"],
  dashboardRoutes: ["/dashboard/crm/leads", "/dashboard/academy/students"],
  publicRoutes: ["/", "/courses", "/book-trial", "/placement"],
} as const;
