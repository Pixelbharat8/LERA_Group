import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tuition & Pricing",
  description: "Transparent monthly tuition for every LERA Academy English programme in Hải Phòng. No hidden fees — every course starts with a free trial.",
  alternates: { canonical: "/pricing" },
  openGraph: { title: "Tuition & Pricing | LERA Academy", description: "Transparent monthly tuition for every LERA Academy English programme in Hải Phòng. No hidden fees — every course starts with a free trial.", url: "https://lera.edu.vn/pricing" },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
