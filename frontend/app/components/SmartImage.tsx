'use client'

import Image from 'next/image'

// Local (/...) paths and Unsplash URLs are safe to run through next/image (the
// latter is whitelisted in next.config). Anything else — e.g. an arbitrary
// external URL a Chairman pastes into the CMS — falls back to a plain <img>, so
// the public site never crashes on an un-whitelisted host.
function canOptimize(src?: string): src is string {
  return !!src && (src.startsWith('/') || src.startsWith('https://images.unsplash.com/'))
}

type Common = {
  src: string
  alt: string
  className?: string
  sizes?: string
  priority?: boolean
}

type Props = Common &
  (
    | { fill: true; width?: never; height?: never }
    | { fill?: false; width: number; height: number }
  )

/**
 * next/image with a safe fallback. Use `fill` inside a positioned, sized parent
 * (like the plain <img> it replaces), or pass `width`/`height` for fixed sizes.
 */
export default function SmartImage(props: Props) {
  const { src, alt, className, sizes, priority } = props

  if (canOptimize(src)) {
    if (props.fill) {
      return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} />
    }
    return (
      <Image
        src={src}
        alt={alt}
        width={props.width}
        height={props.height}
        sizes={sizes}
        priority={priority}
        className={className}
      />
    )
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      {...(priority ? { fetchPriority: 'high' as const } : {})}
    />
  )
}
