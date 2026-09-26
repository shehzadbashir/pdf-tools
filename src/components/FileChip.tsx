import type { ReactNode } from 'react'
import { FileText, X } from 'lucide-react'
import { formatBytes } from '@/lib/files'

export function FileChip({
  file,
  onRemove,
}: {
  file: File
  onRemove?: () => void
}): ReactNode {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3.5 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-500/10 text-brand-600">
          <FileText size={15} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-[var(--ink)]">{file.name}</span>
          <span className="block text-xs text-[var(--ink-2)]">{formatBytes(file.size)}</span>
        </span>
      </div>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[var(--ink-2)] transition hover:bg-red-500/10 hover:text-red-500"
          aria-label="Remove"
        >
          <X size={15} />
        </button>
      ) : null}
    </div>
  )
}
