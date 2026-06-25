import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About LERA Academy",
  description: "A premium English centre in Vinhomes Marina, Hải Phòng — native and qualified teachers, small classes and a Cambridge-aligned curriculum.",
  alternates: { canonical: "/about" },
  openGraph: { title: "About LERA Academy | LERA Academy", description: "A premium English centre in Vinhomes Marina, Hải Phòng — native and qualified teachers, small classes and a Cambridge-aligned curriculum.", url: "https://lera.edu.vn/about" },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
