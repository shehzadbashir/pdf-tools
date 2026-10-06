import { useEffect } from 'react'
import { SITE } from '@/config/site'

function setMeta(attr: 'name' | 'property', key: string, content: string): void {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function setLink(rel: string, href: string): void {
  let tag = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!tag) {
    tag = document.createElement('link')
    tag.setAttribute('rel', rel)
    document.head.appendChild(tag)
  }
  tag.setAttribute('href', href)
}

export interface HeadOptions {
  title?: string
  /** Complete document title; bypasses the `| PDF Tools` suffixing. */
  fullTitle?: string
  description?: string
  /** Robots directive, e.g. `noindex, nofollow` for private pages. */
  robots?: string
  /** Path beginning with `/`, resolved against the configured site URL. */
  path?: string
  /** Site-relative social preview image, e.g. `'/og-image.png'`. */
  image?: string
  type?: 'website' | 'article'
  /** ISO date(s) used for `article:published_time` / `article:modified_time`. */
  publishedTime?: string
  updatedTime?: string
}

const SITE_URL = (): string => SITE.url.replace(/\/$/, '')

/** Keeps the document title and the SEO/OG tags in sync with the current route. */
export function useHead(options: HeadOptions): void {
  const { title, fullTitle, description, robots, path, image, type, publishedTime, updatedTime } =
    options

  useEffect(() => {
    const resolved =
      fullTitle ??
      (title ? `${title} | ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`)
    const desc = description ?? SITE.description
    const url = path ? `${SITE_URL()}${path}` : SITE.url
    const imageUrl = `${SITE_URL()}${image ?? '/og-image.png'}`
    const ogType = type ?? 'website'

    document.title = resolved
    setMeta('name', 'description', desc)
    setMeta('name', 'robots', robots ?? 'index, follow')
    setLink('canonical', path ? url : `${SITE_URL()}/`)
    setMeta('property', 'og:title', resolved)
    setMeta('property', 'og:description', desc)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:type', ogType)
    setMeta('property', 'og:site_name', SITE.name)
    setMeta('property', 'og:locale', 'en_US')
    setMeta('property', 'og:image', imageUrl)
    setMeta('property', 'og:image:width', '1200')
    setMeta('property', 'og:image:height', '630')
    setMeta('property', 'og:image:alt', SITE.name)
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', resolved)
    setMeta('name', 'twitter:description', desc)
    setMeta('name', 'twitter:image', imageUrl)
    setMeta('property', 'article:published_time', publishedTime ?? '')
    setMeta('property', 'article:modified_time', updatedTime ?? '')
  }, [title, fullTitle, description, robots, path, image, type, publishedTime, updatedTime])
}
