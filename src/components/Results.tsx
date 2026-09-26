import { useCallback, useState, type ReactNode } from 'react'
import { CheckCircle2, Download, RotateCcw, FileArchive } from 'lucide-react'
import { downloadBlob, downloadBytes, downloadZip, formatBytes } from '@/lib/files'

export interface OutputFile {
  name: string
  data: Blob | Uint8Array
  size?: number
  mime?: string
}

function sizeOf(file: OutputFile): number {
  if (file.size !== undefined) return file.size
  return file.data instanceof Blob ? file.data.size : file.data.length
}

function save(file: OutputFile): void {
  if (file.data instanceof Blob) {
    downloadBlob(file.data, file.name)
  } else {
    downloadBytes(file.data, file.name, file.mime ?? 'application/pdf')
  }
}

interface ResultsProps {
  files: OutputFile[]
  onReset?: () => void
  resetLabel?: string
  summary?: ReactNode
  children?: ReactNode
}

export function Results({
  files,
  onReset,
  resetLabel = 'Start over',
  summary,
  children,
}: ResultsProps): ReactNode {
  const [zipBusy, setZipBusy] = useState(false)

  const downloadAll = useCallback(async () => {
    setZipBusy(true)
    try {
      await downloadZip(
        files.map((file) => ({
          name: file.name,
          data:
            file.data instanceof Blob
              ? file.data
              : new Blob([new Uint8Array(file.data).buffer], {
                  type: file.mime ?? 'application/octet-stream',
                }),
        })),
        'pdf-tools-output.zip',
      )
    } finally {
      setZipBusy(false)
    }
  }, [files])

  if (files.length === 0) return null

  const total = files.reduce((sum, file) => sum + sizeOf(file), 0)

  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-500/20 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={17} />
          {summary ?? `Ready — ${formatBytes(total)}`}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {files.length > 1 ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => void downloadAll()}
              disabled={zipBusy}
            >
              <FileArchive size={15} />
              ZIP
            </button>
          ) : null}
          {onReset ? (
            <button type="button" className="btn btn-ghost" onClick={onReset}>
              <RotateCcw size={15} />
              {resetLabel}
            </button>
          ) : null}
        </div>
      </div>

      <ul className="divide-y divide-[var(--line)]">
        {files.map((file, index) => (
          <li
            key={`${file.name}-${index}`}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--ink)]">{file.name}</p>
              <p className="text-xs text-[var(--ink-2)]">{formatBytes(sizeOf(file))}</p>
            </div>
            <button type="button" className="btn btn-primary" onClick={() => save(file)}>
              <Download size={15} />
              Download
            </button>
          </li>
        ))}
      </ul>

      {children}
    </div>
  )
}
