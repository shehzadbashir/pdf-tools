import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib'
import type { PDFFont, PDFImage, PDFPage } from 'pdf-lib'

/* ------------------------------------------------------------------ load */

/** Loads a document. pdf-lib rejects encrypted input, which callers surface as a friendly message. */
export async function loadDoc(bytes: Uint8Array): Promise<PDFDocument> {
  return PDFDocument.load(bytes, { ignoreEncryption: false })
}

/* ----------------------------------------------------------------- merge */

export interface MergeSource {
  name: string
  bytes: Uint8Array
}

export async function mergePdfs(
  sources: MergeSource[],
  onProgress?: (done: number, total: number) => void,
): Promise<Uint8Array> {
  const out = await PDFDocument.create()
  let done = 0
  for (const source of sources) {
    const src = await loadDoc(source.bytes)
    const pages = await out.copyPages(src, src.getPageIndices())
    for (const page of pages) out.addPage(page)
    done++
    onProgress?.(done, sources.length)
  }
  out.setProducer('PDF Tools')
  out.setCreator('PDF Tools — merge')
  return out.save({ useObjectStreams: true })
}

/* ----------------------------------------------------------------- split */

export async function splitIntoRanges(
  bytes: Uint8Array,
  ranges: number[][],
  baseName: string,
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const src = await loadDoc(bytes)
  const total = src.getPageCount()
  const results: { name: string; bytes: Uint8Array }[] = []

  for (let i = 0; i < ranges.length; i++) {
    const picked = ranges[i].filter((p) => p >= 1 && p <= total)
    if (picked.length === 0) continue
    const doc = await PDFDocument.create()
    const pages = await doc.copyPages(src, picked.map((p) => p - 1))
    pages.forEach((p) => doc.addPage(p))
    const suffix = ranges.length > 1 ? `-part-${i + 1}` : ''
    results.push({ name: `${baseName}${suffix}.pdf`, bytes: await doc.save() })
  }
  return results
}

export async function splitEveryN(
  bytes: Uint8Array,
  n: number,
  baseName: string,
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const src = await loadDoc(bytes)
  const total = src.getPageCount()
  const ranges: number[][] = []
  for (let start = 1; start <= total; start += n) {
    const range: number[] = []
    for (let p = start; p <= Math.min(start + n - 1, total); p++) range.push(p)
    ranges.push(range)
  }
  return splitIntoRanges(bytes, ranges, baseName)
}

export async function splitSinglePages(
  bytes: Uint8Array,
  baseName: string,
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const total = (await loadDoc(bytes)).getPageCount()
  return splitIntoRanges(
    bytes,
    Array.from({ length: total }, (_, i) => [i + 1]),
    baseName,
  )
}

/* -------------------------------------------------------------- organise */

export interface PagePlan {
  /** 1-based page number in the source document */
  source: number
  /** cumulative rotation delta in degrees (0/90/180/270) */
  rotation: number
}

export async function applyPagePlan(
  bytes: Uint8Array,
  plan: PagePlan[],
): Promise<Uint8Array> {
  const src = await loadDoc(bytes)
  const out = await PDFDocument.create()

  for (const item of plan) {
    const [copied] = await out.copyPages(src, [item.source - 1])
    const original = copied.getRotation().angle
    const angle = (((original + item.rotation) % 360) + 360) % 360
    copied.setRotation(degrees(angle))
    out.addPage(copied)
  }

  out.setProducer('PDF Tools')
  return out.save({ useObjectStreams: true })
}

export async function getRotationOf(bytes: Uint8Array, pageNumber: number): Promise<number> {
  const doc = await loadDoc(bytes)
  return doc.getPage(pageNumber - 1).getRotation().angle
}

/* ------------------------------------------------------------- watermark */

export type WatermarkPlacement = 'center' | 'diagonal' | 'tiled'
export type NumberPosition = 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-right'
export type NumberFormat = 'plain' | 'of' | 'dash'

export interface WatermarkOptions {
  text?: string
  fontSize?: number
  angle?: number
  opacity?: number
  color?: string
  placement?: WatermarkPlacement
  logo?: { bytes: Uint8Array; type: 'png' | 'jpg' } | null
  logoScale?: number
  numbers?: {
    enabled: boolean
    format: NumberFormat
    position: NumberPosition
    startAt: number
    fontSize?: number
    color?: string
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  const value = parseInt(full, 16)
  if (Number.isNaN(value)) return { r: 0.5, g: 0.5, b: 0.5 }
  return {
    r: ((value >> 16) & 255) / 255,
    g: ((value >> 8) & 255) / 255,
    b: (value & 255) / 255,
  }
}

/**
 * Draws arbitrary text (any script, any font) onto a transparent canvas the
 * size of the page. Text is drawn as an image so that Urdu/Arabic watermarks
 * work without embedding a Unicode font into the PDF.
 */
async function renderTextOverlay(
  doc: PDFDocument,
  page: PDFPage,
  opts: Required<Pick<WatermarkOptions, 'text' | 'fontSize' | 'angle' | 'opacity' | 'color' | 'placement'>>,
): Promise<void> {
  const { width, height } = page.getSize()
  const scale = 2
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')

  ctx.scale(scale, scale)
  ctx.font = `700 ${opts.fontSize}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
  ctx.fillStyle = opts.color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const draw = (x: number, y: number) => {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((-opts.angle * Math.PI) / 180)
    ctx.fillText(opts.text, 0, 0)
    ctx.restore()
  }

  if (opts.placement === 'center') {
    draw(width / 2, height / 2)
  } else if (opts.placement === 'diagonal') {
    const metrics = ctx.measureText(opts.text)
    const diagonal = Math.hypot(width, height)
    const fit = Math.min(1, (diagonal * 0.82) / Math.max(1, metrics.width))
    ctx.font = `700 ${opts.fontSize * fit}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
    draw(width / 2, height / 2)
  } else {
    const textWidth = ctx.measureText(opts.text).width
    const stepX = Math.max(textWidth * 1.35, 140)
    const stepY = Math.max(opts.fontSize * 3.4, 110)
    for (let y = stepY / 2; y < height + stepY; y += stepY) {
      for (let x = stepX / 2; x < width + stepX; x += stepX) draw(x, y)
    }
  }

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/png'),
  )
  const bytes = new Uint8Array(await blob.arrayBuffer())
  const image = await doc.embedPng(bytes)
  const globalOpacity = opts.opacity
  page.drawImage(image, { x: 0, y: 0, width, height, opacity: globalOpacity })
}

function numberLabel(
  absoluteIndex: number,
  total: number,
  format: NumberFormat,
): string {
  if (format === 'of') return `${absoluteIndex} of ${total}`
  if (format === 'dash') return `— ${absoluteIndex} —`
  return String(absoluteIndex)
}

async function drawPageNumbers(
  page: PDFPage,
  font: PDFFont,
  label: string,
  opts: NonNullable<WatermarkOptions['numbers']>,
): Promise<void> {
  const { width, height } = page.getSize()
  const size = opts.fontSize ?? 10
  const { r, g, b } = hexToRgb(opts.color ?? '#444444')
  const color = rgb(r, g, b)
  const textWidth = font.widthOfTextAtSize(label, size)
  const margin = 28

  let x: number
  let y: number

  switch (opts.position) {
    case 'bottom-right':
      x = width - margin - textWidth
      y = margin
      break
    case 'bottom-left':
      x = margin
      y = margin
      break
    case 'top-right':
      x = width - margin - textWidth
      y = height - margin
      break
    default:
      x = (width - textWidth) / 2
      y = margin
  }

  page.drawText(label, { x, y, size, font, color })
}

export interface ApplyWatermarkResult {
  bytes: Uint8Array
}

export async function applyWatermark(
  input: Uint8Array,
  opts: WatermarkOptions,
): Promise<Uint8Array> {
  const doc = await loadDoc(input)
  const pages = doc.getPages()
  const hasWatermark = Boolean(opts.logo || (opts.text && opts.text.trim().length > 0))
  const hasNumbers = Boolean(opts.numbers?.enabled)

  if (hasWatermark && opts.text && opts.text.trim()) {
    for (const page of pages) {
      await renderTextOverlay(doc, page, {
        text: opts.text.trim(),
        fontSize: opts.fontSize ?? 48,
        angle: opts.angle ?? -45,
        opacity: opts.opacity ?? 0.16,
        color: opts.color ?? '#111111',
        placement: opts.placement ?? 'diagonal',
      })
    }
  }

  if (opts.logo && opts.logo.bytes) {
    const image: PDFImage =
      opts.logo.type === 'png' ? await doc.embedPng(opts.logo.bytes) : await doc.embedJpg(opts.logo.bytes)
    const scale = opts.logoScale ?? 0.25
    for (const page of pages) {
      const { width, height } = page.getSize()
      const ratio = image.width / image.height
      let w = width * scale
      let h = w / ratio
      if (h > height * scale) {
        h = height * scale
        w = h * ratio
      }
      page.drawImage(image, {
        x: (width - w) / 2,
        y: (height - h) / 2,
        width: w,
        height: h,
        opacity: opts.opacity ?? 0.2,
      })
    }
  }

  if (hasNumbers && opts.numbers) {
    const font = await doc.embedFont(StandardFonts.Helvetica)
    const total = pages.length
    for (let i = 0; i < pages.length; i++) {
      const absolute = opts.numbers.startAt + i
      const label = numberLabel(absolute, total, opts.numbers.format)
      await drawPageNumbers(pages[i], font, label, opts.numbers)
    }
  }

  if (!hasWatermark && !hasNumbers) throw new Error('NOTHING_CONFIGURED')

  doc.setProducer('PDF Tools')
  return doc.save({ useObjectStreams: true })
}
