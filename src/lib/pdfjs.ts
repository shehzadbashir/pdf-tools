import * as pdfjs from 'pdfjs-dist'
import type { PDFDocumentProxy, PDFPageProxy, PageViewport } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

export type PdfDoc = PDFDocumentProxy
export type PdfPage = PDFPageProxy

export class PdfPasswordError extends Error {
  constructor() {
    super('PASSWORD_REQUIRED')
    this.name = 'PdfPasswordError'
  }
}

/** Loads a PDF. Throws {@link PdfPasswordError} when a password is missing/incorrect. */
export async function openPdf(
  source: Blob | Uint8Array | ArrayBuffer,
  password?: string,
): Promise<PdfDoc> {
  let bytes: Uint8Array
  if (source instanceof Blob) {
    bytes = new Uint8Array(await source.arrayBuffer())
  } else if (source instanceof ArrayBuffer) {
    bytes = new Uint8Array(source)
  } else {
    bytes = source
  }

  try {
    // pdf.js transfers the buffer to the worker, so hand it a private copy.
    const task = pdfjs.getDocument({
      data: bytes.slice(),
      password,
      useSystemFonts: false,
    })
    return await task.promise
  } catch (err) {
    const name = (err as { name?: string })?.name
    if (name === 'PasswordException') throw new PdfPasswordError()
    throw err
  }
}

export async function pageCount(doc: PdfDoc): Promise<number> {
  return doc.numPages
}

export async function pageAt(doc: PdfDoc, pageNumber: number): Promise<PdfPage> {
  return doc.getPage(pageNumber)
}

export interface RenderOptions {
  /** Fixed scale factor (1 = 72dpi). */
  scale?: number
  /** Render at this many pixels wide, preserving the aspect ratio. */
  width?: number
  /** Target resolution in dots per inch. */
  dpi?: number
}

function resolveScale(viewport: PageViewport, opts: RenderOptions): number {
  if (opts.scale) return opts.scale
  if (opts.dpi) return opts.dpi / 72
  if (opts.width) return opts.width / viewport.width
  return 1
}

/** Renders one page onto a fresh canvas. */
export async function renderPage(
  doc: PdfDoc,
  pageNumber: number,
  opts: RenderOptions = {},
): Promise<HTMLCanvasElement> {
  const page = await doc.getPage(pageNumber)
  const base = page.getViewport({ scale: 1 })
  const viewport = page.getViewport({ scale: resolveScale(base, opts) })

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.floor(viewport.width))
  canvas.height = Math.max(1, Math.floor(viewport.height))

  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  await page.render({ canvas, viewport }).promise
  page.cleanup()
  return canvas
}

/** Renders a page straight to a Blob (jpg/png). */
export async function renderPageToBlob(
  doc: PdfDoc,
  pageNumber: number,
  opts: RenderOptions & { type?: 'image/jpeg' | 'image/png'; quality?: number } = {},
): Promise<Blob> {
  const canvas = await renderPage(doc, pageNumber, opts)
  const type = opts.type ?? 'image/jpeg'
  const quality = opts.quality ?? 0.85
  return canvasToBlob(canvas, type, quality)
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = 'image/jpeg',
  quality = 0.85,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode image'))),
      type,
      quality,
    )
  })
}

export interface PageInfo {
  pageNumber: number
  width: number
  height: number
  rotation: number
}

export async function readPageInfo(doc: PdfDoc): Promise<PageInfo[]> {
  const out: PageInfo[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const vp = page.getViewport({ scale: 1 })
    out.push({
      pageNumber: i,
      width: Math.round(vp.width),
      height: Math.round(vp.height),
      rotation: vp.rotation,
    })
    page.cleanup()
  }
  return out
}

/* ------------------------------------------------------------------ text */

export interface TextToken {
  str: string
  /** left edge, PDF units, origin bottom-left */
  x: number
  /** baseline, PDF units, origin bottom-left */
  y: number
  width: number
  height: number
}

export interface TextLine {
  y: number
  tokens: TextToken[]
  text: string
}

/** Groups the raw text items of a page into visual lines, left to right. */
export async function extractLines(page: PdfPage): Promise<TextLine[]> {
  const content = await page.getTextContent()
  const tokens: TextToken[] = []

  for (const raw of content.items) {
    if (!('str' in raw)) continue
    const item = raw
    const str = item.str
    if (!str || !str.trim()) continue
    const t = item.transform
    const height = Math.abs(t[3]) || Math.abs(item.height) || 10
    tokens.push({
      str,
      x: t[4],
      y: t[5],
      width: item.width || 0,
      height,
    })
  }

  tokens.sort((a, b) => b.y - a.y || a.x - b.x)

  const lines: TextLine[] = []
  for (const token of tokens) {
    const current = lines[lines.length - 1]
    const tolerance = Math.max(2, token.height * 0.55)
    if (current && Math.abs(current.y - token.y) <= tolerance) {
      current.tokens.push(token)
    } else {
      lines.push({ y: token.y, tokens: [token], text: '' })
    }
  }

  for (const line of lines) {
    line.tokens.sort((a, b) => a.x - b.x)
    let text = ''
    let prev: TextToken | null = null
    for (const t of line.tokens) {
      if (prev) {
        const gap = t.x - (prev.x + prev.width)
        const needsSpace = gap > Math.max(1.5, prev.height * 0.22)
        const prevEndsWord = /[A-Za-z0-9À-ɏ]$/.test(prev.str)
        const thisStartsWord = /^[A-Za-z0-9À-ɏ]/.test(t.str)
        if (needsSpace || (prevEndsWord && thisStartsWord && gap > 0.3)) text += ' '
      }
      text += t.str
      prev = t
    }
    line.text = text.trim()
  }

  return lines.filter((l) => l.text.length > 0)
}

export async function extractPageLines(doc: PdfDoc, pageNumber: number): Promise<TextLine[]> {
  const page = await doc.getPage(pageNumber)
  const lines = await extractLines(page)
  page.cleanup()
  return lines
}

/**
 * Detects column starts across a set of lines by clustering the left edges of
 * tokens. Returns the column offsets sorted left to right.
 */
export function detectColumns(
  lines: { tokens: ReadonlyArray<{ x: number }> }[],
  tolerance = 8,
): number[] {
  const starts: number[] = []
  for (const line of lines) for (const t of line.tokens) starts.push(t.x)
  starts.sort((a, b) => a - b)

  const clusters: { sum: number; count: number }[] = []
  for (const x of starts) {
    const last = clusters[clusters.length - 1]
    if (last && Math.abs(x - last.sum / last.count) <= tolerance) {
      last.sum += x
      last.count++
    } else {
      clusters.push({ sum: x, count: 1 })
    }
  }
  return clusters.map((c) => c.sum / c.count)
}
