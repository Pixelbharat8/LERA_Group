import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How LERA Academy collects, uses and protects the personal data of students, parents and website visitors.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy | LERA Academy",
    description: "How LERA Academy collects, uses and protects personal data.",
    url: "https://leraacademy.edu.vn/privacy",
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
