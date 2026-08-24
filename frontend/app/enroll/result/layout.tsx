import type { Metadata } from "next";

// Post-payment confirmation page — transactional, must not be indexed or surfaced in search.
export const metadata: Metadata = {
  title: "Enrolment result",
  description: "Your LERA Academy enrolment and payment result.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/enroll/result" },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
