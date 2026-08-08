"use client";

/** Turn a pasted YouTube/Vimeo/mp4 URL into something embeddable. */
function toEmbed(url: string): { type: "iframe" | "video"; src: string } | null {
  const u = (url || "").trim();
  if (!u) return null;
  const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return { type: "iframe", src: `https://www.youtube.com/embed/${yt[1]}` };
  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { type: "iframe", src: `https://player.vimeo.com/video/${vm[1]}` };
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(u)) return { type: "video", src: u };
  if (/^https?:\/\//.test(u)) return { type: "iframe", src: u }; // already an embed URL
  return null;
}

/**
 * "See LERA in action" video block. Renders ONLY when a real video URL is provided
 * (CMS setting home_video_url) — no placeholder/fake video when empty. The academy
 * pastes a YouTube/Vimeo/mp4 link in Chairman → Website Content and it appears here.
 */
export default function VideoSection({
  url,
  title,
  subtitle,
}: {
  url?: string;
  title: string;
  subtitle?: string;
}) {
  const embed = url ? toEmbed(url) : null;
  if (!embed) return null;
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="reveal max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-lead">{subtitle}</p>}
        <div className="mt-8 rounded-2xl overflow-hidden shadow-lift aspect-video bg-brand-navy">
          {embed.type === "iframe" ? (
            <iframe
              src={embed.src}
              className="w-full h-full"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              title={title}
            />
          ) : (
            <video src={embed.src} controls playsInline preload="metadata" className="w-full h-full object-cover" />
          )}
        </div>
      </div>
    </section>
  );
}
