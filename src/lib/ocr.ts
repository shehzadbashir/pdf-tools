import { createWorker, type Worker } from 'tesseract.js'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { PDFDocument, PDFOperator, PDFOperatorNames, StandardFonts, degrees, rgb } from 'pdf-lib'
import { openPdf, renderPage, canvasToBlob, type PdfDoc } from './pdfjs'
import { baseName, nextFrame } from './files'

export const OCR_LANGUAGES = ['eng', 'ara', 'urd', 'fra', 'deu', 'spa'] as const
export type OcrLanguage = (typeof OCR_LANGUAGES)[number]

/** Scripts whose glyphs exist in the standard Helvetica font used for the text layer. */
const LATIN_ONLY: OcrLanguage[] = ['eng', 'fra', 'deu', 'spa']

export function supportsSearchablePdf(language: OcrLanguage): boolean {
  return LATIN_ONLY.includes(language)
}

export interface OcrWord {
  text: string
  confidence: number
  /** bounding box in render pixels */
  x0: number
  y0: number
  x1: number
  y1: number
}

export interface OcrPageResult {
  pageNumber: number
  text: string
  confidence: number
  words: OcrWord[]
}

export interface OcrOptions {
  language: OcrLanguage
  dpi?: number
  onProgress?: (fraction: number, message?: string) => void
}

export interface OcrResult {
  pages: OcrPageResult[]
  text: string
  confidence: number
}

interface RawWord {
  text?: string
  confidence?: number
  bbox?: { x0: number; y0: number; x1: number; y1: number }
}

function collectWords(data: unknown): RawWord[] {
  const payload = data as {
    words?: RawWord[]
    blocks?: { paragraphs?: { lines?: { words?: RawWord[] }[] }[] }[]
  }
  if (Array.isArray(payload?.words) && payload.words.length > 0) return payload.words

  const out: RawWord[] = []
  for (const block of payload?.blocks ?? []) {
    for (const paragraph of block?.paragraphs ?? []) {
      for (const line of paragraph?.lines ?? []) {
        for (const word of line?.words ?? []) out.push(word)
      }
    }
  }
  return out
}

let activeWorker: Worker | null = null

async function getWorker(
  language: OcrLanguage,
  onProgress?: (m: { status?: string; progress?: number }) => void,
): Promise<Worker> {
  if (activeWorker) await activeWorker.terminate()
  activeWorker = await createWorker(language, 1, {
    logger: (m) => onProgress?.(m),
  })
  return activeWorker
}

export async function runOcr(
  source: Blob | Uint8Array,
  opts: OcrOptions,
): Promise<OcrResult> {
  const dpi = opts.dpi ?? 200
  const doc: PdfDoc = await openPdf(source)
  const worker = await getWorker(opts.language, (m) => {
    if (m.status === 'recognizing text' && typeof m.progress === 'number') {
      opts.onProgress?.(m.progress * 0.9, m.status)
    } else {
      opts.onProgress?.(0, m.status)
    }
  })

  const pages: OcrPageResult[] = []

  try {
    const total = doc.numPages
    for (let i = 1; i <= total; i++) {
      const canvas = await renderPage(doc, i, { dpi })
      const { data } = await worker.recognize(canvas, {}, { blocks: true })
      const raw = collectWords(data)

      const words: OcrWord[] = raw
        .filter((w) => w?.bbox && w.text && w.text.trim())
        .map((w) => ({
          text: w.text!.trim(),
          confidence: w.confidence ?? 0,
          x0: w.bbox!.x0,
          y0: w.bbox!.y0,
          x1: w.bbox!.x1,
          y1: w.bbox!.y1,
        }))

      pages.push({
        pageNumber: i,
        text: data.text ?? '',
        confidence: data.confidence ?? 0,
        words,
      })

      opts.onProgress?.(((i - 1) / total) * 0.9 + 0.9 / total, `page ${i}/${total}`)
      if (i % 2 === 0) await nextFrame()
    }
  } finally {
    await worker.terminate()
    activeWorker = null
    await doc.cleanup()
  }

  const text = pages.map((p) => p.text.trim()).join('\n\n')
  const confidence =
    pages.length > 0 ? pages.reduce((sum, p) => sum + p.confidence, 0) / pages.length : 0

  return { pages, text, confidence }
}

export async function ocrToDocx(result: OcrResult, name: string): Promise<Uint8Array> {
  const paragraphs: Paragraph[] = []
  result.pages.forEach((page, index) => {
    if (index > 0) paragraphs.push(new Paragraph({ children: [] }))
    for (const line of page.text.split(/\r?\n/)) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: line, size: 22 })],
          spacing: { after: line.trim() ? 60 : 0 },
        }),
      )
    }
  })

  const file = new Document({
    creator: 'PDF Tools',
    title: baseName(name),
    sections: [{ children: paragraphs }],
  })
  const blob = await Packer.toBlob(file)
  return new Uint8Array(await blob.arrayBuffer())
}

/**
 * Builds a PDF where each page is the original scan with an invisible text
 * layer on top, which is what makes the file searchable and copyable in any
 * PDF reader.
 */
export async function ocrToSearchablePdf(
  bytes: Uint8Array,
  result: OcrResult,
  dpi: number,
): Promise<Uint8Array> {
  const doc = await openPdf(bytes)
  const out = await PDFDocument.create()
  const font = await out.embedFont(StandardFonts.Helvetica)
  const scale = 72 / dpi
  const total = result.pages.length

  for (let i = 1; i <= total; i++) {
    const source = await doc.getPage(i)
    const base = source.getViewport({ scale: 1 })
    const canvas = await renderPage(doc, i, { dpi })
    const blob = await canvasToBlob(canvas, 'image/jpeg', 0.85)
    const jpeg = new Uint8Array(await blob.arrayBuffer())
    const image = await out.embedJpg(jpeg)

    const page = out.addPage([base.width, base.height])
    page.drawImage(image, { x: 0, y: 0, width: base.width, height: base.height })

    const pageResult = result.pages[i - 1]
    for (const word of pageResult?.words ?? []) {
      const x = word.x0 * scale
      const boxWidth = Math.max(1, (word.x1 - word.x0) * scale)
      const boxHeight = Math.max(1, (word.y1 - word.y0) * scale)
      const y = base.height - word.y1 * scale
      const size = Math.max(4, boxHeight * 0.82)

      let text = word.text
      try {
        font.widthOfTextAtSize(text, size)
      } catch {
        // Helvetica cannot encode every glyph — fall back to a safe subset.
        text = text.replace(/[^\x20-\x7E]/g, '')
        if (!text.trim()) continue
      }

      const natural = font.widthOfTextAtSize(text, size)
      const squeeze = natural > 0 && boxWidth > 0 ? boxWidth / natural : 1

      // Stretch the glyph run so the invisible layer lines up with the raster
      // word box. `Tz` is a text-state operator, so it applies to the drawText
      // call that follows and to nothing else on this page.
      page.pushOperators(
        PDFOperator.of(PDFOperatorNames.SetTextHorizontalScaling, [
          String(Math.round(Math.min(1.35, Math.max(0.75, squeeze)) * 100)),
        ]),
      )

      page.drawText(text, {
        x,
        y,
        size,
        font,
        color: rgb(0, 0, 0),
        opacity: 0,
        rotate: degrees(0),
      })
    }

    source.cleanup()
  }

  out.setProducer('PDF Tools')
  out.setCreator('PDF Tools — OCR')
  return out.save({ useObjectStreams: true })
}
