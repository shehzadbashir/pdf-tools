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
}

/** Keeps the document title and the SEO/OG tags in sync with the current route. */
export function useHead(options: HeadOptions): void {
  const { title, fullTitle, description, robots, path } = options

  useEffect(() => {
    const resolved =
      fullTitle ??
      (title ? `${title} | ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`)
    const desc = description ?? SITE.description
    const url = path ? `${SITE.url.replace(/\/$/, '')}${path}` : SITE.url

    document.title = resolved
    setMeta('name', 'description', desc)
    setMeta('name', 'robots', robots ?? 'index, follow')
    setLink('canonical', path ? url : `${SITE.url.replace(/\/$/, '')}/`)
    setMeta('property', 'og:title', resolved)
    setMeta('property', 'og:description', desc)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:type', 'website')
    setMeta('name', 'twitter:title', resolved)
    setMeta('name', 'twitter:description', desc)
  }, [title, fullTitle, description, robots, path])
}
