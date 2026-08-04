/**
 * Sleek hero depth — two slow, low-opacity aurora glows behind the hero content.
 * Drop it as the first child of a `relative overflow-hidden` hero section whose
 * content sits at `z-10`. Purely decorative; motion respects prefers-reduced-motion.
 */
export default function HeroAura() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className="aurora-glow -top-24 -left-20 w-[30rem] h-[30rem]"
        style={{ background: "radial-gradient(circle, rgba(96,165,250,0.28), transparent 70%)" }}
      />
      <div
        className="aurora-glow -bottom-24 -right-16 w-[34rem] h-[34rem]"
        style={{ background: "radial-gradient(circle, rgba(245,158,11,0.16), transparent 70%)", animationDelay: "7s" }}
      />
    </div>
  );
}
