import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scholarships",
  description: "LERA Academy scholarships — up to 50% off tuition for qualifying students, free placement test and priority enrolment into small Cambridge-aligned classes.",
  alternates: { canonical: "/scholarships" },
  openGraph: {
    title: "Scholarships | LERA Academy",
    description: "Up to 50% off tuition for qualifying students, free placement test and priority enrolment into small Cambridge-aligned classes.",
    url: "https://leraacademy.edu.vn/scholarships",
  },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
