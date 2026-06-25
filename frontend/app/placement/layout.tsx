import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Placement Test",
  description: "Take LERA Academy's quick English self-check for a suggested starting level, then book a free trial.",
  alternates: { canonical: "/placement" },
  openGraph: { title: "Free Placement Test | LERA Academy", description: "Take LERA Academy's quick English self-check for a suggested starting level, then book a free trial.", url: "https://lera.edu.vn/placement" },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
