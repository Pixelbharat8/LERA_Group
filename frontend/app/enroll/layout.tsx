import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Enrol Online",
  description: "Enrol your child in a LERA Academy English programme in Hải Phòng. Reserve a place online — we confirm availability and send payment details.",
  alternates: { canonical: "/enroll" },
  openGraph: { title: "Enrol Online | LERA Academy", description: "Reserve a place in a LERA Academy English programme — we confirm availability and send payment details.", url: "https://lera.edu.vn/enroll" },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
