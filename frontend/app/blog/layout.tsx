import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "English learning tips, exam guidance and news from LERA Academy, Hải Phòng.",
  alternates: { canonical: "/blog" },
  openGraph: { title: "Blog | LERA Academy", description: "English learning tips, exam guidance and news from LERA Academy, Hải Phòng.", url: "https://lera.edu.vn/blog" },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
