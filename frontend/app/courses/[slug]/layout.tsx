import type { Metadata } from "next";

/**
 * Per-course SEO metadata. The course detail page is a client component, so this server layout
 * supplies a unique title/description/canonical per slug (otherwise every course inherited the
 * /courses section metadata + canonical). Keyed to the known course slugs; unknown (API-only)
 * slugs get a sensible generic fallback.
 */
const COURSE_SEO: Record<string, { title: string; description: string }> = {
  "lera-starters": {
    title: "LERA Starters — English for Ages 2.5–4",
    description: "Playful first English for ages 2.5–4 at LERA Academy, Hải Phòng — songs, games and native teachers in small classes.",
  },
  "lera-explorers": {
    title: "LERA Explorers — English for Young Learners",
    description: "Cambridge-aligned English for young learners at LERA Academy, Hải Phòng, with native teachers and small classes.",
  },
  "lera-primary": {
    title: "LERA Primary — Cambridge English for Primary",
    description: "Cambridge Primary English in Hải Phòng — structured curriculum, native and qualified teachers, small classes at LERA Academy.",
  },
  "lera-teens": {
    title: "LERA Teens — English for Teenagers",
    description: "English for teenagers in Hải Phòng — confidence, fluency and exam readiness with native teachers at LERA Academy.",
  },
  "ielts-sat": {
    title: "IELTS & SAT Preparation in Hải Phòng",
    description: "Targeted IELTS and SAT preparation at LERA Academy, Hải Phòng — experienced teachers, small classes and real score gains.",
  },
  "business-english": {
    title: "Business English in Hải Phòng",
    description: "Practical Business English for professionals and companies in Hải Phòng — communication, meetings and presentations at LERA Academy.",
  },
  "conversation": {
    title: "English Conversation Classes in Hải Phòng",
    description: "Speaking-focused English conversation classes with native teachers at LERA Academy, Hải Phòng — build real fluency.",
  },
  "phonics": {
    title: "Phonics — English Reading Foundations",
    description: "Phonics-based English reading foundations for young learners at LERA Academy, Hải Phòng, with native teachers.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const slug = params.slug;
  const seo = COURSE_SEO[slug] ?? {
    title: "English Course",
    description: "Cambridge-aligned English course at LERA Academy, Hải Phòng — native and qualified teachers in small classes.",
  };
  const canonical = `/courses/${slug}`;
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical },
    openGraph: {
      title: `${seo.title} | LERA Academy`,
      description: seo.description,
      url: `https://lera.edu.vn${canonical}`,
    },
  };
}

export default function CourseDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
