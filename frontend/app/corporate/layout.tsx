import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Corporate English Training",
  description: "Tailored Business English training for companies in Hải Phòng — on-site or at our centre, built around your team's goals. Request a proposal.",
  alternates: { canonical: "/corporate" },
  openGraph: { title: "Corporate English Training | LERA Academy", description: "Tailored Business English training for companies in Hải Phòng — on-site or at our centre, built around your team's goals. Request a proposal.", url: "https://lera.edu.vn/corporate" },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
