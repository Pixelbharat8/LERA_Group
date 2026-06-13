/**
 * Trim unused product surfaces for smaller centres (English-first deployments).
 * Set e.g. NEXT_PUBLIC_LERA_HIDE_PARENT_LINKS=/resources,/communication,/connect
 * (substring match on href).
 */
export function isParentDashboardLinkHidden(href: string): boolean {
  const raw = process.env.NEXT_PUBLIC_LERA_HIDE_PARENT_LINKS;
  if (!raw?.trim()) return false;
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return parts.some((p) => href.includes(p));
}

/** Primary parent tasks surfaced first on small screens (order preserved after filtering). */
export const PARENT_PRIMARY_HREFS = [
  "/dashboard/parent/schedule",
  "/dashboard/parent/payments",
  "/dashboard/parent/messages",
  "/dashboard/parent/attendance",
  "/dashboard/parent/children",
] as const;
