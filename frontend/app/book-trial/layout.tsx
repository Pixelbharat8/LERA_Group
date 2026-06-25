import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Free Trial",
  description: "Book a free English trial lesson at LERA Academy, Hải Phòng. We'll confirm your session and help find the right class.",
  alternates: { canonical: "/book-trial" },
  openGraph: { title: "Book a Free Trial | LERA Academy", description: "Book a free English trial lesson at LERA Academy, Hải Phòng. We'll confirm your session and help find the right class.", url: "https://lera.edu.vn/book-trial" },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
