import { PDFDocument } from 'pdf-lib'
import { openPdf, renderPage } from './pdfjs'

export type CompressionLevel = 'light' | 'balanced' | 'strong'

export interface CompressOptions {
  level: CompressionLevel
  /** Rebuild pages as JPEG images — the only way to shrink image-heavy scans a lot. */
  rasterise: boolean
  /** JPEG quality used when rasterising, 0.3 – 0.95. */
  quality: number
  /** Render resolution used when rasterising. */
  dpi: number
  onProgress?: (fraction: number) => void
}

export type CompressStrategy = 'objects' | 'raster' | 'original'

export interface CompressOutcome {
  bytes: Uint8Array
  originalSize: number
  outputSize: number
  strategy: CompressStrategy
  savedBytes: number
  savedPercent: number
}

export const LEVEL_PRESETS: Record<
  CompressionLevel,
  { rasterise: boolean; quality: number; dpi: number }
> = {
  light: { rasterise: false, quality: 0.78, dpi: 160 },
  balanced: { rasterise: true, quality: 0.6, dpi: 130 },
  strong: { rasterise: true, quality: 0.42, dpi: 100 },
}

/** Re-saves the document with compressed object streams and no stray metadata. */
async function compressObjectStreams(bytes: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: false })
  doc.setProducer('PDF Tools')
  doc.setModificationDate(new Date())
  return doc.save({ useObjectStreams: true, addDefaultPage: false })
}

/** Renders every page to JPEG and rebuilds the file from those images. */
async function compressRaster(
  bytes: Uint8Array,
  dpi: number,
  quality: number,
  onProgress?: (fraction: number) => void,
): Promise<Uint8Array> {
  const src = await openPdf(bytes)
  const out = await PDFDocument.create()
  const total = src.numPages

  for (let i = 1; i <= total; i++) {
    const page = await src.getPage(i)
    const base = page.getViewport({ scale: 1 })
    const canvas = await renderPage(src, i, { dpi })

    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Image encoding failed'))),
        'image/jpeg',
        quality,
      ),
    )
    const jpeg = new Uint8Array(await blob.arrayBuffer())

    const pdfPage = out.addPage([base.width, base.height])
    const image = await out.embedJpg(jpeg)
    pdfPage.drawImage(image, { x: 0, y: 0, width: base.width, height: base.height })

    page.cleanup()
    onProgress?.(i / total)
  }

  out.setProducer('PDF Tools')
  out.setCreator('PDF Tools — compress')
  return out.save({ useObjectStreams: true })
}

export async function compressPdf(
  bytes: Uint8Array,
  opts: CompressOptions,
): Promise<CompressOutcome> {
  const originalSize = bytes.length
  const candidates: { bytes: Uint8Array; strategy: CompressStrategy }[] = []

  const push = async (run: () => Promise<Uint8Array>, strategy: CompressStrategy) => {
    try {
      const result = await run()
      if (result.length > 0) candidates.push({ bytes: result, strategy })
    } catch (err) {
      // A single failing strategy must not kill the whole job — the other one
      // may still produce a smaller file.
      console.warn(`compression strategy "${strategy}" failed`, err)
    }
  }

  await push(() => compressObjectStreams(bytes), 'objects')

  if (opts.rasterise) {
    await push(() => compressRaster(bytes, opts.dpi, opts.quality, opts.onProgress), 'raster')
  }

  let best = { bytes, strategy: 'original' as CompressStrategy, size: originalSize }
  for (const candidate of candidates) {
    if (candidate.bytes.length < best.size) {
      best = { bytes: candidate.bytes, strategy: candidate.strategy, size: candidate.bytes.length }
    }
  }

  const savedBytes = originalSize - best.size
  return {
    bytes: best.bytes,
    originalSize,
    outputSize: best.size,
    strategy: best.strategy,
    savedBytes: Math.max(0, savedBytes),
    savedPercent: originalSize > 0 ? (savedBytes / originalSize) * 100 : 0,
  }
}
