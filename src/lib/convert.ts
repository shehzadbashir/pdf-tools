import mammoth from 'mammoth'
import html2canvas from 'html2canvas'
import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  PageBreak,
  Packer,
  Paragraph,
  TextRun,
} from 'docx'
import * as XLSX from 'xlsx'
import { PDFDocument } from 'pdf-lib'
import { detectColumns, extractPageLines, openPdf, renderPage, type PdfDoc } from './pdfjs'
import { baseName, nextFrame } from './files'

/* ------------------------------------------------------------ PDF → JPG */

export type ImageFormat = 'image/jpeg' | 'image/png'

export interface PdfToImageOptions {
  format: ImageFormat
  dpi: number
  quality: number
  onProgress?: (fraction: number) => void
}

export interface NamedBlob {
  name: string
  blob: Blob
}

export async function pdfToImages(
  bytes: Uint8Array,
  name: string,
  opts: PdfToImageOptions,
): Promise<NamedBlob[]> {
  const doc = await openPdf(bytes)
  const ext = opts.format === 'image/png' ? 'png' : 'jpg'
  const stem = baseName(name)
  const out: NamedBlob[] = []
  const pad = String(doc.numPages).length

  for (let i = 1; i <= doc.numPages; i++) {
    const canvas = await renderPage(doc, i, { dpi: opts.dpi })
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Image encoding failed'))),
        opts.format,
        opts.quality,
      ),
    )
    out.push({ name: `${stem}-${String(i).padStart(pad, '0')}.${ext}`, blob })
    opts.onProgress?.(i / doc.numPages)
    if (i % 5 === 0) await nextFrame()
  }
  await doc.cleanup()
  return out
}

/* ------------------------------------------------------------ PDF → DOCX */

export type DocxMode = 'editable' | 'faithful'

export interface PdfToDocxOptions {
  mode: DocxMode
  onProgress?: (fraction: number) => void
}

function median(values: number[]): number {
  if (values.length === 0) return 10
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export async function pdfToDocx(
  bytes: Uint8Array,
  name: string,
  opts: PdfToDocxOptions,
): Promise<Uint8Array> {
  const doc = await openPdf(bytes)
  const blocks: Paragraph[] = []

  if (opts.mode === 'faithful') {
    const total = doc.numPages
    for (let i = 1; i <= total; i++) {
      const canvas = await renderPage(doc, i, { dpi: 130 })
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/png'),
      )
      const data = new Uint8Array(await blob.arrayBuffer())
      const cssWidth = Math.round((canvas.width * 96) / 130)
      const cssHeight = Math.round((canvas.height * 96) / 130)
      blocks.push(
        new Paragraph({
          pageBreakBefore: i > 1,
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              type: 'png',
              data,
              transformation: { width: cssWidth, height: cssHeight },
            }),
          ],
        }),
      )
      opts.onProgress?.(i / total)
    }
  } else {
    const heights: number[] = []
    const pages: { text: string; height: number }[][] = []
    const total = doc.numPages

    for (let i = 1; i <= total; i++) {
      const lines = await extractPageLines(doc, i)
      const pageLines = lines.map((line) => {
        const height = line.tokens.reduce((max, t) => Math.max(max, t.height), 0)
        heights.push(height)
        return { text: line.text, height }
      })
      pages.push(pageLines)
      opts.onProgress?.(i / (total * 2))
      if (i % 4 === 0) await nextFrame()
    }

    const base = median(heights.filter((h) => h > 0))
    pages.forEach((pageLines, pageIndex) => {
      if (pageIndex > 0) {
        blocks.push(new Paragraph({ children: [new PageBreak()] }))
      }
      for (const line of pageLines) {
        if (!line.text) continue
        const size = Math.round(line.height * 1.6) // half-points
        const heading =
          line.height > base * 1.45
            ? HeadingLevel.HEADING_1
            : line.height > base * 1.18
              ? HeadingLevel.HEADING_2
              : undefined
        blocks.push(
          new Paragraph({
            heading,
            spacing: { after: heading ? 160 : 60 },
            children: [new TextRun({ text: line.text, size: heading ? undefined : Math.max(18, size) })],
          }),
        )
      }
      opts.onProgress?.((pageIndex + 1) / (pages.length * 2))
    })
  }

  const documentFile = new Document({
    creator: 'PDF Tools',
    title: baseName(name),
    sections: [{ children: blocks }],
  })

  const blob = await Packer.toBlob(documentFile)
  await doc.cleanup()
  return new Uint8Array(await blob.arrayBuffer())
}

/* ------------------------------------------------------------ PDF → XLSX */

export interface PdfToXlsxOptions {
  sheetName?: string
  onProgress?: (fraction: number) => void
}

export interface XlsxOutcome {
  bytes: Uint8Array
  rowCount: number
  usedColumns: number
}

export async function pdfToXlsx(
  bytes: Uint8Array,
  name: string,
  opts: PdfToXlsxOptions = {},
): Promise<XlsxOutcome> {
  const doc = await openPdf(bytes)
  const allLines: { y: number; tokens: { x: number; str: string; width: number }[] }[] = []
  const total = doc.numPages

  for (let i = 1; i <= total; i++) {
    const lines = await extractPageLines(doc, i)
    const offset = (i - 1) * 100_000 // keeps pages separated when sorted
    for (const line of lines) {
      allLines.push({
        y: -line.y + offset,
        tokens: line.tokens.map((t) => ({ x: t.x, str: t.str, width: t.width })),
      })
    }
    opts.onProgress?.(i / (total * 2))
    if (i % 4 === 0) await nextFrame()
  }

  const columns = detectColumns(allLines)
  const rows: string[][] = []

  for (const line of allLines) {
    const cells = new Array<string>(Math.max(1, columns.length)).fill('')
    for (const token of line.tokens) {
      let index = 0
      for (let c = 0; c < columns.length; c++) {
        if (token.x >= columns[c] - 6) index = c
      }
      cells[index] = cells[index] ? `${cells[index]} ${token.str}` : token.str
    }
    rows.push(cells)
  }
  opts.onProgress?.(0.9)

  const sheetName =
    (opts.sheetName || baseName(name) || 'Sheet1')
      .replace(/[^\p{L}\p{N} _-]/gu, '')
      .trim()
      .slice(0, 31) || 'Sheet1'
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(rows.length ? rows : [['']])
  worksheet['!cols'] = (rows[0] ?? ['']).map((_, i) => ({
    wch: Math.min(48, Math.max(10, ...rows.map((r) => (r[i] ?? '').length + 2))),
  }))
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  const output = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
  await doc.cleanup()

  return {
    bytes: new Uint8Array(output),
    rowCount: rows.length,
    usedColumns: Math.max(1, columns.length),
  }
}

/* ---------------------------------------------------------- images → PDF */

export type ImagePageSize = 'auto' | 'a4' | 'letter'

export interface ImagesToPdfOptions {
  pageSize: ImagePageSize
  /** Margin in millimetres, ignored for `auto` page size. */
  marginMm: number
  onProgress?: (fraction: number) => void
}

const MM = 72 / 25.4
export const PAGE_SIZES: Record<'a4' | 'letter', [number, number]> = {
  a4: [210 * MM, 297 * MM],
  letter: [8.5 * 72, 11 * 72],
}

async function encodeImage(file: Blob): Promise<{
  bytes: Uint8Array
  kind: 'png' | 'jpg'
  width: number
  height: number
}> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')

  const keepPng = file.type === 'image/png'
  if (!keepPng) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Image encoding failed'))),
      keepPng ? 'image/png' : 'image/jpeg',
      0.92,
    ),
  )
  return {
    bytes: new Uint8Array(await blob.arrayBuffer()),
    kind: keepPng ? 'png' : 'jpg',
    width: canvas.width,
    height: canvas.height,
  }
}

export async function imagesToPdf(
  files: File[],
  opts: ImagesToPdfOptions,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const marginPt = opts.pageSize === 'auto' ? 0 : opts.marginMm * MM

  for (let i = 0; i < files.length; i++) {
    const encoded = await encodeImage(files[i])
    const image = encoded.kind === 'png' ? await doc.embedPng(encoded.bytes) : await doc.embedJpg(encoded.bytes)

    const intrinsicW = (encoded.width * 72) / 96
    const intrinsicH = (encoded.height * 72) / 96

    let pageW: number
    let pageH: number

    if (opts.pageSize === 'auto') {
      pageW = intrinsicW
      pageH = intrinsicH
    } else {
      ;[pageW, pageH] = PAGE_SIZES[opts.pageSize]
      if (intrinsicW > intrinsicH && pageW < pageH) {
        const [w, h] = [pageH, pageW]
        pageW = w
        pageH = h
      }
    }

    const page = doc.addPage([pageW, pageH])
    const availableW = pageW - marginPt * 2
    const availableH = pageH - marginPt * 2
    const ratio = Math.min(availableW / intrinsicW, availableH / intrinsicH, 1)
    const drawW = intrinsicW * ratio
    const drawH = intrinsicH * ratio

    page.drawImage(image, {
      x: (pageW - drawW) / 2,
      y: (pageH - drawH) / 2,
      width: drawW,
      height: drawH,
    })

    opts.onProgress?.((i + 1) / files.length)
  }

  doc.setProducer('PDF Tools')
  doc.setCreator('PDF Tools — images to PDF')
  return doc.save({ useObjectStreams: true })
}

/* ----------------------------------------------------------- DOCX → PDF */

export type PageLayout = 'a4' | 'letter'

export interface DocxToPdfOptions {
  layout: PageLayout
  /** Margin in millimetres. */
  marginMm: number
  onProgress?: (fraction: number) => void
}

const DOC_STYLES = `
.pt-doc{font-family:Georgia,'Times New Roman',serif;font-size:11pt;line-height:1.5;color:#111;word-wrap:break-word;}
.pt-doc p{margin:0 0 .7em;}
.pt-doc h1{font-size:20pt;margin:.5em 0 .35em;}
.pt-doc h2{font-size:16pt;margin:.5em 0 .3em;}
.pt-doc h3{font-size:13pt;margin:.5em 0 .3em;}
.pt-doc h4,.pt-doc h5,.pt-doc h6{font-size:12pt;margin:.5em 0 .3em;}
.pt-doc ul,.pt-doc ol{margin:0 0 .7em;padding-inline-start:1.6em;}
.pt-doc li{margin:.15em 0;}
.pt-doc table{border-collapse:collapse;width:100%;margin:0 0 .8em;font-size:10pt;}
.pt-doc td,.pt-doc th{border:1px solid #999;padding:4px 6px;vertical-align:top;}
.pt-doc img{max-width:100%;height:auto;}
.pt-doc blockquote{margin:0 0 .7em;padding-inline-start:1em;border-inline-start:3px solid #bbb;color:#444;}
.pt-doc pre{font-family:'Courier New',monospace;font-size:9pt;background:#f4f4f4;padding:8px;white-space:pre-wrap;}
`

export async function docxToPdf(
  file: File,
  opts: DocxToPdfOptions,
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.convertToHtml({ arrayBuffer })
  const html = result.value

  const [pageW, pageH] = PAGE_SIZES[opts.layout]
  const pageWpx = Math.round((pageW / 72) * 96)
  const pageHpx = Math.round((pageH / 72) * 96)
  const marginPx = Math.round((opts.marginMm / 25.4) * 96)
  const contentW = pageWpx - marginPx * 2
  const contentH = pageHpx - marginPx * 2

  const style = document.createElement('style')
  style.textContent = DOC_STYLES
  document.head.appendChild(style)

  const holder = document.createElement('div')
  holder.className = 'pt-doc'
  holder.style.cssText = `position:fixed;left:-20000px;top:0;width:${contentW}px;background:#fff;`
  holder.innerHTML = html || '<p></p>'
  document.body.appendChild(holder)

  try {
    await document.fonts.ready
    await nextFrame()

    const nodes = Array.from(holder.children) as HTMLElement[]
    const measured = nodes.map((node) => ({
      node,
      height: node.getBoundingClientRect().height,
      top: node.offsetTop,
    }))

    // Greedily pack blocks into pages.
    const pages: HTMLElement[][] = []
    let current: HTMLElement[] = []
    let used = 0
    for (const item of measured) {
      const margin = parseFloat(getComputedStyle(item.node).marginBottom || '0')
      const needed = item.height + margin
      if (current.length > 0 && used + needed > contentH) {
        pages.push(current)
        current = []
        used = 0
      }
      current.push(item.node)
      used += needed
      opts.onProgress?.(Math.min(0.6, used / contentH / 2))
    }
    if (current.length > 0) pages.push(current)
    if (pages.length === 0) pages.push([])

    const pdf = await PDFDocument.create()
    for (let i = 0; i < pages.length; i++) {
      const pageDiv = document.createElement('div')
      pageDiv.className = 'pt-doc'
      pageDiv.style.cssText = `width:${pageWpx}px;height:${pageHpx}px;padding:${marginPx}px;box-sizing:border-box;background:#fff;overflow:hidden;position:relative;`

      for (const node of pages[i]) {
        const clone = node.cloneNode(true) as HTMLElement
        clone.style.marginTop = '0'
        pageDiv.appendChild(clone)
      }

      document.body.appendChild(pageDiv)
      const canvas = await html2canvas(pageDiv, {
        scale: 2,
        backgroundColor: '#ffffff',
        width: pageWpx,
        height: pageHpx,
        windowWidth: pageWpx,
        windowHeight: pageHpx,
        useCORS: true,
      })
      pageDiv.remove()

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/jpeg', 0.92),
      )
      const jpeg = new Uint8Array(await blob.arrayBuffer())
      const image = await pdf.embedJpg(jpeg)
      const page = pdf.addPage([pageW, pageH])
      page.drawImage(image, { x: 0, y: 0, width: pageW, height: pageH })

      opts.onProgress?.(0.6 + ((i + 1) / pages.length) * 0.4)
      await nextFrame()
    }

    pdf.setProducer('PDF Tools')
    pdf.setCreator('PDF Tools — Word to PDF')
    return await pdf.save({ useObjectStreams: true })
  } finally {
    holder.remove()
    style.remove()
  }
}

/** Convenience wrapper used by the tool page to keep pdf.js typing in one place. */
export async function loadForConversion(bytes: Uint8Array): Promise<PdfDoc> {
  return openPdf(bytes)
}
