/**
 * Single source of truth for site-wide settings.
 *
 * ── CHANGE THESE BEFORE DEPLOYING ───────────────────────────────────────────
 * `url` must be your real domain (no trailing slash).
 * Leave the ad / analytics ids as-is (or empty) until you have real ones —
 * components stay hidden automatically when the id is a placeholder.
 */
export const SITE = {
  name: 'PDF Tools',
  url: 'https://shehzadbashir.xyz',
  tagline: 'Free online PDF toolkit',
  homeTitle: 'PDF Tools — Merge, Compress, Convert & Edit PDF files online',
  homeDescription:
    'Free online PDF toolkit: merge, split, compress, convert, sign, protect and OCR PDF files. Everything runs in your browser — your files never leave your device.',
  description:
    'Merge, split, compress, convert, sign, protect and OCR PDF files online. Everything runs in your browser — your files never leave your device.',
  googleSearchConsoleVerification: '',
  adsenseClient: 'ca-pub-4457341244293293',
  /**
   * Paste your real AdSense ad unit IDs here after creating responsive units
   * (AdSense → Ads → By ad unit). Until a unit ID is set, page space is kept as
   * a labelled placeholder instead of rendering a broken, slot-less ad.
   */
  adsenseSlots: {
    horizontal: '', // e.g. '1234567890' — leaderboard / inline responsive unit
    rectangle: '', // medium rectangle (300x250) / responsive unit
    vertical: '', // tall skyscraper responsive unit for sidebars
  } as const,
  cloudflareAnalyticsToken: '', // e.g. 'a1b2c3d4e5f6...'
  googleOAuthClientId: '516024835908-phbijidr675u197ekn7aj63771g6lidq.apps.googleusercontent.com',
  maxUploadMb: 200,
} as const

/** Slugs drive routing, the sitemap and the SEO metadata. Keep in sync with tools/registry.tsx */
export const TOOL_SLUGS = [
  'merge-pdf',
  'split-pdf',
  'compress-pdf',
  'pdf-to-word',
  'pdf-to-excel',
  'pdf-to-jpg',
  'word-to-pdf',
  'image-to-pdf',
  'organize-pdf',
  'watermark-pdf',
  'protect-pdf',
  'unlock-pdf',
  'sign-pdf',
  'ocr-pdf',
] as const

export type ToolSlug = (typeof TOOL_SLUGS)[number]
