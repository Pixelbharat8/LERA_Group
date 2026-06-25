import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with LERA Academy in Vinhomes Marina, Hải Phòng — call, Zalo, or book a free trial lesson.",
  alternates: { canonical: "/contact" },
  openGraph: { title: "Contact Us | LERA Academy", description: "Get in touch with LERA Academy in Vinhomes Marina, Hải Phòng — call, Zalo, or book a free trial lesson.", url: "https://lera.edu.vn/contact" },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
