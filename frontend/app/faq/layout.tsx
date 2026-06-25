import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Answers to common questions about LERA Academy — courses, teachers, class sizes, trials and more.",
  alternates: { canonical: "/faq" },
  openGraph: { title: "FAQs | LERA Academy", description: "Answers to common questions about LERA Academy — courses, teachers, class sizes, trials and more.", url: "https://lera.edu.vn/faq" },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
