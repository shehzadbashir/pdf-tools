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
  description:
    'Merge, split, compress, convert, sign, protect and OCR PDF files online. Everything runs in your browser — your files never leave your device.',
  googleSearchConsoleVerification: '',
  adsenseClient: 'ca-pub-4457341244293293',
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
