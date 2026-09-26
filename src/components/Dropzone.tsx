import { useCallback, useRef, useState, type DragEvent, type ReactNode } from 'react'
import { FileUp } from 'lucide-react'

interface DropzoneProps {
  accept?: string
  multiple?: boolean
  onFiles: (files: File[]) => void
  title: string
  subtitle?: string
  icon?: ReactNode
  disabled?: boolean
}

export function Dropzone({
  accept,
  multiple = false,
  onFiles,
  title,
  subtitle,
  icon,
  disabled = false,
}: DropzoneProps): ReactNode {
  const inputRef = useRef<HTMLInputElement>(null)
  const [active, setActive] = useState(false)
  const dragDepth = useRef(0)

  const emit = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return
      const files = Array.from(list)
      onFiles(multiple ? files : files.slice(0, 1))
    },
    [multiple, onFiles],
  )

  const onDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault()
    dragDepth.current = 0
    setActive(false)
    if (disabled) return
    emit(event.dataTransfer.files)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
      data-active={active}
      className="dropzone flex cursor-pointer flex-col items-center justify-center gap-2 px-6 py-12 text-center outline-none"
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(event) => {
        if (disabled) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          inputRef.current?.click()
        }
      }}
      onDragEnter={(event) => {
        event.preventDefault()
        if (disabled) return
        dragDepth.current += 1
        setActive(true)
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        event.preventDefault()
        dragDepth.current -= 1
        if (dragDepth.current <= 0) {
          dragDepth.current = 0
          setActive(false)
        }
      }}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => {
          emit(event.target.files)
          event.target.value = ''
        }}
      />

      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/10 text-brand-600">
        {icon ?? <FileUp size={24} />}
      </span>
      <span className="text-base font-semibold text-[var(--ink)]">{title}</span>
      {subtitle ? <span className="text-sm text-[var(--ink-2)]">{subtitle}</span> : null}
      <span className="chip mt-1">PNG · JPG · PDF · DOCX</span>
    </div>
  )
}
