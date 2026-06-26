import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Parent & Student Portal",
  description: "Every LERA Academy family gets a secure online portal — track progress, attendance, schedule and payments, and message teachers any time.",
  alternates: { canonical: "/portal" },
  openGraph: { title: "Parent & Student Portal | LERA Academy", description: "Track progress, attendance, schedule and payments, and message teachers any time.", url: "https://lera.edu.vn/portal" },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
