import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Centre",
  description: "Visit LERA Academy at Vinhomes Marina, Hải Phòng — address, opening hours and contact details.",
  alternates: { canonical: "/centers" },
  openGraph: { title: "Our Centre | LERA Academy", description: "Visit LERA Academy at Vinhomes Marina, Hải Phòng — address, opening hours and contact details.", url: "https://lera.edu.vn/centers" },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
