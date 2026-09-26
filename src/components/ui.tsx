import { useId, type ReactNode } from 'react'

export function Field({
  label,
  hint,
  children,
  className = '',
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}): ReactNode {
  const id = useId()
  return (
    <div className={className}>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <div id={id}>{children}</div>
      {hint ? <p className="mt-1 text-xs text-[var(--ink-2)]">{hint}</p> : null}
    </div>
  )
}

export function ErrorBox({ children }: { children: ReactNode }): ReactNode {
  if (!children) return null
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-300"
    >
      {children}
    </div>
  )
}

export function Notice({ children }: { children: ReactNode }): ReactNode {
  if (!children) return null
  return (
    <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-700 dark:text-amber-300">
      {children}
    </div>
  )
}

export function SectionTitle({ children }: { children: ReactNode }): ReactNode {
  return (
    <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--ink-2)]">
      {children}
    </h3>
  )
}

export function RadioGroup<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string
  value: T
  options: { value: T; label: string; description?: string }[]
  onChange: (value: T) => void
}): ReactNode {
  return (
    <div className="grid gap-2">
      {options.map((option) => {
        const active = option.value === value
        return (
          <label
            key={option.value}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 transition ${
              active
                ? 'border-brand-500 bg-brand-500/5'
                : 'border-[var(--line)] hover:border-brand-400/60'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={active}
              onChange={() => onChange(option.value)}
              className="mt-1 accent-[var(--color-brand-600)]"
            />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-[var(--ink)]">{option.label}</span>
              {option.description ? (
                <span className="mt-0.5 block text-xs leading-relaxed text-[var(--ink-2)]">
                  {option.description}
                </span>
              ) : null}
            </span>
          </label>
        )
      })}
    </div>
  )
}

export function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (next: boolean) => void
}): ReactNode {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-[var(--ink)] hover:bg-[var(--surface-2)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-[var(--color-brand-600)]"
      />
      {label}
    </label>
  )
}

export function RangeRow({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  onChange: (value: number) => void
}): ReactNode {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--ink-2)]">{label}</span>
        <span className="text-xs font-bold tabular-nums text-brand-600">
          {value}
          {suffix ?? ''}
        </span>
      </div>
      <input
        type="range"
        className="w-full accent-[var(--color-brand-600)]"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  )
}
