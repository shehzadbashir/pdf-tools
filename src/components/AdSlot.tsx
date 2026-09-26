import { useEffect, useRef, type ReactNode } from 'react'
import { SITE } from '@/config/site'

interface AdSlotProps {
  /** Descriptive label shown while the slot is empty or ads are disabled. */
  label: string
  /** Page-level adsense format, e.g. 'horizontal' or 'rectangle'. */
  format?: 'auto' | 'horizontal' | 'rectangle' | 'vertical'
  className?: string
}

const CONFIGURED = () => SITE.adsenseClient.startsWith('ca-pub-')

let scriptInjected = false

function injectAdsenseScript(): void {
  if (scriptInjected || !CONFIGURED()) return
  scriptInjected = true
  const src =
    'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + SITE.adsenseClient
  if (document.querySelector('script[src*="adsbygoogle.js"]')) return
  const script = document.createElement('script')
  script.async = true
  script.src = src
  script.crossOrigin = 'anonymous'
  document.head.appendChild(script)
}

/**
 * Reserved advertising slot. Renders nothing but a labelled placeholder until a
 * real AdSense client id is configured in `src/config/site.ts`.
 */
export function AdSlot({ label, format = 'auto', className = '' }: AdSlotProps): ReactNode {
  const ref = useRef<HTMLModElement>(null)
  const configured = CONFIGURED()

  useEffect(() => {
    if (!configured || !ref.current) return
    injectAdsenseScript()
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).adsbygoogle = (window as any).adsbygoogle || []
      ;(window as any).adsbygoogle.push({})
    } catch {
      /* blocked or not ready */
    }
  }, [configured])

  if (!configured) {
    return (
      <div
        className={`flex min-h-20 items-center justify-center rounded-xl border border-dashed border-[var(--line)] text-center text-[0.7rem] font-semibold uppercase tracking-widest text-[var(--ink-2)]/60 ${className}`}
      >
        {label}
      </div>
    )
  }

  return (
    <div className={`overflow-hidden rounded-xl ${className}`}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={SITE.adsenseClient}
        data-ad-slot=""
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}
