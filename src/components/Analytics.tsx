import { useEffect, useRef, type ReactNode } from 'react'
import { SITE } from '@/config/site'

/** Injects the Cloudflare Web Analytics beacon when a token is configured. */
export function Analytics(): ReactNode {
  const injected = useRef(false)

  useEffect(() => {
    if (injected.current) return
    if (!SITE.cloudflareAnalyticsToken) return
    injected.current = true

    const script = document.createElement('script')
    script.defer = true
    script.src = 'https://static.cloudflareinsights.com/beacon.min.js'
    script.setAttribute(
      'data-cf-beacon',
      JSON.stringify({ token: SITE.cloudflareAnalyticsToken }),
    )
    document.head.appendChild(script)
  }, [])

  return null
}
