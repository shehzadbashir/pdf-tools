import JSZip from 'jszip'

/** Characters that are invalid in file names on common platforms: \ / : * ? " < > | */
const ILLEGAL_NAME_CHARS = new Set([
  '<',
  '>',
  ':',
  '/',
  String.fromCharCode(92),
  '*',
  '?',
  '|',
  String.fromCharCode(34),
])

export function formatBytes(bytes: number, digits = 1): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(value >= 100 ? 0 : digits)} ${units[unit]}`
}

export function baseName(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(0, dot) : name
}

export function extension(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
}

export function withExtension(name: string, ext: string): string {
  return `${baseName(name)}.${ext}`
}

export function uniqueName(name: string, taken: Iterable<string>): string {
  const set = new Set(taken)
  if (!set.has(name)) return name
  const ext = extension(name)
  const stem = ext ? baseName(name) : name
  let i = 2
  while (set.has(ext ? `${stem}-${i}.${ext}` : `${stem}-${i}`)) i++
  return ext ? `${stem}-${i}.${ext}` : `${stem}-${i}`
}

export function sanitizeFilename(name: string): string {
  let out = ''
  for (const ch of name) {
    const code = ch.charCodeAt(0)
    out += code < 32 || ILLEGAL_NAME_CHARS.has(ch) ? '_' : ch
  }
  return out.trim() || 'file'
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = sanitizeFilename(filename)
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 15_000)
}

export function downloadBytes(bytes: Uint8Array, filename: string, mime = 'application/pdf'): void {
  const copy = new Uint8Array(bytes.length)
  copy.set(bytes)
  downloadBlob(new Blob([copy], { type: mime }), filename)
}

export interface ZipEntry {
  name: string
  data: Blob | Uint8Array | string
}

export async function downloadZip(entries: ZipEntry[], zipName: string): Promise<void> {
  const zip = new JSZip()
  const used = new Set<string>()
  for (const entry of entries) {
    const name = uniqueName(sanitizeFilename(entry.name), used)
    used.add(name)
    zip.file(name, entry.data)
  }
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  downloadBlob(blob, zipName)
}

export async function readAsArrayBuffer(file: Blob): Promise<ArrayBuffer> {
  return file.arrayBuffer()
}

export function isPdf(file: File): boolean {
  if (file.type === 'application/pdf') return true
  return extension(file.name) === 'pdf'
}

/** Parses "1-3, 4, 6-8" into sorted unique 1-based page numbers. */
export function parsePageRanges(input: string, maxPage: number): number[] | null {
  const out = new Set<number>()
  const parts = input
    .split(/[,;\n]+/)
    .map((p) => p.trim())
    .filter(Boolean)

  if (parts.length === 0) return null

  for (const part of parts) {
    const match = part.match(/^(\d+)(?:\s*[-–]\s*(\d+))?$/)
    if (!match) return null
    const from = Number(match[1])
    const to = match[2] ? Number(match[2]) : from
    if (from < 1 || to < from || from > maxPage || to > maxPage) return null
    for (let p = from; p <= to; p++) out.add(p)
  }
  return [...out].sort((a, b) => a - b)
}

/** Lets the browser paint between heavy synchronous chunks. */
export function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}
