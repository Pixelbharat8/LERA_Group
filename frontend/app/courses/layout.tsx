import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "English Courses & Programmes",
  description: "Cambridge-aligned English courses for ages 2.5 to adult at LERA Academy, Hải Phòng — Starters to IELTS, Business English and more.",
  alternates: { canonical: "/courses" },
  openGraph: { title: "English Courses & Programmes | LERA Academy", description: "Cambridge-aligned English courses for ages 2.5 to adult at LERA Academy, Hải Phòng — Starters to IELTS, Business English and more.", url: "https://lera.edu.vn/courses" },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
