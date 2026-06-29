"use client";

import SocialMediaManager from "@/components/marketing/SocialMediaManager";

// Chairman view of the social-media control. The same component is reused by the
// permission-gated route at /dashboard/marketing/social-media for delegated users.
export default function ChairmanSocialMediaPage() {
  return <SocialMediaManager backHref="/dashboard/chairman/marketing" />;
}
