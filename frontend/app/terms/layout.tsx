import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms governing enrolment, payments, and use of LERA Academy's programmes and website.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Service | LERA Academy",
    description: "The terms governing enrolment, payments and use of LERA Academy's services.",
    url: "https://leraacademy.edu.vn/terms",
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
