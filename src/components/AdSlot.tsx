import { useEffect, useRef, type ReactNode } from 'react'
import { SITE } from '@/config/site'

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

type SlotName = keyof typeof SITE.adsenseSlots

interface AdSlotProps {
  /** Descriptive label for the reserved space / placeholder. */
  label: string
  /** Which configured ad unit to render (`SITE.adsenseSlots`). */
  slot?: SlotName
  /** Page-level adsense format, e.g. 'horizontal' or 'rectangle'. */
  format?: 'auto' | 'horizontal' | 'rectangle' | 'vertical'
  className?: string
}

const CONFIGURED = (): boolean => SITE.adsenseClient.startsWith('ca-pub-')

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
 * Reserved advertising slot.
 *
 * As soon as a real ad unit ID is pasted into `SITE.adsenseSlots` in
 * `src/config/site.ts`, the unit renders and starts filling. While the unit id
 * is empty (awaiting AdSense approval / unit creation) the slot keeps its
 * layout as a labelled placeholder so pages never mis-render a slot-less ad.
 */
export function AdSlot({ label, slot = 'horizontal', format = 'auto', className = '' }: AdSlotProps): ReactNode {
  const ref = useRef<HTMLModElement>(null)
  const slotId = SITE.adsenseSlots[slot]
  const ready = CONFIGURED() && Boolean(slotId)

  useEffect(() => {
    if (!ready || !ref.current) return
    injectAdsenseScript()
    try {
      window.adsbygoogle = window.adsbygoogle || []
      window.adsbygoogle.push({})
    } catch {
      /* blocked or not ready yet */
    }
  }, [ready, slotId])

  if (!ready) {
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
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}
