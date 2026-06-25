import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meet Our Teachers",
  description: "Meet LERA Academy's native and qualified English teachers in Hải Phòng — Cambridge/CELTA-trained, teaching small classes.",
  alternates: { canonical: "/teachers" },
  openGraph: { title: "Meet Our Teachers | LERA Academy", description: "Meet LERA Academy's native and qualified English teachers in Hải Phòng — Cambridge/CELTA-trained, teaching small classes.", url: "https://lera.edu.vn/teachers" },
};

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
