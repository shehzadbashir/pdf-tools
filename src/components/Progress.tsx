import type { ReactNode } from 'react'

export function ProgressBar({
  value,
  label,
}: {
  /** 0–1, or undefined for an indeterminate bar. */
  value?: number
  label?: string
}): ReactNode {
  const indeterminate = value === undefined || Number.isNaN(value)
  const percent = indeterminate ? 100 : Math.round(Math.min(1, Math.max(0, value)) * 100)

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3.5">
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-[var(--ink)]">{label}</span>
        <span className="tabular-nums text-[var(--ink-2)]">
          {indeterminate ? '' : `${percent}%`}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div
          className={`h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-[width] duration-200 ${
            indeterminate ? 'w-1/3 animate-pulse' : ''
          }`}
          style={indeterminate ? undefined : { width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
