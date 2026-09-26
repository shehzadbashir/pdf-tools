import { PDFDocument, degrees, rgb } from 'pdf-lib'
import { openPdf, renderPage } from './pdfjs'
import { nextFrame } from './files'

export type StampKind = 'signature' | 'text' | 'highlight' | 'stamp'

export interface PlacedElement {
  id: string
  kind: StampKind
  /** position + size as a fraction of the page (0–1), origin top-left */
  x: number
  y: number
  w: number
  h: number
  rotation: number
  opacity: number
  color: string
  /** PNG data URL for signature/text/stamp elements */
  src?: string
  /** plain text kept for previews */
  text?: string
  fontSize?: number
}

export interface PageAnnotation {
  pageNumber: number
  elements: PlacedElement[]
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10)
}

/** Renders text into a transparent PNG so any script can be drawn into a PDF. */
export async function textToPng(
  text: string,
  opts: { fontSize?: number; color?: string; padding?: number; fontWeight?: number } = {},
): Promise<string> {
  const fontSize = opts.fontSize ?? 64
  const padding = opts.padding ?? 16
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')

  const font = `${opts.fontWeight ?? 600} ${fontSize}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`
  ctx.font = font
  const lines = text.split(/\r?\n/)
  const widths = lines.map((l) => ctx.measureText(l || ' ').width)
  const width = Math.max(...widths, 1)
  const lineHeight = fontSize * 1.3

  canvas.width = Math.ceil(width + padding * 2)
  canvas.height = Math.ceil(lineHeight * lines.length + padding * 2)

  const ctx2 = canvas.getContext('2d')!
  ctx2.font = font
  ctx2.fillStyle = opts.color ?? '#111111'
  ctx2.textBaseline = 'top'
  lines.forEach((line, i) => {
    ctx2.fillText(line, padding, padding + i * lineHeight)
  })

  return canvas.toDataURL('image/png')
}

/** Captures drawn strokes on a canvas and trims away the empty margin. */
export function trimSignatureCanvas(source: HTMLCanvasElement): string | null {
  const ctx = source.getContext('2d')
  if (!ctx) return null
  const { width, height } = source
  if (!width || !height) return null

  const data = ctx.getImageData(0, 0, width, height).data
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3]
      if (alpha > 8) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }

  if (maxX < 0) return null
  const pad = 6
  minX = Math.max(0, minX - pad)
  minY = Math.max(0, minY - pad)
  maxX = Math.min(width - 1, maxX + pad)
  maxY = Math.min(height - 1, maxY + pad)

  const cropped = document.createElement('canvas')
  cropped.width = maxX - minX + 1
  cropped.height = maxY - minY + 1
  cropped.getContext('2d')!.drawImage(
    source,
    minX,
    minY,
    cropped.width,
    cropped.height,
    0,
    0,
    cropped.width,
    cropped.height,
  )
  return cropped.toDataURL('image/png')
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
  if (Number.isNaN(value)) return { r: 0, g: 0, b: 0 }
  return { r: ((value >> 16) & 255) / 255, g: ((value >> 8) & 255) / 255, b: (value & 255) / 255 }
}

async function dataUrlToBytes(dataUrl: string): Promise<Uint8Array> {
  const res = await fetch(dataUrl)
  return new Uint8Array(await res.arrayBuffer())
}

/**
 * Draws every placed element onto its page. Elements keep fractional
 * coordinates so they stay aligned regardless of the page resolution.
 */
export async function applyAnnotations(
  bytes: Uint8Array,
  annotations: PageAnnotation[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: false })

  for (const annotation of annotations) {
    if (annotation.elements.length === 0) continue
    const page = doc.getPage(annotation.pageNumber - 1)
    const { width, height } = page.getSize()

    for (const element of annotation.elements) {
      const px = element.x * width
      const py = height - (element.y + element.h) * height
      const pw = element.w * width
      const ph = element.h * height

      if (element.kind === 'highlight') {
        const { r, g, b } = hexToRgb(element.color || '#fde047')
        page.drawRectangle({
          x: px,
          y: py,
          width: pw,
          height: ph,
          color: rgb(r, g, b),
          opacity: Math.min(0.6, element.opacity),
        })
        continue
      }

      if (element.kind === 'text' || element.kind === 'stamp') {
        const label = element.text ?? ''
        if (!label.trim()) continue
        const png = await textToPng(label, {
          fontSize: 64,
          color: element.kind === 'stamp' ? element.color : '#111111',
          fontWeight: element.kind === 'stamp' ? 700 : 600,
        })
        const image = await doc.embedPng(await dataUrlToBytes(png))
        page.drawImage(image, {
          x: px,
          y: py,
          width: pw,
          height: ph,
          opacity: element.opacity,
          rotate: degrees(element.rotation),
        })
        continue
      }

      if (element.src) {
        const image = await doc.embedPng(await dataUrlToBytes(element.src))
        page.drawImage(image, {
          x: px,
          y: py,
          width: pw,
          height: ph,
          opacity: element.opacity,
          rotate: degrees(element.rotation),
        })
      }
    }
  }

  doc.setProducer('PDF Tools')
  doc.setCreator('PDF Tools — sign')
  return doc.save({ useObjectStreams: true })
}

/** Renders a page preview that the signature UI draws on top of. */
export async function renderPreview(
  bytes: Uint8Array,
  pageNumber: number,
  width: number,
): Promise<string> {
  const doc = await openPdf(bytes)
  const canvas = await renderPage(doc, pageNumber, { width })
  const url = canvas.toDataURL('image/jpeg', 0.82)
  await doc.cleanup()
  return url
}

export async function totalPageCount(bytes: Uint8Array): Promise<number> {
  const doc = await openPdf(bytes)
  const count = doc.numPages
  await doc.cleanup()
  return count
}

export function formatDateStamp(date = new Date()): string {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export async function yieldToUi(): Promise<void> {
  await nextFrame()
}
